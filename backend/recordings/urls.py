from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_recording, name='upload_recording'),
    path('list/', views.list_recordings, name='list_recordings'),
    path('list/<int:patient_id>/', views.list_recordings, name='list_patient_recordings'),
    path('<int:recording_id>/', views.recording_detail, name='recording_detail'),
]