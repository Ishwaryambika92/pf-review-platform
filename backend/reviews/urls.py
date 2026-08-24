from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    HelpfulVoteViewSet,
    MyReviewsView,
    ProofDownloadView,
    ProofUploadView,
    ProofPreviewUploadView,
    ProofPreviewDownloadView,
    ReviewViewSet,
)


# ============================================================
# REVIEW API ROUTER
# ============================================================

router = DefaultRouter()


# Helpful button
router.register(
    "helpful",
    HelpfulVoteViewSet,
    basename="helpfulvote",
)


# Reviews
router.register(
    "",
    ReviewViewSet,
    basename="review",
)


# ============================================================
# URL PATTERNS
# ============================================================

urlpatterns = [

    # --------------------------------------------------------
    # Logged-in user's reviews
    # --------------------------------------------------------
    path(
        "mine/",
        MyReviewsView.as_view(),
        name="my-reviews",
    ),

    # --------------------------------------------------------
    # Customer uploads ORIGINAL proof
    # --------------------------------------------------------
    path(
        "<uuid:review_id>/proof/upload/",
        ProofUploadView.as_view(),
        name="proof-upload",
    ),

    # --------------------------------------------------------
    # Moderator ONLY - ORIGINAL proof
    # --------------------------------------------------------
    path(
        "<uuid:review_id>/proof/download/",
        ProofDownloadView.as_view(),
        name="proof-download",
    ),

    # --------------------------------------------------------
    # Moderator uploads REDACTED proof
    # --------------------------------------------------------
    path(
        "<uuid:review_id>/proof/preview/upload/",
        ProofPreviewUploadView.as_view(),
        name="proof-preview-upload",
    ),

    # --------------------------------------------------------
    # Customer - REDACTED proof only
    # --------------------------------------------------------
    path(
        "<uuid:review_id>/proof/preview/",
        ProofPreviewDownloadView.as_view(),
        name="proof-preview-download",
    ),

] + router.urls