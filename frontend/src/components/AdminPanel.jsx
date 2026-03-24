import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const BASE = "http://localhost:8000/api/v1";

export default function AdminPanel() {
  const { user, logout, token } = useAuth();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  const fileRef = useRef();

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/patients`);
      const data = await res.json();
      setPatients(data.patient_ids || []);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleFile = (f) => {
    if (!f || !f.name.endsWith(".csv")) {
      setUploadMsg({ type: "error", text: "Only CSV files allowed" });
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      setUploadMsg({ type: "error", text: "File too large (max 5MB)" });
      return;
    }

    setFile(f);
    setUploadMsg(null);
  };

  const uploadCSV = async () => {
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BASE}/upload-csv`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      setUploadMsg({
        type: "success",
        text: `${data.rows_inserted} rows inserted`,
      });

      setFile(null);
      loadPatients();
    } catch (e) {
      setUploadMsg({ type: "error", text: e.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Topbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-semibold">Admin Panel</h1>
          <p className="text-sm text-gray-600">System data management</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">{user?.username}</span>

          <button onClick={logout} className="px-3 py-1.5 border rounded-md">
            Logout
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="bg-white p-5 rounded-xl border">
          <h3 className="text-sm font-medium mb-4">
            Upload Patient Data (CSV)
          </h3>

          <div
            onClick={() => fileRef.current.click()}
            className="border-dashed border rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
          >
            {file ? (
              <p className="text-sm font-mono">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Click to upload CSV</p>
            )}

            <input
              type="file"
              accept=".csv"
              ref={fileRef}
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>

          <button
            onClick={uploadCSV}
            disabled={!file || uploading}
            className="mt-4 px-4 py-2 bg-black text-white text-sm rounded-md disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>

          {uploadMsg && (
            <div
              className={`
            mt-4 text-sm px-3 py-2 rounded
            ${
              uploadMsg.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }
          `}
            >
              {uploadMsg.text}
            </div>
          )}
        </div>

        {/* Patients */}
        <div className="bg-white p-5 rounded-xl border">
          <div className="flex justify-between mb-4">
            <h3 className="text-sm font-medium">Patients</h3>

            <button
              onClick={loadPatients}
              className="text-xs border px-2 py-1 rounded"
            >
              Refresh
            </button>
          </div>

          {loading && <p className="text-sm text-gray-500">Loading...</p>}

          {!loading && patients.length === 0 && (
            <p className="text-sm text-gray-500">No patients found</p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {patients.map((id) => (
              <div
                key={id}
                className="border rounded-md p-2 text-center text-sm font-mono"
              >
                {id}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
