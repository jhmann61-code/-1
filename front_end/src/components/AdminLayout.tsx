import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, IconButton, Box, Drawer, List, ListItem,
  ListItemIcon, ListItemText, Typography, Avatar, useMediaQuery, useTheme as useMuiTheme, ListItemButton, 
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import RouterIcon from "@mui/icons-material/Router";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import MapIcon from "@mui/icons-material/Map";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import RateReviewIcon from "@mui/icons-material/RateReview";

import AlertsBell from "./AlertsBell";
import ChatBot from "./ChatBot";
import { useRealtimeSync } from "../lib/useRealtimeSync";
import { useTheme } from "../lib/ThemeContext";

const DRAWER_WIDTH = 260;

const MENU_ITEMS = [
  { text: "Dashboard", path: "/", icon: <DashboardIcon />, access: ["admin"] },
  { text: "Route Map", path: "/map", icon: <MapIcon />, access: ["admin", "user", "guest"] },
  { text: "Logs", path: "/logs", icon: <ArticleIcon />, access: ["admin", "user"] },
  { text: "Devices", path: "/devices", icon: <RouterIcon />, access: ["admin", "user"] },
  { text: "Camera", path: "/camera", icon: <CameraAltIcon />, access: ["admin"] },
  { text: "Review", path: "/review", icon: <RateReviewIcon />, access: ["admin"] },
  { text: "Stats", path: "/stats", icon: <BarChartIcon />, access: ["admin", "user"] },
  { text: "Settings", path: "/settings", icon: <SettingsIcon />, access: ["admin", "user"] },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("guest");

  const { theme, toggleTheme } = useTheme(); 
  useRealtimeSync();

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    if (role) {
      setUserRole(role);
    } else {
      setUserRole("guest");
    }
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  
  const handleAuthAction = () => {
    if (userRole === "guest") {
      navigate("/login");
    } else {
      if (confirm("로그아웃 하시겠습니까?")) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("userEmail");
        setUserRole("guest");
        navigate("/map");
      }
    }
  };

  const drawerContent = (
    <div className="h-full bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800/50">
        <img
          src="/logo-highvalue.png"
          alt="high-value"
          className="h-14 w-auto"
        />
      </div>

      <List className="flex-1 py-6 px-4 space-y-1">
        {MENU_ITEMS.filter((item) => item.access.includes(userRole)).map((item) => (
          <ListItem key={item.text} disablePadding>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-medium"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                }`
              }
              onClick={() => !isDesktop && setMobileOpen(false)}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40, transition: "color 0.2s" }} className="group-hover:text-indigo-500 dark:group-hover:text-indigo-400">
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontSize: 14 }}
              />
            </NavLink>
          </ListItem>
        ))}
      </List>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800/50">
        <ListItemButton 
          onClick={handleAuthAction} 
          className={`rounded-xl transition-colors ${
            userRole === "guest" 
              ? "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
              : "hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
          }`}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
            {userRole === "guest" ? <LoginIcon /> : <LogoutIcon />}
          </ListItemIcon>
          <ListItemText 
            primary={userRole === "guest" ? "Login / Sign Up" : "Logout"} 
            primaryTypographyProps={{ fontSize: 14, fontWeight: userRole === "guest" ? "bold" : "normal" }} 
          />
        </ListItemButton>
      </div>
    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }} className="bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
        className="bg-white dark:bg-slate-900 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors duration-300"
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          
          <div className="flex-grow">
            <Typography variant="h6" className="font-bold text-sm text-slate-600 dark:text-slate-300">
              Overview (
                {userRole === "admin" ? "Admin Mode" : 
                 userRole === "user" ? "User Mode" : "Guest Mode"}
              )
            </Typography>
          </div>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={toggleTheme} color="inherit">
              {theme === "dark" ? <LightModeIcon className="text-amber-400" /> : <DarkModeIcon className="text-slate-600" />}
            </IconButton>
            
            <AlertsBell />
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <Avatar sx={{ 
              width: 32, height: 32, 
              bgcolor: userRole === "guest" ? "#64748b" : "#4f46e5", 
              fontSize: 14, fontWeight: "bold" 
            }}>
              {userRole === "admin" ? "A" : userRole === "user" ? "U" : "G"}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH, border: "none" } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH, border: "none" } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: 8 }}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
           <Outlet />
        </div>
      </Box>

      <ChatBot />
    </Box>
  );
}