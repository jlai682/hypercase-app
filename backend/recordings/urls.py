# recordings/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Recording upload and management
    path('upload/', views.upload_recording, name='upload_recording'),
    path('<int:recording_id>/complete-request/', views.complete_recording_request, name='complete_recording_request'),
    path('<int:recording_id>/delete/', views.delete_recording, name='delete_recording'),
    path('patient/<int:patient_id>/', views.get_patient_recordings, name='patient_recordings'),

    # Recording requests
    path('recording-requests/patient/<int:patient_id>/', views.get_recording_requests_by_patient, name='recording_requests_by_patient'),
    path('recording-requests/my-requests/', views.get_recording_requests_by_authenticated_patient, name='my_recording_requests'),
    path('recording-requests/create/', views.create_recording_request, name='create_recording_request'),

    # Voice Analytics endpoints
    path('<int:recording_id>/analytics/', views.get_recording_analytics, name='recording_analytics'),
    path('<int:recording_id>/analytics/status/', views.get_analytics_status, name='analytics_status'),
    path('<int:recording_id>/analytics/retry/', views.retry_analytics, name='retry_analytics'),
]
