from rest_framework import serializers

from .models import Service, ServiceCategory


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "slug", "description"]


class ServiceListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    average_rating = serializers.DecimalField(source="cached_average_rating", max_digits=3, decimal_places=2, read_only=True)
    total_reviews = serializers.IntegerField(source="cached_total_reviews", read_only=True)
    verified_reviews = serializers.IntegerField(source="cached_verified_reviews", read_only=True)

    class Meta:
        model = Service
        fields = ["id", "slug", "name", "category_name", "location", "average_rating", "total_reviews", "verified_reviews"]
        read_only_fields = fields


class ServiceDetailSerializer(ServiceListSerializer):
    rating_distribution = serializers.SerializerMethodField()

    class Meta(ServiceListSerializer.Meta):
        fields = ServiceListSerializer.Meta.fields + [
            "description", "process_info", "common_requirements", "contact_info", "rating_distribution",
        ]

    def get_rating_distribution(self, obj):
        return obj.rating_distribution()
