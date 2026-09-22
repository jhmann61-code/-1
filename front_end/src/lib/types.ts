import { z } from "zod";

// ── 1. Users (사용자 권한 관리) ──────────────────────────
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["user", "admin"]), // DB의 "user" 또는 "admin"과 매칭
  created_at: z.string(),
});
export type User = z.infer<typeof UserSchema>;

// ── 2. Trash_Bins (쓰레기통 위치 및 정보) ─────────────────
export const DeviceSchema = z.object({
  id: z.number(),
  user_id: z.number().nullable().optional(),
  location: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  ping_ms: z.number().nullable().optional(),
  last_seen: z.string().nullable().optional(),
  is_online: z.boolean().optional(),
  created_at: z.string(),
  device_id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  firmware: z.string().nullable().optional(),
  fill_pct: z.number().nullable().optional(),
  ip: z.string().nullable().optional(),
});
export type Device = z.infer<typeof DeviceSchema>;

// ── 3. Bin_Status (실시간 상태 및 센서 값) ───────────────
export const BinStatusSchema = z.object({
  id: z.number(),
  bin_id: z.number(),
  plastic_pct: z.number(),  // 플라스틱 칸 적재량 (%)
  glass_pct: z.number(),    // 유리 칸 적재량 (%)
  unknown_pct: z.number(),  // 오분류 칸 적재량 (%)
  can_pct: z.number(),      // 캔 칸 적재량 (%)
  weight_g: z.number(),     // 전체 무게 (g)
  gas_level: z.number(),    // 가스 수치
  temperature: z.number(),  // 온도
  humidity: z.number(),     // 습도
  recorded_at: z.string(),
});
export type BinStatus = z.infer<typeof BinStatusSchema>;

// ── 4. Detections (AI 분류 결과 및 교정) ──────────────────
export const DetectionSchema = z.object({
  id: z.number(),
  bin_id: z.number(),
  category: z.enum(["plastic", "glass", "unknown", "can"]), // AI 판독 결과 (오분류 추가)
  confidence: z.number(),                                 // 0.0 ~ 1.0
  status: z.enum(["pending", "confirmed", "corrected"]),  // 검토 상태
  corrected_category: z.string().nullable(),              // 관리자가 수정한 정답
  image_path: z.string(),                                 // 일반 사진 경로
  corrected_image_path: z.string().nullable(),           // 재학습용 사진 경로
  detected_at: z.string(),
});
export type Detection = z.infer<typeof DetectionSchema>;