import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    passwordConfirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const BASE = import.meta.env.VITE_API_BASE_URL;

      // 회원가입
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "회원가입에 실패했습니다.");
        setLoading(false);
        return;
      }

      // 회원가입 성공 후 자동 로그인
      const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const loginData = await loginRes.json();
      sessionStorage.setItem("token", loginData.access_token);

      const meRes = await fetch(`${BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${loginData.access_token}` },
      });
      const me = await meRes.json();

      sessionStorage.setItem("userRole", me.role);
      sessionStorage.setItem("userEmail", me.email);

      if (me.role === "admin") {
        navigate("/");
      } else {
        navigate("/map");
      }

    } catch (err) {
      setError("서버 연결에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-500 py-10">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse bg-indigo-500/20" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse delay-700 bg-sky-500/20" />

      <div className="relative z-10 w-full max-w-[450px] mx-4">
        <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-2xl rounded-3xl p-8 md:p-10">

          <IconButton
            onClick={() => navigate("/login")}
            className="absolute top-4 left-4 text-slate-400 hover:text-slate-600"
          >
            <ArrowBackIcon />
          </IconButton>

          <div className="text-center mb-6 mt-4">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 bg-gradient-to-tr from-indigo-600 to-sky-500 shadow-indigo-500/30">
              <PersonIcon className="text-white text-3xl" />
            </div>
            <Typography variant="h5" className="font-bold text-slate-800 dark:text-white tracking-tight">
              Create Account
            </Typography>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <TextField
              label="이메일 주소"
              name="email"
              type="email"
              variant="outlined"
              fullWidth
              required
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              label="사용자 이름"
              name="name"
              variant="outlined"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              label="비밀번호"
              name="password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              required
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="비밀번호 확인"
              name="passwordConfirm"
              type={showPasswordConfirm ? "text" : "password"}
              variant="outlined"
              fullWidth
              required
              value={formData.passwordConfirm}
              onChange={handleChange}
              error={!!error}
              helperText={error}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} edge="end">
                      {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              className="py-3.5 rounded-xl text-lg font-bold shadow-lg mt-4 transition-all hover:scale-[1.02] bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25"
            >
              {loading ? <CircularProgress size={26} color="inherit" /> : "회원가입"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Typography variant="body2" className="text-slate-500 dark:text-slate-400">
              이미 계정이 있으신가요?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:underline"
              >
                로그인 하기
              </span>
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
}