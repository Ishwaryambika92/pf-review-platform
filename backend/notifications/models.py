import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        REVIEW_SUBMITTED = "review_submitted", "New Review Submitted"
        REVIEW_VERIFIED = "review_verified", "Review Verified"
        REVIEW_REJECTED = "review_rejected", "Review Rejected"
        REVIEW_NEEDS_INFO = "review_needs_info", "Review Needs More Information"
        REVIEW_PUBLISHED_UNVERIFIED = (
            "review_published_unverified",
            "Review Published Without Verification",
        )
        GENERAL = "general", "General"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    type = models.CharField(
        max_length=40,
        choices=Type.choices,
        default=Type.GENERAL,
    )

    message = models.CharField(
        max_length=255,
    )

    related_review_id = models.UUIDField(
        null=True,
        blank=True,
    )

    read = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} -> {self.user_id}"