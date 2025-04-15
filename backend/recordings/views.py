import os
from django.utils.timezone import now
from rest_framework import parsers, status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from .models import Recording, RecordingRequest
from .serializers import RecordingSerializer, RecordingRequestSerializer, RecordingRequestListSerializer
from patientManagement.models import Patient
from providerManagement.models import Provider, ProviderPatientConnection
from rest_framework_simplejwt.authentication import JWTAuthentication

import logging
import traceback

logger = logging.getLogger(__name__)

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
        # Check if user is authenticated
        if not request.user.is_authenticated:
            logger.warning("Unauthenticated request to by_patient")
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            patient = Patient.objects.get(user=request.user)
            patient_id = patient.id
            logger.info(f"Patient found: {patient_id}")
        except Patient.DoesNotExist:
            logger.error(f"No patient profile found for user: {request.user}")
            return Response(
                {"error": "Patient profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error while retrieving patient: {e}")
            logger.debug(traceback.format_exc())
            return Response(
                {"error": "Internal server error retrieving patient"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            recordings = Recording.objects.filter(patient_id=patient_id)
            logger.info(f"Found {recordings.count()} recordings for patient {patient_id}")
            serializer = self.get_serializer(recordings, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error while retrieving or serializing recordings: {e}")
            logger.debug(traceback.format_exc())
            return Response(
                {"error": "Internal server error retrieving recordings"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
                
    @action(detail=False, methods=['GET'], url_path='provider-patient-recordings')
    def provider_patients(self, request):
        """Get previous recordings of a specific patient connected to the provider"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        patient_id = request.query_params.get('patient_id')
        
        if not patient_id:
            return Response({'error': 'patient_id query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient_id = int(patient_id)
            patient = Patient.objects.get(id=patient_id)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid patient_id format. Must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)
        except Patient.DoesNotExist:
            return Response({'error': f'Patient with id {patient_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Determine the provider from the authenticated user
            provider = Provider.objects.get(user=request.user)
        except Provider.DoesNotExist:
            return Response({'error': 'Provider profile not found for this user'}, status=status.HTTP_403_FORBIDDEN)

        # Verify that the provider is connected to the patient
        connection_exists = ProviderPatientConnection.objects.filter(
            provider=provider,
            patient=patient
        ).exists()

        if not connection_exists:
            return Response(
                {'error': 'You are not authorized to access this patient’s recordings'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get recordings for this patient
        recordings = Recording.objects.filter(patient=patient).order_by('-created_at')  # Optionally order by latest
        serializer = self.get_serializer(recordings, many=True)
        return Response(serializer.data)

            
    @action(detail=True, methods=['POST'], url_path='complete-request')
    def complete_request(self, request, pk=None):
        """Mark a recording as fulfilling a request."""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            recording = self.get_object()
            request_id = request.data.get('request_id')
            
            if not request_id:
                return Response({'error': 'request_id is required'}, status=status.HTTP_400_BAD_REQUEST)
                
            try:
                recording_request = RecordingRequest.objects.get(id=request_id)
                
                # Check permissions
                if hasattr(request.user, 'patient'):
                    patient = Patient.objects.get(user=request.user)
                    if recording_request.patient.id != patient.id:
                        return Response(
                            {"error": "You can only complete your own recording requests"}, 
                            status=status.HTTP_403_FORBIDDEN
                        )
                
                # Link recording to request and mark as completed
                recording_request.recording = recording
                recording_request.status = 'completed'
                recording_request.response_date = timezone.now()
                recording_request.save()
                
                return Response({'status': 'Recording request completed'})
                
            except RecordingRequest.DoesNotExist:
                return Response(
                    {"error": f"Recording request with id {request_id} does not exist"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recording_requests_by_patient(request, patient_id):
    try:
        # Retrieve all recording requests for the given patient
        requests = RecordingRequest.objects.filter(patient__id=patient_id)

        # Manually construct the response data
        request_data = []
        for req in requests:
            request_data.append({
                "id": req.id,
                "title": req.title,
                "description": req.description,
                "issue_date": req.issue_date,
                "response_date": req.response_date,
                "provider": req.provider.id,
                "patient": req.patient.id,
                "status": req.status,
                "recording_id": req.recording.id if req.recording else None
            })
        
        return Response(request_data, status=status.HTTP_200_OK)

    except Patient.DoesNotExist:
        return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recording_requests_by_authenticated_patient(request):
    try:
        # Get the patient associated with the currently authenticated user
        patient = Patient.objects.get(user=request.user)

        # Retrieve all recording requests for the patient
        requests = RecordingRequest.objects.filter(patient=patient)

        request_data = []
        for req in requests:
            request_data.append({
                "id": req.id,
                "title": req.title,
                "description": req.description,
                "issue_date": req.issue_date,
                "response_date": req.response_date,
                "status": req.status,
                "provider": req.provider.id,
                "patient": req.patient.id,
                "recording_id": req.recording.id if req.recording else None
            })

        return Response(request_data, status=status.HTTP_200_OK)

    except Patient.DoesNotExist:
        return Response({"error": "No patient profile found for this user"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_recording_request(request):
    try:
        provider = Provider.objects.get(user=request.user)
        patient_id = request.data.get('patient_id')
        patient = Patient.objects.get(id=patient_id)

        title = request.data.get('title', 'Untitled Recording Request')
        description = request.data.get('description', '')

        # Create the RecordingRequest
        recording_request = RecordingRequest.objects.create(
            title=title,
            description=description,
            patient=patient,
            provider=provider,
            status='sent'
        )

        return Response({
            'message': 'Recording request created successfully',
            'id': recording_request.id
        }, status=status.HTTP_201_CREATED)

    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
    except Provider.DoesNotExist:
        return Response({'error': 'Provider not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print("Recording request creation error:", e)
        return Response({'error': 'Something went wrong'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)