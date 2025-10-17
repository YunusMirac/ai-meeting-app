# In backend/app/functions.py

from datetime import datetime, timedelta, timezone
import random
import secrets
import string
from jose import jwt, JWTError
from fastapi import Depends, Query, WebSocketException, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
import google.generativeai as genai
from google.cloud import speech, storage

# Importe wurden hier zusammengefasst und aufgeräumt
from .. import models, database

def create_verification_token() -> str:
    """Generiert einen zufälligen Verification-Token"""
    return secrets.token_urlsafe(32)

def create_token_expiry_time(minutes: int=60) -> datetime:
    """Generiert ein Ablaufdatum für den Token"""
    # Veraltetes utcnow() durch modernes, zeitzonen-bewusstes now(timezone.utc) ersetzt
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)

# --- Konfiguration ---
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("Kein SECRET_KEY in der .env-Datei gefunden!")

ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='auth/login')

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    """
    Überprüft das Token, liest die user_id aus und gibt das User-Objekt aus der DB zurück.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_current_user_ws(
    token: str | None = Query(None), 
    db: Session = Depends(database.get_db)
) -> models.User:
    if token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Token fehlt.")

    # HIER IST DIE KORREKTUR:
    credentials_exception = WebSocketException(
        code=status.WS_1008_POLICY_VIOLATION,
        reason="Could not validate credentials",
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user



def generate_unique_meeting_code(db: Session):
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

        if not db.query(models.Meeting).filter(models.Meeting.meeting_code == code).first():
            return code
        

# Speech-to-Text Client initialisieren
speech_client = speech.SpeechClient()

def transcribe_audio_google(audio_file_path: str, bucket_name: str) -> str:
    """
    Lädt eine Audiodatei in Google Cloud Storage hoch und transkribiert sie
    mit der asynchronen Speech-to-Text API.
    """
    if not speech_client:
        return "Fehler: Speech-to-Text-Dienst ist nicht konfiguriert."

    try:
        # --- TEIL 1: DATEI IN DEN BUCKET HOCHLADEN ---
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        
        # Erstelle einen einzigartigen Namen für die Datei im Bucket
        blob_name = os.path.basename(audio_file_path)
        blob = bucket.blob(blob_name)

        print(f"Lade {audio_file_path} in Bucket {bucket_name} hoch...")
        blob.upload_from_filename(audio_file_path)
        print("Upload erfolgreich.")

        # Der Pfad zur Datei im Google Cloud Storage (wie eine Tracking-Nummer)
        gcs_uri = f"gs://{bucket_name}/{blob_name}"

        # --- TEIL 2: DIE KI MIT DEM LINK BEAUFTRAGEN ---
        audio = speech.RecognitionAudio(uri=gcs_uri)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code="de-DE",
            enable_automatic_punctuation=True, # Ein nettes Extra
        )

        print("Starte asynchrone Transkription bei Google...")
        # Starte den Auftrag (long_running_recognize für große Dateien)
        operation = speech_client.long_running_recognize(config=config, audio=audio)
        
        # Warte, bis der Auftrag abgeschlossen ist (das kann Minuten dauern)
        response = operation.result(timeout=300) # Warte maximal 5 Minuten
        print("Transkription von Google empfangen.")

        # --- TEIL 3: AUFRÄUMEN ---
        print("Lösche Datei aus dem Bucket...")
        blob.delete()

        # Setze das Ergebnis zusammen
        transcript = " ".join(
            [result.alternatives[0].transcript for result in response.results]
        )
        return transcript.strip()

    except Exception as e:
        print(f"Ein schwerwiegender Fehler ist bei der Google-Transkription aufgetreten: {e}")
        # Optional: Versuche, die Datei im Bucket trotzdem zu löschen, falls sie noch existiert
        try:
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(os.path.basename(audio_file_path))
            if blob.exists():
                blob.delete()
        except Exception as cleanup_error:
            print(f"Fehler beim Aufräumen des Buckets: {cleanup_error}")
            
        return f"Fehler bei der Transkription: {e}"


def summarize_with_gemini(transcript: str) -> str:
    """
    Sendet ein Transkript an die Google Gemini API zur Zusammenfassung.
    """
    # Authentifiziere dich bei der Gemini API mit deinem Schlüssel.
    # Wichtig: Speichere diesen Schlüssel sicher, am besten als Umgebungsvariable.
    try:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("Kein GEMINI_API_KEY in der .env-Datei gefunden!")
        genai.configure(api_key=gemini_api_key)

        # Erstelle das KI-Modell, das du benutzen willst
        model = genai.GenerativeModel('gemini-2.5-flash-preview-09-2025')  # 'gemini-pro' ist auch eine Option

        # Das ist deine Anweisung an die KI. Je genauer, desto besser das Ergebnis.
        prompt = f"""
        Du bist ein professioneller KI-Assistent, der für die Zusammenfassung von Business-Meetings zuständig ist.
        
        Deine Aufgabe ist es, das folgende Meeting-Transkript zu analysieren und eine präzise, gut strukturierte Zusammenfassung zu erstellen.
        
        Die Zusammenfassung muss folgende Abschnitte enthalten, wenn es relevant ist und sowas besprochen wurde:
        
        1.  **Hauptthemen:** Eine kurze Übersicht der besprochenen Themen.
        2.  **Wichtige Entscheidungen:** Eine klare Liste aller getroffenen Entscheidungen.
        3.  **To-Do-Punkte:** Eine Liste der vereinbarten Aufgaben (Action Items), idealerweise mit den verantwortlichen Personen, falls diese im Text genannt werden.
        
        Hier ist das Transkript:
        ---
        {transcript}
        ---
        """

        print("Sende Transkript an Gemini zur Zusammenfassung...")
        # Sende den Prompt an die KI und erhalte die Antwort
        response = model.generate_content(prompt)
        print("Zusammenfassung erfolgreich empfangen.")
        
        return response.text

    except Exception as e:
        print(f"Fehler bei der Gemini-Zusammenfassung: {e}")
        return f"Fehler bei der Zusammenfassung: {e}"

