import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE = "http://localhost:8000/api/v1";

const ROLE_BADGE = {
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  doctor: "bg-blue-100 text-blue-800 border-blue-200",
  nurse: "bg-green-100 text-green-800 border-green-200",
};

function StatusMessage({ msg }) {
  if (!msg) return null;
  const isError = msg.type === "error";
  return (
    <div
      className={`flex items-start gap-2 text-sm px-4 py-3 rounded-lg border mb-4 ${
        isError
          ? "bg-red-50 border-red-200 text-red-800"
          : "bg-green-50 border-green-200 text-green-800"
      }`}
    >
      <span className="font-bold">{isError ? "✕" : "✓"}</span>
      <span>{msg.text}</span>
    </div>
  );
}

export default function UserManagement() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [listMsg, setListMsg] = useState(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "nurse",
  });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);

  const [deletingUsername, setDeletingUsername] = useState(null);

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setListMsg(null);
    try {
      const res = await fetch(`${BASE}/auth/users`, { headers: authHeader });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load users");
      setUsers(data.users || []);
    } catch (err) {
      setListMsg({ type: "error", text: err.message });
    } finally {
      setLoadingUsers(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      const res = await fetch(`${BASE}/auth/users`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create user");
      setCreateMsg({
        type: "success",
        text: `User '${data.username}' created as ${data.role}.`,
      });
      setForm({ username: "", password: "", role: "nurse" });
      fetchUsers();
    } catch (err) {
      setCreateMsg({ type: "error", text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`Delete user '${username}'? This cannot be undone.`))
      return;
    setDeletingUsername(username);
    try {
      const res = await fetch(`${BASE}/auth/users/${username}`, {
        method: "DELETE",
        headers: authHeader,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.username !== username));
    } catch (err) {
      setListMsg({ type: "error", text: err.message });
    } finally {
      setDeletingUsername(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              User Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Create and manage system users
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base text-slate-700 font-medium">
              {user?.username}
              <span className="ml-2 text-sm text-slate-400 capitalize">
                ({user?.role})
              </span>
            </span>
            <button
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-base text-slate-700 hover:bg-slate-50"
              onClick={() => navigate("/")}
            >
              ← Dashboard
            </button>
            <button
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-base hover:bg-slate-700"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* ── Add User Card ── */}
          <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-blue-500">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Add New User
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Create a doctor, nurse, or admin account
              </p>
            </div>
            <div className="px-6 py-6">
              <StatusMessage msg={createMsg} />
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                    placeholder="e.g. dr_smith"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="Min. 8 characters"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating || !form.username || !form.password}
                  className="px-5 py-2.5 bg-slate-900 text-white text-base font-medium rounded-lg hover:bg-slate-700 disabled:opacity-40"
                >
                  {creating ? "Creating…" : "Create User"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Users List Card ── */}
          <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-slate-500">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                All Users
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({users.length})
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Click delete to remove a user
              </p>
            </div>
            <div className="px-6 py-4">
              <StatusMessage msg={listMsg} />
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                  Loading users…
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">No users found.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <div
                      key={u.username}
                      className="flex items-center justify-between py-3 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 uppercase">
                          {u.username[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {u.username}
                            {u.username === user?.username && (
                              <span className="ml-2 text-xs text-slate-400">
                                (you)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${ROLE_BADGE[u.role] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
                        >
                          {u.role}
                        </span>
                        {u.username !== user?.username && (
                          <button
                            onClick={() => handleDelete(u.username)}
                            disabled={deletingUsername === u.username}
                            className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40"
                          >
                            {deletingUsername === u.username
                              ? "Deleting…"
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
