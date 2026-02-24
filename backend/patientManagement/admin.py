from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('unique_id', 'age', 'phone_number', 'user')
    search_fields = ('unique_id',)
    list_filter = ('age',)
    ordering = ('unique_id',)

    fieldsets = (
        ('Patient Information', {
            'fields': ('user', 'unique_id', 'age')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'address')
        }),
        ('Medical Information', {
            'fields': ('medical_history',)
        }),
    )
