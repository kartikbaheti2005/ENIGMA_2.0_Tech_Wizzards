"""
DermAssist AI — Admin & Appointments Router
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date as dt_date
import json

from database import SessionLocal
from models.user import User
from models.prediciton import Prediction
from models.appointment import Appointment
from auth import get_current_user

router = APIRouter(tags=["admin & appointments"])


# ── DB dependency ─────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Admin guard ───────────────────────────────────────────────────────────────
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# =============================================================================
#  ADMIN ENDPOINTS
# =============================================================================

@router.get("/admin/stats")
def admin_stats(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from datetime import datetime, timedelta
    total_users    = db.query(User).count()
    active_users   = db.query(User).filter(User.is_active == True).count()
    total_scans    = db.query(Prediction).count()
    total_apts     = db.query(Appointment).count()
    pending_apts   = db.query(Appointment).filter(Appointment.status == "pending").count()
    high_risk      = db.query(Prediction).filter(
        Prediction.predicted_label.in_(["mel", "bcc", "akiec"])
    ).count()
    week_ago       = datetime.utcnow() - timedelta(days=7)
    recent_scans   = db.query(Prediction).filter(Prediction.created_at >= week_ago).count()

    return {
        "total_users":          total_users,
        "active_users":         active_users,
        "total_scans":          total_scans,
        "high_risk_scans":      high_risk,
        "recent_scans_7d":      recent_scans,
        "total_appointments":   total_apts,
        "pending_appointments": pending_apts,
    }


@router.get("/admin/users")
def admin_list_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    q = db.query(User)
    if search:
        q = q.filter(
            User.full_name.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%") |
            User.username.ilike(f"%{search}%")
        )
    users = q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    total = q.count()

    result = []
    for u in users:
        scan_count = db.query(Prediction).filter(Prediction.user_id == u.id).count()
        result.append({
            "id":         u.id,
            "full_name":  u.full_name,
            "username":   u.username,
            "email":      u.email,
            "role":       u.role,
            "is_active":  u.is_active,
            "scan_count": scan_count,
            "created_at": str(u.created_at),
            "last_login": str(u.last_login) if u.last_login else None,
        })
    return {"users": result, "total": total}


@router.put("/admin/users/{user_id}/activate")
def admin_toggle_user(
    user_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user_id, "is_active": user.is_active}


@router.get("/admin/scans")
def admin_list_scans(
    skip: int = 0,
    limit: int = 50,
    risk: Optional[str] = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Prediction, User).join(User, Prediction.user_id == User.id)
    if risk == "high":
        q = q.filter(Prediction.predicted_label.in_(["mel", "bcc", "akiec"]))
    elif risk == "moderate":
        q = q.filter(Prediction.predicted_label.in_(["bkl", "df", "vasc"]))
    elif risk == "low":
        q = q.filter(Prediction.predicted_label == "nv")

    total = q.count()
    rows  = q.order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()

    name_map = {
        'mel': 'Melanoma', 'bcc': 'Basal Cell Carcinoma',
        'akiec': 'Actinic Keratosis', 'bkl': 'Benign Keratosis',
        'df': 'Dermatofibroma', 'vasc': 'Vascular Lesion', 'nv': 'Melanocytic Nevi',
    }
    risk_map = {
        'mel': 'High Risk', 'bcc': 'High Risk', 'akiec': 'High Risk',
        'bkl': 'Moderate Risk', 'df': 'Moderate Risk', 'vasc': 'Moderate Risk',
        'nv': 'Low Risk',
    }

    result = []
    for scan, user in rows:
        extra = {}
        try:
            extra = json.loads(scan.extra_metadata) if scan.extra_metadata else {}
        except Exception:
            pass
        result.append({
            "id":               scan.id,
            "user_id":          scan.user_id,
            "user_name":        user.full_name,
            "user_email":       user.email,
            "predicted_label":  scan.predicted_label,
            "diagnosis_name":   name_map.get(scan.predicted_label, scan.predicted_label),
            "risk_level":       risk_map.get(scan.predicted_label, "Unknown"),
            "confidence_score": scan.confidence_score,
            "image_url":        extra.get("image_url"),
            "created_at":       str(scan.created_at),
        })
    return {"scans": result, "total": total}


@router.get("/admin/appointments")
def admin_list_appointments(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Appointment, User).join(User, Appointment.user_id == User.id)
    if status:
        q = q.filter(Appointment.status == status)
    total = q.count()
    rows  = q.order_by(Appointment.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for apt, user in rows:
        result.append({
            "id":               apt.id,
            "patient_name":     user.full_name,
            "patient_email":    user.email,
            "patient_phone":    user.phone_number,
            "doctor_name":      apt.doctor_name,
            "doctor_specialty": apt.doctor_specialty,
            "doctor_clinic":    apt.doctor_clinic,
            "appointment_date": str(apt.appointment_date),
            "appointment_time": apt.appointment_time,
            "reason":           apt.reason,
            "notes":            apt.notes,
            "status":           apt.status,
            "created_at":       str(apt.created_at),
        })
    return {"appointments": result, "total": total}


class AppointmentStatusUpdate(BaseModel):
    status: str

@router.put("/admin/appointments/{apt_id}/status")
def admin_update_appointment_status(
    apt_id: int,
    body: AppointmentStatusUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    valid = {"accepted", "rejected", "completed", "pending"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
    apt = db.query(Appointment).filter(Appointment.id == apt_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    apt.status = body.status
    db.commit()
    return {"id": apt_id, "status": apt.status}


class DoctorNotes(BaseModel):
    notes: str

@router.post("/admin/appointments/{apt_id}/notes")
def admin_add_notes(
    apt_id: int,
    body: DoctorNotes,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    apt = db.query(Appointment).filter(Appointment.id == apt_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    apt.notes = body.notes
    db.commit()
    return {"id": apt_id, "notes": apt.notes}


# =============================================================================
#  PATIENT APPOINTMENT ENDPOINTS
# =============================================================================

class BookAppointmentRequest(BaseModel):
    doctor_id:        Optional[int] = None   # links to doctors.id
    doctor_name:      str
    doctor_specialty: Optional[str] = "Dermatologist"
    doctor_clinic:    Optional[str] = None
    doctor_address:   Optional[str] = None
    doctor_phone:     Optional[str] = None
    appointment_date: str
    appointment_time: str
    reason:           Optional[str] = None


@router.post("/appointments")
def book_appointment(
    body: BookAppointmentRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    # Read token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Login required to book appointments")
    token = auth_header.split(" ", 1)[1]

    from jose import jwt as jose_jwt, JWTError
    from auth import SECRET_KEY, ALGORITHM
    try:
        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    current_user = db.query(User).filter(User.username == username).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="User account not found. Please log in as a patient.")

    try:
        apt_date = dt_date.fromisoformat(body.appointment_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    apt = Appointment(
        user_id          = current_user.id,
        doctor_id        = body.doctor_id,        # ✅ save doctor_id for doctor's dashboard
        doctor_name      = body.doctor_name,
        doctor_specialty = body.doctor_specialty,
        doctor_clinic    = body.doctor_clinic,
        doctor_address   = body.doctor_address,
        doctor_phone     = body.doctor_phone,
        appointment_date = apt_date,
        appointment_time = body.appointment_time,
        reason           = body.reason,
        status           = "pending",
    )
    db.add(apt)
    db.commit()
    db.refresh(apt)
    return {
        "id":      apt.id,
        "status":  apt.status,
        "message": "Appointment booked successfully! Awaiting confirmation.",
    }


@router.get("/appointments")
def my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    apts = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.created_at.desc())
        .all()
    )

    # ✅ Returns {"appointments": [...]} — consistent with frontend expectation
    return {
        "appointments": [
            {
                "id":               a.id,
                "doctor_name":      a.doctor_name,
                "doctor_specialty": a.doctor_specialty,
                "doctor_clinic":    a.doctor_clinic,
                "doctor_address":   a.doctor_address,
                "doctor_phone":     a.doctor_phone,
                "appointment_date": str(a.appointment_date),
                "appointment_time": a.appointment_time,
                "reason":           a.reason,
                "notes":            a.notes,
                "status":           a.status,
                "created_at":       str(a.created_at),
            }
            for a in apts
        ]
    }


@router.delete("/appointments/{apt_id}")
def cancel_appointment(
    apt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    apt = db.query(Appointment).filter(
        Appointment.id == apt_id,
        Appointment.user_id == current_user.id
    ).first()

    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if apt.status in ("completed", "rejected"):
        raise HTTPException(status_code=400, detail="Cannot cancel a completed or rejected appointment")

    apt.status = "cancelled"
    db.commit()
    return {"message": "Appointment cancelled"}


# =============================================================================
#  DOCTOR APPOINTMENT ENDPOINTS
# =============================================================================

@router.get("/doctor/appointments")
def doctor_get_appointments(
    request: Request,
    db: Session = Depends(get_db)
):
    """Doctor fetches their own appointments using their JWT token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]

    from jose import jwt as jose_jwt, JWTError
    from auth import SECRET_KEY, ALGORITHM
    try:
        data = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        doctor_id = data.get("doctor_id")
        doctor_username = data.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Fetch appointments that belong to this doctor (by doctor_id or by name match)
    if doctor_id:
        appts = (
            db.query(Appointment, User)
            .join(User, Appointment.user_id == User.id)
            .filter(Appointment.doctor_id == doctor_id)
            .order_by(Appointment.appointment_date.desc())
            .all()
        )
    else:
        # Fallback: match by doctor username in doctor_name column
        appts = (
            db.query(Appointment, User)
            .join(User, Appointment.user_id == User.id)
            .filter(Appointment.doctor_name.ilike(f"%{doctor_username}%"))
            .order_by(Appointment.appointment_date.desc())
            .all()
        )

    return {
        "appointments": [
            {
                "id":               a.id,
                "patient_name":     u.full_name,
                "patient_email":    u.email,
                "patient_phone":    u.phone_number,
                "appointment_date": str(a.appointment_date),
                "appointment_time": a.appointment_time,
                "reason":           a.reason,
                "notes":            a.notes,
                "status":           a.status,
                "created_at":       str(a.created_at),
            }
            for a, u in appts
        ]
    }


class DoctorAppointmentUpdate(BaseModel):
    status: str   # accepted / rejected / completed
    notes:  Optional[str] = None


@router.put("/doctor/appointments/{apt_id}/status")
def doctor_update_appointment(
    apt_id: int,
    body: DoctorAppointmentUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Doctor accepts, rejects, or marks appointment as completed."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]

    from jose import jwt as jose_jwt, JWTError
    from auth import SECRET_KEY, ALGORITHM
    try:
        data = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        doctor_id = data.get("doctor_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    valid = {"accepted", "rejected", "completed"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid}")

    # Find the appointment — must belong to this doctor
    apt = db.query(Appointment).filter(Appointment.id == apt_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Security check: only the assigned doctor can update
    if doctor_id and apt.doctor_id and apt.doctor_id != doctor_id:
        raise HTTPException(status_code=403, detail="Not your appointment")

    apt.status = body.status
    if body.notes:
        apt.notes = body.notes
    db.commit()
    return {"id": apt_id, "status": apt.status, "message": f"Appointment {body.status}"}


# =============================================================================
#  PASSWORD RESET (Admin only)
# =============================================================================

from pydantic import BaseModel as _PB

class AdminPasswordReset(_PB):
    user_id:      int = None
    username:     str = None
    new_password: str

@router.post("/users/reset-password")
def admin_reset_user_password(
    payload: AdminPasswordReset,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if payload.user_id:
        target = db.query(User).filter(User.id == payload.user_id).first()
    elif payload.username:
        target = (
            db.query(User).filter(User.username == payload.username).first() or
            db.query(User).filter(User.email    == payload.username).first()
        )
    else:
        raise HTTPException(400, "Provide user_id or username/email")
    if not target:
        raise HTTPException(404, "User not found")
    if len(payload.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    target.set_password(payload.new_password)
    db.commit()
    return {"message": f"Password reset for {target.username}", "user_id": target.id}


class AdminDoctorPasswordReset(_PB):
    doctor_id:    int = None
    email:        str = None
    new_password: str

@router.post("/doctors/reset-password")
def admin_reset_doctor_password(
    payload: AdminDoctorPasswordReset,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from models.doctor import Doctor
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

    if payload.doctor_id:
        doc = db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
    elif payload.email:
        doc = db.query(Doctor).filter(Doctor.email == payload.email).first()
    else:
        raise HTTPException(400, "Provide doctor_id or email")
    if not doc:
        raise HTTPException(404, "Doctor not found")
    if len(payload.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    doc.password_hash = pwd.hash(payload.new_password)
    db.commit()
    return {"message": f"Password reset for Dr. {doc.full_name}", "doctor_id": doc.id}