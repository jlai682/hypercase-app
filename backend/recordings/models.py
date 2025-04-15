import os
import uuid
from django.db import models
from patientManagement.models import Patient
from providerManagement.models import Provider
from django.utils import timezone

def get_recording_path(instance, filename):
    """Generate a path for each recording file using the title as filename."""
    # Extract file extension

    
    ext = filename.split('.')[-1]

    print(f"Patient ID: {instance.patient.id if instance.patient else None}")

    
    # Use the title as filename if available, otherwise use original filename
    if instance.title:
        # Replace spaces with underscores and remove special characters for safety
        safe_title = "".join(c if c.isalnum() or c in [' ', '_', '-'] else '' for c in instance.title)
        safe_title = safe_title.replace(' ', '_')
        new_filename = f"{safe_title}.{ext}"
    else:
        # If no title is provided, fall back to a UUID
        new_filename = f"{uuid.uuid4()}.{ext}"
    
    # Create patient-specific directory if patient is provided
    if instance.patient and instance.patient.id:
        # This creates a structure like: recordings/patient_123/your_recording_title.mp3
        patient_dir = f"patient_{instance.patient.id}"
        return os.path.join('recordings', patient_dir, new_filename)
    
    # Return the full path relative to MEDIA_ROOT if no patient
    return os.path.join('recordings', new_filename)

class Recording(models.Model):
    """Model to store audio recordings from React Native."""
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='recordings',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)


    
    # The actual audio file
    audio_file = models.FileField(upload_to=get_recording_path)
    
    # File metadata
    file_size = models.IntegerField(default=0)  # Size in bytes
    duration = models.FloatField(null=True, blank=True)  # Duration in seconds
    file_type = models.CharField(max_length=50, blank=True)  # MIME type
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        patient_name = f"{self.patient.firstName} {self.patient.lastName}" if self.patient else "No Patient"
        return f"{patient_name} - {self.title or f'Recording {self.id}'}"
    
    def delete(self, *args, **kwargs):
        """Override delete method to delete file from filesystem as well."""
        # Delete the file from storage
        if self.audio_file:
            if os.path.isfile(self.audio_file.path):
                os.remove(self.audio_file.path)
        
        # Call the parent delete method
        super().delete(*args, **kwargs)
        
    @classmethod
    def get_by_patient(cls, patient_id):
        """Get all recordings for a specific patient."""
        return cls.objects.filter(patient_id=patient_id).order_by('-created_at')
    
    @classmethod
    def get_all_with_patients(cls):
        """Get all recordings with their associated patients."""
        return cls.objects.select_related('patient').all()
    
    def complete_request(self):
        """Mark the associated request as completed if it exists."""
        if hasattr(self, 'request') and self.request:
            self.request.status = 'completed'
            self.request.response_date = timezone.now()
            self.request.save()
    
class RecordingRequest(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('completed', 'Completed'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    issue_date = models.DateTimeField(auto_now_add=True)
    response_date = models.DateTimeField(null=True, blank=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='recording_requests_received')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='recording_requests_sent')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    recording = models.OneToOneField(
        'Recording',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='request'
    )
    
    def __str__(self):
        return f"{self.title} sent to {self.patient} by {self.provider}"