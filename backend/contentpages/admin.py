from django.contrib import admin

from .models import SitePage


@admin.register(SitePage)
class SitePageAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "page_type",
        "is_published",
        "updated_at",
    )

    list_filter = (
        "page_type",
        "is_published",
    )

    search_fields = (
        "title",
        "content",
    )

    ordering = (
        "page_type",
    )