from django.urls import path

from .views import SitePageDetailView


urlpatterns = [
    path(
        "<str:page_type>/",
        SitePageDetailView.as_view(),
        name="site-page-detail",
    ),
]