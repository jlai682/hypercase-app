from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views



urlpatterns = [
    path('register/', views.patient_register, name='patient_register'),
    path('profile/', views.patient_profile, name='patient_profile'),
    path('login/', views.patient_login, name = 'patient_login'),
    #path('admin/', admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
