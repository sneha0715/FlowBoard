import { useEffect, useMemo, useState } from "react";
import { BarChart2, Crown, Download, History, Layout, LoaderCircle, Megaphone, RefreshCw, Shield, Trash2, UserCheck, UserX, Users, X } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { authApi, notificationApi, workspaceApi } from "../api/services";
import { roleBadgeStyle } from "../utils/roles";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [broadcast, setBroadcast] = useState({ title: "", message: "" });
  const [broadcasting, setBroadcasting] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users"); // users, analytics, logs, workspaces

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const load = async () => {
    setLoading(true);
    try {
      const [userData, notifData] = await Promise.all([authApi.searchUsers(""), notificationApi.all()]);
      setUsers(userData);
      setNotifications(notifData);
      const wsList = await Promise.all(
        userData.slice(0, 10).map((u) => workspaceApi.byOwner(u.userId).catch(() => []))
      );
      setWorkspaces(wsList.flat());
    } catch (err) {
      showToast("error", "Failed to load admin data.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const activeUsers = useMemo(() => users.filter((u) => u.isActive !== false), [users]);
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.fullName || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q));
  }, [users, userSearch]);

  const deactivateUser = async (userId) => {
    if (!window.confirm("Deactivate this user?")) return;
    try { await authApi.deactivate(userId); showToast("success", `User #${userId} deactivated.`); await load(); }
    catch (err) { showToast("error", err?.message || "Failed to deactivate."); }
  };

  const promoteUser = async (userId, currentRole) => {
    const newRole = currentRole === "PLATFORM_ADMIN" ? "MEMBER" : "PLATFORM_ADMIN";
    const action = newRole === "PLATFORM_ADMIN" ? "Promote" : "Demote";
    if (!window.confirm(`${action} this user to ${newRole.replace("_", " ")}?`)) return;
    try {
      await authApi.updateRole(userId, newRole);
      showToast("success", `User ${action.toLowerCase()}d to ${newRole.replace("_", " ")}.`);
      await load();
    } catch (err) { showToast("error", err?.message || "Failed to update role."); }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title || !broadcast.message) return;
    setBroadcasting(true);
    try {
      await notificationApi.bulk(activeUsers.map((u) => Number(u.userId)), broadcast.title, broadcast.message);
      setBroadcast({ title: "", message: "" });
      showToast("success", `Broadcast sent to ${activeUsers.length} users.`);
      await load();
    } catch (err) { showToast("error", "Failed to send broadcast."); }
    finally { setBroadcasting(false); }
  };

  const statCards = [
    { label: "Total users", value: users.length, color: "var(--color-primary-light)", icon: Users },
    { label: "Active users", value: activeUsers.length, color: "var(--color-success)", icon: Users },
    { label: "Workspaces", value: workspaces.length, color: "#d29922", icon: BarChart2 },
    { label: "Notifications", value: notifications.length, color: "#a78bfa", icon: BarChart2 },
    { label: "Assignments", value: notifications.filter((n) => n.type === "ASSIGNMENT").length, color: "var(--color-primary-light)", icon: Shield },
    { label: "Admins", value: users.filter((u) => u.role === "PLATFORM_ADMIN").length, color: "var(--color-error)", icon: Shield },
  ];

  const actions = (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button onClick={() => window.alert("Generating platform report...")} className="fb-btn fb-btn-primary" style={{ padding: "0.375rem 0.875rem", fontSize: "0.8rem" }}>
        <Download size={14} /> Report
      </button>
      <button onClick={load} className="fb-btn fb-btn-secondary" style={{ padding: "0.375rem 0.875rem", fontSize: "0.8rem" }} disabled={loading}>
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
      </button>
    </div>
  );

  return (
    <AppShell title="Platform Admin" subtitle="Manage users, monitor activity, and send platform-wide updates." actions={actions}>
      {toast && (
        <div className="animate-fade-in" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", fontSize: "0.875rem", border: `1px solid ${toast.type === "success" ? "rgba(63,185,80,0.25)" : "rgba(248,81,73,0.25)"}`, background: toast.type === "success" ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)", color: toast.type === "success" ? "var(--color-success)" : "var(--color-error)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={15} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="fb-tabs" style={{ marginBottom: "1.5rem" }}>
        {[
          { id: "users", label: "Users", icon: Users },
          { id: "workspaces", label: "Workspaces", icon: Layout },
          { id: "analytics", label: "Analytics", icon: BarChart2 },
          { id: "logs", label: "Audit Logs", icon: History },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`fb-tab ${activeTab === id ? "active" : ""}`} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>
        {/* Main Content */}
        <div>
          {activeTab === "users" && (
            <div className="fb-card" style={{ padding: "1.25rem", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "0.875rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Users size={17} color="var(--color-primary-light)" />
                  <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>User management</p>
                </div>
                <input
                  id="admin-user-search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  style={{ fontSize: "0.8rem", width: 200, height: "34px" }}
                />
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[...Array(5)].map((_, i) => <div key={i} className="fb-skeleton" style={{ height: 64, borderRadius: "var(--radius-md)" }} />)}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 500, overflowY: "auto" }}>
                  {filteredUsers.map((u) => (
                    <div key={u.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: u.isActive === false ? "rgba(248,81,73,0.04)" : "rgba(255,255,255,0.02)", gap: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-primary-light)", flexShrink: 0 }}>
                          {(u.fullName || u.email || "U")[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.fullName || u.userName || "Unnamed"}
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.email} · {u.role}
                          </p>
                        </div>
                      </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                        <span className="fb-badge" style={{ fontSize: "0.7rem", ...roleBadgeStyle(u.role) }}>
                          {u.isActive === false ? "Inactive" : u.role === "PLATFORM_ADMIN" ? "Admin" : "Member"}
                        </span>
                        <button
                          id={`promote-${u.userId}-btn`}
                          onClick={() => promoteUser(u.userId, u.role)}
                          className={`fb-btn ${u.role === "PLATFORM_ADMIN" ? "fb-btn-secondary" : "fb-btn-primary"}`}
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem" }}
                          title={u.role === "PLATFORM_ADMIN" ? "Demote to Member" : "Promote to Admin"}
                        >
                          {u.role === "PLATFORM_ADMIN" ? <><UserCheck size={12} /> Demote</> : <><Crown size={12} /> Promote</>}
                        </button>
                        <button
                          id={`deactivate-${u.userId}-btn`}
                          disabled={u.isActive === false}
                          onClick={() => deactivateUser(u.userId)}
                          className="fb-btn fb-btn-danger"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          <UserX size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="fb-empty"><p>No users match your search.</p></div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="fb-card" style={{ padding: "1.25rem" }}>
                <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>Platform Engagement</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5rem", height: 200, paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
                  {[40, 70, 45, 90, 65, 80, 55, 95].map((h, i) => (
                    <div key={i} style={{ flex: 1, background: "linear-gradient(to top, var(--color-primary), var(--color-primary-light))", height: `${h}%`, borderRadius: "4px 4px 0 0", position: "relative" }}>
                      <span style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", fontSize: "0.65rem", color: "var(--color-text-muted)" }}>Day {i+1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div className="fb-card" style={{ padding: "1.25rem" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>Activity Distribution</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[
                      { label: "Card Moves", val: 65, color: "var(--color-primary)" },
                      { label: "Comments", val: 45, color: "var(--color-success)" },
                      { label: "Attachments", val: 25, color: "#a78bfa" },
                      { label: "Checklists", val: 85, color: "#d29922" },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                          <span>{item.label}</span>
                          <span style={{ fontWeight: 700 }}>{item.val}%</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${item.val}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="fb-card" style={{ padding: "1.25rem" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>Security Overview</p>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 120 }}>
                    <div style={{ width: 100, height: 100, borderRadius: "50%", border: "10px solid var(--color-success)", borderRightColor: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>92%</span>
                      <span style={{ fontSize: "0.6rem", color: "var(--color-text-muted)" }}>Compliance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="fb-card" style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>System Audit Logs</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {notifications.slice(0, 15).map(n => (
                  <div key={n.notificationId} style={{ display: "flex", gap: "0.75rem", padding: "0.75rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.8125rem" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.type === "ASSIGNMENT" ? "var(--color-primary)" : "var(--color-text-muted)", marginTop: "0.3rem" }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{n.title}</p>
                      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{n.message}</p>
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{new Date(n.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
                {notifications.length === 0 && <p className="fb-empty">No logs available.</p>}
              </div>
            </div>
          )}

          {activeTab === "workspaces" && (
            <div className="fb-card" style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Global Workspaces ({workspaces.length})</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {workspaces.map(ws => (
                  <div key={ws.workspaceId} style={{ padding: "0.875rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem" }}>{ws.name}</p>
                    <p style={{ margin: "0.25rem 0", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Owner ID: {ws.ownerId}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                      <span className="fb-badge" style={{ fontSize: "0.6rem" }}>{ws.visibility}</span>
                      <button className="fb-btn-ghost" style={{ padding: "0.25rem", color: "var(--color-error)" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Broadcast */}
          <div className="fb-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Megaphone size={16} color="var(--color-success)" />
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Broadcast notification</p>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.875rem" }}>
              Send a platform-wide notification to all {activeUsers.length} active users.
            </p>
            <form onSubmit={sendBroadcast} style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <input
                required
                value={broadcast.title}
                onChange={(e) => setBroadcast((d) => ({ ...d, title: e.target.value }))}
                placeholder="Scheduled maintenance tonight"
                id="broadcast-title-input"
              />
              <textarea
                required
                value={broadcast.message}
                onChange={(e) => setBroadcast((d) => ({ ...d, message: e.target.value }))}
                rows={3}
                placeholder="FlowBoard will be unavailable from 02:00–04:00 UTC."
                id="broadcast-message-input"
              />
              <button id="send-broadcast-btn" type="submit" disabled={broadcasting} className="fb-btn fb-btn-success" style={{ width: "100%" }}>
                {broadcasting ? <><LoaderCircle size={14} className="animate-spin" /> Sending...</> : <><Megaphone size={14} /> Send to all</>}
              </button>
            </form>
          </div>

          {/* System overview */}
          <div className="fb-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Shield size={16} color="#a78bfa" />
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>System overview</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                `${activeUsers.length} of ${users.length} users are active`,
                `${users.filter((u) => u.role === "PLATFORM_ADMIN").length} platform admins registered`,
                `${notifications.filter((n) => n.type === "ASSIGNMENT").length} assignment alerts recorded`,
                `${notifications.filter((n) => n.type === "MENTION").length} mention alerts recorded`,
                `${notifications.filter((n) => n.type === "MOVE").length} move events recorded`,
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0, marginTop: "0.45rem" }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 380px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
