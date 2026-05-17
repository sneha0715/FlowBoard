import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "../../store/slices/authSlice";
import { isPlatformAdmin } from "../../utils/roles";
import { Kanban, LoaderCircle } from "lucide-react";

/**
 * ProtectedRoute — guards routes behind authentication.
 *
 * @param {string} requiredRole  Optional platform role required for access.
 *                                Currently supports "PLATFORM_ADMIN".
 *                                If the user does not have this role they are
 *                                redirected to "/" instead of the login page.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const dispatch = useDispatch();
  const { token, user, status } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchProfile());
    }
  }, [token, user, dispatch]);

  // Not authenticated at all → send to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token present but profile still loading → show spinner
  if (token && !user && status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          background: "var(--color-bg)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-xl)",
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-glow-primary)",
          }}
        >
          <Kanban size={28} color="white" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-secondary)" }}>
          <LoaderCircle size={18} className="animate-spin" />
          <span style={{ fontSize: "0.9rem" }}>Loading your workspace...</span>
        </div>
      </div>
    );
  }

  // Token present but profile failed → send to login
  if (status === "failed" && !user) {
    return <Navigate to="/login" replace />;
  }

  // Platform-role guard — user is authenticated but lacks the required role
  if (requiredRole === "PLATFORM_ADMIN" && user && !isPlatformAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
