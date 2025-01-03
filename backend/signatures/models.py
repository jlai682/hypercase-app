from django.db import models

# Create your models here.

class Signature(models.Model):

    is_checked = models.BooleanField(default=False)
    digital_signature = models.CharField(max_length=200)
    date = models.DateField()

    def __str__(self):
        return str(self.digital_signature)