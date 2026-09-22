import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

// 네이티브 앱(Expo WebView) 안에서 실행 중일 때만 존재하는 브릿지.
// 일반 브라우저에서 열면 undefined라서 옵셔널 체이닝으로 안전하게 처리.
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const BASE = import.meta.env.VITE_API_BASE_URL;

      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setIsError(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("token", data.access_token);

      const meRes = await fetch(`${BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const me = await meRes.json();

      sessionStorage.setItem("userRole", me.role);
      sessionStorage.setItem("userEmail", me.email);

      // 네이티브 앱(WebView) 쪽에 로그인 성공 + JWT 전달
      // → 상준이 앱이 이 메시지를 받아서 푸시 토큰 등록 요청에 Authorization 헤더로 사용
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "LOGIN_SUCCESS",
            accessToken: data.access_token,
            role: me.role,
          })
        );
      }

      if (me.role === "admin") {
        navigate("/");
      } else {
        navigate("/map");
      }

    } catch (err) {
      setIsError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-500/30 rounded-full blur-[100px] animate-pulse delay-700" />

      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-2xl rounded-3xl p-8 md:p-10">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-sky-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
              <LockOutlinedIcon className="text-white text-3xl" />
            </div>
            <Typography variant="h5" className="font-bold text-slate-800 dark:text-white tracking-tight">
              Welcome Back
            </Typography>
            <Typography variant="body2" className="text-slate-500 dark:text-slate-400 mt-2">
              HighValue Smart Management
            </Typography>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsError(false);
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "rgba(255,255,255,0.5)",
                  ".dark &": { bgcolor: "rgba(30, 41, 59, 0.5)" },
                },
                "& .MuiInputLabel-root": {
                   color: "#64748b",
                   ".dark &": { color: "#94a3b8" }
                },
                "& .MuiOutlinedInput-input": {
                   color: "#1e293b",
                   ".dark &": { color: "#f8fafc" }
                },
                "& .MuiOutlinedInput-notchedOutline": {
                   borderColor: "#cbd5e1",
                   ".dark &": { borderColor: "#475569" }
                }
              }}
              error={isError}
            />
            
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setIsError(false);
              }}
              error={isError}
              helperText={isError ? "아이디 또는 비밀번호를 확인해주세요." : ""}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      className="text-slate-400"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "rgba(255,255,255,0.5)",
                  ".dark &": { bgcolor: "rgba(30, 41, 59, 0.5)" },
                },
                "& .MuiInputLabel-root": {
                   color: "#64748b",
                   ".dark &": { color: "#94a3b8" }
                },
                "& .MuiOutlinedInput-input": {
                   color: "#1e293b",
                   ".dark &": { color: "#f8fafc" }
                },
                "& .MuiOutlinedInput-notchedOutline": {
                   borderColor: "#cbd5e1",
                   ".dark &": { borderColor: "#475569" }
                }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 py-3.5 rounded-xl text-lg font-bold shadow-lg shadow-indigo-500/25 mt-2 transition-all hover:scale-[1.02]"
            >
              {loading ? <CircularProgress size={26} color="inherit" /> : (
                <span className="flex items-center gap-2">
                  Login <LoginIcon fontSize="small" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center flex flex-col gap-2">
            <Typography variant="body2" className="text-slate-500 dark:text-slate-400">
              계정이 없으신가요?{" "}
              <span 
                onClick={() => navigate("/signup")}
                className="text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:underline"
              >
                회원가입 하기
              </span>
            </Typography>
            <Typography variant="caption" className="text-slate-400 dark:text-slate-500 mt-2">
              © 2026 HighValue Team. All rights reserved.
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
}