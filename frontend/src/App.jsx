import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => setUser(null);

  if (!user) return <Login onLogin={handleLogin} />;

  if (user.role === "admin")
    return <AdminPanel user={user} onLogout={handleLogout} />;

  if (user.role === "doctor")
    return <Dashboard user={user} onLogout={handleLogout} />;

  return null;
}
