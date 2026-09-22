import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardContent, Typography, TextField, Button, CircularProgress
} from "@mui/material";
import * as Api from "../lib/api";

export default function AddDevice() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await Api.createBin({
        location,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      });
      navigate("/devices");
    } catch (err) {
      setError("등록에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Card className="rounded-2xl">
        <CardContent className="p-8">
          <Typography variant="h5" className="font-bold mb-6">
            쓰레기통 등록
          </Typography>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="위치"
              placeholder="예: 세종관 1층"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="위도 (Latitude)"
              placeholder="예: 37.5665"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              type="number"
              fullWidth
            />
            <TextField
              label="경도 (Longitude)"
              placeholder="예: 126.9780"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              type="number"
              fullWidth
            />

            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}

            <div className="flex gap-3 mt-2">
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/devices")}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}