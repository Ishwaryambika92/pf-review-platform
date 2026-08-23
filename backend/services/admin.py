from django.contrib import admin

from .models import Service, ServiceCategory

admin.site.register(ServiceCategory)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "cached_average_rating", "cached_total_reviews", "cached_verified_reviews"]
    readonly_fields = ["cached_average_rating", "cached_total_reviews", "cached_verified_reviews"]
