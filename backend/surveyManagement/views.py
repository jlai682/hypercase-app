from django.utils.timezone import now
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Survey
from patientManagement.models import Patient
from providerManagement.models import Provider
from datetime import datetime
from .serializers import OpenQuestionSerializer, MultipleChoiceQuestionSerializer
from .models import OpenQuestion, MultipleChoiceOption, MultipleChoiceQuestion, MultipleChoiceResponse, OpenQuestionResponse



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_surveys_by_patient(request, patient_id):
    try:
        # Retrieve all surveys for the given patient
        surveys = Survey.objects.filter(patient__id=patient_id)

        # Manually construct the response data
        survey_data = []
        for survey in surveys:
            survey_data.append({
                "id": survey.id,
                "title": survey.title,
                "issue_date": survey.issue_date,
                "response_date": survey.response_date,
                "provider": survey.provider.id,  # You can return provider's ID or other details
                "patient": survey.patient.id,  # Returning the patient ID
                "status": survey.status
            })
        
        return Response(survey_data, status=status.HTTP_200_OK)

    except Patient.DoesNotExist:
        return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_possible_questions(request):
    open_questions = OpenQuestion.objects.all()
    multiple_choice_questions = MultipleChoiceQuestion.objects.prefetch_related('options').all()

    open_questions_data = OpenQuestionSerializer(open_questions, many=True).data
    multiple_choice_data = MultipleChoiceQuestionSerializer(multiple_choice_questions, many=True).data

    return Response({
        "open_questions": open_questions_data,
        "multiple_choice_questions": multiple_choice_data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_survey(request):
    try:
        provider = Provider.objects.get(user=request.user)
        patient_id = request.data.get('patient_id')
        patient = Patient.objects.get(id=patient_id)

        title = request.data.get('title', 'Untitled Survey')
        open_question_ids = request.data.get('open_question_ids', [])
        mc_question_ids = request.data.get('mc_question_ids', [])

        # Create the Survey
        survey = Survey.objects.create(
            title=title,
            patient=patient,
            provider=provider,
            status = 'sent'
        )

        # Create blank OpenQuestionResponses
        for qid in open_question_ids:
            question = OpenQuestion.objects.get(id=qid)
            OpenQuestionResponse.objects.create(
                survey=survey,
                question=question,
                response=""
            )

        # Create blank MultipleChoiceResponses (with null selected_option if model allows)
        for qid in mc_question_ids:
            question = MultipleChoiceQuestion.objects.get(id=qid)
            MultipleChoiceResponse.objects.create(
                survey=survey,
                question=question,
                selected_option=None  # null allowed in model
            )

        return Response({'message': 'Survey created successfully'}, status=status.HTTP_201_CREATED)

    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
    except Provider.DoesNotExist:
        return Response({'error': 'Provider not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print("Survey creation error:", e)
        return Response({'error': 'Something went wrong'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_surveys_by_authenticated_patient(request):
    try:
        # Get the patient associated with the currently authenticated user
        patient = Patient.objects.get(user=request.user)

        # Retrieve all surveys for the patient
        surveys = Survey.objects.filter(patient=patient)

        survey_data = []
        for survey in surveys:
            survey_data.append({
                "id": survey.id,
                "title": survey.title,
                "issue_date": survey.issue_date,
                "response_date": survey.response_date,
                "status": survey.status,
                "provider": survey.provider.id,
                "patient": survey.patient.id,
            })

        return Response(survey_data, status=status.HTTP_200_OK)

    except Patient.DoesNotExist:
        return Response({"error": "No patient profile found for this user"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_questions_by_survey(request, survey_id):
    try:
        # Fetch the survey based on the given survey_id
        survey = Survey.objects.get(id=survey_id)
        
        # Fetch the open question responses for the survey
        open_responses = OpenQuestionResponse.objects.filter(survey=survey)
        
        # Fetch the multiple choice responses and include the options
        multiple_choice_responses = MultipleChoiceResponse.objects.filter(survey=survey).select_related('question', 'selected_option')
        
        # Format the data to include the options for multiple choice questions
        formatted_multiple_choice_responses = []
        for response in multiple_choice_responses:
            # Get all the options for the associated question
            options = MultipleChoiceOption.objects.filter(question=response.question)
            formatted_multiple_choice_responses.append({
                'question': {
                    'id': response.question.id,  # or any other field you want to include
                    'question_description': response.question.question_description
                },
                'options': [
                    {
                        'id': option.id,
                        'option': option.option
                    } for option in options
                ],
                'selected_option': response.selected_option.option if response.selected_option else None
            })
        
        # Format the open question responses
        formatted_open_responses = []
        for response in open_responses:
            formatted_open_responses.append({
                'question': {
                    'id': response.question.id,  # or any other field you want to include
                    'question_description': response.question.question_description
                },
                'response': response.response
            })

        # Combine the results into a single response
        return JsonResponse({
            'survey_title': survey.title,
            'multiple_choice_responses': formatted_multiple_choice_responses,
            'open_responses': formatted_open_responses
        })
    
    except Survey.DoesNotExist:
        return JsonResponse({'error': 'Survey not found'}, status=404)
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_survey(request, survey_id):
    try:
        survey = Survey.objects.get(id=survey_id)
    except Survey.DoesNotExist:
        return Response({"error": "Survey not found."}, status=status.HTTP_404_NOT_FOUND)

    # Get data from the request
    mc_responses = request.data.get("multiple_choice_responses", [])
    open_responses = request.data.get("open_responses", [])

    # Update multiple choice responses
    for mc in mc_responses:
        question_id = mc.get("question_id")
        selected_option_id = mc.get("selected_option_id")

        try:
            response = MultipleChoiceResponse.objects.get(survey=survey, question__id=question_id)
            selected_option = MultipleChoiceOption.objects.get(id=selected_option_id)
            response.selected_option = selected_option
            response.save()
        except (MultipleChoiceResponse.DoesNotExist, MultipleChoiceOption.DoesNotExist):
            return Response({"error": f"Invalid multiple choice question or option for question_id {question_id}."},
                            status=status.HTTP_400_BAD_REQUEST)

    # Update open question responses
    for oq in open_responses:
        question_id = oq.get("question_id")
        response_text = oq.get("response")

        try:
            response = OpenQuestionResponse.objects.get(survey=survey, question__id=question_id)
            response.response = response_text
            response.save()
        except OpenQuestionResponse.DoesNotExist:
            return Response({"error": f"Invalid open question ID {question_id}."}, status=status.HTTP_400_BAD_REQUEST)

    # Update survey status and response date
    survey.status = 'completed'
    survey.response_date = datetime.now()
    survey.save()

    return Response({"message": "Survey submitted successfully."}, status=status.HTTP_200_OK)

import json

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_survey(request, survey_id):
    try:
        # Fetch the survey using the provided survey ID
        survey = Survey.objects.get(id=survey_id)
    except Survey.DoesNotExist:
        return Response({"error": "Survey not found."}, status=status.HTTP_404_NOT_FOUND)

    # Get data from the request
    mc_responses = request.data.get("multiple_choice_responses", [])
    open_responses = request.data.get("open_responses", {})

    # Process Multiple Choice Responses
    for mc in mc_responses:
        question_id = mc.get("questionObject").get("question").get("id")
        selected_option_id = mc.get("response").get("id")

        try:
            # Retrieve the response object based on the survey and question
            response = MultipleChoiceResponse.objects.get(survey=survey, question__id=question_id)
            selected_option = MultipleChoiceOption.objects.get(id=selected_option_id)
            response.selected_option = selected_option
            response.save()
        except (MultipleChoiceResponse.DoesNotExist, MultipleChoiceOption.DoesNotExist):
            return Response({"error": f"Invalid multiple choice question or option for question_id {question_id}."},
                            status=status.HTTP_400_BAD_REQUEST)

    # Process Open Question Responses
    for key, oq in open_responses.items():  # Loop over the dictionary (0, 1, etc.)
        try:
            # Ensure that questionObject is not a string
            if isinstance(oq.get("questionObject"), str):
                question_object = json.loads(oq.get("questionObject"))
            else:
                question_object = oq.get("questionObject")
            
            question_id = question_object.get("question").get("id")
            response_text = oq.get("response")

            try:
                # Retrieve the response object based on the survey and open question
                response = OpenQuestionResponse.objects.get(survey=survey, question__id=question_id)
                response.response = response_text
                response.save()
            except OpenQuestionResponse.DoesNotExist:
                return Response({"error": f"Invalid open question ID {question_id}."}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({"error": f"Error processing open question response: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    # Update survey status and response date
    survey.status = 'completed'
    survey.response_date = datetime.now()
    survey.save()

    # Return a success message
    return Response({"message": "Survey submitted successfully."}, status=status.HTTP_200_OK)
