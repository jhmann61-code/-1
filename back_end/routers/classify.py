# routers/classify.py
import tempfile
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.inference import run_inference

router = APIRouter(prefix="/api", tags=["classify"])

@router.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    image_bytes = await file.read()

    # Windows에서는 파일을 연 채로 다시 열 수 없어서 delete=False로 만들고
    # 직접 닫은 뒤 run_inference에서 열게 하고, 끝나면 수동으로 삭제
    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    try:
        tmp.write(image_bytes)
        tmp.close()
        label, confidence = run_inference(tmp.name)
    finally:
        os.remove(tmp.name)

    return {
        "success": True,
        "label": label,
        "bin": label,
        "confidence": round(confidence, 4),
        "is_low_confidence": label == "unknown"
    }