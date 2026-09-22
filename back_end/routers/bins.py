import time
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from dependencies import require_user
import models
import schemas

router = APIRouter(prefix="/api/bins", tags=["Bins"])

KST = timezone(timedelta(hours=9))
def now_kst():
    return datetime.now(KST).replace(tzinfo=None)


# 비로그인 공개 엔드포인트 - 위치만 반환 (/{bin_id} 보다 위에 있어야 함)
@router.get("/public", response_model=list[schemas.TrashBinResponse])
def get_public_bins(db: Session = Depends(get_db)):
    return db.query(models.TrashBin).all()


@router.get("/", response_model=list[schemas.TrashBinResponse])
def get_bins(db: Session = Depends(get_db), current_user=Depends(require_user)):
    if current_user.role == "admin":
        return db.query(models.TrashBin).all()
    return db.query(models.TrashBin).filter(
        models.TrashBin.user_id == current_user.id
    ).all()


@router.get("/status/all", response_model=list[schemas.BinStatusResponse])
def get_all_bin_status(
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    if current_user.role == "admin":
        bin_ids = [b.id for b in db.query(models.TrashBin).all()]
    else:
        bin_ids = [b.id for b in db.query(models.TrashBin).filter(
            models.TrashBin.user_id == current_user.id
        ).all()]

    if not bin_ids:
        return []

    subquery = db.query(
        models.BinStatus.bin_id,
        func.max(models.BinStatus.recorded_at).label("max_recorded_at")
    ).filter(
        models.BinStatus.bin_id.in_(bin_ids)
    ).group_by(models.BinStatus.bin_id).subquery()

    statuses = db.query(models.BinStatus).join(
        subquery,
        (models.BinStatus.bin_id == subquery.c.bin_id) &
        (models.BinStatus.recorded_at == subquery.c.max_recorded_at)
    ).all()

    return statuses


@router.get("/{bin_id}", response_model=schemas.TrashBinResponse)
def get_bin(bin_id: int, db: Session = Depends(get_db), current_user=Depends(require_user)):
    if current_user.role == "admin":
        bin = db.query(models.TrashBin).filter(models.TrashBin.id == bin_id).first()
    else:
        bin = db.query(models.TrashBin).filter(
            models.TrashBin.id == bin_id,
            models.TrashBin.user_id == current_user.id
        ).first()
    if not bin:
        raise HTTPException(status_code=404, detail="쓰레기통을 찾을 수 없습니다")
    return bin


@router.post("/", response_model=schemas.TrashBinResponse)
def create_bin(
    body: schemas.TrashBinCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    bin = models.TrashBin(
        user_id=current_user.id,
        location=body.location,
        latitude=body.latitude,
        longitude=body.longitude,
        ip=body.ip
    )
    db.add(bin)
    db.commit()
    db.refresh(bin)
    return bin


@router.put("/{bin_id}", response_model=schemas.TrashBinResponse)
def update_bin(
    bin_id: int,
    body: schemas.TrashBinCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    if current_user.role == "admin":
        bin = db.query(models.TrashBin).filter(models.TrashBin.id == bin_id).first()
    else:
        bin = db.query(models.TrashBin).filter(
            models.TrashBin.id == bin_id,
            models.TrashBin.user_id == current_user.id
        ).first()
    if not bin:
        raise HTTPException(status_code=404, detail="쓰레기통을 찾을 수 없습니다")

    bin.location = body.location
    bin.latitude = body.latitude
    bin.longitude = body.longitude
    bin.ip = body.ip

    db.commit()
    db.refresh(bin)
    return bin


@router.delete("/{bin_id}")
def delete_bin(
    bin_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    if current_user.role == "admin":
        bin = db.query(models.TrashBin).filter(models.TrashBin.id == bin_id).first()
    else:
        bin = db.query(models.TrashBin).filter(
            models.TrashBin.id == bin_id,
            models.TrashBin.user_id == current_user.id
        ).first()
    if not bin:
        raise HTTPException(status_code=404, detail="쓰레기통을 찾을 수 없습니다")

    db.query(models.BinStatus).filter(models.BinStatus.bin_id == bin_id).delete()
    db.query(models.Detection).filter(models.Detection.bin_id == bin_id).delete()
    db.delete(bin)
    db.commit()
    return {"message": "삭제되었습니다"}


@router.get("/{bin_id}/status", response_model=schemas.BinStatusResponse)
def get_bin_status(
    bin_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    status = db.query(models.BinStatus)\
        .filter(models.BinStatus.bin_id == bin_id)\
        .order_by(models.BinStatus.recorded_at.desc())\
        .first()
    if not status:
        raise HTTPException(status_code=404, detail="상태 데이터가 없습니다")
    return status


@router.post("/{bin_id}/connect")
async def connect_bin(
    bin_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    if current_user.role == "admin":
        bin = db.query(models.TrashBin).filter(models.TrashBin.id == bin_id).first()
    else:
        bin = db.query(models.TrashBin).filter(
            models.TrashBin.id == bin_id,
            models.TrashBin.user_id == current_user.id
        ).first()
    if not bin:
        raise HTTPException(status_code=404, detail="쓰레기통을 찾을 수 없습니다")

    if not bin.ip:
        raise HTTPException(status_code=400, detail="등록된 IP 주소가 없습니다")

    try:
        start = time.time()
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"http://{bin.ip}:5000/health")
        elapsed = (time.time() - start) * 1000
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="디바이스에 연결할 수 없습니다")

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="디바이스 응답 오류")

    bin.last_seen = now_kst()
    bin.ping_ms = round(elapsed, 2)
    db.commit()
    db.refresh(bin)

    return {"connected": True, "ping_ms": bin.ping_ms}