from django.db import models


class SitePage(models.Model):
    class PageType(models.TextChoices):
        PRIVACY = "privacy", "Privacy Policy"
        TERMS = "terms", "Terms & Conditions"
        DISCLAIMER = "disclaimer", "Disclaimer"
        ABOUT = "about", "About Us"
        CONTACT = "contact", "Contact Us"
        REVIEW_POLICY = "review_policy", "Review Policy"

    page_type = models.CharField(
        max_length=30,
        choices=PageType.choices,
        unique=True,
    )

    title = models.CharField(max_length=200)

    content = models.TextField()

    is_published = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["page_type"]

    def __str__(self):
        return self.title