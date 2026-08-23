from datetime import date

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from services.models import Service, ServiceCategory

from .models import Review, ReviewStatus, ReviewVerification

User = get_user_model()


class ReviewTrustRulesTests(APITestCase):
    def setUp(self):
        self.category = ServiceCategory.objects.create(name="PF Withdrawal")
        self.service = Service.objects.create(category=self.category, name="Test Service")
        self.user = User.objects.create_user(username="cust", email="c@example.com", password="StrongPass123!")
        self.mod = User.objects.create_user(username="mod", email="m@example.com", password="StrongPass123!", is_moderator=True)

    def auth(self, user):
        self.client.force_authenticate(user=user)

    def create_review(self, **overrides):
        extra = {k: v for k, v in overrides.items() if k.startswith("HTTP_")}
        for k in extra:
            overrides.pop(k)
        payload = {
            "service": str(self.service.id),
            "title": "Great service",
            "body": "Detailed body text about the experience.",
            "would_recommend": True,
            "is_anonymous": False,
            "service_date": "2026-08-01",
            "status": "verified",  # attempt to smuggle a status
            "rating": {"overall": 5},
        }
        payload.update(overrides)
        return self.client.post("/api/reviews/", payload, format="json", **extra)

    def test_review_creation_always_starts_pending_regardless_of_client_input(self):
        self.auth(self.user)
        resp = self.create_review()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)
        self.assertEqual(resp.data["status"], "pending")

    def test_pending_review_not_publicly_visible(self):
        self.auth(self.user)
        self.create_review()
        self.client.force_authenticate(user=None)
        resp = self.client.get(f"/api/reviews/?service={self.service.id}")
        self.assertEqual(resp.data["count"], 0)

    def test_verification_flips_status_and_public_visibility(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]

        self.auth(self.mod)
        resp = self.client.post(f"/api/moderation/{review_id}/decide/", {"decision": "verified", "reason": "ok"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        review = Review.objects.get(id=review_id)
        self.assertEqual(review.status, ReviewStatus.VERIFIED)
        self.assertTrue(review.is_verified)

        self.client.force_authenticate(user=None)
        public = self.client.get(f"/api/reviews/?service={self.service.id}").data["results"]
        self.assertEqual(len(public), 1)
        self.assertTrue(public[0]["is_verified"])

    def test_non_moderator_cannot_verify(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        resp = self.client.post(f"/api/moderation/{review_id}/decide/", {"decision": "verified"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_review_same_service_same_date_rejected(self):
        self.auth(self.user)
        first = self.create_review()
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = self.create_review()
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_proof_upload_works_without_login(self):
        # No login anywhere required for public submission + proof.
        review_id = self.create_review(is_anonymous=True).data["id"]
        f = SimpleUploadedFile("r.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        resp = self.client.post(f"/api/reviews/{review_id}/proof/upload/", {"file": f}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)

    def test_proof_upload_blocked_once_no_longer_pending(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        self.auth(self.mod)
        self.client.post(f"/api/moderation/{review_id}/decide/", {"decision": "verified"}, format="json")
        self.client.force_authenticate(user=None)
        f = SimpleUploadedFile("r.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        resp = self.client.post(f"/api/reviews/{review_id}/proof/upload/", {"file": f}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_proof_rejects_disallowed_file_type(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        f = SimpleUploadedFile("r.exe", b"MZ", content_type="application/octet-stream")
        resp = self.client.post(f"/api/reviews/{review_id}/proof/upload/", {"file": f}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_proof_download_blocked_for_stranger(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        f = SimpleUploadedFile("r.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        self.client.post(f"/api/reviews/{review_id}/proof/upload/", {"file": f}, format="multipart")

        stranger = User.objects.create_user(username="stranger", email="s@example.com", password="StrongPass123!")
        self.auth(stranger)
        resp = self.client.get(f"/api/reviews/{review_id}/proof/download/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_proof_download_blocked_when_logged_out(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        f = SimpleUploadedFile("r.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        self.client.post(f"/api/reviews/{review_id}/proof/upload/", {"file": f}, format="multipart")
        self.client.force_authenticate(user=None)
        resp = self.client.get(f"/api/reviews/{review_id}/proof/download/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_proof_download_allowed_for_moderator(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        f = SimpleUploadedFile("r.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        self.client.post(f"/api/reviews/{review_id}/proof/upload/", {"file": f}, format="multipart")
        self.auth(self.mod)
        resp = self.client.get(f"/api/reviews/{review_id}/proof/download/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_helpful_vote_is_unique_per_user(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        self.auth(self.mod)
        self.client.post(f"/api/moderation/{review_id}/decide/", {"decision": "verified"}, format="json")

        voter = User.objects.create_user(username="voter", email="v@example.com", password="StrongPass123!")
        self.auth(voter)
        r1 = self.client.post("/api/reviews/helpful/", {"review": review_id}, format="json")
        r2 = self.client.post("/api/reviews/helpful/", {"review": review_id}, format="json")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_service_stats_only_count_public_reviews(self):
        self.auth(self.user)
        self.create_review()
        self.service.refresh_from_db()
        # still pending -> stats untouched (0)
        self.assertEqual(self.service.cached_total_reviews, 0)

    def test_duplicate_report_returns_clean_400_not_500(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        reporter = User.objects.create_user(username="reporter", email="rep@example.com", password="StrongPass123!")
        self.auth(reporter)
        r1 = self.client.post("/api/reviews/reports/", {"review": review_id, "reason": "fake", "details": ""}, format="json")
        r2 = self.client.post("/api/reviews/reports/", {"review": review_id, "reason": "fake", "details": ""}, format="json")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- No-login-required requirements ---------------------------

    def test_anyone_can_browse_without_login(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get("/api/reviews/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        resp2 = self.client.get("/api/services/")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)

    def test_anonymous_review_submission_without_login(self):
        self.client.force_authenticate(user=None)
        resp = self.create_review(
            is_anonymous=True, reviewer_name="", language="te",
            HTTP_X_ANONYMOUS_ID="anon-token-abc",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)
        self.assertEqual(resp.data["status"], "pending")
        review = Review.objects.get(id=resp.data["id"])
        self.assertIsNone(review.user)
        self.assertEqual(review.anonymous_id, "anon-token-abc")
        self.assertEqual(review.language, "te")

    def test_anonymous_display_name_is_anonymous_before_verification_and_verified_customer_after(self):
        self.client.force_authenticate(user=None)
        review_id = self.create_review(is_anonymous=True, HTTP_X_ANONYMOUS_ID="anon-1").data["id"]
        self.auth(self.mod)
        self.client.post(f"/api/moderation/{review_id}/decide/", {"decision": "published_unverified"}, format="json")
        self.client.force_authenticate(user=None)
        detail = self.client.get(f"/api/reviews/{review_id}/").data
        self.assertEqual(detail["display_name"], "Anonymous Customer")

        self.auth(self.mod)
        self.client.post(f"/api/moderation/{review_id}/decide/", {"decision": "verified"}, format="json")
        self.client.force_authenticate(user=None)
        detail = self.client.get(f"/api/reviews/{review_id}/").data
        self.assertEqual(detail["display_name"], "Verified Customer")

    def test_named_anonymous_submission_uses_reviewer_name(self):
        self.client.force_authenticate(user=None)
        review_id = self.create_review(
            is_anonymous=False, reviewer_name="Priya K.", HTTP_X_ANONYMOUS_ID="anon-2",
        ).data["id"]
        self.auth(self.mod)
        self.client.post(f"/api/moderation/{review_id}/decide/", {"decision": "verified"}, format="json")
        self.client.force_authenticate(user=None)
        detail = self.client.get(f"/api/reviews/{review_id}/").data
        self.assertEqual(detail["display_name"], "Priya K.")

    def test_anonymous_duplicate_submission_same_browser_blocked(self):
        self.client.force_authenticate(user=None)
        r1 = self.create_review(HTTP_X_ANONYMOUS_ID="dup-browser")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        r2 = self.create_review(HTTP_X_ANONYMOUS_ID="dup-browser")
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_anonymous_helpful_vote_without_login(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        self.auth(self.mod)
        self.client.post(f"/api/moderation/{review_id}/decide/", {"decision": "verified"}, format="json")

        self.client.force_authenticate(user=None)
        r1 = self.client.post("/api/reviews/helpful/", {"review": review_id}, format="json", HTTP_X_ANONYMOUS_ID="voter-1")
        r2 = self.client.post("/api/reviews/helpful/", {"review": review_id}, format="json", HTTP_X_ANONYMOUS_ID="voter-1")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_anonymous_report_without_login(self):
        self.auth(self.user)
        review_id = self.create_review().data["id"]
        self.client.force_authenticate(user=None)
        resp = self.client.post(
            "/api/reviews/reports/", {"review": review_id, "reason": "spam", "details": ""},
            format="json", HTTP_X_ANONYMOUS_ID="reporter-1",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)

    def test_filter_verified_only(self):
        self.auth(self.user)
        verified_id = self.create_review(service_date="2026-08-05").data["id"]
        rejected_id = self.create_review(service_date="2026-08-06").data["id"]
        self.auth(self.mod)
        self.client.post(f"/api/moderation/{verified_id}/decide/", {"decision": "verified"}, format="json")
        self.client.post(f"/api/moderation/{rejected_id}/decide/", {"decision": "published_unverified"}, format="json")

        self.client.force_authenticate(user=None)
        resp = self.client.get(f"/api/reviews/?service={self.service.id}&status=verified")
        ids = [r["id"] for r in resp.data["results"]]
        self.assertIn(verified_id, ids)
        self.assertNotIn(rejected_id, ids)

    def test_sorting_by_rating(self):
        self.auth(self.user)
        low_id = self.create_review(service_date="2026-08-07", rating={"overall": 1}).data["id"]
        high_id = self.create_review(service_date="2026-08-08", rating={"overall": 5}).data["id"]
        self.auth(self.mod)
        self.client.post(f"/api/moderation/{low_id}/decide/", {"decision": "verified"}, format="json")
        self.client.post(f"/api/moderation/{high_id}/decide/", {"decision": "verified"}, format="json")

        self.client.force_authenticate(user=None)
        resp = self.client.get(f"/api/reviews/?service={self.service.id}&ordering=-rating__overall")
        ratings = [r["rating"]["overall"] for r in resp.data["results"]]
        self.assertEqual(ratings, sorted(ratings, reverse=True))
