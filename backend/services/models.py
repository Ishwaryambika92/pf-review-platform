import uuid

from django.db import models
from django.utils.text import slugify


class ServiceCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "service categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name="services")
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    description = models.TextField(blank=True)
    process_info = models.TextField(blank=True, help_text="How the service typically works, step by step.")
    common_requirements = models.TextField(blank=True)
    location = models.CharField(max_length=160, blank=True)
    contact_info = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    display_order = models.PositiveIntegerField(default=0)

    # Denormalized rating cache — always recomputed server-side from
    # approved reviews via recalculate_stats(); never accepted as API input.
    cached_average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    cached_total_reviews = models.PositiveIntegerField(default=0)
    cached_verified_reviews = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def recalculate_stats(self):
        """
        Source of truth for all public rating numbers. Only counts
        reviews that are actually public (Verified or Published
        Without Verification) — pending/rejected/draft reviews never
        move the numbers shown to visitors.
        """
        from django.db.models import Avg, Count, Q

        from reviews.models import Review, ReviewStatus

        public_reviews = self.reviews.filter(
            status__in=[ReviewStatus.VERIFIED, ReviewStatus.PUBLISHED_UNVERIFIED]
        )
        agg = public_reviews.aggregate(
            avg=Avg("rating__overall"),
            total=Count("id"),
            verified=Count("id", filter=Q(status=ReviewStatus.VERIFIED)),
        )
        self.cached_average_rating = round(agg["avg"] or 0, 2)
        self.cached_total_reviews = agg["total"] or 0
        self.cached_verified_reviews = agg["verified"] or 0
        self.save(update_fields=["cached_average_rating", "cached_total_reviews", "cached_verified_reviews"])

    def rating_distribution(self):
        from reviews.models import Review, ReviewStatus

        public_reviews = self.reviews.filter(
            status__in=[ReviewStatus.VERIFIED, ReviewStatus.PUBLISHED_UNVERIFIED]
        )
        total = public_reviews.count() or 1
        dist = []
        for star in range(5, 0, -1):
            count = public_reviews.filter(rating__overall=star).count()
            dist.append({"stars": star, "count": count, "pct": round(count * 100 / total)})
        return dist
