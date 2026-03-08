from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from .base import Base, ist_now


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    # Patient
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Doctor — store both the id (for filtering) and name (for display)
    doctor_id        = Column(Integer, nullable=True)   # links to doctors.id
    doctor_name      = Column(String(150), nullable=False)
    doctor_specialty = Column(String(100), default="Dermatologist")
    doctor_clinic    = Column(String(200))
    doctor_address   = Column(Text)
    doctor_phone     = Column(String(20))

    # Appointment details
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(String(20), nullable=False)
    reason           = Column(Text)
    notes            = Column(Text)

    # Status: pending / accepted / rejected / completed / cancelled
    status = Column(String(20), default="pending")

    # Timestamps
    created_at = Column(DateTime, default=ist_now)
    updated_at = Column(DateTime, default=ist_now, onupdate=ist_now)

    # Relationship back to user
    user = relationship("User", back_populates="appointments")

    def __repr__(self):
        return f"<Appointment {self.id} user:{self.user_id} doctor:{self.doctor_name}>"