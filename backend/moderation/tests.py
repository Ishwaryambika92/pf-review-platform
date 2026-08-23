from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from services.models import Service, ServiceCategory

User = get_user_model()


class ModerationAccessTests(APITestCase):
    def setUp(self):
        self.category = ServiceCategory.objects.create(name="KYC Services")
        self.service = Service.objects.create(category=self.category, name="Mod Test Service")
        self.customer = User.objects.create_user(username="cust1", email="c1@example.com", password="StrongPass123!")
        self.mod = User.objects.create_user(username="mod1", email="m1@example.com", password="StrongPass123!", is_moderator=True)
        self.staff = User.objects.create_user(username="staff1", email="s1@example.com", password="StrongPass123!", is_staff=True)

    def test_customer_cannot_see_queue(self):
        self.client.force_authenticate(user=self.customer)
        resp = self.client.get("/api/moderation/queue/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_moderator_can_see_queue(self):
        self.client.force_authenticate(user=self.mod)
        resp = self.client.get("/api/moderation/queue/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_staff_flag_also_grants_access(self):
        self.client.force_authenticate(user=self.staff)
        resp = self.client.get("/api/moderation/queue/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_anonymous_blocked(self):
        resp = self.client.get("/api/moderation/queue/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_needs_info_and_reject_decisions_notify_and_update_status(self):
        self.client.force_authenticate(user=self.customer)
        review = self.client.post("/api/reviews/", {
            "service": str(self.service.id), "title": "t", "body": "detailed body text here",
            "would_recommend": True, "is_anonymous": False, "service_date": "2026-08-02",
            "rating": {"overall": 3},
        }, format="json").data

        self.client.force_authenticate(user=self.mod)
        resp = self.client.post(f"/api/moderation/{review['id']}/decide/", {"decision": "needs_info", "reason": "Please clarify dates."}, format="json")
        self.assertEqual(resp.data["status"], "needs_info")

        self.client.force_authenticate(user=self.customer)
        notifs = self.client.get("/api/notifications/").data["results"]
        self.assertTrue(any(n["type"] == "review_needs_info" for n in notifs))
