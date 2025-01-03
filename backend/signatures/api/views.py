from rest_framework.viewsets import ModelViewSet
from .serializers import SignatureSerializer
from ..models import Signature


class SignatureViewSet(ModelViewSet):
    queryset = Signature.objects.all()
    serializer_class = SignatureSerializer
