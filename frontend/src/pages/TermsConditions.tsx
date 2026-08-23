import { useEffect, useState } from "react";
import { T } from "../design/tokens";
import { useLanguage } from "../i18n/LanguageContext";
import { API_BASE } from "../api/client";

interface SitePage {
  page_type: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function TermsConditions() {
  const { lang } = useLanguage();

  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPage() {
      try {
        const response = await fetch(
          `${API_BASE}/contentpages/terms/`
        );

        if (!response.ok) {
          throw new Error("Failed to load Terms & Conditions");
        }

        const data: SitePage = await response.json();
        setPage(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load Terms & Conditions.");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, []);

  return (
    <div
      style={{
        background: T.paper,
        minHeight: "100vh",
        fontFamily: T.bodyFont,
        color: T.ink,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "56px 24px 80px",
        }}
      >
        <h1
          style={{
            fontFamily: T.displayFont,
            fontSize: 42,
          }}
        >
          {lang === "te"
            ? "నిబంధనలు మరియు షరతులు"
            : page?.title || "Terms & Conditions"}
        </h1>

        {loading && (
          <p style={{ color: T.inkSoft }}>
            Loading Terms & Conditions...
          </p>
        )}

        {error && (
          <p style={{ color: T.danger }}>
            {error}
          </p>
        )}

        {page && !loading && !error && (
          <>
            <p
              style={{
                color: T.inkFaint,
                fontSize: 13,
              }}
            >
              Last updated:{" "}
              {new Date(page.updated_at).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </p>

            <div
              style={{
                marginTop: 28,
                color: T.inkSoft,
                lineHeight: 1.8,
                fontSize: 15,
                whiteSpace: "pre-wrap",
              }}
            >
              {page.content}
            </div>
          </>
        )}
      </div>
    </div>
  );
}