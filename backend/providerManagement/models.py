from django.db import models
from django.contrib.auth.models import User

class Provider(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    firstName = models.CharField(max_length = 255, default = "John")
    lastName = models.CharField(max_length = 255, default = "Doe")
    phone_number = models.CharField(max_length = 20)
    email = models.EmailField()

    def __str__(self):
        return f"{self.name} = {self.user.username}"