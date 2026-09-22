import httpx

EXPO_TOKEN = "ExponentPushToken[JvDT3MMNP5M6jvBnBLJwMH]"

payload = {
    "to": EXPO_TOKEN,
    "title": "🔔 테스트 알림",
    "body": "백엔드에서 강제로 보낸 테스트입니다!",
    "sound": "default",
}

response = httpx.post(
    "https://exp.host/--/api/v2/push/send",
    headers={
        "Accept": "application/json",
        "Content-Type": "application/json",
    },
    json=payload,
)

print(response.status_code)
print(response.json())