import { api } from "./http";
import type { User, Device, BinStatus, Detection } from "./types";

// ── Auth ──────────────────────────────────────────────

export async function register(email: string, password: string, name: string): Promise<User> {
  const res = await api.post("/api/auth/register", { email, password, name });
  return res.data;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await api.post("/api/auth/login", { email, password });
  const token = res.data.access_token;
  sessionStorage.setItem("token", token);
  return token;
}

export async function getMe(): Promise<User> {
  const res = await api.get("/api/auth/me");
  return res.data;
}

// ── Bins ──────────────────────────────────────────────

export async function getBins(): Promise<Device[]> {
  const res = await api.get("/api/bins/");
  return res.data;
}

export async function getPublicBins(): Promise<Device[]> {
  const BASE = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${BASE}/api/bins/public`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });
  return res.json();
}

export async function getBin(id: number): Promise<Device> {
  const res = await api.get(`/api/bins/${id}`);
  return res.data;
}

export async function createBin(data: {
  location: string;
  latitude?: number;
  longitude?: number;
  ip?: string;
}): Promise<Device> {
  const res = await api.post("/api/bins/", data);
  return res.data;
}

export async function updateBin(id: number, data: {
  location: string;
  latitude?: number;
  longitude?: number;
  ip?: string;
}): Promise<Device> {
  const res = await api.put(`/api/bins/${id}`, data);
  return res.data;
}

export async function deleteBin(id: number): Promise<void> {
  await api.delete(`/api/bins/${id}`);
}

export async function getBinStatus(id: number): Promise<BinStatus> {
  const res = await api.get(`/api/bins/${id}/status`);
  return res.data;
}

export async function connectBin(id: number): Promise<{ connected: boolean; ping_ms: number }> {
  const res = await api.post(`/api/bins/${id}/connect`);
  return res.data;
}

// ── Sensors ───────────────────────────────────────────

export async function getSensorHistory(binId: number): Promise<BinStatus[]> {
  const res = await api.get(`/api/sensors/${binId}`);
  return res.data;
}

// ── Detections ────────────────────────────────────────

export async function getDetections(): Promise<Detection[]> {
  const res = await api.get("/api/detections/");
  return res.data;
}

export async function getDetectionsByBin(binId: number): Promise<Detection[]> {
  const res = await api.get(`/api/detections/bin/${binId}`);
  return res.data;
}

export async function getPendingDetections(): Promise<Detection[]> {
  const res = await api.get("/api/detections/pending");
  return res.data;
}

export async function correctDetection(id: number, correctedCategory: string): Promise<Detection> {
  const res = await api.put(`/api/detections/${id}/correct`, {
    corrected_category: correctedCategory,
  });
  return res.data;
}

export async function getCorrectionLogs() {
  const res = await api.get("/api/detections/correction-logs");
  return res.data;
}

// ── Health ────────────────────────────────────────────

export async function getHealth() {
  const res = await api.get("/");
  return res.data;
}

// ── Bins Status ───────────────────────────────────────

export async function getAllBinStatus(): Promise<BinStatus[]> {
  const res = await api.get("/api/bins/status/all");
  return res.data;
}

// ── Chat ──────────────────────────────────────────────

export async function sendChat(text: string, image?: File) {
  const formData = new FormData();
  formData.append("text", text);
  if (image) formData.append("image", image);

  const res = await api.post("/api/chat/", formData);
  return res.data;
}