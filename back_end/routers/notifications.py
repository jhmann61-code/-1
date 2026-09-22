import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user  # 실제 auth 의존성 이름에 맞춰주세요
from models import User
from schemas import PushTokenIn

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


@router.post("/token")
def register_push_token(
    body: PushTokenIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """로그인한 사용자(관리자)의 Expo 푸시 토큰을 저장"""
    current_user.push_token = body.push_token
    db.commit()
    return {"message": "푸시 토큰이 저장되었습니다."}


async def send_push_notification(expo_token: str, title: str, body: str):
    headers = {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
    }
    payload = {"to": expo_token, "title": title, "body": body, "sound": "default"}
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.post(EXPO_PUSH_URL, headers=headers, json=payload)
            return resp.json()
        except httpx.HTTPError as e:
            print(f"[PUSH] 전송 실패: {e}")
            return None