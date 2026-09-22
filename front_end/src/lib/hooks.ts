// src/lib/hooks.ts
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as MockApi from "./api"; // Mock API 함수들 사용

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => MockApi.getHealth(),
    refetchInterval: 15_000,
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => MockApi.getBins(),
    refetchInterval: 5000,
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ["device", id],
    queryFn: async () => {
      const dev = await MockApi.getBin(Number(id));
      if (!dev) throw new Error("Device not found");
      return dev;
    },
    refetchInterval: 5000,
    enabled: !!id,
  });
}

export function useInferences(params?: { deviceId?: string; limit?: number }) {
  return useInfiniteQuery({
    queryKey: ["inferences", params?.deviceId],
    queryFn: ({ pageParam = 1 }) => MockApi.getInferences({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useEvents(params?: {
  deviceId?: string;
  kind?: string; 
  active?: boolean;
  limit?: number;
}) {
  return useInfiniteQuery({
    queryKey: ["events", params],
    queryFn: ({ pageParam = 1 }) => MockApi.getEvents({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useAlerts(active = true, device?: string) {
  return useEvents({ kind: "alert", active, deviceId: device });
}

export function useAckAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise(r => setTimeout(r, 500)); // Mock delay
      // ✅ [수정됨] 사용하지 않는 변수 오류 해결을 위해 콘솔 출력
      console.log(`[Mock] Ack alert id: ${id}`);
      return { ok: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeviceLogs(id: string, limit = 20) {
  return useEvents({ deviceId: id, limit });
}

export function useStatsMix(from: string, to: string, bucket: "day" | "week" | "month") {
  return useQuery({
    queryKey: ["stats", "mix", from, to, bucket],
    queryFn: () => MockApi.getStatsMix(from, to, bucket),
  });
}

export function useStatsMisclass(from: string, to: string) {
  return useQuery({
    queryKey: ["stats", "misclass", from, to],
    queryFn: () => MockApi.getStatsMisclass(from, to),
  });
}

export function useDeviceFillSeries(id: string, from: string, to: string) {
  return useQuery({
    queryKey: ["stats", "fill", id, from, to],
    queryFn: () => MockApi.getDeviceFillSeries(id, from, to),
    enabled: !!id,
  });
}

export function useCommandSort() {
  return useMutation({
    mutationFn: (payload: { deviceId: string; label: string; weight?: number }) => 
      MockApi.sendCommand(payload.deviceId, "sort", payload),
  });
}

export function usePickupPlan() {
    return useQuery({ queryKey: ["pickup-plan"], queryFn: () => null });
}

export function useDeviceAlerts(deviceId: string) {
  return useEvents({ deviceId, kind: "alert", active: true });
}