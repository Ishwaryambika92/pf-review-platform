import { Link } from "react-router-dom";
import { T } from "../design/tokens";
import { useLanguage } from "../i18n/LanguageContext";

const footerLink = {
  color: "inherit",
  textDecoration: "none",
  fontWeight: 500,
} as const;

export function Footer() {
  const { t } = useLanguage();

  return (
    <div
      style={{
        borderTop: `1px solid ${T.line}`,
        padding: "24px",
        textAlign: "center",
        fontSize: 12.5,
        color: T.inkFaint,
        fontFamily: T.bodyFont,
      }}
    >
      <div
        style={{
          marginBottom: 12,
          lineHeight: 1.6,
        }}
      >
        {t("footer_disclaimer")}
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >


        <Link to="/privacy-policy" style={footerLink}>
          Privacy Policy
        </Link>

        <Link to="/terms-and-conditions" style={footerLink}>
          Terms & Conditions
        </Link>

        <Link to="/review-policy" style={footerLink}>
          Review Policy
        </Link>

        <Link to="/disclaimer" style={footerLink}>
          Disclaimer
        </Link>
      </div>
    </div>
  );
}
