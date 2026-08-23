from rest_framework import serializers

from .models import SitePage


class SitePageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SitePage
        fields = [
            "page_type",
            "title",
            "content",
            "updated_at",
        ]