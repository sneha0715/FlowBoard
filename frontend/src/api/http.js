import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("flowboard.token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session on 401
      localStorage.removeItem("flowboard.token");
      localStorage.removeItem("flowboard.user");
      
      // Optional: Force reload to trigger ProtectedRoute logic
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default http;
