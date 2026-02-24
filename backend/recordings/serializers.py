import logging
from typing import Dict, Any, Optional
from rest_framework import serializers
from django.conf import settings
from django.utils import timezone

from .models import Recording, RecordingRequest, VoiceAnalytics
from .utils import generate_recording_token
from patientManagement.models import Patient
from providerManagement.models import Provider

logger = logging.getLogger(__name__)

# Handles recording uploads (completes recording requests)
class RecordingSerializer(serializers.ModelSerializer):
    """Serializer for Recording model."""
    file_url = serializers.SerializerMethodField()
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        source='patient',
        required=True,
        allow_null=False
    )
    request_id = serializers.PrimaryKeyRelatedField(
        source='request',
        read_only=True
    )
    
    class Meta:
        model = Recording
        fields = [
            'id', 'patient_id', 'title', 'description', 'audio_file', 'file_url',
            'file_size', 'duration', 'file_type', 'created_at', 'request_id'
        ]
        read_only_fields = ['file_size', 'file_type', 'created_at']
    
    def get_file_url(self, obj):
        """Return a signed absolute URL to the audio file.

        Always routes through the Django serve_recording endpoint
        (/media/recordings/<path>?token=...) so the token is validated
        server-side. In S3 mode, that endpoint generates a pre-signed
        URL and redirects. Using obj.audio_file.url directly would
        return a bare S3 URL that bypasses token validation and 403s
        on the private bucket.
        """
        if not obj.audio_file:
            return None

        # Compute file_path as seen by the serve_recording URL pattern.
        # audio_file.name = 'recordings/patient_1/file.m4a'
        # URL pattern captures everything after /media/recordings/
        audio_name = obj.audio_file.name
        file_path = audio_name[len('recordings/'):] if audio_name.startswith('recordings/') else audio_name
        token = generate_recording_token(file_path)

        # Build URL to the Django endpoint, not to the storage backend.
        relative_url = f"/media/recordings/{file_path}"

        request = self.context.get('request')
        if request:
            try:
                url = request.build_absolute_uri(relative_url)
                if not settings.DEBUG and url.startswith('http://'):
                    url = url.replace('http://', 'https://', 1)
                return f"{url}?token={token}"
            except Exception as e:
                logger.warning(f"Failed to build absolute URI: {e}")

        return f"{relative_url}?token={token}"
    
    def create(self, validated_data):
        """Create a new recording with file metadata."""
        audio_file = validated_data.get('audio_file')
        # Get file size and type
        if audio_file:
            validated_data['file_size'] = audio_file.size
            validated_data['file_type'] = audio_file.content_type
        
        # Create the recording
        recording = Recording.objects.create(**validated_data)
        
        # Check if this recording is for a request and mark it as completed
        request = self.context.get('request')
        if request and hasattr(request, 'data'):
            request_id = request.data.get('request_id')
            if request_id:
                try:
                    recording_request = RecordingRequest.objects.get(id=request_id)
                    if recording.patient_id == recording_request.patient_id:
                        recording_request.recording = recording
                        recording_request.status = 'completed'
                        recording_request.response_date = timezone.now()
                        recording_request.save()
                    else:
                        logger.warning(
                            f"Request {request_id} does not belong to patient {recording.patient_id}"
                        )
                except RecordingRequest.DoesNotExist:
                    logger.warning(f"RecordingRequest {request_id} not found")
                except Exception as e:
                    logger.error(f"Failed to link recording to request: {e}")
        
        return recording

# Handles individual recording requests
class RecordingRequestSerializer(serializers.ModelSerializer):
    """Serializer for RecordingRequest model."""
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        source='patient'
    )
    provider_id = serializers.PrimaryKeyRelatedField(
        queryset=Provider.objects.all(),
        source='provider'
    )
    recording = RecordingSerializer(read_only=True)
    
    class Meta:
        model = RecordingRequest
        fields = [
            'id', 'title', 'description', 'issue_date', 'due_date', 'response_date',
            'patient_id', 'provider_id', 'status', 'recording'
        ]
        read_only_fields = ['issue_date', 'response_date', 'status']
    
    def create(self, validated_data):
        """Create a new recording request."""
        validated_data['status'] = 'sent'
        return RecordingRequest.objects.create(**validated_data)
    

# Simplified version for listing requests (doesn't include full Recording nested data)
class RecordingRequestListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing RecordingRequests."""
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    provider_id = serializers.IntegerField(source='provider.id', read_only=True)
    patient_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = RecordingRequest
        fields = [
            'id', 'title', 'description', 'issue_date', 'due_date', 'response_date',
            'patient_id', 'patient_name', 'provider_id', 'provider_name', 
            'status', 'is_overdue'
        ]
    
    def get_patient_name(self, obj):
        if obj.patient:
            return f"Patient {obj.patient.unique_id}"
        return None
    
    def get_provider_name(self, obj):
        if obj.provider:
            return f"{obj.provider.firstName} {obj.provider.lastName}"
        return None


class VoiceAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for VoiceAnalytics model."""
    recording_id = serializers.IntegerField(source='recording.id', read_only=True)
    recording_title = serializers.CharField(source='recording.title', read_only=True)

    class Meta:
        model = VoiceAnalytics
        fields = [
            'recording_id',
            'recording_title',
            'status',
            'error_message',
            'processed_at',
            'processing_duration',
            # Quality metrics
            'ambient_noise_level',
            'signal_to_noise_ratio',
            'recording_quality',
            'quality_warnings',
            # Jitter parameters
            'jitter_local',
            'jitter_absolute',
            'jitter_rap',
            'jitter_ppq5',
            'jitter_ddp',
            # Shimmer parameters
            'shimmer_local',
            'shimmer_db',
            'shimmer_apq3',
            'shimmer_apq5',
            'shimmer_apq11',
            'shimmer_dda',
            # F0 parameters
            'f0_mean',
            'f0_min',
            'f0_max',
            'f0_std',
            'f0_voiced_frames',
            # CPP
            'cpp_mean',
            'cpp_std',
            # HNR
            'hnr_mean',
            'hnr_min',
            'hnr_max',
            # LTAS
            'ltas_slope',
            'ltas_tilt',
            # AVQI
            'avqi_score',
            'avqi_interpretation',
            # Metadata
            'sample_type',
            'analysis_version',
            'raw_parameters',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        """Convert NaN values to None for JSON serialization."""
        import math

        data = super().to_representation(instance)

        # Convert any NaN float values to None
        for key, value in data.items():
            if isinstance(value, float) and math.isnan(value):
                data[key] = None

        return data