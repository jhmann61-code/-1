// src/components/SeverityBadge.tsx
type Sev = "주의" | "경고" | "치명";

export default function SeverityBadge({ level }: { level: Sev }) {
  const map: Record<Sev, string> = {
    주의:  "bg-amber-100 text-amber-800 border border-amber-200",
    경고:  "bg-orange-100 text-orange-800 border border-orange-200",
    치명:  "bg-red-100 text-red-800 border border-red-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[level]}`}>{level}</span>
  );
}
