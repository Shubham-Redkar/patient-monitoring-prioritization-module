import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Trash2, UserPlus, Users } from "lucide-react";
import { userApi } from "../api/client";
import StatusMessage from "../components/common/StatusMessage";
import AppShell from "../components/layout/AppShell";
import { ROLE_THEME, ROLES } from "../config/clinical";
import { useAuth } from "../context/AuthContext";

const emptyForm = { username: "", email: "", password: "", role: ROLES.NURSE, full_name: "" };

export default function UserManagement() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setBusy("load");
    try { setUsers((await userApi.list(token)).users || []); setStatus(null); }
    catch (error) { setStatus({ type: "error", text: error.message }); }
    finally { setBusy(""); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const create = async (event) => {
    event.preventDefault(); setBusy("create"); setStatus(null);
    try {
      await userApi.create(token, form);
      setForm(emptyForm);
      await load();
      setStatus({ type: "success", text: "User account created successfully." });
    }
    catch (error) { setStatus({ type: "error", text: error.message }); }
    finally { setBusy(""); }
  };
  const remove = async (username) => {
    if (!window.confirm(`Delete user ${username}?`)) return;
    setBusy(username);
    try { await userApi.remove(token, username); setUsers((items) => items.filter((item) => item.username !== username)); }
    catch (error) { setStatus({ type: "error", text: error.message }); }
    finally { setBusy(""); }
  };

  return <AppShell title="Access Administration" subtitle="Manage authorized clinical and administrative users">
    <StatusMessage message={status} className="mb-5" />
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white"><header className="border-b border-slate-200 p-5"><h2 className="flex items-center gap-2 font-semibold"><UserPlus className="h-4 w-4 text-cyan-700" />Create account</h2></header><form onSubmit={create} className="space-y-4 p-5">{[["full_name","Full name","Dr. Sarah Smith"],["username","Username","dr_smith"],["email","Verified email","sarah.smith@hospital.org"],["password","Temporary password","Minimum 8 characters"]].map(([field,label,placeholder]) => <label key={field} className="block text-sm font-medium text-slate-700">{label}<input type={field === "password" ? "password" : field === "email" ? "email" : "text"} value={form[field]} onChange={update(field)} placeholder={placeholder} required={field !== "full_name"} className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2" /></label>)}<label className="block text-sm font-medium text-slate-700">Role<select value={form.role} onChange={update("role")} className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value={ROLES.NURSE}>Nurse</option><option value={ROLES.DOCTOR}>Doctor</option><option value={ROLES.ADMIN}>Administrator</option></select></label><button disabled={busy === "create" || !form.username || !form.email || !form.password} className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy === "create" ? "Creating…" : "Create account"}</button></form></section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><header className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4" />Authorized users</h2><p className="text-sm text-slate-500">{users.length} active accounts</p></div><button onClick={load} className="rounded-md border border-slate-300 p-2"><RefreshCw className={`h-4 w-4 ${busy === "load" ? "animate-spin" : ""}`} /></button></header><div className="divide-y divide-slate-100">{users.map((item) => <div key={item.username} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium">{item.full_name || item.username}{item.username === user?.username && <span className="ml-2 text-xs text-slate-400">You</span>}</p><p className="text-sm text-slate-500">@{item.username}{item.email ? ` · ${item.email}` : " · Email not configured"}</p></div><div className="flex items-center gap-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_THEME[item.role]}`}>{item.role}</span>{item.username !== user?.username && <button onClick={() => remove(item.username)} disabled={busy === item.username} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}</div></div>)}{!users.length && busy !== "load" && <p className="p-8 text-center text-sm text-slate-500">No users found.</p>}</div></section>
    </div>
  </AppShell>;
}
