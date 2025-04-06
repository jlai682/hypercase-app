from rest_framework import serializers
from ..models import Recording
from patientManagement.models import Patient
from django.conf import settings

class RecordingSerializer(serializers.ModelSerializer):
    """Serializer for Recording model."""
    file_url = serializers.SerializerMethodField()
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        source='patient',
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Recording
        fields = [
            'id', 'patient_id', 'title', 'description', 'audio_file', 'file_url',
            'file_size', 'duration', 'file_type',
            'created_at'
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
        
        return recording