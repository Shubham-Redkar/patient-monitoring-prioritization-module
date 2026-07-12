import { Line } from "react-chartjs-2";
import { createElement } from "react";

const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: { legend: { position: "bottom", labels: { boxWidth: 18, usePointStyle: true, pointStyle: "line" } } },
  scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(148,163,184,.18)" } } },
};

export default function TrendChart({ title, subtitle, icon, readings, fields }) {
  const data = {
    labels: readings.map((reading) => `${reading.hour}h`),
    datasets: fields.map((field) => ({
      label: field.label,
      data: readings.map((reading) => reading[field.key]),
      borderColor: field.color,
      backgroundColor: field.color,
      borderWidth: 2,
      pointRadius: readings.length > 25 ? 0 : 2,
      tension: 0.25,
    })),
  };
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><header className="border-b border-slate-200 px-5 py-4"><h3 className="flex items-center gap-2 font-semibold">{createElement(icon, { className: "h-4 w-4 text-cyan-700" })}{title}</h3><p className="mt-0.5 text-xs text-slate-500">{subtitle} · {readings.length} readings</p></header><div className="h-72 p-4">{readings.length ? <Line options={options} data={data} /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No readings available for this period</div>}</div></section>;
}
