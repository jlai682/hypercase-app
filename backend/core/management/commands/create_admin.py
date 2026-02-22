from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import os

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        username = os.environ.get('ADMIN_USERNAME', 'admin')
        email = os.environ.get('ADMIN_EMAIL', 'admin@acousticareapp.com')
        password = os.environ.get('ADMIN_PASSWORD')
        if not password:
            self.stderr.write('ADMIN_PASSWORD env var required')
            return
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username, email, password)
            self.stdout.write(f'Created superuser: {username}')
        else:
            self.stdout.write(f'User {username} already exists')
