from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from .models import Patient
from .forms import PatientForm, UserForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
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
        required_fields = ['email', 'password', 'firstName', 'lastName', 'age']
        for field in required_fields:
            if field not in data or not data[field]:
                return Response(
                    {'error': f'{field} is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if '@' not in data['email']:
            return Response(
                {'error': 'Please enter a valid email address'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=data['email']).exists():
            return Response(
                {'error': 'An account with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data['username'] = data['email']
        
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
                'firstName': patient.firstName,
                'lastName': patient.lastName,
                'email': user.email
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
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if '@' not in email:
            return Response(
                {'error': 'Please enter a valid email address'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=email, password=password)
        
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
                    'firstName': patient.firstName,
                    'lastName': patient.lastName,
                    'email': user.email
                }, status=status.HTTP_200_OK)
            
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Patient profile not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {'error': 'Invalid email or password. Please check your credentials and try again.'},
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
            "firstName": patient.firstName,
            "lastName": patient.lastName,
            "age": patient.age,
            "medical_history": patient.medical_history,
            "address": patient.address,
            "phone_number": patient.phone_number,
            "email": patient.user.email,
            "id": patient.id,
        }
        return Response(patient_data)
    except Patient.DoesNotExist:
        return Response({"error": "Patient profile not found."}, status=404)

def delete_all_users(request):
    try:
        # Delete all Patient records
        Patient.objects.all().delete()

        # Delete all User records
        User.objects.all().delete()

        return JsonResponse({'message': 'All users and associated patient records have been deleted successfully.'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
