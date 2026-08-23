import { useEffect, useState } from "react";
import {
  Search,
  ShieldCheck,
  FileCheck2,
  Lock,
  TrendingUp,
} from "lucide-react";

import { T } from "../design/tokens";
import {
  Stars,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components/Primitives";

import { ReviewCard } from "../components/ReviewCard";
import { SubmitReviewFlow } from "../components/SubmitReviewFlow";

import * as api from "../api/endpoints";

import type {
  ReviewPublic,
  ServiceDetail,
  ServiceSummary,
} from "../api/types";

import { useLanguage } from "../i18n/LanguageContext";


type Sort =
  | "-created_at"
  | "-rating__overall"
  | "rating__overall";


export default function Home() {
  const { t } = useLanguage();

  // ============================================================
  // SERVICES
  // ============================================================

  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [activeService, setActiveService] =
    useState<ServiceDetail | null>(null);

  const [search, setSearch] = useState("");


  // ============================================================
  // REVIEWS
  // ============================================================

  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] =
    useState<string | null>(null);

  // Only sorting remains.
  // The All / Verified filter has been removed.
  const [sort, setSort] =
    useState<Sort>("-created_at");


  // ============================================================
  // REVIEW FORM
  // ============================================================

  const [showForm, setShowForm] = useState(false);


  // ============================================================
  // LOAD SERVICE DIRECTORY
  // ============================================================

  useEffect(() => {
    (async () => {
      setServicesLoading(true);
      setServicesError(null);

      try {
        const data = await api.listServices(
          search ? { search } : {}
        );

        setServices(data.results);

        // Automatically select first service
        if (
          data.results.length &&
          (
            !activeService ||
            !data.results.find(
              (s) => s.id === activeService.id
            )
          )
        ) {
          const detail = await api.getService(
            data.results[0].slug
          );

          setActiveService(detail);

        } else if (!data.results.length) {
          setActiveService(null);
        }

      } catch {
        setServicesError(
          t("services_error")
        );

      } finally {
        setServicesLoading(false);
      }

    })();

    // The service list should react only to search changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);


  // ============================================================
  // LOAD REVIEWS FOR ACTIVE SERVICE
  // ============================================================

  useEffect(() => {

    if (!activeService) {
      setReviews([]);
      return;
    }

    (async () => {

      setReviewsLoading(true);
      setReviewsError(null);

      try {

        const data = await api.listReviews({
          service: activeService.id,
          ordering: sort,
        });

        // No All / Verified filtering anymore.
        // All publicly available reviews returned by the
        // backend are displayed.
        setReviews(data.results);

      } catch {

        setReviewsError(
          t("reviews_error")
        );

      } finally {

        setReviewsLoading(false);

      }

    })();

  }, [activeService, sort, t]);


  // ============================================================
  // SELECT SERVICE
  // ============================================================

  const selectService = async (
    s: ServiceSummary
  ) => {

    try {

      const detail = await api.getService(
        s.slug
      );

      setActiveService(detail);

    } catch {

      setReviewsError(
        t("reviews_error")
      );

    }
  };


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div
      style={{
        background: T.paper,
        minHeight: "100vh",
        fontFamily: T.bodyFont,
        color: T.ink,
      }}
    >

      {/* ======================================================
          HERO
      ====================================================== */}

      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "64px 24px 40px",
          textAlign: "center",
        }}
      >

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: T.verifiedSoft,
            color: T.verified,
            fontSize: 12.5,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 999,
            marginBottom: 20,
          }}
        >
          <ShieldCheck size={14} />

          {t("hero_eyebrow")}
        </div>


        <h1
          style={{
            fontFamily: T.displayFont,
            fontSize: 46,
            fontWeight: 600,
            lineHeight: 1.15,
            margin: "0 0 16px",
            letterSpacing: "-0.5px",
          }}
        >
          {t("hero_title_1")}
          <br />
          {t("hero_title_2")}
        </h1>


        <p
          style={{
            color: T.inkSoft,
            fontSize: 16,
            maxWidth: 520,
            margin: "0 auto 28px",
            lineHeight: 1.6,
          }}
        >
          {t("hero_subtitle")}
        </p>


        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginBottom: 32,
          }}
        >

          {/* Explore Reviews */}

          <button
            onClick={() =>
              document
                .getElementById("directory")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
            style={{
              background: T.navy,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("hero_explore")}
          </button>


          {/* Write Review */}

          <button
            onClick={() => setShowForm(true)}
            style={{
              background: "#fff",
              color: T.navy,
              border: `1.5px solid ${T.navy}`,
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("hero_write")}
          </button>

        </div>


        {/* SEARCH */}

        <div
          style={{
            maxWidth: 420,
            margin: "0 auto",
            position: "relative",
          }}
        >

          <Search
            size={16}
            color={T.inkFaint}
            style={{
              position: "absolute",
              left: 14,
              top: 13,
            }}
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder={t("search_placeholder")}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: `1px solid ${T.line}`,
              borderRadius: 12,
              padding: "12px 12px 12px 38px",
              fontSize: 13.5,
              fontFamily: T.bodyFont,
              background: "#fff",
            }}
          />

        </div>

      </div>


      {/* ======================================================
          TRUST STRIP
      ====================================================== */}

      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 24px 56px",
        }}
      >

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
          }}
        >

          {[
            [
              ShieldCheck,
              t("trust_verified_title"),
              t("trust_verified_desc"),
            ],

            [
              TrendingUp,
              t("trust_transparent_title"),
              t("trust_transparent_desc"),
            ],

            [
              FileCheck2,
              t("trust_proof_title"),
              t("trust_proof_desc"),
            ],

            [
              Lock,
              t("trust_secure_title"),
              t("trust_secure_desc"),
            ],

            [
              Search,
              t("trust_community_title"),
              t("trust_community_desc"),
            ],

          ].map(
            ([Icon, ttl, d]: any, i) => (

              <div
                key={i}
                style={{
                  background: T.paperRaised,
                  border: `1px solid ${T.line}`,
                  borderRadius: 12,
                  padding: "16px 14px",
                }}
              >

                <Icon
                  size={18}
                  color={T.navy}
                />

                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  {ttl}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: T.inkFaint,
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {d}
                </div>

              </div>

            )
          )}

        </div>

      </div>


      {/* ======================================================
          DIRECTORY
      ====================================================== */}

      <div
        id="directory"
        className="pf-directory-grid"
        style={{
          maxWidth: 1080,
          width: "100%",
          margin: "0 auto",
          padding: "0 24px 72px",
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 32,
        }}
      >

        {/* ====================================================
            SERVICE DIRECTORY
        ==================================================== */}

        <div className="pf-service-column">

          {servicesLoading && (
            <LoadingState
              label={t("services_loading")}
            />
          )}

          {servicesError && (
            <ErrorState
              message={servicesError}
            />
          )}

          {!servicesLoading &&
            !servicesError &&
            services.length === 0 && (
              <EmptyState
                message={t("services_empty")}
              />
            )}


          {!servicesLoading &&
            services.length > 0 && (

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 20,
                }}
              >

                {services.map((s) => (

                  <button
                    key={s.id}
                    onClick={() =>
                      selectService(s)
                    }
                    style={{
                      textAlign: "left",
                      background:
                        activeService?.id === s.id
                          ? T.navy
                          : "#fff",
                      color:
                        activeService?.id === s.id
                          ? "#fff"
                          : T.ink,
                      border: `1px solid ${T.line}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: T.bodyFont,
                    }}
                  >

                    <div
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {s.name}
                    </div>

                    <div
                      style={{
                        fontSize: 11.5,
                        opacity: 0.8,
                      }}
                    >
                      {s.category_name}
                      {" · "}
                      {s.total_reviews}
                      {" "}
                      {t("reviews_count_suffix")}
                    </div>

                  </button>

                ))}

              </div>

            )}


          {/* ==================================================
              SERVICE STATISTICS
          ================================================== */}

          {activeService && (

            <div
              style={{
                background: T.paperRaised,
                border: `1px solid ${T.line}`,
                borderRadius: 16,
                padding: 22,
                position: "sticky",
                top: 90,
              }}
            >

              <div
                style={{
                  fontSize: 12.5,
                  color: T.inkFaint,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {activeService.category_name}
              </div>


              <div
                style={{
                  fontFamily: T.displayFont,
                  fontSize: 20,
                  fontWeight: 600,
                  margin: "4px 0 12px",
                }}
              >
                {activeService.name}
              </div>


              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 4,
                }}
              >

                <span
                  style={{
                    fontFamily: T.displayFont,
                    fontSize: 32,
                    fontWeight: 700,
                  }}
                >
                  {Number(
                    activeService.average_rating
                  ).toFixed(1)}
                </span>

                <span
                  style={{
                    color: T.inkFaint,
                    fontSize: 13,
                  }}
                >
                  / 5
                </span>

              </div>


              <Stars
                value={Number(
                  activeService.average_rating
                )}
                size={15}
              />


              <div
                style={{
                  fontSize: 12.5,
                  color: T.inkFaint,
                  margin: "6px 0 18px",
                }}
              >
                {t("based_on")}
                {" "}
                {activeService.total_reviews}
                {" "}
                {t("reviews_word")}
              </div>


              {activeService.total_reviews === 0 ? (

                <EmptyState
                  message={t(
                    "no_reviews_for_service"
                  )}
                />

              ) : (

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >

                  {activeService.rating_distribution.map(
                    (d) => (

                      <div
                        key={d.stars}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >

                        <span
                          style={{
                            width: 34,
                            fontSize: 12.5,
                            color: T.inkSoft,
                            fontFamily: T.monoFont,
                          }}
                        >
                          {d.stars}★
                        </span>

                        <div
                          style={{
                            flex: 1,
                            height: 7,
                            background: "#EEF1F5",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >

                          <div
                            style={{
                              width: `${d.pct}%`,
                              height: "100%",
                              background: T.navy,
                            }}
                          />

                        </div>

                        <span
                          style={{
                            width: 30,
                            fontSize: 12,
                            color: T.inkFaint,
                            textAlign: "right",
                          }}
                        >
                          {d.pct}%
                        </span>

                      </div>

                    )
                  )}

                </div>

              )}


              {/* VERIFIED EXPERIENCE COUNT */}

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: `1px solid ${T.line}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.verified,
                  }}
                >
                  <ShieldCheck size={15} />
                  {t("verified_experiences")}
                </div>

                <div
                  style={{
                    fontFamily: T.monoFont,
                    fontWeight: 600,
                  }}
                >
                  {activeService.verified_reviews}
                </div>

              </div>

            </div>

          )}

        </div>


        {/* ====================================================
            CUSTOMER REVIEWS
        ==================================================== */}

        <div className="pf-reviews-column">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 10,
            }}
          >

            <div
              style={{
                fontFamily: T.displayFont,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {t("customer_experiences")}
            </div>


            {/* ONLY SORTING — VERIFIED FILTER REMOVED */}

            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >

              <select
                value={sort}
                onChange={(e) =>
                  setSort(
                    e.target.value as Sort
                  )
                }
                style={{
                  fontSize: 12.5,
                  border: `1px solid ${T.line}`,
                  borderRadius: 8,
                  padding: "5px 8px",
                  background: "#fff",
                  color: T.ink,
                  cursor: "pointer",
                }}
              >

                <option value="-created_at">
                  {t("sort_newest")}
                </option>

                <option value="-rating__overall">
                  {t("sort_highest")}
                </option>

                <option value="rating__overall">
                  {t("sort_lowest")}
                </option>

              </select>

            </div>

          </div>


          {/* ==================================================
              REVIEW STATES
          ================================================== */}

          {reviewsLoading && (
            <LoadingState
              label={t("reviews_loading")}
            />
          )}

          {reviewsError && (
            <ErrorState
              message={reviewsError}
            />
          )}

          {!reviewsLoading &&
            !reviewsError &&
            reviews.length === 0 && (

              <EmptyState
                message={t("reviews_empty_all")}
              />

            )}


          {/* ==================================================
              REVIEW LIST
          ================================================== */}

          {!reviewsLoading &&
            !reviewsError &&
            reviews.length > 0 && (

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >

                {reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    r={r}
                  />
                ))}

              </div>

            )}

        </div>

      </div>


      {/* ======================================================
          WRITE REVIEW FORM
      ====================================================== */}

      {showForm && (

        <SubmitReviewFlow
          services={services}
          onClose={() => {

            setShowForm(false);

            if (activeService) {
              selectService(
                activeService
              );
            }

          }}
        />

      )}

    </div>

  );
}