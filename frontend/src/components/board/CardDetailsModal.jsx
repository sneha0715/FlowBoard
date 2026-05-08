import { useEffect, useState } from "react";
import {
  Archive,
  Calendar,
  CheckSquare,
  MessageCircle,
  Paperclip,
  Tag,
  Trash2,
  User,
  X,
  Reply,
  Edit2,
  FilePlus,
  FileText,
} from "lucide-react";
import { attachmentApi, cardApi, checklistApi, commentApi, labelApi, notificationApi } from "../../api/services";

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_OPTIONS = ["TO_DO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

const PRIORITY_COLORS = {
  LOW: "var(--priority-low)",
  MEDIUM: "var(--priority-medium)",
  HIGH: "var(--priority-high)",
  CRITICAL: "var(--priority-critical)",
};

const LABEL_PRESETS = [
  { name: "Bug", color: "#f85149" },
  { name: "Feature", color: "#0079BF" },
  { name: "Improvement", color: "#3fb950" },
  { name: "Documentation", color: "#d29922" },
  { name: "Design", color: "#a78bfa" },
  { name: "Urgent", color: "#ff4d6d" },
];

export default function CardDetailsModal({ boardId, card, boardMembers, currentUser, open, onClose, onRefresh, readOnly }) {
  const [activeTab, setActiveTab] = useState("details");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  // Comments
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Checklists
  const [checklists, setChecklists] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItems, setNewItems] = useState({});

  // Labels
  const [cardLabels, setCardLabels] = useState([]);
  const [boardLabels, setBoardLabels] = useState([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#0079BF");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  useEffect(() => {
    if (!card) return;
    setDraft({
      title: card.title,
      description: card.description || "",
      priority: card.priority || "MEDIUM",
      status: card.status || "TO_DO",
      dueDate: card.dueDate ? card.dueDate.split("T")[0] : "",
      startDate: card.startDate ? card.startDate.split("T")[0] : "",
      assigneeId: card.assigneeId ? String(card.assigneeId) : "",
      coverColor: card.coverColor || "#0079BF",
    });
    setActiveTab("details");
    loadComments();
    loadChecklists();
    loadLabels();
    loadAttachments();
  }, [card?.cardId]);

  if (!open || !card) return null;

  const loadComments = async () => {
    const data = await commentApi.byCard(card.cardId).catch(() => []);
    setComments(Array.isArray(data) ? data : []);
  };

  const loadChecklists = async () => {
    const data = await checklistApi.byCard(card.cardId).catch(() => []);
    setChecklists(Array.isArray(data) ? data : []);
  };

  const loadLabels = async () => {
    const [cardL, boardL] = await Promise.all([
      labelApi.byCard(card.cardId).catch(() => []),
      labelApi.byBoard(boardId).catch(() => []),
    ]);
    setCardLabels(Array.isArray(cardL) ? cardL : []);
    setBoardLabels(Array.isArray(boardL) ? boardL : []);
  };
  
  const loadAttachments = async () => {
    const data = await attachmentApi.byCard(card.cardId).catch(() => []);
    setAttachments(Array.isArray(data) ? data : []);
  };

  const saveCard = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cardApi.update(card.cardId, {
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        status: draft.status,
        dueDate: draft.dueDate || null,
        startDate: draft.startDate || null,
        assigneeId: draft.assigneeId ? Number(draft.assigneeId) : null,
        coverColor: draft.coverColor,
        listId: card.listId,
        boardId: card.boardId,
      });

      // Notify assignee
      if (draft.assigneeId && Number(draft.assigneeId) !== Number(currentUser?.userId)) {
        await notificationApi.send({
          recipientId: Number(draft.assigneeId),
          actorId: Number(currentUser?.userId),
          type: "ASSIGNMENT",
          title: `Assigned to card: ${draft.title}`,
          message: `${currentUser?.fullName || currentUser?.email} assigned you to "${draft.title}".`,
          relatedId: card.cardId,
          relatedType: "CARD",
        }).catch(() => {});
      }
      onRefresh();
    } catch {
      // silently fail on update
    } finally { setSaving(false); }
  };

  const archiveCard = async () => {
    if (!window.confirm("Archive this card?")) return;
    await cardApi.archive(card.cardId).catch(() => {});
    onRefresh();
    onClose();
  };

  const deleteCard = async () => {
    if (!window.confirm("Permanently delete this card?")) return;
    await cardApi.remove(card.cardId).catch(() => {});
    onRefresh();
    onClose();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      await commentApi.create({ cardId: card.cardId, authorId: Number(currentUser?.userId), content: commentText });
      setCommentText("");
      await loadComments();
    } finally { setCommentSubmitting(false); }
  };

  const deleteComment = async (commentId) => {
    await commentApi.remove(commentId).catch(() => {});
    await loadComments();
  };
  
  const handleEditComment = async (e) => {
    e.preventDefault();
    if (!editCommentText.trim()) return;
    await commentApi.update(editingComment.commentId, { content: editCommentText });
    setEditingComment(null);
    setEditCommentText("");
    await loadComments();
  };
  
  const handleReply = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !replyingTo) return;
    setCommentSubmitting(true);
    try {
      await commentApi.create({ 
        cardId: card.cardId, 
        authorId: Number(currentUser?.userId), 
        content: commentText,
        parentId: replyingTo.commentId 
      });
      setCommentText("");
      setReplyingTo(null);
      await loadComments();
    } finally { setCommentSubmitting(false); }
  };
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Simulate upload to get a URL
      const mockUrl = URL.createObjectURL(file);
      await attachmentApi.create({
        cardId: card.cardId,
        fileName: file.name,
        fileUrl: mockUrl,
        fileType: file.type,
        sizeKb: Math.round(file.size / 1024)
      });
      await loadAttachments();
    } finally { setUploading(false); }
  };
  
  const deleteAttachment = async (id) => {
    await attachmentApi.remove(id).catch(() => {});
    await loadAttachments();
  };

  const addChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    await checklistApi.create({ cardId: card.cardId, title: newChecklistTitle, position: checklists.length });
    setNewChecklistTitle("");
    await loadChecklists();
  };

  const addChecklistItem = async (checklistId, e) => {
    e.preventDefault();
    const text = newItems[checklistId];
    if (!text?.trim()) return;
    await checklistApi.addItem(checklistId, { title: text, completed: false });
    setNewItems((prev) => ({ ...prev, [checklistId]: "" }));
    await loadChecklists();
  };

  const toggleItem = async (itemId) => {
    await checklistApi.toggleItem(itemId).catch(() => {});
    await loadChecklists();
  };

  const assignLabel = async (labelId) => {
    await labelApi.assignToCard(card.cardId, labelId).catch(() => {});
    await loadLabels();
  };

  const removeLabel = async (labelId) => {
    await labelApi.removeFromCard(card.cardId, labelId).catch(() => {});
    await loadLabels();
  };

  const createAndAssignLabel = async (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    try {
      const newLabel = await labelApi.create({ boardId, name: newLabelName.trim(), color: newLabelColor });
      await labelApi.assignToCard(card.cardId, newLabel.labelId || newLabel.id);
      setNewLabelName("");
      await loadLabels();
    } catch {}
  };

  const totalItems = checklists.flatMap((cl) => cl.items || []).length;
  const doneItems = checklists.flatMap((cl) => cl.items || []).filter((it) => it.completed || it.isCompleted).length;
  const checkProgress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const assignedLabelIds = new Set(cardLabels.map((l) => l.labelId || l.id));

  return (
    <div className="fb-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fb-modal" style={{ maxWidth: 700, padding: 0 }}>
        {/* Color header strip */}
        {draft?.coverColor && (
          <div style={{ height: 6, background: draft.coverColor }} />
        )}

        {/* Modal header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          {draft ? (
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              readOnly={readOnly}
              style={{ fontSize: "1.125rem", fontWeight: 700, background: "transparent", border: "none", boxShadow: "none", padding: "0", flex: 1 }}
              id="card-detail-title"
            />
          ) : (
            <h3 style={{ margin: 0, flex: 1 }}>{card.title}</h3>
          )}
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            {!readOnly && (
              <>
                <button onClick={archiveCard} className="fb-btn-ghost" style={{ padding: "0.375rem", borderRadius: "var(--radius-md)", color: "#d29922" }} title="Archive card">
                  <Archive size={16} />
                </button>
                <button onClick={deleteCard} className="fb-btn-ghost" style={{ padding: "0.375rem", borderRadius: "var(--radius-md)", color: "var(--color-error)" }} title="Delete card">
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button id="close-card-detail-btn" onClick={onClose} style={{ padding: "0.375rem", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.06)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="fb-tabs" style={{ padding: "0 1.5rem", marginBottom: 0 }}>
          {[
            { id: "details", label: "Details", icon: User },
            { id: "checklist", label: `Checklist${totalItems > 0 ? ` (${doneItems}/${totalItems})` : ""}`, icon: CheckSquare },
            { id: "comments", label: `Comments${comments.length > 0 ? ` (${comments.length})` : ""}`, icon: MessageCircle },
            { id: "attachments", label: `Attachments${attachments.length > 0 ? ` (${attachments.length})` : ""}`, icon: Paperclip },
            { id: "labels", label: `Labels${cardLabels.length > 0 ? ` (${cardLabels.length})` : ""}`, icon: Tag },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`fb-tab ${activeTab === id ? "active" : ""}`} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8rem" }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", maxHeight: "60vh" }}>
          {/* Details tab */}
          {activeTab === "details" && draft && (
            <form onSubmit={saveCard} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="fb-input-group">
                <label className="fb-input-label">Description</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={4}
                  readOnly={readOnly}
                  placeholder="Add a description..."
                  style={{ resize: "vertical" }}
                  id="card-detail-description"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                <div className="fb-input-group">
                  <label className="fb-input-label">Priority</label>
                  <select value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))} disabled={readOnly}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="fb-input-group">
                  <label className="fb-input-label">Status</label>
                  <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} disabled={readOnly}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div className="fb-input-group">
                  <label className="fb-input-label"><Calendar size={12} style={{ display: "inline", marginRight: 4 }} />Start date</label>
                  <input type="date" value={draft.startDate} onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))} readOnly={readOnly} id="card-start-date" />
                </div>
                <div className="fb-input-group">
                  <label className="fb-input-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span><Calendar size={12} style={{ display: "inline", marginRight: 4 }} />Due date</span>
                    {draft.dueDate && draft.status !== "DONE" && new Date(draft.dueDate) < new Date() && (
                      <span style={{ color: "var(--color-error)", fontSize: "0.7rem", fontWeight: 700 }}>OVERDUE</span>
                    )}
                  </label>
                  <input 
                    type="date" 
                    value={draft.dueDate} 
                    onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} 
                    readOnly={readOnly} 
                    id="card-due-date" 
                    style={draft.dueDate && draft.status !== "DONE" && new Date(draft.dueDate) < new Date() ? { borderColor: "var(--color-error)", background: "rgba(248,81,73,0.05)" } : {}}
                  />
                </div>
                <div className="fb-input-group">
                  <label className="fb-input-label"><User size={12} style={{ display: "inline", marginRight: 4 }} />Assignee</label>
                  {boardMembers.length > 0 ? (
                    <select value={draft.assigneeId} onChange={(e) => setDraft((d) => ({ ...d, assigneeId: e.target.value }))} disabled={readOnly} id="card-assignee-select">
                      <option value="">Unassigned</option>
                      {boardMembers.map((m) => <option key={m.userId} value={m.userId}>User #{m.userId} ({m.role})</option>)}
                    </select>
                  ) : (
                    <input type="number" value={draft.assigneeId} onChange={(e) => setDraft((d) => ({ ...d, assigneeId: e.target.value }))} placeholder="User ID" readOnly={readOnly} id="card-assignee-id" />
                  )}
                </div>
                <div className="fb-input-group">
                  <label className="fb-input-label">Cover color</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input type="color" value={draft.coverColor} onChange={(e) => setDraft((d) => ({ ...d, coverColor: e.target.value }))} disabled={readOnly} style={{ width: 40, height: 36, padding: "2px", flex: "none" }} />
                    <input value={draft.coverColor} onChange={(e) => setDraft((d) => ({ ...d, coverColor: e.target.value }))} readOnly={readOnly} style={{ flex: 1 }} />
                  </div>
                </div>
              </div>
              {!readOnly && (
                <button id="save-card-btn" type="submit" disabled={saving} className="fb-btn fb-btn-primary" style={{ alignSelf: "flex-start" }}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              )}
            </form>
          )}

          {/* Checklist tab */}
          {activeTab === "checklist" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {totalItems > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Progress</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: checkProgress === 100 ? "var(--color-success)" : "var(--color-text-secondary)" }}>{checkProgress}%</span>
                  </div>
                  <div className="fb-progress-bar">
                    <div className="fb-progress-fill" style={{ width: `${checkProgress}%`, background: checkProgress === 100 ? "var(--color-success)" : undefined }} />
                  </div>
                </div>
              )}

              {checklists.map((cl) => {
                const items = cl.items || [];
                const done = items.filter((it) => it.completed || it.isCompleted).length;
                return (
                  <div key={cl.checklistId} style={{ padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{cl.title}</p>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{done}/{items.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {items.map((item) => (
                        <label key={item.checklistItemId || item.id} style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: readOnly ? "default" : "pointer", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                          <input
                            type="checkbox"
                            checked={Boolean(item.completed || item.isCompleted)}
                            onChange={() => !readOnly && toggleItem(item.checklistItemId || item.id)}
                            readOnly={readOnly}
                            style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }}
                          />
                          <span style={{ textDecoration: (item.completed || item.isCompleted) ? "line-through" : "none", opacity: (item.completed || item.isCompleted) ? 0.6 : 1 }}>
                            {item.title}
                          </span>
                        </label>
                      ))}
                    </div>
                    {!readOnly && (
                      <form onSubmit={(e) => addChecklistItem(cl.checklistId, e)} style={{ display: "flex", gap: "0.375rem", marginTop: "0.625rem" }}>
                        <input
                          value={newItems[cl.checklistId] || ""}
                          onChange={(e) => setNewItems((prev) => ({ ...prev, [cl.checklistId]: e.target.value }))}
                          placeholder="Add item..."
                          style={{ flex: 1, fontSize: "0.8rem" }}
                        />
                        <button type="submit" className="fb-btn fb-btn-secondary" style={{ padding: "0.3rem 0.625rem", fontSize: "0.8rem", flexShrink: 0 }}>Add</button>
                      </form>
                    )}
                  </div>
                );
              })}

              {!readOnly && (
                <form onSubmit={addChecklist} style={{ display: "flex", gap: "0.5rem" }}>
                  <input value={newChecklistTitle} onChange={(e) => setNewChecklistTitle(e.target.value)} placeholder="New checklist title..." style={{ flex: 1 }} id="new-checklist-title-input" />
                  <button type="submit" className="fb-btn fb-btn-secondary" style={{ flexShrink: 0 }}>
                    <CheckSquare size={14} /> Add
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Comments tab */}
          {activeTab === "comments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {!readOnly && (
                <form onSubmit={replyingTo ? handleReply : submitComment} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {replyingTo && (
                    <div style={{ fontSize: "0.75rem", color: "var(--color-primary-light)", display: "flex", alignItems: "center", gap: "0.375rem", background: "rgba(0,121,191,0.1)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                      <Reply size={12} /> Replying to User #{replyingTo.authorId}
                      <button type="button" onClick={() => setReplyingTo(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer" }}><X size={12} /></button>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                      rows={2}
                      style={{ flex: 1, resize: "none", fontSize: "0.875rem" }}
                      id="comment-input"
                    />
                    <button type="submit" disabled={commentSubmitting || !commentText.trim()} className="fb-btn fb-btn-primary" style={{ flexShrink: 0 }}>
                      {commentSubmitting ? "..." : (replyingTo ? <Reply size={15} /> : <MessageCircle size={15} />)}
                    </button>
                  </div>
                </form>
              )}
              
              {comments.length === 0 && (
                <div className="fb-empty" style={{ padding: "1.5rem" }}>
                  <MessageCircle size={24} color="var(--color-text-muted)" />
                  <p>No comments yet.</p>
                </div>
              )}
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {comments.filter(c => !c.parentId).map((c) => {
                  const replies = comments.filter(r => Number(r.parentId) === Number(c.commentId));
                  return (
                    <div key={c.commentId} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {/* Main comment */}
                      <div style={{ padding: "0.875rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                            User #{c.authorId}
                            {c.createdAt && ` · ${new Date(c.createdAt).toLocaleDateString()}`}
                          </span>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            {!readOnly && (
                              <button onClick={() => setReplyingTo(c)} className="fb-btn-ghost" style={{ padding: "0.2rem", color: "var(--color-primary-light)" }} title="Reply">
                                <Reply size={13} />
                              </button>
                            )}
                            {(Number(c.authorId) === Number(currentUser?.userId)) && (
                              <button onClick={() => { setEditingComment(c); setEditCommentText(c.content); }} className="fb-btn-ghost" style={{ padding: "0.2rem", color: "var(--color-text-muted)" }}>
                                <Edit2 size={13} />
                              </button>
                            )}
                            {(Number(c.authorId) === Number(currentUser?.userId) || !readOnly) && (
                              <button onClick={() => deleteComment(c.commentId)} className="fb-btn-ghost" style={{ padding: "0.2rem", color: "var(--color-error)" }}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {editingComment?.commentId === c.commentId ? (
                          <form onSubmit={handleEditComment} style={{ display: "flex", gap: "0.5rem" }}>
                            <input autoFocus value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} style={{ flex: 1, fontSize: "0.875rem" }} />
                            <button type="submit" className="fb-btn fb-btn-primary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>Save</button>
                            <button type="button" onClick={() => setEditingComment(null)} className="fb-btn fb-btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>Cancel</button>
                          </form>
                        ) : (
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.content}</p>
                        )}
                      </div>
                      
                      {/* Replies */}
                      {replies.length > 0 && (
                        <div style={{ marginLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderLeft: "2px solid var(--color-border)", paddingLeft: "0.75rem" }}>
                          {replies.map(r => (
                            <div key={r.commentId} style={{ padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.01)" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                                  User #{r.authorId} · {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                                {(Number(r.authorId) === Number(currentUser?.userId) || !readOnly) && (
                                  <button onClick={() => deleteComment(r.commentId)} className="fb-btn-ghost" style={{ padding: "0.15rem", color: "var(--color-error)" }}>
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{r.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attachments tab */}
          {activeTab === "attachments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {!readOnly && (
                <div style={{ position: "relative" }}>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 1 }}
                    id="attachment-upload-input"
                  />
                  <div style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "2px dashed var(--color-border)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.01)", transition: "all var(--transition-fast)" }}>
                    <FilePlus size={24} color={uploading ? "var(--color-primary)" : "var(--color-text-muted)"} className={uploading ? "animate-pulse" : ""} />
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                      {uploading ? "Uploading..." : "Click or drag to upload"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>PDF, PNG, JPG, DOCX (Max 10MB)</p>
                  </div>
                </div>
              )}

              {attachments.length === 0 && !uploading && (
                <div className="fb-empty" style={{ padding: "1.5rem" }}>
                  <Paperclip size={24} color="var(--color-text-muted)" />
                  <p>No attachments yet.</p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {attachments.map((at) => (
                  <div key={at.attachmentId} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)", transition: "all var(--transition-fast)", position: "relative", group: "true" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--color-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {at.fileType?.includes("image") ? (
                        <img src={at.fileUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-md)" }} />
                      ) : (
                        <FileText size={20} color="var(--color-primary-light)" />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{at.fileName}</p>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{at.sizeKb} KB · {new Date(at.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <a href={at.fileUrl} target="_blank" rel="noopener noreferrer" className="fb-btn-ghost" style={{ padding: "0.25rem", color: "var(--color-primary-light)" }}>
                         <Paperclip size={13} />
                      </a>
                      {!readOnly && (
                        <button onClick={() => deleteAttachment(at.attachmentId)} className="fb-btn-ghost" style={{ padding: "0.25rem", color: "var(--color-error)" }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labels tab */}
          {activeTab === "labels" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Current labels */}
              {cardLabels.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Applied</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {cardLabels.map((l) => (
                      <div key={l.labelId || l.id} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.5rem 0.25rem 0.625rem", borderRadius: "var(--radius-full)", background: `${l.color}22`, border: `1px solid ${l.color}44` }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: l.color }}>{l.name}</span>
                        {!readOnly && (
                          <button onClick={() => removeLabel(l.labelId || l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: l.color, display: "flex", padding: "0 0 0 2px" }}>
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Board labels */}
              {boardLabels.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Board labels</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {boardLabels.map((l) => {
                      const assigned = assignedLabelIds.has(l.labelId || l.id);
                      return (
                        <button
                          key={l.labelId || l.id}
                          onClick={() => !readOnly && (assigned ? removeLabel(l.labelId || l.id) : assignLabel(l.labelId || l.id))}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "var(--radius-full)",
                            background: assigned ? `${l.color}30` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${assigned ? l.color + "80" : "var(--color-border)"}`,
                            cursor: readOnly ? "default" : "pointer",
                            transition: "all var(--transition-fast)",
                          }}
                        >
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: assigned ? l.color : "var(--color-text-secondary)" }}>{l.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Create new label */}
              {!readOnly && (
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Create label</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.75rem" }}>
                    {LABEL_PRESETS.map((preset) => (
                      <button key={preset.name} type="button" onClick={() => { setNewLabelName(preset.name); setNewLabelColor(preset.color); }} style={{ padding: "0.2rem 0.625rem", borderRadius: "var(--radius-full)", background: `${preset.color}22`, border: `1px solid ${preset.color}44`, color: preset.color, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={createAndAssignLabel} style={{ display: "flex", gap: "0.5rem" }}>
                    <input type="color" value={newLabelColor} onChange={(e) => setNewLabelColor(e.target.value)} style={{ width: 36, height: 36, padding: "2px", flexShrink: 0 }} />
                    <input value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder="Label name..." style={{ flex: 1 }} id="new-label-name-input" />
                    <button type="submit" className="fb-btn fb-btn-secondary" style={{ flexShrink: 0 }}><Tag size={14} /> Create</button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
