from django.urls import path
from . import views

urlpatterns = [
    # Auth endpoints (no auth required)
    path('register/', views.providerRegister, name='provider_register'),
    path('login/', views.provider_login, name = 'provider_login'),

    # Provider info (auth required)
    path("providerInfo/", views.get_provider_info, name = "provider_info"),

    # Patient management (auth required)
    path('search_patient/', views.search_patient_by_unique_id, name = 'search_patient_by_unique_id'),
    path('connect/', views.connect_provider_to_patient, name='connect_provider_patient'),
    path("myPatients/", views.get_provider_patient_connections, name="provider_patient_connections"),
    path("delete_patient_provider_connection/", views.delete_patient_provider_connection, name='delete_patient_provider_connection'),
    
    # For patients to find their provider
    path("get_provider_by_patient/", views.get_provider_by_patient, name = "provider_by_patient"),

    # Search all providers (for patients)
    path("search/", views.search_providers, name = "search_providers"),

]

