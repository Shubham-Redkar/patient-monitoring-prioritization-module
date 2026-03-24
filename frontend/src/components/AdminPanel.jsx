import { useState, useEffect } from "react";

const BASE = "http://localhost:8000/api/v1";

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
  title: { fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em" },
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
    marginBottom: 6,
    display: "block",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: "black",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "1rem",
    display: "block",
  },
  btn: {
    fontSize: 13,
    padding: "7px 16px",
    borderRadius: 6,
    cursor: "pointer",
    border: "0.5px solid #d4d4d4",
    background: "black",
    color: "#fff",
  },
  logoutBtn: {
    fontSize: 12,
    padding: "5px 12px",
    borderRadius: 6,
    cursor: "pointer",
    border: "0.5px solid #d4d4d4",
    background: "#fff",
    color: "black",
  },
  uploadBox: {
    border: "0.5px dashed #d4d4d4",
    borderRadius: 8,
    padding: "2rem",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "1rem",
    transition: "border-color 0.2s",
  },
  fileName: {
    fontSize: 13,
    color: "black",
    marginTop: 8,
    fontFamily: "monospace",
  },
  successBox: {
    background: "#EAF3DE",
    border: "0.5px solid #97C459",
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 13,
    color: "#3B6D11",
    marginTop: "1rem",
  },
  errorBox: {
    background: "#FCEBEB",
    border: "0.5px solid #F09595",
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 13,
    color: "#A32D2D",
    marginTop: "1rem",
  },
  patientGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: 8,
  },
  patientCard: {
    background: "#fafaf9",
    border: "0.5px solid #e5e5e4",
    borderRadius: 8,
    padding: "10px 12px",
    textAlign: "center",
  },
  patientId: { fontSize: 15, fontWeight: 500, fontFamily: "monospace" },
  patientLabel: { fontSize: 11, color: "black", marginTop: 2 },
  empty: { fontSize: 13, color: "black", fontStyle: "italic" },
  badge: {
    display: "inline-block",
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 4,
    background: "#E6F1FB",
    color: "#185FA5",
    fontWeight: 500,
  },
};

export default function AdminPanel({ user, onLogout }) {
  const [patients, setPatients] = useState([]);
  const [pLoading, setPLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const loadPatients = () => {
    setPLoading(true);
    fetch(`${BASE}/patients`)
      .then((r) => r.json())
      .then((d) => setPatients(d.patient_ids || []))
      .catch(() => setPatients([]))
      .finally(() => setPLoading(false));
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleFile = (f) => {
    if (!f || !f.name.endsWith(".csv")) {
      setUploadError("Please select a valid CSV file");
      return;
    }
    setFile(f);
    setUploadError(null);
    setUploadResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const uploadCSV = async () => {
    if (!file) {
      setUploadError("No file selected");
      return;
    }
    setUploading(true);
    setUploadResult(null);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE}/upload-csv`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || res.status);
      setUploadResult(data);
      setFile(null);
      loadPatients();
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={s.root}>
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={s.topbar}>
        <div>
          <div style={s.title}>Admin Panel</div>
          <div style={s.subtitle}>
            Sepsis monitoring - system administration
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={s.badge}>Admin</span>
          <span style={{ fontSize: 13, color: "black" }}>{user.username}</span>
          <button style={s.logoutBtn} onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>

      <div style={s.grid2}>
        {/* Upload */}
        <div style={s.card}>
          <span style={s.sectionTitle}>Upload patient dataset</span>

          <div
            style={{
              ...s.uploadBox,
              borderColor: dragOver ? "#378ADD" : "#d4d4d4",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("csvInput").click()}
          >
            <div style={{ fontSize: 13, color: "black" }}>
              {file ? "" : "Drag & drop a CSV file here, or click to browse"}
            </div>
            {file && <div style={s.fileName}>{file.name}</div>}
            <input
              id="csvInput"
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              style={{ ...s.btn, opacity: !file || uploading ? 0.5 : 1 }}
              onClick={uploadCSV}
              disabled={!file || uploading}
            >
              {uploading ? "Uploading..." : "Upload CSV"}
            </button>
            {file && (
              <span style={{ fontSize: 12, color: "black" }}>
                ready to upload
              </span>
            )}
          </div>

          {uploadResult && (
            <div style={s.successBox}>
              Uploaded successfully — {uploadResult.rows_inserted} rows inserted
            </div>
          )}
          {uploadError && <div style={s.errorBox}>{uploadError}</div>}

          <div
            style={{
              marginTop: "1.5rem",
              borderTop: "0.5px solid #f0f0f0",
              paddingTop: "1rem",
            }}
          >
            <span style={s.label}>CSV format expected</span>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "black",
                lineHeight: 1.8,
              }}
            >
              patient_id, hour_from_admission,
              <br />
              heart_rate, respiratory_rate, spo2_pct,
              <br />
              temperature_c, systolic_bp, diastolic_bp,
              <br />
              wbc_count, lactate, creatinine, crp_level, hemoglobin
            </div>
          </div>
        </div>

        {/* Patient list */}
        <div style={s.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <span style={s.sectionTitle}>Admitted patients</span>
            <button
              style={{ ...s.logoutBtn, fontSize: 11 }}
              onClick={loadPatients}
            >
              Refresh
            </button>
          </div>

          {pLoading && <div style={s.empty}>Loading...</div>}

          {!pLoading && patients.length === 0 && (
            <div style={s.empty}>
              No patients found. Upload a CSV to get started.
            </div>
          )}

          {!pLoading && patients.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: "black",
                  marginBottom: "0.75rem",
                }}
              >
                {patients.length} patient{patients.length !== 1 ? "s" : ""}{" "}
                admitted
              </div>
              <div style={s.patientGrid}>
                {patients.map((id) => (
                  <div key={id} style={s.patientCard}>
                    <div style={s.patientId}>{id}</div>
                    <div style={s.patientLabel}>Patient ID</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
