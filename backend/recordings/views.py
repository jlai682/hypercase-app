from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Recording
from .serializers import RecordingSerializer
from patientManagement.models import Patient
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
import base64
from django.core.files.base import ContentFile
import os
from django.conf import settings

@csrf_exempt
@api_view(['POST'])
def upload_recording(request):
    """
    Upload a new recording for a patient.
    
    Expected JSON format:
    {
        "name": "Recording name",
        "audio_data": "base64 encoded audio data",
        "duration": 12.5,
        "patient_id": 1
    }
    """
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['name', 'audio_data', 'patient_id']
        for field in required_fields:
            if field not in data:
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the patient
        try:
            patient = Patient.objects.get(id=data['patient_id'])
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Decode the base64 audio data
        try:
            audio_data = data['audio_data']
            if audio_data.startswith('data:audio'):
                # Handle data URL format
                format_info, encoded_data = audio_data.split(',', 1)
                audio_data = encoded_data
            
            audio_content = ContentFile(base64.b64decode(audio_data), name=f"{data['name']}.m4a")
        except Exception as e:
            return Response({'error': f'Invalid audio data: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the recording
        recording = Recording(
            name=data['name'],
            patient=patient,
            duration=data.get('duration', 0)
        )
        recording.file.save(f"{data['name']}.m4a", audio_content, save=False)
        recording.save()
        
        serializer = RecordingSerializer(recording, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def list_recordings(request, patient_id=None):
    """
    List all recordings or recordings for a specific patient.
    """
    try:
        if patient_id:
            try:
                patient = Patient.objects.get(id=patient_id)
                recordings = Recording.objects.filter(patient=patient).order_by('-date_created')
            except Patient.DoesNotExist:
                return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            recordings = Recording.objects.all().order_by('-date_created')
        
        serializer = RecordingSerializer(recordings, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'DELETE'])
def recording_detail(request, recording_id):
    """
    Retrieve or delete a specific recording.
    """
    try:
        recording = Recording.objects.get(id=recording_id)
    except Recording.DoesNotExist:
        return Response({'error': 'Recording not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = RecordingSerializer(recording, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        # Delete the file from storage
        if recording.file and os.path.isfile(recording.file.path):
            os.remove(recording.file.path)
        
        # Delete the record
        recording.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
