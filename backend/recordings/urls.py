# recordings/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from . import views

router = DefaultRouter()
router.register(r'recordings', views.RecordingViewSet)

# Add these URL patterns for your function-based views
urlpatterns = [
    path('recordings/recording-requests/by-patient/<int:patient_id>/', views.get_recording_requests_by_patient, name='recording-requests-by-patient'),
    path('recordings/recording-requests/my-requests/', views.get_recording_requests_by_authenticated_patient, name='my-recording-requests'),
    path('recordings/recording-requests/create/', views.create_recording_request, name='create-recording-request'),
    path('recordings/patient/<int:patient_id>/', views.get_patient_recordings, name='patient-recordings'),
]

# Make sure the router.urls are included in urlpatterns
urlpatterns += router.urls