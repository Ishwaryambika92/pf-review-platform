"""
Used for CI / integration test runs against a real Postgres instance.
Same DB and security posture as production, EXCEPT the HTTPS-only
redirect is disabled so Django's plain-HTTP test client can exercise
the API without every request 301'ing.
"""
from .production import *  # noqa

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
