from rest_framework import permissions, viewsets

from .models import Service, ServiceCategory
from .serializers import ServiceCategorySerializer, ServiceDetailSerializer, ServiceListSerializer


class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public, read-only. Services themselves are managed by staff via the
    Django admin / a future internal endpoint — not created by end users,
    since they're the entities being reviewed.
    """
    queryset = Service.objects.select_related("category").all()
    permission_classes = [permissions.AllowAny]
    filterset_fields = ["category"]
    search_fields = ["name", "description", "location"]
    ordering_fields = ["cached_average_rating", "cached_total_reviews", "name"]
    lookup_field = "slug"

    def get_serializer_class(self):
        return ServiceDetailSerializer if self.action == "retrieve" else ServiceListSerializer
