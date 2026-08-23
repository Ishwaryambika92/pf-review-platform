from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from services.models import Service, ServiceCategory

User = get_user_model()


class AuditLogAccessTests(APITestCase):
    def setUp(self):
        self.category = ServiceCategory.objects.create(name="PF Transfer")
        self.service = Service.objects.create(category=self.category, name="Audit Test Service")
        self.customer = User.objects.create_user(username="ac1", email="ac1@example.com", password="StrongPass123!")
        self.mod = User.objects.create_user(username="am1", email="am1@example.com", password="StrongPass123!", is_moderator=True)

    def test_customer_cannot_read_audit_log(self):
        self.client.force_authenticate(user=self.customer)
        resp = self.client.get("/api/audit/logs/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_verification_decision_writes_audit_entry(self):
        self.client.force_authenticate(user=self.customer)
        review = self.client.post("/api/reviews/", {
            "service": str(self.service.id), "title": "t", "body": "detailed body text here",
            "would_recommend": True, "is_anonymous": False, "service_date": "2026-08-03",
            "rating": {"overall": 5},
        }, format="json").data

        self.client.force_authenticate(user=self.mod)
        self.client.post(f"/api/moderation/{review['id']}/decide/", {"decision": "verified"}, format="json")

        logs = self.client.get(f"/api/audit/logs/?target_id={review['id']}").data["results"]
        self.assertTrue(any(l["action"] == "review_verification_verified" for l in logs))
