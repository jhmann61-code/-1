import { useState, useMemo } from "react";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import { Box, Typography, Paper, Chip, CircularProgress, Button } from "@mui/material";
import RouteIcon from "@mui/icons-material/Route";
import NavigationIcon from "@mui/icons-material/Navigation";
import { useQuery } from "@tanstack/react-query";
import * as Api from "../lib/api";
import type { Device, BinStatus } from "../lib/types";

const FILL_THRESHOLD = 70;

function nearestNeighbor(bins: (Device & { maxFill: number; status: BinStatus | null })[]) {
  if (bins.length === 0) return [];
  const visited = new Set<number>();
  const route: typeof bins = [];
  let current = bins[0];
  visited.add(current.id);
  route.push(current);

  while (visited.size < bins.length) {
    let nearest: typeof bins[0] | null = null;
    let minDist = Infinity;

    for (const bin of bins) {
      if (visited.has(bin.id)) continue;
      const dist = Math.sqrt(
        Math.pow((bin.latitude ?? 0) - (current.latitude ?? 0), 2) +
        Math.pow((bin.longitude ?? 0) - (current.longitude ?? 0), 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = bin;
      }
    }

    if (!nearest) break;
    visited.add(nearest.id);
    route.push(nearest);
    current = nearest;
  }

  return route;
}

function buildKakaoRouteUrl(route: (Device & { maxFill: number })[]) {
  if (route.length === 0) return "";
  if (route.length === 1) {
    const b = route[0];
    return `https://map.kakao.com/link/to/${encodeURIComponent(b.location)},${b.latitude},${b.longitude}`;
  }

  const limited = route.slice(0, 7);
  const start = limited[0];
  const end = limited[limited.length - 1];
  const waypoints = limited.slice(1, -1);

  let url = `https://map.kakao.com/link/by/car/${encodeURIComponent(start.location)},${start.latitude},${start.longitude}`;
  for (const wp of waypoints) {
    url += `/${encodeURIComponent(wp.location)},${wp.latitude},${wp.longitude}`;
  }
  url += `/${encodeURIComponent(end.location)},${end.latitude},${end.longitude}`;

  return url;
}

export default function RouteMap() {
  const [selectedBin, setSelectedBin] = useState<number | null>(null);
  const userRole = sessionStorage.getItem("userRole") ?? "guest";
  const isGuest = userRole === "guest";

  const binsQ = useQuery({
    queryKey: ["bins", userRole],
    queryFn: () => isGuest ? Api.getPublicBins() : Api.getBins(),
    refetchInterval: 5000,
  });

  const statusQ = useQuery({
    queryKey: ["bins-status-all"],
    queryFn: () => Api.getAllBinStatus(),
    refetchInterval: 5000,
    enabled: !isGuest,
  });

 const bins = Array.isArray(binsQ.data) ? binsQ.data : [];
 const statuses: BinStatus[] = Array.isArray(statusQ.data) ? statusQ.data : [];

  const binsWithFill = useMemo(() => {
    return bins
      .filter((b) => b.latitude && b.longitude)
      .map((b) => {
        const status = isGuest ? null : (statuses.find((s) => s.bin_id === b.id) ?? null);
        const maxFill = status
          ? Math.max(status.plastic_pct, status.glass_pct, status.unknown_pct, status.can_pct)
          : 0;
        return { ...b, maxFill, status };
      });
  }, [bins, statuses, isGuest]);

  const urgentBins = useMemo(
    () => binsWithFill.filter((b) => b.maxFill >= FILL_THRESHOLD),
    [binsWithFill]
  );

  const route = useMemo(
    () => isGuest ? [] : nearestNeighbor(urgentBins),
    [urgentBins, isGuest]
  );
  const routePath = route.map((b) => ({ lat: b.latitude!, lng: b.longitude! }));
  const kakaoRouteUrl = useMemo(() => buildKakaoRouteUrl(route), [route]);

  const center = binsWithFill.length > 0
    ? { lat: binsWithFill[0].latitude!, lng: binsWithFill[0].longitude! }
    : { lat: 37.5665, lng: 126.9780 };

  if (binsQ.isLoading) {
    return (
      <Box className="flex items-center justify-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      <Paper className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="min-w-0">
            <Typography variant="h5" className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <RouteIcon className="text-indigo-500" />
              {isGuest ? "스마트 쓰레기통 위치" : "실시간 최적 수거 경로"}
            </Typography>
            <Typography variant="body2" className="text-slate-500 dark:text-slate-400 mt-1">
              {isGuest
                ? "현재 설치된 스마트 쓰레기통 위치를 확인하세요."
                : `한 칸이라도 ${FILL_THRESHOLD}% 이상인 쓰레기통을 경로에 포함합니다.`}
            </Typography>
          </div>

          {!isGuest && (
            <div className="flex items-center gap-3 flex-wrap">
              <Chip label={`전체 ${binsWithFill.length}개`} color="primary" variant="outlined" />
              <Chip label={`수거 필요 ${urgentBins.length}개`} color="error" variant="outlined" />
              {route.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<NavigationIcon />}
                  onClick={() => window.open(kakaoRouteUrl, "_blank")}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  sx={{ borderRadius: "12px", fontWeight: "bold" }}
                >
                  길찾기 시작
                </Button>
              )}
            </div>
          )}

          {isGuest && (
            <Chip label={`총 ${binsWithFill.length}개 설치`} color="primary" variant="outlined" />
          )}
        </div>

        {!isGuest && route.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {route.map((bin, idx) => (
              <div key={bin.id} className="flex items-center gap-2">
                <Chip
                  size="small"
                  label={`${idx + 1}. ${bin.location} (최대 ${bin.maxFill.toFixed(0)}%)`}
                  color={bin.maxFill >= 90 ? "error" : "warning"}
                />
                {idx < route.length - 1 && <span className="text-slate-400">→</span>}
              </div>
            ))}
          </div>
        )}
      </Paper>

      <Box className="flex-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 relative">
        <Map center={center} style={{ width: "100%", height: "100%" }} level={3}>
          {binsWithFill.map((bin) => (
            <MapMarker
              key={bin.id}
              position={{ lat: bin.latitude!, lng: bin.longitude! }}
              onClick={() => setSelectedBin(selectedBin === bin.id ? null : bin.id)}
            >
              {selectedBin === bin.id && (
                <div style={{ padding: "8px", color: "#000", minWidth: "180px" }}>
                  <Typography variant="subtitle2" fontWeight="bold" className="mb-1">
                    {bin.location}
                  </Typography>
                  {!isGuest && bin.status ? (
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>플라스틱</span>
                        <span className={bin.status.plastic_pct >= FILL_THRESHOLD ? "text-red-500 font-bold" : ""}>
                          {bin.status.plastic_pct}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>유리</span>
                        <span className={bin.status.glass_pct >= FILL_THRESHOLD ? "text-red-500 font-bold" : ""}>
                          {bin.status.glass_pct}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>오분류</span>
                        <span className={bin.status.unknown_pct >= FILL_THRESHOLD ? "text-red-500 font-bold" : ""}>
                          {bin.status.unknown_pct}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>캔</span>
                        <span className={bin.status.can_pct >= FILL_THRESHOLD ? "text-red-500 font-bold" : ""}>
                          {bin.status.can_pct}%
                        </span>
                      </div>
                    </div>
                  ) : isGuest ? (
                    <Typography variant="body2" color="textSecondary">
                      📍 스마트 쓰레기통
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      센서 데이터 없음
                    </Typography>
                  )}
                </div>
              )}
            </MapMarker>
          ))}

          {!isGuest && routePath.length > 1 && (
            <Polyline
              path={routePath}
              strokeWeight={5}
              strokeColor="#ef4444"
              strokeOpacity={0.8}
              strokeStyle="shortdash"
            />
          )}
        </Map>

        {!isGuest && urgentBins.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
            <Paper className="p-6 text-center rounded-2xl">
              <Typography variant="h6" className="font-bold">
                ✅ 수거 필요한 쓰레기통이 없습니다
              </Typography>
              <Typography variant="body2" className="text-gray-500 mt-1">
                모든 칸이 {FILL_THRESHOLD}% 미만이에요.
              </Typography>
            </Paper>
          </div>
        )}
      </Box>
    </div>
  );
}