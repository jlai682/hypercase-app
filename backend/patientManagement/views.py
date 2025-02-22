from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from .models import Patient
from .forms import PatientForm, UserForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json




@csrf_exempt
def patient_register(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))  # Parse JSON request
            print("Received data:", data)  # Debugging

            # Use email as username
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

                login(request, user)
                return JsonResponse({'message': 'Registration successful'}, status=201)

            return JsonResponse({'error': 'Invalid form data', 'details': user_form.errors}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

# @csrf_exempt
# def patient_login(request):
#     if request.method == "POST":
#         try:
#             data = json.loads(request.body.decode('utf-8'))  # Parse JSON request
#             email = data.get('email')
#             password = data.get('password')

#             if not email or not password:
#                 return JsonResponse({'error': 'Email and password are required'}, status=400)

#             user = authenticate(request, username=email, password=password)

#             if user is not None:
#                 login(request, user)
#                 return JsonResponse({'message': 'Login successful'}, status=200)
#             else:
#                 return JsonResponse({'error': 'Invalid credentials'}, status=401)

#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON'}, status=400)

#     return JsonResponse({'error': 'Invalid request method'}, status=405)


@login_required
def patient_profile(request):
    patient = Patient.objects.get(user=request.user)
    return render(request, 'profile.html', {'patient': patient})
