from django.contrib.auth import authenticate
from .models import Provider, ProviderPatientConnection
from .forms import ProviderForm, UserForm
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from patientManagement.models import Patient


@api_view(['POST'])
@permission_classes([AllowAny])
def providerRegister(request):
    try:
        data = request.data
        
        required_fields = ['email', 'password', 'firstName', 'lastName']
        for field in required_fields:
            if field not in data or not data[field]:
                return Response(
                    {'error': f'{field} is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        if '@' not in data['email']:
            return Response(
                {'error': 'Please enter a valid email address'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        data['username'] = data['email']

        user_form = UserForm(data)
        provider_form = ProviderForm(data)

        if user_form.is_valid() and provider_form.is_valid():
            user = user_form.save(commit=False)
            user.set_password(user_form.cleaned_data['password'])
            user.save()

            provider = provider_form.save(commit=False)
            provider.user = user
            provider.save()

            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Registration successful',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'provider_id': provider.id,
                'firstName': provider.firstName,
                'lastName': provider.lastName,
                'email': user.email
            }, status=status.HTTP_201_CREATED)

        return Response({
            'error': 'Invalid form data',
            'details': {
                'user_form_errors': user_form.errors,
                'provider_form_errors': provider_form.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def provider_login(request):
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if '@' not in email:
            return Response(
                {'error': 'Please enter a valid email address'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=email, password=password)

        if user is not None:
            try:
                provider = Provider.objects.get(user=user)
                refresh = RefreshToken.for_user(user)

                return Response({
                    'message': 'Login successful',
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'provider_id': provider.id,
                    'firstName': provider.firstName,
                    'lastName': provider.lastName,
                    'email': user.email
                }, status=status.HTTP_200_OK)
            
            except Provider.DoesNotExist:
                return Response(
                    {'error': 'Provider profile not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_patient_by_email(request):
    try:
        data = request.data
        email = data.get('email')

        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        patient = Patient.search_by_email(email)

        if patient:
            patient_data = {
                'id': patient.id,
                'firstName': patient.firstName,
                'lastName': patient.lastName,
                'age': patient.age,
                'medical_history': patient.medical_history,
                'address': patient.address,
                'phone_number': patient.phone_number,
                'email': patient.user.email  # ✅ Fixed
            }
            return Response({'patient': patient_data}, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Patient not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_provider_to_patient(request):
    try:
        data = request.data
        patient_email = data.get('patient_email')

        if not patient_email:
            return Response(
                {'error': 'Patient email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            provider = Provider.objects.get(user=request.user)
        except Provider.DoesNotExist:
            return Response(
                {'error': 'Provider not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            patient = Patient.objects.get(user__email=patient_email)  
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if patient is already connected to a provider
        existing_connection = ProviderPatientConnection.objects.filter(patient=patient).first()

        if existing_connection:
            # Check if already connected to current provider
            if existing_connection.provider.id == provider.id:
                return Response(
                    {'error': 'You are already connected to this patient'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Patient is connected to a different provider
            else:
                return Response(
                    {'error': 'This patient is already connected to another provider'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Create new connection only if no existing connection exists
        connection = ProviderPatientConnection.objects.create(
            provider=provider,
            patient=patient
        )

        return Response(
            {'message': 'Connection created successfully'},
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_provider_patient_connections(request):
    try:
        provider = Provider.objects.get(user=request.user)
        connections = ProviderPatientConnection.objects.filter(provider=provider)

        connection_data = [
            {
                "patient": {
                    "id": connection.patient.id,
                    "email": connection.patient.user.email,  # ✅ Fixed
                    "firstName": connection.patient.firstName,
                    "lastName": connection.patient.lastName,
                },
                "connected_on": connection.connected_on.isoformat()
            }
            for connection in connections
        ]
        
        return Response({"patients": connection_data}, status=status.HTTP_200_OK)

    except Provider.DoesNotExist:
        return Response(
            {"error": "Provider not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_provider_info(request):
    try:
        provider = Provider.objects.get(user=request.user)

        provider_info = {
            "id": provider.id,
            "firstName": provider.firstName,
            "lastName": provider.lastName,
            "email": provider.user.email,
            "phone_number": provider.phone_number,
        }

        return Response({"provider": provider_info}, status=status.HTTP_200_OK)

    except Provider.DoesNotExist:
        return Response(
            {"error": "Provider not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_provider_by_patient(request):
    try:
        try:
            patient = Patient.objects.get(user=request.user)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        connection = ProviderPatientConnection.objects.filter(patient=patient).first()

        if not connection:
            return Response(
                {'message': 'No provider connected', 'provider': None}, 
                status=status.HTTP_200_OK
            )

        provider = connection.provider
        provider_data = {
            "id": provider.id,
            "firstName": provider.firstName,
            "lastName": provider.lastName,
            "email": provider.user.email,
        }

        return Response({"provider": provider_data}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)