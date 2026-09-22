from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import time

from database import get_db
from dependencies import require_user
from services.alerts import check_and_send_alerts
import models
import schemas

router = APIRouter(prefix="/api/sensors", tags=["Sensors"])

KST = timezone(timedelta(hours=9))

def now_kst():
    return datetime.now(KST).replace(tzinfo=None)


@router.post("/", response_model=schemas.BinStatusResponse)
async def receive_sensor_data(
    body: schemas.BinStatusCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    from main import manager

    start_time = time.time()

    bin = db.query(models.TrashBin).filter(models.TrashBin.id == body.bin_id).first()
    if not bin:
        raise HTTPException(status_code=404, detail="쓰레기통을 찾을 수 없습니다")

    status = models.BinStatus(
        bin_id=body.bin_id,
        plastic_pct=body.plastic_pct,
        glass_pct=body.glass_pct,
        unknown_pct=body.unknown_pct,
        can_pct=body.can_pct,
        weight_g=body.weight_g,
        gas_level=body.gas_level,
        temperature=body.temperature,
        humidity=body.humidity
    )
    db.add(status)

    elapsed = (time.time() - start_time) * 1000
    bin.ping_ms = round(elapsed, 2)
    bin.last_seen = now_kst()
    bin.ip = request.client.host

    db.commit()
    db.refresh(status)

    # 카테고리별 80%/90% 적재율 체크 → 관리자 푸시 알림
    await check_and_send_alerts(status, db)

    await manager.broadcast_status({
        "bin_id": status.bin_id,
        "plastic_pct": status.plastic_pct,
        "glass_pct": status.glass_pct,
        "unknown_pct": status.unknown_pct,
        "can_pct": status.can_pct,
        "weight_g": status.weight_g,
        "gas_level": status.gas_level,
        "temperature": status.temperature,
        "humidity": status.humidity,
        "recorded_at": str(status.recorded_at)
    })

    return status


@router.get("/{bin_id}", response_model=list[schemas.BinStatusResponse])
def get_sensor_history(
    bin_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    bin = db.query(models.TrashBin).filter(models.TrashBin.id == bin_id).first()
    if not bin:
        raise HTTPException(status_code=404, detail="쓰레기통을 찾을 수 없습니다")

    history = db.query(models.BinStatus)\
        .filter(models.BinStatus.bin_id == bin_id)\
        .order_by(models.BinStatus.recorded_at.desc())\
        .all()
    return history