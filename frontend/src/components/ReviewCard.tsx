import { useState } from "react";
import {
  FileCheck2,
  ThumbsUp,
  UserRound,
  CalendarDays,
  Eye,
} from "lucide-react";

import { T } from "../design/tokens";
import { Stars, VerifiedSeal, Badge } from "./Primitives";
import * as api from "../api/endpoints";
import type { ReviewPublic } from "../api/types";
import { useLanguage } from "../i18n/LanguageContext";

export function ReviewCard({
  r,
}: {
  r: ReviewPublic;
}) {
  const { t } = useLanguage();

  const [helpful, setHelpful] = useState(
    r.helpful_count
  );

  const [voted, setVoted] = useState(false);

  const [voting, setVoting] = useState(false);

  /* ============================================================
     HELPFUL VOTE
  ============================================================ */

  const onHelpful = async () => {
    if (voted || voting) {
      return;
    }

    setVoting(true);

    try {
      await api.markHelpful(r.id);

      setHelpful((h) => h + 1);
      setVoted(true);
    } catch (e: any) {
      if (e?.status === 400) {
        setVoted(true);
      }
    } finally {
      setVoting(false);
    }
  };

  /* ============================================================
     CUSTOMER CAN VIEW REDACTED PROOF
  ============================================================ */

  const canViewProof =
    r.is_verified &&
    r.proof_verified &&
    r.proof_preview_available;

  return (
    <div
      style={{
        background: T.paperRaised,
        border: `1px solid ${T.line}`,
        borderRadius: 14,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
      }}
    >
      {/* ========================================================
         RATING + VERIFICATION
      ======================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Stars
          value={r.rating?.overall ?? 0}
        />

        {r.is_verified ? (
          <VerifiedSeal
            small
            isVerified
          />
        ) : (
          <Badge>
            {t("badge_unverified")}
          </Badge>
        )}
      </div>

      {/* ========================================================
         REVIEW TITLE
      ======================================================== */}

      <div
        style={{
          fontFamily: T.displayFont,
          fontSize: 18,
          fontWeight: 600,
          color: T.ink,
        }}
      >
        {r.title}
      </div>

      {/* ========================================================
         USER / SERVICE / DATE
      ======================================================== */}

      <div
        style={{
          fontSize: 13.5,
          color: T.inkSoft,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 600,
            color: T.ink,
          }}
        >
          <UserRound size={14} />

          {r.display_name}
        </span>

        <span>·</span>

        <span>
          {r.service_name}
        </span>

        <span>·</span>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <CalendarDays size={14} />

          {new Date(
            r.service_date
          ).toLocaleDateString(
            undefined,
            {
              month: "short",
              year: "numeric",
            }
          )}
        </span>
      </div>

      {/* ========================================================
         REVIEW BODY
      ======================================================== */}

      <p
        style={{
          fontSize: 14.5,
          color: T.inkSoft,
          lineHeight: 1.6,
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {r.body}
      </p>

      {/* ========================================================
         PROOF VERIFIED + VIEW VERIFIED PROOF
      ======================================================== */}

      {r.is_verified &&
        r.proof_verified && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 2,
            }}
          >
            {/* Proof Verified */}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                color: T.verified,
                fontWeight: 500,
              }}
            >
              <FileCheck2 size={14} />

              {t("proof_verified")}
            </div>

            {/* ==================================================
               VIEW REDACTED PROOF
            ================================================== */}

            {canViewProof && (
              <a
                href={api.proofPreviewUrl(r.id)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View verified proof"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: `1px solid ${T.line}`,
                  background: T.paper,
                  color: T.navy,
                  textDecoration: "none",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Eye size={14} />

                View Verified Proof
              </a>
            )}
          </div>
        )}

      {/* ========================================================
         HELPFUL
      ======================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          marginTop: 6,
          paddingTop: 12,
          borderTop: `1px solid ${T.line}`,
        }}
      >
        <button
          onClick={onHelpful}
          disabled={voting}
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: voted
              ? T.navy
              : T.inkSoft,
            background: "none",
            border: "none",
            cursor: voting
              ? "default"
              : "pointer",
            fontFamily: T.bodyFont,
          }}
        >
          <ThumbsUp
            size={14}
            fill={
              voted
                ? T.navy
                : "none"
            }
          />

          {t("helpful")} ({helpful})
        </button>
      </div>
    </div>
  );
}