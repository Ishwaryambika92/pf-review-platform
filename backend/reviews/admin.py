from django.contrib import admin

from .models import HelpfulVote, Review, ReviewProof, ReviewRating, ReviewReport, ReviewVerification


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["reference_id", "service", "user", "status", "created_at"]
    list_filter = ["status", "service"]
    search_fields = ["reference_id", "title", "body"]


admin.site.register(ReviewRating)
admin.site.register(ReviewProof)
admin.site.register(ReviewVerification)
admin.site.register(ReviewReport)
admin.site.register(HelpfulVote)
