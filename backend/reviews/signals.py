from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from audit.middleware import get_current_user
from audit.models import AuditLog
from notifications.models import Notification

from services.models import Service
from .models import Review, ReviewVerification


@receiver(post_save, sender=ReviewVerification)
def apply_verification_decision(
    sender,
    instance: ReviewVerification,
    created,
    **kwargs
):
    """
    Apply the moderator decision to the review.

    This updates:
    - Review status
    - Service statistics
    - User notification
    - Audit log
    """

    review = instance.review

    # Update review status
    review.status = instance.decision
    review.save(update_fields=["status", "updated_at"])

    # Recalculate public service statistics
    review.service.recalculate_stats()

    # Notify logged-in reviewer
    if review.user_id:

        notif_map = {
            "verified": (
                Notification.Type.REVIEW_VERIFIED,
                "Your review has been verified.",
            ),

            "rejected": (
                Notification.Type.REVIEW_REJECTED,
                "Your review was not approved.",
            ),

            "needs_info": (
                Notification.Type.REVIEW_NEEDS_INFO,
                "We need more information about your review.",
            ),

            "published_unverified": (
                Notification.Type.REVIEW_PUBLISHED_UNVERIFIED,
                "Your review was published without proof verification.",
            ),
        }

        ntype, message = notif_map.get(
            instance.decision,
            (
                Notification.Type.GENERAL,
                "Your review status changed.",
            ),
        )

        Notification.objects.create(
            user=review.user,
            type=ntype,
            message=message,
            related_review_id=review.id,
        )

    # Audit log
    AuditLog.record(
        actor=instance.moderator or get_current_user(),
        action=f"review_verification_{instance.decision}",
        target=review,
        meta={
            "reason": instance.reason,
            "checklist": instance.checklist,
        },
    )


@receiver(post_delete, sender=Review)
def recalculate_service_stats_after_review_delete(
    sender,
    instance: Review,
    **kwargs
):
    """
    Recalculate service statistics whenever a review is deleted.

    This covers:
    - Django Admin deletion
    - API deletion
    - Any other Review.objects.delete() operation

    This keeps the cached review count and rating accurate.
    """

    service_id = instance.service_id

    if not service_id:
        return

    service = Service.objects.filter(
        pk=service_id
    ).first()

    if service:
        service.recalculate_stats()