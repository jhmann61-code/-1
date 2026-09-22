// src/components/PickupMap.tsx
import { useEffect, useMemo } from "react";
import { Card, CardContent } from "@mui/material";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import * as L from "leaflet";               // ✅ default 대신 네임스페이스 import
import type { LatLngBoundsExpression } from "leaflet"; // ✅ 타입은 type-only로
import "leaflet/dist/leaflet.css";

export type PickupPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  fillPct?: number;
};

type Props = {
  points: PickupPoint[];
  route?: [number, number][]; // [lat, lng] 경로(선택)
};

// 현재 마커들의 bounds 로 자동 맞추기
function FitBounds({ points }: { points: PickupPoint[] }) {
  const map = useMap();

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (!points.length) return null;
    return L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
  }, [points]);

  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [24, 24] });
  }, [bounds, map]);

  return null;
}

export default function PickupMap({ points, route }: Props) {
  // route가 없으면 포인트 순서를 이용해 임시 선을 그림
  const polyline = useMemo<[number, number][]>(() => {
    return route ?? points.map((p) => [p.lat, p.lng] as [number, number]);
  }, [route, points]);

  return (
    <Card className="rounded-2xl">
      <CardContent style={{ height: 360, padding: 0 }}>
        <MapContainer
          center={[37.5665, 126.978]} // 기본 중심(서울 시청)
          zoom={12}
          className="h-80 rounded-2xl"
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds points={points} />

          {points.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng] as [number, number]}>
              <Popup>
                <b>{p.name}</b>
                <div>용량 {p.fillPct ?? "-"}%</div>
                <div>
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          ))}

          {polyline.length > 1 && (
            <Polyline
              positions={polyline}
              color="#2563eb"
              weight={3}
              opacity={0.85}
            />
          )}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
