// src/pages/CameraLive.tsx
//
// 새 포트·새 ngrok 터널 없이, 기존 서버 주소에 붙은 WebSocket(/api/camera/ws)으로
// 라즈베리파이가 올리는 프레임을 실시간으로 받아 표시.

import { useEffect, useRef, useState } from "react";

// 기존 백엔드와 같은 base URL 사용 (새 주소 필요 없음)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function toWsUrl(httpUrl: string) {
  return httpUrl.replace(/^http/, "ws") + "/api/camera/ws";
}

export default function CameraLive() {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!API_BASE_URL) return;

    const ws = new WebSocket(toWsUrl(API_BASE_URL));
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "frame") {
        setFrameUrl(`data:image/jpeg;base64,${msg.data}`);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          실시간 카메라
        </h1>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            connected
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-slate-500/10 text-slate-500"
          }`}
        >
          {connected ? "연결됨" : "연결 끊김"}
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video flex items-center justify-center">
        {frameUrl ? (
          <img src={frameUrl} alt="실시간 카메라" className="w-full h-auto block" />
        ) : (
          <span className="text-slate-400 text-sm">프레임 대기 중...</span>
        )}
      </div>

      <p className="text-xs text-slate-400">
        약 0.3초 간격(초당 약 3장)으로 갱신됩니다. 실제 영상처럼 매끄럽진 않지만
        새 포트나 별도 ngrok 터널 없이 기존 서버 주소만으로 동작해요.
      </p>
    </div>
  );
}