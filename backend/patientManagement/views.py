import re
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from .models import Patient
from .forms import PatientForm, UserForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
@permission_classes([AllowAny])
def patient_register(request):
    try:
        data = request.data

        # Validate required fields
        required_fields = ['unique_id', 'password', 'age']
        for field in required_fields:
            if field not in data or not data[field]:
                return Response(
                    {'error': f'{field} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Validate unique_id is exactly 10 digits
        if not re.match(r'^\d{10}$', str(data['unique_id'])):
            return Response(
                {'error': 'Unique ID must be exactly 10 digits'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate age >= 18
        if int(data['age']) < 18:
            return Response(
                {'error': 'You must be 18 or older to use this app'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check uniqueness
        if Patient.objects.filter(unique_id=data['unique_id']).exists():
            return Response(
                {'error': 'An account with this ID already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use unique_id as the Django username
        data['username'] = data['unique_id']

        user_form = UserForm(data)
        patient_form = PatientForm(data)

        if user_form.is_valid() and patient_form.is_valid():
            user = user_form.save(commit=False)
            user.set_password(user_form.cleaned_data['password'])
            user.save()

            patient = patient_form.save(commit=False)
            patient.user = user
            patient.save()

            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Registration successful',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.id,
                'patient_id': patient.id,
                'unique_id': patient.unique_id,
            }, status=status.HTTP_201_CREATED)

        return Response({
            'error': 'Invalid form data',
            'details': {
                'user_form_errors': user_form.errors,
                'patient_form_errors': patient_form.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def patient_login(request):
    try:
        data = request.data
        unique_id = data.get('unique_id')
        password = data.get('password')

        if not unique_id or not password:
            return Response(
                {'error': 'ID and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate unique_id is exactly 10 digits
        if not re.match(r'^\d{10}$', str(unique_id)):
            return Response(
                {'error': 'Please enter a valid 10-digit ID'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=unique_id, password=password)

        if user is not None:
            try:
                patient = Patient.objects.get(user=user)
                refresh = RefreshToken.for_user(user)

                return Response({
                    'message': 'Login successful',
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user_id': user.id,
                    'patient_id': patient.id,
                    'unique_id': patient.unique_id,
                }, status=status.HTTP_200_OK)

            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Patient profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {'error': 'Invalid ID or password. Please check your credentials and try again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_profile(request):
    try:
        patient = Patient.objects.get(user=request.user)
        patient_data = {
            "unique_id": patient.unique_id,
            "age": patient.age,
            "medical_history": patient.medical_history,
            "address": patient.address,
            "phone_number": patient.phone_number,
            "id": patient.id,
            "date_joined": patient.user.date_joined.isoformat(),
        }
        return Response(patient_data)
    except Patient.DoesNotExist:
        return Response({"error": "Patient profile not found."}, status=404)
