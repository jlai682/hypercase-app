from rest_framework.routers import DefaultRouter
from .views import SignatureViewSet

sig_router = DefaultRouter()
sig_router.register(r'signatures', SignatureViewSet)