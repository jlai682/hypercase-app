from django import forms
from django.contrib.auth.models import User
from .models import Provider

class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'password', 'email']

class ProviderForm(forms.ModelForm):
    class Meta:
        model = Provider
        fields = ['firstName', 'lastName', 'email']