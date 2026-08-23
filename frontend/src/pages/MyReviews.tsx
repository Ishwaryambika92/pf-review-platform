import { useEffect, useState } from "react";
import { T } from "../design/tokens";
import { LoadingState, ErrorState, EmptyState, Stars } from "../components/Primitives";
import * as api from "../api/endpoints";
import type { ReviewPublic } from "../api/types";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: T.inkFaint, bg: "#EEF1F5" },
  pending: { label: "Pending Verification", color: "#8A6612", bg: "#FBF1DE" },
  under_review: { label: "Under Review", color: T.navy, bg: "#E9EEF4" },
  verified: { label: "Verified", color: T.verified, bg: T.verifiedSoft },
  rejected: { label: "Rejected", color: T.danger, bg: "#FBEEEC" },
  needs_info: { label: "Needs More Information", color: "#8A6612", bg: "#FBF1DE" },
  published_unverified: { label: "Published (Unverified)", color: T.inkSoft, bg: "#EEF1F5" },
};

export default function MyReviews() {
  const [reviews, setReviews] = useState<(ReviewPublic & { verification_reason?: string | null }) [] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setReviews(await api.myReviews());
      } catch {
        setError("Couldn't load your reviews.");
      }
    })();
  }, []);

  return (
    <div style={{ background: T.paper, minHeight: "100vh", fontFamily: T.bodyFont, padding: "40px 24px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ fontFamily: T.displayFont, fontSize: 26, fontWeight: 600, marginBottom: 20, color: T.ink }}>My Reviews</div>
        {error && <ErrorState message={error} />}
        {!error && !reviews && <LoadingState label="Loading your reviews…" />}
        {reviews && reviews.length === 0 && <EmptyState message="You haven't submitted any reviews yet." />}
        {reviews && reviews.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reviews.map((r) => {
              const s = STATUS_LABEL[r.status] || STATUS_LABEL.pending;
              return (
                <div key={r.id} style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontFamily: T.monoFont, fontSize: 11.5, color: T.inkFaint, marginBottom: 4 }}>{r.reference_id}</div>
                      <div style={{ fontFamily: T.displayFont, fontSize: 17, fontWeight: 600 }}>{r.title}</div>
                      <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>{r.service_name} · {r.service_date}</div>
                    </div>
                    <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{s.label}</span>
                  </div>
                  <div style={{ marginTop: 10 }}><Stars value={r.rating.overall} size={14} /></div>
                  {r.verification_reason && (
                    <div style={{ marginTop: 10, fontSize: 12.5, color: T.inkSoft, background: T.paper, borderRadius: 8, padding: "8px 10px" }}>
                      Moderator note: {r.verification_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
