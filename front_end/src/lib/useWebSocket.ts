// src/lib/useWebSocket.ts
import { useEffect, useRef, useState } from "react";

export function useWebSocket(onMsg: (m: any) => void, url?: string) {
  const ref = useRef<WebSocket | null>(null);
  const [ok, setOk] = useState(false);

  const onMsgRef = useRef(onMsg);
  useEffect(() => {
    onMsgRef.current = onMsg;
  }, [onMsg]);

  useEffect(() => {
    let retry = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      const wsUrl = url || (import.meta.env.VITE_WS_URL as string);
      const ws = new WebSocket(wsUrl);
      ref.current = ws;

      ws.onopen = () => {
        setOk(true);
        retry = 0;
      };

      ws.onmessage = (e) => {
        try {
          onMsgRef.current(JSON.parse(e.data));
        } catch {}
      };

      ws.onclose = () => {
        setOk(false);
        if (cancelled) return;
        reconnectTimer = setTimeout(connect, Math.min(30000, 1000 * 2 ** retry++));
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ref.current?.close();
    };
  }, [url]); // url이 바뀌면 재연결

  return { connected: ok };
}