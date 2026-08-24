import {
  apiRequest,
  setTokens,
  clearTokens,
  getAccessToken,
  API_BASE,
} from "./client";

import type {
  AppNotification,
  ModerationReview,
  MyUser,
  Paginated,
  ReviewPublic,
  ServiceCategory,
  ServiceDetail,
  ServiceSummary,
} from "./types";

/* ============================================================
   AUTH
============================================================ */

export async function register(
  username: string,
  email: string,
  password: string
) {
  return apiRequest("/auth/register/", {
    method: "POST",
    body: {
      username,
      email,
      password,
    },
    auth: false,
  });
}

export async function login(
  username: string,
  password: string
): Promise<MyUser> {
  const data = await apiRequest<{
    access: string;
    refresh: string;
  }>("/auth/login/", {
    method: "POST",
    body: {
      username,
      password,
    },
    auth: false,
  });

  setTokens(data.access, data.refresh);

  return me();
}

export function logout() {
  clearTokens();
}

export async function me(): Promise<MyUser> {
  return apiRequest("/auth/me/");
}


/* ============================================================
   SERVICES
============================================================ */

export async function listServices(
  params: {
    search?: string;
    category?: string;
    ordering?: string;
  } = {}
) {
  const qs = new URLSearchParams(params as any).toString();

  return apiRequest<Paginated<ServiceSummary>>(
    `/services/${qs ? `?${qs}` : ""}`,
    {
      auth: false,
    }
  );
}

export async function getService(slug: string) {
  return apiRequest<ServiceDetail>(
    `/services/${slug}/`,
    {
      auth: false,
    }
  );
}

export async function listCategories() {
  return apiRequest<Paginated<ServiceCategory>>(
    "/services/categories/",
    {
      auth: false,
    }
  );
}


/* ============================================================
   REVIEWS - PUBLIC
============================================================ */

export async function listReviews(
  params: {
    service?: string;
    search?: string;
    ordering?: string;
    page?: number;
  } = {}
) {
  const clean: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      clean[key] = String(value);
    }
  });

  const qs = new URLSearchParams(clean).toString();

  return apiRequest<Paginated<ReviewPublic>>(
    `/reviews/${qs ? `?${qs}` : ""}`,
    {
      auth: false,
    }
  );
}

export async function getReview(id: string) {
  return apiRequest<
    ReviewPublic & {
      proof: any;
      verification_reason: string | null;
    }
  >(`/reviews/${id}/`, {
    auth: false,
  });
}


/* ============================================================
   REVIEWS - AUTHENTICATED WRITE
============================================================ */

export interface NewReviewPayload {
  service: string;
  title: string;
  body: string;
  pros?: string;
  cons?: string;
  would_recommend: boolean | null;
  is_anonymous: boolean;
  reviewer_name?: string;
  language?: "en" | "te" | "mixed";
  service_date: string;
  allow_privacy_safe_indicator: boolean;

  rating: {
    overall: number;
    quality?: number;
    communication?: number;
    transparency?: number;
    value_for_money?: number;
    professionalism?: number;
    response_time?: number;
  };
}

export async function submitReview(
  payload: NewReviewPayload
) {
  return apiRequest<ReviewPublic>(
    "/reviews/",
    {
      method: "POST",
      body: payload,
    }
  );
}


/* ============================================================
   ORIGINAL PROOF UPLOAD
   Customer uploads original proof
============================================================ */

export async function uploadProof(
  reviewId: string,
  file: File
) {
  const form = new FormData();

  form.append("file", file);

  return apiRequest(
    `/reviews/${reviewId}/proof/upload/`,
    {
      method: "POST",
      body: form,
      isForm: true,
    }
  );
}


/* ============================================================
   REDACTED PROOF PREVIEW UPLOAD
   Moderator uploads safe/redacted copy
============================================================ */

export async function uploadProofPreview(
  reviewId: string,
  file: File
) {
  const form = new FormData();

  form.append("file", file);

  return apiRequest(
    `/reviews/${reviewId}/proof/preview/upload/`,
    {
      method: "POST",
      body: form,
      isForm: true,
    }
  );
}


/* ============================================================
   MY REVIEWS
============================================================ */

export async function myReviews() {
  const data =
    await apiRequest<Paginated<ReviewPublic>>(
      "/reviews/mine/"
    );

  return data.results;
}


/* ============================================================
   HELPFUL
============================================================ */

export async function markHelpful(
  reviewId: string
) {
  return apiRequest(
    "/reviews/helpful/",
    {
      method: "POST",
      body: {
        review: reviewId,
      },
    }
  );
}


/* ============================================================
   NOTIFICATIONS
============================================================ */

export async function listNotifications() {
  return apiRequest<Paginated<AppNotification>>(
    "/notifications/"
  );
}

export async function markAllNotificationsRead() {
  return apiRequest(
    "/notifications/mark-all-read/",
    {
      method: "POST",
    }
  );
}

export async function deleteNotification(
  notificationId: string
) {
  return apiRequest(
    `/notifications/${notificationId}/`,
    {
      method: "DELETE",
    }
  );
}


/* ============================================================
   MODERATION
============================================================ */

export async function moderationQueue(
  params: {
    status?: string;
  } = {}
) {
  const qs = new URLSearchParams(
    params as any
  ).toString();

  return apiRequest<
    Paginated<ModerationReview>
  >(
    `/moderation/queue/${qs ? `?${qs}` : ""}`
  );
}

export async function claimReview(
  reviewId: string
) {
  return apiRequest<ModerationReview>(
    `/moderation/${reviewId}/claim/`,
    {
      method: "POST",
    }
  );
}

export async function decideReview(
  reviewId: string,
  decision:
    | "verified"
    | "rejected"
    | "needs_info"
    | "published_unverified",
  checklist: Record<string, boolean>,
  reason: string
) {
  return apiRequest<ModerationReview>(
    `/moderation/${reviewId}/decide/`,
    {
      method: "POST",
      body: {
        decision,
        checklist,
        reason,
      },
    }
  );
}


/* ============================================================
   ORIGINAL PROOF DOWNLOAD
   MODERATOR ONLY
============================================================ */

export function proofDownloadUrl(
  reviewId: string
) {
  return `/reviews/${reviewId}/proof/download/`;
}


/* ============================================================
   FETCH ORIGINAL PROOF
   MODERATOR ONLY
============================================================ */

export async function fetchProofBlob(
  reviewId: string
): Promise<Blob> {
  const res = await fetch(
    `${API_BASE}${proofDownloadUrl(reviewId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Unable to load original proof");
  }

  return res.blob();
}


/* ============================================================
   REDACTED PROOF PREVIEW
   CUSTOMER VISIBLE
============================================================ */

export function proofPreviewUrl(
  reviewId: string
) {
  return `${API_BASE}/reviews/${reviewId}/proof/preview/`;
}


/* ============================================================
   FETCH REDACTED PROOF PREVIEW
   CUSTOMER VISIBLE
============================================================ */

export async function fetchProofPreviewBlob(
  reviewId: string
): Promise<Blob> {
  const token = getAccessToken();

  const headers: HeadersInit = {};

  /*
    If customer is logged in, send the token.
    If customer is not logged in, the public endpoint
    can still work without Authorization.
  */
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    proofPreviewUrl(reviewId),
    {
      method: "GET",
      headers,
    }
  );

  if (!res.ok) {
    throw new Error(
      "Unable to load verified proof preview"
    );
  }

  return res.blob();
}


/* ============================================================
   OPEN REDACTED PROOF PREVIEW
   CUSTOMER VISIBLE
============================================================ */

export async function openProofPreview(
  reviewId: string
): Promise<void> {
  /*
    Open the new tab immediately so the browser
    does not block it as a popup.
  */
  const previewWindow = window.open(
    "",
    "_blank"
  );

  try {
    const blob =
      await fetchProofPreviewBlob(reviewId);

    const blobUrl =
      URL.createObjectURL(blob);

    if (previewWindow) {
      previewWindow.location.href =
        blobUrl;
    } else {
      /*
        Fallback if browser blocked the new tab.
      */
      window.location.href = blobUrl;
    }

    /*
      Give the browser enough time to load the
      blob before releasing the object URL.
    */
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);

  } catch (error) {
    if (previewWindow) {
      previewWindow.close();
    }

    throw error;
  }
}