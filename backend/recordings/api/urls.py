from rest_framework.routers import DefaultRouter
from .views import RecordingViewSet
from django.urls import path

sig_router = DefaultRouter()
sig_router.register(r'recordings', RecordingViewSet)
