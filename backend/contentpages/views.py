from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import SitePage
from .serializers import SitePageSerializer


class SitePageDetailView(generics.RetrieveAPIView):
    serializer_class = SitePageSerializer
    permission_classes = [AllowAny]
    lookup_field = "page_type"

    def get_queryset(self):
        return SitePage.objects.filter(is_published=True)