// src/components/AlertsBell.tsx
import { useState } from "react";
import {
  Badge,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Button,
  Snackbar,
  Alert,
  Box,
  Chip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useAlerts, useAckAlert } from "../lib/hooks";
import type { DeviceEvent } from "../lib/types";

function kindLabel(k: string) {
  if (k === "alert/capacity") return "수거 필요";
  if (k === "alert/latency") return "지연 경고";
  if (k === "alert/offline") return "오프라인";
  return k;
}

export default function AlertsBell() {
  // 활성 알림만 구독 (InfiniteQuery)
  const q = useAlerts(true);
  const ack = useAckAlert();

  // ✅ InfiniteQuery 결과를 평탄화해서 리스트로 변환
  const items: DeviceEvent[] =
    q.data?.pages?.flatMap((p: { items: DeviceEvent[] }) => p.items) ?? [];

  // 최신순 정렬(필요 시)
  items.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const count = items.length;

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<null | { msg: string; sev?: "success" | "error" }>(null);

  const handleAck = (id: number) => {
    ack.mutate(String(id), {
      onSuccess: () => setToast({ msg: "알림을 확인 처리했습니다.", sev: "success" }),
      onError: () => setToast({ msg: "확인 처리 실패", sev: "error" }),
    });
  };

  return (
    <>
      {/* 종 아이콘 */}
      <IconButton color="inherit" onClick={() => setOpen(true)}>
        <Badge badgeContent={count} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* 사이드 드로어 */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box className="w-[360px] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">알림</h3>
            <Chip
              size="small"
              color={count ? "error" : "default"}
              label={count ? `${count}건` : "없음"}
            />
          </div>

          <List dense>
            {items.map((ev) => (
              <ListItem
                key={ev.id}
                secondaryAction={
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAck(ev.id)}
                    disabled={ack.isPending}
                  >
                    확인
                  </Button>
                }
              >
                <ListItemText
                  primary={`${kindLabel(ev.kind)} · ${ev.device_id}`}
                  secondary={
                    <>
                      <span className="text-gray-600">
                        {new Date(ev.created_at).toLocaleString("ko-KR")}
                      </span>
                      {ev.payload?.message ? (
                        <>
                          {" — "}
                          <span>{String(ev.payload.message)}</span>
                        </>
                      ) : null}
                    </>
                  }
                />
              </ListItem>
            ))}
            {!items.length && (
              <Box className="text-sm text-gray-500 px-2 py-4">표시할 알림이 없습니다.</Box>
            )}
          </List>
        </Box>
      </Drawer>

      {/* 토스트 */}
      <Snackbar
        open={!!toast}
        autoHideDuration={2000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast?.sev ?? "success"}>{toast?.msg}</Alert>
      </Snackbar>
    </>
  );
}
