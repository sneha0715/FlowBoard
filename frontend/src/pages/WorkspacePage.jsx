import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FolderKanban, Layout, LoaderCircle, Plus, Search, Users, X } from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { boardApi, cardApi, columnApi, labelApi, workspaceApi } from "../api/services";

const VISIBILITY_OPTIONS = ["PRIVATE", "TEAM", "PUBLIC"];
const BACKGROUND_OPTIONS = ["Ocean", "Sunset", "Midnight", "Forest", "Aurora"];
const DEFAULT_LISTS = [
  { name: "To Do", color: "#0079BF" },
  { name: "In Progress", color: "#f59e0b" },
  { name: "In Review", color: "#a78bfa" },
  { name: "Done", color: "#3fb950" },
];

const BG_GRADIENTS = {
  Ocean: "linear-gradient(135deg, #0d3b66, #1565c0)",
  Sunset: "linear-gradient(135deg, #c62828, #e65100)",
  Midnight: "linear-gradient(135deg, #1a237e, #0d1117)",
  Forest: "linear-gradient(135deg, #1b5e20, #2e7d32)",
  Aurora: "linear-gradient(135deg, #4a148c, #006064)",
};

const isNotFound = (err) => err?.response?.status === 404;

export default function WorkspacePage() {
  const user = useSelector((s) => s.auth.user);
  const [workspaces, setWorkspaces] = useState([]);
  const [boardsByWorkspace, setBoardsByWorkspace] = useState({});
  const [pageStatus, setPageStatus] = useState("loading");
  const [pageError, setPageError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle");

  const [showWsForm, setShowWsForm] = useState(false);
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [wsSubmitting, setWsSubmitting] = useState(false);
  const [boardSubmitting, setBoardSubmitting] = useState(false);

  const [wsDraft, setWsDraft] = useState({ name: "", description: "", visibility: "PRIVATE" });
  const [boardDraft, setBoardDraft] = useState({ workspaceId: "", name: "", description: "", background: "Ocean", visibility: "PRIVATE" });

  const refresh = async () => {
    if (!user?.userId) return;
    setPageStatus("loading");
    setPageError(null);
    try {
      const unique = new Map();
      try { (await workspaceApi.byMember(user.userId)).forEach((w) => unique.set(w.workspaceId, w)); } catch (e) { if (!isNotFound(e)) throw e; }
      try { (await workspaceApi.byOwner(user.userId)).forEach((w) => unique.set(w.workspaceId, w)); } catch (e) { if (!isNotFound(e)) throw e; }
      const list = [...unique.values()];
      setWorkspaces(list);
      const entries = await Promise.all(list.map(async (ws) => [ws.workspaceId, await boardApi.byWorkspace(ws.workspaceId).catch(() => [])]));
      setBoardsByWorkspace(Object.fromEntries(entries));
      setBoardDraft((d) => ({ ...d, workspaceId: list[0]?.workspaceId?.toString() || "" }));
      setPageStatus("ready");
    } catch (err) {
      setPageStatus("failed");
      setPageError(err?.message || "Unable to load workspaces.");
    }
  };

  useEffect(() => { refresh(); }, [user?.userId]);

  const totalBoards = useMemo(() => Object.values(boardsByWorkspace).reduce((sum, b) => sum + b.length, 0), [boardsByWorkspace]);
  const adminWorkspaces = useMemo(() => workspaces.filter((ws) => Number(ws.ownerId) === Number(user?.userId)), [workspaces, user?.userId]);

  const showMessage = (type, msg) => {
    if (type === "success") { setActionSuccess(msg); setActionError(null); }
    else { setActionError(msg); setActionSuccess(null); }
    setTimeout(() => { setActionSuccess(null); setActionError(null); }, 4000);
  };

  const createWorkspace = async (e) => {
    e.preventDefault();
    if (!wsDraft.name.trim()) { showMessage("error", "Workspace name is required."); return; }
    setWsSubmitting(true);
    try {
      await workspaceApi.create(wsDraft);
      setWsDraft({ name: "", description: "", visibility: "PRIVATE" });
      setShowWsForm(false);
      showMessage("success", "Workspace created successfully!");
      await refresh();
    } catch (err) {
      showMessage("error", err?.response?.data?.message || err?.message || "Failed to create workspace.");
    } finally { setWsSubmitting(false); }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!boardDraft.workspaceId) { showMessage("error", "Select a workspace first."); return; }
    if (!boardDraft.name.trim()) { showMessage("error", "Board name is required."); return; }
    setBoardSubmitting(true);
    try {
      const board = await boardApi.create({ ...boardDraft, workspaceId: Number(boardDraft.workspaceId) });
      await Promise.all(DEFAULT_LISTS.map((l, i) => columnApi.create({ boardId: board.boardId, name: l.name, color: l.color, position: i })));
      setBoardDraft((d) => ({ ...d, name: "", description: "", background: "Ocean", visibility: "PRIVATE" }));
      setShowBoardForm(false);
      showMessage("success", "Board created with default lists!");
      await refresh();
    } catch (err) {
      showMessage("error", err?.response?.data?.details || err?.response?.data?.message || err?.message || "Failed to create board.");
    } finally { setBoardSubmitting(false); }
  };

  const searchCards = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setSearchResults([]); return; }
    setSearchStatus("searching");
    try {
      const results = [];
      for (const [wsId, boards] of Object.entries(boardsByWorkspace)) {
        for (const board of boards) {
          const cards = await cardApi.byBoard(board.boardId).catch(() => []);
          for (const card of cards) {
            if (card.title?.toLowerCase().includes(q) || String(card.assigneeId || "").includes(q)) {
              results.push({ wsId, boardId: board.boardId, boardName: board.name, cardId: card.cardId, title: card.title, status: card.status, priority: card.priority });
            }
          }
        }
      }
      setSearchResults(results);
      setSearchStatus("ready");
    } catch { setSearchStatus("failed"); }
  };

  return (
    <AppShell title="Workspaces" subtitle="Browse your project spaces, create boards, and search across all cards.">
      {/* Status Messages */}
      {actionSuccess && (
        <div style={{ marginBottom: "1rem", padding: "0.875rem 1rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(63,185,80,0.25)", background: "rgba(63,185,80,0.1)", color: "var(--color-success)", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }} className="animate-fade-in">
          {actionSuccess}
          <button onClick={() => setActionSuccess(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><X size={16} /></button>
        </div>
      )}
      {actionError && (
        <div style={{ marginBottom: "1rem", padding: "0.875rem 1rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(248,81,73,0.25)", background: "rgba(248,81,73,0.1)", color: "var(--color-error)", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }} className="animate-fade-in">
          {actionError}
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><X size={16} /></button>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.875rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Workspaces", value: workspaces.length, icon: Layout, color: "var(--color-primary-light)" },
          { label: "Total boards", value: totalBoards, icon: FolderKanban, color: "#3fb950" },
          { label: "Logged in as", value: user?.fullName || user?.email || "–", icon: Users, color: "#d29922" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="fb-stat-card animate-fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Icon size={15} color={color} />
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</p>
            </div>
            <p style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, letterSpacing: "-0.02em" }}>{pageStatus === "loading" ? "–" : value}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Left — workspace list + search */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Search */}
          <form onSubmit={searchCards} className="fb-card" style={{ padding: "1.25rem" }}>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Search size={17} color="var(--color-primary-light)" />
              Search cards across all boards
            </p>
            <div style={{ display: "flex", gap: "0.625rem" }}>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by card title..." style={{ flex: 1 }} id="global-search-input" />
              <button id="global-search-btn" type="submit" className="fb-btn fb-btn-primary" style={{ flexShrink: 0 }}>
                {searchStatus === "searching" ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />}
                Search
              </button>
            </div>
            {searchStatus === "ready" && searchResults.length === 0 && (
              <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>No matching cards found.</p>
            )}
            {searchResults.length > 0 && (
              <div style={{ marginTop: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {searchResults.map((r) => (
                  <Link key={`${r.boardId}-${r.cardId}`} to={`/boards/${r.boardId}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)", textDecoration: "none", transition: "all var(--transition-fast)" }}>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{r.title}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>{r.boardName} · {r.priority} · {r.status}</p>
                    </div>
                    <ArrowRight size={15} color="var(--color-primary-light)" />
                  </Link>
                ))}
              </div>
            )}
          </form>

          {/* Workspace List */}
          {pageStatus === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[...Array(2)].map((_, i) => <div key={i} className="fb-skeleton" style={{ height: 160, borderRadius: "var(--radius-xl)" }} />)}
            </div>
          )}
          {pageStatus === "failed" && (
            <div style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(248,81,73,0.2)", background: "rgba(248,81,73,0.08)", color: "var(--color-error)", fontSize: "0.875rem" }}>
              {pageError}
            </div>
          )}
          {pageStatus === "ready" && workspaces.length === 0 && (
            <div className="fb-card fb-empty">
              <Layout size={36} color="var(--color-text-muted)" />
              <h3 style={{ color: "var(--color-text-primary)", margin: 0 }}>No workspaces yet</h3>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>Create your first workspace to get started.</p>
              <button onClick={() => setShowWsForm(true)} className="fb-btn fb-btn-primary">
                <Plus size={15} /> Create workspace
              </button>
            </div>
          )}
          {workspaces.map((ws) => {
            const boards = boardsByWorkspace[ws.workspaceId] || [];
            return (
              <article key={ws.workspaceId} className="fb-card animate-fade-in" style={{ padding: 0, overflow: "hidden" }}>
                {/* Workspace header */}
                <div style={{ padding: "1.25rem 1.25rem 0.875rem", borderBottom: "1px solid var(--color-border)", background: "rgba(0,121,191,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>{ws.name}</h3>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {ws.description || "No description"}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <span className="fb-badge" style={{ background: "var(--color-primary-subtle)", color: "var(--color-primary-light)", border: "1px solid rgba(0,121,191,0.25)" }}>
                        {ws.visibility || "PRIVATE"}
                      </span>
                      <Link to={`/workspaces/${ws.workspaceId}`} className="fb-btn fb-btn-secondary" style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}>
                        Open <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <FolderKanban size={12} /> {boards.length} board{boards.length !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Users size={12} /> {ws.members?.length || 0} member{(ws.members?.length || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Board list */}
                <div style={{ padding: "0.875rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {boards.map((board) => (
                    <Link key={board.boardId} to={`/boards/${board.boardId}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", textDecoration: "none", transition: "all var(--transition-fast)", background: "rgba(255,255,255,0.02)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: BG_GRADIENTS[board.background] || "var(--color-primary)", borderRadius: "3px 0 0 3px" }} />
                      <div style={{ paddingLeft: "0.375rem" }}>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{board.name}</p>
                        {board.description && <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>{board.description}</p>}
                      </div>
                      <ArrowRight size={14} color="var(--color-text-muted)" />
                    </Link>
                  ))}
                  {boards.length === 0 && (
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", padding: "0.5rem 0" }}>No boards in this workspace yet.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Right sidebar — forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "76px" }}>
          {/* Create Workspace */}
          <div className="fb-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Create workspace</p>
              <button onClick={() => setShowWsForm((v) => !v)} className="fb-btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", borderRadius: "var(--radius-md)", color: "var(--color-primary-light)", fontWeight: 600 }}>
                {showWsForm ? "Cancel" : "New"}
              </button>
            </div>
            {!showWsForm && (
              <button id="open-create-ws-btn" onClick={() => setShowWsForm(true)} className="fb-btn fb-btn-secondary" style={{ width: "100%" }}>
                <Plus size={15} /> New workspace
              </button>
            )}
            {showWsForm && (
              <form onSubmit={createWorkspace} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }} className="animate-fade-in">
                <div className="fb-input-group">
                  <label className="fb-input-label" htmlFor="ws-name">Name *</label>
                  <input id="ws-name" required placeholder="Platform Delivery" value={wsDraft.name} onChange={(e) => setWsDraft((d) => ({ ...d, name: e.target.value }))} />
                </div>
                <div className="fb-input-group">
                  <label className="fb-input-label" htmlFor="ws-desc">Description</label>
                  <textarea id="ws-desc" rows={2} placeholder="Sprint, OKR, and ops boards..." value={wsDraft.description} onChange={(e) => setWsDraft((d) => ({ ...d, description: e.target.value }))} />
                </div>
                <div className="fb-input-group">
                  <label className="fb-input-label" htmlFor="ws-vis">Visibility</label>
                  <select id="ws-vis" value={wsDraft.visibility} onChange={(e) => setWsDraft((d) => ({ ...d, visibility: e.target.value }))}>
                    {VISIBILITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <button id="create-ws-submit-btn" type="submit" disabled={wsSubmitting} className="fb-btn fb-btn-primary" style={{ width: "100%" }}>
                  {wsSubmitting ? <><LoaderCircle size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Create workspace</>}
                </button>
              </form>
            )}
          </div>

          {/* Create Board */}
          <div className="fb-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Create board</p>
              <button onClick={() => setShowBoardForm((v) => !v)} className="fb-btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", borderRadius: "var(--radius-md)", color: "var(--color-primary-light)", fontWeight: 600 }}>
                {showBoardForm ? "Cancel" : "New"}
              </button>
            </div>
            {!showBoardForm && (
              <button id="open-create-board-btn" onClick={() => setShowBoardForm(true)} className="fb-btn fb-btn-secondary" style={{ width: "100%" }}>
                <Plus size={15} /> New board
              </button>
            )}
            {showBoardForm && (
              <form onSubmit={createBoard} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }} className="animate-fade-in">
                <div className="fb-input-group">
                  <label className="fb-input-label" htmlFor="board-ws">Workspace *</label>
                  <select id="board-ws" value={boardDraft.workspaceId} onChange={(e) => setBoardDraft((d) => ({ ...d, workspaceId: e.target.value }))}>
                    <option value="">Select workspace</option>
                    {adminWorkspaces.map((ws) => <option key={ws.workspaceId} value={ws.workspaceId}>{ws.name}</option>)}
                  </select>
                </div>
                <div className="fb-input-group">
                  <label className="fb-input-label" htmlFor="board-name">Name *</label>
                  <input id="board-name" required placeholder="Sprint 19" value={boardDraft.name} onChange={(e) => setBoardDraft((d) => ({ ...d, name: e.target.value }))} />
                </div>
                <div className="fb-input-group">
                  <label className="fb-input-label" htmlFor="board-desc">Description</label>
                  <textarea id="board-desc" rows={2} placeholder="Track sprint delivery..." value={boardDraft.description} onChange={(e) => setBoardDraft((d) => ({ ...d, description: e.target.value }))} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                  <div className="fb-input-group">
                    <label className="fb-input-label" htmlFor="board-bg">Background</label>
                    <select id="board-bg" value={boardDraft.background} onChange={(e) => setBoardDraft((d) => ({ ...d, background: e.target.value }))}>
                      {BACKGROUND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="fb-input-group">
                    <label className="fb-input-label" htmlFor="board-vis">Visibility</label>
                    <select id="board-vis" value={boardDraft.visibility} onChange={(e) => setBoardDraft((d) => ({ ...d, visibility: e.target.value }))}>
                      {VISIBILITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                {/* Background preview */}
                <div style={{ height: 40, borderRadius: "var(--radius-md)", background: BG_GRADIENTS[boardDraft.background] || "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "white", fontWeight: 600, opacity: 0.9 }}>{boardDraft.background} theme preview</span>
                </div>
                <button id="create-board-submit-btn" type="submit" disabled={boardSubmitting || !boardDraft.workspaceId} className="fb-btn fb-btn-primary" style={{ width: "100%" }}>
                  {boardSubmitting ? <><LoaderCircle size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Create board</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 340px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
