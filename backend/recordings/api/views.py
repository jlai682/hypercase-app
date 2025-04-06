import os
from rest_framework import parsers, status
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from ..models import Recording
from .serializers import RecordingSerializer
from patientManagement.models import Patient
from providerManagement.models import Provider, ProviderPatientConnection

class RecordingViewSet(ModelViewSet):
    queryset = Recording.objects.all()
    serializer_class = RecordingSerializer
    
    # Support parsing form data and file uploads
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    
    def perform_create(self, serializer):
        """Save the recording, optionally associating with the current user."""
        serializer.save()
    
    @action(detail=False, methods=['post'], url_path='upload')
    def upload_recording(self, request):
        """Custom action for direct file upload without other form fields."""
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
        
        # Create the recording with metadata
        try:
            recording = Recording.objects.create(
                patient=patient,
                audio_file=audio_file,
                title=request.data.get('title', os.path.splitext(audio_file.name)[0]),  # Use filename as title if not provided
                description=request.data.get('description', ''),
                file_size=audio_file.size,
                file_type=content_type
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
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response(
                {"error": "patient_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
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
        provider_id = request.query_params.get('provider_id')
        if not provider_id:
            return Response(
                {"error": "provider_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
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