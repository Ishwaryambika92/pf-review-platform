from rest_framework import serializers

from reviews.models import Review, ReviewVerification


class ModerationReviewSerializer(serializers.ModelSerializer):
    """Full-detail shape for the moderation queue — includes fields never
    shown on public listings (reporter counts, raw status, service_date)."""
    reviewer_username = serializers.CharField(source="user.username", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)
    rating_overall = serializers.IntegerField(source="rating.overall", read_only=True)
    has_proof = serializers.SerializerMethodField()
    report_count = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "reference_id", "reviewer_username", "service_name", "title", "body",
            "rating_overall", "status", "service_date", "has_proof", "report_count", "created_at",
        ]
        read_only_fields = fields

    def get_has_proof(self, obj):
        return hasattr(obj, "proof")

    def get_report_count(self, obj):
        return obj.reports.count()


class VerificationDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewVerification
        fields = ["decision", "checklist", "reason", "internal_notes"]

    def create(self, validated_data):
        review = self.context["review"]
        moderator = self.context["request"].user
        verification, _ = ReviewVerification.objects.update_or_create(
            review=review,
            defaults={**validated_data, "moderator": moderator},
        )
        return verification
