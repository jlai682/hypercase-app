from rest_framework import serializers
from ..models import Signature
from patientManagement.models import Patient

class SignatureSerializer(serializers.ModelSerializer):
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        source='patient',
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Signature
        fields = ('id', 'patient_id', 'is_checked', 'digital_signature', 'date')
        read_only_fields = ('id',)