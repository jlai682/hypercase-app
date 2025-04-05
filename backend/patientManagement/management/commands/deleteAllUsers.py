from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from patientManagement.models import Patient  # Import your Patient model
from providerManagement.models import Provider, ProviderPatientConnection

class Command(BaseCommand):
    help = 'Delete all users and associated patient records'

    def handle(self, *args, **kwargs):
        try:

            ProviderPatientConnection.objects.all().delete()
            
            # Deleting all Patient records
            Patient.objects.all().delete()

            # Deleting all User records
            User.objects.all().delete()

            Provider.objects.all().delete()

            

            self.stdout.write(self.style.SUCCESS('Successfully deleted all users and associated patient records.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error occurred: {str(e)}'))
