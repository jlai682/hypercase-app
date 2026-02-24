from django.db import models
from django.contrib.auth.models import User

class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Link to the user
    unique_id = models.CharField(max_length=10, unique=True)
    age = models.IntegerField()
    medical_history = models.TextField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')

    def __str__(self):
        return f"Patient {self.unique_id}"

    @classmethod
    def search_by_unique_id(cls, unique_id):
        try:
            return cls.objects.get(unique_id=unique_id)
        except cls.DoesNotExist:
            return None
