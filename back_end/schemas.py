from pydantic import BaseModel, EmailStr, computed_field
from typing import Optional
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
ONLINE_THRESHOLD_SECONDS = 30  # last_seen이 이 시간 이내면 "연결됨"으로 간주

# =====================
# Auth
# =====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# =====================
# TrashBin
# =====================

class TrashBinCreate(BaseModel):
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ip: Optional[str] = None

class TrashBinResponse(BaseModel):
    id: int
    user_id: Optional[int]
    location: str
    latitude: Optional[float]
    longitude: Optional[float]
    ip: Optional[str]
    ping_ms: Optional[float]
    last_seen: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

    @computed_field
    @property
    def is_online(self) -> bool:
        if self.last_seen is None:
            return False
        now = datetime.now(KST).replace(tzinfo=None)
        return (now - self.last_seen).total_seconds() <= ONLINE_THRESHOLD_SECONDS

# =====================
# BinStatus
# =====================

class BinStatusCreate(BaseModel):
    bin_id: int
    plastic_pct: float = 0.0
    glass_pct: float = 0.0
    unknown_pct: float = 0.0
    can_pct: float = 0.0
    weight_g: float = 0.0
    gas_level: float = 0.0
    temperature: float = 0.0
    humidity: float = 0.0

class BinStatusResponse(BaseModel):
    id: int
    bin_id: int
    plastic_pct: float
    glass_pct: float
    unknown_pct: float
    can_pct: float
    weight_g: float
    gas_level: float
    temperature: float
    humidity: float
    recorded_at: datetime

    class Config:
        from_attributes = True

# =====================
# Detection
# =====================

class DetectionResponse(BaseModel):
    id: int
    bin_id: int
    image_path: str
    category: str
    confidence: float
    status: str
    corrected_category: Optional[str]
    corrected_image_path: Optional[str]
    detected_at: datetime

    class Config:
        from_attributes = True

class DetectionCorrect(BaseModel):
    corrected_category: str

# =====================
# CorrectionLog
# =====================

class CorrectionLogResponse(BaseModel):
    id: int
    detection_id: int
    user_id: int
    original_category: str
    corrected_category: str
    corrected_at: datetime

    class Config:
        from_attributes = True

class CorrectionLogDetail(BaseModel):
    id: int
    detection_id: int
    user_id: int
    user_email: Optional[str]
    user_name: Optional[str]
    original_category: str
    corrected_category: str
    corrected_at: datetime

    class Config:
        from_attributes = True


class PushTokenIn(BaseModel):
    push_token: str