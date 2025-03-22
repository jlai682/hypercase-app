from django.db import models
from django.contrib.auth.models import User
from patientManagement.models import Patient

class Provider(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    firstName = models.CharField(max_length = 255, default = "John")
    lastName = models.CharField(max_length = 255, default = "Doe")
    phone_number = models.CharField(max_length = 20)
    email = models.EmailField()

    def __str__(self):
        return f"{self.name} = {self.user.username}"


class ProviderPatientConnection(models.Model):
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    connected_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('provider', 'patient')  # Prevent duplicate connections

    def __str__(self):
        return f"{self.provider} ↔ {self.patient}"
