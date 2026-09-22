from sqlalchemy.orm import Session
from models import BinStatus, User
from routers.notifications import send_push_notification

CATEGORY_LABEL = {"plastic": "플라스틱", "glass": "유리", "can": "캔", "unknown": "오분류"}


async def check_and_send_alerts(bin_status: BinStatus, db: Session):
    admins = db.query(User).filter(
        User.role == "admin", User.push_token.isnot(None)
    ).all()
    if not admins:
        return

    for category in ["plastic", "glass", "can", "unknown"]:
        pct = getattr(bin_status, f"{category}_pct")
        flag_80 = f"{category}_alert_80"
        flag_90 = f"{category}_alert_90"
        label = CATEGORY_LABEL[category]

        if pct < 10:
            # 비워짐 → 플래그 리셋
            if getattr(bin_status, flag_80) or getattr(bin_status, flag_90):
                setattr(bin_status, flag_80, False)
                setattr(bin_status, flag_90, False)
                db.commit()
            continue

        if pct >= 90 and not getattr(bin_status, flag_90):
            for admin in admins:
                await send_push_notification(
                    admin.push_token, f"⚠️ {label} 용량 90% 초과",
                    f"{label} 칸이 가득 찼습니다. 즉시 수거해 주세요!",
                )
            setattr(bin_status, flag_90, True)
            setattr(bin_status, flag_80, True)  # 90%로 바로 건너뛴 경우 방지
            db.commit()

        elif pct >= 80 and not getattr(bin_status, flag_80):
            for admin in admins:
                await send_push_notification(
                    admin.push_token, f"🔔 {label} 용량 80% 도달",
                    f"{label} 칸 수거가 곧 필요합니다.",
                )
            setattr(bin_status, flag_80, True)
            db.commit()