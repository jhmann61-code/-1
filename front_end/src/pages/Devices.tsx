import { Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useDevices } from "../lib/hooks";
import { useState, useEffect, useRef } from "react";
import * as Api from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Device } from "../lib/types";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import WifiIcon from "@mui/icons-material/Wifi";
import { ConnectionBadge } from "../components/ConnectionBadge";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function Devices() {
  const { data } = useDevices();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rows: Device[] = data ?? [];

  // 추가 모달
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ location: "", latitude: "", longitude: "", ip: "" });
  const [searchKeyword, setSearchKeyword] = useState("");
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // 수정 모달
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Device | null>(null);
  const [editLocation, setEditLocation] = useState("");
  const [editLatitude, setEditLatitude] = useState<string>("");
  const [editLongitude, setEditLongitude] = useState<string>("");
  const [editIp, setEditIp] = useState<string>("");

  // 삭제 확인 모달
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);

  // 연결 버튼 로딩 상태
  const [connecting, setConnecting] = useState<number | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (!addOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
        level: 5,
      };
      const map = new window.kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = map;

      window.kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        const lat = latlng.getLat();
        const lng = latlng.getLng();

        if (markerRef.current) markerRef.current.setMap(null);

        const marker = new window.kakao.maps.Marker({ position: latlng, map });
        markerRef.current = marker;

        setAddForm((prev) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lng),
        }));
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [addOpen]);

  // 장소 검색
  const handleSearch = () => {
    if (!searchKeyword.trim() || !mapRef.current) return;

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        const place = data[0];
        const lat = parseFloat(place.y);
        const lng = parseFloat(place.x);
        const position = new window.kakao.maps.LatLng(lat, lng);

        mapRef.current.setCenter(position);
        mapRef.current.setLevel(3);

        if (markerRef.current) markerRef.current.setMap(null);
        const marker = new window.kakao.maps.Marker({ position, map: mapRef.current });
        markerRef.current = marker;

        setAddForm((prev) => ({
          ...prev,
          location: place.place_name,
          latitude: String(lat),
          longitude: String(lng),
        }));
      } else {
        alert("검색 결과가 없습니다.");
      }
    });
  };

  // 모달 닫기 초기화
  const handleAddClose = () => {
    setAddOpen(false);
    setAddForm({ location: "", latitude: "", longitude: "", ip: "" });
    setSearchKeyword("");
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = null;
    mapRef.current = null;
  };

  // 추가
  const handleAdd = async () => {
    await Api.createBin({
      location: addForm.location,
      latitude: addForm.latitude ? Number(addForm.latitude) : undefined,
      longitude: addForm.longitude ? Number(addForm.longitude) : undefined,
      ip: addForm.ip || undefined,
    });
    queryClient.invalidateQueries({ queryKey: ["devices"] });
    handleAddClose();
  };

  // 수정
  const handleEdit = async () => {
    if (!editTarget) return;
    await Api.updateBin(editTarget.id, {
      location: editLocation,
      latitude: editLatitude ? Number(editLatitude) : undefined,
      longitude: editLongitude ? Number(editLongitude) : undefined,
      ip: editIp || undefined,
    });
    queryClient.invalidateQueries({ queryKey: ["devices"] });
    setEditOpen(false);
  };

  // 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await Api.deleteBin(deleteTarget.id);
    queryClient.invalidateQueries({ queryKey: ["devices"] });
    setDeleteOpen(false);
  };

  // 연결 시도
  const handleConnect = async (bin: Device) => {
    setConnecting(bin.id);
    try {
      await Api.connectBin(bin.id);
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    } catch (e) {
      alert("연결에 실패했습니다. 같은 네트워크에 있는지, IP 주소가 맞는지 확인해주세요.");
    } finally {
      setConnecting(null);
    }
  };

  const columns: GridColDef<Device>[] = [
    { field: "id", headerName: "디바이스 ID", width: 120 },
    { field: "location", headerName: "위치", flex: 1, minWidth: 140 },
    {
      field: "is_online",
      headerName: "연결 상태",
      width: 120,
      renderCell: (params) => <ConnectionBadge isOnline={!!params.row.is_online} />,
    },
    { field: "last_seen", headerName: "마지막 통신", flex: 1, minWidth: 180,
      valueGetter: (value: any, row: Device) => row.last_seen ? new Date(row.last_seen).toLocaleString("ko-KR") : "-" },
    { field: "ping_ms", headerName: "Ping(ms)", width: 100,
      valueGetter: (value: any, row: Device) => row.ping_ms ?? "-" },
    { field: "ip", headerName: "IP", width: 130,
      valueGetter: (value: any, row: Device) => row.ip ?? "-" },
    {
      field: "actions",
      headerName: "관리",
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <div className="flex gap-1 items-center h-full">
          <IconButton
            size="small"
            disabled={connecting === params.row.id}
            onClick={(e) => {
              e.stopPropagation();
              handleConnect(params.row);
            }}
          >
            <WifiIcon
              fontSize="small"
              className={connecting === params.row.id ? "text-gray-300" : "text-blue-500"}
            />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setEditTarget(params.row);
              setEditLocation(params.row.location);
              setEditLatitude(params.row.latitude ? String(params.row.latitude) : "");
              setEditLongitude(params.row.longitude ? String(params.row.longitude) : "");
              setEditIp(params.row.ip ?? "");
              setEditOpen(true);
            }}
          >
            <EditIcon fontSize="small" className="text-indigo-500" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(params.row);
              setDeleteOpen(true);
            }}
          >
            <DeleteIcon fontSize="small" className="text-red-400" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent>
          <div className="flex justify-between items-center mb-2">
            <Typography variant="h6">디바이스 목록</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
              sx={{ borderRadius: "10px", fontWeight: "bold" }}
            >
              쓰레기통 추가
            </Button>
          </div>
          <div style={{ height: 560, width: "100%" }}>
            <DataGrid
              rows={rows}
              getRowId={(r: Device) => r.id ?? r.device_id ?? 0}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 20, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              onRowClick={(params) => navigate(`/devices/${params.row.id}`)}
              sx={{ cursor: "pointer" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 추가 모달 */}
      <Dialog open={addOpen} onClose={handleAddClose} maxWidth="md" fullWidth>
        <DialogTitle>쓰레기통 추가</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="flex gap-2">
            <TextField
              label="장소 검색"
              placeholder="예: 서울역, 강남구청"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              fullWidth
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              className="bg-indigo-600"
              startIcon={<SearchIcon />}
              sx={{ minWidth: 80 }}
            >
              검색
            </Button>
          </div>

          <div
            ref={mapContainerRef}
            style={{ width: "100%", height: 350, borderRadius: 12, border: "1px solid #e2e8f0" }}
          />

          <div className="flex gap-3">
            <TextField
              label="위치명"
              value={addForm.location}
              onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
              fullWidth
              required
              size="small"
              placeholder="지도를 클릭하거나 검색하세요"
            />
            <TextField
              label="위도"
              value={addForm.latitude}
              size="small"
              InputProps={{ readOnly: true }}
              sx={{ minWidth: 130 }}
            />
            <TextField
              label="경도"
              value={addForm.longitude}
              size="small"
              InputProps={{ readOnly: true }}
              sx={{ minWidth: 130 }}
            />
          </div>

          <TextField
            label="IP 주소 (선택)"
            placeholder="예: 192.168.0.42"
            value={addForm.ip}
            onChange={(e) => setAddForm({ ...addForm, ip: e.target.value })}
            fullWidth
            size="small"
            helperText="라즈베리파이와 같은 네트워크에 있을 때만 연결 버튼이 동작해요"
          />
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={handleAddClose}>취소</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={!addForm.location || !addForm.latitude}
            className="bg-indigo-600"
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>쓰레기통 정보 수정</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <TextField
            label="위치"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="위도 (Latitude)"
            placeholder="예: 37.5665"
            value={editLatitude}
            onChange={(e) => setEditLatitude(e.target.value)}
            type="number"
            fullWidth
          />
          <TextField
            label="경도 (Longitude)"
            placeholder="예: 126.9780"
            value={editLongitude}
            onChange={(e) => setEditLongitude(e.target.value)}
            type="number"
            fullWidth
          />
          <TextField
            label="IP 주소 (선택)"
            placeholder="예: 192.168.0.42"
            value={editIp}
            onChange={(e) => setEditIp(e.target.value)}
            fullWidth
            helperText="라즈베리파이와 같은 네트워크에 있을 때만 연결 버튼이 동작해요"
          />
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setEditOpen(false)}>취소</Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            className="bg-indigo-600"
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 모달 */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>쓰레기통 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{deleteTarget?.location}</strong> 을 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" className="text-red-400 mt-2">
            관련 센서 데이터와 분류 기록도 모두 삭제됩니다.
          </Typography>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setDeleteOpen(false)}>취소</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}