import { useNavigate } from "react-router-dom";
import { Typography, CircularProgress, IconButton } from "@mui/material";
import WifiIcon from "@mui/icons-material/Wifi";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { useDevices } from "../lib/hooks";
import { useQuery } from "@tanstack/react-query";
import * as Api from "../lib/api";
import type { Device } from "../lib/types";

import ThroughputArea from "../components/ThroughputArea";
import WasteMixPie from "../components/WasteMixPie";

function PremiumWidget({
  title, value, unit, icon: Icon, trend, link, loading = false,
  colorFrom, colorTo, iconColor,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: any;
  trend?: string;
  link?: string;
  loading?: boolean;
  colorFrom: string;
  colorTo: string;
  iconColor: string;
}) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => link && navigate(link)}
      className="group relative overflow-hidden rounded-3xl p-[1px] cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative h-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[23px] p-6 border border-white/40 dark:border-slate-700/50 shadow-sm">
        <div className={`absolute -right-6 -top-6 w-24 h-24 ${colorFrom} opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity duration-500`} />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <Typography variant="caption" className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
              {title}
            </Typography>
            <div className="flex items-baseline gap-1 mt-1">
              <Typography variant="h3" className="font-extrabold text-slate-800 dark:text-white tracking-tight">
                {loading ? <CircularProgress size={30} color="inherit" /> : value}
              </Typography>
              {unit && <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{unit}</span>}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 group-hover:scale-110 transition-transform duration-300">
            <Icon className={iconColor} sx={{ fontSize: 24 }} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {trend ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUpIcon className="text-emerald-600 dark:text-emerald-400" sx={{ fontSize: 16 }} />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{trend} vs last week</span>
            </div>
          ) : (
            <div className="h-6" />
          )}
          <IconButton size="small" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const devicesQ = useDevices();

  const detectionsQ = useQuery({
    queryKey: ["detections"],
    queryFn: () => Api.getDetections(),
    refetchInterval: 5000,
  });

  const pendingQ = useQuery({
    queryKey: ["detections-pending"],
    queryFn: () => Api.getPendingDetections(),
    refetchInterval: 5000,
  });

  const devices: Device[] = devicesQ.data ?? [];
  const detections = detectionsQ.data ?? [];
  const pendingCount = pendingQ.data?.length ?? 0;
  const totalDevices = devices.length;

  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  const inf24h = detections.filter(
    (r) => new Date(r.detected_at).getTime() >= since24h
  ).length;

  const chartAreaData = (() => {
    const now = new Date();
    const hours: { time: string; count: number }[] = [];

    for (let i = 7; i >= 0; i--) {
      const h = new Date(now);
      h.setHours(now.getHours() - i, 0, 0, 0);
      const nextH = new Date(h);
      nextH.setHours(h.getHours() + 1);

      const count = detections.filter((d) => {
        const t = new Date(d.detected_at).getTime();
        return t >= h.getTime() && t < nextH.getTime();
      }).length;

      hours.push({
        time: `${String(h.getHours()).padStart(2, "0")}:00`,
        count,
      });
    }
    return hours;
  })();

  const categoryCount = { plastic: 0, glass: 0, unknown: 0, can: 0 };
  detections.forEach((d) => {
    if (d.category in categoryCount) {
      categoryCount[d.category as keyof typeof categoryCount]++;
    }
  });
  const total = categoryCount.plastic + categoryCount.glass + categoryCount.unknown + categoryCount.can;
  const chartPieData = [
    { name: "Can", value: categoryCount.can, total },
    { name: "Glass", value: categoryCount.glass, total },
    { name: "Unknown", value: categoryCount.unknown, total },
    { name: "Plastic", value: categoryCount.plastic, total },
  ];

  return (
    <div className="space-y-8 pb-10 relative">
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-sky-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-lg">
            Good afternoon, Admin 👋
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <PremiumWidget
          title="Total Devices"
          value={totalDevices}
          icon={WifiIcon}
          colorFrom="from-blue-400"
          colorTo="to-indigo-500"
          iconColor="text-indigo-500"
          link="/devices"
          loading={devicesQ.isLoading}
        />
        <PremiumWidget
          title="Avg Fill Level"
          value={0}
          unit="%"
          icon={DeleteIcon}
          colorFrom="from-emerald-300"
          colorTo="to-teal-500"
          iconColor="text-teal-500"
          link="/stats"
          loading={devicesQ.isLoading}
        />
        <PremiumWidget
          title="Daily Inferences"
          value={inf24h}
          icon={VisibilityIcon}
          colorFrom="from-amber-300"
          colorTo="to-orange-500"
          iconColor="text-orange-500"
          link="/logs"
          loading={detectionsQ.isLoading}
        />
        <PremiumWidget
          title="Pending Review"
          value={pendingCount}
          icon={WarningIcon}
          colorFrom="from-rose-400"
          colorTo="to-red-500"
          iconColor="text-rose-500"
          link="/review"
          loading={pendingQ.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-slate-700/50 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Real-time Throughput</h3>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="h-[350px]">
            <ThroughputArea data={chartAreaData} title="" />
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[24px] border border-white/40 dark:border-slate-700/50 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Waste Composition</h3>
          <div className="h-[350px]">
            <WasteMixPie data={chartPieData} title="" />
          </div>
        </div>
      </div>
    </div>
  );
}