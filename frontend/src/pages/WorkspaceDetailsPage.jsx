import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, FolderKanban, LoaderCircle, Mail, Plus, Send, Shield, Trash2, UserPlus, Users, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { authApi, boardApi, columnApi, notificationApi, workspaceApi } from "../api/services";
import { fetchWorkspaceBundle } from "../store/slices/workspaceSlice";

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

  const load = () => dispatch(fetchWorkspaceBundle(workspaceId));
  useEffect(() => { load(); }, [workspaceId]);

  const memberIds = useMemo(() => new Set(members.map((m) => Number(m.userId))), [members]);
  const isAdmin = userRole === "ADMIN" || user?.role === "PLATFORM_ADMIN";

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setInviteStatus("sending");
    try {
      const users = await authApi.searchUsers(inviteDraft.email);
      const match = users.find((u) => u.email?.toLowerCase() === inviteDraft.email.trim().toLowerCase());
      if (!match) throw new Error("No registered user with that email.");
      if (memberIds.has(Number(match.userId))) throw new Error("User is already a member.");
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

  const deleteWorkspace = async () => {
    if (!window.confirm(`Delete workspace "${workspace?.name}"? This cannot be undone.`)) return;
    try {
      await workspaceApi.remove(workspaceId);
      navigate("/");
    } catch (err) {
      showToast("error", err?.message || "Failed to delete workspace.");
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
      title={workspace?.name || "Workspace"}
      subtitle={workspace?.description || `${boards.length} boards · ${members.length} members`}
      actions={actions}
    >
      {/* Toast */}
      {toast && (
        <div className="animate-fade-in" style={{
          marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", fontSize: "0.875rem",
          border: `1px solid ${toast.type === "success" ? "rgba(63,185,80,0.25)" : "rgba(248,81,73,0.25)"}`,
          background: toast.type === "success" ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)",
          color: toast.type === "success" ? "var(--color-success)" : "var(--color-error)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={15} /></button>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Boards</h2>
            {isAdmin && (
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
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OBSERVER">Observer</option>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {members.map((m) => (
                <div key={m.workspaceMemberId || m.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--color-primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-primary-light)", flexShrink: 0 }}>
                      {String(m.userId).slice(-2)}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>User #{m.userId}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", margin: 0 }}>{m.role}</p>
                    </div>
                  </div>
                  {isAdmin && Number(m.userId) !== Number(user?.userId) && (
                    <button onClick={() => removeMember(m.userId)} className="fb-btn-ghost" style={{ padding: "0.25rem", color: "var(--color-error)", borderRadius: "var(--radius-md)" }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              {members.length === 0 && <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>No members yet.</p>}
            </div>
          </div>

          {/* Workspace info + danger */}
          {isAdmin && workspace && (
            <div className="fb-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                <Shield size={15} color="var(--color-error)" />
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Danger zone</p>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>Permanently delete this workspace and all its boards.</p>
              <button id="delete-workspace-btn" onClick={deleteWorkspace} className="fb-btn fb-btn-danger" style={{ width: "100%" }}>
                <Trash2 size={13} /> Delete workspace
              </button>
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
