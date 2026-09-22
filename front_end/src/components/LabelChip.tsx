// src/components/LabelChip.tsx
export default function LabelChip({
  label,
  prob,
}: {
  label: string;
  prob: number; // 0~1
}) {
  const pct = Math.round(prob * 100);
  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200">
      <span className="capitalize">{label}</span>
      <span className="text-slate-500">{pct}%</span>
    </span>
  );
}
