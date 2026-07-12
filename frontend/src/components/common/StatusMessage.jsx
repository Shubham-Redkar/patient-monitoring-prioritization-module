import { CheckCircle, XCircle } from "lucide-react";

export default function StatusMessage({ message, className = "" }) {
  if (!message) return null;
  const error = message.type === "error";
  const Icon = error ? XCircle : CheckCircle;
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message.text}</span>
    </div>
  );
}
