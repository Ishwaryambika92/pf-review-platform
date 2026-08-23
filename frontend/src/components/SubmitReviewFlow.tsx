import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Lock,
  Upload,
  X,
  EyeOff,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";

import { T } from "../design/tokens";
import * as api from "../api/endpoints";
import type { ServiceSummary } from "../api/types";
import { useLanguage } from "../i18n/LanguageContext";

const STEP_KEYS = [
  "step_service",
  "step_rating",
  "step_review",
  "step_proof",
  "step_privacy",
  "step_submit",
] as const;

type RecommendationChoice = "yes" | "maybe" | "no" | null;

const MAX_PROOF_SIZE = 2 * 1024 * 1024;

const ALLOWED_PROOF_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

export function SubmitReviewFlow({
  services,
  onClose,
}: {
  services: ServiceSummary[];
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();

  const [step, setStep] = useState(1);

  const [serviceId, setServiceId] = useState(
    services[0]?.id || ""
  );

  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [reviewerName, setReviewerName] = useState("");

  const [rating, setRating] = useState(0);

  const [subRatings, setSubRatings] = useState<
    Record<string, number>
  >({});

  const [title, setTitle] = useState("");

  const [body, setBody] = useState("");

  const [pros, setPros] = useState("");

  const [cons, setCons] = useState("");

  const [recommendationChoice, setRecommendationChoice] =
    useState<RecommendationChoice>(null);

  const [recommendationReaction, setRecommendationReaction] =
    useState<RecommendationChoice>(null);

  const [isAnonymous, setIsAnonymous] = useState(true);

  const [file, setFile] = useState<File | null>(null);

  const [allowIndicator, setAllowIndicator] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string>
  >({});

  const [result, setResult] = useState<{
    reference_id: string;
  } | null>(null);

  /*
   * Auto title based on rating
   */
  const getAutoTitle = (value: number) => {
    switch (value) {
      case 5:
        return "Excellent service experience";

      case 4:
        return "Good service experience";

      case 3:
        return "Average service experience";

      case 2:
        return "Poor service experience";

      case 1:
        return "Very poor service experience";

      default:
        return "";
    }
  };

  /*
   * Recommendation value
   */
  const getRecommendationValue = (): boolean | null => {
    if (recommendationChoice === "yes") {
      return true;
    }

    if (recommendationChoice === "no") {
      return false;
    }

    return null;
  };

  /*
   * Emoji animation
   */
  const triggerRecommendationReaction = (
    reaction: Exclude<RecommendationChoice, null>
  ) => {
    setRecommendationReaction(null);

    requestAnimationFrame(() => {
      setRecommendationReaction(reaction);
    });

    window.setTimeout(() => {
      setRecommendationReaction(null);
    }, 1200);
  };

  /*
   * Select recommendation
   */
  const selectRecommendation = (
    choice: Exclude<RecommendationChoice, null>
  ) => {
    setRecommendationChoice(choice);

    setFieldErrors((current) => {
      const next = { ...current };
      delete next.recommendation;
      return next;
    });

    triggerRecommendationReaction(choice);
  };

  /*
   * Validate selected proof
   */
  const validateProofFile = (
    selectedFile: File
  ): string | null => {
    if (!ALLOWED_PROOF_TYPES.includes(selectedFile.type)) {
      return "Only JPG, PNG or PDF files are allowed.";
    }

    if (selectedFile.size > MAX_PROOF_SIZE) {
      return "Proof file must be 2 MB or smaller.";
    }

    if (selectedFile.size === 0) {
      return "The selected file is empty.";
    }

    return null;
  };

  /*
   * Handle proof selection
   */
  const handleProofChange = (
    selectedFile: File | undefined
  ) => {
    if (!selectedFile) {
      return;
    }

    setError(null);

    const validationError =
      validateProofFile(selectedFile);

    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
  };

  /*
   * Validation
   */
  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1 && !serviceId) {
      errs.service = t("val_service_required");
    }

    if (step === 2 && rating < 1) {
      errs.rating = t("val_rating_required");
    }

    if (step === 3) {
      if (!title.trim()) {
        errs.title = t("val_title_required");
      }

      if (body.trim().length < 10) {
        errs.body = t("val_body_required");
      }

      if (recommendationChoice === null) {
        errs.recommendation =
          t("val_recommendation_required");
      }
    }

    setFieldErrors(errs);

    return Object.keys(errs).length === 0;
  };

  /*
   * Submit review
   */
  const submit = async () => {
    setError(null);

    if (!validateStep()) {
      return;
    }

    /*
     * Validate proof again before sending.
     * This protects against invalid file state.
     */
    if (file) {
      const proofError = validateProofFile(file);

      if (proofError) {
        setError(proofError);
        return;
      }
    }

    setSubmitting(true);

    try {
      /*
       * STEP 1
       * Create review
       */
      const review = await api.submitReview({
        service: serviceId,

        title: title.trim(),

        body: body.trim(),

        pros: pros.trim(),

        cons: cons.trim(),

        would_recommend:
          getRecommendationValue(),

        is_anonymous: isAnonymous,

        reviewer_name: isAnonymous
          ? ""
          : reviewerName.trim(),

        language: lang,

        service_date: serviceDate,

        allow_privacy_safe_indicator:
          allowIndicator,

        rating: {
          overall: rating,
          ...subRatings,
        },
      });

      /*
       * STEP 2
       * Upload proof AFTER review is created.
       */
      if (file) {
        try {
          await api.uploadProof(
            review.id,
            file
          );
        } catch (uploadError: any) {
          console.error(
            "PROOF UPLOAD FAILED:",
            uploadError
          );

          /*
           * Important:
           * Do NOT silently continue.
           */
          throw new Error(
            uploadError?.message ||
              "Proof upload failed. Please try again."
          );
        }
      }

      /*
       * STEP 3
       * Only show success after proof upload succeeds.
       */
      setResult({
        reference_id:
          review.reference_id,
      });
    } catch (e: any) {
      console.error(
        "REVIEW SUBMISSION ERROR:",
        e
      );

      const bodyError = e?.body;

      const msg =
        (bodyError &&
          typeof bodyError === "object" &&
          (bodyError.non_field_errors?.[0] ||
            Object.values(bodyError).flat()[0])) ||
        e?.message ||
        t("submit_generic_error");

      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * Next button
   */
  const goNext = () => {
    setError(null);

    if (!validateStep()) {
      return;
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      submit();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16,27,45,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <style>{`
        .pf-recommendation-reaction {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 30;
          font-size: 36px;
          line-height: 1;
          animation: pf-single-emoji-pop 1.2s ease-out forwards;
        }

        @keyframes pf-single-emoji-pop {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }

          15% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.25);
          }

          35% {
            opacity: 1;
            transform: translate(-50%, -75%) scale(1);
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -190%) scale(0.9);
          }
        }

        .pf-optional-label {
          margin-left: 7px;
          display: inline-flex;
          align-items: center;
          padding: 2px 7px;
          border-radius: 999px;
          background: #f1f4f8;
          color: #6f7b8c;
          font-size: 10px;
          font-weight: 600;
          vertical-align: middle;
        }

        .pf-required-label {
          margin-left: 7px;
          color: #c44747;
          font-size: 10px;
          font-weight: 700;
          vertical-align: middle;
        }
      `}</style>

      <div
        style={{
          background: T.paperRaised,
          borderRadius: 18,
          width: 560,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 28,
          fontFamily: T.bodyFont,
          boxShadow:
            "0 24px 64px rgba(12,32,54,0.3)",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: T.displayFont,
              fontSize: 20,
              fontWeight: 600,
              color: T.ink,
            }}
          >
            {t("form_title")}
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.inkFaint,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* PROGRESS BAR */}

        {!result && (
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 24,
            }}
          >
            {STEP_KEYS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 3,
                  background:
                    i + 1 <= step
                      ? T.navy
                      : T.line,
                }}
              />
            ))}
          </div>
        )}

        {/* SUCCESS */}

        {result ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background:
                  T.verifiedSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Check
                size={28}
                color={T.verified}
              />
            </div>

            <div
              style={{
                fontFamily:
                  T.displayFont,
                fontSize: 20,
                fontWeight: 600,
                color: T.ink,
                marginBottom: 6,
              }}
            >
              {t("submitted_title")}
            </div>

            <p
              style={{
                color: T.inkSoft,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {t("submitted_body")}
            </p>

            <div
              style={{
                display: "inline-block",
                marginTop: 10,
                background: T.paper,
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                padding: "8px 14px",
                fontFamily: T.monoFont,
                fontSize: 13,
                color: T.navy,
              }}
            >
              {t("reference_id")}:{" "}
              {result.reference_id}
            </div>

            <div>
              <button
                onClick={onClose}
                style={{
                  marginTop: 22,
                  background: T.navy,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("done")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1 */}

            {step === 1 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <Field
                  label={t("field_service")}
                  error={fieldErrors.service}
                >
                  <select
                    value={serviceId}
                    onChange={(e) =>
                      setServiceId(
                        e.target.value
                      )
                    }
                    style={selectStyle}
                  >
                    {services.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label={t(
                    "field_service_date"
                  )}
                >
                  <input
                    type="date"
                    value={serviceDate}
                    max={new Date()
                      .toISOString()
                      .slice(0, 10)}
                    onChange={(e) =>
                      setServiceDate(
                        e.target.value
                      )
                    }
                    style={selectStyle}
                  />
                </Field>

                <Field
                  label={t(
                    "field_reviewer_name"
                  )}
                >
                  <input
                    value={reviewerName}
                    onChange={(e) =>
                      setReviewerName(
                        e.target.value
                      )
                    }
                    placeholder={t(
                      "field_reviewer_name_placeholder"
                    )}
                    disabled={isAnonymous}
                    style={{
                      ...selectStyle,
                      opacity: isAnonymous
                        ? 0.5
                        : 1,
                    }}
                  />
                </Field>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    id="anon"
                    checked={isAnonymous}
                    onChange={(e) =>
                      setIsAnonymous(
                        e.target.checked
                      )
                    }
                    style={{
                      width: 16,
                      height: 16,
                    }}
                  />

                  <label
                    htmlFor="anon"
                    style={{
                      fontSize: 13.5,
                      color: T.inkSoft,
                    }}
                  >
                    {t(
                      "field_anonymous"
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2 */}

            {step === 2 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.ink,
                      marginBottom: 8,
                    }}
                  >
                    {t(
                      "field_overall_rating"
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    {[1, 2, 3, 4, 5].map(
                      (i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setRating(i);

                            if (
                              !title.trim()
                            ) {
                              setTitle(
                                getAutoTitle(
                                  i
                                )
                              );
                            }
                          }}
                          style={{
                            background:
                              "none",
                            border: "none",
                            cursor:
                              "pointer",
                          }}
                        >
                          <StarIcon
                            filled={
                              i <= rating
                            }
                          />
                        </button>
                      )
                    )}
                  </div>

                  {fieldErrors.rating && (
                    <div
                      style={{
                        color: T.danger,
                        fontSize: 12.5,
                        marginTop: 6,
                      }}
                    >
                      {fieldErrors.rating}
                    </div>
                  )}
                </div>

                {[
                  [
                    "quality",
                    t("field_quality"),
                  ],
                  [
                    "communication",
                    t(
                      "field_communication"
                    ),
                  ],
                  [
                    "transparency",
                    t(
                      "field_transparency"
                    ),
                  ],
                  [
                    "value_for_money",
                    t("field_value"),
                  ],
                ].map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    compact
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 3,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map(
                        (i) => (
                          <button
                            key={i}
                            onClick={() =>
                              setSubRatings(
                                (s) => ({
                                  ...s,
                                  [key]: i,
                                })
                              )
                            }
                            style={{
                              background:
                                "none",
                              border: "none",
                              cursor:
                                "pointer",
                            }}
                          >
                            <StarIcon
                              filled={
                                i <=
                                (subRatings[
                                  key
                                ] || 0)
                              }
                              size={16}
                            />
                          </button>
                        )
                      )}
                    </div>
                  </Field>
                ))}
              </div>
            )}

            {/* STEP 3 */}

            {step === 3 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <Field
                  label={t("field_title")}
                  error={fieldErrors.title}
                >
                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                    placeholder={t(
                      "field_title_placeholder"
                    )}
                    style={selectStyle}
                  />
                </Field>

                <div
                  style={{
                    background: "#EEF3FF",
                    border: `1px solid ${T.line}`,
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 700,
                      fontSize: 13.5,
                      color: T.navy,
                      marginBottom: 8,
                    }}
                  >
                    <Lightbulb size={15} />

                    {t(
                      "what_should_i_write"
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12.5,
                      color: T.inkSoft,
                      whiteSpace: "pre-line",
                      lineHeight: 1.6,
                      marginBottom: 10,
                    }}
                  >
                    {t(
                      "what_should_i_write_body"
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: T.inkFaint,
                      whiteSpace: "pre-line",
                      lineHeight: 1.6,
                      fontStyle: "italic",
                      borderTop: `1px solid ${T.line}`,
                      paddingTop: 8,
                    }}
                  >
                    {t(
                      "example_review"
                    )}
                  </div>
                </div>

                <Field
                  label={
                    <>
                      {t(
                        "review_experience_title"
                      )}

                      <span className="pf-required-label">
                        {t("required")}
                      </span>
                    </>
                  }
                  error={fieldErrors.body}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: T.inkFaint,
                      marginBottom: 6,
                    }}
                  >
                    {t(
                      "review_experience_hint"
                    )}
                  </div>

                  <textarea
                    value={body}
                    onChange={(e) =>
                      setBody(
                        e.target.value
                      )
                    }
                    rows={5}
                    placeholder={t(
                      "field_body_placeholder"
                    )}
                    style={{
                      ...selectStyle,
                      resize: "none",
                    }}
                  />
                </Field>

                <div
                  style={{
                    fontSize: 12,
                    color: T.verified,
                    fontWeight: 600,
                  }}
                >
                  {t("genuine_notice")}
                </div>

                <Field
                  label={
                    <>
                      {t(
                        "what_went_well"
                      )}

                      <span className="pf-optional-label">
                        {t("optional")}
                      </span>
                    </>
                  }
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: T.inkFaint,
                      marginBottom: 6,
                    }}
                  >
                    {t(
                      "what_went_well_hint"
                    )}
                  </div>

                  <textarea
                    value={pros}
                    onChange={(e) =>
                      setPros(
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder={t(
                      "what_went_well_placeholder"
                    )}
                    style={{
                      ...selectStyle,
                      resize: "none",
                    }}
                  />
                </Field>

                <Field
                  label={
                    <>
                      {t(
                        "what_could_improve"
                      )}

                      <span className="pf-optional-label">
                        {t("optional")}
                      </span>
                    </>
                  }
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: T.inkFaint,
                      marginBottom: 6,
                    }}
                  >
                    {t(
                      "what_could_improve_hint"
                    )}
                  </div>

                  <textarea
                    value={cons}
                    onChange={(e) =>
                      setCons(
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder={t(
                      "what_could_improve_placeholder"
                    )}
                    style={{
                      ...selectStyle,
                      resize: "none",
                    }}
                  />
                </Field>

                <Field
                  label={
                    <>
                      {t(
                        "recommend_service"
                      )}

                      <span className="pf-required-label">
                        {t("required")}
                      </span>
                    </>
                  }
                  error={
                    fieldErrors.recommendation
                  }
                >
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    {recommendationReaction && (
                      <div
                        key={
                          recommendationReaction
                        }
                        className="pf-recommendation-reaction"
                        aria-hidden="true"
                      >
                        {recommendationReaction ===
                          "yes" && "😊"}

                        {recommendationReaction ===
                          "maybe" && "🤔"}

                        {recommendationReaction ===
                          "no" && "😕"}
                      </div>
                    )}

                    <ToggleButton
                      active={
                        recommendationChoice ===
                        "yes"
                      }
                      onClick={() =>
                        selectRecommendation(
                          "yes"
                        )
                      }
                      label={t("yes")}
                    />

                    <ToggleButton
                      active={
                        recommendationChoice ===
                        "maybe"
                      }
                      onClick={() =>
                        selectRecommendation(
                          "maybe"
                        )
                      }
                      label={t("maybe")}
                    />

                    <ToggleButton
                      active={
                        recommendationChoice ===
                        "no"
                      }
                      onClick={() =>
                        selectRecommendation(
                          "no"
                        )
                      }
                      label={t("no")}
                    />
                  </div>
                </Field>
              </div>
            )}

            {/* STEP 4 — PROOF */}

            {step === 4 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    background: "#FBF1DE",
                    border:
                      "1px solid #E8D3A1",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 13,
                    color: "#8A6612",
                    lineHeight: 1.5,
                  }}
                >
                  {t("proof_warning")}
                </div>

                {!file ? (
                  <label
                    style={{
                      border: `1.5px dashed ${T.line}`,
                      borderRadius: 12,
                      padding: "28px 16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      color: T.inkFaint,
                    }}
                  >
                    <Upload size={22} />

                    <span
                      style={{
                        fontSize: 13.5,
                        textAlign: "center",
                      }}
                    >
                      Upload proof
                      <br />
                      JPG / PNG / PDF
                      <br />
                      Maximum 2 MB
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      style={{
                        display: "none",
                      }}
                      onChange={(e) =>
                        handleProofChange(
                          e.target
                            .files?.[0]
                        )
                      }
                    />
                  </label>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      border: `1px solid ${T.line}`,
                      borderRadius: 10,
                      padding:
                        "10px 14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 8,
                        fontSize: 13.5,
                        minWidth: 0,
                      }}
                    >
                      <FileCheck2
                        size={16}
                        color={T.verified}
                      />

                      <span
                        style={{
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {file.name}
                      </span>

                      <span
                        style={{
                          color:
                            T.inkFaint,
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        (
                        {(
                          file.size /
                          1024
                        ).toFixed(0)}{" "}
                        KB)
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setFile(null)
                      }
                      style={{
                        background:
                          "none",
                        border: "none",
                        cursor:
                          "pointer",
                        color:
                          T.inkFaint,
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      background:
                        "#FFF1F1",
                      border:
                        "1px solid #F0CACA",
                      color:
                        T.danger,
                      borderRadius: 8,
                      padding:
                        "10px 12px",
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div
                  style={{
                    fontSize: 12,
                    color: T.inkFaint,
                    lineHeight: 1.5,
                  }}
                >
                  Upload only proof related
                  to your service experience.
                  Do not upload Aadhaar,
                  PAN, bank account numbers,
                  passwords, OTPs or other
                  sensitive information.
                </div>
              </div>
            )}

            {/* STEP 5 */}

            {step === 5 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "flex-start",
                    gap: 10,
                  }}
                >
                  <Lock
                    size={18}
                    color={T.navy}
                    style={{
                      marginTop: 2,
                    }}
                  />

                  <div
                    style={{
                      fontSize: 13.5,
                      color: T.inkSoft,
                      lineHeight: 1.6,
                    }}
                  >
                    {t(
                      "privacy_notice"
                    )}
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${T.line}`,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: T.ink,
                      marginBottom: 10,
                    }}
                  >
                    {t(
                      "privacy_indicator_question"
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    <ToggleButton
                      active={
                        allowIndicator
                      }
                      onClick={() =>
                        setAllowIndicator(
                          true
                        )
                      }
                      icon={
                        <ShieldCheck
                          size={14}
                        />
                      }
                      label={t(
                        "privacy_indicator_yes"
                      )}
                    />

                    <ToggleButton
                      active={
                        !allowIndicator
                      }
                      onClick={() =>
                        setAllowIndicator(
                          false
                        )
                      }
                      icon={
                        <EyeOff
                          size={14}
                        />
                      }
                      label={t(
                        "privacy_indicator_no"
                      )}
                    />
                  </div>
                </div>

                {file && (
                  <div
                    style={{
                      background:
                        "#EEF8F2",
                      border:
                        "1px solid #CBE8D5",
                      borderRadius: 10,
                      padding:
                        "10px 12px",
                      fontSize: 13,
                      color:
                        T.verified,
                    }}
                  >
                    ✓ Proof selected:{" "}
                    {file.name}
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      background:
                        "#FFF1F1",
                      border:
                        "1px solid #F0CACA",
                      color:
                        T.danger,
                      borderRadius: 8,
                      padding:
                        "10px 12px",
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* FOOTER */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginTop: 26,
              }}
            >
              <button
                onClick={() =>
                  step > 1
                    ? setStep(step - 1)
                    : onClose()
                }
                disabled={submitting}
                style={{
                  ...backBtn,
                  opacity: submitting
                    ? 0.5
                    : 1,
                }}
              >
                <ChevronLeft size={15} />

                {step > 1
                  ? t("back")
                  : t("cancel")}
              </button>

              <button
                disabled={submitting}
                onClick={goNext}
                style={{
                  ...nextBtn,
                  opacity: submitting
                    ? 0.6
                    : 1,
                }}
              >
                {submitting
                  ? "Uploading..."
                  : step < 5
                  ? t("continue")
                  : t(
                      "submit_review"
                    )}

                <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------
   STAR
---------------------------------- */

function StarIcon({
  filled,
  size = 30,
}: {
  filled: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={
        filled ? T.gold : "none"
      }
      stroke={
        filled ? T.gold : T.line
      }
      strokeWidth={1.5}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

/* ---------------------------------
   TOGGLE BUTTON
---------------------------------- */

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent:
          "center",
        gap: 6,
        padding: "10px 10px",
        minHeight: 42,
        borderRadius: 9,
        cursor: "pointer",
        fontSize: 12.5,
        fontWeight: 600,
        border: `1.5px solid ${
          active
            ? T.navy
            : T.line
        }`,
        background: active
          ? T.navy
          : "#fff",
        color: active
          ? "#fff"
          : T.inkSoft,
        transition:
          "all 0.18s ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------------------------
   FIELD
---------------------------------- */

function Field({
  label,
  children,
  compact,
  error,
}: {
  label: ReactNode;
  children: ReactNode;
  compact?: boolean;
  error?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: compact
            ? 12.5
            : 13.5,
          fontWeight: 600,
          color: T.ink,
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      {children}

      {error && (
        <div
          style={{
            color: T.danger,
            fontSize: 12.5,
            marginTop: 5,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------
   STYLES
---------------------------------- */

const selectStyle: CSSProperties = {
  width: "100%",
  border: `1px solid ${T.line}`,
  borderRadius: 9,
  padding: "10px 12px",
  fontSize: 13.5,
  fontFamily: T.bodyFont,
  boxSizing: "border-box",
};

const backBtn: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: "none",
  border: `1px solid ${T.line}`,
  borderRadius: 10,
  padding: "9px 16px",
  fontSize: 13.5,
  fontWeight: 600,
  color: T.inkSoft,
  cursor: "pointer",
};

const nextBtn: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: T.navy,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "9px 18px",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};