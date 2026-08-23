from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from reviews.models import Review, ReviewStatus

from .serializers import ModerationReviewSerializer, VerificationDecisionSerializer


class IsModerator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_moderator))


class ModerationQueueView(generics.ListAPIView):
    """Pending / under-review items awaiting a decision, oldest first."""
    serializer_class = ModerationReviewSerializer
    permission_classes = [IsModerator]
    filterset_fields = ["status", "service"]

    def get_queryset(self):
        return (
            Review.objects.filter(status__in=[ReviewStatus.PENDING, ReviewStatus.UNDER_REVIEW, ReviewStatus.NEEDS_INFO])
            .select_related("user", "service", "rating")
            .order_by("created_at")
        )


class ClaimForReviewView(APIView):
    """Moves a review from Pending -> Under Review so two moderators
    don't work the same item simultaneously."""
    permission_classes = [IsModerator]

    def post(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)
        if review.status == ReviewStatus.PENDING:
            review.status = ReviewStatus.UNDER_REVIEW
            review.save(update_fields=["status", "updated_at"])
        return Response(ModerationReviewSerializer(review).data)


class VerificationDecisionView(APIView):
    """
    The single write path that can move a review to Verified / Rejected /
    Needs Info / Published Unverified. Creating a ReviewVerification here
    fires the reviews.signals handler, which updates Review.status,
    recalculates the service's public stats, notifies the user, and
    writes an AuditLog entry — all server-side.
    """
    permission_classes = [IsModerator]

    def post(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)
        serializer = VerificationDecisionSerializer(data=request.data, context={"request": request, "review": review})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ModerationReviewSerializer(review).data)
