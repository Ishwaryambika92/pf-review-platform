from django.conf import settings
from django.db.models import Q
from django.http import FileResponse, Http404

from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from audit.models import AuditLog

from .models import (
    HelpfulVote,
    Review,
    ReviewProof,
    ReviewStatus,
)
from .permissions import ReviewAccessPermission
from .serializers import (
    HelpfulVoteSerializer,
    ReviewCreateSerializer,
    ReviewDetailSerializer,
    ReviewListSerializer,
)


# ============================================================
# REVIEWS
# ============================================================

class ReviewViewSet(viewsets.ModelViewSet):
    """
    Review API.

    GET:
        Public users can see only verified/published reviews.

    Staff/moderators:
        Can see all reviews, including pending and rejected reviews.

    POST:
        Anyone can submit a review without logging in.

    New reviews always start as:
        status = pending

    Report functionality has been completely removed.
    """

    permission_classes = [ReviewAccessPermission]

    filterset_fields = [
        "service",
        "status",
    ]

    search_fields = [
        "title",
        "body",
        "service__name",
    ]

    ordering_fields = [
        "created_at",
        "rating__overall",
    ]

    throttle_classes = [
        ScopedRateThrottle,
    ]

    def get_throttles(self):
        """
        Apply the review-create throttle only to POST requests.
        """

        self.throttle_scope = (
            "review-create"
            if self.request.method == "POST"
            else None
        )

        if self.throttle_scope:
            return super().get_throttles()

        return []

    def get_queryset(self):
        """
        Staff/moderators can see everything.

        Normal visitors can see only:
            - verified reviews
            - published-unverified reviews
        """

        qs = (
            Review.objects
            .select_related(
                "service",
                "user__profile",
                "rating",
                "verification",
            )
            .prefetch_related(
                "helpful_votes",
            )
        )

        user = self.request.user

        # ----------------------------------------------------
        # STAFF / MODERATOR
        # ----------------------------------------------------

        if user.is_authenticated and (
            user.is_staff
            or user.is_moderator
        ):
            return qs

        # ----------------------------------------------------
        # PUBLIC USERS
        # ----------------------------------------------------

        public_q = Q(
            status__in=[
                ReviewStatus.VERIFIED,
                ReviewStatus.PUBLISHED_UNVERIFIED,
            ]
        )

        return qs.filter(public_q)

    def get_serializer_class(self):
        """
        Select serializer according to the action.
        """

        if self.action == "create":
            return ReviewCreateSerializer

        if self.action == "retrieve":
            return ReviewDetailSerializer

        return ReviewListSerializer

    def perform_update(self, serializer):
        """
        Only staff/moderators can update reviews.
        """

        serializer.save()

    def perform_destroy(self, instance):
        """
        Staff/moderators can delete reviews.

        Every deletion is recorded in the audit log.
        """

        AuditLog.record(
            actor=self.request.user,
            action="review_deleted",
            target=instance,
            meta={},
        )

        instance.delete()


# ============================================================
# MY REVIEWS
# ============================================================

class MyReviewsView(generics.ListAPIView):
    """
    Kept for authenticated users/staff testing.

    Normal public users do not need this because review submission
    does not require an account.
    """

    serializer_class = ReviewDetailSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            Review.objects
            .filter(
                user=self.request.user,
            )
            .select_related(
                "service",
                "rating",
                "verification",
                "proof",
            )
        )


# ============================================================
# PROOF UPLOAD
# ============================================================

class ProofUploadView(APIView):
    """
    Upload proof for a pending review.

    Login is not required.

    The review UUID acts as the capability token.
    """

    permission_classes = [
        permissions.AllowAny,
    ]

    def post(self, request, review_id):

        review = (
            Review.objects
            .filter(id=review_id)
            .first()
        )

        if not review:
            raise Http404

        # ----------------------------------------------------
        # ONLY PENDING REVIEWS
        # ----------------------------------------------------

        if review.status != ReviewStatus.PENDING:
            raise ValidationError(
                "Proof can only be attached while the review "
                "is pending verification."
            )

        # ----------------------------------------------------
        # ONLY ONE PROOF
        # ----------------------------------------------------

        if hasattr(review, "proof"):
            raise ValidationError(
                "Proof has already been uploaded for this review."
            )

        # ----------------------------------------------------
        # FILE REQUIRED
        # ----------------------------------------------------

        f = request.FILES.get("file")

        if not f:
            raise ValidationError(
                "No file provided."
            )

        # ----------------------------------------------------
        # FILE SIZE
        # ----------------------------------------------------

        if f.size > settings.PROOF_MAX_SIZE_BYTES:
            raise ValidationError(
                f"File exceeds the "
                f"{settings.PROOF_MAX_SIZE_BYTES // (1024 * 1024)}MB limit."
            )

        # ----------------------------------------------------
        # FILE TYPE
        # ----------------------------------------------------

        if f.content_type not in settings.PROOF_ALLOWED_CONTENT_TYPES:
            raise ValidationError(
                "Only JPG, PNG or PDF files are accepted."
            )

        # ----------------------------------------------------
        # CREATE PROOF
        # ----------------------------------------------------

        proof = ReviewProof.objects.create(
            review=review,
            file=f,
            original_filename=f.name,
            content_type=f.content_type,
            size_bytes=f.size,
        )

        # ----------------------------------------------------
        # AUDIT LOG
        # ----------------------------------------------------

        AuditLog.record(
            actor=(
                request.user
                if request.user.is_authenticated
                else None
            ),
            action="proof_uploaded",
            target=review,
            meta={
                "filename": f.name,
            },
        )

        return Response(
            {
                "detail": "Proof uploaded.",
                "original_filename": proof.original_filename,
                "size_bytes": proof.size_bytes,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# PROOF DOWNLOAD
# ============================================================

class ProofDownloadView(APIView):
    """
    Only authenticated staff/moderators can download proof.

    Original proof files are never publicly exposed.
    """

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request, review_id):

        review = (
            Review.objects
            .select_related("proof")
            .filter(id=review_id)
            .first()
        )

        if not review or not hasattr(review, "proof"):
            raise Http404

        # ----------------------------------------------------
        # STAFF / MODERATOR ONLY
        # ----------------------------------------------------

        is_staff = (
            request.user.is_staff
            or request.user.is_moderator
        )

        if not is_staff:
            raise PermissionDenied(
                "You don't have access to this proof."
            )

        # ----------------------------------------------------
        # AUDIT LOG
        # ----------------------------------------------------

        AuditLog.record(
            actor=request.user,
            action="proof_viewed",
            target=review,
            meta={},
        )

        # ----------------------------------------------------
        # RETURN FILE
        # ----------------------------------------------------

        proof = review.proof

        return FileResponse(
            proof.file.open("rb"),
            content_type=proof.content_type,
            filename=proof.original_filename,
        )


# ============================================================
# HELPFUL VOTES
# ============================================================

class HelpfulVoteViewSet(viewsets.ModelViewSet):
    """
    Anyone can mark a review as helpful.

    Login is not required.

    Duplicate votes are prevented using either:
        - logged-in user
        - anonymous browser ID
    """

    serializer_class = HelpfulVoteSerializer

    permission_classes = [
        permissions.AllowAny,
    ]

    http_method_names = [
        "post",
        "delete",
        "get",
        "head",
    ]

    throttle_classes = [
        ScopedRateThrottle,
    ]

    throttle_scope = "helpful-vote"

    def get_queryset(self):
        """
        Logged-in users can access their own votes.

        Anonymous users are handled directly using X-Anonymous-Id
        inside the serializer/destroy method.
        """

        if self.request.user.is_authenticated:
            return HelpfulVote.objects.filter(
                user=self.request.user,
            )

        return HelpfulVote.objects.none()

    def destroy(self, request, *args, **kwargs):

        review_id = kwargs.get("pk")

        anon_id = (
            request.headers.get("X-Anonymous-Id")
            or ""
        ).strip()[:64]

        # ----------------------------------------------------
        # LOGGED-IN USER
        # ----------------------------------------------------

        if request.user.is_authenticated:

            vote = (
                HelpfulVote.objects
                .filter(
                    user=request.user,
                    review_id=review_id,
                )
                .first()
            )

        # ----------------------------------------------------
        # ANONYMOUS USER
        # ----------------------------------------------------

        elif anon_id:

            vote = (
                HelpfulVote.objects
                .filter(
                    anonymous_id=anon_id,
                    review_id=review_id,
                )
                .first()
            )

        else:

            vote = None

        # ----------------------------------------------------
        # DELETE VOTE
        # ----------------------------------------------------

        if vote:
            vote.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )