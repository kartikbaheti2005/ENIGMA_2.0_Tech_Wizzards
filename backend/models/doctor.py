from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from .base import Base, ist_now
from datetime import date as dt_date


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)

    # ── Account linkage ──────────────────────────────────────────────────────
    user_id  = Column(Integer, nullable=True)   # linked User.id after approval
    username = Column(String(80), unique=True, nullable=False, index=True)
    email    = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # ── Personal info ────────────────────────────────────────────────────────
    full_name    = Column(String(150), nullable=False)
    phone        = Column(String(20),  nullable=False)
    gender       = Column(String(20))
    date_of_birth = Column(Date)

    # ── Professional info ────────────────────────────────────────────────────
    post         = Column(String(100), nullable=False)   # e.g. "Dermatologist"
    specialty    = Column(String(150), nullable=False)   # e.g. "Dermato-Oncologist"
    qualification = Column(String(300), nullable=False)  # e.g. "MBBS, MD - AIIMS Delhi"
    education_details = Column(Text)                     # full education narrative

    # Experience: stored as the year they started practicing
    # Actual experience = current_year - start_year (auto-increments every year)
    practice_start_year = Column(Integer, nullable=False)  # e.g. 2012

    # ── Clinic / Location ────────────────────────────────────────────────────
    clinic_name  = Column(String(200), nullable=False)
    address      = Column(Text, nullable=False)
    city         = Column(String(100), nullable=False)

    # ── Availability ─────────────────────────────────────────────────────────
    available_days  = Column(JSON, default=list)   # ["Mon","Wed","Fri"]
    available_slots = Column(JSON, default=list)   # ["09:00 AM","10:00 AM"]

    # ── Professional details ─────────────────────────────────────────────────
    specializes_in     = Column(JSON, default=list)   # ["Acne","Melanoma"]
    languages          = Column(JSON, default=list)   # ["English","Hindi"]
    consultation_fee   = Column(Integer, default=500) # in ₹

    # ── Public profile ───────────────────────────────────────────────────────
    bio              = Column(Text)
    image_placeholder = Column(String(10))   # e.g. "PS" (initials)

    # ── Ratings (updated by admin/system) ───────────────────────────────────
    rating       = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)

    # ── Status ───────────────────────────────────────────────────────────────
    # pending → approved / rejected by admin
    status      = Column(String(20), default="pending")
    is_active   = Column(Boolean, default=False)   # True only after approval
    admin_notes = Column(Text)

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at  = Column(DateTime, default=ist_now)
    updated_at  = Column(DateTime, default=ist_now, onupdate=ist_now)

    @property
    def experience_years(self):
        """Auto-increments every calendar year."""
        return dt_date.today().year - self.practice_start_year

    def to_public_dict(self):
        """Safe dict for the public Find Doctors page."""
        return {
            "id":               self.id,
            "name":             self.full_name,
            "specialty":        self.specialty,
            "post":             self.post,
            "qualification":    self.qualification,
            "experience_years": self.experience_years,
            "rating":           self.rating,
            "review_count":     self.review_count,
            "city":             self.city,
            "clinic":           self.clinic_name,
            "address":          self.address,
            "phone":            self.phone,
            "email":            self.email,
            "consultation_fee": self.consultation_fee,
            "available_days":   self.available_days  or [],
            "available_slots":  self.available_slots or [],
            "specializes_in":   self.specializes_in  or [],
            "languages":        self.languages       or [],
            "image_placeholder": self.image_placeholder or self.full_name[:2].upper(),
            "bio":              self.bio,
        }

    def to_admin_dict(self):
        """Full dict for admin panel."""
        d = self.to_public_dict()
        d.update({
            "username":           self.username,
            "status":             self.status,
            "is_active":          self.is_active,
            "admin_notes":        self.admin_notes,
            "practice_start_year": self.practice_start_year,
            "education_details":  self.education_details,
            "gender":             self.gender,
            "date_of_birth":      str(self.date_of_birth) if self.date_of_birth else None,
            "created_at":         str(self.created_at),
        })
        return d

    def __repr__(self):
        return f"<Doctor {self.full_name} ({self.status})>"