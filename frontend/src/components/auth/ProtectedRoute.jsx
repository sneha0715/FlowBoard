import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "../../store/slices/authSlice";
import { Kanban, LoaderCircle } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { token, user, status } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchProfile());
    }
  }, [token, user, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

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

  if (status === "failed" && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
