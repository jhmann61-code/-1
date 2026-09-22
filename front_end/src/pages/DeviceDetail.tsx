import { useParams } from "react-router-dom";
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, Divider, LinearProgress } from "@mui/material";
import { useDevice } from "../lib/hooks";
import { useQuery } from "@tanstack/react-query";
import * as Api from "../lib/api";

export default function DeviceDetail() {
  const { id = "" } = useParams<{ id: string }>();

  const devQ = useDevice(id);
  const dev = devQ.data;

  const statusQ = useQuery({
    queryKey: ["bin-status", id],
    queryFn: () => Api.getBinStatus(Number(id)),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const detectionsQ = useQuery({
    queryKey: ["detections", id],
    queryFn: () => Api.getDetectionsByBin(Number(id)),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const status = statusQ.data;
  const detections = detectionsQ.data ?? [];

  return (
    <Box className="space-y-4">
      <Card className="rounded-2xl">
        <CardContent>
          <Typography variant="h6">{dev?.location ?? id}</Typography>
          <Typography variant="body2" className="mt-2 text-gray-500">
            위치: {dev?.location ?? "-"} · Ping: {dev?.ping_ms ?? "-"} ms
          </Typography>
          <Typography variant="body2" className="mt-1 text-gray-400">
            위도: {dev?.latitude ?? "-"} · 경도: {dev?.longitude ?? "-"}
          </Typography>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent>
          <Typography variant="subtitle1" className="mb-3">칸별 채움률</Typography>
          <Divider className="mb-3" />
          {status ? (
            <div className="space-y-3">
              {[
                { label: "플라스틱", value: status.plastic_pct },
                { label: "유리", value: status.glass_pct },
                { label: "오분류", value: status.unknown_pct },
                { label: "캔", value: status.can_pct },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={item.value}
                    color={item.value >= 80 ? "error" : item.value >= 50 ? "warning" : "success"}
                  />
                </div>
              ))}
              <Divider className="my-2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-500">
                <div>무게: {status.weight_g}g</div>
                <div>가스: {status.gas_level}</div>
                <div>온도: {status.temperature}°C</div>
                <div>습도: {status.humidity}%</div>
              </div>
            </div>
          ) : (
            <Typography className="text-gray-500">센서 데이터 없음</Typography>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent>
          <Typography variant="subtitle1" className="mb-2">최근 분류 기록</Typography>
          <List dense>
            {detections.map((r) => (
              <ListItem key={r.id}>
                <ListItemText
                  primary={`${r.category} · ${(r.confidence * 100).toFixed(1)}% · ${r.status}`}
                  secondary={new Date(r.detected_at).toLocaleString("ko-KR")}
                />
              </ListItem>
            ))}
            {!detections.length && (
              <Typography className="text-gray-500">분류 기록 없음</Typography>
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}