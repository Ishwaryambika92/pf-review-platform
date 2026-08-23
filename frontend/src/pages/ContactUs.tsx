import { useEffect, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { T } from "../design/tokens";
import { useLanguage } from "../i18n/LanguageContext";
import { API_BASE } from "../api/client";

interface SitePage {
  page_type: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function ContactUs() {
  const { lang } = useLanguage();

  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPage() {
      try {
        const response = await fetch(
          `${API_BASE}/contentpages/contact/`
        );

        if (!response.ok) {
          throw new Error("Failed to load Contact Us");
        }

        const data: SitePage = await response.json();
        setPage(data);
      } catch (err) {
        console.error("Contact Us error:", err);
        setError("Unable to load Contact Us.");
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
        {/* Page Title */}
        <h1
          style={{
            fontFamily: T.displayFont,
            fontSize: 42,
            marginBottom: 8,
          }}
        >
          {lang === "te"
            ? "మమ్మల్ని సంప్రదించండి"
            : page?.title || "Contact Us"}
        </h1>

        {/* Loading */}
        {loading && (
          <p style={{ color: T.inkSoft }}>
            Loading Contact Us...
          </p>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: T.danger }}>
            {error}
          </p>
        )}

        {/* Content */}
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

            {/* Contact Information */}
            <div
              style={{
                marginTop: 32,
                padding: 22,
                border: `1px solid ${T.line}`,
                borderRadius: 14,
                background: "#fff",
              }}
            >
              <h2
                style={{
                  fontFamily: T.displayFont,
                  fontSize: 22,
                  marginTop: 0,
                  marginBottom: 18,
                  color: T.ink,
                }}
              >
                {lang === "te"
                  ? "సంప్రదింపు సమాచారం"
                  : "Contact Information"}
              </h2>

              {/* Phone */}
              <a
                href="tel:+91 9398639423"

                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  color: T.ink,
                  marginBottom: 14,
                  fontSize: 15,
                }}
              >
                <Phone size={18} />
                <span>
                  +91 9398639423

                </span>
              </a>

              {/* Email */}
              <a
                href="mailto:pfserviceonline01@gmail.com"

                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  color: T.ink,
                  fontSize: 15,
                }}
              >
                <Mail size={18} />
                <span>
                  pfserviceonline01@gmail.com

                </span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}