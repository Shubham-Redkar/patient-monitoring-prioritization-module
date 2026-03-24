import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE = "http://localhost:8000/api/v1";

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
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setUploadMsg({ type: "error", text: "Only CSV files allowed" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg({ type: "error", text: "File too large (max 5MB)" });
      return;
    }

    setUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BASE}/upload-csv`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      setUploadMsg({
        type: "success",
        text: `Success: ${data.rows_inserted} rows inserted`,
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

    if (!window.confirm("Are you sure you want to delete this patient?"))
      return;

    setDeleting(true);
    setDelMsg(null);

    try {
      const res = await fetch(`${BASE}/patients/${delPatientId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Deletion failed");

      setDelMsg({
        type: "success",
        text: `Deleted patient ${delPatientId} (${data.deleted_count} records)`,
      });

      setDelPatientId("");
    } catch (err) {
      setDelMsg({ type: "error", text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      {/* Topbar */}{" "}
      <div className="flex items-center justify-between mb-8">
        {" "}
        <div>
          {" "}
          <div className="text-lg font-medium">
            Clinical Data Management
          </div>{" "}
          <div className="text-sm text-black mt-1">
            Upload or modify patient records{" "}
          </div>{" "}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {user?.username} ({user?.role})
          </span>

          {user?.role === "admin" && (
            <button
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm"
              onClick={() => navigate("/")}
            >
              Dashboard
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
      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-xl mx-auto">
        {/* Upload Section */}
        <div className="mb-10">
          <h3 className="text-base font-medium mb-4">
            Upload Patient Data (CSV)
          </h3>

          {uploadMsg && (
            <div
              className={`
            text-sm p-3 rounded mb-4
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

          <form onSubmit={handleUpload}>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
              Select CSV File
            </label>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-5"
            />

            <button
              type="submit"
              disabled={uploading || !file}
              className="px-4 py-2 text-sm font-medium bg-black text-white rounded-md disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Data"}
            </button>
          </form>
        </div>

        {/* Delete Section */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-base font-medium mb-4">Delete Patient Records</h3>

          {delMsg && (
            <div
              className={`
            text-sm p-3 rounded mb-4
            ${
              delMsg.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }
          `}
            >
              {delMsg.text}
            </div>
          )}

          <form onSubmit={handleDelete}>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
              Patient ID
            </label>

            <input
              value={delPatientId}
              onChange={(e) => setDelPatientId(e.target.value)}
              placeholder="e.g. 123"
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-5"
            />

            <button
              type="submit"
              disabled={deleting || !delPatientId}
              className="px-4 py-2 text-sm font-medium bg-red-100 text-red-700 border border-red-300 rounded-md disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Patient"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
