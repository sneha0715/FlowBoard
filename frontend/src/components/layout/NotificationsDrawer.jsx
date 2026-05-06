import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Bell, CheckCheck, MailWarning, X } from "lucide-react";
import { cardApi, notificationApi } from "../../api/services";

const TYPE_CONFIG = {
  ASSIGNMENT: { color: "var(--color-primary-light)", bg: "rgba(0,121,191,0.1)", border: "rgba(0,121,191,0.25)" },
  MENTION: { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
  MOVE: { color: "#3fb950", bg: "rgba(63,185,80,0.1)", border: "rgba(63,185,80,0.25)" },
  DUE: { color: "#f85149", bg: "rgba(248,81,73,0.1)", border: "rgba(248,81,73,0.25)" },
  SYSTEM: { color: "var(--color-text-secondary)", bg: "rgba(255,255,255,0.04)", border: "var(--color-border)" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsDrawer({ onClose }) {
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("loading");
  const [overdueCards, setOverdueCards] = useState([]);
  const [dueSoonCards, setDueSoonCards] = useState([]);

  const load = async () => {
    if (!user?.userId) return;
    setStatus("loading");
    try {
      const [notifData, overdueData] = await Promise.all([
        notificationApi.byRecipient(user.userId),
        cardApi.overdue().catch(() => []),
      ]);
      setNotifications(Array.isArray(notifData) ? notifData : []);

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setOverdueCards(Array.isArray(overdueData) ? overdueData : []);
      setDueSoonCards(
        (Array.isArray(overdueData) ? overdueData : []).filter((c) => {
          const d = c.dueDate ? new Date(c.dueDate) : null;
          return d && d >= now && d <= tomorrow;
        })
      );
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, [user?.userId]);

  const markRead = async (notifId) => {
    await notificationApi.markRead(notifId).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notifId ? { ...n, isRead: true } : n))
    );
  };

  const markAllRead = async () => {
    if (!user?.userId) return;
    await notificationApi.markAllRead(user.userId).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(420px, 100vw)",
          background: "var(--color-bg-secondary)",
          borderLeft: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s ease",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 121, 191, 0.05)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                background: "var(--color-primary-subtle)",
                border: "1px solid rgba(0,121,191,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={18} color="var(--color-primary-light)" />
            </div>
            <div>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                Notifications
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                {unreadCount} unread
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={markAllRead}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-primary)",
                  color: "white",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            <button
              id="close-notif-drawer-btn"
              onClick={onClose}
              style={{
                padding: "0.375rem",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-muted)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--color-border)",
                display: "flex",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {/* Due Soon */}
          {dueSoonCards.length > 0 && (
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(210,153,34,0.25)",
                background: "rgba(210,153,34,0.08)",
                padding: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                <MailWarning size={15} color="#d29922" />
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#d29922", margin: 0 }}>Due soon</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {dueSoonCards.map((card) => (
                  <p key={`due-${card.cardId}`} style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: 0 }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>{card.title}</strong> is due within 24 hours.
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Overdue */}
          {overdueCards.length > 0 && (
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(248,81,73,0.2)",
                background: "rgba(248,81,73,0.08)",
                padding: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                <Bell size={15} color="var(--color-error)" />
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-error)", margin: 0 }}>
                  Overdue ({overdueCards.length})
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {overdueCards.slice(0, 5).map((card) => (
                  <p key={`overdue-${card.cardId}`} style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: 0 }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>{card.title}</strong> is overdue.
                  </p>
                ))}
                {overdueCards.length > 5 && (
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                    +{overdueCards.length - 5} more overdue tasks
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Activity
            </p>
            {status === "loading" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="fb-skeleton" style={{ height: 72, borderRadius: "var(--radius-lg)" }} />
                ))}
              </div>
            )}
            {status === "ready" && notifications.length === 0 && (
              <div className="fb-empty">
                <Bell size={32} color="var(--color-text-muted)" />
                <p>No notifications yet</p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {notifications.map((n) => {
                const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                return (
                  <button
                    key={n.notificationId}
                    onClick={() => markRead(n.notificationId)}
                    style={{
                      width: "100%",
                      padding: "0.875rem",
                      borderRadius: "var(--radius-lg)",
                      border: `1px solid ${n.isRead ? "var(--color-border)" : conf.border}`,
                      background: n.isRead ? "rgba(255,255,255,0.02)" : conf.bg,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: n.isRead ? "var(--color-text-secondary)" : "var(--color-text-primary)", margin: 0 }}>
                        {n.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            padding: "0.15rem 0.4rem",
                            borderRadius: "var(--radius-full)",
                            background: conf.bg,
                            color: conf.color,
                            border: `1px solid ${conf.border}`,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {n.type}
                        </span>
                        {!n.isRead && (
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "var(--color-primary)",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", margin: 0 }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
