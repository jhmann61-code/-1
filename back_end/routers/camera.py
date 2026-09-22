# routers/camera.py
#
# 라즈베리파이가 주기적으로 찍어 보내는 사진을 받아서(POST),
# 지금 대시보드를 보고 있는 브라우저들에게 WebSocket으로 그대로 뿌려주는 중계 라우터.
# 새 포트도, 새 ngrok 터널도 필요 없음 — 기존 서버 주소 그대로 씀.

import base64

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File

router = APIRouter(prefix="/api/camera", tags=["camera"])

# 카메라 화면을 보고 있는 브라우저(대시보드) 연결 목록
_viewers: list[WebSocket] = []

# 방금 막 붙은 브라우저에게 "0.2초 전 마지막 프레임"이라도 바로 보여주기 위한 캐시
_last_frame_b64: str | None = None


@router.websocket("/ws")
async def camera_ws(websocket: WebSocket):
    await websocket.accept()
    _viewers.append(websocket)

    # 접속하자마자 마지막 프레임을 한 장 보내줌 (다음 프레임까지 안 기다려도 되게)
    if _last_frame_b64:
        await websocket.send_json({"type": "frame", "data": _last_frame_b64})

    try:
        while True:
            # 브라우저 쪽에서 보낼 데이터는 없음. 연결 유지 목적으로만 대기.
            await websocket.receive_text()
    except WebSocketDisconnect:
        _viewers.remove(websocket)


@router.post("/frame")
async def receive_frame(file: UploadFile = File(...)):
    """라즈베리파이가 여기로 사진을 계속 올린다 (예: 0.2~0.5초 간격)."""
    global _last_frame_b64

    image_bytes = await file.read()
    frame_b64 = base64.b64encode(image_bytes).decode("ascii")
    _last_frame_b64 = frame_b64

    # 지금 보고 있는 모든 브라우저에게 바로 전달
    dead = []
    for ws in _viewers:
        try:
            await ws.send_json({"type": "frame", "data": frame_b64})
        except Exception:
            dead.append(ws)

    for ws in dead:
        _viewers.remove(ws)

    return {"received": True, "viewers": len(_viewers)}