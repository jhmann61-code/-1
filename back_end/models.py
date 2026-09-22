from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from database import Base

KST = timezone(timedelta(hours=9))

def now_kst():
    return datetime.now(KST).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(50), nullable=False)
    role = Column(Enum("user", "admin"), default="user", nullable=False)
    created_at = Column(DateTime, default=now_kst)
    push_token = Column(String(255), nullable=True)

    correction_logs = relationship("CorrectionLog", back_populates="user")


class TrashBin(Base):
    __tablename__ = "trash_bins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    ip = Column(String(45), nullable=True)
    ping_ms = Column(Float, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_kst)

    statuses = relationship("BinStatus", back_populates="bin")
    detections = relationship("Detection", back_populates="bin")


class BinStatus(Base):
    __tablename__ = "bin_status"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(Integer, ForeignKey("trash_bins.id"), nullable=False)
    plastic_pct = Column(Float, default=0.0)
    glass_pct = Column(Float, default=0.0)
    unknown_pct = Column(Float, default=0.0)
    can_pct = Column(Float, default=0.0)
    weight_g = Column(Float, default=0.0)
    gas_level = Column(Float, default=0.0)
    temperature = Column(Float, default=0.0)
    humidity = Column(Float, default=0.0)
    recorded_at = Column(DateTime, default=now_kst)

    plastic_alert_80 = Column(Boolean, default=False, nullable=False)
    plastic_alert_90 = Column(Boolean, default=False, nullable=False)
    glass_alert_80 = Column(Boolean, default=False, nullable=False)
    glass_alert_90 = Column(Boolean, default=False, nullable=False)
    can_alert_80 = Column(Boolean, default=False, nullable=False)
    can_alert_90 = Column(Boolean, default=False, nullable=False)
    unknown_alert_80 = Column(Boolean, default=False, nullable=False)
    unknown_alert_90 = Column(Boolean, default=False, nullable=False)

    bin = relationship("TrashBin", back_populates="statuses")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(Integer, ForeignKey("trash_bins.id"), nullable=False)
    image_path = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    status = Column(Enum("pending", "confirmed", "corrected"), default="pending", nullable=False)
    corrected_category = Column(String(50), nullable=True)
    corrected_image_path = Column(String(255), nullable=True)
    detected_at = Column(DateTime, default=now_kst)

    bin = relationship("TrashBin", back_populates="detections")
    correction_logs = relationship("CorrectionLog", back_populates="detection")


class CorrectionLog(Base):
    __tablename__ = "correction_logs"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_category = Column(String(50), nullable=False)
    corrected_category = Column(String(50), nullable=False)
    corrected_at = Column(DateTime, default=now_kst)

    detection = relationship("Detection", back_populates="correction_logs")
    user = relationship("User", back_populates="correction_logs")