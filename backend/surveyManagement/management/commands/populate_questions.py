from django.core.management.base import BaseCommand
from surveyManagement.models import OpenQuestion, MultipleChoiceQuestion, MultipleChoiceOption

class Command(BaseCommand):
    help = 'Populate the database with sample open and multiple choice questions'

    def handle(self, *args, **kwargs):
        # Open Questions
        open_questions = [
            "How have you been feeling lately?",
            "What are your main concerns today?",
            "Can you describe your current symptoms?",
        ]

        for text in open_questions:
            question, created = OpenQuestion.objects.get_or_create(question_description=text)
            if created:
                self.stdout.write(f'Created open question: "{text}"')
            else:
                self.stdout.write(f'Open question already exists: "{text}"')

        # Multiple Choice Questions
        mc_questions_and_options = {
            "How would you rate your pain level today?": ["None", "Mild", "Moderate", "Severe"],
            "How often do you experience fatigue?": ["Never", "Sometimes", "Often", "Always"],
            "Do you smoke?": ["Yes", "No", "Occasionally"],
        }

        for question_text, options in mc_questions_and_options.items():
            mc_question, _ = MultipleChoiceQuestion.objects.get_or_create(question_description=question_text)
            for option_text in options:
                MultipleChoiceOption.objects.get_or_create(question=mc_question, option=option_text)
            self.stdout.write(f'Created MC question: "{question_text}" with options: {options}')
