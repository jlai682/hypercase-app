from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('firstName', 'lastName', 'get_email', 'age', 'phone_number', 'user')
    search_fields = ('firstName', 'lastName', 'user__email')  
    list_filter = ('age',)
    ordering = ('lastName', 'firstName')
    
    # Custom method to display email from user
    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('user', 'firstName', 'lastName', 'age')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'address')
        }),
        ('Medical Information', {
            'fields': ('medical_history',)
        }),
    )