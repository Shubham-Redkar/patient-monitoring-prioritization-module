export const ROLES = Object.freeze({
  ADMIN: "admin",
  DOCTOR: "doctor",
  NURSE: "nurse",
});

export const ACCESS = Object.freeze({
  PATIENT_DETAILS: [ROLES.ADMIN, ROLES.DOCTOR],
  USER_MANAGEMENT: [ROLES.ADMIN],
  DATA_MANAGEMENT: [ROLES.ADMIN, ROLES.NURSE],
});

export const PRIORITIES = ["Critical", "High", "Medium", "Normal"];

export const PRIORITY_THEME = {
  Critical: { badge: "bg-red-100 text-red-800 border-red-300", bar: "bg-red-600", border: "border-red-300" },
  High: { badge: "bg-orange-100 text-orange-800 border-orange-300", bar: "bg-orange-500", border: "border-orange-300" },
  Medium: { badge: "bg-amber-100 text-amber-800 border-amber-300", bar: "bg-amber-500", border: "border-amber-300" },
  Normal: { badge: "bg-emerald-100 text-emerald-800 border-emerald-300", bar: "bg-emerald-600", border: "border-emerald-300" },
  Loading: { badge: "bg-slate-100 text-slate-600 border-slate-300", bar: "bg-slate-400", border: "border-slate-300" },
};

export const ROLE_THEME = {
  admin: "bg-violet-100 text-violet-800 border-violet-200",
  doctor: "bg-blue-100 text-blue-800 border-blue-200",
  nurse: "bg-emerald-100 text-emerald-800 border-emerald-200",
};
