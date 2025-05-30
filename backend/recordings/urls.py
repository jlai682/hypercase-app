# recordings/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register(r'recordings', views.RecordingViewSet)

# Add these URL patterns for your function-based views
urlpatterns = [
    # ViewSet routes (includes the upload action)
    path('', include(router.urls)),
    
    # Additional function-based view routes
    path('patient/<int:patient_id>/', views.get_patient_recordings, name='patient_recordings'),
    path('recording-requests/patient/<int:patient_id>/', views.get_recording_requests_by_patient, name='recording_requests_by_patient'),
    path('recording-requests/my-requests/', views.get_recording_requests_by_authenticated_patient, name='my_recording_requests'),
    path('recording-requests/create/', views.create_recording_request, name='create_recording_request'),
]

# Make sure the router.urls are included in urlpatterns
urlpatterns += router.urls