// src/components/ConnectionBadge.tsx
export function ConnectionBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        isOnline ? "text-green-600" : "text-gray-400"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      {isOnline ? "연결됨" : "연결 끊김"}
    </span>
  );
}