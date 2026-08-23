import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T } from "../design/tokens";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { login, register, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") await login(username, password);
      else await register(username, email, password);
      navigate("/");
    } catch {
      // error state already set by context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: T.paper, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.bodyFont }}>
      <form onSubmit={submit} style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: 32, width: 380, maxWidth: "90%" }}>
        <div style={{ fontFamily: T.displayFont, fontSize: 22, fontWeight: 600, marginBottom: 18, color: T.ink }}>
          {mode === "login" ? "Log in" : "Create your account"}
        </div>
        <Field label="Username"><input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required /></Field>
        {mode === "register" && (
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required /></Field>
        )}
        <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required minLength={10} /></Field>
        {error && <div style={{ color: T.danger, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button disabled={submitting} type="submit" style={{ width: "100%", background: T.navy, color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>
          {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Register"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `1px solid ${T.line}`, borderRadius: 9, padding: "10px 12px", fontSize: 13.5, fontFamily: T.bodyFont };
