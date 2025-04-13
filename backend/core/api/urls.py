from rest_framework.routers import DefaultRouter
from signatures.api.urls import sig_router
from recordings.urls import router as recordings_router
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()

# Add app routers to main router
router.registry.extend(sig_router.registry)
router.registry.extend(recordings_router.registry)

urlpatterns = [
    path('', include(router.urls))
]

# Add media URLs for serving uploaded files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
