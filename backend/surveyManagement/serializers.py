from rest_framework import serializers
from .models import OpenQuestion, MultipleChoiceQuestion, MultipleChoiceOption, Survey

class OpenQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpenQuestion
        fields = ['id', 'question_description']

class MultipleChoiceOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MultipleChoiceOption
        fields = ['id', 'option']

class MultipleChoiceQuestionSerializer(serializers.ModelSerializer):
    options = MultipleChoiceOptionSerializer(many=True, read_only=True)

    class Meta:
        model = MultipleChoiceQuestion
        fields = ['id', 'question_description', 'options']



class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = ['id', 'title', 'issue_date', 'response_date', 'status', 'provider']
