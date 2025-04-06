import os
from rest_framework import parsers, status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from ..models import Recording
from .serializers import RecordingSerializer
from patientManagement.models import Patient
from providerManagement.models import Provider, ProviderPatientConnection
from rest_framework_simplejwt.authentication import JWTAuthentication

class RecordingViewSet(ModelViewSet):
    queryset = Recording.objects.all()
    serializer_class = RecordingSerializer
    
    # Add JWT authentication
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    # Support parsing form data and file uploads
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    
    def perform_create(self, serializer):
        """Save the recording, optionally associating with the current user."""
        serializer.save()
    
    @action(detail=False, methods=['post'], url_path='upload')
    def upload_recording(self, request):
        """Custom action for direct file upload without other form fields."""
        # Check if user is authenticated (JWT is valid)
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
        audio_file = request.FILES.get('file')
        
        if not audio_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check file size
        if audio_file.size > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
            return Response(
                {'error': f'File too large. Max size is {settings.FILE_UPLOAD_MAX_MEMORY_SIZE / 1024 / 1024}MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check file type
        content_type = audio_file.content_type
        if hasattr(settings, 'ALLOWED_AUDIO_FORMATS') and content_type not in settings.ALLOWED_AUDIO_FORMATS:
            return Response(
                {'error': f'File type {content_type} not allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for patient_id in request data
        patient = None
        patient_id = request.data.get('patient_id')
        if patient_id:
            try:
                patient_id = int(patient_id)
                try:
                    patient = Patient.objects.get(id=patient_id)
                    
                    # If the request comes from a provider (not a patient), verify connection
                    if hasattr(request.user, 'provider'):
                        try:
                            provider = Provider.objects.get(user=request.user)
                            # Check if the provider is connected to this patient
                            connection_exists = ProviderPatientConnection.objects.filter(
                                provider=provider, 
                                patient=patient
                            ).exists()
                            
                            if not connection_exists:
                                return Response(
                                    {"error": "You are not authorized to upload recordings for this patient"}, 
                                    status=status.HTTP_403_FORBIDDEN
                                )
                        except Provider.DoesNotExist:
                            pass  # Skip if user is not a provider
                            
                except Patient.DoesNotExist:
                    return Response(
                        {"error": f"Patient with id {patient_id} does not exist"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": f"Invalid patient_id format: {patient_id}. Must be an integer."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # If no patient_id is provided and the user is a patient, associate with their record
            if hasattr(request.user, 'patient'):
                try:
                    patient = Patient.objects.get(user=request.user)
                except Patient.DoesNotExist:
                    pass  # Skip if user's patient profile doesn't exist
        
        # Create the recording with metadata
        try:
            recording = Recording.objects.create(
                patient=patient,
                audio_file=audio_file,
                title=request.data.get('title', os.path.splitext(audio_file.name)[0]),  # Use filename as title if not provided
                description=request.data.get('description', ''),
                file_size=audio_file.size,
                file_type=content_type,
                # Store the user who uploaded the recording
                #uploaded_by=request.user
            )
            
            serializer = self.get_serializer(recording)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": f"Error processing request: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['GET'])
    def by_patient(self, request):
        """Get recordings for a specific patient"""
        # Check if user is authenticated (JWT is valid)
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            # If no patient_id is provided but user is a patient, show their recordings
            if hasattr(request.user, 'patient'):
                try:
                    patient = Patient.objects.get(user=request.user)
                    patient_id = patient.id
                except Patient.DoesNotExist:
                    return Response(
                        {"error": "Patient profile not found"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {"error": "patient_id query parameter is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            # Check if the user is authorized to access these recordings
            if hasattr(request.user, 'provider'):
                # For providers, verify they're connected to this patient
                provider = Provider.objects.get(user=request.user)
                connection_exists = ProviderPatientConnection.objects.filter(
                    provider=provider,
                    patient_id=patient_id
                ).exists()
                
                if not connection_exists:
                    return Response(
                        {"error": "You are not authorized to view recordings for this patient"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif hasattr(request.user, 'patient'):
                # For patients, verify they're accessing their own recordings
                patient = Patient.objects.get(user=request.user)
                if str(patient.id) != str(patient_id):
                    return Response(
                        {"error": "You can only view your own recordings"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            recordings = Recording.objects.filter(patient_id=patient_id)
            serializer = self.get_serializer(recordings, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=False, methods=['GET'])
    def provider_patients(self, request):
        """Get recordings for all patients connected to a provider"""
        # Check if user is authenticated (JWT is valid)
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # If user is a provider, use their ID automatically
        provider = None
        provider_id = request.query_params.get('provider_id')
        
        if not provider_id and hasattr(request.user, 'provider'):
            try:
                provider = Provider.objects.get(user=request.user)
                provider_id = provider.id
            except Provider.DoesNotExist:
                return Response(
                    {"error": "Provider profile not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        if not provider_id:
            return Response(
                {"error": "provider_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # If provider_id is specified but different from authenticated user, verify permissions
        if hasattr(request.user, 'provider') and provider is None:
            try:
                user_provider = Provider.objects.get(user=request.user)
                if str(user_provider.id) != str(provider_id):
                    # Only admins should be able to access other providers' patients
                    if not request.user.is_staff:
                        return Response(
                            {"error": "You can only view recordings for your own patients"}, 
                            status=status.HTTP_403_FORBIDDEN
                        )
            except Provider.DoesNotExist:
                pass
        
        try:
            # Get all patients connected to this provider
            provider_id = int(provider_id)
            patient_connections = ProviderPatientConnection.objects.filter(provider_id=provider_id)
            patient_ids = [conn.patient_id for conn in patient_connections]
            
            # Get recordings for these patients
            recordings = Recording.objects.filter(patient_id__in=patient_ids).select_related('patient')
            serializer = self.get_serializer(recordings, many=True)
            
            # Group recordings by patient
            result = {}
            for recording in recordings:
                patient_id = recording.patient_id
                patient_name = f"{recording.patient.firstName} {recording.patient.lastName}"
                
                if patient_id not in result:
                    result[patient_id] = {
                        'patient_id': patient_id,
                        'patient_name': patient_name,
                        'recordings': []
                    }
                
                result[patient_id]['recordings'].append(serializer.to_representation(recording))
            
            return Response(list(result.values()))
        except ValueError:
            return Response(
                {"error": f"Invalid provider_id format: {provider_id}. Must be an integer."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": f"Error processing request: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )