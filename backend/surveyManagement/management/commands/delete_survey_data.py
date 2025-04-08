from django.core.management.base import BaseCommand
from surveyManagement.models import (
    OpenQuestion,
    MultipleChoiceQuestion,
    MultipleChoiceOption,
    Survey,
    OpenQuestionResponse,
    MultipleChoiceResponse
)

class Command(BaseCommand):
    help = 'Deletes all instances of survey-related models'

    def handle(self, *args, **kwargs):
        self.stdout.write("Deleting all survey-related data...")

        # Delete child objects first to avoid FK constraint issues
        OpenQuestionResponse.objects.all().delete()
        MultipleChoiceResponse.objects.all().delete()
        Survey.objects.all().delete()
        MultipleChoiceOption.objects.all().delete()
        MultipleChoiceQuestion.objects.all().delete()
        OpenQuestion.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('All survey-related data deleted.'))
