type Status = "online" | "offline" | "degraded";

export default function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    online:   "bg-green-100 text-green-800 border border-green-200",
    offline:  "bg-gray-100 text-gray-700 border border-gray-200",
    degraded: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  };
  const label: Record<Status, string> = {
    online: "온라인",
    offline: "오프라인",
    degraded: "불안정",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
}
