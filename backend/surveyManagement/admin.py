from django.contrib import admin
from .models import (
    Survey,
    OpenQuestion,
    OpenQuestionResponse,
    MultipleChoiceQuestion,
    MultipleChoiceOption,
    MultipleChoiceResponse
)


class OpenQuestionResponseInline(admin.TabularInline):
    model = OpenQuestionResponse
    extra = 0


class MultipleChoiceResponseInline(admin.TabularInline):
    model = MultipleChoiceResponse
    extra = 0


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'patient', 'provider', 'status', 'issue_date', 'response_date')
    list_filter = ('status', 'issue_date', 'provider')
    search_fields = ('title', 'patient__user__username', 'provider__user__username')
    inlines = [OpenQuestionResponseInline, MultipleChoiceResponseInline]


class MultipleChoiceOptionInline(admin.TabularInline):
    model = MultipleChoiceOption
    extra = 0


@admin.register(OpenQuestion)
class OpenQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'question_description')
    search_fields = ('question_description',)


@admin.register(MultipleChoiceQuestion)
class MultipleChoiceQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'question_description')
    search_fields = ('question_description',)
    inlines = [MultipleChoiceOptionInline]


@admin.register(OpenQuestionResponse)
class OpenQuestionResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'survey', 'question', 'response')
    list_filter = ('survey__status',)


@admin.register(MultipleChoiceResponse)
class MultipleChoiceResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'survey', 'question', 'selected_option')
    list_filter = ('survey__status',)
