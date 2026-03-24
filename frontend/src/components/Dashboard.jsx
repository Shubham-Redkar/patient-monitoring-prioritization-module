import { useState, useEffect, useRef, useCallback } from "react";
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
import VITAL_KEYS from "../data/vitalData";
import LAB_KEYS from "../data/labData";

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

const PRIORITY_COLOR = {
  Low: "#3B6D11",
  Medium: "#854F0B",
  High: "#854F0B",
  Critical: "#A32D2D",
};

const ALERT_STYLE = {
  CRITICAL: { bg: "#FCEBEB", color: "#A32D2D", border: "#F09595" },
  HIGH: { bg: "#FAEEDA", color: "#854F0B", border: "#EF9F27" },
};

function buildChartData(rows, keys, currentHour) {
  const labels = rows.map((r) => r.hour);
  return {
    labels,
    datasets: keys.map((k) => ({
      label: k.label,
      data: rows.map((r) => r[k.key] ?? null),
      borderColor: k.color,
      backgroundColor: k.color + "22",
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3,
      spanGaps: true,
    })),
  };
}

function chartOptions(currentHour) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, font: { size: 11 }, color: "black" },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        bodyFont: { family: "monospace", size: 12 },
        titleFont: { size: 11 },
        callbacks: {
          title: (items) => `Hour ${items[0].label}`,
          label: (item) =>
            item.raw != null
              ? ` ${item.dataset.label}: ${item.raw.toFixed(1)}`
              : null,
        },
      },
      annotation: {
        annotations: {
          hourLine: {
            type: "line",
            xMin: currentHour,
            xMax: currentHour,
            borderColor: "#aaa",
            borderWidth: 1,
            borderDash: [4, 3],
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 11 }, color: "black", maxTicksLimit: 10 },
        grid: { color: "#f4f4f4" },
        title: {
          display: true,
          text: "hour",
          font: { size: 11 },
          color: "black",
        },
      },
      y: {
        ticks: { font: { size: 11 }, color: "black" },
        grid: { color: "#f4f4f4" },
      },
    },
  };
}

const s = {
  root: {
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
    background: "#fafaf9",
    minHeight: "100vh",
    padding: "2rem",
    color: "#1a1a1a",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
  },
  title: {
    fontSize: 18,
    fontWeight: 500,
  },
  subtitle: { fontSize: 13, color: "black", marginTop: 2 },
  card: {
    background: "#fff",
    border: "0.5px solid #e5e5e4",
    borderRadius: 10,
    padding: "1.25rem",
  },
  label: {
    fontSize: 11,
    color: "black",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 4,
    display: "block",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  select: {
    border: "0.5px solid #d4d4d4",
    borderRadius: 6,
    padding: "7px 12px",
    fontSize: 13,
    background: "#fff",
    color: "#1a1a1a",
    cursor: "pointer",
    minWidth: 160,
  },
  input: {
    border: "0.5px solid #d4d4d4",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 13,
    width: 140,
    background: "#fff",
    color: "#1a1a1a",
  },
  metricVal: {
    fontSize: 22,
    fontWeight: 500,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  row: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: "black",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "1rem",
    display: "block",
  },
  ackBtn: {
    fontSize: 13,
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    border: "0.5px solid #F09595",
    background: "#FCEBEB",
    color: "#A32D2D",
  },
  probBarBg: {
    height: 4,
    borderRadius: 2,
    background: "#ececec",
    marginTop: 6,
  },
  signalText: {
    fontSize: 12,
    color: "black",
    lineHeight: 1.8,
    fontFamily: "monospace",
    borderBottom: "0.5px solid #f0f0f0",
    paddingBottom: 6,
    marginBottom: 6,
  },
  empty: { fontSize: 13, color: "black", fontStyle: "italic" },
  badge: (p) => ({
    display: "inline-block",
    fontSize: 11,
    fontWeight: 500,
    padding: "3px 10px",
    borderRadius: 4,
    background:
      p === "Critical"
        ? "#FCEBEB"
        : p === "High" || p === "Medium"
          ? "#FAEEDA"
          : "#EAF3DE",
    color: PRIORITY_COLOR[p] || "#3B6D11",
  }),
};

export default function Dashboard({ user, onLogout }) {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [doctor, setDoctor] = useState("");
  const [hour, setHour] = useState(0);
  const [history, setHistory] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ackMsg, setAckMsg] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const prevPriorityRef = useRef(null);
  const debounceRef = useRef(null);
  const pollRef = useRef(null);
  const hourRef = useRef(0);

  // Keep hourRef in sync with hour state so polling always uses latest hour
  useEffect(() => {
    hourRef.current = hour;
  }, [hour]);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch(`${BASE}/patients`)
      .then((r) => r.json())
      .then((d) => {
        const ids = d.patient_ids || [];
        setPatients(ids);
        if (ids.length) setPatientId(ids[0]);
      })
      .catch(() => setError("Could not load patient list"));
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
      setLastUpdated(new Date());
      // Only update explanation if priority changed or it's a new alert
      if (data.priority_level !== prevPriorityRef.current) {
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

  // Real-time polling every 10 seconds
  useEffect(() => {
    if (!patientId) return;
    pollRef.current = setInterval(() => {
      fetchPrediction(patientId, hourRef.current);
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [patientId]);

  const onPatientChange = (e) => {
    const pid = +e.target.value;
    setPatientId(pid);
    setHour(0);
    setPrediction(null);
    setHistory(null);
    setAcknowledged(false);
    setAckMsg(null);
    setExplanation(null);
    prevPriorityRef.current = null;
  };

  const onSliderChange = (e) => {
    const h = +e.target.value;
    setHour(h);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPrediction(patientId, h), 0);
  };

  const acknowledge = async () => {
    if (!doctor.trim()) {
      setAckMsg("Enter doctor name");
      return;
    }
    try {
      const res = await fetch(
        `${BASE}/patients/${patientId}/acknowledge?doctor=${encodeURIComponent(doctor)}`,
        { method: "POST" },
      );
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail);
      }
      setAcknowledged(true);
      setAckMsg(`Acknowledged by ${doctor}`);
    } catch (e) {
      setAckMsg(`Failed: ${e.message}`);
    }
  };

  const hasAlert = prediction?.alert?.alert;
  const alertLevel = prediction?.alert?.level;
  const probPct =
    prediction?.lab_risk_probability != null
      ? Math.round(prediction.lab_risk_probability * 100)
      : null;
  const alertStyle = ALERT_STYLE[alertLevel] || {};

  const vitalChartData = history?.vitals?.length
    ? buildChartData(
        history.vitals.filter((r) => r.hour <= hour),
        VITAL_KEYS,
        hour,
      )
    : null;
  const labChartData = history?.labs?.length
    ? buildChartData(
        history.labs.filter((r) => r.hour <= hour),
        LAB_KEYS,
        hour,
      )
    : null;

  return (
    <div style={s.root}>
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={s.topbar}>
        <div>
          <div style={s.title}>Sepsis Monitor</div>
          <div style={s.subtitle}>Patient risk dashboard</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* AI monitoring indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#1D9E75",
                display: "inline-block",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span
              style={{ fontSize: 11, color: "black", letterSpacing: "0.04em" }}
            >
              AI monitoring active
            </span>
          </div>
          {/* Live clock */}
          <span
            style={{
              fontSize: 13,
              color: "black",
              fontFamily: "monospace",
              letterSpacing: "0.04em",
            }}
          >
            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          {prediction && (
            <span style={s.badge(prediction.priority_level)}>
              {prediction.priority_level}
            </span>
          )}
          <span style={{ fontSize: 13, color: "black" }}>{user?.username}</span>
          <button
            style={{
              fontSize: 12,
              padding: "5px 12px",
              borderRadius: 6,
              cursor: "pointer",
              border: "0.5px solid #d4d4d4",
              background: "#fff",
              color: "black",
            }}
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }`}</style>

      {/* Controls */}
      <div style={{ ...s.card, marginBottom: "1rem" }}>
        <div style={s.row}>
          <div>
            <span style={s.label}>Patient</span>
            <select
              style={s.select}
              value={patientId ?? ""}
              onChange={onPatientChange}
            >
              {patients.map((p) => (
                <option key={p} value={p}>
                  Patient {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span style={s.label}>Doctor</span>
            <input
              style={s.input}
              value={doctor}
              placeholder="Dr. Name"
              onChange={(e) => setDoctor(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={s.label}>Hour from admission</span>
              <span style={{ ...s.label, fontFamily: "monospace" }}>
                {hour}h
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={72}
              step={1}
              value={hour}
              onChange={onSliderChange}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Alert */}
      {hasAlert && (
        <div
          style={{
            background: acknowledged ? "#EAF3DE" : alertStyle.bg,
            color: acknowledged ? "#3B6D11" : alertStyle.color,
            border: `0.5px solid ${acknowledged ? "#97C459" : alertStyle.border}`,
            padding: "10px 16px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            {acknowledged
              ? `Acknowledged — ${ackMsg}`
              : alertLevel === "CRITICAL"
                ? "! CRITICAL — Immediate attention required"
                : "! HIGH — Patient showing elevated risk"}
          </span>
          {acknowledged && (
            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>
              alert retained for record
            </span>
          )}
        </div>
      )}

      {hasAlert && !acknowledged && (
        <div style={{ ...s.row, marginBottom: "1rem" }}>
          <button style={s.ackBtn} onClick={acknowledge}>
            Acknowledge alert
          </button>
          {ackMsg && (
            <span style={{ fontSize: 13, color: "#A32D2D" }}>{ackMsg}</span>
          )}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div style={{ ...s.card, marginBottom: "1rem" }}>
          <span style={s.sectionTitle}>Clinical explanation</span>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#1a1a1a" }}>
            {explanation}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "#bbb",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#1D9E75",
                display: "inline-block",
              }}
            />
            Generated by AI — for clinical reference only
          </div>
        </div>
      )}

      {/* Metric cards */}
      {prediction && (
        <div style={{ ...s.grid4, marginBottom: "1rem" }}>
          <div style={s.card}>
            <span style={s.label}>Priority</span>
            <div
              style={{
                ...s.metricVal,
                color: PRIORITY_COLOR[prediction.priority_level],
              }}
            >
              {prediction.priority_level}
            </div>
          </div>
          <div style={s.card}>
            <span style={s.label}>Lab risk</span>
            <div style={s.metricVal}>
              {probPct != null ? `${probPct}%` : "—"}
            </div>
            {probPct != null && (
              <div style={s.probBarBg}>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    width: `${probPct}%`,
                    background:
                      probPct >= 70
                        ? "#E24B4A"
                        : probPct >= 40
                          ? "#EF9F27"
                          : "#639922",
                  }}
                />
              </div>
            )}
          </div>
          <div style={s.card}>
            <span style={s.label}>Vital anomaly</span>
            <div
              style={{
                ...s.metricVal,
                color: prediction.vital_anomaly_flag ? "#E24B4A" : "#639922",
              }}
            >
              {prediction.vital_anomaly_flag ? "Detected" : "Clear"}
            </div>
          </div>
          <div style={s.card}>
            <span style={s.label}>Sustained instability</span>
            <div
              style={{
                ...s.metricVal,
                color: prediction.sustained_instability ? "#E24B4A" : "#639922",
              }}
            >
              {prediction.sustained_instability ? "Yes" : "No"}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {chartLoading && (
        <div style={{ ...s.empty, marginBottom: "1rem" }}>
          Loading charts...
        </div>
      )}

      {(vitalChartData || labChartData) && (
        <div style={{ ...s.grid2, marginBottom: "1rem" }}>
          <div style={s.card}>
            <span style={s.sectionTitle}>Vital signs over time</span>
            {vitalChartData ? (
              <div style={{ height: 240 }}>
                <Line data={vitalChartData} options={chartOptions(hour)} />
              </div>
            ) : (
              <div style={s.empty}>No vital data</div>
            )}
          </div>
          <div style={s.card}>
            <span style={s.sectionTitle}>Lab results over time</span>
            {labChartData ? (
              <div style={{ height: 240 }}>
                <Line data={labChartData} options={chartOptions(hour)} />
              </div>
            ) : (
              <div style={s.empty}>No lab data available</div>
            )}
          </div>
        </div>
      )}

      {/* Signals */}
      {prediction && (
        <div style={{ ...s.grid2, marginBottom: "1rem" }}>
          <div style={s.card}>
            <span style={s.sectionTitle}>Lab signals (SHAP)</span>
            {prediction.signals?.lab?.length ? (
              prediction.signals.lab.map((sig, i) => (
                <div key={i} style={s.signalText}>
                  {sig}
                </div>
              ))
            ) : (
              <div style={s.empty}>No lab signals</div>
            )}
          </div>
          <div style={s.card}>
            <span style={s.sectionTitle}>Vital signals (SHAP)</span>
            {prediction.signals?.vitals?.length ? (
              prediction.signals.vitals.map((sig, i) => (
                <div key={i} style={s.signalText}>
                  {sig}
                </div>
              ))
            ) : (
              <div style={s.empty}>No vital signals</div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 13, color: "#A32D2D", marginTop: "1rem" }}>
          Error: {error}
        </div>
      )}
      {loading && (
        <div style={{ fontSize: 13, color: "#aaa", marginTop: "1rem" }}>
          Updating...
        </div>
      )}
    </div>
  );
}
