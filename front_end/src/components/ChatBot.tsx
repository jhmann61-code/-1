import { useState, useRef, useEffect } from "react";
import {
  Fab,
  Paper,
  InputBase,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  Badge,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AttachFileIcon from "@mui/icons-material/AttachFile"; // 📎 클립 아이콘
import ImageIcon from "@mui/icons-material/Image"; // 🖼️ 이미지 아이콘

// ✨ [변경됨] 백엔드(axios) 대신 가짜 API 함수 import
import { sendChat } from "../lib/api";

// 메시지 타입 정의
type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  imageUrl?: string; // 사용자가 보낸 이미지 미리보기용
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null); // 📸 선택된 파일 상태
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "안녕하세요! 쓰레기 사진을 올리시면 분리배출 방법을 알려드려요.", sender: "bot" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // 파일 인풋 제어용

  // 스크롤 자동 내리기
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !file) return; // 내용 없으면 리턴

    // 1. 사용자 메시지 UI에 즉시 추가 (낙관적 업데이트)
    const userMsg: Message = { 
      id: Date.now(), 
      text: input, 
      sender: "user",
      imageUrl: file ? URL.createObjectURL(file) : undefined // 이미지 있으면 미리보기 URL 생성
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setFile(null); // 파일 초기화
    setIsLoading(true);

    try {
      // ✨ [변경됨] 백엔드 API 호출 제거 -> Mock 함수 사용
      // const formData = new FormData(); ... (제거됨)
      // const { data } = await api.post("/chat", ...); (제거됨)

      // 가짜 AI 응답 받기 (1초 딜레이)
      const data = await sendChat(userMsg.text, file || undefined);

      // 3. 응답 처리
      const botMsg: Message = {
        id: Date.now() + 1,
        text: data.reply, // 가짜 API가 주는 응답 메시지
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMsg]);

    } catch (e) {
      console.error(e);
      // 에러 발생 시 챗봇 메시지로 알림
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: "오류가 발생했습니다. (Mock API 확인 필요)", sender: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* 1. 채팅창 */}
      {isOpen && (
        <Paper
          elevation={6}
          className="w-80 h-[500px] flex flex-col rounded-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 border border-slate-200 shadow-2xl"
        >
          {/* 헤더 */}
          <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-2">
              <Avatar sx={{ bgcolor: "white", color: "#4f46e5", width: 32, height: 32 }}>
                <SmartToyIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle1" fontWeight="bold">
                AI Recycle Bot
              </Typography>
            </div>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* 이미지가 있다면 먼저 보여주기 */}
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="upload" 
                    className="w-40 h-auto rounded-xl border border-slate-200 mb-1 object-cover" 
                  />
                )}
                
                {/* 텍스트 말풍선 */}
                {msg.text && (
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            
            {/* 로딩 중 애니메이션 */}
            {isLoading && (
              <div className="flex justify-start items-center gap-2 text-xs text-slate-500 ml-2">
                <CircularProgress size={12} />
                <span>AI가 분석 중입니다...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* 입력창 영역 */}
          <div className="p-3 bg-white border-t">
            {/* 파일 선택되었다면 미리보기 표시 */}
            {file && (
              <div className="flex items-center gap-2 mb-2 bg-slate-100 px-3 py-1 rounded-lg w-fit">
                <ImageIcon fontSize="small" className="text-indigo-600"/>
                <span className="text-xs text-slate-600 truncate max-w-[150px]">{file.name}</span>
                <IconButton size="small" onClick={() => setFile(null)}>
                  <CloseIcon fontSize="small" style={{ fontSize: 14 }}/>
                </IconButton>
              </div>
            )}

            <Paper
              component="form"
              className="flex items-center px-2 py-1 bg-slate-100 rounded-xl shadow-none border border-transparent focus-within:border-indigo-300 transition-colors"
              elevation={0}
            >
              {/* 📎 파일 첨부 버튼 */}
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
              />
              <IconButton 
                size="small" 
                className="text-slate-400 hover:text-indigo-600"
                onClick={() => fileInputRef.current?.click()}
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>

              <InputBase
                className="ml-2 flex-1 text-sm"
                placeholder="궁금한 점을 물어보세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                multiline
                maxRows={2}
              />
              <IconButton
                color="primary"
                size="small"
                onClick={handleSend}
                disabled={(!input.trim() && !file) || isLoading}
                className="text-indigo-600"
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Paper>
          </div>
        </Paper>
      )}

      {/* 2. FAB 버튼 */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setIsOpen(!isOpen)}
        className="shadow-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600"
      >
        {isOpen ? <CloseIcon /> : (
          <Badge color="error" variant="dot" invisible={isOpen}>
            <ChatIcon />
          </Badge>
        )}
      </Fab>
    </div>
  );
}