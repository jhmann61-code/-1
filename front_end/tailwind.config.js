/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ✨ 다크 모드를 클래스 기반으로 설정 (중요!)
  theme: {
    extend: {
      fontFamily: {
        // 한글 폰트는 Pretendard나 Noto Sans KR 추천 (index.html에 CDN 추가 필요)
        sans: ['"Pretendard"', '"Inter"', 'sans-serif'],
      },
      colors: {
        // 기존 blue보다 좀 더 깊이감 있는 slate/indigo 활용
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1', // Indigo-500
          600: '#4f46e5', // Indigo-600
          700: '#4338ca', // Indigo-700
          900: '#312e81',
        },
        dark: {
          bg: '#0f172a',    // Slate-900 (다크모드 배경)
          card: '#1e293b',  // Slate-800 (다크모드 카드)
          border: '#334155',// Slate-700 (다크모드 테두리)
        }
      }
    },
  },
  plugins: [],
}