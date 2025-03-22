from django.db import models
from django.contrib.auth.models import User
from patientManagement.models import Patient
import os
import uuid

def recording_file_path(instance, filename):
    # Generate a UUID for the file name to avoid conflicts
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('recordings', filename)

class Recording(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=recording_file_path)
    date_created = models.DateTimeField(auto_now_add=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='recordings')
    duration = models.FloatField(default=0)  # Duration in seconds
    
    def __str__(self):
        return f"{self.name} - {self.patient.firstName} {self.patient.lastName}"
