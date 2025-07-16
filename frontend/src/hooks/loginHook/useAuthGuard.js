import { useEffect } from "react";
import { API_URL } from "../../setting";
import { useNavigate } from "react-router-dom";

export function useAuthGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Try cookie-based auth as fallback
      fetch(`${API_URL}/auth/me`, { credentials: "include" })
        .then(res => {
          if (!res.ok) navigate("/");
        })
        .catch(() => navigate("/"));
      return;
    }

    // Use token-based auth
    fetch(`${API_URL}/auth/me-token`, { 
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('token');
          navigate("/");
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate("/");
      });
  }, [navigate]);
}
