import os
import uuid
import logging
from django.db import models
from django.db.models.signals import post_delete  
from django.dispatch import receiver   
from django.utils import timezone

from patientManagement.models import Patient
from providerManagement.models import Provider

logger = logging.getLogger(__name__)

def get_recording_path(instance, filename):
    """Generate a path for each recording file using the title as filename."""

    if '.' in filename:
        ext = filename.rsplit('.', 1)[-1].lower()
    else:
        ext = 'webm'  # Default extension
    
    # Generate filename
    if instance.title:
        safe_title = "".join(c if c.isalnum() or c in [' ', '_', '-'] else '' for c in instance.title)
        safe_title = safe_title.replace(' ', '_')
        # Add UUID suffix to prevent collisions
        new_filename = f"{safe_title}_{uuid.uuid4().hex[:8]}.{ext}"
    else:
        new_filename = f"{uuid.uuid4()}.{ext}"
    
    # Create patient-specific directory if patient is provided
    if instance.patient and instance.patient.id:
        patient_dir = f"patient_{instance.patient.id}"
        return os.path.join('recordings', patient_dir, new_filename)
    
    return os.path.join('recordings', new_filename)

class Recording(models.Model):
    """Model to store audio recordings from React Native."""
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='recordings',
        null=False,
        blank=False
    )
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    audio_file = models.FileField(upload_to=get_recording_path)    
    file_size = models.BigIntegerField(default=0)   
    duration = models.FloatField(null=True, blank=True)   
    file_type = models.CharField(max_length=50, blank=True)   
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta: 
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', '-created_at']),  
        ]
    
    def __str__(self):
        patient_name = f"{self.patient.firstName} {self.patient.lastName}" if self.patient else "No Patient"
        return f"{patient_name} - {self.title or f'Recording {self.id}'}"
        
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

# This signal runs AFTER any Recording is deleted, including bulk deletes
@receiver(post_delete, sender=Recording)
def delete_recording_file(sender, instance, **kwargs):
    """Delete the audio file when Recording instance is deleted."""
    if instance.audio_file:
        try:
            file_path = instance.audio_file.path
            if os.path.isfile(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log the error but don't prevent deletion
            logger.error(f"Failed to delete recording file {instance.audio_file.name}: {e}")
            
class RecordingRequest(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),   
        ('expired', 'Expired'),   
    ]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    issue_date = models.DateTimeField(auto_now_add=True)
    response_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)  

    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='recording_requests_received'
    )
    provider = models.ForeignKey(
        Provider, 
        on_delete=models.CASCADE, 
        related_name='recording_requests_sent'
    )
    recording = models.OneToOneField(
        'Recording',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='request'
    )
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    
    class Meta: 
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['provider', 'status']),
        ]

    def __str__(self):
        return f"{self.title} sent to {self.patient} by {self.provider}"
    
    @property # Added
    def is_overdue(self):
        """Check if the request is past its due date."""
        if self.due_date and self.status == 'sent':
            return timezone.now() > self.due_date
        return False