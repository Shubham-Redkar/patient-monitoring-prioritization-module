import { useState } from "react";
import { Activity, ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { authApi } from "../api/client";
import StatusMessage from "../components/common/StatusMessage";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setStatus(null);
    try { const result = await authApi.forgotPassword(email); setStatus({ type: "success", text: result.message }); }
    catch (error) { setStatus({ type: "error", text: error.message }); }
    finally { setBusy(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10"><div className="w-full max-w-md"><div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Activity className="h-5 w-5 text-cyan-300" /></span><div><p className="font-bold">SEPSIS COMMAND</p><p className="text-sm text-slate-500">Account recovery</p></div></div><section className="rounded-xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-200 p-6"><h1 className="text-2xl font-bold">Reset your password</h1><p className="mt-2 text-sm leading-5 text-slate-500">Enter the verified email associated with your hospital account.</p></header><form onSubmit={submit} className="space-y-5 p-6"><StatusMessage message={status} /><label className="block text-sm font-semibold text-slate-700">Email address<span className="relative mt-2 block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 font-normal" /></span></label><button disabled={busy} className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Sending…" : "Send reset link"}</button><Link to="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600"><ArrowLeft className="h-4 w-4" />Return to sign in</Link></form></section></div></main>;
}
