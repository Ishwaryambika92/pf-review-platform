import os

import dj_database_url

from .base import *
from corsheaders.defaults import default_headers


DEBUG = False


ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get(
        "DJANGO_ALLOWED_HOSTS",
        "trueclaim-backend.onrender.com",
    ).split(",")
    if h.strip()
]


DATABASES = {
    "default": dj_database_url.config(
        env="DATABASE_URL",
        conn_max_age=600,
        ssl_require=os.environ.get(
            "DB_SSL_REQUIRE",
            "true",
        ).lower() == "true",
    )
}


CORS_ALLOWED_ORIGINS = [
    "https://pf-review-platform.pages.dev",
]

CORS_ALLOW_HEADERS = [
    *default_headers,
    "x-anonymous-id",
]


CSRF_TRUSTED_ORIGINS = [
    "https://pf-review-platform.pages.dev",
]


SECURE_SSL_REDIRECT = (
    os.environ.get(
        "DJANGO_SECURE_SSL_REDIRECT",
        "true",
    ).lower() == "true"
)

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SECURE_CONTENT_TYPE_NOSNIFF = True

X_FRAME_OPTIONS = "DENY"

SECURE_REFERRER_POLICY = "same-origin"


# ---------------------------------------------------------
# PRIVATE PROOF STORAGE - BACKBLAZE B2
# ---------------------------------------------------------

if os.environ.get("USE_S3_PROOF_STORAGE", "false").lower() == "true":

    INSTALLED_APPS += ["storages"]

    AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")

    AWS_STORAGE_BUCKET_NAME = os.environ.get(
        "AWS_PRIVATE_BUCKET_NAME"
    )

    AWS_S3_REGION_NAME = os.environ.get(
        "AWS_S3_REGION_NAME",
        "us-east-005",
    )

    AWS_S3_ENDPOINT_URL = os.environ.get(
        "AWS_S3_ENDPOINT_URL",
        "https://s3.us-east-005.backblazeb2.com",
    )

    AWS_S3_SIGNATURE_VERSION = "s3v4"

    AWS_S3_ADDRESSING_STYLE = "virtual"

    AWS_DEFAULT_ACL = None

    AWS_S3_FILE_OVERWRITE = False

    AWS_QUERYSTRING_AUTH = True

    AWS_QUERYSTRING_EXPIRE = 300

    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }