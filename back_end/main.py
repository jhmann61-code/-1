from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
from routers import camera
   
import json
import os

from database import Base, engine
from routers import auth, bins, detections, sensors, classify, notifications

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartBin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 이미지 정적 파일 서빙
os.makedirs("uploaded_images", exist_ok=True)
app.mount("/uploaded_images", StaticFiles(directory="uploaded_images"), name="uploaded_images")

class ConnectionManager:
    def __init__(self):
        self.status_connections: List[WebSocket] = []
        self.detection_connections: List[WebSocket] = []

    async def connect_status(self, websocket: WebSocket):
        await websocket.accept()
        self.status_connections.append(websocket)

    async def connect_detection(self, websocket: WebSocket):
        await websocket.accept()
        self.detection_connections.append(websocket)

    def disconnect_status(self, websocket: WebSocket):
        self.status_connections.remove(websocket)

    def disconnect_detection(self, websocket: WebSocket):
        self.detection_connections.remove(websocket)

    async def broadcast_status(self, data: dict):
        for connection in self.status_connections:
            await connection.send_text(json.dumps(data, default=str))

    async def broadcast_detection(self, data: dict):
        for connection in self.detection_connections:
            await connection.send_text(json.dumps(data, default=str))

manager = ConnectionManager()

@app.websocket("/ws/status")
async def websocket_status(websocket: WebSocket):
    await manager.connect_status(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_status(websocket)

@app.websocket("/ws/detections")
async def websocket_detections(websocket: WebSocket):
    await manager.connect_detection(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_detection(websocket)

app.include_router(auth.router)
app.include_router(bins.router)
app.include_router(detections.router)
app.include_router(sensors.router)
app.include_router(classify.router)
app.include_router(notifications.router)
app.include_router(camera.router)

@app.get("/")
def root():
    return {"message": "SmartBin API is running"}

