from rest_framework.routers import DefaultRouter

from .views import ServiceCategoryViewSet, ServiceViewSet

router = DefaultRouter()
router.register("categories", ServiceCategoryViewSet, basename="servicecategory")
router.register("", ServiceViewSet, basename="service")

urlpatterns = router.urls
