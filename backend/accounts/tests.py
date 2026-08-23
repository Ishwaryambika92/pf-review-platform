from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthTests(APITestCase):
    def test_register_creates_user_and_profile(self):
        resp = self.client.post("/api/auth/register/", {
            "username": "newcust", "email": "newcust@example.com", "password": "StrongPass123!",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)
        user = User.objects.get(username="newcust")
        self.assertTrue(hasattr(user, "profile"))
        self.assertFalse(user.is_moderator)

    def test_register_rejects_weak_password(self):
        resp = self.client.post("/api/auth/register/", {
            "username": "weakpass", "email": "weak@example.com", "password": "12345",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_jwt_and_me_endpoint_works(self):
        User.objects.create_user(username="loginuser", email="l@example.com", password="StrongPass123!")
        resp = self.client.post("/api/auth/login/", {"username": "loginuser", "password": "StrongPass123!"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        access = resp.data["access"]
        me = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["username"], "loginuser")

    def test_wrong_password_rejected(self):
        User.objects.create_user(username="wrongpass", email="w@example.com", password="StrongPass123!")
        resp = self.client.post("/api/auth/login/", {"username": "wrongpass", "password": "nope"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_me_rejected(self):
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
