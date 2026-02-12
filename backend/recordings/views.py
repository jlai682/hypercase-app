import os
import re
import logging
import traceback
from django.conf import settings
from django.utils.dateparse import parse_datetime
from django.http import StreamingHttpResponse, HttpResponse, Http404
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from rest_framework import parsers, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Recording, RecordingRequest, VoiceAnalytics
from .serializers import RecordingSerializer, RecordingRequestSerializer, RecordingRequestListSerializer, VoiceAnalyticsSerializer
from .analytics.tasks import process_voice_analytics_async
from .utils import verify_recording_token
from patientManagement.models import Patient
from providerManagement.models import Provider, ProviderPatientConnection

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser])
def upload_recording(request):
    """Upload a new audio recording linked to a patient and recording request."""
    audio_file = request.FILES.get('file')
    if not audio_file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    # Size validation
    max_size = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 10485760)
    if audio_file.size > max_size:
        max_mb = max_size / 1024 / 1024
        return Response(
            {'error': f'File too large. Maximum size is {max_mb:.1f}MB'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # MIME type validation (client-side)
    allowed_types = ['audio/', 'video/webm', 'video/mp4']
    if not any(audio_file.content_type.startswith(t) for t in allowed_types):
        return Response(
            {'error': f'Invalid file type: {audio_file.content_type}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Additional security to check mime type
    try:
        import magic
        file_content = audio_file.read(2048)  # Read first 2KB
        audio_file.seek(0)  # Reset file pointer
        
        actual_mime = magic.from_buffer(file_content, mime=True)
        if not any(actual_mime.startswith(t) for t in allowed_types):
            return Response(
                {'error': f'File content validation failed. Detected: {actual_mime}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except ImportError:
        logger.warning("python-magic not installed, skipping content validation")
    except Exception as e:
        logger.error(f"File validation error: {e}")

    # Patient resolution 
    patient_id = request.data.get('patient_id')
    if not patient_id:
        return Response(
            {'error': 'patient_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        patient = Patient.objects.get(id=int(patient_id))
    except (Patient.DoesNotExist, ValueError, TypeError):
        return Response(
            {'error': f'Patient with id {patient_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    data = {
        'patient_id': patient.id,
        'audio_file': audio_file,
        'title': request.data.get('title', audio_file.name or 'Untitled Recording'),
        'description': request.data.get('description', ''),
    }
    
    # Pass request context so serializer can handle request_id linking
    serializer = RecordingSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        recording = serializer.save()

        # Start background analytics processing (non-blocking)
        recording.analytics_status = 'pending'
        recording.save(update_fields=['analytics_status'])

        # Process in background thread
        process_voice_analytics_async(recording.id)

        logger.info(f"Started analytics processing for recording {recording.id}")

        return Response({
            **serializer.data,
            'analytics_status': 'pending',
            'message': 'Recording uploaded successfully. Analytics processing started.'
        }, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_recording_request(request, recording_id):
    """Explicitly link an existing recording to a request."""
    # Get the recording
    try:
        recording = Recording.objects.get(id=recording_id)
    except Recording.DoesNotExist:
        return Response(
            {"error": f"Recording {recording_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Verify patient owns the recording - additional security
    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response(
            {"error": "Patient profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if recording.patient_id != patient.id:
        return Response(
            {"error": "You can only link your own recordings"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get request_id from request body
    request_id = request.data.get('request_id')
    if not request_id:
        return Response(
            {'error': 'request_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get the recording request
    try:
        recording_request = RecordingRequest.objects.get(id=request_id)
    except RecordingRequest.DoesNotExist:
        return Response(
            {"error": f"Recording request {request_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Verify patient owns the request
    if recording_request.patient_id != patient.id:
        return Response(
            {"error": "You can only complete your own recording requests"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Link recording to request
    recording_request.recording = recording
    recording_request.status = 'completed'
    recording_request.response_date = timezone.now()
    recording_request.save()

    return Response({'status': 'Recording request completed'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recording_requests_by_patient(request, patient_id):
    """Only provider can get recording requests for a specific patient."""
    # Verify the requester is a provider connected to this patient
    try:
        provider = Provider.objects.get(user=request.user)
    except Provider.DoesNotExist:
        return Response(
            {"error": "Provider profile not found"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return Response(
            {"error": "Patient not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify connection
    if not ProviderPatientConnection.objects.filter(provider=provider, patient=patient).exists():
        return Response(
            {"error": "You are not authorized to view this patient's requests"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    requests = RecordingRequest.objects.filter(patient=patient).select_related('provider', 'patient', 'recording')
    serializer = RecordingRequestListSerializer(requests, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recording_requests_by_authenticated_patient(request):
    """Only authenticated patient can get recording requests."""
    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response(
            {"error": "Patient profile not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

    requests = RecordingRequest.objects.filter(patient=patient).select_related('provider', 'patient', 'recording')
    serializer = RecordingRequestListSerializer(requests, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_recording_request(request):
    """Create a new recording request from provider to patient."""
    try:
        provider = Provider.objects.get(user=request.user)
    except Provider.DoesNotExist:
        return Response(
            {'error': 'Provider profile not found'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    patient_id = request.data.get('patient_id')
    if not patient_id:
        return Response(
            {'error': 'patient_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Patient not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify connection
    if not ProviderPatientConnection.objects.filter(provider=provider, patient=patient).exists():
        return Response(
            {'error': 'You can only send requests to your connected patients'}, 
            status=status.HTTP_403_FORBIDDEN
        )

    data = {
        'title': request.data.get('title', 'Untitled Recording Request'),
        'description': request.data.get('description', ''),
        'patient_id': patient.id,
        'provider_id': provider.id,
        'due_date': request.data.get('due_date'),
    }
    
    serializer = RecordingRequestSerializer(data=data)
    if serializer.is_valid():
        recording_request = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_recording(request, recording_id):
    """Delete a recording. Only the connected provider can delete."""
    try:
        recording = Recording.objects.get(id=recording_id)
    except Recording.DoesNotExist:
        return Response({'error': 'Recording not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only allow connected providers to delete
    try:
        provider = Provider.objects.get(user=request.user)
    except Provider.DoesNotExist:
        return Response({'error': 'Provider profile not found'}, status=status.HTTP_403_FORBIDDEN)

    if not ProviderPatientConnection.objects.filter(provider=provider, patient=recording.patient).exists():
        return Response(
            {'error': 'You are not authorized to delete this recording'},
            status=status.HTTP_403_FORBIDDEN
        )

    recording.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_recordings(request, patient_id):
    """Get recordings for a specific patient with proper authorization."""
    # Verify patient exists
    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return Response(
            {'error': f'Patient with id {patient_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Authorization check
    is_authorized = False
    
    # Check if requester is the patient
    try:
        requester_patient = Patient.objects.get(user=request.user)
        if requester_patient.id == patient_id:
            is_authorized = True
    except Patient.DoesNotExist:
        pass
    
    # Check if requester is a connected provider
    if not is_authorized:
        try:
            provider = Provider.objects.get(user=request.user)
            if ProviderPatientConnection.objects.filter(provider=provider, patient=patient).exists():
                is_authorized = True
        except Provider.DoesNotExist:
            pass
    
    if not is_authorized:
        return Response(
            {'error': 'You are not authorized to view these recordings'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Use serializer for consistent response - FIX: No more duplicate fields
    recordings = Recording.objects.filter(patient=patient).order_by('-created_at')
    serializer = RecordingSerializer(recordings, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@require_http_methods(["GET", "HEAD", "OPTIONS"])
def serve_recording(request, file_path):
    """
    Serve audio recordings with range request support for iOS AVPlayer.
    """
    # Handle OPTIONS for CORS preflight
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Range, Accept, Accept-Encoding, Authorization'
        response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges, Content-Type'
        response['Access-Control-Max-Age'] = '86400'
        return response

    # Verify signed token (prevents unauthenticated access to recordings)
    token = request.GET.get('token')
    if not token or not verify_recording_token(token, file_path):
        raise Http404("Recording not found")

    # Validate file path (prevent directory traversal)
    if not re.match(r'^[a-zA-Z0-9_/.-]+$', file_path):
        raise Http404("Invalid file path")
    
    full_path = os.path.join(settings.MEDIA_ROOT, 'recordings', file_path)
    
    # Security check: ensure path doesn't escape media root
    if not os.path.abspath(full_path).startswith(os.path.abspath(settings.MEDIA_ROOT)):
        raise Http404("Invalid file path")
    
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        raise Http404("Recording not found")
    
    file_size = os.path.getsize(full_path)
    
    # Determine content type
    content_types = {
        '.m4a': 'audio/x-m4a',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.mp4': 'audio/mp4',
        '.webm': 'audio/webm',
        '.ogg': 'audio/ogg',
    }
    ext = os.path.splitext(full_path)[1].lower()
    content_type = content_types.get(ext, 'application/octet-stream')
    
    # Handle HEAD request
    if request.method == 'HEAD':
        response = HttpResponse()
        response['Content-Type'] = content_type
        response['Content-Length'] = str(file_size)
        response['Accept-Ranges'] = 'bytes'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges, Content-Type'
        return response
    
    # Parse Range header
    range_header = request.META.get('HTTP_RANGE', '').strip()
    
    if range_header and range_header.startswith('bytes='):
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not range_match:
            return HttpResponse(status=400)
        
        start = int(range_match.group(1))
        end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
        
        if start >= file_size or end >= file_size or start > end:
            response = HttpResponse(status=416)
            response['Content-Range'] = f'bytes */{file_size}'
            return response
        
        content_length = end - start + 1
        
        def file_iterator(chunk_size=8192):
            with open(full_path, 'rb') as f:
                f.seek(start)
                remaining = content_length
                while remaining > 0:
                    chunk = f.read(min(chunk_size, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk
        
        response = StreamingHttpResponse(file_iterator(), status=206, content_type=content_type)
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
        response['Content-Length'] = str(content_length)
    else:
        # Full file response
        def file_iterator(chunk_size=8192):
            with open(full_path, 'rb') as f:
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk
        
        response = StreamingHttpResponse(file_iterator(), content_type=content_type)
        response['Content-Length'] = str(file_size)
    
    response['Accept-Ranges'] = 'bytes'
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges, Content-Type'

    return response


# Voice Analytics Endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recording_analytics(request, recording_id):
    """Get voice analytics for a recording."""

    # Get recording and verify access
    try:
        recording = Recording.objects.get(id=recording_id)
    except Recording.DoesNotExist:
        return Response({'error': 'Recording not found'}, status=404)

    # Authorization check
    is_authorized = False
    try:
        requester_patient = Patient.objects.get(user=request.user)
        if requester_patient.id == recording.patient_id:
            is_authorized = True
    except Patient.DoesNotExist:
        pass

    if not is_authorized:
        try:
            provider = Provider.objects.get(user=request.user)
            if ProviderPatientConnection.objects.filter(
                provider=provider, patient=recording.patient
            ).exists():
                is_authorized = True
        except Provider.DoesNotExist:
            pass

    if not is_authorized:
        return Response({'error': 'Unauthorized'}, status=403)

    # Get analytics
    try:
        analytics = VoiceAnalytics.objects.get(recording_id=recording_id)
        serializer = VoiceAnalyticsSerializer(analytics)
        return Response(serializer.data)
    except VoiceAnalytics.DoesNotExist:
        return Response({
            'recording_id': recording_id,
            'status': recording.analytics_status,
            'message': 'Analytics not yet available'
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics_status(request, recording_id):
    """Get processing status (for frontend polling)."""

    try:
        recording = Recording.objects.get(id=recording_id)
    except Recording.DoesNotExist:
        return Response({'error': 'Recording not found'}, status=404)

    # Authorization check (same as above)
    is_authorized = False
    try:
        requester_patient = Patient.objects.get(user=request.user)
        if requester_patient.id == recording.patient_id:
            is_authorized = True
    except Patient.DoesNotExist:
        pass

    if not is_authorized:
        try:
            provider = Provider.objects.get(user=request.user)
            if ProviderPatientConnection.objects.filter(
                provider=provider, patient=recording.patient
            ).exists():
                is_authorized = True
        except Provider.DoesNotExist:
            pass

    if not is_authorized:
        return Response({'error': 'Unauthorized'}, status=403)

    response_data = {
        'recording_id': recording_id,
        'status': recording.analytics_status,
    }

    if hasattr(recording, 'analytics'):
        analytics = recording.analytics
        response_data.update({
            'analytics_status': analytics.status,
            'processed_at': analytics.processed_at,
            'error_message': analytics.error_message,
            'avqi_score': analytics.avqi_score,
        })

    return Response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def retry_analytics(request, recording_id):
    """Retry failed analytics processing."""

    try:
        recording = Recording.objects.get(id=recording_id)
    except Recording.DoesNotExist:
        return Response({'error': 'Recording not found'}, status=404)

    # Authorization check (same as above)
    is_authorized = False
    try:
        requester_patient = Patient.objects.get(user=request.user)
        if requester_patient.id == recording.patient_id:
            is_authorized = True
    except Patient.DoesNotExist:
        pass

    if not is_authorized:
        try:
            provider = Provider.objects.get(user=request.user)
            if ProviderPatientConnection.objects.filter(
                provider=provider, patient=recording.patient
            ).exists():
                is_authorized = True
        except Provider.DoesNotExist:
            pass

    if not is_authorized:
        return Response({'error': 'Unauthorized'}, status=403)

    # Restart processing
    recording.analytics_status = 'pending'
    recording.save(update_fields=['analytics_status'])

    process_voice_analytics_async(recording_id)

    return Response({
        'status': 'pending',
        'message': 'Analytics processing restarted'
    }, status=202)