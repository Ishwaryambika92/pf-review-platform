import { useEffect, useState } from "react";
import {
  FileCheck2,
  ShieldCheck,
  ShieldX,
  HelpCircle,
  Eye,
} from "lucide-react";

import { T } from "../design/tokens";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components/Primitives";

import * as api from "../api/endpoints";
import type { ModerationReview } from "../api/types";
import { useAuth } from "../context/AuthContext";


const CHECKLIST_ITEMS = [
  {
    key: "proof_relevant",
    label: "Proof appears relevant",
  },
  {
    key: "matches_service",
    label: "Review matches service",
  },
  {
    key: "no_sensitive_info",
    label: "No obvious sensitive information exposed",
  },
  {
    key: "no_spam",
    label: "No obvious spam",
  },
  {
    key: "no_duplicate",
    label: "No duplicate detected",
  },
];


export default function AdminModeration() {
  const { user, loading } = useAuth();

  const [queue, setQueue] =
    useState<ModerationReview[] | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [selected, setSelected] =
    useState<ModerationReview | null>(null);

  // Original private proof
  const [proofUrl, setProofUrl] =
    useState<string | null>(null);

  const [proofLoading, setProofLoading] =
    useState(false);

  // Redacted preview
  const [previewFile, setPreviewFile] =
    useState<File | null>(null);

  const [previewUploading, setPreviewUploading] =
    useState(false);

  const [checklist, setChecklist] =
    useState<Record<string, boolean>>({});

  const [reason, setReason] =
    useState("");

  const [deciding, setDeciding] =
    useState(false);


  // ============================================================
  // LOAD MODERATION QUEUE
  // ============================================================

  const loadQueue = async () => {
    try {
      const data = await api.moderationQueue();

      setQueue(data.results);
      setError(null);
    } catch (e: any) {
      setError(
        e?.status === 403
          ? "You don't have moderator access."
          : "Couldn't load the moderation queue."
      );
    }
  };


  useEffect(() => {
    if (!loading && user) {
      loadQueue();
    }
  }, [loading, user]);


  // ============================================================
  // OPEN REVIEW
  // ============================================================

  const openReview = async (
    r: ModerationReview
  ) => {
    setSelected(r);

    setChecklist({});
    setReason("");

    setProofUrl(null);

    setPreviewFile(null);

    // Claim pending review
    if (r.status === "pending") {
      try {
        const claimed =
          await api.claimReview(r.id);

        setSelected(claimed);
      } catch (e: any) {
        alert(
          e?.body?.detail ||
            "Couldn't claim this review."
        );
        return;
      }
    }

    // Load original private proof
    if (r.has_proof) {
      setProofLoading(true);

      try {
        const blob =
          await api.fetchProofBlob(r.id);

        setProofUrl(
          URL.createObjectURL(blob)
        );
      } catch {
        setProofUrl(null);
      } finally {
        setProofLoading(false);
      }
    }
  };


  // ============================================================
  // UPLOAD REDACTED PREVIEW
  // ============================================================

  const uploadPreview = async () => {
    if (!selected) {
      return;
    }

    if (!previewFile) {
      alert(
        "Please select a redacted preview file first."
      );
      return;
    }

    setPreviewUploading(true);

    try {
      await api.uploadProofPreview(
        selected.id,
        previewFile
      );

      alert(
        "Redacted proof preview uploaded successfully."
      );

      setPreviewFile(null);

      // Clear file input visually by refreshing selected review
      await loadQueue();
    } catch (e: any) {
      alert(
        e?.body?.detail ||
          "Couldn't upload the redacted proof preview."
      );
    } finally {
      setPreviewUploading(false);
    }
  };


  // ============================================================
  // DECIDE REVIEW
  // ============================================================

  const decide = async (
    decision:
      | "verified"
      | "rejected"
      | "needs_info"
      | "published_unverified"
  ) => {
    if (!selected) {
      return;
    }

    setDeciding(true);

    try {
      await api.decideReview(
        selected.id,
        decision,
        checklist,
        reason
      );

      setSelected(null);
      setProofUrl(null);
      setPreviewFile(null);

      await loadQueue();
    } catch (e: any) {
      alert(
        e?.body?.detail ||
          "Couldn't record the decision."
      );
    } finally {
      setDeciding(false);
    }
  };


  // ============================================================
  // AUTH STATES
  // ============================================================

  if (loading) {
    return (
      <LoadingState
        label="Checking access…"
      />
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <ErrorState
          message="Please log in as a moderator."
        />
      </div>
    );
  }


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div
      className="pf-moderation-page"
      style={{
        background: T.paper,
        minHeight: "100vh",
        fontFamily: T.bodyFont,
        padding: "32px 24px",
      }}
    >

      <style>{`

        .pf-moderation-layout {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .pf-moderation-layout > * {
          min-width: 0;
          width: 100%;
        }

        .pf-moderation-details {
          min-width: 0;
          width: 100%;
          overflow: hidden;
          overflow-wrap: anywhere;
        }

        .pf-moderation-details p {
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .pf-moderation-queue-item {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          overflow-wrap: anywhere;
        }

        .pf-moderation-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          min-width: 0;
        }

        .pf-moderation-meta span {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        @media (min-width: 901px) {
          .pf-moderation-layout.has-selection {
            grid-template-columns:
              minmax(280px, 380px)
              minmax(0, 1fr);
          }
        }

        @media (max-width: 900px) {

          .pf-moderation-page {
            padding: 24px 16px !important;
          }

          .pf-moderation-layout,
          .pf-moderation-layout.has-selection {
            grid-template-columns:
              minmax(0, 1fr) !important;

            gap: 18px !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .pf-moderation-layout > * {
            width: 100% !important;
            max-width: 100% !important;
          }

          .pf-moderation-details {
            padding: 18px !important;
            border-radius: 14px !important;
          }

          .pf-moderation-details textarea {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .pf-moderation-details button {
            min-height: 42px;
            touch-action: manipulation;
          }
        }

        @media (max-width: 480px) {

          .pf-moderation-page {
            padding: 20px 12px !important;
          }

          .pf-moderation-layout {
            gap: 14px !important;
          }

          .pf-moderation-details {
            padding: 14px !important;
          }

          .pf-moderation-meta {
            flex-wrap: wrap;
          }
        }

      `}</style>


      <div
        className={`pf-moderation-layout ${
          selected
            ? "has-selection"
            : ""
        }`}
      >

        {/* =====================================================
            MODERATION QUEUE
        ====================================================== */}

        <div>

          <div
            style={{
              fontFamily: T.displayFont,
              fontSize: 22,
              fontWeight: 600,
              marginBottom: 16,
              color: T.ink,
            }}
          >
            Moderation Queue
          </div>


          {error && (
            <ErrorState message={error} />
          )}


          {!error && !queue && (
            <LoadingState
              label="Loading queue…"
            />
          )}


          {queue &&
            queue.length === 0 && (
              <EmptyState
                message="Nothing pending — the queue is clear."
              />
            )}


          {queue &&
            queue.length > 0 && (

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >

                {queue.map((r) => (

                  <button
                    key={r.id}
                    className="pf-moderation-queue-item"
                    onClick={() =>
                      openReview(r)
                    }
                    style={{
                      textAlign: "left",
                      background:
                        selected?.id === r.id
                          ? T.navy
                          : "#fff",
                      color:
                        selected?.id === r.id
                          ? "#fff"
                          : T.ink,
                      border:
                        `1px solid ${T.line}`,
                      borderRadius: 12,
                      padding: "14px",
                      cursor: "pointer",
                      fontFamily: T.bodyFont,
                      boxSizing: "border-box",
                    }}
                  >

                    <div
                      className="pf-moderation-meta"
                      style={{
                        fontSize: 11.5,
                        opacity: 0.75,
                        marginBottom: 4,
                      }}
                    >

                      <span
                        style={{
                          fontFamily: T.monoFont,
                        }}
                      >
                        {r.reference_id}
                      </span>

                      <span>
                        {r.status.replace(
                          "_",
                          " "
                        )}
                      </span>

                    </div>


                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {r.title}
                    </div>


                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                        marginTop: 2,
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {r.service_name} ·{" "}
                      {r.rating_overall}★ ·{" "}
                      {r.has_proof
                        ? "Proof attached"
                        : "No proof"}

                      {r.report_count > 0 &&
                        ` · ${r.report_count} report(s)`}
                    </div>

                  </button>

                ))}

              </div>

            )}

        </div>


        {/* =====================================================
            REVIEW DETAILS
        ====================================================== */}

        {selected && (

          <div
            className="pf-moderation-details"
            style={{
              background: "#fff",
              border:
                `1px solid ${T.line}`,
              borderRadius: 16,
              padding: 24,
              boxSizing: "border-box",
            }}
          >

            <div
              style={{
                fontFamily: T.monoFont,
                fontSize: 12,
                color: T.inkFaint,
                marginBottom: 6,
                overflowWrap:
                  "anywhere",
              }}
            >
              {selected.reference_id}
            </div>


            <div
              style={{
                fontFamily: T.displayFont,
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 6,
                overflowWrap:
                  "anywhere",
              }}
            >
              {selected.title}
            </div>


            <div
              style={{
                fontSize: 13,
                color: T.inkSoft,
                marginBottom: 14,
                overflowWrap:
                  "anywhere",
              }}
            >
              {selected.reviewer_username} ·{" "}
              {selected.service_name} ·{" "}
              {selected.rating_overall}★ ·{" "}
              {selected.service_date}
            </div>


            <p
              style={{
                fontSize: 14,
                color: T.ink,
                lineHeight: 1.6,
                background: T.paper,
                padding: 14,
                borderRadius: 10,
                overflowWrap:
                  "anywhere",
                wordBreak:
                  "break-word",
                margin: 0,
              }}
            >
              {selected.body}
            </p>


            {/* =================================================
                ORIGINAL PRIVATE PROOF
            ================================================== */}

            <div
              style={{
                marginTop: 18,
              }}
            >

              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13.5,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FileCheck2 size={15} />

                Uploaded Proof
              </div>


              {!selected.has_proof && (
                <div
                  style={{
                    fontSize: 13,
                    color: T.inkFaint,
                  }}
                >
                  No proof was attached to this review.
                </div>
              )}


              {selected.has_proof &&
                proofLoading && (
                  <LoadingState
                    label="Loading proof securely…"
                  />
                )}


              {selected.has_proof &&
                !proofLoading &&
                proofUrl && (

                  <div
                    style={{
                      border:
                        `1px solid ${T.line}`,
                      borderRadius: 10,
                      padding: 10,
                      maxWidth: "100%",
                      boxSizing:
                        "border-box",
                    }}
                  >

                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems:
                          "flex-start",
                        gap: 6,
                        color: T.navy,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration:
                          "none",
                        overflowWrap:
                          "anywhere",
                      }}
                    >

                      <Eye size={14} />

                      Open proof file
                      {" "}
                      (private,
                      staff-only view)

                    </a>

                  </div>
                )}

            </div>


            {/* =================================================
                REDACTED PUBLIC PREVIEW
            ================================================== */}

            {selected.has_proof && (

              <div
                style={{
                  marginTop: 18,
                }}
              >

                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13.5,
                    marginBottom: 8,
                  }}
                >
                  Safe / Redacted Proof Preview
                </div>


                <div
                  style={{
                    background: T.paper,
                    border:
                      `1px solid ${T.line}`,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >

                  <div
                    style={{
                      fontSize: 12,
                      color: T.inkSoft,
                      marginBottom: 10,
                      lineHeight: 1.5,
                    }}
                  >
                    Upload a redacted copy
                    of the original proof.
                    Hide UAN, Aadhaar,
                    bank account,
                    phone number and
                    other sensitive
                    information before
                    uploading.
                  </div>


                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => {
                      setPreviewFile(
                        e.target.files?.[0] ||
                          null
                      );
                    }}
                    style={{
                      width: "100%",
                      fontSize: 12.5,
                      marginBottom: 10,
                    }}
                  />


                  {previewFile && (

                    <div
                      style={{
                        fontSize: 12,
                        color: T.inkSoft,
                        marginBottom: 10,
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      Selected:{" "}
                      {previewFile.name}
                    </div>

                  )}


                  <button
                    type="button"
                    onClick={uploadPreview}
                    disabled={
                      previewUploading ||
                      !previewFile
                    }
                    style={{
                      border: "none",
                      borderRadius: 9,
                      padding:
                        "9px 14px",
                      background:
                        T.navy,
                      color: "#fff",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor:
                        previewUploading ||
                        !previewFile
                          ? "default"
                          : "pointer",
                      opacity:
                        previewUploading ||
                        !previewFile
                          ? 0.6
                          : 1,
                    }}
                  >
                    {previewUploading
                      ? "Uploading..."
                      : "Upload Redacted Preview"}
                  </button>

                </div>

              </div>

            )}


            {/* =================================================
                VERIFICATION CHECKLIST
            ================================================== */}

            <div
              style={{
                marginTop: 18,
              }}
            >

              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13.5,
                  marginBottom: 8,
                }}
              >
                Verification Checklist
              </div>


              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >

                {CHECKLIST_ITEMS.map(
                  (item) => (

                    <label
                      key={item.key}
                      style={{
                        display: "flex",
                        alignItems:
                          "flex-start",
                        gap: 8,
                        fontSize: 13,
                        lineHeight: 1.4,
                        cursor: "pointer",
                      }}
                    >

                      <input
                        type="checkbox"
                        checked={
                          !!checklist[
                            item.key
                          ]
                        }
                        onChange={(e) =>
                          setChecklist(
                            (c) => ({
                              ...c,
                              [item.key]:
                                e.target
                                  .checked,
                            })
                          )
                        }
                        style={{
                          flex:
                            "0 0 auto",
                          marginTop: 2,
                        }}
                      />

                      <span
                        style={{
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {item.label}
                      </span>

                    </label>

                  )
                )}

              </div>

            </div>


            {/* =================================================
                REASON / NOTES
            ================================================== */}

            <div
              style={{
                marginTop: 14,
              }}
            >

              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13.5,
                  marginBottom: 6,
                }}
              >
                Reason / notes
              </div>


              <textarea
                value={reason}
                onChange={(e) =>
                  setReason(
                    e.target.value
                  )
                }
                rows={3}
                style={{
                  width: "100%",
                  border:
                    `1px solid ${T.line}`,
                  borderRadius: 9,
                  padding:
                    "9px 11px",
                  fontSize: 13.5,
                  boxSizing:
                    "border-box",
                  resize: "vertical",
                }}
              />

            </div>


            {/* =================================================
                DECISION BUTTONS
            ================================================== */}

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >

              <DecisionBtn
                onClick={() =>
                  decide("verified")
                }
                disabled={deciding}
                color={T.verified}
                icon={
                  <ShieldCheck
                    size={14}
                  />
                }
                label="Verify"
              />


              <DecisionBtn
                onClick={() =>
                  decide(
                    "published_unverified"
                  )
                }
                disabled={deciding}
                color={T.inkSoft}
                icon={
                  <Eye size={14} />
                }
                label="Publish Unverified"
              />


              <DecisionBtn
                onClick={() =>
                  decide("needs_info")
                }
                disabled={deciding}
                color="#8A6612"
                icon={
                  <HelpCircle
                    size={14}
                  />
                }
                label="Needs Info"
              />


              <DecisionBtn
                onClick={() =>
                  decide("rejected")
                }
                disabled={deciding}
                color={T.danger}
                icon={
                  <ShieldX
                    size={14}
                  />
                }
                label="Reject"
              />

            </div>

          </div>

        )}

      </div>

    </div>
  );
}


// ============================================================
// DECISION BUTTON
// ============================================================

function DecisionBtn({
  onClick,
  disabled,
  color,
  icon,
  label,
}: any) {

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        border:
          `1.5px solid ${color}`,
        color,
        borderRadius: 9,
        padding: "8px 14px",
        fontSize: 12.5,
        fontWeight: 600,
        cursor:
          disabled
            ? "default"
            : "pointer",
        opacity:
          disabled ? 0.6 : 1,
      }}
    >
      {icon}

      {label}
    </button>
  );
}