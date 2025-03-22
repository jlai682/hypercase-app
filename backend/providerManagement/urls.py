from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.providerRegister, name='provider_register'),
    path('login/', views.provider_login, name = 'provider_login'),
    path('search_patient/', views.search_patient_by_email, name = 'search_patient_by_email'),
]
