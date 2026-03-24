import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
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
  annotationPlugin,
);

const BASE = "http://localhost:8000/api/v1";

export default function PatientDetails() {
  const { patientId } = useParams();
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState("");
  const [hour, setHour] = useState(0);
  const [history, setHistory] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState(null); // ✅ added

  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  const prevPriorityRef = useRef(null);
  const debounceRef = useRef(null);
  const pollRef = useRef(null);
  const hourRef = useRef(0);

  useEffect(() => {
    hourRef.current = hour;
  }, [hour]);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchHistory = useCallback(async (pid) => {
    setChartLoading(true);
    try {
      const res = await fetch(
        `${BASE}/patients/${pid}/history?from_hour=0&to_hour=72`,
      );
      if (!res.ok) throw new Error();
      setHistory(await res.json());
    } catch {
      setHistory(null);
    } finally {
      setChartLoading(false);
    }
  }, []);

  const fetchPrediction = useCallback(async (pid, h) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE}/patients/${pid}/predict?hour=${h}`);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || res.status);
      }

      const data = await res.json();
      setPrediction(data);

      // ✅ FIXED LOGIC
      if (
        data.priority_level !== prevPriorityRef.current ||
        data.alert?.alert
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
  }, []);

  useEffect(() => {
    if (!patientId) return;
    Promise.all([fetchHistory(patientId), fetchPrediction(patientId, hour)]);
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;

    pollRef.current = setInterval(() => {
      fetchPrediction(patientId, hourRef.current);
    }, 10000);

    return () => clearInterval(pollRef.current);
  }, [patientId]);

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

  const probPct =
    prediction?.lab_risk_probability != null
      ? Math.round(prediction.lab_risk_probability * 100)
      : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      {/* Topbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-semibold">Sepsis Monitor</h1>
          <p className="text-sm text-gray-600">Patient Dashboard</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="font-mono">{now.toLocaleTimeString()}</span>
          <span>{user?.username}</span>

          <button
            onClick={() => navigate("/")}
            className="px-3 py-1.5 border rounded-md"
          >
            Back
          </button>

          <button
            onClick={logout}
            className="px-3 py-1.5 bg-black text-white rounded-md"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <p className="text-sm text-gray-500">Patient</p>
          <p className="text-lg font-semibold">{patientId}</p>
        </div>

        <input
          className="border rounded-md px-3 py-1.5 text-sm"
          value={doctor}
          onChange={(e) => setDoctor(e.target.value)}
          placeholder="Dr. Name"
        />

        <input
          type="range"
          min={0}
          max={72}
          value={hour}
          onChange={onSliderChange}
          className="w-full"
        />
      </div>

      {/* Metrics */}
      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-xs text-gray-500">Priority</p>
            <p className="text-xl font-semibold">{prediction.priority_level}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border">
            <p className="text-xs text-gray-500">Lab Risk</p>
            <p className="text-xl font-semibold">
              {probPct != null ? `${probPct}%` : "-"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border">
            <p className="text-xs text-gray-500">Vital Status</p>
            <p className="text-xl font-semibold">
              {prediction.vital_anomaly_flag ? "Anomaly" : "Normal"}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-xl border h-64">
          <p className="text-sm mb-2">Vital Trends</p>
          {chartLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : history?.vitals ? (
            <Line
              data={{
                labels: history.vitals.map((r) => r.hour),
                datasets: VITAL_KEYS.map((k) => ({
                  label: k.label,
                  data: history.vitals.map((r) => r[k.key]),
                  borderColor: k.color,
                })),
              }}
            />
          ) : (
            <p className="text-sm text-gray-500">No data</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border h-64">
          <p className="text-sm mb-2">Lab Trends</p>
          {chartLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : history?.labs ? (
            <Line
              data={{
                labels: history.labs.map((r) => r.hour),
                datasets: LAB_KEYS.map((k) => ({
                  label: k.label,
                  data: history.labs.map((r) => r[k.key]),
                  borderColor: k.color,
                })),
              }}
            />
          ) : (
            <p className="text-sm text-gray-500">No data</p>
          )}
        </div>
      </div>

      {/* ✅ Explanation UI */}
      {explanation && (
        <div className="bg-white border rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-2">Clinical Explanation</p>
          <p className="text-sm text-gray-700 leading-relaxed">{explanation}</p>
          <p className="text-xs text-gray-400 mt-2">
            Generated by AI — for clinical reference only
          </p>
        </div>
      )}

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading && <div className="text-gray-500 text-sm">Updating...</div>}
    </div>
  );
}
