const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1500567533227343882/sPKkNx3VCDYaxCcvD8VxlAq7fbGmta_Bk_ZvckoMrqoMk534wavzRIvAlYRLv0JzJP2g";

export const sendDiscordAlert = async (message: string) => {
  // ✨ 쓸데없이 깐깐했던 조건문을 심플하게 바꿨습니다!
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("디스코드 웹훅 주소가 설정되지 않았습니다.");
    return;
  }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message, 
        username: "로이더", // 봇 이름 설정 아주 좋습니다!
        avatar_url: "https://cdn-icons-png.flaticon.com/512/3299/3299935.png",
      }),
    });
    console.log("✅ 디스코드 알림 전송 완료");
  } catch (error) {
    console.error("❌ 디스코드 알림 전송 실패:", error);
  }
};