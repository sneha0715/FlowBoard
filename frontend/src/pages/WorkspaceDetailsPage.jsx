import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Edit2, Eye, FolderKanban, LoaderCircle, LogOut, Mail, Plus, Send, Shield, Trash2, UserPlus, Users, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { authApi, boardApi, columnApi, notificationApi, workspaceApi } from "../api/services";
import { fetchWorkspaceBundle } from "../store/slices/workspaceSlice";
import { canEditInWorkspace, canManageWorkspace, roleBadgeStyle, workspaceRoleLabel, WORKSPACE_ROLES } from "../utils/roles";

const VISIBILITY_OPTIONS = ["PRIVATE", "TEAM", "PUBLIC"];
const BACKGROUND_OPTIONS = ["Ocean", "Sunset", "Midnight", "Forest", "Aurora"];
const BG_GRADIENTS = {
  Ocean: "linear-gradient(135deg, #0d3b66, #1565c0)",
  Sunset: "linear-gradient(135deg, #c62828, #e65100)",
  Midnight: "linear-gradient(135deg, #1a237e, #0d1117)",
  Forest: "linear-gradient(135deg, #1b5e20, #2e7d32)",
  Aurora: "linear-gradient(135deg, #4a148c, #006064)",
};
const DEFAULT_LISTS = [
  { name: "To Do", color: "#0079BF" },
  { name: "In Progress", color: "#f59e0b" },
  { name: "In Review", color: "#a78bfa" },
  { name: "Done", color: "#3fb950" },
];

export default function WorkspaceDetailsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { activeWorkspace: workspace, members, boards, userRole, status, error } = useSelector((s) => s.workspace);

  const [toast, setToast] = useState(null); // { type: "success"|"error", msg }
  const [inviteDraft, setInviteDraft] = useState({ email: "", role: "MEMBER" });
  const [inviteStatus, setInviteStatus] = useState("idle");
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [boardDraft, setBoardDraft] = useState({ name: "", description: "", background: "Ocean", visibility: "PRIVATE" });
  const [boardSubmitting, setBoardSubmitting] = useState(false);
  const [showWsEdit, setShowWsEdit] = useState(false);
  const [wsEditDraft, setWsEditDraft] = useState({ name: "", description: "", visibility: "PRIVATE" });
  const [wsUpdating, setWsUpdating] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState({}); // userId -> { fullName, email }
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const load = () => dispatch(fetchWorkspaceBundle(workspaceId));
  useEffect(() => {
    load();
    if (workspace) {
      setWsEditDraft({ name: workspace.name, description: workspace.description || "", visibility: workspace.visibility || "PRIVATE" });
    }
  // Re-fetch when workspaceId OR authenticated user changes (fixes stale role after re-login)
  }, [workspaceId, workspace?.name, user?.userId]);

  // Fetch user profiles for members to show real names instead of User #ID
  useEffect(() => {
    const fetchProfiles = async () => {
      if (members.length === 0) return;
      setLoadingProfiles(true);
      const profiles = { ...memberProfiles };
      try {
        await Promise.all(members.map(async (m) => {
          if (profiles[m.userId]) return;
          // Search by userId isn't directly exposed in a bulk way, 
          // so we use searchUsers with the ID or just assume we'll get it.
          // For now, let's just fetch all and match (simple approach for small teams)
          const results = await authApi.searchUsers(""); 
          results.forEach(u => { profiles[u.userId] = u; });
        }));
        setMemberProfiles(profiles);
      } catch (err) { console.error("Failed to fetch member profiles", err); }
      finally { setLoadingProfiles(false); }
    };
    fetchProfiles();
  }, [members]);

  const memberIds = useMemo(() => new Set(members.map((m) => Number(m.userId))), [members]);
  const isAdmin = canManageWorkspace(user, userRole);
  const canEdit = canEditInWorkspace(user, userRole);
  const isObserver = userRole === "OBSERVER" && user?.role !== "PLATFORM_ADMIN";
  const isPending = members.find(m => Number(m.userId) === Number(user?.userId))?.status === "PENDING";

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setInviteStatus("sending");
    try {
      const users = await authApi.searchUsers(inviteDraft.email);
      let match = users.find((u) => u.email?.toLowerCase() === inviteDraft.email.trim().toLowerCase());
      if (!match) {
        // Automatically create a stub user if they aren't registered yet
        const tempName = "PENDING_STUB";
        const tempUsername = inviteDraft.email.split("@")[0] + Math.floor(Math.random() * 10000);
        await authApi.register({
          email: inviteDraft.email.trim().toLowerCase(),
          userName: tempUsername,
          fullName: tempName,
          password: "TemporaryPassword123!"
        });
        // Fetch them again to get the userId
        const newUsers = await authApi.searchUsers(inviteDraft.email);
        match = newUsers.find((u) => u.email?.toLowerCase() === inviteDraft.email.trim().toLowerCase());
      }
      
      if (memberIds.has(Number(match.userId))) {
        showToast("info", "User is already a member of this workspace.");
        setInviteStatus("idle");
        return;
      }
      await workspaceApi.addMember(workspaceId, { userId: Number(match.userId), role: inviteDraft.role });
      await notificationApi.send({
        recipientId: Number(match.userId),
        actorId: Number(user.userId),
        type: "ASSIGNMENT",
        title: `Workspace invite: ${workspace?.name || "Workspace"}`,
        message: `${user.fullName || user.email} added you to ${workspace?.name} as ${inviteDraft.role}.`,
        relatedId: Number(workspaceId),
        relatedType: "WORKSPACE",
      });
      setInviteDraft({ email: "", role: "MEMBER" });
      setInviteStatus("idle");
      showToast("success", `${match.fullName || match.email} invited!`);
      load();
    } catch (err) {
      setInviteStatus("failed");
      showToast("error", err?.message || "Failed to invite member.");
    }
  };

  const removeMember = async (memberId) => {
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      showToast("success", "Member removed.");
      load();
    } catch (err) {
      showToast("error", err?.message || "Failed to remove member.");
    }
  };

  const leaveWorkspace = async () => {
    if (!window.confirm(`Leave workspace "${workspace?.name}"? You will lose access until invited back.`)) return;
    try {
      await workspaceApi.leaveWorkspace(workspaceId);
      navigate("/");
    } catch (err) {
      showToast("error", err?.message || "Failed to leave workspace.");
    }
  };

  const acceptInvitation = async () => {
    try {
      await workspaceApi.acceptInvitation(workspaceId);
      showToast("success", "Welcome to the workspace!");
      load();
    } catch (err) {
      showToast("error", "Failed to accept invitation.");
    }
  };

  const deleteWorkspace = async () => {
    if (!window.confirm(`Delete workspace "${workspace?.name}"? This cannot be undone.`)) return;
    try {
      await workspaceApi.remove(workspaceId);
      navigate("/");
    } catch (err) {
      showToast("error", err?.message || "Failed to delete workspace.");
    }
  };

  const updateWorkspace = async (e) => {
    e.preventDefault();
    setWsUpdating(true);
    try {
      await workspaceApi.update(workspaceId, wsEditDraft);
      setShowWsEdit(false);
      showToast("success", "Workspace updated!");
      load();
    } catch (err) {
      showToast("error", "Failed to update workspace.");
    } finally { setWsUpdating(false); }
  };

  const updateMemberRole = async (userId, nextRole) => {
    try {
      await workspaceApi.updateRole(workspaceId, userId, nextRole);
      showToast("success", "Role updated.");
      load();
    } catch (err) {
      showToast("error", "Failed to update role.");
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    setBoardSubmitting(true);
    try {
      const board = await boardApi.create({ ...boardDraft, workspaceId: Number(workspaceId) });
      await Promise.all(DEFAULT_LISTS.map((l, i) => columnApi.create({ boardId: board.boardId, name: l.name, color: l.color, position: i })));
      setBoardDraft({ name: "", description: "", background: "Ocean", visibility: "PRIVATE" });
      setShowBoardForm(false);
      showToast("success", "Board created!");
      load();
    } catch (err) {
      showToast("error", err?.response?.data?.message || err?.message || "Failed to create board.");
    } finally {
      setBoardSubmitting(false);
    }
  };

  const actions = (
    <Link to="/" className="fb-btn fb-btn-secondary" style={{ padding: "0.375rem 0.875rem", fontSize: "0.8rem" }}>
      <ArrowLeft size={14} /> Back
    </Link>
  );

  return (
    <AppShell
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {workspace?.name || "Workspace"}
          {isAdmin && (
            <button onClick={() => setShowWsEdit(true)} className="fb-btn-ghost" style={{ padding: "0.25rem", color: "var(--color-text-muted)" }}>
              <Edit2 size={14} />
            </button>
          )}
        </div>
      }
      subtitle={workspace?.description || `${boards.length} boards · ${members.length} members`}
      actions={actions}
    >
      {/* Global Modern Toast */}
      {toast && (
        <div className="fb-toast-container">
          <div className={`fb-toast fb-toast-${toast.type}`}>
            {toast.type === "success" && <Check size={20} />}
            {toast.type === "error" && <X size={20} />}
            {toast.type === "info" && <Users size={20} />}
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{toast.type === "success" ? "Success" : toast.type === "error" ? "Error" : "Info"}</p>
              <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.9 }}>{toast.msg}</p>
            </div>
            <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", opacity: 0.7 }}><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "failed" && (
        <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(248,81,73,0.2)", background: "rgba(248,81,73,0.08)", color: "var(--color-error)", marginBottom: "1.25rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", alignItems: "start" }}>
        {/* Boards grid */}
        <div>
          {/* Pending Invite Banner */}
          {isPending && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-primary)", background: "rgba(0,121,191,0.08)", marginBottom: "1.5rem", boxShadow: "0 0 20px rgba(0,121,191,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                  <Users size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "var(--color-text-primary)" }}>You've been invited!</p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Join the team to start collaborating on boards.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button onClick={leaveWorkspace} className="fb-btn fb-btn-secondary">Decline</button>
                <button onClick={acceptInvitation} className="fb-btn fb-btn-primary"><Check size={16} /> Accept & Join</button>
              </div>
            </div>
          )}

          {/* Observer banner */}
          {isObserver && !isPending && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.03)", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              <Eye size={15} color="var(--color-text-muted)" />
              <span>You are an <strong>Observer</strong> in this workspace — read-only access.</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Boards</h2>
            {canEdit && (
              <button id="new-board-btn" onClick={() => setShowBoardForm(true)} className="fb-btn fb-btn-primary" style={{ padding: "0.4rem 0.875rem", fontSize: "0.8rem" }}>
                <Plus size={13} /> New board
              </button>
            )}
          </div>

          {/* New board modal */}
          {showBoardForm && (
            <div className="fb-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowBoardForm(false)}>
              <div className="fb-modal" style={{ maxWidth: 440, padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <h3 style={{ margin: 0 }}>Create board</h3>
                  <button onClick={() => setShowBoardForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
                </div>
                <form onSubmit={createBoard} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <div className="fb-input-group">
                    <label className="fb-input-label" htmlFor="bd-name">Board name *</label>
                    <input id="bd-name" required placeholder="Sprint 19" value={boardDraft.name} onChange={(e) => setBoardDraft((d) => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div className="fb-input-group">
                    <label className="fb-input-label" htmlFor="bd-desc">Description</label>
                    <textarea id="bd-desc" rows={2} placeholder="Track delivery..." value={boardDraft.description} onChange={(e) => setBoardDraft((d) => ({ ...d, description: e.target.value }))} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div className="fb-input-group">
                      <label className="fb-input-label">Background</label>
                      <select value={boardDraft.background} onChange={(e) => setBoardDraft((d) => ({ ...d, background: e.target.value }))}>
                        {BACKGROUND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="fb-input-group">
                      <label className="fb-input-label">Visibility</label>
                      <select value={boardDraft.visibility} onChange={(e) => setBoardDraft((d) => ({ ...d, visibility: e.target.value }))}>
                        {VISIBILITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ height: 40, borderRadius: "var(--radius-md)", background: BG_GRADIENTS[boardDraft.background] || "var(--color-primary)" }} />
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => setShowBoardForm(false)} className="fb-btn fb-btn-secondary">Cancel</button>
                    <button id="bd-submit-btn" type="submit" disabled={boardSubmitting} className="fb-btn fb-btn-primary">
                      {boardSubmitting ? <><LoaderCircle size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Create</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {status === "loading" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.875rem" }}>
              {[...Array(4)].map((_, i) => <div key={i} className="fb-skeleton" style={{ height: 120, borderRadius: "var(--radius-xl)" }} />)}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.875rem" }}>
            {boards.map((board) => (
              <Link key={board.boardId} to={`/boards/${board.boardId}`} style={{ textDecoration: "none" }}>
                <div className="fb-card-hover" style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", cursor: "pointer" }}>
                  <div style={{ height: 80, background: BG_GRADIENTS[board.background] || BG_GRADIENTS.Ocean, display: "flex", alignItems: "flex-end", padding: "0.75rem" }}>
                    <span className="fb-badge" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)", fontSize: "0.65rem" }}>
                      {board.visibility || "PRIVATE"}
                    </span>
                  </div>
                  <div style={{ padding: "0.875rem", background: "var(--color-bg-card)" }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, letterSpacing: "-0.01em" }}>{board.name}</p>
                    {board.description && <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>{board.description}</p>}
                    <div style={{ marginTop: "0.625rem", display: "flex", justifyContent: "flex-end" }}>
                      <ArrowRight size={14} color="var(--color-primary-light)" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {status === "ready" && boards.length === 0 && (
            <div className="fb-card fb-empty">
              <FolderKanban size={32} color="var(--color-text-muted)" />
              <p>No boards yet. Create one to get started.</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "76px" }}>
          {/* Invite member */}
          {isAdmin && (
            <div className="fb-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <UserPlus size={16} color="var(--color-primary-light)" />
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Invite member</p>
              </div>
              <form onSubmit={sendInvite} style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <div style={{ position: "relative" }}>
                  <Mail size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                  <input type="email" required placeholder="user@email.com" value={inviteDraft.email} onChange={(e) => setInviteDraft((d) => ({ ...d, email: e.target.value }))} style={{ paddingLeft: "2rem", fontSize: "0.8125rem" }} id="invite-email-input" />
                </div>
                <select value={inviteDraft.role} onChange={(e) => setInviteDraft((d) => ({ ...d, role: e.target.value }))} style={{ fontSize: "0.8125rem" }}>
                  {WORKSPACE_ROLES.filter(r => r !== "OWNER").map(r => (
                    <option key={r} value={r}>{workspaceRoleLabel(r)}</option>
                  ))}
                </select>
                <button id="send-invite-btn" type="submit" disabled={inviteStatus === "sending"} className="fb-btn fb-btn-primary" style={{ width: "100%" }}>
                  {inviteStatus === "sending" ? <><LoaderCircle size={13} className="animate-spin" /> Sending...</> : <><Send size={13} /> Send invite</>}
                </button>
              </form>
            </div>
          )}

          {/* Members list */}
          <div className="fb-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
              <Users size={16} color="var(--color-text-secondary)" />
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Team ({members.length})</p>
            </div>
            {/* Your role badge */}
            {userRole && userRole !== "NONE" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Your role:</span>
                <span className="fb-badge" style={{ fontSize: "0.7rem", ...roleBadgeStyle(userRole) }}>{workspaceRoleLabel(userRole)}</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {members.map((m) => {
                const profile = memberProfiles[m.userId];
                const isMe = Number(m.userId) === Number(user?.userId);
                return (
                  <div key={m.workspaceMemberId || m.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: isMe ? "rgba(0,121,191,0.04)" : "rgba(255,255,255,0.02)", transition: "all 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: m.status === 'PENDING' ? "rgba(255,255,255,0.05)" : "var(--color-primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-primary-light)", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                        {profile ? profile.fullName?.split(" ").map(n => n[0]).join("").toUpperCase() : "?"}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {profile?.fullName || `User #${m.userId}`}{isMe ? " (You)" : ""}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "2px" }}>
                          {isAdmin && m.role !== "OWNER" ? (
                            <select
                              value={m.role}
                              onChange={(e) => updateMemberRole(m.userId, e.target.value)}
                              style={{ fontSize: "0.65rem", padding: "0", border: "none", background: "transparent", color: "var(--color-primary-light)", fontWeight: 600, cursor: "pointer" }}
                            >
                              {WORKSPACE_ROLES.filter(r => r !== "OWNER").map(r => (
                                <option key={r} value={r}>{workspaceRoleLabel(r)}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{workspaceRoleLabel(m.role)}</span>
                          )}
                          {m.status === "PENDING" && (
                            <span className="fb-badge" style={{ fontSize: "0.6rem", background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isAdmin && !isMe && m.role !== "OWNER" && (
                      <button onClick={() => removeMember(m.userId)} className="fb-btn-ghost" style={{ padding: "0.375rem", color: "var(--color-error)", borderRadius: "var(--radius-md)" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              {members.length === 0 && <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>No members yet.</p>}
            </div>
          </div>

          {/* Edit Workspace Modal */}
          {showWsEdit && (
            <div className="fb-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowWsEdit(false)}>
              <div className="fb-modal" style={{ maxWidth: 440, padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <h3 style={{ margin: 0 }}>Edit workspace</h3>
                  <button onClick={() => setShowWsEdit(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
                </div>
                <form onSubmit={updateWorkspace} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <div className="fb-input-group">
                    <label className="fb-input-label" htmlFor="ws-edit-name">Workspace name *</label>
                    <input id="ws-edit-name" required value={wsEditDraft.name} onChange={(e) => setWsEditDraft(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div className="fb-input-group">
                    <label className="fb-input-label" htmlFor="ws-edit-desc">Description</label>
                    <textarea id="ws-edit-desc" rows={3} value={wsEditDraft.description} onChange={(e) => setWsEditDraft(d => ({ ...d, description: e.target.value }))} />
                  </div>
                  <div className="fb-input-group">
                    <label className="fb-input-label">Visibility</label>
                    <select value={wsEditDraft.visibility} onChange={(e) => setWsEditDraft(d => ({ ...d, visibility: e.target.value }))}>
                      {VISIBILITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                    <button type="button" onClick={() => setShowWsEdit(false)} className="fb-btn fb-btn-secondary">Cancel</button>
                    <button type="submit" disabled={wsUpdating} className="fb-btn fb-btn-primary">
                      {wsUpdating ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Workspace info + danger */}
          {workspace && (
            <div className="fb-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                <Shield size={15} color={isAdmin ? "var(--color-error)" : "var(--color-text-muted)"} />
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Workspace settings</p>
              </div>
              
              {isAdmin ? (
                <>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>Permanently delete this workspace and all its boards.</p>
                  <button id="delete-workspace-btn" onClick={deleteWorkspace} className="fb-btn fb-btn-danger" style={{ width: "100%" }}>
                    <Trash2 size={13} /> Delete workspace
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>Leave this workspace and remove your access.</p>
                  <button onClick={leaveWorkspace} className="fb-btn fb-btn-danger" style={{ width: "100%", background: "transparent", borderColor: "rgba(248,81,73,0.3)" }}>
                    <LogOut size={13} /> Leave workspace
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 320px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
