from django.contrib import admin
from .models import Provider, ProviderPatientConnection

@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display = ('firstName', 'lastName', 'get_email', 'phone_number', 'user')
    search_fields = ('firstName', 'lastName', 'user__email')  # ✅ Search through user
    ordering = ('lastName', 'firstName')
    
    # Custom method to display email from user
    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email

@admin.register(ProviderPatientConnection)
class ProviderPatientConnectionAdmin(admin.ModelAdmin):
    list_display = ('provider', 'patient', 'connected_on')
    search_fields = (
        'provider__firstName', 
        'provider__lastName', 
        'patient__firstName', 
        'patient__lastName'
    )
    list_filter = ('connected_on',)
    ordering = ('-connected_on',)
    date_hierarchy = 'connected_on'