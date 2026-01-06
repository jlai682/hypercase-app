from rest_framework import serializers
from .models import OpenQuestion, MultipleChoiceQuestion, MultipleChoiceOption, Survey, OpenQuestionResponse, MultipleChoiceResponse

class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = ['id', 'title', 'issue_date', 'response_date', 'status', 'provider']

class OpenQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpenQuestion
        fields = ['id', 'question_description']

class OpenQuestionResponseSerializer(serializers.ModelSerializer):
    question = OpenQuestionSerializer(read_only=True)

    class Meta:
        model = OpenQuestionResponse
        fields = ['question', 'response']

class MultipleChoiceOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MultipleChoiceOption
        fields = ['id', 'option']

class MultipleChoiceQuestionSerializer(serializers.ModelSerializer):
    options = MultipleChoiceOptionSerializer(many=True, read_only=True)

    class Meta:
        model = MultipleChoiceQuestion
        fields = ['id', 'question_description', 'options']

class MultipleChoiceResponseSerializer(serializers.ModelSerializer):
    question = MultipleChoiceQuestionSerializer(read_only=True)
    selected_option = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()

    class Meta:
        model = MultipleChoiceResponse
        fields = ['question', 'options', 'selected_option']

    def get_options(self, obj):
        # Get all options for the question
        options = MultipleChoiceOption.objects.filter(question=obj.question)
        return MultipleChoiceOptionSerializer(options, many=True).data

    def get_selected_option(self, obj):
        # Return the option text if selected, otherwise None
        return obj.selected_option.option if obj.selected_option else None
