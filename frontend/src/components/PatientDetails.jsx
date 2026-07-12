import { useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Brain, CheckCircle, FlaskConical, HeartPulse, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { patientApi } from "../api/client";
import AppShell from "./layout/AppShell";
import PriorityBadge from "./common/PriorityBadge";
import StatusMessage from "./common/StatusMessage";
import { HISTORY_HOURS } from "../config/app";
import { ROLES } from "../config/clinical";
import { useAuth } from "../context/AuthContext";
import { LAB_KEYS } from "../data/labData";
import { VITAL_KEYS } from "../data/vitalData";
import ClinicalSignals from "../features/patients/ClinicalSignals";
import TrendChart from "../features/patients/TrendChart";
import { usePatientMonitoring } from "../features/patients/usePatientMonitoring";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function MetricCard({ label, value, detail, tone = "text-slate-900" }) {
  return <div className="rounded-lg border border-slate-200 bg-white px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold leading-none tabular-nums ${tone}`}>{value}</p>{detail && <p className="mt-2 text-sm leading-5 text-slate-500">{detail}</p>}</div>;
}

function AlertPanel({ alert, canAcknowledge, busy, onAcknowledge }) {
  if (!alert?.alert) return null;
  if (alert.acknowledged) return <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800"><CheckCircle className="h-5 w-5" /><div><p className="font-semibold">Alert acknowledged</p><p className="text-sm">Reviewed by {alert.acknowledged_by || "clinical staff"}</p></div></div>;
  const critical = alert.level === "CRITICAL";
  return <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${critical ? "border-red-400 bg-red-50 text-red-900" : "border-orange-300 bg-orange-50 text-orange-900"}`}><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" /><div><p className="font-bold">{critical ? "Critical escalation" : "High-risk alert"}</p><p className="text-sm">{alert.message}</p></div></div>{canAcknowledge && <button onClick={onAcknowledge} disabled={busy} className="rounded-md border border-current px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "Acknowledging…" : "Acknowledge"}</button>}</div>;
}

function OverridePanel({ current, busy, message, onSave, onClear }) {
  const [priority, setPriority] = useState("Critical");
  const [reason, setReason] = useState("");
  const submit = () => { onSave({ priority, reason }); if (reason.trim()) setReason(""); };
  return <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4" />Clinical priority override</h3><p className="mt-1 text-sm text-slate-500">Document a physician decision that supersedes the calculated priority.</p></div>{current && <button onClick={onClear} className="text-sm font-medium text-red-700">Clear override</button>}</div>{current && <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>{current.priority}</strong> set by {current.set_by}<br /><span className="text-amber-700">{current.reason}</span></div>}<div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]"><select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2"><option>Critical</option><option>High</option><option>Normal</option></select><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Clinical reason (required)" className="rounded-md border border-slate-300 px-3 py-2" /><button onClick={submit} disabled={busy || !reason.trim()} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Saving…" : "Save"}</button></div><StatusMessage message={message} className="mt-3" /></section>;
}

export default function PatientDetails() {
  const { patientId } = useParams();
  const { user, token } = useAuth();
  const monitor = usePatientMonitoring(patientId, token);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const prediction = monitor.prediction;
  const probability = prediction?.lab_risk_probability == null ? null : Math.round(prediction.lab_risk_probability * 100);
  const vitals = (monitor.history?.vitals || []).filter((reading) => reading.hour <= monitor.hour);
  const labs = (monitor.history?.labs || []).filter((reading) => reading.hour <= monitor.hour);

  const runAction = async (action, success) => {
    setActionBusy(true); setActionMessage(null);
    try { await action(); await monitor.refresh(); setActionMessage({ type: "success", text: success }); }
    catch (error) { setActionMessage({ type: "error", text: error.message }); }
    finally { setActionBusy(false); }
  };

  return <AppShell title={`Patient ${patientId}`} subtitle="Sepsis surveillance record · Review alerts, current assessment, trends, and clinical rationale" backTo="/">
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient identifier</p><p className="mt-1 font-mono text-xl font-bold">{patientId}</p></div>
          <div className="px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assessment point</p><p className="mt-1 text-base font-semibold">Hour {monitor.hour} after admission</p></div>
          <div className="px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last synchronized</p><p className="mt-1 text-base font-semibold">{monitor.updatedAt ? monitor.updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Waiting for data"}</p></div>
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
          <div className="min-w-44"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current priority</p><div className="mt-2"><PriorityBadge level={prediction?.priority_level || "Loading"} manual={!!monitor.meta} /></div></div>
          <div className="min-w-64 flex-1"><div className="mb-2 flex justify-between text-xs font-medium text-slate-600"><span>Review historical assessment</span><span>{monitor.hour} of {HISTORY_HOURS} hours</span></div><input aria-label="Hour from admission" type="range" min="0" max={HISTORY_HOURS} value={monitor.hour} onChange={(event) => monitor.selectHour(event.target.value)} className="w-full accent-cyan-700" /><div className="flex justify-between text-[11px] text-slate-400"><span>Admission</span><span>{HISTORY_HOURS / 2}h</span><span>{HISTORY_HOURS}h</span></div></div>
          <button onClick={monitor.refresh} className="flex items-center justify-center gap-2 self-start rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium sm:self-center"><RefreshCw className={`h-4 w-4 ${monitor.loading ? "animate-spin" : ""}`} />Refresh record</button>
        </div>
      </section>

      {monitor.error && <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><XCircle className="h-4 w-4" />{monitor.error}</div>}
      <AlertPanel alert={prediction?.alert} canAcknowledge={user?.role !== ROLES.ADMIN} busy={actionBusy} onAcknowledge={() => runAction(() => patientApi.acknowledge(token, patientId), "Alert acknowledged.")} />

      <section aria-labelledby="assessment-heading"><div className="mb-3"><h2 id="assessment-heading" className="text-base font-semibold text-slate-900">Current clinical assessment</h2><p className="mt-0.5 text-sm text-slate-500">Calculated at hour {monitor.hour} using available patient observations</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Lab risk" value={probability == null ? "—" : `${probability}%`} detail={probability == null ? "No lab data" : prediction?.lab_risk_label ? "High-risk classification" : "Low-risk classification"} tone={probability >= 70 ? "text-red-700" : probability >= 40 ? "text-orange-600" : "text-emerald-700"} />
        <MetricCard label="Vital status" value={prediction?.vital_anomaly_flag ? "Anomaly" : prediction ? "Stable" : "—"} detail={prediction?.sustained_instability ? "Sustained instability" : "No sustained instability"} tone={prediction?.vital_anomaly_flag ? "text-red-700" : "text-emerald-700"} />
        <MetricCard label="Vital samples" value={vitals.length} detail={`Through hour ${monitor.hour}`} />
        <MetricCard label="Lab samples" value={labs.length} detail={`Through hour ${monitor.hour}`} />
      </div></section>

      {prediction?.explanation && <section className="rounded-xl border border-cyan-200 bg-white p-5"><h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Brain className="h-5 w-5 text-cyan-700" />Clinical reasoning</h2><p className="mt-1 text-sm text-slate-500">Why the current priority was assigned</p><p className="mt-4 max-w-5xl leading-7 text-slate-700">{prediction.explanation}</p><p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">Decision support only — confirm findings using clinical judgment and hospital escalation protocol.</p></section>}

      {user?.role === ROLES.DOCTOR && <OverridePanel current={monitor.meta} busy={actionBusy} message={actionMessage} onSave={(body) => runAction(() => patientApi.override(token, patientId, body), "Override saved.")} onClear={() => runAction(() => patientApi.clearOverride(token, patientId), "Override cleared.")} />}

      <section aria-labelledby="trends-heading"><div className="mb-3"><h2 id="trends-heading" className="text-base font-semibold text-slate-900">Longitudinal observations</h2><p className="mt-0.5 text-sm text-slate-500">Vital-sign and laboratory changes from admission through the selected assessment hour</p></div><div className="grid gap-5 xl:grid-cols-2"><TrendChart title="Vital-sign trends" subtitle={`Admission through hour ${monitor.hour}`} icon={HeartPulse} readings={vitals} fields={VITAL_KEYS} /><TrendChart title="Laboratory trends" subtitle={`Admission through hour ${monitor.hour}`} icon={FlaskConical} readings={labs} fields={LAB_KEYS} /></div></section>
      <ClinicalSignals signals={prediction?.signals} />
    </div>
  </AppShell>;
}
