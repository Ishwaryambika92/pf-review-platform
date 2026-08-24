from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from rest_framework import serializers

from notifications.models import Notification

from .models import (
    HelpfulVote,
    Review,
    ReviewProof,
    ReviewRating,
    ReviewVerification,
)


def _anonymous_id(request):
    """
    Reads the browser-generated anonymous client token from the
    X-Anonymous-Id header.

    This is used only to prevent duplicate submissions from the
    same browser. It is not displayed publicly.
    """
    return (request.headers.get("X-Anonymous-Id") or "").strip()[:64]


# ============================================================
# REVIEW RATING
# ============================================================

class ReviewRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewRating
        fields = [
            "overall",
            "quality",
            "communication",
            "transparency",
            "value_for_money",
            "professionalism",
            "response_time",
        ]


# ============================================================
# REVIEW PROOF
# ============================================================

class ReviewProofMetaSerializer(serializers.ModelSerializer):
    """
    Metadata only.

    The actual uploaded file is never exposed through this serializer.
    Downloading proof requires the separate permission-checked endpoint.
    """

    class Meta:
        model = ReviewProof
        fields = [
            "original_filename",
            "content_type",
            "size_bytes",
            "uploaded_at",
        ]
        read_only_fields = fields

# ============================================================
# PUBLIC REVIEW LIST
# ============================================================

class ReviewListSerializer(serializers.ModelSerializer):
    """
    Public-facing review serializer.

    Original proof is NEVER exposed.

    Only tells the frontend whether a redacted
    proof preview is available.
    """

    rating = ReviewRatingSerializer(read_only=True)

    display_name = serializers.CharField(
        read_only=True
    )

    is_verified = serializers.BooleanField(
        read_only=True
    )

    proof_verified = serializers.BooleanField(
        read_only=True
    )

    proof_preview_available = (
        serializers.SerializerMethodField()
    )

    helpful_count = serializers.SerializerMethodField()

    service_name = serializers.CharField(
        source="service.name",
        read_only=True,
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "reference_id",
            "title",
            "body",
            "pros",
            "cons",
            "would_recommend",
            "display_name",
            "service_name",
            "service_date",
            "status",
            "language",
            "is_verified",
            "proof_verified",
            "proof_preview_available",
            "rating",
            "helpful_count",
            "created_at",
        ]

        read_only_fields = fields

    def get_proof_preview_available(self, obj):
        proof = getattr(
            obj,
            "proof",
            None,
        )

        if not proof:
            return False

        if not proof.preview_file:
            return False

        return obj.status in (
            "verified",
            "published_unverified",
        )

    def get_helpful_count(self, obj):
        return obj.helpful_votes.count()
# ============================================================
# CREATE REVIEW
# ============================================================

class ReviewCreateSerializer(serializers.ModelSerializer):
    """
    Creates a new review.

    Login is NOT required.

    Every new review is automatically created with:

        status = pending

    The client cannot choose the review status.

    After the review is created, all staff/moderator users receive
    a notification saying:

        "New review submitted"

    Report functionality is intentionally removed.
    """

    rating = ReviewRatingSerializer()

    reviewer_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=80,
    )

    language = serializers.ChoiceField(
        choices=["en", "te", "mixed"],
        required=False,
        default="en",
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "reference_id",
            "service",
            "title",
            "body",
            "pros",
            "cons",
            "would_recommend",
            "is_anonymous",
            "reviewer_name",
            "language",
            "service_date",
            "allow_privacy_safe_indicator",
            "rating",
            "status",
        ]

        read_only_fields = [
            "id",
            "reference_id",
            "status",
        ]

        extra_kwargs = {
            "title": {
                "error_messages": {
                    "blank": "Please add a short review title.",
                }
            },
            "body": {
                "error_messages": {
                    "blank": "Please describe your experience.",
                }
            },
        }

    # --------------------------------------------------------
    # SERVICE DATE VALIDATION
    # --------------------------------------------------------

    def validate_service_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError(
                "Service date can't be in the future."
            )

        return value

    # --------------------------------------------------------
    # REVIEW BODY VALIDATION
    # --------------------------------------------------------

    def validate_body(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Please share a bit more detail about your experience."
            )

        return value

    # --------------------------------------------------------
    # DUPLICATE + RATE LIMIT VALIDATION
    # --------------------------------------------------------

    def validate(self, attrs):
        request = self.context["request"]

        service = attrs.get("service")
        service_date = attrs.get("service_date")

        anon_id = _anonymous_id(request)

        # ----------------------------------------------------
        # DUPLICATE REVIEW CHECK
        # ----------------------------------------------------

        if request.user.is_authenticated:

            dupe = Review.objects.filter(
                user=request.user,
                service=service,
                service_date=service_date,
            ).exists()

        elif anon_id:

            dupe = Review.objects.filter(
                anonymous_id=anon_id,
                service=service,
                service_date=service_date,
            ).exists()

        else:

            dupe = False

        if dupe:
            raise serializers.ValidationError(
                "A review for this service on this date has already "
                "been submitted from this browser."
            )

        # ----------------------------------------------------
        # VELOCITY / RATE LIMIT CHECK
        # ----------------------------------------------------

        recency_filter = {
            "status": "pending",
            "created_at__gte": (
                timezone.now()
                - timezone.timedelta(hours=24)
            ),
        }

        if request.user.is_authenticated:

            recent_pending = Review.objects.filter(
                user=request.user,
                **recency_filter,
            ).count()

        elif anon_id:

            recent_pending = Review.objects.filter(
                anonymous_id=anon_id,
                **recency_filter,
            ).count()

        else:

            recent_pending = 0

        if recent_pending >= 5:
            raise serializers.ValidationError(
                "Several reviews from this browser are already "
                "awaiting verification. Please wait before "
                "submitting more."
            )

        return attrs

    # --------------------------------------------------------
    # CREATE REVIEW + STAFF NOTIFICATION
    # --------------------------------------------------------

    def create(self, validated_data):
        # Extract nested rating data
        rating_data = validated_data.pop("rating")

        # Never allow client to control status
        validated_data.pop("status", None)

        request = self.context["request"]

        # ----------------------------------------------------
        # CREATE REVIEW
        # ----------------------------------------------------

        review = Review.objects.create(
            user=(
                request.user
                if request.user.is_authenticated
                else None
            ),

            anonymous_id=(
                _anonymous_id(request)
                if not request.user.is_authenticated
                else ""
            ),

            status="pending",

            **validated_data,
        )

        # ----------------------------------------------------
        # CREATE REVIEW RATING
        # ----------------------------------------------------

        ReviewRating.objects.create(
            review=review,
            **rating_data,
        )

        # ----------------------------------------------------
        # STAFF / MODERATOR NOTIFICATION
        # ----------------------------------------------------

        User = get_user_model()

        staff_users = User.objects.filter(
            models.Q(is_staff=True)
            | models.Q(is_moderator=True)
        ).distinct()

        for staff_user in staff_users:

            Notification.objects.create(
                user=staff_user,

                # IMPORTANT:
                # This must exist in notifications/models.py
                type=Notification.Type.REVIEW_SUBMITTED,

                message="Review needs moderation",

                related_review_id=review.id,
            )

        return review


# ============================================================
# REVIEW DETAIL
# ============================================================

class ReviewDetailSerializer(ReviewListSerializer):

    proof = ReviewProofMetaSerializer(
        read_only=True,
    )

    verification_reason = serializers.SerializerMethodField()

    class Meta(ReviewListSerializer.Meta):

        fields = ReviewListSerializer.Meta.fields + [
            "proof",
            "verification_reason",
        ]

    def get_verification_reason(self, obj):

        request = self.context.get("request")

        if not request:
            return None

        if not request.user.is_authenticated:
            return None

        if not (
            request.user.is_staff
            or request.user.is_moderator
        ):
            return None

        verification = getattr(
            obj,
            "verification",
            None,
        )

        return (
            verification.reason
            if verification
            else None
        )


# ============================================================
# MY REVIEWS
# ============================================================

class MyReviewSerializer(ReviewDetailSerializer):
    """
    Serializer for the logged-in user's own reviews.
    """

    pass


# ============================================================
# HELPFUL VOTE
# ============================================================

class HelpfulVoteSerializer(serializers.ModelSerializer):

    class Meta:
        model = HelpfulVote

        fields = [
            "id",
            "review",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_review(self, review):

        request = self.context["request"]

        anon_id = _anonymous_id(request)

        # ----------------------------------------------------
        # LOGGED-IN USER
        # ----------------------------------------------------

        if request.user.is_authenticated:

            exists = HelpfulVote.objects.filter(
                review=review,
                user=request.user,
            ).exists()

        # ----------------------------------------------------
        # ANONYMOUS USER
        # ----------------------------------------------------

        elif anon_id:

            exists = HelpfulVote.objects.filter(
                review=review,
                anonymous_id=anon_id,
            ).exists()

        else:

            exists = False

        if exists:
            raise serializers.ValidationError(
                "You've already marked this review as helpful."
            )

        return review

    def create(self, validated_data):

        request = self.context["request"]

        return HelpfulVote.objects.create(

            user=(
                request.user
                if request.user.is_authenticated
                else None
            ),

            anonymous_id=(
                _anonymous_id(request)
                if not request.user.is_authenticated
                else ""
            ),

            **validated_data,
        )