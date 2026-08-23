from django.urls import path

from .views import ClaimForReviewView, ModerationQueueView, VerificationDecisionView

urlpatterns = [
    path("queue/", ModerationQueueView.as_view(), name="moderation-queue"),
    path("<uuid:review_id>/claim/", ClaimForReviewView.as_view(), name="moderation-claim"),
    path("<uuid:review_id>/decide/", VerificationDecisionView.as_view(), name="moderation-decide"),
]
