from django.urls import path
from recordings import views

urlpatterns = [
    path('upload/', views.upload_recording, name='api_upload_recording'),
    path('list/', views.list_recordings, name='api_list_recordings'),
    path('list/<int:patient_id>/', views.list_recordings, name='api_list_patient_recordings'),
    path('<int:recording_id>/', views.recording_detail, name='api_recording_detail'),
]