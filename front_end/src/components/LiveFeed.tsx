import { useCallback, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Paper } from "@mui/material";
import { useWebSocket } from "../lib/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import * as Api from "../lib/api";
import type { Detection } from "../lib/types";

export default function LiveFeed() {
  const { data } = useQuery({
    queryKey: ["detections"],
    queryFn: () => Api.getDetections(),
    refetchInterval: 5000,
  });

  const [rows, setRows] = useState<Detection[]>([]);

  useEffect(() => {
    if (data) setRows(data.slice(0, 10));
  }, [data]);

  const onMsg = useCallback((m: any) => {
    if (m.category) {
      setRows((prev) => [m, ...prev].slice(0, 10));
    }
  }, []);

  useWebSocket(onMsg, import.meta.env.VITE_WS_DETECTIONS_URL);

  return (
    <Paper className="rounded-2xl overflow-hidden">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>시간</TableCell>
            <TableCell>쓰레기통</TableCell>
            <TableCell>분류</TableCell>
            <TableCell>확률</TableCell>
            <TableCell>상태</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{new Date(r.detected_at).toLocaleString("ko-KR")}</TableCell>
              <TableCell>#{r.bin_id}</TableCell>
              <TableCell>{r.category}</TableCell>
              <TableCell>{(r.confidence * 100).toFixed(1)}%</TableCell>
              <TableCell>{r.status}</TableCell>
            </TableRow>
          ))}
          {!rows.length && (
            <TableRow>
              <TableCell colSpan={5} align="center">분류 기록 없음</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}