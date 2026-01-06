from django.contrib import admin
from .models import Signature

@admin.register(Signature)
class SignatureAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'digital_signature', 'is_checked', 'date']
    list_filter = ['is_checked', 'date']
    search_fields = ['patient__firstName', 'patient__lastName', 'digital_signature']
    readonly_fields = ['date']
    ordering = ['-date']
