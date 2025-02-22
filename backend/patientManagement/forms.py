from django import forms
from django.contrib.auth.models import User
from .models import Patient

class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'password', 'email']

class PatientForm(forms.ModelForm):
    class Meta:
        model = Patient
        fields = ['firstName', 'lastName', 'age', 'email']
