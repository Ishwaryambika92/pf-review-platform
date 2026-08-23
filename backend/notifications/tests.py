from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Notification

User = get_user_model()


class NotificationTests(APITestCase):
    def setUp(self):
        self.u1 = User.objects.create_user(username="n1", email="n1@example.com", password="StrongPass123!")
        self.u2 = User.objects.create_user(username="n2", email="n2@example.com", password="StrongPass123!")
        Notification.objects.create(user=self.u1, type="general", message="Hello u1")
        Notification.objects.create(user=self.u2, type="general", message="Hello u2")

    def test_user_only_sees_own_notifications(self):
        self.client.force_authenticate(user=self.u1)
        resp = self.client.get("/api/notifications/")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["message"], "Hello u1")

    def test_mark_all_read(self):
        self.client.force_authenticate(user=self.u1)
        self.client.post("/api/notifications/mark-all-read/")
        n = Notification.objects.get(user=self.u1)
        self.assertTrue(n.read)
