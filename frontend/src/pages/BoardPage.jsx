import { useEffect, useState } from "react";
import { ArrowLeft, ArchiveRestore, CheckSquare, Grid3x3, LoaderCircle, Send, UserPlus, UserX, Users, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { authApi, boardApi, cardApi, columnApi, notificationApi } from "../api/services";
import BoardCanvas from "../components/board/BoardCanvas";
import CardDetailsModal from "../components/board/CardDetailsModal";
import AppShell from "../components/layout/AppShell";
import {
  createCard,
  createList,
  fetchBoardBundle,
  moveCardOptimistic,
  moveListOptimistic,
  persistCardMove,
  persistListMove,
} from "../store/slices/boardSlice";

export default function BoardPage() {
  const { boardId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { activeBoard, lists, cardsById, cardsByListId, userRole, status, error } = useSelector((s) => s.board);

  const [boardMembers, setBoardMembers] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [memberDraft, setMemberDraft] = useState({ email: "", role: "MEMBER" });
  const [memberMsg, setMemberMsg] = useState({ type: "", text: "" });
  const [archivedCards, setArchivedCards] = useState([]);
  const [activeTab, setActiveTab] = useState("board"); // "board" | "members" | "archived"

  const isBoardAdmin = userRole === "ADMIN" || user?.role === "PLATFORM_ADMIN";
  const canEdit = userRole === "ADMIN" || userRole === "MEMBER" || user?.role === "PLATFORM_ADMIN";

  const totalCards = Object.keys(cardsById).length;
  const completedCards = Object.values(cardsById).filter((c) => c.status === "DONE").length;
  const overdueCards = Object.values(cardsById).filter((c) => c.dueDate && c.status !== "DONE" && new Date(c.dueDate) < new Date()).length;

  useEffect(() => {
    dispatch(fetchBoardBundle(Number(boardId)));
  }, [boardId, dispatch]);

  useEffect(() => {
    if (!boardId) return;
    boardApi.members(Number(boardId)).then(setBoardMembers).catch(() => setBoardMembers([]));
  }, [boardId, status]);

  useEffect(() => {
    if (!boardId) return;
    cardApi.archivedByBoard(Number(boardId)).then(setArchivedCards).catch(() => setArchivedCards([]));
  }, [boardId, status]);

  const handleCreateList = async ({ name, color }) => {
    await dispatch(createList({ boardId: Number(boardId), name, color })).unwrap();
  };

  const handleRenameList = async (listId, payload) => {
    await columnApi.update(listId, payload);
    await dispatch(fetchBoardBundle(Number(boardId))).unwrap();
  };

  const handleCreateCard = async (listId, draft) => {
    await dispatch(createCard({ boardId: Number(boardId), listId: Number(listId), ...draft })).unwrap();
  };

  const handleDragEnd = async (result) => {
    const { destination, source, type, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      if (type === "COLUMN") {
        dispatch(moveListOptimistic({ sourceIndex: source.index, destinationIndex: destination.index }));
        await dispatch(persistListMove({ boardId: Number(boardId) })).unwrap();
        return;
      }
      const cardId = Number(draggableId.replace("card-", ""));
      const movedCard = cardsById[cardId];
      dispatch(moveCardOptimistic({ source, destination }));
      await dispatch(persistCardMove({
        boardId: Number(boardId),
        cardId,
        sourceListId: Number(source.droppableId.replace("list-", "")),
        destinationListId: Number(destination.droppableId.replace("list-", "")),
        destinationIndex: destination.index,
      })).unwrap();

      if (movedCard?.assigneeId) {
        const destListId = Number(destination.droppableId.replace("list-", ""));
        const destList = lists.find((l) => Number(l.listId) === destListId);
        const isDone = destList?.name?.toLowerCase() === "done";
        await notificationApi.send({
          recipientId: Number(movedCard.assigneeId),
          actorId: Number(user.userId),
          type: "MOVE",
          title: isDone ? `Task completed: ${movedCard.title}` : `Card moved: ${movedCard.title}`,
          message: isDone
            ? `${user.fullName || user.email} moved the task to Done.`
            : `${user.fullName || user.email} moved the card to ${destList?.name || "a new stage"}.`,
          relatedId: cardId,
          relatedType: "CARD",
        });
      }
    } catch {
      dispatch(fetchBoardBundle(Number(boardId)));
    }
  };

  const inviteBoardMember = async (e) => {
    e.preventDefault();
    setMemberMsg({ type: "", text: "" });
    try {
      const users = await authApi.searchUsers(memberDraft.email);
      const match = users.find((u) => u.email?.toLowerCase() === memberDraft.email.trim().toLowerCase());
      if (!match) throw new Error("No registered user with that email.");
      await boardApi.addMember(Number(boardId), { userId: Number(match.userId), role: memberDraft.role });
      await notificationApi.send({
        recipientId: Number(match.userId),
        actorId: Number(user.userId),
        type: "ASSIGNMENT",
        title: `Board access: ${activeBoard?.name || "Board"}`,
        message: `${user.fullName || user.email} added you as ${memberDraft.role}.`,
        relatedId: Number(boardId),
        relatedType: "BOARD",
      });
      setMemberDraft({ email: "", role: "MEMBER" });
      setMemberMsg({ type: "success", text: `${match.fullName || match.email} added.` });
      const members = await boardApi.members(Number(boardId));
      setBoardMembers(members);
    } catch (err) {
      setMemberMsg({ type: "error", text: err?.message || "Failed to add member." });
    }
  };

  const updateBoardRole = async (member) => {
    const next = member.role === "MEMBER" ? "OBSERVER" : member.role === "OBSERVER" ? "ADMIN" : "MEMBER";
    await boardApi.updateMemberRole(Number(boardId), member.userId, next);
    setBoardMembers(await boardApi.members(Number(boardId)));
    dispatch(fetchBoardBundle(Number(boardId)));
  };

  const removeBoardMember = async (member) => {
    await boardApi.removeMember(Number(boardId), member.userId);
    setBoardMembers(await boardApi.members(Number(boardId)));
  };

  const restoreCard = async (cardId) => {
    await cardApi.unarchive(cardId);
    await dispatch(fetchBoardBundle(Number(boardId))).unwrap();
    setArchivedCards(await cardApi.archivedByBoard(Number(boardId)));
  };

  const progressPercent = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  const actions = (
    <Link to="/" className="fb-btn fb-btn-secondary" style={{ padding: "0.375rem 0.875rem", fontSize: "0.8rem" }}>
      <ArrowLeft size={14} /> Back
    </Link>
  );

  return (
    <AppShell
      title={activeBoard?.name || "Board"}
      subtitle={activeBoard?.description || "Manage lists, drag cards, track progress."}
      actions={actions}
    >
      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", marginBottom: "1.25rem" }}>
        <div className="fb-stat-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Progress</p>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-primary-light)" }}>{progressPercent}%</span>
          </div>
          <div className="fb-progress-bar">
            <div className="fb-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.5rem 0 0" }}>{completedCards}/{totalCards} cards done</p>
        </div>
        <div className="fb-stat-card">
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Status</p>
          <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{activeBoard?.closed ? "Closed" : "Active"}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>{activeBoard?.visibility || "PRIVATE"} · {boardMembers.length} members</p>
        </div>
        <div className="fb-stat-card" style={{ borderColor: overdueCards > 0 ? "rgba(248,81,73,0.25)" : undefined }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Overdue</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: overdueCards > 0 ? "var(--color-error)" : "var(--color-text-primary)", margin: 0 }}>{overdueCards}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>tasks past due date</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(248,81,73,0.2)", background: "rgba(248,81,73,0.08)", color: "var(--color-error)", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {status === "loading" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: "0.75rem", color: "var(--color-text-secondary)" }}>
          <LoaderCircle size={20} className="animate-spin" />
          Loading board...
        </div>
      )}

      {/* Tabs */}
      {status !== "loading" && (
        <>
          <div className="fb-tabs">
            {[
              { id: "board", label: "Board", icon: Grid3x3 },
              { id: "members", label: `Members (${boardMembers.length})`, icon: Users },
              ...(isBoardAdmin && archivedCards.length > 0 ? [{ id: "archived", label: `Archived (${archivedCards.length})`, icon: ArchiveRestore }] : []),
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`fb-tab ${activeTab === id ? "active" : ""}`} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Board tab */}
          {activeTab === "board" && (
            <BoardCanvas
              lists={lists}
              cardsByListId={cardsByListId}
              cardsById={cardsById}
              onDragEnd={handleDragEnd}
              onCreateList={handleCreateList}
              onCreateCard={handleCreateCard}
              onRenameList={handleRenameList}
              onOpenCard={setSelectedCard}
              saving={status === "saving"}
              readOnly={!canEdit}
            />
          )}

          {/* Members tab */}
          {activeTab === "members" && (
            <div style={{ display: "grid", gridTemplateColumns: isBoardAdmin ? "1fr 1fr" : "1fr", gap: "1.25rem" }}>
              {/* Invite form */}
              {isBoardAdmin && (
                <div className="fb-card" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <UserPlus size={16} color="var(--color-primary-light)" />
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Add member</p>
                  </div>
                  {memberMsg.text && (
                    <div style={{ padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", fontSize: "0.8rem", marginBottom: "0.75rem", background: memberMsg.type === "success" ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)", color: memberMsg.type === "success" ? "var(--color-success)" : "var(--color-error)", border: `1px solid ${memberMsg.type === "success" ? "rgba(63,185,80,0.25)" : "rgba(248,81,73,0.25)"}` }}>
                      {memberMsg.text}
                    </div>
                  )}
                  <form onSubmit={inviteBoardMember} style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    <input type="email" required placeholder="member@email.com" value={memberDraft.email} onChange={(e) => setMemberDraft((d) => ({ ...d, email: e.target.value }))} id="board-invite-email" />
                    <select value={memberDraft.role} onChange={(e) => setMemberDraft((d) => ({ ...d, role: e.target.value }))}>
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                      <option value="OBSERVER">Observer</option>
                    </select>
                    <button id="board-invite-submit" type="submit" className="fb-btn fb-btn-primary"><Send size={13} /> Add member</button>
                  </form>
                </div>
              )}

              {/* Members list */}
              <div className="fb-card" style={{ padding: "1.25rem" }}>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.875rem" }}>Team</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {boardMembers.map((m) => (
                    <div key={m.boardMemberId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>User #{m.userId}</p>
                        <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", margin: 0 }}>{m.role}</p>
                      </div>
                      {isBoardAdmin && (
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <button onClick={() => updateBoardRole(m)} className="fb-btn fb-btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>Change role</button>
                          {Number(m.userId) !== Number(activeBoard?.createdById) && (
                            <button onClick={() => removeBoardMember(m)} className="fb-btn fb-btn-danger" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
                              <UserX size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Archived tab */}
          {activeTab === "archived" && isBoardAdmin && (
            <div className="fb-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <ArchiveRestore size={16} color="#d29922" />
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Archived cards ({archivedCards.length})</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {archivedCards.map((c) => (
                  <div key={c.cardId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{c.title}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>{c.priority} · {c.status}</p>
                    </div>
                    <button onClick={() => restoreCard(c.cardId)} className="fb-btn fb-btn-success" style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}>
                      <ArchiveRestore size={13} /> Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Card detail modal */}
      <CardDetailsModal
        boardId={Number(boardId)}
        card={selectedCard}
        boardMembers={boardMembers}
        currentUser={user}
        open={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
        onRefresh={() => dispatch(fetchBoardBundle(Number(boardId))).unwrap()}
        readOnly={!canEdit}
      />
    </AppShell>
  );
}
