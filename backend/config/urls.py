from django.contrib import admin
from django.urls import include, path

admin.site.site_url = "https://pf-review-platform.pages.dev/"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/services/", include("services.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/moderation/", include("moderation.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/audit/", include("audit.urls")),
    path("api/contentpages/", include("contentpages.urls")),
]
