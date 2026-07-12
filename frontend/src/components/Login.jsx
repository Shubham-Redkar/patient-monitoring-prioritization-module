import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Activity, AlertCircle, Lock, LogIn, ShieldCheck, Stethoscope, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/");
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[minmax(360px,0.9fr)_minmax(520px,1.1fr)]">
    <section className="hidden flex-col justify-between bg-slate-900 p-10 text-white lg:flex xl:p-14">
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/10"><Activity className="h-6 w-6 text-cyan-300" /></span><div><p className="font-bold tracking-wide">SEPSIS COMMAND</p><p className="text-sm text-slate-400">Clinical monitoring system</p></div></div>
      <div className="max-w-lg"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Clinical decision support</p><h1 className="text-4xl font-bold leading-tight xl:text-5xl">Prioritized patient monitoring for timely clinical review.</h1><p className="mt-6 max-w-md text-base leading-7 text-slate-300">Review sepsis-risk assessments, active alerts, longitudinal observations, and documented clinical actions from one secure workspace.</p><div className="mt-8 grid gap-3 text-sm text-slate-300"><p className="flex items-center gap-3"><Stethoscope className="h-5 w-5 text-cyan-300" />Role-based clinical workflows</p><p className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-cyan-300" />Protected patient monitoring access</p></div></div>
      <p className="text-xs leading-5 text-slate-500">For authorized clinical and administrative personnel only. Access and activity may be monitored according to hospital policy.</p>
    </section>

    <section className="flex items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-7 lg:hidden"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Activity className="h-5 w-5 text-cyan-300" /></span><div><p className="font-bold tracking-wide text-slate-900">SEPSIS COMMAND</p><p className="text-sm text-slate-500">Clinical monitoring system</p></div></div></div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-6 py-6 sm:px-8"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secure system access</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Sign in to your workspace</h2><p className="mt-2 text-sm leading-5 text-slate-500">Use your hospital-issued account credentials.</p></header>

          <form onSubmit={submit} className="space-y-5 px-6 py-6 sm:px-8">
            {error && <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

            <label className="block"><span className="text-sm font-semibold text-slate-700">Username</span><span className="relative mt-2 block"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={username} onChange={(event) => { setUsername(event.target.value); setError(""); }} name="username" autoComplete="username" autoCapitalize="none" spellCheck="false" required autoFocus placeholder="Enter your username" className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200" /></span></label>

            <label className="block"><span className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">Password</span><Link to="/forgot-password" className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline">Forgot password?</Link></span><span className="relative mt-2 block"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} name="password" autoComplete="current-password" required placeholder="Enter your password" className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200" /></span></label>

            <button type="submit" disabled={loading || !username.trim() || !password} className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><LogIn className="h-4 w-4" />{loading ? "Verifying credentials…" : "Sign in securely"}</button>
          </form>

          <footer className="flex items-start gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs leading-5 text-slate-500 sm:px-8"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><p>Patient information is confidential. Sign out when leaving a shared workstation.</p></footer>
        </div>
      </div>
    </section>
  </main>;
}
