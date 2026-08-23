from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    HelpfulVoteViewSet,
    MyReviewsView,
    ProofDownloadView,
    ProofUploadView,
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
    # Logged-in user's reviews
    path(
        "mine/",
        MyReviewsView.as_view(),
        name="my-reviews",
    ),

    # Upload proof for a pending review
    path(
        "<uuid:review_id>/proof/upload/",
        ProofUploadView.as_view(),
        name="proof-upload",
    ),

    # Staff/moderator proof download
    path(
        "<uuid:review_id>/proof/download/",
        ProofDownloadView.as_view(),
        name="proof-download",
    ),
] + router.urls