import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.crypto import get_random_string


class ReviewStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PENDING = "pending", "Pending Verification"
    UNDER_REVIEW = "under_review", "Under Review"
    VERIFIED = "verified", "Verified"
    REJECTED = "rejected", "Rejected"
    NEEDS_INFO = "needs_info", "Needs More Information"
    PUBLISHED_UNVERIFIED = "published_unverified", "Published Without Verification"


def generate_reference_id():
    return "PFR-" + get_random_string(6, allowed_chars="0123456789")


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_id = models.CharField(max_length=20, unique=True, default=generate_reference_id, editable=False)
    # Nullable: reviews can be submitted without an account. When present,
    # this is an authenticated user (kept for future use / staff testing);
    # when absent, `reviewer_name` + `anonymous_id` carry the submission.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews"
    )
    reviewer_name = models.CharField(
        max_length=80, blank=True,
        help_text="Display name for logged-out submissions. Ignored if is_anonymous is set.",
    )
    # Opaque client-generated token (stored in the submitter's browser only)
    # used purely to prevent trivial duplicate submissions/votes/reports
    # from the same browser — NOT an identity and never displayed.
    anonymous_id = models.CharField(max_length=64, blank=True, db_index=True)
    service = models.ForeignKey("services.Service", on_delete=models.CASCADE, related_name="reviews")

    title = models.CharField(max_length=160)
    body = models.TextField(max_length=4000)
    pros = models.TextField(max_length=1000, blank=True)
    cons = models.TextField(max_length=1000, blank=True)
    would_recommend = models.BooleanField(null=True)
    is_anonymous = models.BooleanField(default=False)
    language = models.CharField(
        max_length=8, default="en", choices=[("en", "English"), ("te", "Telugu"), ("mixed", "Mixed")],
        help_text="Language the reviewer wrote in — informational only, never translated or altered.",
    )

    service_date = models.DateField(help_text="When the reviewed service was used.")
    status = models.CharField(max_length=24, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)

    allow_privacy_safe_indicator = models.BooleanField(
        default=True,
        help_text="User consent to show a 'Proof Verified' indicator (never the file itself).",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["service", "status"]),
            models.Index(fields=["status", "-created_at"]),
        ]
        constraints = [
            # Anti-fake-review guard for logged-in submissions.
            models.UniqueConstraint(
                fields=["user", "service", "service_date"],
                condition=models.Q(user__isnull=False),
                name="one_review_per_user_service_date",
            ),
            # Equivalent guard for logged-out submissions, keyed off the
            # browser-local anonymous_id instead of an account.
            models.UniqueConstraint(
                fields=["anonymous_id", "service", "service_date"],
                condition=models.Q(user__isnull=True) & ~models.Q(anonymous_id=""),
                name="one_review_per_anon_service_date",
            ),
        ]

    def __str__(self):
        return f"{self.reference_id} · {self.service_id} · {self.status}"

    # ---- Trust-critical computed flags -----------------------------
    # These are intentionally NOT writable fields. They are derived
    # from the ReviewVerification decision only, so the frontend can
    # never set "verified" itself.
    @property
    def is_verified(self):
        return self.status == ReviewStatus.VERIFIED

    @property
    def is_public(self):
        return self.status in (ReviewStatus.VERIFIED, ReviewStatus.PUBLISHED_UNVERIFIED)

    @property
    def proof_verified(self):
        return (
            self.is_verified
            and self.allow_privacy_safe_indicator
            and hasattr(self, "proof")
        )

    @property
    def display_name(self):
        if self.is_anonymous:
            return "Verified Customer" if self.is_verified else "Anonymous Customer"
        if self.user_id:
            return self.user.profile.display_name or self.user.username
        return self.reviewer_name or "Customer"


class ReviewRating(models.Model):
    review = models.OneToOneField(Review, on_delete=models.CASCADE, related_name="rating")
    overall = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    quality = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    communication = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    transparency = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    value_for_money = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    professionalism = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    response_time = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])

    def __str__(self):
        return f"{self.overall}/5 for {self.review_id}"


def proof_upload_path(instance, filename):
    ext = filename.split(".")[-1].lower()
    return f"proofs/{instance.review.id}/{uuid.uuid4()}.{ext}"


def proof_preview_upload_path(instance, filename):
    ext = filename.split(".")[-1].lower()
    return f"proof-previews/{instance.review.id}/{uuid.uuid4()}.{ext}"


class ReviewProof(models.Model):
    review = models.OneToOneField(
        Review,
        on_delete=models.CASCADE,
        related_name="proof",
    )

    # ORIGINAL CUSTOMER UPLOAD
    # Private - ADMIN/MODERATOR ONLY
    file = models.FileField(
        upload_to=proof_upload_path,
    )

    original_filename = models.CharField(
        max_length=255,
    )

    content_type = models.CharField(
        max_length=100,
    )

    size_bytes = models.PositiveIntegerField()

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    # REDACTED CUSTOMER-SAFE COPY
    # Still stored in private B2.
    # Customer accesses it only through a permission-checked API.
    preview_file = models.FileField(
        upload_to=proof_preview_upload_path,
        null=True,
        blank=True,
    )

    preview_filename = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    preview_content_type = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    preview_uploaded_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Proof for {self.review.reference_id}"

class ReviewVerification(models.Model):
    class Decision(models.TextChoices):
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"
        NEEDS_INFO = "needs_info", "Needs More Information"
        PUBLISHED_UNVERIFIED = "published_unverified", "Published Without Verification"

    review = models.OneToOneField(Review, on_delete=models.CASCADE, related_name="verification")
    moderator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="verification_decisions")
    decision = models.CharField(max_length=24, choices=Decision.choices)
    checklist = models.JSONField(
        default=dict,
        blank=True,
        help_text="e.g. {'proof_relevant': true, 'matches_service': true, 'no_sensitive_info': true, 'no_spam': true, 'no_duplicate': true}",
    )
    reason = models.CharField(max_length=255, blank=True)
    internal_notes = models.TextField(blank=True)
    decided_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.decision} · {self.review.reference_id}"


class ReviewReport(models.Model):
    class Reason(models.TextChoices):
        FAKE = "fake", "Fake review"
        SPAM = "spam", "Spam"
        OFFENSIVE = "offensive", "Offensive content"
        MISLEADING = "misleading", "Misleading information"
        PERSONAL_INFO = "personal_info", "Personal information"
        DUPLICATE = "duplicate", "Duplicate review"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWED = "reviewed", "Reviewed"
        DISMISSED = "dismissed", "Dismissed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="filed_reports"
    )
    anonymous_id = models.CharField(max_length=64, blank=True, db_index=True)
    reason = models.CharField(max_length=20, choices=Reason.choices)
    details = models.TextField(blank=True, max_length=1000)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["review", "reporter"], condition=models.Q(reporter__isnull=False),
                name="one_report_per_user_per_review",
            ),
            models.UniqueConstraint(
                fields=["review", "anonymous_id"],
                condition=models.Q(reporter__isnull=True) & ~models.Q(anonymous_id=""),
                name="one_report_per_anon_per_review",
            ),
        ]


class HelpfulVote(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="helpful_votes")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="helpful_votes"
    )
    anonymous_id = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["review", "user"], condition=models.Q(user__isnull=False),
                name="one_helpful_vote_per_user_per_review",
            ),
            models.UniqueConstraint(
                fields=["review", "anonymous_id"],
                condition=models.Q(user__isnull=True) & ~models.Q(anonymous_id=""),
                name="one_helpful_vote_per_anon_per_review",
            ),
        ]
