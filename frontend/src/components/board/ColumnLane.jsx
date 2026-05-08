import { useEffect, useState } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { ArrowRight, GripVertical, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import CardTile from "./CardTile";

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_OPTIONS = ["TO_DO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function ColumnLane({ list, cards, onCreateCard, onRenameList, onMoveList, otherBoards, onOpenCard, saving, readOnly }) {
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TO_DO",
    coverColor: list.color || "#0079BF",
    startDate: "",
    dueDate: "",
    assigneeId: "",
  });
  const [open, setOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [listName, setListName] = useState(list.name);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [moving, setMoving] = useState(false);

  useEffect(() => { setListName(list.name); }, [list.name]);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    try {
      await onCreateCard(list.listId, draft);
      setDraft({ title: "", description: "", priority: "MEDIUM", status: "TO_DO", coverColor: list.color || "#0079BF", startDate: "", dueDate: "", assigneeId: "" });
      setOpen(false);
    } catch (err) {
      // error handled upstream
    }
  };

  const submitRename = async () => {
    const trimmed = listName.trim();
    if (!trimmed || trimmed === list.name) { setEditingTitle(false); setListName(list.name); return; }
    await onRenameList(list.listId, { boardId: list.boardId, name: trimmed, color: list.color, position: list.position });
    setEditingTitle(false);
  };

  const handleMove = async (newBoardId) => {
    if (!newBoardId) return;
    setMoving(true);
    try {
      await onMoveList(list.listId, Number(newBoardId));
      setShowMoveMenu(false);
    } catch (err) {
      console.error(err);
    } finally { setMoving(false); }
  };

  const cardCount = cards.length;

  return (
    <Draggable draggableId={`column-${list.listId}`} index={list.position ?? 0} isDragDisabled={readOnly}>
      {(columnProvided) => (
        <section
          ref={columnProvided.innerRef}
          {...columnProvided.draggableProps}
          style={{
            ...columnProvided.draggableProps.style,
            width: 300,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-card)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            maxHeight: "calc(100vh - 200px)",
          }}
        >
          {/* Lane header */}
          <div
            {...columnProvided.dragHandleProps}
            style={{
              padding: "0.875rem 1rem 0.75rem",
              borderBottom: "1px solid var(--color-border)",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
                <GripVertical size={14} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                {/* Color dot */}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: list.color || "#0079BF", flexShrink: 0 }} />

                {editingTitle ? (
                  <input
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitRename(); } if (e.key === "Escape") { setEditingTitle(false); setListName(list.name); } }}
                    autoFocus
                    style={{ fontSize: "0.9rem", fontWeight: 700, flex: 1, minWidth: 0, padding: "0.25rem 0.5rem", height: "auto" }}
                    id={`list-${list.listId}-name-input`}
                  />
                ) : (
                  <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {list.name}
                  </h2>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-text-muted)", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", padding: "0.15rem 0.5rem" }}>
                  {cardCount}
                </span>
                {!readOnly && !editingTitle && (
                  <div style={{ position: "relative", display: "flex", gap: "0.25rem" }}>
                    <button
                      type="button"
                      onClick={() => setEditingTitle(true)}
                      style={{ padding: "0.25rem", borderRadius: "var(--radius-md)", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", transition: "all var(--transition-fast)" }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMoveMenu(!showMoveMenu)}
                      style={{ padding: "0.25rem", borderRadius: "var(--radius-md)", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", transition: "all var(--transition-fast)" }}
                    >
                      <ArrowRight size={12} />
                    </button>
                    
                    {showMoveMenu && (
                      <div className="fb-card animate-fade-in" style={{ position: "absolute", top: "100%", right: 0, zIndex: 10, width: 180, padding: "0.75rem", marginTop: "0.5rem", boxShadow: "var(--shadow-lg)" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>Move list to...</p>
                        {otherBoards && otherBoards.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                            {otherBoards.map(b => (
                              <button key={b.boardId} onClick={() => handleMove(b.boardId)} className="fb-btn-ghost" style={{ fontSize: "0.7rem", padding: "0.4rem", justifyContent: "flex-start", textAlign: "left", width: "100%" }}>
                                {b.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", margin: 0 }}>No other boards available.</p>
                        )}
                        <button onClick={() => setShowMoveMenu(false)} className="fb-btn-ghost" style={{ fontSize: "0.7rem", marginTop: "0.5rem", width: "100%", borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem" }}>Close</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cards drop zone */}
          <Droppable droppableId={`list-${list.listId}`} type="CARD">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  flex: 1,
                  padding: "0.625rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  minHeight: 80,
                  overflowY: "auto",
                  background: snapshot.isDraggingOver ? "rgba(0, 121, 191, 0.06)" : "transparent",
                  borderRadius: "0 0 0 0",
                  transition: "background var(--transition-fast)",
                }}
              >
                {cards.map((card, index) => (
                  <Draggable key={card.cardId} draggableId={`card-${card.cardId}`} index={index} isDragDisabled={readOnly}>
                    {(cardProvided, cardSnapshot) => (
                      <CardTile
                        card={card}
                        provided={cardProvided}
                        snapshot={cardSnapshot}
                        onOpen={() => onOpenCard(card)}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {cardCount === 0 && !snapshot.isDraggingOver && (
                  <div style={{ padding: "1rem 0.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                    Drop cards here
                  </div>
                )}
              </div>
            )}
          </Droppable>

          {/* Add card section */}
          {!readOnly && (
            <div style={{ padding: "0.625rem", borderTop: "1px solid var(--color-border)", borderRadius: "0 0 var(--radius-xl) var(--radius-xl)", flexShrink: 0 }}>
              {!open ? (
                <button
                  id={`add-card-${list.listId}-btn`}
                  type="button"
                  onClick={() => setOpen(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.375rem",
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--color-border)",
                    background: "transparent",
                    color: "var(--color-text-muted)",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <Plus size={14} /> Add card
                </button>
              ) : (
                <form onSubmit={submit} className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <input
                    autoFocus
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Card title..."
                    style={{ fontSize: "0.875rem" }}
                    id={`card-title-input-${list.listId}`}
                  />
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="Description (optional)"
                    rows={2}
                    style={{ fontSize: "0.8rem", resize: "none" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                    <select
                      value={draft.priority}
                      onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                      style={{ fontSize: "0.75rem", height: "auto", padding: "0.4rem 0.5rem" }}
                    >
                      {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select
                      value={draft.status}
                      onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                      style={{ fontSize: "0.75rem", height: "auto", padding: "0.4rem 0.5rem" }}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                    <div>
                      <label style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.2rem" }}>Start date</label>
                      <input type="date" value={draft.startDate} onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))} style={{ fontSize: "0.75rem", height: "auto", padding: "0.4rem 0.5rem" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.2rem" }}>Due date</label>
                      <input type="date" value={draft.dueDate} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} style={{ fontSize: "0.75rem", height: "auto", padding: "0.4rem 0.5rem" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <input type="color" value={draft.coverColor} onChange={(e) => setDraft((d) => ({ ...d, coverColor: e.target.value }))} style={{ width: 30, height: 28, padding: "1px", flexShrink: 0, cursor: "pointer" }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Cover color</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <button type="submit" disabled={saving} className="fb-btn fb-btn-primary" style={{ flex: 1, padding: "0.45rem" }}>
                      {saving ? "Saving..." : "Create"}
                    </button>
                    <button type="button" onClick={() => setOpen(false)} className="fb-btn fb-btn-secondary" style={{ padding: "0.45rem 0.625rem" }}>
                      <X size={13} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>
      )}
    </Draggable>
  );
}
