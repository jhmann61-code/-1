// src/pages/Dashboard.tsx
import { Container, Stack, Typography } from "@mui/material";
import ApiHealth from "../components/ApiHealth";
import DeviceCards from "../components/DeviceCards";
import LiveFeed from "../components/LiveFeed";

export default function Dashboard(){
  return (
    <Container maxWidth="lg" className="py-6">
      <div className="flex items-center justify-between mb-4">
        <Typography variant="h5">AI 분리배출 쓰레기통 대시보드</Typography>
        <ApiHealth/>
      </div>
      <Stack spacing={3}>
        <section>
          <Typography variant="subtitle1" className="mb-2">디바이스</Typography>
          <DeviceCards/>
        </section>
        <section>
          <Typography variant="subtitle1" className="mb-2">실시간 추론</Typography>
          <LiveFeed/>
        </section>
      </Stack>
    </Container>
  );
}
