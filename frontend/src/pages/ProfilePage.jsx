import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff, LoaderCircle, Lock, Save, User, X } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { authApi } from "../api/services";
import { fetchProfile, logout } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const [profileDraft, setProfileDraft] = useState({
    fullName: user?.fullName || "",
    userName: user?.userName || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [passwordDraft, setPasswordDraft] = useState({ newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(user.userId, profileDraft);
      await dispatch(fetchProfile()).unwrap();
      showToast("success", "Profile updated successfully!");
    } catch (err) {
      showToast("error", err?.response?.data?.message || err?.message || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordDraft.newPassword.length < 6) { showToast("error", "Password must be at least 6 characters."); return; }
    if (passwordDraft.newPassword !== passwordDraft.confirm) { showToast("error", "Passwords do not match."); return; }
    setSaving(true);
    try {
      await authApi.changePassword(user.userId, passwordDraft.newPassword);
      setPasswordDraft({ newPassword: "", confirm: "" });
      showToast("success", "Password changed. Please log in again.");
      setTimeout(() => { dispatch(logout()); navigate("/login"); }, 2000);
    } catch (err) {
      showToast("error", err?.response?.data?.message || err?.message || "Failed to change password.");
    } finally { setSaving(false); }
  };

  const initials = user
    ? (user.fullName || user.email || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <AppShell title="Profile & Settings" subtitle="Manage your personal information and security settings.">
      {toast && (
        <div className="animate-fade-in" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", fontSize: "0.875rem", border: `1px solid ${toast.type === "success" ? "rgba(63,185,80,0.25)" : "rgba(248,81,73,0.25)"}`, background: toast.type === "success" ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)", color: toast.type === "success" ? "var(--color-success)" : "var(--color-error)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={15} /></button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", maxWidth: 900 }}>
        {/* Profile info */}
        <div className="fb-card" style={{ padding: "1.5rem" }}>
          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-primary-subtle)", border: "3px solid var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary-light)", flexShrink: 0 }}>
              {profileDraft.avatarUrl ? (
                <img src={profileDraft.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
              ) : initials}
            </div>
            <div>
              <p style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{user?.fullName || "User"}</p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>{user?.email}</p>
              <span className="fb-badge" style={{ marginTop: "0.375rem", background: "var(--color-primary-subtle)", color: "var(--color-primary-light)", border: "1px solid rgba(0,121,191,0.25)", display: "inline-flex" }}>
                {user?.role?.replace("_", " ")}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <User size={16} color="var(--color-primary-light)" />
            <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Personal info</p>
          </div>
          <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div className="fb-input-group">
              <label className="fb-input-label" htmlFor="profile-name">Full name</label>
              <input id="profile-name" value={profileDraft.fullName} onChange={(e) => setProfileDraft((d) => ({ ...d, fullName: e.target.value }))} placeholder="Your full name" />
            </div>
            <div className="fb-input-group">
              <label className="fb-input-label" htmlFor="profile-username">Username</label>
              <input id="profile-username" value={profileDraft.userName} onChange={(e) => setProfileDraft((d) => ({ ...d, userName: e.target.value }))} placeholder="@handle" />
            </div>
            <div className="fb-input-group">
              <label className="fb-input-label" htmlFor="profile-avatar">Avatar URL <span style={{ color: "var(--color-text-muted)" }}>(optional)</span></label>
              <input id="profile-avatar" type="url" value={profileDraft.avatarUrl} onChange={(e) => setProfileDraft((d) => ({ ...d, avatarUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div style={{ padding: "0.875rem", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              <p style={{ margin: 0 }}>Email: <strong style={{ color: "var(--color-text-secondary)" }}>{user?.email}</strong></p>
              <p style={{ margin: "0.25rem 0 0" }}>Account ID: <strong style={{ color: "var(--color-text-secondary)" }}>#{user?.userId}</strong></p>
              <p style={{ margin: "0.25rem 0 0" }}>Member since: <strong style={{ color: "var(--color-text-secondary)" }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "–"}</strong></p>
            </div>
            <button id="save-profile-btn" type="submit" disabled={saving} className="fb-btn fb-btn-primary" style={{ width: "100%" }}>
              {saving ? <><LoaderCircle size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save changes</>}
            </button>
          </form>
        </div>

        {/* Security */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="fb-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <Lock size={16} color="#d29922" />
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Change password</p>
            </div>
            <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div className="fb-input-group">
                <label className="fb-input-label" htmlFor="new-password">New password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="new-password"
                    type={showPw ? "text" : "password"}
                    required
                    minLength={6}
                    value={passwordDraft.newPassword}
                    onChange={(e) => setPasswordDraft((d) => ({ ...d, newPassword: e.target.value }))}
                    placeholder="Min. 6 characters"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="fb-input-group">
                <label className="fb-input-label" htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type={showPw ? "text" : "password"}
                  required
                  value={passwordDraft.confirm}
                  onChange={(e) => setPasswordDraft((d) => ({ ...d, confirm: e.target.value }))}
                  placeholder="Repeat password"
                />
              </div>
              <div style={{ padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", background: "rgba(210,153,34,0.08)", border: "1px solid rgba(210,153,34,0.2)", fontSize: "0.8rem", color: "#d29922" }}>
                ⚠️ Changing your password will log you out automatically.
              </div>
              <button id="change-pw-btn" type="submit" disabled={saving} className="fb-btn fb-btn-secondary" style={{ width: "100%" }}>
                {saving ? <><LoaderCircle size={14} className="animate-spin" /> Changing...</> : <><Lock size={14} /> Change password</>}
              </button>
            </form>
          </div>

          {/* Account status */}
          <div className="fb-card" style={{ padding: "1.25rem" }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>Account status</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Status</span>
                <span className="fb-badge" style={{ background: "rgba(63,185,80,0.12)", color: "var(--color-success)", border: "1px solid rgba(63,185,80,0.25)" }}>
                  {user?.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Provider</span>
                <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{user?.provider || "Local"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
