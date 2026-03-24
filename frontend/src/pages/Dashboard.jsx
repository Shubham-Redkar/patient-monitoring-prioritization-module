import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE = "http://localhost:8000/api/v1";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch patient IDs first (instant UI)
  const fetchPatients = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/patients`);
      const data = await res.json();
      const ids = data.patient_ids || [];

      // Step 1: show instantly
      const initial = ids.map((id) => ({
        id,
        priority: "Loading",
        alert: false,
      }));

      setPatients(initial);
      setLoading(false);

      // Step 2: fetch predictions in background
      ids.forEach(async (id) => {
        try {
          const res = await fetch(`${BASE}/patients/${id}/predict?hour=72`);

          if (!res.ok) return;

          const data = await res.json();

          // update only that patient
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
    } catch (err) {
      console.error("Failed to load patients");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    const interval = setInterval(fetchPatients, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      {/* Topbar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-lg font-medium">
            Clinical Decision Support System
          </div>
          <div className="text-sm text-black mt-1">Overview Dashboard</div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {user?.username} ({user?.role})
          </span>

          {user?.role === "admin" && (
            <button
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm"
              onClick={() => navigate("/data")}
            >
              Data Management
            </button>
          )}

          <button
            className="px-3 py-1.5 bg-black text-white rounded-md text-sm"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading patients...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {patients.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/patient/${p.id}`)}
              className={`
            bg-white rounded-xl p-5 cursor-pointer border
            transition-all duration-200
            hover:-translate-y-1 hover:shadow-md

            ${
              p.priority === "Critical"
                ? "border-red-300 border-t-4 border-t-red-700 shadow-sm"
                : p.priority === "High"
                  ? "border-orange-300 border-t-4 border-t-orange-500 shadow-sm"
                  : p.priority === "Loading"
                    ? "border-gray-200 border-t-4 border-t-gray-400 animate-pulse"
                    : "border-gray-200 border-t-4 border-t-green-700"
            }
          `}
            >
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Patient ID
              </div>

              <div className="text-2xl font-semibold font-mono">{p.id}</div>

              <div className="inline-block text-xs font-medium px-3 py-1 rounded mt-2">
                {p.priority === "Loading"
                  ? "Loading..."
                  : `${p.priority} Priority`}
              </div>

              {p.alert && (
                <div className="text-xs text-red-700 font-medium mt-2">
                  {p.alertLevel === "CRITICAL"
                    ? "⚠️ CRITICAL ALERT"
                    : "⚠️ HIGH RISK"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
