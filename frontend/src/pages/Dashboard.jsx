import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Database,
  Users,
  LogOut,
  Eye,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

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

async function fetchWithConcurrency(ids, fetchOne, concurrency = 3) {
  const queue = [...ids];
  const worker = async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (id == null) break;
      await fetchOne(id);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const initialLoad = useCallback(async () => {
    const authHeaders = { Authorization: `Bearer ${token}` };
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/patients`, { headers: authHeaders });
      const data = await res.json();
      const ids = data.patient_ids || [];
      setPatients(ids.map((id) => ({ id, priority: "Loading", alert: false })));
      setLoading(false);

      await fetchWithConcurrency(ids, async (id) => {
        try {
          const r = await fetch(`${BASE}/patients/${id}/predict?hour=72`, {
            headers: authHeaders,
          });
          if (!r.ok) return;
          const d = await r.json();
          setPatients((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    id,
                    priority: d.priority_level,
                    alert: d.alert?.alert && !d.alert?.acknowledged,
                    alertLevel: d.alert?.level,
                    acknowledged: d.alert?.alert && d.alert?.acknowledged,
                  }
                : p,
            ),
          );
        } catch {
          /* ignore individual failures */
        }
      });
    } catch {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const counts = {
    Critical: patients.filter((p) => p.priority === "Critical").length,
    High: patients.filter((p) => p.priority === "High").length,
    Medium: patients.filter((p) => p.priority === "Medium").length,
    Normal: patients.filter((p) => p.priority === "Normal").length,
  };

  const isNurse = user?.role === "nurse";

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-slate-700" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Clinical Decision Support
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Overview Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base text-slate-700 font-medium">
              {user?.full_name || user?.username}
              <span className="ml-2 text-sm text-slate-400 capitalize">
                ({user?.role})
              </span>
            </span>
            {isNurse && (
              <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 border border-rose-200 text-rose-700">
                <Eye className="w-3 h-3" />
                Read-only
              </span>
            )}
            {isNurse && (
              <button
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg bg-white text-base text-slate-700 hover:bg-slate-50"
                onClick={() => navigate("/data")}
              >
                <Database className="w-4 h-4" />
                Data Management
              </button>
            )}
            {user?.role === "admin" && (
              <>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg bg-white text-base text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate("/data")}
                >
                  <Database className="w-4 h-4" />
                  Data Management
                </button>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg bg-white text-base text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate("/users")}
                >
                  <Users className="w-4 h-4" />
                  User Management
                </button>
              </>
            )}
            <button
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-base hover:bg-slate-700"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {!loading && patients.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              {
                key: "Critical",
                dot: "bg-red-600",
                bg: "bg-red-50",
                border: "border-red-200",
                text: "text-red-800",
                sub: "text-red-600",
              },
              {
                key: "High",
                dot: "bg-orange-500",
                bg: "bg-orange-50",
                border: "border-orange-200",
                text: "text-orange-800",
                sub: "text-orange-600",
              },
              {
                key: "Medium",
                dot: "bg-yellow-500",
                bg: "bg-yellow-50",
                border: "border-yellow-200",
                text: "text-yellow-800",
                sub: "text-yellow-600",
              },
              {
                key: "Normal",
                dot: "bg-green-600",
                bg: "bg-green-50",
                border: "border-green-200",
                text: "text-green-800",
                sub: "text-green-600",
              },
            ].map(({ key, dot, bg, border, text, sub }) => (
              <div
                key={key}
                className={`${bg} border ${border} rounded-xl px-5 py-4 flex items-center gap-3`}
              >
                <span className={`w-3 h-3 rounded-full ${dot}`} />
                <div>
                  <p className={`text-2xl font-bold ${text}`}>{counts[key]}</p>
                  <p className={`text-sm ${sub}`}>{key}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-base text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading patients…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {patients.map((p) => {
              const style = PRIORITY_STYLE[p.priority] || PRIORITY_STYLE.Normal;
              return (
                <div
                  key={p.id}
                  onClick={() => !isNurse && navigate(`/patient/${p.id}`)}
                  className={`bg-white rounded-xl p-5 border-t-4 border ${style.topBar} ${style.border} transition-all duration-200 ${
                    p.priority === "Loading" ? "animate-pulse" : ""
                  } ${!isNurse ? "cursor-pointer hover:-translate-y-1 hover:shadow-md" : "cursor-default"}`}
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
                      className={`flex items-center gap-1 text-sm font-semibold mt-3 ${
                        p.alertLevel === "CRITICAL"
                          ? "text-red-700"
                          : "text-orange-700"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {p.alertLevel === "CRITICAL"
                        ? "CRITICAL ALERT"
                        : "HIGH RISK"}
                    </p>
                  )}
                  {p.acknowledged && (
                    <p className="flex items-center gap-1 text-sm font-semibold mt-3 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Acknowledged
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
