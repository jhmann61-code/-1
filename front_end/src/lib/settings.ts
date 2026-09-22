// src/lib/settings.ts
export type Settings = {
  thresholds: {
    capacityWarn: number;  // 가득 참 경고
    capacityCrit: number;  // 가득 참 치명
    latencyWarn: number;   // 평균 추론 지연 경고(ms)
  };
  polling: {
    kpi: number;       // ms
    devices: number;   // ms
    logs: number;      // ms
    alerts: number;    // ms
  };
};

export const DEFAULT_SETTINGS: Settings = {
  thresholds: {
    capacityWarn: 80,
    capacityCrit: 90,
    latencyWarn: 70,
  },
  polling: {
    kpi: 3000,
    devices: 4000,
    logs: 4000,
    alerts: 4000,
  },
};

const KEY = "hv_settings_v1";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // 얕은 머지로 누락 키 방지
    return {
      thresholds: { ...DEFAULT_SETTINGS.thresholds, ...(parsed.thresholds || {}) },
      polling: { ...DEFAULT_SETTINGS.polling, ...(parsed.polling || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}