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
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication






@csrf_exempt
def patient_register(request):
    if request.method == "POST":
        print("THIS IS RUNNING!!!!")
        try:
            data = json.loads(request.body.decode('utf-8'))  # Parse JSON request
            print("Received data:", data)  # Debugging

            # Ensure all fields are present
            required_fields = ['email', 'password', 'firstName', 'lastName', 'age']
            for field in required_fields:
                if field not in data or not data[field]:
                    return JsonResponse({'error': f'{field} is required'}, status=400)

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

                # Create JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token

                print("Sending response:", {
                    'message': 'Registration successful',
                    'access': str(access_token),
                    'refresh': str(refresh),
                    'user_id': user.id,
                    'patient_id': patient.id,
                    'firstName': patient.firstName,
                    'lastName': patient.lastName,
                    'email': user.email
                })


                return JsonResponse({
                    'message': 'Registration successful',
                    'access': str(access_token),
                    'refresh': str(refresh),
                    'user_id': user.id,
                    'patient_id': patient.id,
                    'firstName': patient.firstName,
                    'lastName': patient.lastName,
                    'email': user.email
                }, status=201)

            error_details = {
                'user_form_errors': user_form.errors,
                'patient_form_errors': patient_form.errors
            }

            print("Form validation errors:", error_details)
            return JsonResponse({'error': 'Invalid form data', 'details': error_details}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def patient_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return JsonResponse({'error': 'Email and password are required'}, status=400)

            user = authenticate(request, username=email, password=password)

            if user is not None:
                login(request, user)

                try:
                    patient = Patient.objects.get(user=user)
                    refresh = RefreshToken.for_user(user)
                    access_token = refresh.access_token

                    return JsonResponse({
                        'message': 'Login successful',
                        'access': str(access_token),
                        'refresh': str(refresh),
                        'user_id': user.id,
                        'patient_id': patient.id,
                        'firstName': patient.firstName,
                        'lastName': patient.lastName,
                        'email': user.email
                    }, status=200)

                except Patient.DoesNotExist:
                    # Return a message if the patient profile doesn't exist
                    return JsonResponse({
                        'error': 'Patient profile not found'
                    }, status=404)

            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
@login_required
def patient_profile(request):
    patient = Patient.objects.get(user=request.user)
    return render(request, 'profile.html', {'patient': patient})

def delete_all_users(request):
    try:
        # Delete all Patient records
        Patient.objects.all().delete()

        # Delete all User records
        User.objects.all().delete()

        return JsonResponse({'message': 'All users and associated patient records have been deleted successfully.'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)