import { AlertCircle, Calendar, CheckSquare, User } from "lucide-react";

const PRIORITY_STYLES = {
  LOW: { color: "var(--priority-low)", bg: "rgba(63,185,80,0.12)", label: "Low" },
  MEDIUM: { color: "var(--priority-medium)", bg: "rgba(210,153,34,0.12)", label: "Medium" },
  HIGH: { color: "var(--priority-high)", bg: "rgba(248,81,73,0.12)", label: "High" },
  CRITICAL: { color: "var(--priority-critical)", bg: "rgba(255,77,109,0.18)", label: "Critical" },
};

const STATUS_STYLES = {
  TO_DO: { color: "var(--status-todo)" },
  IN_PROGRESS: { color: "var(--status-inprogress)" },
  IN_REVIEW: { color: "var(--status-inreview)" },
  DONE: { color: "var(--status-done)" },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CardTile({ card, provided, snapshot, onOpen }) {
  const priority = PRIORITY_STYLES[card.priority] || PRIORITY_STYLES.MEDIUM;
  const statusStyle = STATUS_STYLES[card.status] || STATUS_STYLES.TO_DO;

  const isOverdue = card.dueDate && card.status !== "DONE" && new Date(card.dueDate) < new Date();

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onOpen}
      style={{
        ...provided.draggableProps.style,
        background: snapshot.isDragging ? "var(--color-bg-secondary)" : "var(--color-bg-card)",
        border: `1px solid ${snapshot.isDragging ? "rgba(0,121,191,0.4)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)",
        cursor: "pointer",
        boxShadow: snapshot.isDragging ? "var(--shadow-lg)" : "var(--shadow-sm)",
        transition: snapshot.isDragging ? "none" : "all var(--transition-fast)",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Cover color strip */}
      {card.coverColor && (
        <div style={{ height: 4, background: card.coverColor, opacity: 0.8 }} />
      )}

      <div style={{ padding: "0.625rem 0.75rem" }}>
        {/* Priority badge + status indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.375rem", marginBottom: "0.375rem" }}>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "0.15rem 0.45rem",
              borderRadius: "var(--radius-full)",
              background: priority.bg,
              color: priority.color,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}
          >
            {priority.label}
          </span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusStyle.color, flexShrink: 0 }} />
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {card.title}
        </p>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {card.dueDate && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                fontSize: "0.7rem",
                color: isOverdue ? "var(--color-error)" : "var(--color-text-muted)",
                fontWeight: isOverdue ? 600 : 400,
              }}
            >
              {isOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
              {formatDate(card.dueDate)}
            </span>
          )}
          {card.assigneeId && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                fontSize: "0.7rem",
                color: "var(--color-text-muted)",
              }}
            >
              <User size={11} />
              #{card.assigneeId}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
