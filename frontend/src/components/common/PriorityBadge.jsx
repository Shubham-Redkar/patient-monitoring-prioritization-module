import { PRIORITY_THEME } from "../../config/clinical";

export default function PriorityBadge({ level = "Normal", manual = false }) {
  const theme = PRIORITY_THEME[level] || PRIORITY_THEME.Normal;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${theme.badge}`}>
      <span className={`h-2 w-2 rounded-full ${theme.bar}`} />
      {level}{manual && <span className="text-[10px] uppercase opacity-70">Manual</span>}
    </span>
  );
}
