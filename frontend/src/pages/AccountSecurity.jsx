import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { authApi } from "../api/client";
import StatusMessage from "../components/common/StatusMessage";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";

export default function AccountSecurity() {
  const { user, token, logout } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (form.next !== form.confirm) { setStatus({ type: "error", text: "New passwords do not match." }); return; }
    setBusy(true); setStatus(null);
    try {
      await authApi.changePassword(token, { current_password: form.current, new_password: form.next });
      setStatus({ type: "success", text: "Password changed. Redirecting to sign in…" });
      window.setTimeout(logout, 1200);
    } catch (error) { setStatus({ type: "error", text: error.message }); }
    finally { setBusy(false); }
  };
  return <AppShell title="Account Security" subtitle="Manage your identity and hospital system credentials">
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-cyan-700" />Account identity</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt><dd className="mt-1 font-medium">{user?.full_name || "Not provided"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</dt><dd className="mt-1 font-mono font-medium">{user?.username}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt><dd className="mt-1 break-all font-medium">{user?.email || "Contact an administrator to add email"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</dt><dd className="mt-1 capitalize">{user?.role}</dd></div></dl></section>
      <section className="max-w-2xl rounded-xl border border-slate-200 bg-white"><header className="border-b border-slate-200 p-5"><h2 className="flex items-center gap-2 font-semibold"><Lock className="h-5 w-5" />Change password</h2><p className="mt-1 text-sm text-slate-500">Changing your password signs you out on every device.</p></header><form onSubmit={submit} className="space-y-4 p-5"><StatusMessage message={status} />{[["current","Current password","current-password"],["next","New password","new-password"],["confirm","Confirm new password","new-password"]].map(([field, label, autocomplete]) => <label key={field} className="block max-w-lg text-sm font-semibold text-slate-700">{label}<input type="password" value={form[field]} onChange={update(field)} autoComplete={autocomplete} minLength={field === "current" ? undefined : 8} required className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 font-normal" /></label>)}<p className="text-xs leading-5 text-slate-500">Use at least 8 characters. Do not reuse a password from another system.</p><button disabled={busy} className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Changing password…" : "Change password"}</button></form></section>
    </div>
  </AppShell>;
}
