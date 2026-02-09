from django.db import models
from patientManagement.models import Patient
from providerManagement.models import Provider

# A survey made up of questions responses
class Survey(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('completed', 'Completed'),
    ]
    title = models.CharField(max_length=255)
    issue_date = models.DateTimeField(auto_now_add=True)
    response_date = models.DateTimeField(auto_now_add=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name = 'surveys_received')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name = 'surveys_sent')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')  


    def __str__(self):
        return f"{self.title} sent to {self.patient} by {self.provider}"

class OpenQuestion(models.Model):
    question_description = models.CharField(max_length=255)

    def __str__(self):
        return self.question_description
    
# Response to an Open Question
class OpenQuestionResponse(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name = 'surveys')
    question = models.ForeignKey(OpenQuestion, on_delete=models.CASCADE)
    response = models.CharField(max_length=255)

    def __str__(self):
        return self.response
    
# Generic curated multiple choice question
class MultipleChoiceQuestion(models.Model):
    question_description = models.CharField(max_length=255)
    is_multi_select = models.BooleanField(default=False)

    def __str__(self):
        return self.question_description

# Potential answer for a multiple choice question
class MultipleChoiceOption(models.Model):
    question = models.ForeignKey(MultipleChoiceQuestion, on_delete=models.CASCADE, related_name = "options")
    option = models.CharField(max_length=255)

    def __str__(self):
        return self.option

# Response to a multiple choice question
class MultipleChoiceResponse(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)
    question = models.ForeignKey(MultipleChoiceQuestion, on_delete=models.CASCADE)
    selected_options = models.ManyToManyField(MultipleChoiceOption, blank=True, related_name='responses')

    def __str__(self):
        options = self.selected_options.all()
        return ', '.join(o.option for o in options) if options.exists() else 'No selection'