from django.core.management.base import BaseCommand
from recordings.models import Recording
import os

class Command(BaseCommand):
    help = 'Delete all recordings and their files from the system'

    def handle(self, *args, **options):
        recordings = Recording.objects.all()
        count = recordings.count()

        for recording in recordings:
            if recording.file and os.path.isfile(recording.file.path):
                os.remove(recording.file.path)
                self.stdout.write(self.style.SUCCESS(f"Deleted file: {recording.file.path}"))
            else:
                self.stdout.write(self.style.WARNING(f"File not found: {recording.file.path}"))

            recording.delete()

        self.stdout.write(self.style.SUCCESS(f"Successfully deleted {count} recordings."))
