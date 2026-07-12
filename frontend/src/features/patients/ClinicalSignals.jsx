import { FlaskConical, HeartPulse } from "lucide-react";
import { createElement } from "react";

function SignalList({ title, icon, values }) {
  return <div className="p-4"><h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{createElement(icon, { className: "h-4 w-4" })}{title}</h4>{values.length ? <ul className="space-y-2">{values.map((value) => <li key={value} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{value}</li>)}</ul> : <p className="text-sm text-slate-400">No significant signals</p>}</div>;
}

export default function ClinicalSignals({ signals }) {
  if (!signals || !(signals.lab?.length || signals.vitals?.length)) return null;
  return <section className="rounded-xl border border-slate-200 bg-white"><header className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold">Contributing clinical signals</h3><p className="text-xs text-slate-500">Highest-impact values associated with the current assessment</p></header><div className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0"><SignalList title="Laboratory" icon={FlaskConical} values={signals.lab || []} /><SignalList title="Vitals" icon={HeartPulse} values={signals.vitals || []} /></div></section>;
}
