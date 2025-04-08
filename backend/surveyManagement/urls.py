from django.urls import path
from . import views

urlpatterns = [
    path('create_survey/', views.create_survey, name='create_survey'),
    path('get_surveys/<int:patient_id>/', views.get_surveys_by_patient, name='get_surveys_by_patient'),
    path('get_all_questions/', views.get_all_possible_questions, name='get_all_questions'),
    path('get_surveys_by_patient/', views.get_surveys_by_authenticated_patient, name = "get_surveys_by_authenticated_patient"),
    path('survey_questions/<int:survey_id>/', views.get_questions_by_survey, name='survey_responses'),
     path('submit/<int:survey_id>/', views.submit_survey, name='submit_survey'),

]
