from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from passlib.context import CryptContext 
from ..functions.function import create_token_expiry_time, create_verification_token, create_access_token
from .. import models, schemas
from ..database import get_db
from ..verifications.email import send_verification_email

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register", response_model=schemas.ReturnUserSchema, status_code=status.HTTP_201_CREATED)
async def register(user: schemas.CreateUserSchema, db: Session = Depends(get_db)):
    try:
        # Überprüfen, ob die E-Mail bereits existiert
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="E-Mail bereits registriert")

        # Passwort hashen (bcrypt hat ein 72-Byte-Limit)
        password_to_hash = user.password
        if len(password_to_hash.encode('utf-8')) > 72:
            password_to_hash = password_to_hash[:72]
        hashed_password = pwd_context.hash(password_to_hash)

        # Verification Token und Ablaufzeit generieren
        verification_token = create_verification_token()
        token_expiry = create_token_expiry_time()

        # Neuen Benutzer erstellen
        new_user = models.User(
            email=user.email,
            password_hash=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name,
            is_verified=False,
            verification_token=verification_token,
            verification_token_expires=token_expiry,
            created_at=datetime.utcnow()
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Verification-Email senden
        try:
            await send_verification_email(
                email_to=user.email,
                token=verification_token
            )
            print(f"Verification-Email erfolgreich an {user.email} gesendet")
        except Exception as e:
            print(f"Warnung: Email konnte nicht an {user.email} gesendet werden: {e}")
            # Fortsetzung der Registrierung auch bei Email-Fehler
        
        return new_user
        
    except Exception as e:
        import traceback
        print(f"Registrierungsfehler: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail="Ein Fehler ist bei der Registrierung aufgetreten"
        )


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Ungültiger Verifikationstoken")
    
    if user.verification_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verifikationstoken ist abgelaufen")

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()

    success_url = "http://localhost:5173/email-verified"
    return RedirectResponse(url=success_url)

@router.post("/login")
def login(user: schemas.LoginUserSchema, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Ungültige Anmeldedaten")
    
    if not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Ungültige Anmeldedaten")
    
    if not db_user.is_verified:
        raise HTTPException(status_code=400, detail="Email-Adresse ist nicht verifiziert")
    access_token_data = {"user_id": db_user.id}
    access_token = create_access_token(data=access_token_data)
    return {"id": db_user.id, "email": db_user.email, "first_name": db_user.first_name, "last_name": db_user.last_name, "access_token": access_token, "token_type": "bearer"}
