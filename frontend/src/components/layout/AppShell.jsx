import { Activity, ArrowLeft, Clock, Database, LayoutDashboard, LogOut, Settings, Users, Wifi } from "lucide-react";
import { createElement, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES, ROLE_THEME } from "../../config/clinical";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE] },
  { label: "Data", path: "/data", icon: Database, roles: [ROLES.ADMIN, ROLES.NURSE] },
  { label: "Users", path: "/users", icon: Users, roles: [ROLES.ADMIN] },
  { label: "Account", path: "/account", icon: Settings, roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE] },
];

export default function AppShell({ title, subtitle, children, backTo }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-700 bg-slate-900 text-white shadow-sm">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <button onClick={() => navigate("/")} className="flex min-w-0 items-center gap-3 text-left md:justify-self-start">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/30">
              <Activity className="h-5 w-5 text-cyan-300" />
            </span>
            <span><strong className="block text-sm tracking-wide">SEPSIS COMMAND</strong><span className="block text-xs text-slate-400">Clinical monitoring system</span></span>
          </button>
          <nav className="hidden items-center justify-center gap-1 rounded-lg border border-slate-700/70 bg-slate-800/60 p-1 md:flex md:justify-self-center">
            {navigation.filter((item) => item.roles.includes(user?.role)).map(({ label, path, icon }) => (
              <button key={path} onClick={() => navigate(path)} className={`flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium ${location.pathname === path ? "bg-white text-slate-900 shadow-sm" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}>
                {createElement(icon, { className: "h-4 w-4" })}{label}
              </button>
            ))}
          </nav>
          <div className="flex min-w-0 items-center justify-end gap-3 md:justify-self-end">
            <div className="hidden items-center gap-2 rounded-md border border-emerald-700/50 bg-emerald-950/40 px-3 py-1.5 lg:flex">
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-semibold text-emerald-300">Live monitoring</span>
            </div>
            <div className="hidden min-w-[92px] items-center gap-2 border-l border-slate-700 pl-3 font-mono text-sm tabular-nums text-slate-200 sm:flex">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="hidden border-l border-slate-700 pl-3 text-right sm:block"><p className="max-w-40 truncate text-sm font-medium">{user?.full_name || user?.username}</p><span className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${ROLE_THEME[user?.role] || "border-slate-600 text-slate-300"}`}>{user?.role}</span></div>
            <button onClick={logout} aria-label="Sign out" className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto border-t border-slate-800 px-4 py-2 md:hidden">
          {navigation.filter((item) => item.roles.includes(user?.role)).map(({ label, path, icon }) => (
            <button key={path} onClick={() => navigate(path)} className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm ${location.pathname === path ? "bg-slate-700 text-white" : "text-slate-300"}`}>
              {createElement(icon, { className: "h-4 w-4" })}{label}
            </button>
          ))}
        </nav>
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-xs sm:hidden">
          <span className="inline-flex items-center gap-2 font-medium text-emerald-300"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>Live monitoring</span>
          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-slate-300"><Clock className="h-3.5 w-3.5" />{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
        </div>
      </header>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-5 sm:px-6">
          {backTo && <button onClick={() => navigate(backTo)} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></button>}
          <div className="min-w-0"><h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{title}</h1>{subtitle && <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">{subtitle}</p>}</div>
        </div>
      </div>
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
