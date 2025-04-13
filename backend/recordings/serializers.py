from rest_framework import serializers
from .models import Recording, RecordingRequest
from patientManagement.models import Patient
from providerManagement.models import Provider
from django.conf import settings
from django.utils import timezone

class RecordingSerializer(serializers.ModelSerializer):
    """Serializer for Recording model."""
    file_url = serializers.SerializerMethodField()
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        source='patient',
        required=False,
        allow_null=True
    )
    # Add a reference to the request
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
        """Return the absolute URL to the audio file."""
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
            return obj.audio_file.url
        return None
    
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
        request_id = self.context.get('request').data.get('request_id') if self.context.get('request') else None
        if request_id:
            try:
                recording_request = RecordingRequest.objects.get(id=request_id)
                recording_request.recording = recording
                recording_request.status = 'completed'
                recording_request.response_date = timezone.now()
                recording_request.save()
            except RecordingRequest.DoesNotExist:
                pass
        
        return recording


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
            'id', 'title', 'description', 'issue_date', 'response_date',
            'patient_id', 'provider_id', 'status', 'recording'
        ]
        read_only_fields = ['issue_date', 'response_date', 'status']
    
    def create(self, validated_data):
        """Create a new recording request."""
        # Set status to 'sent' by default
        validated_data['status'] = 'sent'
        return RecordingRequest.objects.create(**validated_data)

# For listing requests by status
class RecordingRequestListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing RecordingRequests."""
    patient_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    
    class Meta:
        model = RecordingRequest
        fields = [
            'id', 'title', 'issue_date', 'response_date',
            'patient_id', 'patient_name', 'provider_id', 'provider_name', 'status'
        ]
    
    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.firstName} {obj.patient.lastName}"
        return None
    
    def get_provider_name(self, obj):
        if obj.provider:
            return f"{obj.provider.firstName} {obj.provider.lastName}"
        return None