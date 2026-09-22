// src/pages/Settings.tsx
import { useState } from "react";
import { Card, CardContent, TextField, Button } from "@mui/material";
import { useSettings } from "../lib/SettingsContext";

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const [local, setLocal] = useState(settings);

  const onSave = () => update(local);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">설정</h1>

      {/* 임계치 */}
      <Card className="rounded-2xl">
        <CardContent>
          <div className="font-medium mb-3">임계치</div>

          {/* ✅ Accuracy Warn 제거 → 3열로 조정 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              fullWidth
              label="적재량 경고 (%)"
              type="number"
              helperText="이 값을 넘으면 대시보드에 주의 표시"
              value={local.thresholds.capacityWarn}
              onChange={(e) =>
                setLocal({
                  ...local,
                  thresholds: {
                    ...local.thresholds,
                    capacityWarn: Number(e.target.value),
                  },
                })
              }
            />
            <TextField
              fullWidth
              label="적재량 위험 (%)"
              type="number"
              helperText="이 값을 넘으면 위험(빨간색)으로 표시"
              value={local.thresholds.capacityCrit}
              onChange={(e) =>
                setLocal({
                  ...local,
                  thresholds: {
                    ...local.thresholds,
                    capacityCrit: Number(e.target.value),
                  },
                })
              }
            />
            <TextField
              fullWidth
              label="지연시간 경고 (ms)"
              type="number"
              helperText="응답 속도가 이보다 느리면 경고"
              value={local.thresholds.latencyWarn}
              onChange={(e) =>
                setLocal({
                  ...local,
                  thresholds: {
                    ...local.thresholds,
                    latencyWarn: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 폴링 주기 */}
      <Card className="rounded-2xl">
        <CardContent>
          <div className="font-medium mb-3">폴링 주기 (ms)</div>
          <p className="text-sm text-gray-500 mb-3">
            화면이 서버에 새 데이터를 얼마나 자주 물어볼지 정하는 값이에요. 값이 작을수록 빨리 갱신되지만 서버 부담이 늘어나요.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {([
              ["kpi", "KPI", "대시보드 상단 통계 갱신 주기"],
              ["devices", "기기", "기기 목록·상태 갱신 주기"],
              ["logs", "로그", "로그 목록 갱신 주기"],
              ["alerts", "알림", "알림 목록 갱신 주기"],
            ] as const).map(([key, label, help]) => (
              <TextField
                key={key}
                fullWidth
                label={`${label} 폴링`}
                type="number"
                helperText={help}
                value={(local.polling as any)[key]}
                onChange={(e) =>
                  setLocal({
                    ...local,
                    polling: {
                      ...local.polling,
                      [key]: Number(e.target.value),
                    } as any,
                  })
                }
              />
            ))}
          </div>

          <div className="mt-4">
            <Button variant="contained" onClick={onSave}>
              저장
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}