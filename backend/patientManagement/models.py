from django.db import models
from django.contrib.auth.models import User

class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Link to the user
    firstName = models.CharField(max_length=255, default = "John")
    lastName = models.CharField(max_length=255, default = "Doe")
    age = models.IntegerField()
    medical_history = models.TextField()
    address = models.TextField()
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return f"{self.name} - {self.user.username}"

    @classmethod
    def search_by_email(cls, email):
        try:
            return cls.objects.get(email=email)
        except cls.DoesNotExist:
            return None