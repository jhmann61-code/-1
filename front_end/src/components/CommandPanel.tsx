// src/components/CommandPanel.tsx
import { useState } from "react";
import { Button, Paper, Stack, TextField, Typography } from "@mui/material";

// ✨ [변경됨] 백엔드(axios) 대신 가짜 API 함수 import
import { sendCommand } from "../lib/api";

export default function CommandPanel() {
  const [deviceId, setDeviceId] = useState("BIN-01");
  const [label, setLabel] = useState("can");
  const [weight, setWeight] = useState(120);
  const [isLoading, setIsLoading] = useState(false);

  const send = async () => {
    setIsLoading(true);
    
    // ✨ [변경됨] 실제 API 호출 -> Mock 함수 호출
    // await api.post("/commands/action", ...); (제거됨)
    await sendCommand(deviceId, "sort", { label, weight });
    
    setIsLoading(false);
    alert(`[Mock] 명령 전송 완료!\n\nTarget: ${deviceId}\nAction: sort\nLabel: ${label}`);
  };

  return (
    <Paper className="p-6 rounded-2xl shadow-sm border border-slate-200">
      <Typography variant="h6" className="font-bold mb-4 text-slate-800">
        수동 제어 패널 (Manual Command)
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          size="small"
          label="Device ID"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="w-32"
        />
        <TextField
          size="small"
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-32"
        />
        <TextField
          size="small"
          label="Weight (g)"
          type="number"
          value={weight}
          onChange={(e) => setWeight(+e.target.value)}
          className="w-32"
        />
        <Button 
          variant="contained" 
          onClick={send} 
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 font-bold"
        >
          {isLoading ? "전송 중..." : "분류 실행"}
        </Button>
      </Stack>
    </Paper>
  );
}