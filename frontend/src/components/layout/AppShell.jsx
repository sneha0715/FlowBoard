import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  ChevronRight,
  Kanban,
  Layout,
  LogOut,
  Menu,
  Settings,
  Shield,
  User,
  X,
  Zap
} from "lucide-react";
import { logout } from "../../store/slices/authSlice";
import NotificationsDrawer from "./NotificationsDrawer";
import { notificationApi } from "../../api/services";
import { isPlatformAdmin, platformRoleLabel, roleBadgeStyle } from "../../utils/roles";

export default function AppShell({ children, title, subtitle, actions }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = isPlatformAdmin(user);

  useEffect(() => {
    if (!user?.userId) return;
    notificationApi.unreadCount(user.userId)
      .then((count) => setUnreadCount(count ?? 0))
      .catch(() => setUnreadCount(0));
  }, [user?.userId, location]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const initials = user
    ? (user.fullName || user.email || "U")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const navLinks = [
    { to: "/", label: "Workspaces", icon: Layout },
    ...(isAdmin ? [{ to: "/admin", label: "Admin Portal", icon: Shield }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ===== TOP NAVIGATION BAR ===== */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(13, 17, 23, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0 1.5rem",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Left: Logo + Hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="fb-btn-ghost"
            style={{
              padding: "0.4rem",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                background: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-glow-primary)",
                flexShrink: 0,
              }}
            >
              <Kanban size={18} color="white" />
            </div>
            <span
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Flow<span style={{ color: "var(--color-primary-light)" }}>Board</span>
            </span>
          </Link>
        </div>

        {/* Center: Page title (desktop) */}
        {title && (
          <div
            style={{
              flex: 1,
              textAlign: "center",
              display: "none",
            }}
            className="desktop-title"
          >
            <div
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {title}
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {actions}

          {/* Notifications Bell */}
          <button
            id="notif-bell-btn"
            onClick={() => setNotifOpen(true)}
            style={{
              position: "relative",
              padding: "0.4rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
              transition: "all var(--transition-fast)",
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "var(--color-error)",
                  color: "white",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  border: "2px solid var(--color-bg)",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* User Avatar */}
          <Link
            to="/profile"
            id="user-avatar-link"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--color-primary-subtle)",
              border: "2px solid var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--color-primary-light)",
              textDecoration: "none",
              flexShrink: 0,
              transition: "all var(--transition-fast)",
            }}
            title={user?.fullName || user?.email}
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* ===== SIDEBAR OVERLAY ===== */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />

          {/* Sidebar panel */}
          <aside
            style={{
              position: "relative",
              zIndex: 51,
              width: 280,
              background: "var(--color-bg-secondary)",
              borderRight: "1px solid var(--color-border)",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              animation: "slideInLeft 0.25s ease",
              overflowY: "auto",
            }}
          >
            {/* Sidebar Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Kanban size={20} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                    FlowBoard
                  </p>
                  <span
                    className="fb-badge"
                    style={{ fontSize: "0.65rem", display: "inline-flex", marginTop: "2px", ...roleBadgeStyle(user?.role) }}
                  >
                    {platformRoleLabel(user?.role)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  padding: "0.375rem",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text-muted)",
                  background: "transparent",
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* User info */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--color-primary-subtle)",
                  border: "2px solid var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--color-primary-light)",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.fullName || user?.userName || "User"}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {navLinks.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.625rem 0.875rem",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      fontWeight: 500,
                      fontSize: "0.9rem",
                      transition: "all var(--transition-fast)",
                      background: isActive ? "var(--color-primary-subtle)" : "transparent",
                      color: isActive ? "var(--color-primary-light)" : "var(--color-text-secondary)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <Icon size={17} />
                      {label}
                    </span>
                    {isActive && <ChevronRight size={15} />}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div style={{ padding: "0.75rem", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  transition: "all var(--transition-fast)",
                }}
              >
                <Settings size={17} />
                Profile & Settings
              </Link>
              <button
                id="sidebar-logout-btn"
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--radius-md)",
                  width: "100%",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: "var(--color-error)",
                  background: "rgba(248, 81, 73, 0.05)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all var(--transition-fast)",
                }}
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ===== NOTIFICATIONS DRAWER ===== */}
      {notifOpen && (
        <NotificationsDrawer
          onClose={() => {
            setNotifOpen(false);
            if (user?.userId) {
              notificationApi.unreadCount(user.userId)
                .then((count) => setUnreadCount(count ?? 0))
                .catch(() => {});
            }
          }}
        />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Page Header */}
        {(title || subtitle) && (
          <div
            style={{
              padding: "1.5rem 1.5rem 0",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-lg)",
                    background: "var(--color-primary-subtle)",
                    border: "1px solid rgba(0, 121, 191, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Zap size={19} color="var(--color-primary-light)" />
                </div>
                <div>
                  {title && (
                    <h1
                      style={{
                        fontSize: "1.375rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        margin: 0,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0, marginTop: 2 }}>
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {actions && <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>{actions}</div>}
            </div>
          </div>
        )}

        <div style={{ flex: 1, padding: "0 1.5rem 2rem" }}>{children}</div>
      </main>
    </div>
  );
}
