from rest_framework.serializers import ModelSerializer
from ..models import Signature

class SignatureSerializer(ModelSerializer):
    class Meta:
        model = Signature
        fields = ('is_checked', 'digital_signature', 'date')