from django.db import models
from patientManagement.models import Patient

# Create your models here.

class Signature(models.Model):
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='consent_signature', null=True)
    is_checked = models.BooleanField(default=False)
    digital_signature = models.CharField(max_length=200)
    date = models.DateField()

    def __str__(self):
        patient_name = f"{self.patient.firstName} {self.patient.lastName}" if self.patient else "No Patient"
        return f"{patient_name} - {self.digital_signature}"