import logging

from django.conf import settings
from django.db.models import Q
from django.http import FileResponse, Http404
from django.utils import timezone

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


logger = logging.getLogger(__name__)


# ============================================================
# REVIEWS
# ============================================================

class ReviewViewSet(viewsets.ModelViewSet):
    """
    Review API.

    GET:
        Public users can see only verified/published reviews.

    Staff/moderators:
        Can see all reviews, including pending and rejected.

    POST:
        Anyone can submit a review without logging in.

    New reviews always start as:
        status = pending

    Report functionality has been completely removed.
    """

    permission_classes = [
        ReviewAccessPermission
    ]

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
        ScopedRateThrottle
    ]

    def get_throttles(self):
        """
        Apply review-create throttle only to POST requests.
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

        Every deletion is recorded in audit log.
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
    Authenticated user's own reviews.
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
# ORIGINAL PROOF UPLOAD
# ============================================================

class ProofUploadView(APIView):
    """
    Customer uploads the ORIGINAL proof.

    Login is not required.

    The review UUID acts as the capability token.

    IMPORTANT:
        This original file is private.
        It must never be exposed through the
        public review serializer.
    """

    permission_classes = [
        permissions.AllowAny,
    ]

    def post(self, request, review_id):

        # ----------------------------------------------------
        # FIND REVIEW
        # ----------------------------------------------------

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
                "Proof can only be attached while "
                "the review is pending verification."
            )

        # ----------------------------------------------------
        # ONLY ONE ORIGINAL PROOF
        # ----------------------------------------------------

        if hasattr(review, "proof"):
            raise ValidationError(
                "Proof has already been uploaded "
                "for this review."
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

        if (
            f.content_type
            not in settings.PROOF_ALLOWED_CONTENT_TYPES
        ):
            raise ValidationError(
                "Only JPG, PNG or PDF files are accepted."
            )

        # ----------------------------------------------------
        # STORAGE DIAGNOSTIC
        # ----------------------------------------------------

        logger.warning(
            "PROOF STORAGE CONFIG: backend=%s "
            "bucket=%s region=%s endpoint=%s "
            "addressing=%s",
            settings.STORAGES
            .get("default", {})
            .get("BACKEND"),
            getattr(
                settings,
                "AWS_STORAGE_BUCKET_NAME",
                None,
            ),
            getattr(
                settings,
                "AWS_S3_REGION_NAME",
                None,
            ),
            getattr(
                settings,
                "AWS_S3_ENDPOINT_URL",
                None,
            ),
            getattr(
                settings,
                "AWS_S3_ADDRESSING_STYLE",
                None,
            ),
        )

        # ----------------------------------------------------
        # CREATE ORIGINAL PROOF
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

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return Response(
            {
                "detail": "Proof uploaded.",
                "original_filename": (
                    proof.original_filename
                ),
                "size_bytes": proof.size_bytes,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ORIGINAL PROOF DOWNLOAD
# ADMIN / MODERATOR ONLY
# ============================================================

class ProofDownloadView(APIView):
    """
    Admin/moderator can view the ORIGINAL proof.

    Customer cannot access this endpoint.
    """

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request, review_id):

        # ----------------------------------------------------
        # FIND REVIEW
        # ----------------------------------------------------

        review = (
            Review.objects
            .select_related("proof")
            .filter(id=review_id)
            .first()
        )

        if not review:
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
        # PROOF MUST EXIST
        # ----------------------------------------------------

        if not hasattr(review, "proof"):
            raise Http404

        proof = review.proof

        if not proof.file:
            raise Http404

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
        # RETURN ORIGINAL PROOF
        # ----------------------------------------------------

        return FileResponse(
            proof.file.open("rb"),
            content_type=(
                proof.content_type
                or "application/octet-stream"
            ),
            filename=(
                proof.original_filename
                or "proof"
            ),
        )


# ============================================================
# REDACTED PROOF PREVIEW UPLOAD
# ADMIN / MODERATOR ONLY
# ============================================================

class ProofPreviewUploadView(APIView):
    """
    Admin/moderator uploads the REDACTED copy.

    Original:
        proof.file

    Redacted:
        proof.preview_file

    The redacted file is also stored privately.
    Customers access it through the dedicated
    preview endpoint below.
    """

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def post(self, request, review_id):

        # ----------------------------------------------------
        # FIND REVIEW
        # ----------------------------------------------------

        review = (
            Review.objects
            .select_related("proof")
            .filter(id=review_id)
            .first()
        )

        if not review:
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
                "Only staff/moderators can upload "
                "a redacted proof preview."
            )

        # ----------------------------------------------------
        # ORIGINAL PROOF MUST EXIST
        # ----------------------------------------------------

        if not hasattr(review, "proof"):
            raise ValidationError(
                "Original proof has not been uploaded."
            )

        proof = review.proof

        # ----------------------------------------------------
        # FILE REQUIRED
        # ----------------------------------------------------

        f = request.FILES.get("file")

        if not f:
            raise ValidationError(
                "No redacted preview file provided."
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

        if (
            f.content_type
            not in settings.PROOF_ALLOWED_CONTENT_TYPES
        ):
            raise ValidationError(
                "Only JPG, PNG or PDF files are accepted."
            )

        # ----------------------------------------------------
        # DELETE OLD PREVIEW
        # ----------------------------------------------------

        if proof.preview_file:
            try:
                proof.preview_file.delete(
                    save=False
                )
            except Exception:
                logger.exception(
                    "Failed to delete old proof preview."
                )

        # ----------------------------------------------------
        # SAVE REDACTED PREVIEW
        # ----------------------------------------------------

        proof.preview_file = f

        # These fields exist only if they are present
        # in your model.

        if hasattr(
            proof,
            "preview_filename",
        ):
            proof.preview_filename = f.name

        if hasattr(
            proof,
            "preview_content_type",
        ):
            proof.preview_content_type = (
                f.content_type
            )

        if hasattr(
            proof,
            "preview_uploaded_at",
        ):
            proof.preview_uploaded_at = (
                timezone.now()
            )

        # ----------------------------------------------------
        # UPDATE ONLY EXISTING FIELDS
        # ----------------------------------------------------

        update_fields = [
            "preview_file",
        ]

        if hasattr(
            proof,
            "preview_filename",
        ):
            update_fields.append(
                "preview_filename"
            )

        if hasattr(
            proof,
            "preview_content_type",
        ):
            update_fields.append(
                "preview_content_type"
            )

        if hasattr(
            proof,
            "preview_uploaded_at",
        ):
            update_fields.append(
                "preview_uploaded_at"
            )

        proof.save(
            update_fields=update_fields
        )

        # ----------------------------------------------------
        # AUDIT LOG
        # ----------------------------------------------------

        AuditLog.record(
            actor=request.user,
            action="proof_preview_uploaded",
            target=review,
            meta={
                "filename": f.name,
            },
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return Response(
            {
                "detail": (
                    "Redacted proof preview uploaded."
                ),
                "filename": f.name,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# REDACTED PROOF PREVIEW DOWNLOAD
# CUSTOMER / PUBLIC
# ============================================================

class ProofPreviewDownloadView(APIView):
    """
    Customer-facing REDACTED proof.

    IMPORTANT:
        This endpoint NEVER returns proof.file.

        It returns ONLY proof.preview_file.

    The preview becomes available only after the
    review becomes public.
    """

    permission_classes = [
        permissions.AllowAny,
    ]

    def get(self, request, review_id):

        # ----------------------------------------------------
        # FIND REVIEW
        # ----------------------------------------------------

        review = (
            Review.objects
            .select_related("proof")
            .filter(id=review_id)
            .first()
        )

        if not review:
            raise Http404

        # ----------------------------------------------------
        # ONLY PUBLIC REVIEWS
        # ----------------------------------------------------

        if review.status not in (
            ReviewStatus.VERIFIED,
            ReviewStatus.PUBLISHED_UNVERIFIED,
        ):
            raise PermissionDenied(
                "Proof preview is not available "
                "for this review."
            )

        # ----------------------------------------------------
        # PROOF MUST EXIST
        # ----------------------------------------------------

        if not hasattr(review, "proof"):
            raise Http404

        proof = review.proof

        # ----------------------------------------------------
        # REDACTED PREVIEW MUST EXIST
        # ----------------------------------------------------

        if not proof.preview_file:
            raise Http404

        # ----------------------------------------------------
        # CONTENT TYPE
        # ----------------------------------------------------

        content_type = getattr(
            proof,
            "preview_content_type",
            None,
        )

        if not content_type:
            content_type = (
                "application/octet-stream"
            )

        # ----------------------------------------------------
        # FILENAME
        # ----------------------------------------------------

        filename = getattr(
            proof,
            "preview_filename",
            None,
        )

        if not filename:
            filename = (
                "verified-proof-preview"
            )

        # ----------------------------------------------------
        # RETURN ONLY REDACTED PROOF
        # ----------------------------------------------------

        return FileResponse(
            proof.preview_file.open("rb"),
            content_type=content_type,
            filename=filename,
        )


# ============================================================
# HELPFUL VOTES
# ============================================================

class HelpfulVoteViewSet(
    viewsets.ModelViewSet
):
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

        Anonymous users are handled directly using
        X-Anonymous-Id inside serializer/destroy.
        """

        if self.request.user.is_authenticated:
            return HelpfulVote.objects.filter(
                user=self.request.user,
            )

        return HelpfulVote.objects.none()

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):

        review_id = kwargs.get("pk")

        anon_id = (
            request.headers.get(
                "X-Anonymous-Id"
            )
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