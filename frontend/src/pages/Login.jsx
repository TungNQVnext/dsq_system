import { useState, useEffect } from "react";
import { API_URL } from "../setting";
import "../styles/Login.css"
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(res => {
        if (res.ok) navigate("/menu");
      });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Use token-based login first
      const tokenResponse = await fetch(`${API_URL}/auth/login-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Đăng nhập thất bại");
      }

      const tokenData = await tokenResponse.json();
      
      // Save token and user data
      localStorage.setItem('token', tokenData.access_token);
      localStorage.setItem('user', JSON.stringify(tokenData.user));
      
      console.log('Login successful, token saved:', tokenData.access_token.substring(0, 20) + '...');
      console.log('User data saved:', tokenData.user);

      // Also do cookie-based login for backward compatibility
      try {
        await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
          credentials: "include",
        });
      } catch (cookieErr) {
        console.warn('Cookie login failed, but token login succeeded');
      }

      navigate("/menu");
    } catch (err) {
      console.error('Login error:', err);
      setError("Sai tên đăng nhập hoặc mật khẩu");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <Header />
    <div className="login-wrapper">
      <div className="login-box">
        <h2 className="login-title">Đăng nhập</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="primary-button">
            Đăng nhập
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
    <Footer />
    </div>
  );
};

export default Login;
