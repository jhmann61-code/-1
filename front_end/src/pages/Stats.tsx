import { useMemo, useState } from "react";
import {
  Card, CardContent, FormControl, InputLabel, Select, MenuItem, Box, Typography,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import * as Api from "../lib/api";
import type { Detection } from "../lib/types";

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

const COLORS = {
  plastic: "#6366f1",
  glass: "#22d3ee",
  unknown: "#94a3b8", // 오분류 색상 (Slate-400)
  can: "#ef4444",
};

// 💡 정확한 수치와 계산식을 보여주는 커스텀 툴팁
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
        <p className="font-bold text-sm mb-2">{label}</p>
        <p className="text-slate-300">총 탐지 건수: <span className="font-bold text-white">{data.total}건</span></p>
        <p className="text-slate-300">오분류 판정: <span className="font-bold text-amber-400">{data.unknownCount}건</span></p>
        <p className="text-slate-300">관리자 교정: <span className="font-bold text-rose-400">{data.correctedCount}건</span></p>
        <hr className="border-slate-700 my-1" />
        <p className="text-emerald-400 font-bold">
          오분류율: {payload[0].value}% 
          <span className="text-[10px] text-slate-400 block font-normal">
            (계산식: 오분류 판정 및 교정 건수 / 총 탐지 건수 × 100)
          </span>
        </p>
      </div>
    );
  }
  return null;
};

type RangeOption = 7 | 30 | 90 | "all";
type BucketOption = "day" | "week" | "month" | "all";

export default function Stats() {
  const [range, setRange] = useState<RangeOption>(7);
  const [bucket, setBucket] = useState<BucketOption>("day");

  const to = new Date();
  const from = useMemo(() => {
    if (range === "all") return new Date(0); // 전체 기간: 필터링 사실상 없음
    return new Date(to.getTime() - range * 24 * 60 * 60 * 1000);
  }, [range]);

  const { data: detections = [] } = useQuery({
    queryKey: ["detections"],
    queryFn: () => Api.getDetections(),
    refetchInterval: 5000,
  });

  const filtered: Detection[] = detections.filter(
    (d) => new Date(d.detected_at) >= from && new Date(d.detected_at) <= to
  );

  const getBucketKey = (date: Date) => {
    if (bucket === "all") return "전체";
    if (bucket === "day") return fmtDate(date);
    if (bucket === "week") {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      return fmtDate(d);
    }
    return date.toISOString().slice(0, 7);
  };

  // 분리배출 구성비 데이터
  const mixData = useMemo(() => {
    const rows: Record<string, any> = {};
    filtered.forEach((d) => {
      const key = getBucketKey(new Date(d.detected_at));
      if (!rows[key]) rows[key] = { ts: key, plastic: 0, glass: 0, unknown: 0, can: 0 };
      if (d.category in rows[key]) rows[key][d.category]++;
    });
    return Object.values(rows).sort((a, b) => a.ts.localeCompare(b.ts));
  }, [filtered, bucket]);

  // 💡 오분류율 및 품질 지표 계산식 강화 (AI 오분류 카테고리 + 관리자 교정건을 모두 포함하여 산출)
  const misData = useMemo(() => {
    const rows: Record<string, any> = {};
    filtered.forEach((d) => {
      const key = getBucketKey(new Date(d.detected_at));
      if (!rows[key]) rows[key] = { ts: key, total: 0, unknownCount: 0, correctedCount: 0 };
      
      rows[key].total++;
      // AI가 'unknown'(오분류)으로 판정한 경우 혹은 상태가 'corrected'(오류 수정)된 경우 집계
      if (d.category === "unknown") {
        rows[key].unknownCount++;
      }
      if (d.status === "corrected") {
        rows[key].correctedCount++;
      }
    });

    return Object.values(rows)
      .sort((a, b) => a.ts.localeCompare(b.ts))
      .map((r) => {
        // 정확한 계산식 적용: (오분류 판정 수 + 교정 수) 또는 실질적 문제 지표를 백분율로 환산
        // 여기서는 오분류/교정이 발생한 총 부실 판정 건수를 기반으로 산출합니다.
        const issueCount = r.unknownCount + r.correctedCount;
        const rate = r.total > 0 ? +((issueCount / r.total) * 100).toFixed(1) : 0;
        
        return {
          ts: r.ts,
          오분류율: Math.min(rate, 100), // 최대 100% 넘지 않도록 제한
          total: r.total,
          unknownCount: r.unknownCount,
          correctedCount: r.correctedCount,
        };
      });
  }, [filtered, bucket]);

  return (
    <Box className="space-y-6 pb-10">
      {/* 필터 바 */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-3 items-center">
          <FormControl size="small" className="min-w-[140px]">
            <InputLabel>기간</InputLabel>
            <Select
              label="기간"
              value={range}
              onChange={(e) => setRange(e.target.value as RangeOption)}
            >
              <MenuItem value={7}>최근 7일</MenuItem>
              <MenuItem value={30}>최근 30일</MenuItem>
              <MenuItem value={90}>최근 90일</MenuItem>
              <MenuItem value="all">전체</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" className="min-w-[140px]">
            <InputLabel>버킷</InputLabel>
            <Select
              label="버킷"
              value={bucket}
              onChange={(e) => setBucket(e.target.value as BucketOption)}
            >
              <MenuItem value="day">일별</MenuItem>
              <MenuItem value="week">주별</MenuItem>
              <MenuItem value="month">월별</MenuItem>
              <MenuItem value="all">전체</MenuItem>
            </Select>
          </FormControl>
        </div>

        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          조회 기간: {range === "all" ? "전체" : `${fmtDate(from)} ~ ${fmtDate(to)}`}
        </div>
      </div>

      {/* 분리배출 구성비 */}
      <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-3 sm:p-6">
          <Typography variant="h6" className="font-bold text-slate-800 dark:text-white mb-1">
            분리배출 구성비
          </Typography>
          <Typography variant="body2" className="text-slate-500 mb-4">
            기간별 재질별(플라스틱, 유리, 오분류, 캔) 수거 및 분류 누적 분포입니다.
          </Typography>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={mixData} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="ts" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="plastic" name="플라스틱" stackId="mix" fill={COLORS.plastic} />
                <Bar dataKey="glass" name="유리" stackId="mix" fill={COLORS.glass} />
                <Bar dataKey="unknown" name="오분류" stackId="mix" fill={COLORS.unknown} />
                <Bar dataKey="can" name="캔" stackId="mix" fill={COLORS.can} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 오분류율 및 품질 지표 */}
      <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
            <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
              오분류 및 품질 지표 (%)
            </Typography>
            <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800 whitespace-normal sm:whitespace-nowrap self-start">
              계산식: (오분류 판정 + 관리자 교정 건수) ÷ 총 탐지 건수 × 100
            </span>
          </div>
          <Typography variant="body2" className="text-slate-500 mb-4">
            마우스를 그래프 위에 올리면 총 탐지 건수 대비 정확한 오분류 수치와 비율을 확인할 수 있습니다.
          </Typography>

          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={misData} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3.3" stroke="#e2e8f0" />
                <XAxis dataKey="ts" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="오분류율"
                  name="오분류율 (%)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  dot={{ r: 4, fill: "#ef4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}