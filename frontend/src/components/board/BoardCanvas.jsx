import { useState } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Filter, Plus, Search, X } from "lucide-react";
import ColumnLane from "./ColumnLane";

const PRIORITY_OPTIONS = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_OPTIONS = ["ALL", "TO_DO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function BoardCanvas({
  lists,
  cardsByListId,
  cardsById,
  onDragEnd,
  onCreateList,
  onCreateCard,
  onRenameList,
  onMoveList,
  otherBoards,
  onOpenCard,
  saving,
  readOnly,
}) {
  const [draft, setDraft] = useState({ name: "", color: "#0079BF" });
  const [open, setOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSearch, setFilterSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    await onCreateList(draft);
    setDraft({ name: "", color: "#0079BF" });
    setOpen(false);
  };

  const isFiltered = filterPriority !== "ALL" || filterStatus !== "ALL" || filterSearch.trim();

  const getFilteredCards = (listId) => {
    const cardIds = cardsByListId[listId] || [];
    return cardIds
      .map((id) => cardsById[id])
      .filter((card) => {
        if (!card) return false;
        if (filterPriority !== "ALL" && card.priority !== filterPriority) return false;
        if (filterStatus !== "ALL" && card.status !== filterStatus) return false;
        if (filterSearch.trim() && !card.title?.toLowerCase().includes(filterSearch.toLowerCase())) return false;
        return true;
      });
  };

  const resetFilters = () => {
    setFilterPriority("ALL");
    setFilterStatus("ALL");
    setFilterSearch("");
  };

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          marginBottom: "1.25rem",
          padding: "0.625rem 0.875rem",
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
          <input
            id="board-search-input"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Filter cards..."
            style={{ paddingLeft: "2rem", paddingRight: filterSearch ? "2rem" : "0.875rem", fontSize: "0.8125rem", height: "34px" }}
          />
          {filterSearch && (
            <button onClick={() => setFilterSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
              <X size={13} />
            </button>
          )}
        </div>

        <button
          id="toggle-filters-btn"
          onClick={() => setShowFilters((v) => !v)}
          className={`fb-btn ${showFilters ? "fb-btn-primary" : "fb-btn-secondary"}`}
          style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", height: "34px", flexShrink: 0 }}
        >
          <Filter size={13} /> Filters
          {isFiltered && (
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "white", marginLeft: "0.25rem" }} />
          )}
        </button>

        {showFilters && (
          <>
            <select
              id="board-filter-priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ fontSize: "0.8rem", height: "34px", width: "auto", minWidth: 100 }}
            >
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p === "ALL" ? "All priorities" : p}</option>)}
            </select>
            <select
              id="board-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ fontSize: "0.8rem", height: "34px", width: "auto", minWidth: 110 }}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "ALL" ? "All statuses" : s.replace("_", " ")}</option>)}
            </select>
          </>
        )}

        {isFiltered && (
          <button onClick={resetFilters} className="fb-btn-ghost" style={{ padding: "0.3rem 0.5rem", fontSize: "0.8rem", height: "34px", display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--color-text-muted)" }}>
            <X size={13} /> Clear
          </button>
        )}

        {saving && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span className="animate-spin" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%" }} />
            Saving...
          </span>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={readOnly ? () => {} : onDragEnd}>
        <Droppable droppableId="board-columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="fb-scroll-x"
              style={{ display: "flex", gap: "1rem", minHeight: "70vh", paddingBottom: "1.5rem", alignItems: "flex-start" }}
            >
              {lists.map((list, index) => (
                <ColumnLane
                  key={list.listId}
                  list={{ ...list, position: index }}
                  cards={getFilteredCards(list.listId)}
                  onCreateCard={onCreateCard}
                  onRenameList={onRenameList}
                  onOpenCard={onOpenCard}
                  onMoveList={onMoveList}
                  otherBoards={otherBoards}
                  saving={saving}
                  readOnly={readOnly}
                />
              ))}
              {provided.placeholder}

              {!readOnly && (
                <div style={{ width: 300, flexShrink: 0 }}>
                  {!open ? (
                    <button
                      id="add-list-btn"
                      onClick={() => setOpen(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        width: "100%",
                        minHeight: 160,
                        borderRadius: "var(--radius-xl)",
                        border: "2px dashed var(--color-border)",
                        background: "rgba(255,255,255,0.02)",
                        color: "var(--color-text-muted)",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all var(--transition-normal)",
                      }}
                    >
                      <Plus size={17} /> Add list
                    </button>
                  ) : (
                    <div className="fb-card animate-fade-in-scale" style={{ padding: "1.25rem", width: 300 }}>
                      <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.875rem" }}>New list</p>
                      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                        <input
                          autoFocus
                          required
                          placeholder="List name (e.g. QA Ready)"
                          value={draft.name}
                          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                          id="new-list-name-input"
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <input
                            type="color"
                            value={draft.color}
                            onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                            style={{ width: 40, height: 34, padding: "2px", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Lane accent color</span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button type="submit" disabled={saving} className="fb-btn fb-btn-primary" style={{ flex: 1 }}>
                            {saving ? "Saving..." : "Add list"}
                          </button>
                          <button type="button" onClick={() => setOpen(false)} className="fb-btn fb-btn-secondary">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
