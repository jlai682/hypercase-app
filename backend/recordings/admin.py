from django.contrib import admin
from .models import Recording

@admin.register(Recording)
class RecordingAdmin(admin.ModelAdmin):
    list_display = ['name', 'patient', 'date_created', 'duration']
    search_fields = ['name', 'patient__firstName', 'patient__lastName']
    list_filter = ['date_created']
