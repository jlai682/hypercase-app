from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.providerRegister, name='provider_register'),
    path('login/', views.provider_login, name = 'provider_login'),
    path('search_patient/', views.search_patient_by_email, name = 'search_patient_by_email'),
    path('connect/', views.connect_provider_to_patient, name='connect_provider_patient'),
    path("myPatients/", views.get_provider_patient_connections, name="provider_patient_connections"),
    path("providerInfo/", views.get_provider_info, name = "provider_info"),
]
