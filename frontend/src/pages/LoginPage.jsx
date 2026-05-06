import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Kanban, LoaderCircle, Lock, Mail, User, UserPlus } from "lucide-react";
import { login, fetchProfile } from "../store/slices/authSlice";
import { authApi } from "../api/services";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPw, setShowPw] = useState(false);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    userName: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");
    try {
      await dispatch(login({ email: loginForm.email, password: loginForm.password })).unwrap();
      await dispatch(fetchProfile()).unwrap();
      navigate("/");
    } catch (err) {
      setLocalError(err?.message || err || "Login failed. Please check your credentials.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");
    if (registerForm.password !== registerForm.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (registerForm.password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.register({
        fullName: registerForm.fullName,
        email: registerForm.email,
        userName: registerForm.userName || registerForm.email.split("@")[0],
        password: registerForm.password,
        role: "MEMBER",
        isActive: true,
      });
      // Auto-login after registration
      await dispatch(login({ email: registerForm.email, password: registerForm.password })).unwrap();
      await dispatch(fetchProfile()).unwrap();
      navigate("/");
    } catch (err) {
      setLocalError(err?.message || err || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = status === "loading" || submitting;
  const displayError = localError || error;

  const features = [
    "Visual Kanban boards with drag-and-drop",
    "Real-time collaboration & comments",
    "Checklists, labels, and due dates",
    "Role-based access control",
    "Activity notifications & mentions",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "var(--color-bg)",
      }}
    >
      {/* ===== LEFT BRANDING PANEL ===== */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "3rem",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0d1f33 0%, #0d1117 60%, #001a2e 100%)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,121,191,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(33,150,243,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", animation: "slideInLeft 0.5s ease" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "var(--radius-xl)",
                background: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-glow-primary)",
              }}
            >
              <Kanban size={28} color="white" />
            </div>
            <div>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.03em" }}>
                Flow<span style={{ color: "var(--color-primary-light)" }}>Board</span>
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                Organise work. Collaborate seamlessly.
              </p>
            </div>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: "white",
              margin: "0 0 1rem",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            Deliver faster,
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, var(--color-primary-light), #64b5f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              together.
            </span>
          </h1>

          <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
            A Kanban-style task management platform built for modern teams. Visualise your workflow,
            stay aligned, and ship with confidence.
          </p>

          {/* Feature list */}
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {features.map((f, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                  animation: `slideInLeft ${0.3 + i * 0.08}s ease both`,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(0,121,191,0.2)",
                    border: "1px solid rgba(0,121,191,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "0.65rem",
                    color: "var(--color-primary-light)",
                    fontWeight: 700,
                  }}
                >
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ===== RIGHT AUTH PANEL ===== */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            animation: "slideInRight 0.4s ease",
          }}
        >
          {/* Tab Switcher */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.25rem",
              marginBottom: "2rem",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "var(--radius-lg)",
              padding: "0.25rem",
              border: "1px solid var(--color-border)",
            }}
          >
            {["login", "register"].map((m) => (
              <button
                key={m}
                id={`tab-${m}`}
                onClick={() => { setMode(m); setLocalError(""); }}
                style={{
                  padding: "0.625rem",
                  borderRadius: "calc(var(--radius-lg) - 3px)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  transition: "all var(--transition-fast)",
                  background: mode === m ? "var(--color-primary)" : "transparent",
                  color: mode === m ? "white" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {displayError && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(248,81,73,0.25)",
                background: "rgba(248,81,73,0.1)",
                color: "var(--color-error)",
                fontSize: "0.875rem",
                marginBottom: "1.25rem",
                animation: "fadeIn 0.2s ease",
              }}
            >
              {displayError}
            </div>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="fb-input-group">
                <label className="fb-input-label" htmlFor="login-email">Email address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                    style={{ paddingLeft: "2.25rem" }}
                  />
                </div>
              </div>

              <div className="fb-input-group">
                <label className="fb-input-label" htmlFor="login-password">Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                  <input
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="fb-btn fb-btn-primary"
                style={{ width: "100%", padding: "0.75rem", marginTop: "0.25rem" }}
              >
                {isLoading ? (
                  <><LoaderCircle size={16} className="animate-spin" /> Signing in...</>
                ) : (
                  <><ArrowRight size={16} /> Sign in</>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div className="fb-input-group">
                <label className="fb-input-label" htmlFor="reg-name">Full name</label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="Sneha Sharma"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, fullName: e.target.value }))}
                    style={{ paddingLeft: "2.25rem" }}
                  />
                </div>
              </div>

              <div className="fb-input-group">
                <label className="fb-input-label" htmlFor="reg-email">Email address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                    style={{ paddingLeft: "2.25rem" }}
                  />
                </div>
              </div>

              <div className="fb-input-group">
                <label className="fb-input-label" htmlFor="reg-username">Username <span style={{ color: "var(--color-text-muted)" }}>(optional)</span></label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>@</span>
                  <input
                    id="reg-username"
                    type="text"
                    placeholder="sneha"
                    value={registerForm.userName}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, userName: e.target.value }))}
                    style={{ paddingLeft: "2rem" }}
                  />
                </div>
              </div>

              <div className="fb-input-group">
                <label className="fb-input-label" htmlFor="reg-password">Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                  <input
                    id="reg-password"
                    type={showPw ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="fb-input-group">
                <label className="fb-input-label" htmlFor="reg-confirm">Confirm password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                  <input
                    id="reg-confirm"
                    type={showPw ? "text" : "password"}
                    required
                    placeholder="Repeat password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    style={{ paddingLeft: "2.25rem" }}
                  />
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading}
                className="fb-btn fb-btn-primary"
                style={{ width: "100%", padding: "0.75rem", marginTop: "0.25rem" }}
              >
                {isLoading ? (
                  <><LoaderCircle size={16} className="animate-spin" /> Creating account...</>
                ) : (
                  <><UserPlus size={16} /> Create account</>
                )}
              </button>
            </form>
          )}

          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "1.5rem" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setLocalError(""); }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary-light)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
              }}
            >
              {mode === "login" ? "Sign up for free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* Responsive — stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="linear-gradient(135deg, #0d1f33"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
