from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from .models import Provider
from .forms import ProviderForm, UserForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from django.contrib.auth.models import User

from patientManagement.models import Patient



@csrf_exempt
def providerRegister(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            print("Received data:", data)

            required_fields = ['email', 'password', 'firstName', 'lastName', 'age']
            for field in required_fields:
                if field not in data or not data[field]:
                    return JsonResponse({'error': f'{field} is required'}, status=400)
                
                data['username'] = data['email']

                user_form = UserForm(data)
                provider_form = ProviderForm(data)

                if user_form.is_valid() and provider_form.is_valid():
                    user = user_form.save(commit=False)
                    user.set_password(user_form.cleaned_data['password'])
                    user.save()

                    provider = provider_form.save(commit=False)
                    provider.user = user
                    provider.save()

                    login(request, user)
                    return JsonResponse({'message': 'Registration successful'}, status=201)
                
            error_details = {
                'user_form_errors': user_form.errors,
                'patient_form_errors': provider_form.errors
            }

            print("Form validation errors:", error_details)
            
            return JsonResponse({'error': 'Invalid form data', 'details': error_details}, status=400)
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def provider_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return JsonResponse({'error': 'Email and password are required'}, status=400)
            
            user = authenticate(request, username = email, password=password)

            if user is not None:
                login(request, user)
                return JsonResponse({'message': 'Login successful'}, status=200)
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def search_patient_by_email(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')

            if not email:
                return JsonResponse({'error': 'Email is required'}, status=400)

            patient = Patient.search_by_email(email)

            if patient:
                # Optionally, you can return specific fields, for example:
                patient_data = {
                    'firstName': patient.firstName,
                    'lastName': patient.lastName,
                    'age': patient.age,
                    'medical_history': patient.medical_history,
                    'address': patient.address,
                    'phone_number': patient.phone_number,
                    'email': patient.email
                }
                return JsonResponse({'patient': patient_data}, status=200)
            else:
                return JsonResponse({'error': 'Patient not found'}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)