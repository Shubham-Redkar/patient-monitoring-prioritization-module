import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE = "http://localhost:8000/api/v1";

function StatusMessage({ msg }) {
  if (!msg) return null;
  const isError = msg.type === "error";
  return (
    <div
      className={`flex items-start gap-2 text-base px-4 py-3 rounded-lg border mb-5 ${
        isError
          ? "bg-red-50 border-red-200 text-red-800"
          : "bg-green-50 border-green-200 text-green-800"
      }`}
    >
      <span className="mt-0.5 font-bold">{isError ? "✕" : "✓"}</span>
      <span>{msg.text}</span>
    </div>
  );
}

export default function DataManagement() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [delPatientId, setDelPatientId] = useState("");
  const [delMsg, setDelMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadMsg(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setUploadMsg({ type: "error", text: "Only CSV files are allowed." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg({
        type: "error",
        text: "File too large — maximum size is 5 MB.",
      });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${BASE}/upload-csv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setUploadMsg({
        type: "success",
        text: `${data.rows_inserted} rows inserted successfully.`,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadMsg({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!delPatientId) return;
    if (
      !window.confirm(
        `Delete all records for patient ${delPatientId}? This cannot be undone.`,
      )
    )
      return;
    setDeleting(true);
    setDelMsg(null);
    try {
      const res = await fetch(`${BASE}/patients/${delPatientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Deletion failed");
      setDelMsg({
        type: "success",
        text: `Patient ${delPatientId} deleted — ${data.deleted_count} records removed.`,
      });
      setDelPatientId("");
    } catch (err) {
      setDelMsg({ type: "error", text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const fileSizeLabel = file
    ? file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`
    : null;

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Clinical Data Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Upload or remove patient records
            </p>
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
                onClick={() => navigate("/")}
              >
                ← Dashboard
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

      {/* Cards — same padding and grid as Dashboard, equal height columns */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* ── Upload card ── border-t-4 blue, matching Dashboard card style */}
          <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-blue-500">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Upload Patient Data
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                CSV files only · max 5 MB
              </p>
            </div>

            <div className="px-6 py-6">
              <StatusMessage msg={uploadMsg} />

              <form onSubmit={handleUpload} className="flex flex-col">
                {/* Drop zone grows to fill remaining space */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors flex flex-col items-center justify-center min-h-40 ${
                    file
                      ? "border-slate-400 bg-slate-50"
                      : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {file ? (
                    <div>
                      <p className="text-base font-medium text-slate-900 font-mono break-all">
                        {file.name}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {fileSizeLabel}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl mb-2">📂</p>
                      <p className="text-base text-slate-600">
                        Click to select a CSV file
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        or drag and drop
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-3 mt-5">
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="px-5 py-2.5 bg-slate-900 text-white text-base font-medium rounded-lg hover:bg-slate-700 disabled:opacity-40"
                  >
                    {uploading ? "Uploading…" : "Upload"}
                  </button>
                  {file && (
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setUploadMsg(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="px-5 py-2.5 border border-slate-300 text-slate-600 text-base rounded-lg hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ── Delete card ── border-t-4 red */}
          <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-red-500">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Delete Patient Records
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Permanently removes all readings for a patient
              </p>
            </div>

            <div className="px-6 py-6">
              <StatusMessage msg={delMsg} />

              <form onSubmit={handleDelete} className="flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Patient ID
                  </label>
                  <input
                    value={delPatientId}
                    onChange={(e) => setDelPatientId(e.target.value)}
                    placeholder="e.g. 123"
                    type="text"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 mb-4"
                  />
                  <button
                    type="submit"
                    disabled={deleting || !delPatientId}
                    className="px-5 py-2.5 bg-red-600 text-white text-base font-medium rounded-lg hover:bg-red-700 disabled:opacity-40"
                  >
                    {deleting ? "Deleting…" : "Delete Patient"}
                  </button>
                  <p className="text-sm text-slate-400 mt-4">
                    This action is permanent and cannot be reversed.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
