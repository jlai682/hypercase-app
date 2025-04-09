from django.core.management.base import BaseCommand
from recordings.models import Recording

class Command(BaseCommand):
    help = 'Delete all recordings'

    def handle(self, *args, **options):
        recordings = Recording.objects.all()
        count = recordings.count()
        recordings.delete()
        self.stdout.write(self.style.SUCCESS(f'Successfully deleted {count} recordings'))
