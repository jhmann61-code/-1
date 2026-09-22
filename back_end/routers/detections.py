from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
import shutil
import os
import uuid
from datetime import datetime, timezone, timedelta

from database import get_db
from dependencies import require_user
from services.inference import run_inference
import models
import schemas

router = APIRouter(prefix="/api/detections", tags=["Detections"])

UPLOAD_DIR = "uploaded_images"
CORRECTED_DIR = "corrected_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CORRECTED_DIR, exist_ok=True)

KST = timezone(timedelta(hours=9))

def now_kst():
    return datetime.now(KST).replace(tzinfo=None)

def get_my_bin_ids(current_user, db: Session):
    # admin은 전체 bin, user는 본인 소유 bin만
    if current_user.role == "admin":
        return [b.id for b in db.query(models.TrashBin).all()]
    return [b.id for b in db.query(models.TrashBin).filter(
        models.TrashBin.user_id == current_user.id
    ).all()]


@router.post("/", response_model=schemas.DetectionResponse)
async def create_detection(
    request: Request,
    bin_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    from main import manager

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    bin = db.query(models.TrashBin).filter(models.TrashBin.id == bin_id).first()
    if not bin:
        raise HTTPException(status_code=404, detail="쓰레기통을 찾을 수 없습니다")

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    image_path = os.path.join(UPLOAD_DIR, filename)
    with open(image_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    category, confidence = run_inference(image_path)

    status = "pending" if category == "unknown" else "confirmed"

    detection = models.Detection(
        bin_id=bin_id,
        image_path=image_path,
        category=category,
        confidence=confidence,
        status=status
    )
    db.add(detection)

    bin.last_seen = now_kst()
    bin.ip = request.client.host

    db.commit()
    db.refresh(detection)

    await manager.broadcast_detection({
        "id": detection.id,
        "bin_id": detection.bin_id,
        "category": detection.category,
        "bin": category,
        "confidence": detection.confidence,
        "status": detection.status,
        "detected_at": str(detection.detected_at)
    })

    return detection


@router.get("/", response_model=list[schemas.DetectionResponse])
def get_detections(
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    my_bin_ids = get_my_bin_ids(current_user, db)
    return db.query(models.Detection)\
        .filter(models.Detection.bin_id.in_(my_bin_ids))\
        .order_by(models.Detection.detected_at.desc())\
        .all()


@router.get("/bin/{bin_id}", response_model=list[schemas.DetectionResponse])
def get_detections_by_bin(
    bin_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    my_bin_ids = get_my_bin_ids(current_user, db)
    if bin_id not in my_bin_ids:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    return db.query(models.Detection)\
        .filter(models.Detection.bin_id == bin_id)\
        .order_by(models.Detection.detected_at.desc())\
        .all()


@router.get("/pending", response_model=list[schemas.DetectionResponse])
def get_pending_detections(
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    # user는 본인 쓰레기통의 pending만, admin은 전체 pending
    my_bin_ids = get_my_bin_ids(current_user, db)
    return db.query(models.Detection)\
        .filter(models.Detection.status == "pending")\
        .filter(models.Detection.bin_id.in_(my_bin_ids))\
        .order_by(models.Detection.detected_at.desc())\
        .all()


@router.get("/correction-logs", response_model=list[schemas.CorrectionLogDetail])
def get_correction_logs(
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    # user는 본인 쓰레기통에 대한 정정 이력만, admin은 전체
    my_bin_ids = get_my_bin_ids(current_user, db)

    logs = db.query(models.CorrectionLog)\
        .join(models.Detection, models.CorrectionLog.detection_id == models.Detection.id)\
        .filter(models.Detection.bin_id.in_(my_bin_ids))\
        .order_by(models.CorrectionLog.corrected_at.desc())\
        .all()

    result = []
    for log in logs:
        result.append(schemas.CorrectionLogDetail(
            id=log.id,
            detection_id=log.detection_id,
            user_id=log.user_id,
            user_email=log.user.email if log.user else None,
            user_name=log.user.name if log.user else None,
            original_category=log.original_category,
            corrected_category=log.corrected_category,
            corrected_at=log.corrected_at,
        ))
    return result


@router.put("/{detection_id}/correct", response_model=schemas.DetectionResponse)
def correct_detection(
    detection_id: int,
    body: schemas.DetectionCorrect,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    detection = db.query(models.Detection).filter(models.Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="분류 기록을 찾을 수 없습니다")

    # 본인 쓰레기통의 감지 결과만 수정 가능 (admin은 전체)
    my_bin_ids = get_my_bin_ids(current_user, db)
    if detection.bin_id not in my_bin_ids:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    original_category = detection.category

    if body.corrected_category == detection.category:
        detection.status = "confirmed"
    else:
        corrected_category_dir = os.path.join(CORRECTED_DIR, body.corrected_category)
        os.makedirs(corrected_category_dir, exist_ok=True)

        filename = os.path.basename(detection.image_path)
        corrected_path = os.path.join(corrected_category_dir, filename)
        shutil.copy2(detection.image_path, corrected_path)

        detection.corrected_category = body.corrected_category
        detection.corrected_image_path = corrected_path
        detection.status = "corrected"

    log = models.CorrectionLog(
        detection_id=detection.id,
        user_id=current_user.id,
        original_category=original_category,
        corrected_category=body.corrected_category,
        corrected_at=now_kst()
    )
    db.add(log)
    db.commit()
    db.refresh(detection)
    return detection