from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Service, ServiceCategory

User = get_user_model()


class ServiceStatsTests(APITestCase):
    def setUp(self):
        self.category = ServiceCategory.objects.create(name="PF Withdrawal")
        self.service = Service.objects.create(category=self.category, name="Stats Test Service")
        self.user = User.objects.create_user(username="u1", email="u1@example.com", password="StrongPass123!")
        self.mod = User.objects.create_user(username="m1", email="m1@example.com", password="StrongPass123!", is_moderator=True)

    def test_new_service_has_zero_real_stats_no_fake_numbers(self):
        resp = self.client.get(f"/api/services/{self.service.slug}/")
        self.assertEqual(resp.data["total_reviews"], 0)
        self.assertEqual(resp.data["verified_reviews"], 0)
        self.assertEqual(resp.data["average_rating"], "0.00")

    def test_stats_recalculate_only_after_verification(self):
        self.client.force_authenticate(user=self.user)
        review = self.client.post("/api/reviews/", {
            "service": str(self.service.id), "title": "t", "body": "detailed body text here",
            "would_recommend": True, "is_anonymous": False, "service_date": "2026-08-01",
            "rating": {"overall": 4},
        }, format="json").data

        self.service.refresh_from_db()
        self.assertEqual(self.service.cached_total_reviews, 0, "pending review must not affect public stats")

        self.client.force_authenticate(user=self.mod)
        self.client.post(f"/api/moderation/{review['id']}/decide/", {"decision": "verified"}, format="json")

        self.service.refresh_from_db()
        self.assertEqual(self.service.cached_total_reviews, 1)
        self.assertEqual(self.service.cached_verified_reviews, 1)
        self.assertEqual(float(self.service.cached_average_rating), 4.0)

    def test_service_search(self):
        resp = self.client.get("/api/services/?search=Stats Test")
        self.assertEqual(resp.data["count"], 1)
