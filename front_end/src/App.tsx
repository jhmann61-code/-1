import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Logs from "./pages/Logs";
import Devices from "./pages/Devices";
import DeviceDetail from "./pages/DeviceDetail";
import Camera from "./pages/Camera";
import Stats from "./pages/Stats";
import SettingsPage from "./pages/Settings";
import RouteMap from "./pages/RouteMap";
import Signup from "./pages/Signup";
import AddDevice from "./pages/AddDevice";
import ReviewBoard from "./pages/ReviewBoard";

import AdminLayout from "./components/AdminLayout";

function GuestGuard({ children }: { children: React.ReactNode }) {
  const role = sessionStorage.getItem("userRole") ?? "guest";
  if (role === "guest") return <Navigate to="/map" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const role = sessionStorage.getItem("userRole") ?? "guest";
  if (role !== "admin") return <Navigate to="/map" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<AdminLayout />}>
        {/* guest는 / 접속 시 /map으로 */}
        <Route path="/" element={
          <GuestGuard><Home /></GuestGuard>
        } />
        <Route path="/map" element={<RouteMap />} />

        {/* user, admin만 접근 가능 */}
        <Route path="/logs" element={
          <GuestGuard><Logs /></GuestGuard>
        } />
        <Route path="/devices" element={
          <GuestGuard><Devices /></GuestGuard>
        } />
        <Route path="/devices/:id" element={
          <GuestGuard><DeviceDetail /></GuestGuard>
        } />
        <Route path="/devices/add" element={
          <GuestGuard><AddDevice /></GuestGuard>
        } />
        <Route path="/stats" element={
          <GuestGuard><Stats /></GuestGuard>
        } />
        <Route path="/settings" element={
          <GuestGuard><SettingsPage /></GuestGuard>
        } />

        {/* admin만 접근 가능 */}
        <Route path="/camera" element={
          <AdminGuard><Camera /></AdminGuard>
        } />
        <Route path="/review" element={
          <AdminGuard><ReviewBoard /></AdminGuard>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}