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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {" "}
      <div className="bg-white border rounded-xl p-8 w-full max-w-sm shadow-sm">
        {" "}
        <h2 className="text-lg font-semibold mb-1">Sepsis Monitor</h2>{" "}
        <p className="text-sm text-gray-500 mb-6">Sign in to continue</p>
        {error && (
          <div className="text-sm text-red-700 bg-red-100 border border-red-300 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <label className="text-xs text-gray-500 uppercase block mb-1">
            Username
          </label>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm mb-4"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            placeholder="Enter username"
            autoFocus
          />

          <label className="text-xs text-gray-500 uppercase block mb-1">
            Password
          </label>
          <input
            type="password"
            className="w-full border rounded-md px-3 py-2 text-sm mb-6"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Enter password"
          />

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-black text-white py-2 rounded-md text-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {/* Demo creds */}
        <div className="mt-6 border-t pt-4 text-xs text-gray-500 space-y-1 font-mono">
          <p className="text-gray-400 mb-2">Demo credentials</p>
          <div className="flex justify-between">
            <span>doctor / doctor123</span>
            <span className="text-green-600">Doctor</span>
          </div>
          <div className="flex justify-between">
            <span>admin / admin123</span>
            <span className="text-blue-600">Admin</span>
          </div>
          <div className="flex justify-between">
            <span>nurse / nurse123</span>
            <span className="text-red-600">Nurse</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
