// ─────────────────────────────────────────────────────────────────────────────
// FlowBoard — Centralised Role Utility
//
// Role Layers:
//   Platform  → MEMBER (default) | PLATFORM_ADMIN
//   Workspace → OWNER | ADMIN | MEMBER | OBSERVER  (stored in workspace_db)
//   Board     → ADMIN | MEMBER | OBSERVER           (stored in board_db)
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ────────────────────────────────────────────────────────────────

export const PLATFORM_ROLES = ["MEMBER", "PLATFORM_ADMIN"];

export const WORKSPACE_ROLES = ["OWNER", "ADMIN", "MEMBER", "OBSERVER"];

export const BOARD_ROLES = ["ADMIN", "MEMBER", "OBSERVER"];

// ── Platform role checks ─────────────────────────────────────────────────────

/** Returns true if the logged-in user is a Platform Admin */
export const isPlatformAdmin = (user) => user?.role === "PLATFORM_ADMIN";

// ── Workspace role checks ─────────────────────────────────────────────────────

/** Returns true for roles that grant full workspace management */
export const isWorkspaceAdmin = (wsRole) =>
  wsRole === "OWNER" || wsRole === "ADMIN";

/**
 * Can this user perform admin actions on a workspace?
 * Platform admins bypass workspace-level restrictions.
 */
export const canManageWorkspace = (user, wsRole) =>
  isPlatformAdmin(user) || isWorkspaceAdmin(wsRole);

/**
 * Can this user create boards or add cards?
 * Workspace MEMBERs and above (not OBSERVERs).
 * Platform admins always can.
 */
export const canEditInWorkspace = (user, wsRole) =>
  isPlatformAdmin(user) ||
  wsRole === "OWNER" ||
  wsRole === "ADMIN" ||
  wsRole === "MEMBER";

/** Can this user see workspace content? (any role except NONE) */
export const canViewWorkspace = (wsRole) =>
  wsRole && wsRole !== "NONE";

// ── Board role checks ─────────────────────────────────────────────────────────

/** Can this user admin a board (rename, close, manage members)? */
export const isBoardAdmin = (user, boardRole) =>
  isPlatformAdmin(user) || boardRole === "ADMIN";

/**
 * Can this user create/edit/move cards?
 * Board MEMBERs and ADMINs (not OBSERVERs).
 */
export const canEditBoard = (user, boardRole) =>
  isPlatformAdmin(user) || boardRole === "ADMIN" || boardRole === "MEMBER";

/** Can this user view board content? */
export const canViewBoard = (boardRole) =>
  boardRole && boardRole !== "NONE";

// ── Display helpers ───────────────────────────────────────────────────────────

/** Human-readable label for a platform role */
export const platformRoleLabel = (role) => {
  switch (role) {
    case "PLATFORM_ADMIN": return "Platform Admin";
    case "MEMBER":         return "Member";
    default:               return role ?? "Unknown";
  }
};

/** Human-readable label for a workspace role */
export const workspaceRoleLabel = (role) => {
  switch (role) {
    case "OWNER":    return "Owner";
    case "ADMIN":    return "Admin";
    case "MEMBER":   return "Member";
    case "OBSERVER": return "Observer";
    default:         return role ?? "None";
  }
};

/**
 * Badge styling for a workspace/board role.
 * Returns { color, background, border } style object.
 */
export const roleBadgeStyle = (role) => {
  switch (role) {
    case "OWNER":
      return { color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)" };
    case "ADMIN":
      return { color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)" };
    case "MEMBER":
      return { color: "var(--color-primary-light)", background: "var(--color-primary-subtle)", border: "1px solid rgba(0,121,191,0.25)" };
    case "OBSERVER":
      return { color: "var(--color-text-secondary)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" };
    case "PLATFORM_ADMIN":
      return { color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)" };
    default:
      return { color: "var(--color-text-muted)", background: "transparent", border: "1px solid var(--color-border)" };
  }
};

/**
 * Short description of what a workspace role can do.
 */
export const roleDescription = (role) => {
  switch (role) {
    case "OWNER":    return "Full control — created this workspace.";
    case "ADMIN":    return "Can manage members, boards, and settings.";
    case "MEMBER":   return "Can create and edit boards and cards.";
    case "OBSERVER": return "Read-only access — cannot edit anything.";
    default:         return "";
  }
};
