import { Chip } from "@mui/material";
import { useHealth } from "../lib/hooks";

export default function ApiHealth() {
  const { data, isLoading, isError } = useHealth();
  if (isLoading) return <Chip size="small" label="API 확인중" />;
  if (isError) return <Chip size="small" color="error" label="API 다운" />;
  return <Chip size="small" color="success" label={`API ${data?.message || "ok"}`} />;
}