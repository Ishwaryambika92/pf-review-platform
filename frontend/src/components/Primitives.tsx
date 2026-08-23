import { useState } from "react";
import { Star, ShieldCheck, Loader2, AlertTriangle, Inbox } from "lucide-react";
import { T } from "../design/tokens";
import { useLanguage } from "../i18n/LanguageContext";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(value) ? T.gold : "none"}
          color={i <= Math.round(value) ? T.gold : T.line}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

/**
 * Renders ONLY when the caller passes isVerified=true, and that boolean
 * always comes straight from Review.is_verified on the API response —
 * there is no local/manual override anywhere in this component or its
 * callers. The backend's ReviewVerification decision is the sole source
 * of truth for whether this badge can ever appear.
 */
export function VerifiedSeal({ small, isVerified }: { small?: boolean; isVerified: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  if (!isVerified) return null;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: T.verifiedSoft, color: T.verified, border: `1px solid ${T.verified}33`,
          borderRadius: 999, padding: small ? "3px 9px" : "5px 12px", fontSize: small ? 11.5 : 13,
          fontWeight: 600, fontFamily: T.bodyFont, cursor: "pointer",
        }}
      >
        <ShieldCheck size={small ? 13 : 15} strokeWidth={2.2} />
        {t("badge_verified")}
      </button>
      {open && (
        <div style={{
          position: "absolute", zIndex: 20, top: "115%", left: 0, width: 260,
          background: T.navyDeep, color: "#EAF0F6", fontSize: 12.5, lineHeight: 1.5,
          padding: "12px 14px", borderRadius: 10, boxShadow: "0 12px 28px rgba(12,32,54,0.35)",
          fontFamily: T.bodyFont,
        }}>
          {t("verified_tooltip")}
        </div>
      )}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "gold" }) {
  const tones = { neutral: { bg: "#EEF1F5", fg: T.inkSoft }, gold: { bg: "#FBF1DE", fg: "#8A6612" } };
  const c = tones[tone];
  return (
    <span style={{ background: c.bg, color: c.fg, fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999, fontFamily: T.bodyFont }}>
      {children}
    </span>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: T.inkFaint, fontSize: 13.5, padding: "24px 0", fontFamily: T.bodyFont }}>
      <Loader2 size={16} className="spin" /> {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10, color: T.danger, background: "#FBEEEC",
      border: "1px solid #EFC9C2", borderRadius: 10, padding: "12px 14px", fontSize: 13.5, fontFamily: T.bodyFont,
    }}>
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: T.inkFaint,
      padding: "40px 0", fontSize: 13.5, fontFamily: T.bodyFont, textAlign: "center",
    }}>
      <Inbox size={22} /> {message}
    </div>
  );
}
