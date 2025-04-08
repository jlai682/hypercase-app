# Import necessary Django utilities
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from .models import Provider, ProviderPatientConnection
from .forms import ProviderForm, UserForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from django.contrib.auth.models import User

# Import JWT and DRF authentication tools
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

# Import the Patient model from the patientManagement app
from patientManagement.models import Patient

# Handles provider registration
@csrf_exempt
def providerRegister(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))  # Parse incoming JSON data
            print("Received data:", data)

            # Ensure required fields are present
            required_fields = ['email', 'password', 'firstName', 'lastName']
            for field in required_fields:
                if field not in data or not data[field]:
                    return JsonResponse({'error': f'{field} is required'}, status=400)

            data['username'] = data['email']  # Set username to email for authentication

            # Initialize forms with incoming data
            user_form = UserForm(data)
            provider_form = ProviderForm(data)

            if user_form.is_valid() and provider_form.is_valid():
                # Save user to the auth system
                user = user_form.save(commit=False)
                user.set_password(user_form.cleaned_data['password'])  # Hash password
                user.save()

                # Save provider-specific info
                provider = provider_form.save(commit=False)
                provider.user = user
                provider.save()

                # Generate JWT token pair
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token

                return JsonResponse({
                    'message': 'Registration successful',
                    'access': str(access_token),
                    'refresh': str(refresh)
                }, status=201)

            # If forms are invalid, return errors
            error_details = {
                'user_form_errors': user_form.errors,
                'patient_form_errors': provider_form.errors
            }
            return JsonResponse({'error': 'Invalid form data', 'details': error_details}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

# Handles provider login
@csrf_exempt
def provider_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return JsonResponse({'error': 'Email and password are required'}, status=400)

            user = authenticate(request, username=email, password=password)

            if user is not None:
                login(request, user)  # Django login to initialize session (optional)

                # Generate JWT token pair
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token

                return JsonResponse({
                    'access': str(access_token),
                    'refresh': str(refresh),
                    'message': 'Login successful'
                }, status=200)
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

# Authenticated endpoint to search for a patient by email
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_patient_by_email(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')

            if not email:
                return JsonResponse({'error': 'Email is required'}, status=400)

            patient = Patient.search_by_email(email)  # Custom method to find patient

            if patient:
                # Only return specific patient fields
                patient_data = {
                    'id': patient.id,
                    'firstName': patient.firstName,
                    'lastName': patient.lastName,
                    'age': patient.age,
                    'medical_history': patient.medical_history,
                    'address': patient.address,
                    'phone_number': patient.phone_number,
                    'email': patient.email
                }
                return JsonResponse({'patient': patient_data}, status=200)
            else:
                return JsonResponse({'error': 'Patient not found'}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

# Connects an authenticated provider to a patient by email
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_provider_to_patient(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            provider_user = request.user  # Authenticated provider
            patient_email = data.get('patient_email')

            if not patient_email:
                return JsonResponse({'error': 'Patient email is required'}, status=400)

            provider = Provider.objects.get(user=provider_user)
            patient = Patient.objects.get(email=patient_email)

            # Avoid duplicate connections using get_or_create
            connection, created = ProviderPatientConnection.objects.get_or_create(
                provider=provider, patient=patient
            )

            if created:
                return JsonResponse({'message': 'Connection created successfully'}, status=201)
            else:
                return JsonResponse({'message': 'Connection already exists'}, status=200)

        except Provider.DoesNotExist:
            return JsonResponse({'error': 'Provider not found'}, status=404)
        except Patient.DoesNotExist:
            return JsonResponse({'error': 'Patient not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

# Returns all patients connected to the authenticated provider
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_provider_patient_connections(request):
    if request.method == "GET":
        try:
            if not request.user.is_authenticated:
                return JsonResponse({"error": "User is not authenticated"}, status=401)

            provider_user = request.user
            provider = Provider.objects.get(user=provider_user)

            connections = ProviderPatientConnection.objects.filter(provider=provider)

            # Serialize the connection data
            connection_data = [
                {
                    "patient": {
                        "email": connection.patient.email,
                        "firstName": connection.patient.firstName,
                        "lastName": connection.patient.lastName,
                    }
                }
                for connection in connections
            ]
            return JsonResponse({"patients": connection_data}, status=200)

        except Provider.DoesNotExist:
            return JsonResponse({"error": "Provider not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)

# Returns info about the currently authenticated provider
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_provider_info(request):
    if request.method == "GET":
        try:
            if not request.user.is_authenticated:
                return JsonResponse({"error": "User is not authenticated"}, status=401)

            provider_user = request.user
            provider = Provider.objects.get(user=provider_user)

            # Construct provider info dictionary
            provider_info = {
                "firstName": provider.firstName,
                "lastName": provider.lastName,
                "email": provider.user.email,
            }

            return JsonResponse({"provider": provider_info}, status=200)

        except Provider.DoesNotExist:
            return JsonResponse({"error": "Provider not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)
