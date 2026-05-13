import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>

        <div style={styles.logoArea}>
          <span style={styles.logoIcon}>✈</span>
          <span style={styles.logoName}>SkyAgent</span>
        </div>

        <h2 style={styles.title}>{mode === "signin" ? "Welcome back" : "Create account"}</h2>
        <p style={styles.subtitle}>
          {mode === "signin" ? "Sign in to manage your bookings" : "Start searching flights today"}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "signup" && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={styles.switchText}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            style={styles.switchBtn}
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
  },
  modal: {
    background: "#0f1624", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px",
    padding: "36px", width: "100%", maxWidth: "420px", position: "relative",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
  },
  closeBtn: {
    position: "absolute", top: "16px", right: "18px", background: "none", border: "none",
    color: "#7a8aaa", fontSize: "24px", cursor: "pointer", lineHeight: 1,
  },
  logoArea: {
    display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px",
  },
  logoIcon: {
    fontSize: "18px", background: "linear-gradient(135deg, #1a6fff, #00cfff)",
    borderRadius: "8px", padding: "6px 8px",
  },
  logoName: { fontWeight: 700, fontSize: "16px", color: "#e8eaf0" },
  title: { margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: "#e8eaf0" },
  subtitle: { margin: "0 0 24px", fontSize: "13px", color: "#7a8aaa" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: 600, color: "#7a8aaa", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", padding: "11px 14px", color: "#e8eaf0", fontSize: "14px", outline: "none",
  },
  error: { margin: 0, fontSize: "13px", color: "#f87171", background: "rgba(248,113,113,0.08)", padding: "10px 12px", borderRadius: "8px" },
  submitBtn: {
    marginTop: "4px", padding: "13px", borderRadius: "10px", border: "none",
    background: "linear-gradient(135deg, #1a6fff, #005fcc)", color: "#fff",
    fontSize: "15px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(26,111,255,0.35)",
  },
  switchText: { marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#7a8aaa" },
  switchBtn: {
    background: "none", border: "none", color: "#1a6fff", fontSize: "13px",
    fontWeight: 600, cursor: "pointer", padding: 0,
  },
};
