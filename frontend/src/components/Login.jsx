import { useState } from "react";

const USERS = [
  { username: "doctor", password: "doctor123", role: "doctor" },
  { username: "admin", password: "admin123", role: "admin" },
];

const s = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fafaf9",
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
  },
  card: {
    background: "#fff",
    border: "0.5px solid #e5e5e4",
    borderRadius: 12,
    padding: "2.5rem 2rem",
    width: 340,
  },
  title: {
    fontSize: 18,
    fontWeight: 500,
    letterSpacing: "-0.02em",
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: "#999", marginBottom: "2rem" },
  label: {
    fontSize: 11,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    border: "0.5px solid #d4d4d4",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 13,
    background: "#fff",
    color: "#1a1a1a",
    boxSizing: "border-box",
    marginBottom: "1.25rem",
  },
  btn: {
    width: "100%",
    padding: "9px 0",
    fontSize: 13,
    fontWeight: 500,
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  error: {
    fontSize: 12,
    color: "#A32D2D",
    marginBottom: "1rem",
    background: "#FCEBEB",
    padding: "8px 12px",
    borderRadius: 6,
    border: "0.5px solid #F09595",
  },
  hint: {
    marginTop: "1.5rem",
    borderTop: "0.5px solid #f0f0f0",
    paddingTop: "1rem",
  },
  hintRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#bbb",
    marginBottom: 4,
    fontFamily: "monospace",
  },
};

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = USERS.find(
      (u) => u.username === username.trim() && u.password === password,
    );
    if (!user) {
      setError("Invalid username or password");
      return;
    }
    onLogin(user);
  };

  return (
    <div style={s.root}>
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div style={s.card}>
        <div style={s.title}>Sepsis Monitor</div>
        <div style={s.subtitle}>Sign in to continue</div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleLogin}>
          <span style={s.label}>Username</span>
          <input
            style={s.input}
            autoFocus
            value={username}
            placeholder="Enter username"
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
          />
          <span style={s.label}>Password</span>
          <input
            style={s.input}
            type="password"
            value={password}
            placeholder="Enter password"
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
          />
          <button style={s.btn} type="submit">
            Sign in
          </button>
        </form>

        <div style={s.hint}>
          <div
            style={{
              ...s.hintRow,
              color: "#ccc",
              marginBottom: 8,
              fontSize: 11,
            }}
          >
            Demo credentials
          </div>
          <div style={s.hintRow}>
            <span>doctor / doctor123</span>
            <span style={{ color: "#1D9E75" }}>Doctor</span>
          </div>
          <div style={s.hintRow}>
            <span>admin / admin123</span>
            <span style={{ color: "#378ADD" }}>Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
