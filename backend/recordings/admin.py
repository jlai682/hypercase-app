from django.contrib import admin
from .models import Recording, RecordingRequest, VoiceAnalytics

@admin.register(Recording)
class RecordingAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'patient', 'created_at', 'duration', 'analytics_status', 'has_analytics']
    list_filter = ['analytics_status', 'created_at']
    search_fields = ['title', 'patient__firstName', 'patient__lastName', 'description']
    readonly_fields = ['created_at', 'file_size']
    ordering = ['-created_at']

@admin.register(RecordingRequest)
class RecordingRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'patient', 'provider', 'status', 'issue_date', 'due_date', 'is_overdue']
    list_filter = ['status', 'issue_date', 'due_date']
    search_fields = ['title', 'patient__firstName', 'patient__lastName', 'provider__firstName', 'provider__lastName']
    readonly_fields = ['issue_date', 'response_date']
    ordering = ['-issue_date']

@admin.register(VoiceAnalytics)
class VoiceAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['recording_id', 'get_recording_title', 'status', 'avqi_score', 'avqi_interpretation', 'recording_quality', 'processed_at']
    list_filter = ['status', 'avqi_interpretation', 'recording_quality', 'processed_at']
    search_fields = ['recording__title', 'recording__patient__firstName', 'recording__patient__lastName']
    readonly_fields = ['recording', 'created_at', 'updated_at', 'processed_at', 'processing_duration']

    fieldsets = (
        ('Basic Information', {
            'fields': ('recording', 'status', 'error_message', 'processed_at', 'processing_duration')
        }),
        ('Quality Metrics', {
            'fields': ('recording_quality', 'ambient_noise_level', 'signal_to_noise_ratio', 'quality_warnings')
        }),
        ('AVQI Score', {
            'fields': ('avqi_score', 'avqi_interpretation')
        }),
        ('Jitter Parameters', {
            'fields': ('jitter_local', 'jitter_absolute', 'jitter_rap', 'jitter_ppq5', 'jitter_ddp'),
            'classes': ('collapse',)
        }),
        ('Shimmer Parameters', {
            'fields': ('shimmer_local', 'shimmer_db', 'shimmer_apq3', 'shimmer_apq5', 'shimmer_apq11', 'shimmer_dda'),
            'classes': ('collapse',)
        }),
        ('F0 Parameters', {
            'fields': ('f0_mean', 'f0_min', 'f0_max', 'f0_std', 'f0_voiced_frames'),
            'classes': ('collapse',)
        }),
        ('Other Metrics', {
            'fields': ('cpp_mean', 'cpp_std', 'hnr_mean', 'hnr_min', 'hnr_max', 'ltas_slope', 'ltas_tilt'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('sample_type', 'analysis_version', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    ordering = ['-created_at']

    def get_recording_title(self, obj):
        return obj.recording.title if obj.recording else 'N/A'
    get_recording_title.short_description = 'Recording Title'