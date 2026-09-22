import { useState } from "react";
import {
  Box, Typography, Paper, Card, CardMedia, CardContent,
  CardActions, Button, Chip, Select, MenuItem, FormControl, InputLabel,
  Snackbar, Alert, CircularProgress
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDevices } from "../lib/hooks";
import * as Api from "../lib/api";
import type { Detection, Device } from "../lib/types";

const CONFIDENCE_THRESHOLD = 0.9;

export default function ReviewBoard() {
  const queryClient = useQueryClient();
  const [corrections, setCorrections] = useState<Record<number, string>>({});
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" as "success" | "info" | "error" });

  const devicesQ = useDevices();
  const devices: Device[] = devicesQ.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["detections-pending"],
    queryFn: () => Api.getPendingDetections(),
    refetchInterval: 5000,
  });

  const pendingItems: Detection[] = (data ?? []).filter(
    (d) => d.confidence < CONFIDENCE_THRESHOLD
  );

  const getBinName = (bin_id: number) => {
    const device = devices.find((d) => d.id === bin_id);
    return device ? device.location : `쓰레기통 #${bin_id}`;
  };

  const handleCategoryChange = (id: number, newValue: string) => {
    setCorrections((prev) => ({ ...prev, [id]: newValue }));
  };

  const handleCorrect = async (item: Detection) => {
    const correctedValue = corrections[item.id];
    if (!correctedValue) {
      setToast({ open: true, message: "올바른 카테고리를 선택해주세요.", severity: "info" });
      return;
    }
    try {
      await Api.correctDetection(item.id, correctedValue);
      queryClient.invalidateQueries({ queryKey: ["detections-pending"] });
      setToast({ open: true, message: `오분류 데이터가 교정되었습니다. (ID: ${item.id})`, severity: "success" });
    } catch (e) {
      setToast({ open: true, message: "교정에 실패했습니다.", severity: "error" });
    }
  };

  const handleConfirm = async (item: Detection) => {
    try {
      await Api.correctDetection(item.id, item.category);
      queryClient.invalidateQueries({ queryKey: ["detections-pending"] });
      setToast({ open: true, message: "AI 분류 결과를 승인했습니다.", severity: "success" });
    } catch (e) {
      setToast({ open: true, message: "승인에 실패했습니다.", severity: "error" });
    }
  };

  if (isLoading) {
    return (
      <Box className="flex items-center justify-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="pb-10">
      <div className="mb-8">
        <Typography variant="h4" fontWeight="bold" className="text-slate-800 dark:text-white flex items-center gap-3">
          <WarningIcon className="text-amber-500 text-4xl" /> AI 오분류 의심 검토
        </Typography>
        <Typography className="text-slate-500 mt-2">
          신뢰도(Confidence)가 {(CONFIDENCE_THRESHOLD * 100).toFixed(0)}% 미만인 데이터입니다. 이미지를 확인하고 올바른 재질로 교정해주세요.
        </Typography>
      </div>

      {pendingItems.length === 0 ? (
        <Paper className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <CheckCircleIcon className="text-6xl text-emerald-500 mb-4" />
          <Typography variant="h6" className="text-slate-600 dark:text-slate-300">
            현재 검토가 필요한 데이터가 없습니다!
          </Typography>
        </Paper>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {pendingItems.map((item) => (
            <div key={item.id}>
              <Card className="rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                <CardMedia
                  component="img"
                  height="200"
                  image={`${import.meta.env.VITE_API_BASE_URL}/${item.image_path.replace(/\\/g, "/")}`}
                  alt="Trash Image"
                  className="h-48 object-cover"
                  onError={(e: any) => {
                    e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
                  }}
                />

                <CardContent>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Typography variant="subtitle2" className="text-slate-500">
                        {getBinName(item.bin_id)}
                      </Typography>
                      <Typography variant="caption" className="text-slate-400">
                        {new Date(item.detected_at).toLocaleString("ko-KR")}
                      </Typography>
                    </div>
                    <Chip
                      label={`신뢰도 ${(item.confidence * 100).toFixed(0)}%`}
                      size="small"
                      color={item.confidence < 0.5 ? "error" : "warning"}
                      className="font-bold"
                    />
                  </div>

                  <Typography variant="h6" className="font-bold mb-4 dark:text-white">
                    AI 판독: <span className="text-indigo-500 uppercase">{item.category}</span>
                  </Typography>

                  <FormControl fullWidth size="small">
                    <InputLabel id={`select-label-${item.id}`}>실제 정답 선택</InputLabel>
                    <Select
                      labelId={`select-label-${item.id}`}
                      value={corrections[item.id] || ""}
                      label="실제 정답 선택"
                      onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                    >
                      <MenuItem value="plastic">Plastic (플라스틱)</MenuItem>
                      <MenuItem value="can">Can (캔/고철)</MenuItem>
                      <MenuItem value="unknown">Unknown (오분류)</MenuItem>
                      <MenuItem value="glass">Glass (유리)</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>

                <CardActions className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => handleConfirm(item)}
                    className="w-5/12 text-slate-600 dark:text-slate-300"
                  >
                    맞음 (승인)
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleCorrect(item)}
                    className="w-6/12 bg-indigo-600 hover:bg-indigo-700"
                  >
                    오류 수정
                  </Button>
                </CardActions>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}