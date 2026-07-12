import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, ChevronRight, Eye, RefreshCw, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { patientApi } from "../api/client";
import AppShell from "../components/layout/AppShell";
import PriorityBadge from "../components/common/PriorityBadge";
import { DASHBOARD_CONCURRENCY, HISTORY_HOURS } from "../config/app";
import { PRIORITIES, PRIORITY_THEME, ROLES } from "../config/clinical";
import { useAuth } from "../context/AuthContext";

const PRIORITY_ORDER = Object.fromEntries(PRIORITIES.map((priority, index) => [priority, index]));

async function runInPool(items, task, size) {
  const queue = [...items];
  const worker = async () => {
    while (queue.length) await task(queue.shift());
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
}

function AlertState({ patient }) {
  if (patient.priority === "Loading") return <span className="text-slate-400">Assessing…</span>;
  if (!patient.alert) return <span className="text-slate-500">No active alert</span>;
  if (patient.acknowledged) return <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700"><CheckCircle className="h-4 w-4" />Acknowledged</span>;
  return <span className="inline-flex items-center gap-1.5 font-semibold text-red-700"><AlertTriangle className="h-4 w-4" />{patient.alertLevel === "CRITICAL" ? "Immediate review" : "Review required"}</span>;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { patient_ids: ids = [] } = await patientApi.list(token);
      setPatients(ids.map((id) => ({ id, priority: "Loading" })));
      await runInPool(ids, async (id) => {
        try {
          const result = await patientApi.prediction(token, id, HISTORY_HOURS);
          setPatients((current) => current.map((patient) => patient.id === id ? {
            id,
            priority: result.priority_level,
            alert: result.alert?.alert,
            acknowledged: result.alert?.acknowledged,
            alertLevel: result.alert?.level,
          } : patient));
        } catch { /* retain the patient row when an individual assessment fails */ }
      }, DASHBOARD_CONCURRENCY);
      setUpdatedAt(new Date());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const counts = useMemo(() => Object.fromEntries(
    PRIORITIES.map((priority) => [priority, patients.filter((patient) => patient.priority === priority).length]),
  ), [patients]);
  const sortedPatients = useMemo(() => [...patients].sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99) || Number(a.id) - Number(b.id),
  ), [patients]);
  const readOnly = user?.role === ROLES.NURSE;

  return <AppShell title="Patient Census" subtitle="Prioritized inpatient worklist for sepsis surveillance and clinical review">
    <section aria-label="Census summary" className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
      {PRIORITIES.map((priority) => {
        const theme = PRIORITY_THEME[priority];
        return <div key={priority} className={`rounded-lg border bg-white px-4 py-3 ${theme.border}`}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{priority}</p><p className="mt-1 text-2xl font-bold tabular-nums">{counts[priority] || 0}</p></div><span className={`h-3 w-3 rounded-full ${theme.bar}`} /></div></div>;
      })}
      <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Total census</p><p className="mt-1 text-2xl font-bold tabular-nums">{patients.length}</p></div><Users className="h-5 w-5 text-cyan-300" /></div></div>
    </section>

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold text-slate-900">Clinical review worklist</h2><p className="mt-1 text-sm text-slate-500">Ordered by clinical priority, then patient identifier</p></div>
        <div className="flex items-center justify-between gap-4 sm:justify-end"><span className="text-xs text-slate-500">{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Not yet updated"}</span><button onClick={loadPatients} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
      </header>
      {error && <p className="m-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && patients.length === 0 ? <div className="p-12 text-center"><Users className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">No patients available</p><p className="mt-1 text-sm text-slate-500">Import monitoring data to populate the clinical worklist.</p></div> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Patient</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Alert status</th><th className="px-5 py-3">Access</th><th className="w-16 px-5 py-3"><span className="sr-only">Open</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">{sortedPatients.map((patient) => <tr key={patient.id} className="group hover:bg-slate-50"><td className="px-5 py-4"><p className="font-mono text-base font-bold text-slate-900">{patient.id}</p><p className="mt-0.5 text-xs text-slate-500">Inpatient monitoring record</p></td><td className="px-5 py-4"><PriorityBadge level={patient.priority} /></td><td className="px-5 py-4 text-sm"><AlertState patient={patient} /></td><td className="px-5 py-4 text-sm text-slate-600">{readOnly ? <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" />Overview only</span> : "Full clinical review"}</td><td className="px-5 py-4 text-right">{!readOnly && <button onClick={() => navigate(`/patient/${patient.id}`)} aria-label={`Open patient ${patient.id}`} className="rounded-md border border-slate-300 p-2 text-slate-600 group-hover:border-slate-400 group-hover:bg-white"><ChevronRight className="h-4 w-4" /></button>}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  </AppShell>;
}
