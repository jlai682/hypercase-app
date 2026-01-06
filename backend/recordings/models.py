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

    analytics_status = models.CharField(
        max_length=20,
        choices=[
            ('not_started', 'Not Started'),
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='not_started',
        db_index=True
    )

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

    @property
    def has_analytics(self):
        """Check if analytics processing is complete."""
        return hasattr(self, 'analytics') and self.analytics.status == 'completed'

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


class VoiceAnalytics(models.Model):
    """Stores acoustic analysis results for a voice recording."""

    recording = models.OneToOneField(
        'Recording',
        on_delete=models.CASCADE,
        related_name='analytics',
        primary_key=True
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('insufficient_quality', 'Insufficient Quality'),
        ],
        default='pending',
        db_index=True
    )

    error_message = models.TextField(blank=True, null=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processing_duration = models.FloatField(null=True, blank=True)

    # Quality metrics
    ambient_noise_level = models.FloatField(null=True, blank=True)
    signal_to_noise_ratio = models.FloatField(null=True, blank=True)
    recording_quality = models.CharField(
        max_length=20,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('fair', 'Fair'),
            ('poor', 'Poor'),
        ],
        null=True,
        blank=True
    )
    quality_warnings = models.JSONField(default=list, blank=True)

    # Jitter parameters
    jitter_local = models.FloatField(null=True, blank=True)
    jitter_absolute = models.FloatField(null=True, blank=True)
    jitter_rap = models.FloatField(null=True, blank=True)
    jitter_ppq5 = models.FloatField(null=True, blank=True)
    jitter_ddp = models.FloatField(null=True, blank=True)

    # Shimmer parameters
    shimmer_local = models.FloatField(null=True, blank=True)
    shimmer_db = models.FloatField(null=True, blank=True)
    shimmer_apq3 = models.FloatField(null=True, blank=True)
    shimmer_apq5 = models.FloatField(null=True, blank=True)
    shimmer_apq11 = models.FloatField(null=True, blank=True)
    shimmer_dda = models.FloatField(null=True, blank=True)

    # F0 parameters
    f0_mean = models.FloatField(null=True, blank=True)
    f0_min = models.FloatField(null=True, blank=True)
    f0_max = models.FloatField(null=True, blank=True)
    f0_std = models.FloatField(null=True, blank=True)
    f0_voiced_frames = models.IntegerField(null=True, blank=True)

    # CPP
    cpp_mean = models.FloatField(null=True, blank=True)
    cpp_std = models.FloatField(null=True, blank=True)

    # HNR
    hnr_mean = models.FloatField(null=True, blank=True)
    hnr_min = models.FloatField(null=True, blank=True)
    hnr_max = models.FloatField(null=True, blank=True)

    # LTAS
    ltas_slope = models.FloatField(null=True, blank=True)
    ltas_tilt = models.FloatField(null=True, blank=True)

    # AVQI
    avqi_score = models.FloatField(null=True, blank=True)
    avqi_interpretation = models.CharField(
        max_length=20,
        choices=[
            ('normal', 'Normal (0-2.3)'),
            ('borderline', 'Borderline (2.3-3.5)'),
            ('dysphonic', 'Dysphonic (3.5-10)'),
        ],
        null=True,
        blank=True
    )

    sample_type = models.CharField(max_length=20, default='unknown')
    analysis_version = models.CharField(max_length=20, default='1.0')
    raw_parameters = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'voice_analytics'
        verbose_name = 'Voice Analytics'
        verbose_name_plural = 'Voice Analytics'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['avqi_score']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Analytics for {self.recording.title} - {self.status}"

    def calculate_avqi(self):
        """Calculate AVQI score based on extracted parameters."""
        import math

        required_params = [
            self.cpp_mean,
            self.hnr_mean,
            self.shimmer_local,
            self.shimmer_db,
            self.ltas_slope,
            self.ltas_tilt,
        ]

        # Check for None or NaN values
        if None in required_params:
            return None

        # Check for NaN values
        if any(isinstance(p, float) and math.isnan(p) for p in required_params):
            return None

        avqi = (
            3.295
            - 0.111 * self.cpp_mean
            - 0.073 * self.hnr_mean
            - 0.213 * self.shimmer_local
            + 2.789 * self.shimmer_db
            - 0.032 * self.ltas_slope
            + 0.077 * self.ltas_tilt
            + 1.797
        )

        # Check if result is NaN
        if math.isnan(avqi):
            return None

        # Interpret score
        if avqi < 2.3:
            interpretation = 'normal'
        elif avqi < 3.5:
            interpretation = 'borderline'
        else:
            interpretation = 'dysphonic'

        self.avqi_score = round(avqi, 2)
        self.avqi_interpretation = interpretation
        return avqi