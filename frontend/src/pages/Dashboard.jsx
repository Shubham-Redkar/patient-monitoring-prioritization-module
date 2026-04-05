import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE = "http://localhost:8000/api/v1";

const PRIORITY_STYLE = {
  Critical: {
    topBar: "border-t-red-600",
    badge: "bg-red-100 text-red-800",
    border: "border-red-200",
  },
  High: {
    topBar: "border-t-orange-500",
    badge: "bg-orange-100 text-orange-800",
    border: "border-orange-200",
  },
  Medium: {
    topBar: "border-t-yellow-500",
    badge: "bg-yellow-100 text-yellow-800",
    border: "border-yellow-200",
  },
  Normal: {
    topBar: "border-t-green-600",
    badge: "bg-green-100 text-green-800",
    border: "border-green-200",
  },
  Loading: {
    topBar: "border-t-slate-400",
    badge: "bg-slate-100 text-slate-500",
    border: "border-slate-200",
  },
};

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/patients`, { headers: authHeaders });
      const data = await res.json();
      const ids = data.patient_ids || [];

      const initial = ids.map((id) => ({
        id,
        priority: "Loading",
        alert: false,
      }));
      setPatients(initial);
      setLoading(false);

      ids.forEach(async (id) => {
        try {
          const res = await fetch(`${BASE}/patients/${id}/predict?hour=72`, {
            headers: authHeaders,
          });
          if (!res.ok) return;
          const data = await res.json();
          setPatients((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    id,
                    priority: data.priority_level,
                    alert: data.alert?.alert,
                    alertLevel: data.alert?.level,
                  }
                : p,
            ),
          );
        } catch {
          // ignore individual errors
        }
      });
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 20000);
    return () => clearInterval(interval);
  }, []);

  const counts = {
    Critical: patients.filter((p) => p.priority === "Critical").length,
    High: patients.filter((p) => p.priority === "High").length,
    Medium: patients.filter((p) => p.priority === "Medium").length,
    Normal: patients.filter((p) => p.priority === "Normal").length,
  };

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Clinical Decision Support
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Overview Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base text-slate-700 font-medium">
              {user?.username}
              <span className="ml-2 text-sm text-slate-400 capitalize">
                ({user?.role})
              </span>
            </span>
            {user?.role === "admin" && (
              <button
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-base text-slate-700 hover:bg-slate-50"
                onClick={() => navigate("/data")}
              >
                Data Management
              </button>
            )}
            <button
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-base hover:bg-slate-700"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* ── Summary strip ───────────────────────────────────────────────── */}
        {!loading && patients.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-800">
                  {counts.Critical}
                </p>
                <p className="text-sm text-red-600">Critical</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-800">
                  {counts.High}
                </p>
                <p className="text-sm text-orange-600">High</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-800">
                  {counts.Medium}
                </p>
                <p className="text-sm text-yellow-600">Medium</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {counts.Normal}
                </p>
                <p className="text-sm text-green-600">Normal</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Patient grid ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-base text-slate-500">Loading patients…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {patients.map((p) => {
              const style = PRIORITY_STYLE[p.priority] || PRIORITY_STYLE.Normal;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/patient/${p.id}`)}
                  className={`
                    bg-white rounded-xl p-5 cursor-pointer
                    border-t-4 border ${style.topBar} ${style.border}
                    hover:-translate-y-1 hover:shadow-md transition-all duration-200
                    ${p.priority === "Loading" ? "animate-pulse" : ""}
                  `}
                >
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Patient ID
                  </p>
                  <p className="text-2xl font-bold font-mono text-slate-900 mb-3">
                    {p.id}
                  </p>

                  <span
                    className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${style.badge}`}
                  >
                    {p.priority === "Loading"
                      ? "Loading…"
                      : `${p.priority} Priority`}
                  </span>

                  {p.alert && (
                    <p
                      className={`text-sm font-semibold mt-3 ${p.alertLevel === "CRITICAL" ? "text-red-700" : "text-orange-700"}`}
                    >
                      {p.alertLevel === "CRITICAL"
                        ? "⚠ CRITICAL ALERT"
                        : "⚠ HIGH RISK"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
