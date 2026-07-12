import { useState } from "react";
import { Activity, Lock } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../api/client";
import StatusMessage from "../components/common/StatusMessage";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(token ? null : { type: "error", text: "This reset link is incomplete." });
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirm) { setStatus({ type: "error", text: "Passwords do not match." }); return; }
    setBusy(true); setStatus(null);
    try { const result = await authApi.resetPassword(token, password); setStatus({ type: "success", text: result.message }); setComplete(true); }
    catch (error) { setStatus({ type: "error", text: error.message }); }
    finally { setBusy(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10"><div className="w-full max-w-md"><div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Activity className="h-5 w-5 text-cyan-300" /></span><div><p className="font-bold">SEPSIS COMMAND</p><p className="text-sm text-slate-500">Secure password reset</p></div></div><section className="rounded-xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-200 p-6"><h1 className="text-2xl font-bold">Choose a new password</h1><p className="mt-2 text-sm text-slate-500">The reset link is single-use and expires automatically.</p></header><form onSubmit={submit} className="space-y-4 p-6"><StatusMessage message={status} />{!complete && <>{[[password,setPassword,"New password"],[confirm,setConfirm,"Confirm password"]].map(([value,setValue,label]) => <label key={label} className="block text-sm font-semibold text-slate-700">{label}<span className="relative mt-2 block"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="password" value={value} onChange={(event) => setValue(event.target.value)} autoComplete="new-password" minLength="8" required className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 font-normal" /></span></label>)}<button disabled={busy || !token} className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Resetting…" : "Reset password"}</button></>}{complete && <Link to="/login" className="block w-full rounded-md bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white">Continue to sign in</Link>}</form></section></div></main>;
}
