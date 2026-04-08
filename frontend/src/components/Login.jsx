import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div className="w-full max-w-sm px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Sepsis Monitor</h1>
          <p className="text-base text-slate-500 mt-1">
            Clinical Decision Support System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-slate-900 p-7 shadow-sm">
          {error && (
            <div className="flex items-center gap-2 text-base px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-800 mb-5">
              <span className="font-bold">✕</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="Enter username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-base font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
