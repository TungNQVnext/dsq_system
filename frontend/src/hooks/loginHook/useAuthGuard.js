import { useEffect } from "react";
import { API_URL } from "../../setting";
import { useNavigate } from "react-router-dom";

export function useAuthGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(res => {
        if (!res.ok) navigate("/");
      });
  }, [navigate]);
}
