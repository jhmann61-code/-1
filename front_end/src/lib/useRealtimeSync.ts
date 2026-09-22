// src/lib/useRealtimeSync.ts
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./useWebSocket";
import type { Device } from "./types";

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  // 1. 센서/상태 업데이트 (/ws/status) → devices 캐시에 바로 반영
  useWebSocket((msg) => {
    if (!msg.bin_id) return;

    queryClient.setQueryData(["devices"], (old: Device[] | undefined) => {
      if (!old) return old;
      return old.map((d) =>
        d.id === msg.bin_id ? { ...d, ...msg } : d
      );
    });

    queryClient.setQueryData(["device", msg.bin_id], (old: any) =>
      old ? { ...old, ...msg } : old
    );
  }, import.meta.env.VITE_WS_URL);

  // 2. 새 감지 결과 (/ws/detections) → 관련 목록 새로고침
  useWebSocket((msg) => {
    if (!msg.category) return;

    queryClient.invalidateQueries({ queryKey: ["detections"] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  }, import.meta.env.VITE_WS_DETECTIONS_URL);
}