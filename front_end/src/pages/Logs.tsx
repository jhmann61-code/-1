import {
  Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, Box, Button, Chip, Pagination, TextField
} from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDevices } from "../lib/hooks";
import * as Api from "../lib/api";
import type { Detection, Device } from "../lib/types";

const fmt = (iso: string) => new Date(iso).toLocaleString("ko-KR");

const STATUS_COLOR: Record<string, "warning" | "success" | "error" | "default"> = {
  pending: "warning",
  confirmed: "success",
  corrected: "error",
};

const CATEGORY_LABEL: Record<string, string> = {
  plastic: "플라스틱",
  glass: "유리",
  unknown: "오분류",
  can: "캔",
};

// Review 페이지와 동일한 이미지 경로 리졸브 방식
const resolveImagePath = (path?: string | null) => {
  if (!path) return null;
  return `${import.meta.env.VITE_API_BASE_URL}/${path.replace(/\\/g, "/")}`;
};

export default function Logs() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [limit, setLimit] = useState<number>(20);
  const [page, setPage] = useState<number>(1);

  const devicesQ = useDevices();
  const devices: Device[] = devicesQ.data ?? [];

  const { data: detections = [], isFetching, refetch } = useQuery({
    queryKey: ["detections"],
    queryFn: () => Api.getDetections(),
    refetchInterval: 5000,
  });

  const filtered: Detection[] = detections
    .filter((d) => categoryFilter === "all" || d.category === categoryFilter)
    .filter((d) => deviceFilter === "all" || String(d.bin_id) === deviceFilter)
    .filter((d) => {
      if (!dateFrom) return true;
      return new Date(d.detected_at) >= new Date(dateFrom);
    })
    .filter((d) => {
      if (!dateTo) return true;
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      return new Date(d.detected_at) <= to;
    });

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const handleFilterChange = (setter: (v: any) => void) => (e: any) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <Card className="rounded-2xl">
      <CardContent>
        <div className="flex gap-3 mb-3 flex-wrap items-center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>종류</InputLabel>
            <Select
              label="종류"
              value={categoryFilter}
              onChange={handleFilterChange(setCategoryFilter)}
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="plastic">플라스틱</MenuItem>
              <MenuItem value="glass">유리</MenuItem>
              <MenuItem value="unknown">오분류</MenuItem>
              <MenuItem value="can">캔</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>디바이스</InputLabel>
            <Select
              label="디바이스"
              value={deviceFilter}
              onChange={handleFilterChange(setDeviceFilter)}
            >
              <MenuItem value="all">전체</MenuItem>
              {devices.map((d) => (
                <MenuItem key={d.id} value={String(d.id)}>
                  {d.location}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="시작 날짜"
            value={dateFrom}
            onChange={handleFilterChange(setDateFrom)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            type="date"
            label="종료 날짜"
            value={dateTo}
            onChange={handleFilterChange(setDateTo)}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>페이지 크기</InputLabel>
            <Select
              label="페이지 크기"
              value={limit}
              onChange={handleFilterChange(setLimit)}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </div>

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>사진</TableCell>
                <TableCell>시간</TableCell>
                <TableCell>쓰레기통</TableCell>
                <TableCell>분류</TableCell>
                <TableCell>신뢰도</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>수정 분류</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((row: Detection) => {
                const thumb = resolveImagePath((row as any).image_path);
                return (
                  <TableRow key={row.id}>
                    <TableCell sx={{ py: 1.5 }}>
                      {thumb ? (
                        <Box
                          component="img"
                          src={thumb}
                          alt={CATEGORY_LABEL[row.category] ?? row.category}
                          loading="lazy"
                          onError={(e: any) => {
                            e.target.src = "https://via.placeholder.com/160x100?text=No+Image";
                          }}
                          sx={{
                            width: 160,
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            display: "block",
                            boxShadow: 1,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 160,
                            height: 100,
                            borderRadius: 2,
                            border: "1px dashed",
                            borderColor: "divider",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "text.disabled",
                            fontSize: 13,
                          }}
                        >
                          No Image
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmt(row.detected_at)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {devices.find((d) => d.id === row.bin_id)?.location ?? `#${row.bin_id}`}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <span className="font-bold uppercase">
                        {CATEGORY_LABEL[row.category] ?? row.category}
                      </span>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{(row.confidence * 100).toFixed(1)}%</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Chip
                        size="small"
                        label={row.status}
                        color={STATUS_COLOR[row.status] ?? "default"}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {row.corrected_category
                        ? CATEGORY_LABEL[row.corrected_category] ?? row.corrected_category
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!paginated.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-gray-500">
                    표시할 로그가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box className="flex justify-between items-center mt-4 flex-wrap gap-3">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
          <Button
            variant="outlined"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            새로고침
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}