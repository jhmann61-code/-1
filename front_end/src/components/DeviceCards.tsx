import { Card, CardContent, Typography } from "@mui/material";
import { useDevices } from "../lib/hooks";
import { useNavigate } from "react-router-dom";

export default function DeviceCards() {
  const { data } = useDevices();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data?.map((d) => (
        <Card
          key={d.id}
          className="rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`/devices/${d.id}`)}
        >
          <CardContent>
            <div className="flex items-center justify-between">
              <Typography variant="h6">{d.location}</Typography>
            </div>
            <Typography variant="body2" className="mt-2 text-gray-500">
              ID: {d.id} · Ping: {d.ping_ms ?? "-"} ms
            </Typography>
            <Typography variant="body2" className="mt-1 text-gray-400">
              등록일: {new Date(d.created_at).toLocaleString("ko-KR")}
            </Typography>
          </CardContent>
        </Card>
      ))}
      {!data?.length && (
        <Typography className="text-gray-500">등록된 쓰레기통이 없습니다</Typography>
      )}
    </div>
  );
}