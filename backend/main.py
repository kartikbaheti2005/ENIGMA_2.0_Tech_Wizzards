from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
import numpy as np
import os
import time
import uuid
import json
import io
from typing import Optional
from sqlalchemy.orm import Session
from PIL import Image as PILImage

from database import engine, SessionLocal
from models import Base
from models.user import User
from models.images import Image
from models.prediciton import Prediction
from models.appointment import Appointment
from models.doctor import Doctor
import auth
import admin as admin_module
from auth import get_current_user, oauth2_scheme

app = FastAPI(title="DermAssist AI Backend", version="2.0.0")

# ── Create DB tables ──────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Seed sample doctors ───────────────────────────────────────────────────────
SAMPLE_DOCTORS = [
    {"username":"priya.sharma","email":"priya.sharma@skinclinic.in","full_name":"Dr. Priya Sharma","phone":"+91 98100 11111","post":"Dermatologist","specialty":"Dermatologist","qualification":"MD, MBBS – AIIMS Delhi","practice_start_year":2011,"clinic_name":"Skin Care Clinic","address":"12, Connaught Place, New Delhi, Delhi 110001","city":"Delhi","available_days":["Mon","Tue","Wed","Fri"],"available_slots":["10:00 AM","11:00 AM","2:00 PM","3:30 PM"],"consultation_fee":700,"languages":["Hindi","English"],"specializes_in":["Melanoma","Acne","Eczema","Psoriasis"],"image_placeholder":"PS","rating":4.8,"review_count":312,"bio":"Experienced dermatologist specializing in skin cancer detection and acne treatment."},
    {"username":"rahul.mehta","email":"rahul.mehta@asi.in","full_name":"Dr. Rahul Mehta","phone":"+91 98200 22222","post":"Dermatologist & Oncologist","specialty":"Dermato-Oncology","qualification":"MD Dermatology, DNB – Bombay Hospital","practice_start_year":2007,"clinic_name":"Advanced Skin Institute","address":"45, Linking Road, Bandra West, Mumbai, Maharashtra 400050","city":"Mumbai","available_days":["Mon","Wed","Thu","Sat"],"available_slots":["9:00 AM","10:30 AM","12:00 PM","4:00 PM"],"consultation_fee":1200,"languages":["Hindi","English","Marathi"],"specializes_in":["Skin Cancer","Basal Cell Carcinoma","Moles","Pigmentation"],"image_placeholder":"RM","rating":4.9,"review_count":487,"bio":"Leading dermato-oncologist with expertise in skin cancer surgery and advanced diagnostics."},
    {"username":"ananya.krishnan","email":"ananya.k@dermacare.in","full_name":"Dr. Ananya Krishnan","phone":"+91 94440 33333","post":"Cosmetic Dermatologist","specialty":"Cosmetic Dermatology","qualification":"MD – Madras Medical College","practice_start_year":2015,"clinic_name":"DermaCare Centre","address":"78, Anna Salai, Teynampet, Chennai, Tamil Nadu 600018","city":"Chennai","available_days":["Tue","Wed","Fri","Sat"],"available_slots":["11:00 AM","1:00 PM","3:00 PM","5:00 PM"],"consultation_fee":600,"languages":["Tamil","English","Hindi"],"specializes_in":["Keratosis","Dermatofibroma","Anti-aging","Laser"],"image_placeholder":"AK","rating":4.7,"review_count":198,"bio":"Specializes in cosmetic procedures, anti-aging, and laser skin treatments."},
    {"username":"sanjay.gupta","email":"sanjay.gupta@pss.in","full_name":"Dr. Sanjay Gupta","phone":"+91 98700 44444","post":"Dermatologist","specialty":"Clinical Dermatology","qualification":"MD, DVD – KEM Hospital Pune","practice_start_year":2013,"clinic_name":"Pune Skin Solutions","address":"22, FC Road, Shivajinagar, Pune, Maharashtra 411005","city":"Pune","available_days":["Mon","Tue","Thu","Fri","Sat"],"available_slots":["9:30 AM","11:00 AM","2:30 PM","4:30 PM"],"consultation_fee":550,"languages":["Hindi","English","Marathi"],"specializes_in":["Vascular Lesions","Nevi","Skin Screening","Acne"],"image_placeholder":"SG","rating":4.6,"review_count":245,"bio":"General dermatologist focused on early skin cancer screening and acne management."},
    {"username":"meera.nair","email":"meera.nair@glowderm.in","full_name":"Dr. Meera Nair","phone":"+91 94960 55555","post":"Dermatologist","specialty":"Dermatology","qualification":"MD – Amrita Institute Kochi","practice_start_year":2016,"clinic_name":"Glow Dermatology","address":"36, MG Road, Ernakulam, Kochi, Kerala 682035","city":"Kochi","available_days":["Mon","Wed","Fri","Sat"],"available_slots":["10:00 AM","12:00 PM","3:00 PM","5:30 PM"],"consultation_fee":500,"languages":["Malayalam","English","Hindi"],"specializes_in":["Melanoma Screening","Benign Lesions","Skin Allergies"],"image_placeholder":"MN","rating":4.8,"review_count":167,"bio":"Passionate about melanoma early detection and managing complex allergic skin conditions."},
    {"username":"arjun.patel","email":"arjun.patel@aslc.in","full_name":"Dr. Arjun Patel","phone":"+91 98980 66666","post":"Surgical Dermatologist","specialty":"Dermato-Surgery","qualification":"MCh Dermato-Surgery – BJ Medical College","practice_start_year":2010,"clinic_name":"Ahmedabad Skin & Laser Centre","address":"101, CG Road, Navrangpura, Ahmedabad, Gujarat 380009","city":"Ahmedabad","available_days":["Tue","Wed","Thu","Sat"],"available_slots":["9:00 AM","11:30 AM","2:00 PM","4:00 PM"],"consultation_fee":800,"languages":["Gujarati","Hindi","English"],"specializes_in":["Surgical Excision","Skin Cancer Surgery","Biopsies"],"image_placeholder":"AP","rating":4.7,"review_count":289,"bio":"Expert in skin cancer surgery, mole removal, and complex dermatological procedures."},
    {"username":"sunita.reddy","email":"sunita.reddy@hitech.in","full_name":"Dr. Sunita Reddy","phone":"+91 99000 77777","post":"Dermatologist","specialty":"Photo-dermatology","qualification":"MD – Osmania Medical College","practice_start_year":2014,"clinic_name":"HiTech Skin Clinic","address":"56, Banjara Hills Road, Hyderabad, Telangana 500034","city":"Hyderabad","available_days":["Mon","Tue","Thu","Fri"],"available_slots":["10:30 AM","12:00 PM","2:30 PM","5:00 PM"],"consultation_fee":650,"languages":["Telugu","Hindi","English"],"specializes_in":["Pigmentation","Actinic Keratosis","Photo-aging","Moles"],"image_placeholder":"SR","rating":4.6,"review_count":203,"bio":"Specialist in sun-related skin disorders, pigmentation, and photo-aging treatments."},
    {"username":"vikram.singh","email":"vikram.singh@cdc.in","full_name":"Dr. Vikram Singh","phone":"+91 98140 88888","post":"Dermatologist & Venereologist","specialty":"Dermatology & Venereology","qualification":"MD DVL – PGI Chandigarh","practice_start_year":2009,"clinic_name":"Chandigarh Derm Clinic","address":"Sector 17-C, Chandigarh, Punjab 160017","city":"Chandigarh","available_days":["Mon","Wed","Fri","Sat"],"available_slots":["9:00 AM","10:00 AM","1:00 PM","3:30 PM"],"consultation_fee":900,"languages":["Hindi","Punjabi","English"],"specializes_in":["Melanocytic Nevi","Rare Skin Disorders","Psoriasis"],"image_placeholder":"VS","rating":4.9,"review_count":356,"bio":"Senior dermatologist with extensive experience in rare skin disorders and psoriasis management."},
]

def seed_sample_doctors():
    from passlib.context import CryptContext
    _pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    db = SessionLocal()
    try:
        for d in SAMPLE_DOCTORS:
            if db.query(Doctor).filter(Doctor.email == d["email"]).first():
                continue
            db.add(Doctor(
                username=d["username"], email=d["email"],
                password_hash=_pwd.hash("SampleDoctor@123"),
                full_name=d["full_name"], phone=d["phone"],
                post=d["post"], specialty=d["specialty"],
                qualification=d["qualification"],
                practice_start_year=d["practice_start_year"],
                clinic_name=d["clinic_name"], address=d["address"], city=d["city"],
                available_days=d["available_days"], available_slots=d["available_slots"],
                consultation_fee=d["consultation_fee"], languages=d["languages"],
                specializes_in=d["specializes_in"], image_placeholder=d["image_placeholder"],
                rating=d["rating"], review_count=d["review_count"], bio=d["bio"],
                status="approved", is_active=True,
            ))
        db.commit()
        print("✅ Sample doctors seeded into database.")
    except Exception as e:
        db.rollback()
        print(f"⚠  Could not seed doctors: {e}")
    finally:
        db.close()

seed_sample_doctors()

# ── Static files & CORS ───────────────────────────────────────────────────────
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin_module.router)


# ══════════════════════════════════════════════════════════════════════════════
#  PyTorch MODEL SETUP
#  Architecture from best_model.pth (discovered by inspecting data.pkl):
#    image_branch : EfficientNet-B3  →  1536-dim features
#    image_fc     : Linear(1536, 512) + BatchNorm1d + ReLU
#    meta_fc      : Linear(11, 128)   + BatchNorm1d + ReLU
#    fusion       : Linear(640, 8)    →  8 class logits
# ══════════════════════════════════════════════════════════════════════════════

import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models

MODEL_PATH = "best_model.pth"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CLASSES = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc", "unk"]

RISK_MAP = {
    "mel":   "High Risk",
    "bcc":   "High Risk",
    "akiec": "High Risk",
    "bkl":   "Moderate Risk",
    "df":    "Moderate Risk",
    "vasc":  "Moderate Risk",
    "nv":    "Low Risk",
    "unk":   "Low Risk",
}

NAME_MAP = {
    "mel":   "Melanoma",
    "bcc":   "Basal Cell Carcinoma",
    "akiec": "Actinic Keratosis",
    "bkl":   "Benign Keratosis",
    "df":    "Dermatofibroma",
    "vasc":  "Vascular Lesion",
    "nv":    "Melanocytic Nevi",
    "unk":   "Unable to Analyse — Please Retake Photo",
}

# Note: current model has a known accuracy issue due to metadata branch mismatch.
# A new model trained on 3 combined datasets is pending. Until then, low-confidence
# predictions are returned as "unk" to avoid misleading the user.
MODEL_RELIABLE = False  # Set True once new best_model.pth is deployed

# Base transform — 300x300 is EfficientNet-B3 native resolution (better than 224)
IMG_TRANSFORM = transforms.Compose([
    transforms.Resize((300, 300)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

# TTA transforms — 5 augmented views averaged at inference time
TTA_TRANSFORMS = [
    # 1. Standard (same as base)
    transforms.Compose([
        transforms.Resize((300, 300)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
    # 2. Horizontal flip
    transforms.Compose([
        transforms.Resize((300, 300)),
        transforms.RandomHorizontalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
    # 3. Vertical flip
    transforms.Compose([
        transforms.Resize((300, 300)),
        transforms.RandomVerticalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
    # 4. Center crop then resize
    transforms.Compose([
        transforms.Resize((330, 330)),
        transforms.CenterCrop(300),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
    # 5. Slight rotation
    transforms.Compose([
        transforms.Resize((300, 300)),
        transforms.RandomRotation(degrees=15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
]


class DualBranchSkinModel(nn.Module):
    """
    Custom dual-branch model matching best_model.pth exactly:
      - image_branch : EfficientNet-B3 feature extractor (outputs 1536)
      - image_fc     : Linear(1536->512) + BN + ReLU
      - meta_fc      : Linear(11->128)   + BN + ReLU
      - fusion       : Linear(640->8)
    """
    def __init__(self):
        super().__init__()
        efficientnet = models.efficientnet_b3(weights=None)
        self.image_branch = nn.Sequential(
            efficientnet.features,
            efficientnet.avgpool,
            nn.Flatten(),
        )
        self.image_fc = nn.Sequential(
            nn.Linear(1536, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
        )
        self.meta_fc = nn.Sequential(
            nn.Linear(11, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
        )
        self.fusion = nn.Linear(640, 8)

    def forward(self, image, meta):
        img_feat = self.image_branch(image)
        img_out  = self.image_fc(img_feat)
        meta_out = self.meta_fc(meta)
        combined = torch.cat([img_out, meta_out], dim=1)
        return self.fusion(combined)


# Global model variable
torch_model = None


def load_pytorch_model():
    global torch_model

    if not os.path.exists(MODEL_PATH):
        print(f"❌ best_model.pth not found at: {os.path.abspath(MODEL_PATH)}")
        print(f"   Place best_model.pth inside:  {os.path.abspath('.')}")
        return

    try:
        print(f"⏳ Loading best_model.pth from {os.path.abspath(MODEL_PATH)} ...")
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)

        model = DualBranchSkinModel()

        # Handle all checkpoint formats
        if isinstance(checkpoint, nn.Module):
            # Full model object saved directly
            torch_model = checkpoint.to(DEVICE).eval()
            print(f"✅ best_model.pth loaded (full model) on {DEVICE}")
            return

        if isinstance(checkpoint, dict):
            # Look for common state_dict wrapper keys
            for key in ("model_state_dict", "state_dict", "model"):
                if key in checkpoint:
                    state_dict = checkpoint[key]
                    break
            else:
                # The dict itself is the state_dict
                state_dict = checkpoint
        else:
            raise ValueError(f"Unknown checkpoint format: {type(checkpoint)}")

        model.load_state_dict(state_dict, strict=False)
        torch_model = model.to(DEVICE).eval()
        print(f"✅ best_model.pth loaded successfully on {DEVICE}")

    except Exception as e:
        print(f"❌ Failed to load best_model.pth: {e}")
        torch_model = None


load_pytorch_model()


# ── DB dependency ─────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Build metadata vector for the model ──────────────────────────────────────
def build_meta_vector(age=None, gender=None, lesion_location=None):
    """
    11-feature vector:
    [age_norm, sex_male, sex_female,
     loc_back, loc_lower_extremity, loc_trunk,
     loc_upper_extremity, loc_abdomen, loc_face, loc_chest, loc_foot]
    """
    vec = [0.0] * 11

    try:
        vec[0] = min(float(age), 100.0) / 100.0 if age else 0.0
    except (ValueError, TypeError):
        vec[0] = 0.0

    if gender:
        g = gender.lower()
        if g in ("male", "m"):
            vec[1] = 1.0
        elif g in ("female", "f"):
            vec[2] = 1.0

    loc_map = {
        "back": 3, "lower extremity": 4, "trunk": 5,
        "upper extremity": 6, "abdomen": 7, "face": 8,
        "chest": 9, "foot": 10,
    }
    if lesion_location:
        ll = lesion_location.lower().strip()
        for key, idx in loc_map.items():
            if key in ll:
                vec[idx] = 1.0
                break

    return torch.tensor([vec], dtype=torch.float32).to(DEVICE)


# ── Preprocess image ──────────────────────────────────────────────────────────
def preprocess_image(image_bytes):
    try:
        pil_img = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise ValueError("Could not decode image. Please upload a valid JPEG or PNG.")
    return IMG_TRANSFORM(pil_img).unsqueeze(0).to(DEVICE)

def preprocess_image_tta(image_bytes):
    """Returns list of 5 augmented tensors for Test-Time Augmentation."""
    try:
        pil_img = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise ValueError("Could not decode image. Please upload a valid JPEG or PNG.")
    return [t(pil_img).unsqueeze(0).to(DEVICE) for t in TTA_TRANSFORMS]


# ── Root & health ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message":      "DermAssist AI Backend is running.",
        "model_loaded": torch_model is not None,
        "model_type":   "PyTorch EfficientNet-B3 (best_model.pth)",
        "device":       str(DEVICE),
    }


@app.get("/health")
def health_check():
    return {
        "status":       "ok",
        "model_loaded": torch_model is not None,
        "device":       str(DEVICE),
    }


# ── Predict ───────────────────────────────────────────────────────────────────
@app.post("/predict")
async def predict(
    file:             UploadFile     = File(...),
    first_name:       Optional[str]  = Form(None),
    last_name:        Optional[str]  = Form(None),
    age:              Optional[str]  = Form(None),
    gender:           Optional[str]  = Form(None),
    family_history:   Optional[str]  = Form(None),
    previous_cancer:  Optional[str]  = Form(None),
    smoking:          Optional[str]  = Form(None),
    uv_exposure:      Optional[str]  = Form(None),
    skin_type:        Optional[str]  = Form(None),
    medications:      Optional[str]  = Form(None),
    new_mole:         Optional[str]  = Form(None),
    mole_change:      Optional[str]  = Form(None),
    itching:          Optional[str]  = Form(None),
    bleeding:         Optional[str]  = Form(None),
    sore_not_healing: Optional[str]  = Form(None),
    spread_pigment:   Optional[str]  = Form(None),
    ldh:              Optional[str]  = Form(None),
    s100b:            Optional[str]  = Form(None),
    mia:              Optional[str]  = Form(None),
    vegf:             Optional[str]  = Form(None),
    lesion_location:  Optional[str]  = Form(None),
    lesion_size:      Optional[str]  = Form(None),
    lesion_duration:  Optional[str]  = Form(None),
    db:               Session        = Depends(get_db),
    current_user:     Optional[User] = Depends(get_current_user),
):
    if torch_model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model not loaded. "
                f"Place best_model.pth in: {os.path.abspath('.')}"
            )
        )

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(400, "Only JPEG and PNG images are accepted.")

    contents = await file.read()

    try:
        img_tensor = preprocess_image(contents)
        # Fix: pass sensible defaults if metadata missing
        # Model was trained with mean age ~50, balanced gender, trunk as most common location
        effective_age      = age             if age             else "50"
        effective_gender   = gender          if gender          else "unknown"
        effective_location = lesion_location if lesion_location else "trunk"
        meta_tensor = build_meta_vector(effective_age, effective_gender, effective_location)
    except ValueError as e:
        raise HTTPException(400, str(e))

    start_time = time.time()
    try:
        with torch.no_grad():
            # ── Test-Time Augmentation: run 5 augmented views, average probs ──
            tta_tensors = preprocess_image_tta(contents)
            all_probs = []
            for tta_tensor in tta_tensors:
                logits = torch_model(tta_tensor, meta_tensor)
                p = torch.softmax(logits, dim=1).cpu().numpy()[0]
                all_probs.append(p)
            probs = np.mean(all_probs, axis=0)
    except Exception as e:
        raise HTTPException(500, f"Inference failed: {e}")

    processing_ms = int((time.time() - start_time) * 1000)

    idx        = int(np.argmax(probs[:7]))   # only 7 real classes
    prediction = CLASSES[idx]
    confidence = float(probs[idx])

    # ── Confidence sanity check ───────────────────────────────────────────────
    # If model is not confident (all probs ~equal = broken/garbage input),
    # return "uncertain" instead of a misleading high-risk diagnosis
    MAX_PROB   = float(np.max(probs[:7]))
    ENTROPY    = float(-np.sum(probs[:7] * np.log(probs[:7] + 1e-9)))
    MAX_ENTROPY = float(np.log(7))  # max possible entropy for 7 classes
    UNCERTAINTY = ENTROPY / MAX_ENTROPY   # 0=certain, 1=completely random

    if UNCERTAINTY > 0.92 or MAX_PROB < 0.20:
        # Model is essentially guessing — do not report a diagnosis
        prediction = "unk"
        confidence = MAX_PROB

    all_scores = {CLASSES[i]: round(float(probs[i]), 4) for i in range(7)}

    # Save scan if user is logged in
    image_url = None
    if current_user:
        try:
            ext = (
                file.filename.split(".")[-1]
                if file.filename and "." in file.filename
                else "jpg"
            ).lower()
            image_name = f"{uuid.uuid4().hex}.{ext}"
            image_path = os.path.join(UPLOAD_DIR, image_name)
            with open(image_path, "wb") as f:
                f.write(contents)
            image_url = f"/uploads/{image_name}"

            img_rec = Image(
                image_name=image_name,
                image_path=image_path,
                image_format=file.content_type,
                image_size_kb=len(contents) // 1024,
                user_id=current_user.id,
            )
            db.add(img_rec)
            db.flush()

            db.add(Prediction(
                predicted_label=prediction,
                confidence_score=round(confidence, 4),
                model_version="best_model_pytorch_v1",
                processing_time_ms=processing_ms,
                raw_output=json.dumps(all_scores),
                extra_metadata=json.dumps({
                    "risk_level":     RISK_MAP.get(prediction, "Low Risk"),
                    "diagnosis_name": NAME_MAP.get(prediction, prediction),
                    "image_url":      image_url,
                    "intake": {
                        "name":             f"{first_name or ''} {last_name or ''}".strip(),
                        "age":              age,
                        "gender":           gender,
                        "family_history":   family_history,
                        "previous_cancer":  previous_cancer,
                        "smoking":          smoking,
                        "uv_exposure":      uv_exposure,
                        "skin_type":        skin_type,
                        "new_mole":         new_mole,
                        "mole_change":      mole_change,
                        "itching":          itching,
                        "bleeding":         bleeding,
                        "sore_not_healing": sore_not_healing,
                        "spread_pigment":   spread_pigment,
                        "ldh":              ldh,
                        "s100b":            s100b,
                        "mia":              mia,
                        "vegf":             vegf,
                        "lesion_location":  lesion_location,
                        "lesion_size":      lesion_size,
                        "lesion_duration":  lesion_duration,
                    },
                }),
                status="completed",
                user_id=current_user.id,
                image_id=img_rec.id,
            ))
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"⚠  Could not save scan to DB: {e}")

    return {
        "diagnosis":      prediction,
        "diagnosis_name": NAME_MAP.get(prediction, prediction),
        "risk_level":     RISK_MAP.get(prediction, "Low Risk"),
        "confidence":     round(confidence, 4),
        "all_scores":     all_scores,
        "image_url":      image_url,
    }


# ── User scan history ─────────────────────────────────────────────────────────
@app.get("/user/scans")
def get_user_scans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(401, "Not authenticated")
    scans = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    result = []
    for s in scans:
        extra = {}
        try:
            extra = json.loads(s.extra_metadata) if s.extra_metadata else {}
        except Exception:
            pass
        result.append({
            "id":                 s.id,
            "predicted_label":    s.predicted_label,
            "confidence_score":   s.confidence_score,
            "risk_level":         extra.get("risk_level", ""),
            "diagnosis_name":     extra.get("diagnosis_name", s.predicted_label),
            "image_url":          extra.get("image_url", None),
            "processing_time_ms": s.processing_time_ms,
            "created_at":         str(s.created_at),
        })
    return result


# ── Full user profile ─────────────────────────────────────────────────────────
@app.get("/user/me")
def get_full_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(401, "Not authenticated")
    total_scans = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .count()
    )
    return {
        "id":            current_user.id,
        "full_name":     current_user.full_name,
        "username":      current_user.username,
        "email":         current_user.email,
        "phone_number":  current_user.phone_number,
        "gender":        current_user.gender,
        "date_of_birth": str(current_user.date_of_birth) if current_user.date_of_birth else None,
        "role":          current_user.role,
        "is_active":     current_user.is_active,
        "total_scans":   total_scans,
        "created_at":    str(current_user.created_at),
    }


# ── Download PDF report ───────────────────────────────────────────────────────
@app.get("/user/scans/{scan_id}/report")
def download_scan_report(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from report_generator import generate_scan_report

    if not current_user:
        raise HTTPException(401, "Not authenticated")
    scan = db.query(Prediction).filter(
        Prediction.id == scan_id,
        Prediction.user_id == current_user.id,
    ).first()
    if not scan:
        raise HTTPException(404, "Scan not found")

    extra = {}
    try:
        extra = json.loads(scan.extra_metadata) if scan.extra_metadata else {}
    except Exception:
        pass

    pdf_bytes = generate_scan_report(
        {
            "id":               scan.id,
            "predicted_label":  scan.predicted_label,
            "confidence_score": scan.confidence_score,
            "risk_level":       extra.get("risk_level", "Low Risk"),
            "diagnosis_name":   extra.get("diagnosis_name", scan.predicted_label),
            "created_at":       str(scan.created_at),
            "raw_output":       scan.raw_output or "{}",
        },
        {
            "full_name":     current_user.full_name,
            "email":         current_user.email,
            "date_of_birth": str(current_user.date_of_birth) if current_user.date_of_birth else "N/A",
            "gender":        current_user.gender or "N/A",
            "phone_number":  current_user.phone_number or "N/A",
        },
    )
    filename = f"DermAssist_Report_{current_user.username}_Scan{scan_id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ══════════════════════════════════════════════════════════════════════════════
#  DOCTORS
# ══════════════════════════════════════════════════════════════════════════════

from pydantic import BaseModel as PydanticBase
from datetime import date as DateType
from typing import List as ListType


class DoctorRegisterRequest(PydanticBase):
    full_name:           str
    username:            str
    email:               str
    password:            str
    phone:               str
    gender:              str = ""
    date_of_birth:       str = ""
    post:                str
    specialty:           str
    qualification:       str
    education_details:   str = ""
    practice_start_year: int
    clinic_name:         str
    address:             str
    city:                str
    available_days:      ListType[str] = []
    available_slots:     ListType[str] = []
    specializes_in:      ListType[str] = []
    languages:           ListType[str] = []
    consultation_fee:    int = 500
    bio:                 str = ""


@app.post("/doctors/register", status_code=201)
def register_doctor(payload: DoctorRegisterRequest, db: Session = Depends(get_db)):
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

    if db.query(Doctor).filter(Doctor.email == payload.email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(Doctor).filter(Doctor.username == payload.username).first():
        raise HTTPException(400, "Username already taken")

    dob = None
    if payload.date_of_birth:
        try:
            dob = DateType.fromisoformat(payload.date_of_birth)
        except Exception:
            pass

    initials = "".join(w[0] for w in payload.full_name.split() if w)[:2].upper()
    doc = Doctor(
        username=payload.username, email=payload.email,
        password_hash=pwd.hash(payload.password),
        full_name=payload.full_name, phone=payload.phone,
        gender=payload.gender or None, date_of_birth=dob,
        post=payload.post, specialty=payload.specialty,
        qualification=payload.qualification,
        education_details=payload.education_details or None,
        practice_start_year=payload.practice_start_year,
        clinic_name=payload.clinic_name, address=payload.address, city=payload.city,
        available_days=payload.available_days, available_slots=payload.available_slots,
        specializes_in=payload.specializes_in, languages=payload.languages,
        consultation_fee=payload.consultation_fee, bio=payload.bio or None,
        image_placeholder=initials, status="pending", is_active=False,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"message": "Registration submitted. Awaiting admin approval.", "doctor_id": doc.id}


class DoctorLoginRequest(PydanticBase):
    username: str
    password: str


@app.post("/doctors/login")
def doctor_login(payload: DoctorLoginRequest, db: Session = Depends(get_db)):
    from passlib.context import CryptContext
    from auth import create_access_token
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

    doc = db.query(Doctor).filter(Doctor.email == payload.username).first()
    if not doc:
        doc = db.query(Doctor).filter(Doctor.username == payload.username).first()
    if not doc:
        raise HTTPException(401, "No doctor account found.")
    if not pwd.verify(payload.password, doc.password_hash):
        raise HTTPException(401, "Incorrect password.")
    if doc.status == "pending":
        raise HTTPException(403, "Account pending admin approval.")
    if doc.status == "rejected":
        raise HTTPException(403, "Registration rejected. Contact support.")
    if not doc.is_active:
        raise HTTPException(403, "Account not active. Contact support.")

    token = create_access_token({"sub": doc.username, "role": "doctor", "doctor_id": doc.id})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "role":         "doctor",
        "doctor":       doc.to_public_dict(),
    }


@app.get("/doctors")
def get_doctors(city: str = None, search: str = None, db: Session = Depends(get_db)):
    q = db.query(Doctor)
    if city:
        q = q.filter(Doctor.city.ilike(f"%{city}%"))
    docs = q.all()
    result = [d.to_public_dict() for d in docs]
    if search:
        s = search.lower()
        result = [d for d in result if
                  s in d["name"].lower() or
                  s in d["specialty"].lower() or
                  s in d["city"].lower() or
                  any(s in x.lower() for x in d["specializes_in"])]
    return {"doctors": result, "total": len(result)}


@app.get("/doctors/cities")
def get_doctor_cities(db: Session = Depends(get_db)):
    rows = db.query(Doctor.city).distinct().all()
    return {"cities": sorted(r.city for r in rows)}


@app.get("/doctors/me")
def get_doctor_profile(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    from jose import jwt as jose_jwt
    from auth import SECRET_KEY, ALGORITHM
    try:
        data      = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        doctor_id = data.get("doctor_id")
    except Exception:
        raise HTTPException(401, "Invalid token")
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(404, "Not found")
    return doc.to_admin_dict()


class DoctorProfileUpdate(PydanticBase):
    full_name:        str  = None
    phone:            str  = None
    bio:              str  = None
    consultation_fee: int  = None
    clinic_name:      str  = None
    address:          str  = None
    city:             str  = None
    available_days:   list = None
    available_slots:  list = None
    specializes_in:   list = None
    languages:        list = None
    qualification:    str  = None


@app.put("/doctors/profile")
def update_doctor_profile(
    payload: DoctorProfileUpdate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    from jose import jwt as jose_jwt
    from auth import SECRET_KEY, ALGORITHM
    try:
        data = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if data.get("role") != "doctor":
            raise HTTPException(403, "Only doctors can update this profile")
        doctor_id = data.get("doctor_id")
    except Exception:
        raise HTTPException(401, "Invalid token")

    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(404, "Doctor not found")

    for k, v in payload.dict(exclude_none=True).items():
        if hasattr(doc, k):
            setattr(doc, k, v)
    db.commit()
    db.refresh(doc)
    return {"message": "Profile updated", "doctor": doc.to_admin_dict()}


# ── Admin doctor management ───────────────────────────────────────────────────
@app.get("/admin/doctors")
def admin_list_doctors(
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user or current_user.role != "admin":
        raise HTTPException(403, "Admin access required")
    q = db.query(Doctor)
    if status:
        q = q.filter(Doctor.status == status)
    return {"doctors": [d.to_admin_dict() for d in q.order_by(Doctor.created_at.desc()).all()]}


@app.put("/admin/doctors/{doc_id}/approve")
def admin_approve_doctor(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user or current_user.role != "admin":
        raise HTTPException(403, "Admin access required")
    doc = db.query(Doctor).filter(Doctor.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Doctor not found")
    doc.status = "approved"
    doc.is_active = True
    db.commit()
    return {"message": f"Dr. {doc.full_name} approved successfully"}


@app.put("/admin/doctors/{doc_id}/reject")
def admin_reject_doctor(
    doc_id: int,
    notes: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user or current_user.role != "admin":
        raise HTTPException(403, "Admin access required")
    doc = db.query(Doctor).filter(Doctor.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Doctor not found")
    doc.status      = "rejected"
    doc.is_active   = False
    doc.admin_notes = notes
    db.commit()
    return {"message": f"Dr. {doc.full_name} rejected"}


@app.delete("/admin/doctors/{doc_id}")
def admin_delete_doctor(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user or current_user.role != "admin":
        raise HTTPException(403, "Admin access required")
    doc = db.query(Doctor).filter(Doctor.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Doctor not found")
    db.delete(doc)
    db.commit()
    return {"message": "Doctor deleted"}


# ── Rate a doctor ─────────────────────────────────────────────────────────────
class RatingRequest(PydanticBase):
    doctor_id: int
    rating:    float


@app.post("/doctors/rate")
def rate_doctor(
    payload: RatingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(401, "Login required to rate a doctor")
    if not (1.0 <= payload.rating <= 5.0):
        raise HTTPException(400, "Rating must be between 1 and 5")
    doc = db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
    if not doc:
        raise HTTPException(404, "Doctor not found")
    total = (doc.rating * doc.review_count) + payload.rating
    doc.review_count += 1
    doc.rating = round(total / doc.review_count, 1)
    db.commit()
    return {"message": "Rating submitted", "new_rating": doc.rating, "review_count": doc.review_count}


# ── Appointments ──────────────────────────────────────────────────────────────
class DoctorApptStatusUpdate(PydanticBase):
    status: str


@app.put("/doctor/appointments/{apt_id}/status")
def doctor_update_appt_status(
    apt_id: int,
    body: DoctorApptStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    from jose import jwt as jose_jwt, JWTError
    from auth import SECRET_KEY, ALGORITHM

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    tok = auth_header.split(" ", 1)[1]
    try:
        payload = jose_jwt.decode(tok, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "doctor":
            raise HTTPException(403, "Only doctors can update appointment status")
    except JWTError:
        raise HTTPException(401, "Invalid token")

    valid = {"accepted", "rejected", "completed", "pending"}
    if body.status not in valid:
        raise HTTPException(400, f"Status must be one of: {valid}")

    apt = db.query(Appointment).filter(Appointment.id == apt_id).first()
    if not apt:
        raise HTTPException(404, "Appointment not found")

    apt.status = body.status
    db.commit()
    return {"id": apt_id, "status": apt.status, "message": f"Appointment {body.status}"}


@app.get("/doctor/appointments/{doctor_name:path}")
def doctor_appointments_by_name(doctor_name: str, db: Session = Depends(get_db)):
    appts = (
        db.query(Appointment)
        .filter(Appointment.doctor_name.ilike(f"%{doctor_name}%"))
        .order_by(Appointment.appointment_date.desc())
        .all()
    )
    return {"appointments": [
        {
            "id":               a.id,
            "user_id":          a.user_id,
            "appointment_date": str(a.appointment_date),
            "appointment_time": a.appointment_time,
            "reason":           a.reason,
            "status":           a.status,
        }
        for a in appts
    ]}


# ── Debug endpoints (remove before production) ───────────────────────────────
@app.get("/debug/doctors")
def debug_doctors(db: Session = Depends(get_db)):
    return [
        {"id": d.id, "email": d.email, "username": d.username,
         "status": d.status, "is_active": d.is_active, "name": d.full_name}
        for d in db.query(Doctor).all()
    ]


@app.post("/debug/approve-doctor/{doc_id}")
def debug_approve(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Not found")
    doc.status    = "approved"
    doc.is_active = True
    db.commit()
    return {"message": f"Dr. {doc.full_name} approved", "status": doc.status}


@app.post("/debug/approve-by-email/{email:path}")
def debug_approve_by_email(email: str, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.email == email).first()
    if not doc:
        raise HTTPException(404, f"No doctor with email: {email}")
    doc.status    = "approved"
    doc.is_active = True
    db.commit()
    return {"message": f"✅ Dr. {doc.full_name} approved"}

# ═══════════════════════════════════════════════════════════════════════════════
# PS FEATURE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

import httpx
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
print(f"🔑 Groq API Key loaded: {'YES' if GROQ_API_KEY else 'NO - MISSING! Add GROQ_API_KEY to .env'}")


# ── PS-02: AI Health Chatbot (Groq - free) ────────────────────────────────────

class ChatRequest(PydanticBase):
    message:  str
    history:  list = []
    category: str  = "skin"

@app.post("/chat")
async def health_chatbot(req: ChatRequest, request: Request):
    if not GROQ_API_KEY:
        raise HTTPException(503, "GROQ_API_KEY not configured in .env")

    system_prompt = """You are the AI health assistant built into DermAssist AI — an AI-powered skin disease detection web app for early skin cancer detection in India.

== ABOUT DERMASSIST AI ==
DermAssist AI analyzes photos of skin lesions using an EfficientNet-B3 deep learning model trained on DermNet + HAM10000 datasets (~94% accuracy).
Users upload or capture a photo, get an instant diagnosis, risk level, and confidence score.

== THE 7 SKIN LESION CLASSES ==
1. Melanoma (mel) — HIGH RISK. Most dangerous skin cancer. Urgent dermatologist visit required.
2. Basal Cell Carcinoma (bcc) — HIGH RISK. Most common skin cancer. Needs prompt treatment.
3. Actinic Keratosis (akiec) — HIGH RISK. Precancerous UV damage lesion. Can become squamous cell carcinoma.
4. Benign Keratosis (bkl) — MODERATE RISK. Non-cancerous growth (seborrheic keratoses, solar lentigines).
5. Dermatofibroma (df) — MODERATE RISK. Benign fibrous nodule. Generally harmless.
6. Vascular Lesion (vasc) — MODERATE RISK. Cherry angiomas, hemangiomas. Generally benign.
7. Melanocytic Nevi (nv) — LOW RISK. Common moles. Monitor for ABCDE changes.

== RISK LEVEL GUIDANCE ==
High Risk → See a dermatologist URGENTLY within 1-2 weeks.
Moderate Risk → Monitor for changes. See a doctor if it evolves.
Low Risk → Generally safe. Annual skin check recommended.

== APP FEATURES ==
- AI Scan: Upload photo or use camera → instant diagnosis
- Find Doctors: Browse dermatologists, filter by location/specialty, book appointments
- Health Records: Save blood group, BMI, allergies, medications, scan history (Medical Passport)
- Outbreak Alerts: Seasonal skin disease alerts for India + real platform scan trends
- Skin Health Chat: This chat you are using right now
- My Appointments: Track upcoming and past dermatologist visits

== THE ABCDE RULE ==
A=Asymmetry, B=Border irregularity, C=Color variation, D=Diameter >6mm, E=Evolving over time

== YOUR ROLE ==
- Help users understand their scan results in plain language
- Guide next steps based on risk level
- Answer skin health, sun protection, and prevention questions
- Help users navigate app features (e.g. how to book a doctor, save health records)
- Be empathetic — a High Risk result can be very scary for users
- Never diagnose or contradict the AI model result
- Always recommend a real dermatologist for treatment decisions
- For emergencies: call 112"""

    messages = [{"role": "system", "content": system_prompt}]
    for h in req.history[-10:]:
        if isinstance(h, dict) and h.get("role") in ("user", "assistant"):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": req.message})

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model":       "llama-3.1-8b-instant",
                    "messages":    messages,
                    "max_tokens":  1024,
                    "temperature": 0.7,
                }
            )

        resp_json = resp.json()
        print(f"🤖 Groq response status: {resp.status_code}")

        if resp.status_code != 200:
            err_msg = resp_json.get("error", {}).get("message", str(resp_json))
            print(f"🤖 Groq error: {err_msg}")
            raise HTTPException(500, f"Groq API error: {err_msg}")

        reply = resp_json["choices"][0]["message"]["content"]
        new_history = req.history + [
            {"role": "user",      "content": req.message},
            {"role": "assistant", "content": reply},
        ]
        return {"reply": reply, "history": new_history}

    except httpx.TimeoutException:
        raise HTTPException(504, "Request to AI timed out. Try again.")
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(500, f"Chatbot error: {str(e)}")


# ── PS-05: Outbreak / Skin Trends ────────────────────────────────────────────

@app.get("/outbreak/alerts")
async def outbreak_alerts():
    """Returns skin-disease alerts. Tries live disease.sh for COVID data."""
    covid_data = None
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get("https://disease.sh/v3/covid-19/countries/India")
            if r.status_code == 200:
                d = r.json()
                covid_data = {
                    "active":    d.get("active", 0),
                    "recovered": d.get("recovered", 0),
                    "deaths":    d.get("deaths", 0),
                    "updated":   datetime.utcnow().isoformat(),
                }
    except Exception:
        pass  # Live data unavailable — frontend handles gracefully

    return {
        "covid": covid_data,
        "skin_alerts": [
            {"disease": "Fungal Skin Infections",  "region": "Coastal & humid areas",      "risk": "High",     "season": "Monsoon (Jun–Oct)", "icon": "🍄"},
            {"disease": "Actinic Keratosis Risk",  "region": "All sun-exposed regions",    "risk": "High",     "season": "Summer (Mar–Jun)",  "icon": "☀️"},
            {"disease": "Melanoma Season Alert",   "region": "Pan India (peak UV months)", "risk": "High",     "season": "April–August",      "icon": "🔴"},
            {"disease": "Winter Dermatitis",       "region": "North India",                "risk": "Moderate", "season": "Winter (Nov–Feb)",   "icon": "⚠️"},
            {"disease": "Vascular Lesion Watch",   "region": "Elderly, pan India",         "risk": "Low",      "season": "Year-round",         "icon": "🫀"},
        ]
    }


@app.get("/outbreak/skin-trends")
def skin_trends(db: Session = Depends(get_db)):
    """Returns real scan frequency data from the platform database."""
    LABELS = {
        "mel":   "Melanoma",
        "bcc":   "Basal Cell Carcinoma",
        "akiec": "Actinic Keratosis",
        "bkl":   "Benign Keratosis",
        "df":    "Dermatofibroma",
        "vasc":  "Vascular Lesion",
        "nv":    "Melanocytic Nevi",
    }
    try:
        rows = (
            db.query(Prediction.predicted_label, db.query(Prediction).filter(
                Prediction.predicted_label == Prediction.predicted_label
            ).count.__class__)
        )
        from sqlalchemy import func
        results = (
            db.query(Prediction.predicted_label, func.count(Prediction.id).label("cnt"))
            .filter(Prediction.predicted_label.isnot(None))
            .filter(Prediction.predicted_label != "__health_record__")
            .group_by(Prediction.predicted_label)
            .order_by(func.count(Prediction.id).desc())
            .all()
        )
        total = sum(r.cnt for r in results) or 1
        trends = [
            {
                "code":       r.predicted_label,
                "name":       LABELS.get(r.predicted_label, r.predicted_label),
                "count":      r.cnt,
                "percentage": round((r.cnt / total) * 100, 1),
            }
            for r in results
        ]
        return {"total_scans": sum(r.cnt for r in results), "trends": trends}
    except Exception as e:
        return {"total_scans": 0, "trends": [], "error": str(e)}


# ── PS-06: Health Records ────────────────────────────────────────────────────

class HealthRecordPayload(PydanticBase):
    blood_group:              Optional[str] = None
    height_cm:                Optional[float] = None
    weight_kg:                Optional[float] = None
    allergies:                Optional[str] = None
    chronic_conditions:       Optional[str] = None
    current_medications:      Optional[str] = None
    past_surgeries:           Optional[str] = None
    emergency_contact_name:   Optional[str] = None
    emergency_contact_phone:  Optional[str] = None
    notes:                    Optional[str] = None

@app.post("/user/health-record")
def save_health_record(
    payload: HealthRecordPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Prediction)
        .filter(
            Prediction.user_id == current_user.id,
            Prediction.predicted_label == "__health_record__",
        )
        .first()
    )
    data = payload.dict(exclude_none=True)
    if payload.height_cm and payload.weight_kg:
        data["bmi"] = round(payload.weight_kg / ((payload.height_cm / 100) ** 2), 1)

    if existing:
        existing.all_scores = json.dumps(data)
        db.commit()
    else:
        rec = Prediction(
            user_id         = current_user.id,
            predicted_label = "__health_record__",
            diagnosis_name  = "Health Record",
            confidence_score= 0.0,
            risk_level      = "N/A",
            all_scores      = json.dumps(data),
        )
        db.add(rec)
        db.commit()
    return {"message": "Health record saved", "data": data}


@app.get("/user/health-record")
def get_health_record(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = (
        db.query(Prediction)
        .filter(
            Prediction.user_id == current_user.id,
            Prediction.predicted_label == "__health_record__",
        )
        .first()
    )
    if not rec:
        return {"health_record": None}
    try:
        data = json.loads(rec.all_scores or "{}")
    except Exception:
        data = {}
    return {"health_record": data}


# ── PS-07: My Appointments (patient view) ────────────────────────────────────

@app.get("/appointments/my")
def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all appointments for the logged-in patient."""
    appts = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.appointment_date.desc())
        .all()
    )
    return [
        {
            "id":               a.id,
            "doctor_name":      a.doctor_name,
            "specialty":        a.doctor_specialty,
            "location":         a.doctor_clinic,
            "address":          a.doctor_address,
            "phone":            a.doctor_phone,
            "appointment_date": str(a.appointment_date),
            "appointment_time": a.appointment_time,
            "reason":           a.reason,
            "notes":            a.notes,
            "status":           a.status,
            "created_at":       str(a.created_at),
        }
        for a in appts
    ]