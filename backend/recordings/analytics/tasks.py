import threading
import time
import logging
import math
from django.utils import timezone
from django.db import transaction

from recordings.models import Recording, VoiceAnalytics
from .processor import VoiceAnalyticsProcessor

logger = logging.getLogger(__name__)


def sanitize_nan_values(value):
    """Convert NaN values to None for database storage."""
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def process_voice_analytics_sync(recording_id):
    """
    Process voice analytics synchronously.
    This is the actual processing function.
    """
    start_time = time.time()

    try:
        recording = Recording.objects.get(id=recording_id)
        logger.info(f"Processing analytics for recording {recording_id}")

        # Get or create analytics
        analytics, created = VoiceAnalytics.objects.get_or_create(
            recording=recording,
            defaults={'status': 'processing'}
        )

        # Update status
        analytics.status = 'processing'
        analytics.error_message = None
        analytics.save(update_fields=['status', 'error_message'])

        recording.analytics_status = 'processing'
        recording.save(update_fields=['analytics_status'])

        # Process with Parselmouth
        processor = VoiceAnalyticsProcessor(recording)
        results = processor.process()

        # Update analytics with results (sanitize NaN values)
        for key, value in results.items():
            if hasattr(analytics, key):
                setattr(analytics, key, sanitize_nan_values(value))

        # Calculate AVQI
        analytics.calculate_avqi()

        # Set metadata
        analytics.status = 'completed'
        analytics.processed_at = timezone.now()
        analytics.processing_duration = time.time() - start_time
        analytics.save()

        # Update recording
        recording.analytics_status = 'completed'
        recording.save(update_fields=['analytics_status'])

        logger.info(f"Completed in {analytics.processing_duration:.2f}s")

        return {
            'status': 'completed',
            'avqi_score': analytics.avqi_score,
            'processing_time': analytics.processing_duration
        }

    except Recording.DoesNotExist:
        logger.error(f"Recording {recording_id} not found")
        return {'status': 'error', 'error': 'Recording not found'}

    except Exception as e:
        logger.exception(f"Failed to process recording {recording_id}")

        try:
            analytics = VoiceAnalytics.objects.get(recording_id=recording_id)
            analytics.status = 'failed'
            analytics.error_message = str(e)
            analytics.processing_duration = time.time() - start_time
            analytics.save()

            recording = Recording.objects.get(id=recording_id)
            recording.analytics_status = 'failed'
            recording.save(update_fields=['analytics_status'])
        except:
            pass

        return {'status': 'error', 'error': str(e)}


def process_voice_analytics_async(recording_id):
    """
    Process voice analytics in a background thread.
    Non-blocking - returns immediately.
    """
    def run_processing():
        # Create new database connection for this thread
        from django.db import connection
        connection.close()

        # Run processing
        process_voice_analytics_sync(recording_id)

    # Start thread
    thread = threading.Thread(target=run_processing, daemon=True)
    thread.start()

    logger.info(f"Started background thread for recording {recording_id}")
