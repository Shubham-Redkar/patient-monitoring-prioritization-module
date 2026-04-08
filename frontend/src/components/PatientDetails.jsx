// import { useState, useEffect, useRef, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// } from "chart.js";
// import annotationPlugin from "chartjs-plugin-annotation";
// import { Line } from "react-chartjs-2";
// import { VITAL_KEYS } from "../data/vitalData";
// import { LAB_KEYS } from "../data/labData";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
//   annotationPlugin,
// );

// const BASE = "http://localhost:8000/api/v1";

// const LAB_RISK_LABEL_MAP = { 0: "Low Risk", 1: "High Risk" };

// const PRIORITY_COLORS = {
//   Critical: {
//     bg: "bg-red-100",
//     text: "text-red-800",
//     border: "border-red-400",
//     dot: "bg-red-600",
//   },
//   High: {
//     bg: "bg-orange-100",
//     text: "text-orange-800",
//     border: "border-orange-400",
//     dot: "bg-orange-500",
//   },
//   // ── Fix: Medium was missing, fell back to green Normal ──────────────────
//   Medium: {
//     bg: "bg-yellow-100",
//     text: "text-yellow-800",
//     border: "border-yellow-400",
//     dot: "bg-yellow-500",
//   },
//   Normal: {
//     bg: "bg-green-100",
//     text: "text-green-800",
//     border: "border-green-400",
//     dot: "bg-green-600",
//   },
//   Loading: {
//     bg: "bg-gray-100",
//     text: "text-gray-600",
//     border: "border-gray-300",
//     dot: "bg-gray-400",
//   },
// };

// // ── Vital Status card border driven by sustained_instability ────────────────
// // sustained_instability=1 → orange ring; anomaly only → red ring; clean → green
// function vitalCardBorder(anomalyFlag, sustainedInstability) {
//   if (sustainedInstability) return "border-orange-300 ring-1 ring-orange-200";
//   if (anomalyFlag) return "border-red-300";
//   return "border-slate-200";
// }

// function PriorityBadge({ level, isOverride }) {
//   const c = PRIORITY_COLORS[level] || PRIORITY_COLORS.Normal;
//   return (
//     <span
//       className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${c.bg} ${c.text} ${c.border}`}
//     >
//       <span className={`w-2 h-2 rounded-full ${c.dot}`} />
//       {level}
//       {isOverride && (
//         <span className="ml-1 text-xs font-bold tracking-wide opacity-75">
//           [MANUAL]
//         </span>
//       )}
//     </span>
//   );
// }

// // ── Parse SHAP signal string from backend ───────────────────────────────────
// // Format: "lactate: 3.20 mmol/L [HIGH, normal: < 2] (SHAP ↑0.412)"
// function parseSignal(str) {
//   const nameMatch = str.match(/^([^:]+):/);
//   const statusMatch = str.match(/\[(HIGH|LOW|NORMAL)/);
//   const shapMatch = str.match(/([↑↓])([\d.]+)\)/);
//   return {
//     raw: str,
//     name: nameMatch ? nameMatch[1].replace(/_/g, " ") : str,
//     status: statusMatch ? statusMatch[1] : "NORMAL",
//     direction: shapMatch ? shapMatch[1] : "",
//     shap: shapMatch ? parseFloat(shapMatch[2]) : 0,
//   };
// }

// const STATUS_STYLE = {
//   HIGH: "bg-red-50 text-red-700 border-red-200",
//   LOW: "bg-blue-50 text-blue-700 border-blue-200",
//   NORMAL: "bg-green-50 text-green-700 border-green-200",
// };

// // ── Signals card: renders top lab + vital contributing factors ───────────────
// // Uses the signals object returned on every /predict response (was previously ignored)
// function SignalsCard({ signals }) {
//   if (!signals) return null;

//   const labSignals = (signals.lab || []).map(parseSignal);
//   const vitalSignals = (signals.vitals || []).map(parseSignal);

//   if (labSignals.length === 0 && vitalSignals.length === 0) return null;

//   return (
//     <div className="bg-white border border-slate-200 rounded-xl mb-5 overflow-hidden">
//       <div className="px-5 py-4 border-b border-slate-100">
//         <p className="text-sm font-semibold text-slate-800">
//           Top Contributing Factors
//         </p>
//         <p className="text-xs text-slate-400 mt-0.5">
//           Key clinical findings influencing this risk assessment
//         </p>
//       </div>
//       <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
//         {/* Lab signals */}
//         <div className="px-5 py-4">
//           <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
//             Lab
//           </p>
//           {labSignals.length === 0 ? (
//             <p className="text-sm text-slate-400">No lab data</p>
//           ) : (
//             <div className="space-y-2">
//               {labSignals.map((s, i) => (
//                 <div
//                   key={i}
//                   className="flex items-center justify-between gap-3"
//                 >
//                   <span className="text-sm text-slate-700 capitalize">
//                     {s.name}
//                   </span>
//                   <div className="flex items-center gap-2 shrink-0">
//                     <span
//                       className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[s.status] ?? STATUS_STYLE.NORMAL}`}
//                     >
//                       {s.status}
//                     </span>
//                     <span
//                       className={`text-xs font-semibold px-1.5 py-0.5 rounded ${s.direction === "↑" ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"}`}
//                       title={
//                         s.direction === "↑"
//                           ? "Increases risk"
//                           : "Decreases risk"
//                       }
//                     >
//                       {s.direction === "↑" ? "↑ Raises Risk" : "↓ Lowers Risk"}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Vital signals */}
//         <div className="px-5 py-4">
//           <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
//             Vitals
//           </p>
//           {vitalSignals.length === 0 ? (
//             <p className="text-sm text-slate-400">No vital data</p>
//           ) : (
//             <div className="space-y-2">
//               {vitalSignals.map((s, i) => (
//                 <div
//                   key={i}
//                   className="flex items-center justify-between gap-3"
//                 >
//                   <span className="text-sm text-slate-700 capitalize">
//                     {s.name}
//                   </span>
//                   <div className="flex items-center gap-2 shrink-0">
//                     <span
//                       className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[s.status] ?? STATUS_STYLE.NORMAL}`}
//                     >
//                       {s.status}
//                     </span>
//                     <span
//                       className={`text-xs font-semibold px-1.5 py-0.5 rounded ${s.direction === "↑" ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"}`}
//                       title={
//                         s.direction === "↑"
//                           ? "Increases risk"
//                           : "Decreases risk"
//                       }
//                     >
//                       {s.direction === "↑" ? "↑ Raises Risk" : "↓ Lowers Risk"}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Chart options with annotation plugin: vertical line at current hour ──────
// // annotationPlugin was registered but never configured — now draws "current time" marker
// function buildChartOptions(currentHourLabel) {
//   return {
//     responsive: true,
//     maintainAspectRatio: false,
//     interaction: { mode: "index", intersect: false },
//     plugins: {
//       legend: {
//         position: "bottom",
//         labels: {
//           font: { size: 11, family: "system-ui" },
//           padding: 14,
//           boxWidth: 24,
//           boxHeight: 2,
//           usePointStyle: true,
//           pointStyle: "line",
//         },
//       },
//       tooltip: {
//         backgroundColor: "rgba(15, 23, 42, 0.92)",
//         titleFont: { size: 12, weight: "600" },
//         bodyFont: { size: 11 },
//         padding: 10,
//         cornerRadius: 8,
//         borderColor: "rgba(255,255,255,0.08)",
//         borderWidth: 1,
//       },
//       // ── Annotation: vertical dashed line at the rightmost (current) data point
//       annotation: {
//         annotations: currentHourLabel
//           ? {
//               currentHour: {
//                 type: "line",
//                 scaleID: "x",
//                 value: currentHourLabel,
//                 borderColor: "rgba(100, 116, 139, 0.6)",
//                 borderWidth: 1.5,
//                 borderDash: [4, 3],
//                 label: {
//                   display: true,
//                   content: currentHourLabel,
//                   position: "start",
//                   backgroundColor: "rgba(100, 116, 139, 0.85)",
//                   color: "#fff",
//                   font: { size: 10, weight: "600" },
//                   padding: { x: 5, y: 3 },
//                   borderRadius: 4,
//                 },
//               },
//             }
//           : {},
//       },
//     },
//     scales: {
//       x: {
//         grid: { color: "rgba(148,163,184,0.12)", drawBorder: false },
//         ticks: { font: { size: 10 }, color: "#94a3b8", maxTicksLimit: 9 },
//         border: { display: false },
//       },
//       y: {
//         grid: { color: "rgba(148,163,184,0.12)", drawBorder: false },
//         ticks: { font: { size: 10 }, color: "#94a3b8", padding: 6 },
//         border: { display: false },
//       },
//     },
//   };
// }

// function makeDataset(key, data) {
//   return {
//     label: key.label,
//     data,
//     borderColor: key.color,
//     backgroundColor: key.color + "15",
//     tension: 0.4,
//     pointRadius: 2.5,
//     pointHoverRadius: 5,
//     pointBackgroundColor: key.color,
//     pointBorderColor: "#fff",
//     pointBorderWidth: 1.5,
//     borderWidth: 2,
//     fill: false,
//   };
// }

// export default function PatientDetails() {
//   const { patientId } = useParams();
//   const { user, logout, token } = useAuth();
//   const navigate = useNavigate();

//   const [hour, setHour] = useState(0);
//   const [history, setHistory] = useState(null);
//   const [prediction, setPrediction] = useState(null);
//   const [explanation, setExplanation] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [chartLoading, setChartLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const [override, setOverride] = useState(null);
//   const [overrideForm, setOverrideForm] = useState({
//     priority: "Critical",
//     reason: "",
//   });
//   const [overrideOpen, setOverrideOpen] = useState(false);
//   const [overrideSaving, setOverrideSaving] = useState(false);
//   const [overrideMsg, setOverrideMsg] = useState(null);

//   const prevPriorityRef = useRef(null);
//   const prevMaxHourRef = useRef(null); // tracks highest hour seen, to detect new uploads
//   const debounceRef = useRef(null);
//   const hourRef = useRef(0);

//   const [now, setNow] = useState(new Date());
//   useEffect(() => {
//     const t = setInterval(() => setNow(new Date()), 1000);
//     return () => clearInterval(t);
//   }, []);

//   useEffect(() => {
//     hourRef.current = hour;
//   }, [hour]);

//   const fetchMeta = useCallback(
//     async (pid) => {
//       if (!token) return;
//       try {
//         const res = await fetch(`${BASE}/patients/${pid}/meta`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!res.ok) return;
//         const data = await res.json();
//         setOverride(data.manual_override || null);
//       } catch {
//         /* ignore */
//       }
//     },
//     [token],
//   );

//   const fetchHistory = useCallback(
//     async (pid) => {
//       setChartLoading(true);
//       try {
//         // FIX: history endpoint now requires auth — was missing Authorization header
//         const res = await fetch(
//           `${BASE}/patients/${pid}/history?from_hour=0&to_hour=72`,
//           { headers: { Authorization: `Bearer ${token}` } },
//         );
//         if (!res.ok) throw new Error();
//         setHistory(await res.json());
//       } catch {
//         setHistory(null);
//       } finally {
//         setChartLoading(false);
//       }
//     },
//     [token],
//   );

//   const fetchPrediction = useCallback(
//     async (pid, h) => {
//       setLoading(true);
//       setError(null);
//       try {
//         // FIX: predict endpoint now requires auth — was missing Authorization header
//         const res = await fetch(`${BASE}/patients/${pid}/predict?hour=${h}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!res.ok) {
//           const e = await res.json();
//           throw new Error(e.detail || res.status);
//         }
//         const data = await res.json();
//         setPrediction(data);
//         // Update explanation only on first load (ref is null) or when priority changes.
//         // Regenerating on every 10-second poll caused it to flicker with slightly
//         // different wording each time the LLM was called — this keeps it stable.
//         if (
//           prevPriorityRef.current === null ||
//           data.priority_level !== prevPriorityRef.current
//         ) {
//           prevPriorityRef.current = data.priority_level;
//           setExplanation(data.explanation);
//         }
//       } catch (e) {
//         setError(e.message);
//         setPrediction(null);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [token],
//   );

//   useEffect(() => {
//     if (!patientId) return;
//     fetchMeta(patientId);
//     Promise.all([fetchHistory(patientId), fetchPrediction(patientId, 0)]);
//   }, [patientId, fetchMeta, fetchHistory, fetchPrediction]);

//   // ── Poll: refresh prediction AND history if new data has arrived ──────────
//   // Previously only fetchPrediction was called; history never refreshed during session.
//   // Now we compare the max hour seen — if it grew, new readings were uploaded, so
//   // we also refresh history so charts stay current.
//   useEffect(() => {
//     if (!patientId) return;
//     const interval = setInterval(async () => {
//       await fetchPrediction(patientId, hourRef.current);
//       // Peek at latest history to detect new upload without a full refetch
//       try {
//         const res = await fetch(
//           `${BASE}/patients/${patientId}/history?from_hour=0&to_hour=72`,
//           { headers: { Authorization: `Bearer ${token}` } },
//         );
//         if (!res.ok) return;
//         const data = await res.json();
//         const maxHour = data.vitals?.at(-1)?.hour ?? null;
//         if (maxHour !== null && maxHour !== prevMaxHourRef.current) {
//           prevMaxHourRef.current = maxHour;
//           setHistory(data); // new data uploaded — update charts
//         }
//       } catch {
//         /* ignore */
//       }
//     }, 10000);
//     return () => clearInterval(interval);
//   }, [patientId, fetchPrediction, token]);

//   useEffect(() => {
//     return () => clearTimeout(debounceRef.current);
//   }, []);

//   const onSliderChange = (e) => {
//     const h = +e.target.value;
//     setHour(h);
//     clearTimeout(debounceRef.current);
//     debounceRef.current = setTimeout(() => {
//       fetchPrediction(patientId, h);
//     }, 300);
//   };

//   // Slice history to current slider hour
//   const slicedVitals = history?.vitals
//     ? history.vitals.filter((r) => r.hour <= hour)
//     : null;
//   const slicedLabs = history?.labs
//     ? history.labs.filter((r) => r.hour <= hour)
//     : null;

//   // Label of the rightmost data point — used by annotationPlugin for the vertical line
//   const vitalCurrentLabel = slicedVitals?.at(-1)
//     ? `${slicedVitals.at(-1).hour}h`
//     : null;
//   const labCurrentLabel = slicedLabs?.at(-1)
//     ? `${slicedLabs.at(-1).hour}h`
//     : null;

//   const handleSaveOverride = async () => {
//     if (!overrideForm.reason.trim()) {
//       setOverrideMsg({ type: "error", text: "Please provide a reason." });
//       return;
//     }
//     setOverrideSaving(true);
//     setOverrideMsg(null);
//     try {
//       const res = await fetch(
//         `${BASE}/patients/${patientId}/override_priority`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(overrideForm),
//         },
//       );
//       if (!res.ok) {
//         const e = await res.json();
//         throw new Error(e.detail || "Failed to save override");
//       }
//       await fetchMeta(patientId);
//       await fetchPrediction(patientId, hourRef.current);
//       setOverrideMsg({ type: "success", text: "Override saved." });
//       setOverrideOpen(false);
//       setOverrideForm({ priority: "Critical", reason: "" });
//     } catch (e) {
//       setOverrideMsg({ type: "error", text: e.message });
//     } finally {
//       setOverrideSaving(false);
//     }
//   };

//   const handleClearOverride = async () => {
//     if (
//       !window.confirm("Clear the manual override? AI prediction will resume.")
//     )
//       return;
//     try {
//       await fetch(`${BASE}/patients/${patientId}/override_priority`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setOverride(null);
//       setOverrideMsg(null);
//       await fetchPrediction(patientId, hourRef.current);
//     } catch {
//       /* ignore */
//     }
//   };

//   const probPct =
//     prediction?.lab_risk_probability != null
//       ? Math.round(prediction.lab_risk_probability * 100)
//       : null;

//   const labRiskLabelText =
//     prediction?.lab_risk_label != null
//       ? (LAB_RISK_LABEL_MAP[prediction.lab_risk_label] ??
//         `Label ${prediction.lab_risk_label}`)
//       : null;

//   const canOverride = user?.role === "doctor";
//   const displayedPriority = prediction?.priority_level ?? "—";

//   return (
//     <div
//       className="min-h-screen bg-slate-50 text-slate-900"
//       style={{ fontFamily: "system-ui, sans-serif" }}
//     >
//       {/* ── Topbar ─────────────────────────────────────────────────────────── */}
//       <div className="bg-white border-b border-slate-200 px-6 py-4">
//         <div className="flex items-center justify-between max-w-7xl mx-auto">
//           <div>
//             <h1 className="text-xl font-bold text-slate-900">Sepsis Monitor</h1>
//             <p className="text-sm text-slate-500 mt-0.5">Patient Dashboard</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-200 bg-green-50">
//               <span className="relative flex h-2 w-2">
//                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
//                 <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
//               </span>
//               <span className="text-xs font-semibold text-green-700 tracking-wide">
//                 AI Monitoring
//               </span>
//             </div>
//             <span className="text-base font-mono text-slate-700">
//               {now.toLocaleTimeString()}
//             </span>
//             <span className="text-base text-slate-700 font-medium">
//               {user?.username}
//               <span className="ml-2 text-sm text-slate-400 capitalize">
//                 ({user?.role})
//               </span>
//             </span>
//             <button
//               onClick={() => navigate("/")}
//               className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-base text-slate-700 hover:bg-slate-50"
//             >
//               ← Back
//             </button>
//             <button
//               onClick={logout}
//               className="px-4 py-2 bg-slate-900 text-white rounded-lg text-base hover:bg-slate-700"
//             >
//               Sign out
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="p-6 max-w-7xl mx-auto">
//         {/* ── Patient ID + slider ─────────────────────────────────────────── */}
//         <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
//           <div className="flex flex-wrap gap-6 items-center">
//             <div>
//               <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">
//                 Patient ID
//               </p>
//               <p className="text-2xl font-bold font-mono">{patientId}</p>
//             </div>
//             <div className="flex-1 min-w-52">
//               <p className="text-sm text-slate-500 mb-1">
//                 Hour from admission: <strong>{hour}h</strong>
//               </p>
//               <input
//                 type="range"
//                 min={0}
//                 max={72}
//                 value={hour}
//                 onChange={onSliderChange}
//                 className="w-full accent-slate-800"
//               />
//               <div className="flex justify-between text-xs text-slate-400 mt-0.5">
//                 <span>0h</span>
//                 <span>36h</span>
//                 <span>72h</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ── Override active banner ──────────────────────────────────────── */}
//         {override && (
//           <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-5 flex items-start justify-between gap-4">
//             <div>
//               <p className="text-sm font-bold text-amber-800 mb-1">
//                 ⚠ Manual Priority Override Active
//               </p>
//               <p className="text-sm text-amber-700">
//                 Priority set to <strong>{override.priority}</strong> by{" "}
//                 <strong>{override.set_by}</strong>
//               </p>
//               {override.reason && (
//                 <p className="text-sm text-amber-700 mt-1">
//                   Reason: {override.reason}
//                 </p>
//               )}
//               {override.set_at && (
//                 <p className="text-xs text-amber-500 mt-1">
//                   Set at: {new Date(override.set_at).toLocaleString()}
//                 </p>
//               )}
//             </div>
//             {canOverride && (
//               <button
//                 onClick={handleClearOverride}
//                 className="shrink-0 px-3 py-1.5 text-sm font-medium border border-amber-400 text-amber-800 rounded-lg hover:bg-amber-100"
//               >
//                 Clear Override
//               </button>
//             )}
//           </div>
//         )}

//         {/* ── Metrics ────────────────────────────────────────────────────── */}
//         {prediction && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
//             <div className="bg-white rounded-xl border border-slate-200 p-5">
//               <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide">
//                 Priority Level
//               </p>
//               <PriorityBadge
//                 level={displayedPriority}
//                 isOverride={!!override}
//               />
//             </div>

//             <div className="bg-white rounded-xl border border-slate-200 p-5">
//               <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide">
//                 Lab Risk
//               </p>
//               <p
//                 className={`text-2xl font-bold ${probPct != null && probPct >= 70 ? "text-red-700" : probPct != null && probPct >= 40 ? "text-orange-600" : "text-green-700"}`}
//               >
//                 {probPct != null ? `${probPct}%` : "—"}
//               </p>
//               {labRiskLabelText ? (
//                 <p className="text-sm text-slate-500 mt-1">
//                   {labRiskLabelText}
//                 </p>
//               ) : (
//                 <p className="text-sm text-slate-400 mt-1">No lab data yet</p>
//               )}
//             </div>

//             {/* ── Vital Status card border driven by sustained_instability ── */}
//             <div
//               className={`bg-white rounded-xl border p-5 ${vitalCardBorder(prediction.vital_anomaly_flag, prediction.sustained_instability)}`}
//             >
//               <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide">
//                 Vital Status
//               </p>
//               <p
//                 className={`text-2xl font-bold ${prediction.vital_anomaly_flag ? "text-red-700" : "text-green-700"}`}
//               >
//                 {prediction.vital_anomaly_flag ? "Anomaly" : "Normal"}
//               </p>
//               {prediction.sustained_instability ? (
//                 <p className="text-sm text-orange-600 mt-1">
//                   Sustained instability detected
//                 </p>
//               ) : null}
//             </div>
//           </div>
//         )}

//         {/* ── Alert ──────────────────────────────────────────────────────── */}
//         {/* Fix: explicit === "HIGH" check instead of implicit else ──────── */}
//         {prediction?.alert?.alert && (
//           <div
//             className={`rounded-xl border p-4 mb-5 ${
//               prediction.alert.level === "CRITICAL"
//                 ? "bg-red-50 border-red-300"
//                 : prediction.alert.level === "HIGH"
//                   ? "bg-orange-50 border-orange-300"
//                   : "bg-yellow-50 border-yellow-300"
//             }`}
//           >
//             <p
//               className={`text-base font-bold ${
//                 prediction.alert.level === "CRITICAL"
//                   ? "text-red-800"
//                   : prediction.alert.level === "HIGH"
//                     ? "text-orange-800"
//                     : "text-yellow-800"
//               }`}
//             >
//               {prediction.alert.level === "CRITICAL"
//                 ? "⚠ CRITICAL ALERT"
//                 : prediction.alert.level === "HIGH"
//                   ? "⚠ HIGH RISK ALERT"
//                   : "⚠ ALERT"}
//             </p>
//             {prediction.alert.message && (
//               <p
//                 className={`text-sm mt-1 ${
//                   prediction.alert.level === "CRITICAL"
//                     ? "text-red-700"
//                     : prediction.alert.level === "HIGH"
//                       ? "text-orange-700"
//                       : "text-yellow-700"
//                 }`}
//               >
//                 {prediction.alert.message}
//               </p>
//             )}
//           </div>
//         )}

//         {/* ── Manual Override Panel ───────────────────────────────────────── */}
//         {canOverride && (
//           <div className="bg-white rounded-xl border border-slate-200 mb-5 overflow-hidden">
//             <button
//               onClick={() => {
//                 setOverrideOpen(!overrideOpen);
//                 setOverrideMsg(null);
//               }}
//               className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
//             >
//               <div>
//                 <p className="text-base font-semibold text-slate-900">
//                   Doctor Manual Override
//                 </p>
//                 <p className="text-sm text-slate-500 mt-0.5">
//                   {override
//                     ? `Active: ${override.priority} priority set by ${override.set_by}`
//                     : "Override the AI-predicted priority level"}
//                 </p>
//               </div>
//               <span className="text-slate-400 text-xl">
//                 {overrideOpen ? "▲" : "▼"}
//               </span>
//             </button>
//             {overrideOpen && (
//               <div className="border-t border-slate-200 px-5 py-5">
//                 <div className="grid md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 mb-1.5">
//                       Override Priority
//                     </label>
//                     <select
//                       value={overrideForm.priority}
//                       onChange={(e) =>
//                         setOverrideForm((f) => ({
//                           ...f,
//                           priority: e.target.value,
//                         }))
//                       }
//                       className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
//                     >
//                       <option value="Critical">Critical</option>
//                       <option value="High">High</option>
//                       <option value="Normal">Normal</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 mb-1.5">
//                       Clinical Reason <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       value={overrideForm.reason}
//                       onChange={(e) =>
//                         setOverrideForm((f) => ({
//                           ...f,
//                           reason: e.target.value,
//                         }))
//                       }
//                       placeholder="e.g. Clinical examination indicates elevated risk"
//                       className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
//                     />
//                   </div>
//                 </div>
//                 {overrideMsg && (
//                   <div
//                     className={`text-sm px-4 py-3 rounded-lg mb-4 ${overrideMsg.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
//                   >
//                     {overrideMsg.text}
//                   </div>
//                 )}
//                 <div className="flex gap-3">
//                   <button
//                     onClick={handleSaveOverride}
//                     disabled={overrideSaving}
//                     className="px-5 py-2.5 bg-slate-900 text-white text-base rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50"
//                   >
//                     {overrideSaving ? "Saving…" : "Save Override"}
//                   </button>
//                   <button
//                     onClick={() => {
//                       setOverrideOpen(false);
//                       setOverrideMsg(null);
//                     }}
//                     className="px-5 py-2.5 border border-slate-300 text-slate-700 text-base rounded-lg hover:bg-slate-50"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── Charts with annotation vertical line at current hour ─────────── */}
//         <div className="grid md:grid-cols-2 gap-5 mb-5">
//           {/* Vital Trends */}
//           <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
//             <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-semibold text-slate-800">
//                   Vital Trends
//                 </p>
//                 <p className="text-xs text-slate-400 mt-0.5">
//                   {slicedVitals?.length ?? 0} readings · 0h – {hour}h
//                 </p>
//               </div>
//               <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">
//                 t = {hour}h
//               </span>
//             </div>
//             <div className="px-4 pb-4 pt-3" style={{ height: "272px" }}>
//               {chartLoading ? (
//                 <div className="h-full flex flex-col items-center justify-center gap-2">
//                   <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
//                   <p className="text-xs text-slate-400">Loading…</p>
//                 </div>
//               ) : slicedVitals && slicedVitals.length > 0 ? (
//                 <Line
//                   options={buildChartOptions(vitalCurrentLabel)}
//                   data={{
//                     labels: slicedVitals.map((r) => `${r.hour}h`),
//                     datasets: VITAL_KEYS.map((k) =>
//                       makeDataset(
//                         k,
//                         slicedVitals.map((r) => r[k.key]),
//                       ),
//                     ),
//                   }}
//                 />
//               ) : (
//                 <div className="h-full flex items-center justify-center">
//                   <p className="text-sm text-slate-400">
//                     {hour === 0
//                       ? "Move the slider to see vitals"
//                       : "No vital data available"}
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Lab Trends */}
//           <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
//             <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-semibold text-slate-800">
//                   Lab Trends
//                 </p>
//                 <p className="text-xs text-slate-400 mt-0.5">
//                   {slicedLabs?.length ?? 0} readings · 0h – {hour}h
//                 </p>
//               </div>
//               <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium border border-violet-100">
//                 t = {hour}h
//               </span>
//             </div>
//             <div className="px-4 pb-4 pt-3" style={{ height: "272px" }}>
//               {chartLoading ? (
//                 <div className="h-full flex flex-col items-center justify-center gap-2">
//                   <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
//                   <p className="text-xs text-slate-400">Loading…</p>
//                 </div>
//               ) : slicedLabs && slicedLabs.length > 0 ? (
//                 <Line
//                   options={buildChartOptions(labCurrentLabel)}
//                   data={{
//                     labels: slicedLabs.map((r) => `${r.hour}h`),
//                     datasets: LAB_KEYS.map((k) =>
//                       makeDataset(
//                         k,
//                         slicedLabs.map((r) => r[k.key]),
//                       ),
//                     ),
//                   }}
//                 />
//               ) : (
//                 <div className="h-full flex items-center justify-center">
//                   <p className="text-sm text-slate-400">
//                     {hour === 0
//                       ? "Move the slider to see labs"
//                       : "No lab data available"}
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ── Clinical Explanation ─────────────────────────────────────────── */}
//         {explanation && (
//           <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
//             <p className="text-base font-semibold text-slate-800 mb-2">
//               Clinical Explanation
//             </p>
//             <p className="text-base text-slate-700 leading-relaxed">
//               {explanation}
//             </p>
//             <p className="text-sm text-slate-400 mt-3">
//               Generated by AI — for clinical reference only
//             </p>
//           </div>
//         )}

//         {/* ── Top Contributing Factors ──────────────────────────────────────── */}
//         {prediction?.signals && <SignalsCard signals={prediction.signals} />}

//         {error && (
//           <div className="text-base text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
//             Error: {error}
//           </div>
//         )}
//         {loading && (
//           <div className="text-base text-slate-500 mt-2">
//             Updating prediction…
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  FlaskConical,
  HeartPulse,
  LogOut,
  Save,
  ShieldAlert,
  Stethoscope,
  TriangleAlert,
  TrendingUp,
  User,
  Wifi,
  X,
  XCircle,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import { VITAL_KEYS } from "../data/vitalData";
import { LAB_KEYS } from "../data/labData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
);

const BASE = "http://localhost:8000/api/v1";

const LAB_RISK_LABEL_MAP = { 0: "Low Risk", 1: "High Risk" };

const PRIORITY_COLORS = {
  Critical: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-400",
    dot: "bg-red-600",
  },
  High: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-400",
    dot: "bg-orange-500",
  },
  // ── Fix: Medium was missing, fell back to green Normal ──────────────────
  Medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-400",
    dot: "bg-yellow-500",
  },
  Normal: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-400",
    dot: "bg-green-600",
  },
  Loading: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
    dot: "bg-gray-400",
  },
};

// ── Vital Status card border driven by sustained_instability ────────────────
// sustained_instability=1 → orange ring; anomaly only → red ring; clean → green
function vitalCardBorder(anomalyFlag, sustainedInstability) {
  if (sustainedInstability) return "border-orange-300 ring-1 ring-orange-200";
  if (anomalyFlag) return "border-red-300";
  return "border-slate-200";
}

function PriorityBadge({ level, isOverride }) {
  const c = PRIORITY_COLORS[level] || PRIORITY_COLORS.Normal;
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {level}
      {isOverride && (
        <span className="ml-1 text-xs font-bold tracking-wide opacity-75">
          [MANUAL]
        </span>
      )}
    </span>
  );
}

// ── Parse SHAP signal string from backend ───────────────────────────────────
// Format: "lactate: 3.20 mmol/L [HIGH, normal: < 2] (SHAP ↑0.412)"
function parseSignal(str) {
  const nameMatch = str.match(/^([^:]+):/);
  const statusMatch = str.match(/\[(HIGH|LOW|NORMAL)/);
  const shapMatch = str.match(/([↑↓])([\d.]+)\)/);
  return {
    raw: str,
    name: nameMatch ? nameMatch[1].replace(/_/g, " ") : str,
    status: statusMatch ? statusMatch[1] : "NORMAL",
    direction: shapMatch ? shapMatch[1] : "",
    shap: shapMatch ? parseFloat(shapMatch[2]) : 0,
  };
}

const STATUS_STYLE = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  LOW: "bg-blue-50 text-blue-700 border-blue-200",
  NORMAL: "bg-green-50 text-green-700 border-green-200",
};

// ── Signals card: renders top lab + vital contributing factors ───────────────
// Uses the signals object returned on every /predict response (was previously ignored)
function SignalsCard({ signals }) {
  if (!signals) return null;

  const labSignals = (signals.lab || []).map(parseSignal);
  const vitalSignals = (signals.vitals || []).map(parseSignal);

  if (labSignals.length === 0 && vitalSignals.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl mb-5 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp size={15} className="text-slate-500" />
          Top Contributing Factors
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Key clinical findings influencing this risk assessment
        </p>
      </div>
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Lab signals */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <FlaskConical size={13} className="text-violet-500" />
            Lab
          </p>
          {labSignals.length === 0 ? (
            <p className="text-sm text-slate-400">No lab data</p>
          ) : (
            <div className="space-y-2">
              {labSignals.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-slate-700 capitalize">
                    {s.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[s.status] ?? STATUS_STYLE.NORMAL}`}
                    >
                      {s.status}
                    </span>
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${s.direction === "↑" ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"}`}
                      title={
                        s.direction === "↑"
                          ? "Increases risk"
                          : "Decreases risk"
                      }
                    >
                      {s.direction === "↑" ? "↑ Raises Risk" : "↓ Lowers Risk"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vital signals */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <HeartPulse size={13} className="text-rose-500" />
            Vitals
          </p>
          {vitalSignals.length === 0 ? (
            <p className="text-sm text-slate-400">No vital data</p>
          ) : (
            <div className="space-y-2">
              {vitalSignals.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-slate-700 capitalize">
                    {s.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[s.status] ?? STATUS_STYLE.NORMAL}`}
                    >
                      {s.status}
                    </span>
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${s.direction === "↑" ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"}`}
                      title={
                        s.direction === "↑"
                          ? "Increases risk"
                          : "Decreases risk"
                      }
                    >
                      {s.direction === "↑" ? "↑ Raises Risk" : "↓ Lowers Risk"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chart options with annotation plugin: vertical line at current hour ──────
// annotationPlugin was registered but never configured — now draws "current time" marker
function buildChartOptions(currentHourLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 11, family: "system-ui" },
          padding: 14,
          boxWidth: 24,
          boxHeight: 2,
          usePointStyle: true,
          pointStyle: "line",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        titleFont: { size: 12, weight: "600" },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
      },
      // ── Annotation: vertical dashed line at the rightmost (current) data point
      annotation: {
        annotations: currentHourLabel
          ? {
              currentHour: {
                type: "line",
                scaleID: "x",
                value: currentHourLabel,
                borderColor: "rgba(100, 116, 139, 0.6)",
                borderWidth: 1.5,
                borderDash: [4, 3],
                label: {
                  display: true,
                  content: currentHourLabel,
                  position: "start",
                  backgroundColor: "rgba(100, 116, 139, 0.85)",
                  color: "#fff",
                  font: { size: 10, weight: "600" },
                  padding: { x: 5, y: 3 },
                  borderRadius: 4,
                },
              },
            }
          : {},
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(148,163,184,0.12)", drawBorder: false },
        ticks: { font: { size: 10 }, color: "#94a3b8", maxTicksLimit: 9 },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(148,163,184,0.12)", drawBorder: false },
        ticks: { font: { size: 10 }, color: "#94a3b8", padding: 6 },
        border: { display: false },
      },
    },
  };
}

function makeDataset(key, data) {
  return {
    label: key.label,
    data,
    borderColor: key.color,
    backgroundColor: key.color + "15",
    tension: 0.4,
    pointRadius: 2.5,
    pointHoverRadius: 5,
    pointBackgroundColor: key.color,
    pointBorderColor: "#fff",
    pointBorderWidth: 1.5,
    borderWidth: 2,
    fill: false,
  };
}

export default function PatientDetails() {
  const { patientId } = useParams();
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [hour, setHour] = useState(0);
  const [history, setHistory] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  const [override, setOverride] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    priority: "Critical",
    reason: "",
  });
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState(null);

  const prevPriorityRef = useRef(null);
  const prevMaxHourRef = useRef(null); // tracks highest hour seen, to detect new uploads
  const debounceRef = useRef(null);
  const hourRef = useRef(0);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    hourRef.current = hour;
  }, [hour]);

  const fetchMeta = useCallback(
    async (pid) => {
      if (!token) return;
      try {
        const res = await fetch(`${BASE}/patients/${pid}/meta`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setOverride(data.manual_override || null);
      } catch {
        /* ignore */
      }
    },
    [token],
  );

  const fetchHistory = useCallback(
    async (pid) => {
      setChartLoading(true);
      try {
        // FIX: history endpoint now requires auth — was missing Authorization header
        const res = await fetch(
          `${BASE}/patients/${pid}/history?from_hour=0&to_hour=72`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error();
        setHistory(await res.json());
      } catch {
        setHistory(null);
      } finally {
        setChartLoading(false);
      }
    },
    [token],
  );

  const fetchPrediction = useCallback(
    async (pid, h) => {
      setLoading(true);
      setError(null);
      try {
        // FIX: predict endpoint now requires auth — was missing Authorization header
        const res = await fetch(`${BASE}/patients/${pid}/predict?hour=${h}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.detail || res.status);
        }
        const data = await res.json();
        setPrediction(data);
        // Update explanation only on first load (ref is null) or when priority changes.
        // Regenerating on every 10-second poll caused it to flicker with slightly
        // different wording each time the LLM was called — this keeps it stable.
        if (
          prevPriorityRef.current === null ||
          data.priority_level !== prevPriorityRef.current
        ) {
          prevPriorityRef.current = data.priority_level;
          setExplanation(data.explanation);
        }
      } catch (e) {
        setError(e.message);
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!patientId) return;
    fetchMeta(patientId);
    Promise.all([fetchHistory(patientId), fetchPrediction(patientId, 0)]);
  }, [patientId, fetchMeta, fetchHistory, fetchPrediction]);

  // ── Poll: refresh prediction AND history if new data has arrived ──────────
  // Previously only fetchPrediction was called; history never refreshed during session.
  // Now we compare the max hour seen — if it grew, new readings were uploaded, so
  // we also refresh history so charts stay current.
  useEffect(() => {
    if (!patientId) return;
    const interval = setInterval(async () => {
      await fetchPrediction(patientId, hourRef.current);
      // Peek at latest history to detect new upload without a full refetch
      try {
        const res = await fetch(
          `${BASE}/patients/${patientId}/history?from_hour=0&to_hour=72`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;
        const data = await res.json();
        const maxHour = data.vitals?.at(-1)?.hour ?? null;
        if (maxHour !== null && maxHour !== prevMaxHourRef.current) {
          prevMaxHourRef.current = maxHour;
          setHistory(data); // new data uploaded — update charts
        }
      } catch {
        /* ignore */
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [patientId, fetchPrediction, token]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const onSliderChange = (e) => {
    const h = +e.target.value;
    setHour(h);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPrediction(patientId, h);
    }, 300);
  };

  // Slice history to current slider hour
  const slicedVitals = history?.vitals
    ? history.vitals.filter((r) => r.hour <= hour)
    : null;
  const slicedLabs = history?.labs
    ? history.labs.filter((r) => r.hour <= hour)
    : null;

  // Label of the rightmost data point — used by annotationPlugin for the vertical line
  const vitalCurrentLabel = slicedVitals?.at(-1)
    ? `${slicedVitals.at(-1).hour}h`
    : null;
  const labCurrentLabel = slicedLabs?.at(-1)
    ? `${slicedLabs.at(-1).hour}h`
    : null;

  const handleSaveOverride = async () => {
    if (!overrideForm.reason.trim()) {
      setOverrideMsg({ type: "error", text: "Please provide a reason." });
      return;
    }
    setOverrideSaving(true);
    setOverrideMsg(null);
    try {
      const res = await fetch(
        `${BASE}/patients/${patientId}/override_priority`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(overrideForm),
        },
      );
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Failed to save override");
      }
      await fetchMeta(patientId);
      await fetchPrediction(patientId, hourRef.current);
      setOverrideMsg({ type: "success", text: "Override saved." });
      setOverrideOpen(false);
      setOverrideForm({ priority: "Critical", reason: "" });
    } catch (e) {
      setOverrideMsg({ type: "error", text: e.message });
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleClearOverride = async () => {
    if (
      !window.confirm("Clear the manual override? AI prediction will resume.")
    )
      return;
    try {
      await fetch(`${BASE}/patients/${patientId}/override_priority`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverride(null);
      setOverrideMsg(null);
      await fetchPrediction(patientId, hourRef.current);
    } catch {
      /* ignore */
    }
  };

  const probPct =
    prediction?.lab_risk_probability != null
      ? Math.round(prediction.lab_risk_probability * 100)
      : null;

  const labRiskLabelText =
    prediction?.lab_risk_label != null
      ? (LAB_RISK_LABEL_MAP[prediction.lab_risk_label] ??
        `Label ${prediction.lab_risk_label}`)
      : null;

  const canOverride = user?.role === "doctor";
  const displayedPriority = prediction?.priority_level ?? "—";

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-slate-700" />
              Sepsis Monitor
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Stethoscope size={13} className="text-slate-400" />
              Patient Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-200 bg-green-50">
              <Wifi size={13} className="text-green-600" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
              </span>
              <span className="text-xs font-semibold text-green-700 tracking-wide">
                AI Monitoring
              </span>
            </div>
            <span className="text-base font-mono text-slate-700 flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              {now.toLocaleTimeString()}
            </span>
            <span className="text-base text-slate-700 font-medium flex items-center gap-1.5">
              <User size={14} className="text-slate-400" />
              {user?.username}
              <span className="ml-1 text-sm text-slate-400 capitalize">
                ({user?.role})
              </span>
            </span>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-base text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-base hover:bg-slate-700 flex items-center gap-2"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* ── Patient ID + slider ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <User size={13} className="text-slate-400" />
                Patient ID
              </p>
              <p className="text-2xl font-bold font-mono">{patientId}</p>
            </div>
            <div className="flex-1 min-w-52">
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                Hour from admission: <strong>{hour}h</strong>
              </p>
              <input
                type="range"
                min={0}
                max={72}
                value={hour}
                onChange={onSliderChange}
                className="w-full accent-slate-800"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                <span>0h</span>
                <span>36h</span>
                <span>72h</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Override active banner ──────────────────────────────────────── */}
        {override && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                <AlertTriangle size={15} />
                Manual Priority Override Active
              </p>
              <p className="text-sm text-amber-700">
                Priority set to <strong>{override.priority}</strong> by{" "}
                <strong>{override.set_by}</strong>
              </p>
              {override.reason && (
                <p className="text-sm text-amber-700 mt-1">
                  Reason: {override.reason}
                </p>
              )}
              {override.set_at && (
                <p className="text-xs text-amber-500 mt-1">
                  Set at: {new Date(override.set_at).toLocaleString()}
                </p>
              )}
            </div>
            {canOverride && (
              <button
                onClick={handleClearOverride}
                className="shrink-0 px-3 py-1.5 text-sm font-medium border border-amber-400 text-amber-800 rounded-lg hover:bg-amber-100 flex items-center gap-1.5"
              >
                <X size={14} />
                Clear Override
              </button>
            )}
          </div>
        )}

        {/* ── Metrics ────────────────────────────────────────────────────── */}
        {prediction && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-slate-400" />
                Priority Level
              </p>
              <PriorityBadge
                level={displayedPriority}
                isOverride={!!override}
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <FlaskConical size={14} className="text-slate-400" />
                Lab Risk
              </p>
              <p
                className={`text-2xl font-bold ${probPct != null && probPct >= 70 ? "text-red-700" : probPct != null && probPct >= 40 ? "text-orange-600" : "text-green-700"}`}
              >
                {probPct != null ? `${probPct}%` : "—"}
              </p>
              {labRiskLabelText ? (
                <p className="text-sm text-slate-500 mt-1">
                  {labRiskLabelText}
                </p>
              ) : (
                <p className="text-sm text-slate-400 mt-1">No lab data yet</p>
              )}
            </div>

            {/* ── Vital Status card border driven by sustained_instability ── */}
            <div
              className={`bg-white rounded-xl border p-5 ${vitalCardBorder(prediction.vital_anomaly_flag, prediction.sustained_instability)}`}
            >
              <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <HeartPulse size={14} className="text-slate-400" />
                Vital Status
              </p>
              <p
                className={`text-2xl font-bold ${prediction.vital_anomaly_flag ? "text-red-700" : "text-green-700"}`}
              >
                {prediction.vital_anomaly_flag ? "Anomaly" : "Normal"}
              </p>
              {prediction.sustained_instability ? (
                <p className="text-sm text-orange-600 mt-1">
                  Sustained instability detected
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* ── Alert ──────────────────────────────────────────────────────── */}
        {/* Fix: explicit === "HIGH" check instead of implicit else ──────── */}
        {prediction?.alert?.alert && (
          <div
            className={`rounded-xl border p-4 mb-5 ${
              prediction.alert.level === "CRITICAL"
                ? "bg-red-50 border-red-300"
                : prediction.alert.level === "HIGH"
                  ? "bg-orange-50 border-orange-300"
                  : "bg-yellow-50 border-yellow-300"
            }`}
          >
            <p
              className={`text-base font-bold flex items-center gap-2 ${
                prediction.alert.level === "CRITICAL"
                  ? "text-red-800"
                  : prediction.alert.level === "HIGH"
                    ? "text-orange-800"
                    : "text-yellow-800"
              }`}
            >
              <TriangleAlert size={16} />
              {prediction.alert.level === "CRITICAL"
                ? "CRITICAL ALERT"
                : prediction.alert.level === "HIGH"
                  ? "HIGH RISK ALERT"
                  : "ALERT"}
            </p>
            {prediction.alert.message && (
              <p
                className={`text-sm mt-1 ${
                  prediction.alert.level === "CRITICAL"
                    ? "text-red-700"
                    : prediction.alert.level === "HIGH"
                      ? "text-orange-700"
                      : "text-yellow-700"
                }`}
              >
                {prediction.alert.message}
              </p>
            )}
          </div>
        )}

        {/* ── Manual Override Panel ───────────────────────────────────────── */}
        {canOverride && (
          <div className="bg-white rounded-xl border border-slate-200 mb-5 overflow-hidden">
            <button
              onClick={() => {
                setOverrideOpen(!overrideOpen);
                setOverrideMsg(null);
              }}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
            >
              <div>
                <p className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-slate-500" />
                  Doctor Manual Override
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {override
                    ? `Active: ${override.priority} priority set by ${override.set_by}`
                    : "Override the AI-predicted priority level"}
                </p>
              </div>
              <span className="text-slate-400">
                {overrideOpen ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </span>
            </button>
            {overrideOpen && (
              <div className="border-t border-slate-200 px-5 py-5">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Override Priority
                    </label>
                    <select
                      value={overrideForm.priority}
                      onChange={(e) =>
                        setOverrideForm((f) => ({
                          ...f,
                          priority: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Normal">Normal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Clinical Reason <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={overrideForm.reason}
                      onChange={(e) =>
                        setOverrideForm((f) => ({
                          ...f,
                          reason: e.target.value,
                        }))
                      }
                      placeholder="e.g. Clinical examination indicates elevated risk"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
                {overrideMsg && (
                  <div
                    className={`text-sm px-4 py-3 rounded-lg mb-4 ${overrideMsg.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
                  >
                    {overrideMsg.text}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveOverride}
                    disabled={overrideSaving}
                    className="px-5 py-2.5 bg-slate-900 text-white text-base rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save size={15} />
                    {overrideSaving ? "Saving…" : "Save Override"}
                  </button>
                  <button
                    onClick={() => {
                      setOverrideOpen(false);
                      setOverrideMsg(null);
                    }}
                    className="px-5 py-2.5 border border-slate-300 text-slate-700 text-base rounded-lg hover:bg-slate-50 flex items-center gap-2"
                  >
                    <X size={15} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Charts with annotation vertical line at current hour ─────────── */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* Vital Trends */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <HeartPulse size={15} className="text-rose-400" />
                  Vital Trends
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {slicedVitals?.length ?? 0} readings · 0h – {hour}h
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">
                t = {hour}h
              </span>
            </div>
            <div className="px-4 pb-4 pt-3" style={{ height: "272px" }}>
              {chartLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Loading…</p>
                </div>
              ) : slicedVitals && slicedVitals.length > 0 ? (
                <Line
                  options={buildChartOptions(vitalCurrentLabel)}
                  data={{
                    labels: slicedVitals.map((r) => `${r.hour}h`),
                    datasets: VITAL_KEYS.map((k) =>
                      makeDataset(
                        k,
                        slicedVitals.map((r) => r[k.key]),
                      ),
                    ),
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-400">
                    {hour === 0
                      ? "Move the slider to see vitals"
                      : "No vital data available"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lab Trends */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <FlaskConical size={15} className="text-violet-400" />
                  Lab Trends
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {slicedLabs?.length ?? 0} readings · 0h – {hour}h
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium border border-violet-100">
                t = {hour}h
              </span>
            </div>
            <div className="px-4 pb-4 pt-3" style={{ height: "272px" }}>
              {chartLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Loading…</p>
                </div>
              ) : slicedLabs && slicedLabs.length > 0 ? (
                <Line
                  options={buildChartOptions(labCurrentLabel)}
                  data={{
                    labels: slicedLabs.map((r) => `${r.hour}h`),
                    datasets: LAB_KEYS.map((k) =>
                      makeDataset(
                        k,
                        slicedLabs.map((r) => r[k.key]),
                      ),
                    ),
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-400">
                    {hour === 0
                      ? "Move the slider to see labs"
                      : "No lab data available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Clinical Explanation ─────────────────────────────────────────── */}
        {explanation && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
            <p className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Brain size={16} className="text-slate-500" />
              Clinical Explanation
            </p>
            <p className="text-base text-slate-700 leading-relaxed">
              {explanation}
            </p>
            <p className="text-sm text-slate-400 mt-3">
              Generated by AI — for clinical reference only
            </p>
          </div>
        )}

        {/* ── Top Contributing Factors ──────────────────────────────────────── */}
        {prediction?.signals && <SignalsCard signals={prediction.signals} />}

        {error && (
          <div className="text-base text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <XCircle size={16} className="shrink-0" />
            Error: {error}
          </div>
        )}
        {loading && (
          <div className="text-base text-slate-500 mt-2 flex items-center gap-2">
            <Activity size={15} className="animate-pulse text-slate-400" />
            Updating prediction…
          </div>
        )}
      </div>
    </div>
  );
}
