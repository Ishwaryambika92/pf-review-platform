from rest_framework import permissions, viewsets

from .models import AuditLog
from .serializers import AuditLogSerializer


class IsModerator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_moderator))


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only, staff/moderator only. Filterable by target."""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsModerator]
    filterset_fields = ["target_type", "target_id", "action"]
