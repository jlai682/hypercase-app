from rest_framework import serializers
from .models import Recording
from django.conf import settings

class RecordingSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Recording
        fields = ['id', 'name', 'file', 'file_url', 'date_created', 'patient', 'patient_name', 'duration']
        read_only_fields = ['id', 'date_created', 'patient_name', 'file_url']
    
    def get_patient_name(self, obj):
        return f"{obj.patient.firstName} {obj.patient.lastName}"
        
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None