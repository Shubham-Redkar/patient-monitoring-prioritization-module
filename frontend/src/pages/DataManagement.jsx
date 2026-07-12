import { useRef, useState } from "react";
import { FileUp, Trash2, Upload, X } from "lucide-react";
import { patientApi, apiRequest } from "../api/client";
import StatusMessage from "../components/common/StatusMessage";
import AppShell from "../components/layout/AppShell";
import { MAX_UPLOAD_BYTES } from "../config/app";
import { useAuth } from "../context/AuthContext";

const megabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function DataManagement() {
  const { token } = useAuth();
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [busy, setBusy] = useState("");

  const upload = async (event) => {
    event.preventDefault();
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > MAX_UPLOAD_BYTES) {
      setUploadStatus({ type: "error", text: `Choose a CSV file no larger than ${megabytes(MAX_UPLOAD_BYTES)}.` }); return;
    }
    setBusy("upload"); setUploadStatus(null);
    const body = new FormData(); body.append("file", file);
    try {
      const result = await apiRequest("/upload-csv", { token, method: "POST", body });
      setUploadStatus({ type: "success", text: `${result.rows_inserted} readings imported successfully.` });
      setFile(null); if (inputRef.current) inputRef.current.value = "";
    } catch (error) { setUploadStatus({ type: "error", text: error.message }); }
    finally { setBusy(""); }
  };

  const remove = async (event) => {
    event.preventDefault();
    if (!patientId || !window.confirm(`Permanently delete all records for patient ${patientId}?`)) return;
    setBusy("delete"); setDeleteStatus(null);
    try {
      const result = await patientApi.remove(token, patientId);
      setDeleteStatus({ type: "success", text: `${result.deleted_count} records removed for patient ${patientId}.` }); setPatientId("");
    } catch (error) { setDeleteStatus({ type: "error", text: error.message }); }
    finally { setBusy(""); }
  };

  return <AppShell title="Clinical Data Operations" subtitle="Controlled import and removal of patient monitoring records">
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white"><header className="border-b border-slate-200 p-5"><h2 className="flex items-center gap-2 font-semibold"><Upload className="h-4 w-4 text-cyan-700" />Import monitoring data</h2><p className="mt-1 text-sm text-slate-500">Validated CSV only · maximum {megabytes(MAX_UPLOAD_BYTES)}</p></header><form onSubmit={upload} className="space-y-4 p-5"><StatusMessage message={uploadStatus} /><button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-cyan-500"><FileUp className="mb-3 h-10 w-10 text-slate-400" /><strong className="text-sm">{file?.name || "Select patient CSV"}</strong><span className="mt-1 text-xs text-slate-500">{file ? megabytes(file.size) : "Click to browse"}</span></button><input ref={inputRef} hidden type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] || null); setUploadStatus(null); }} /><div className="flex gap-2"><button disabled={!file || busy === "upload"} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy === "upload" ? "Importing…" : "Import data"}</button>{file && <button type="button" onClick={() => setFile(null)} className="flex items-center gap-1 rounded-md border border-slate-300 px-4 py-2 text-sm"><X className="h-4 w-4" />Clear</button>}</div></form></section>
      <section className="rounded-xl border border-red-200 bg-white"><header className="border-b border-red-100 p-5"><h2 className="flex items-center gap-2 font-semibold text-red-900"><Trash2 className="h-4 w-4" />Remove patient dataset</h2><p className="mt-1 text-sm text-slate-500">Permanent administrative operation with confirmation</p></header><form onSubmit={remove} className="space-y-4 p-5"><StatusMessage message={deleteStatus} /><label className="block text-sm font-medium text-slate-700">Patient ID<input value={patientId} onChange={(event) => setPatientId(event.target.value)} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Enter exact patient ID" /></label><div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">This removes all readings and metadata for the selected patient and cannot be undone.</div><button disabled={!patientId || busy === "delete"} className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy === "delete" ? "Removing…" : "Permanently remove"}</button></form></section>
    </div>
  </AppShell>;
}
