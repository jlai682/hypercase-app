from rest_framework.routers import DefaultRouter
from signatures.api.urls import sig_router
from django.urls import path, include

router = DefaultRouter()

# signatures
router.registry.extend(sig_router.registry)
urlpatterns = [
    path('', include(router.urls))
]
