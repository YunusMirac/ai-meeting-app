import json
import hashlib
import os
from fastapi import Depends, WebSocket, WebSocketDisconnect
from rich import _console
from sqlalchemy import JSON, func

from .. import database, schemas, models
from sqlalchemy.orm import Session
from ..functions.function import get_current_user, generate_unique_meeting_code, get_current_user_ws, transcribe_audio_google, summarize_with_gemini
from fastapi import APIRouter, status, HTTPException
router = APIRouter(
    prefix="/meeting",
    tags=["Meeting"]
)

def hash_password(password: str) -> str:
    # Gleiche Hash-Funktion wie beim Erstellen
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/create", response_model=schemas.ReturnMeetingSchema, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    meeting_data: schemas.CreateMeetingSchema,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") 
    
    new_meeting = models.Meeting(
        host_id=current_user.id,
        meeting_name=meeting_data.meeting_name,
        password=hash_password(meeting_data.password),  # Passwort hashen
        meeting_code=generate_unique_meeting_code(db)
    )

    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting

@router.post("/join", response_model=schemas.ReturnMeetingSchema, status_code=status.HTTP_200_OK)
async def join_meeting(
    meeting_data:schemas.JoinMeetingSchema,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
    ):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    
    meeting = db.query(models.Meeting).filter(models.Meeting.meeting_code == meeting_data.meeting_code).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    
    # GEÄNDERT: Eingabe-Passwort hashen und mit gehashtem DB-Passwort vergleichen
    hashed_input_password = hash_password(meeting_data.password)
    if meeting.password != hashed_input_password:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Wrong password")
    
    # Prüfe ob User bereits aktiv im Meeting ist
    active_participant = db.query(models.MeetingParticipant).filter(
        models.MeetingParticipant.meeting_id == meeting.id,
        models.MeetingParticipant.user_id == current_user.id,
        models.MeetingParticipant.left_at.is_(None)  # Noch nicht verlassen
    ).first()
    
    if active_participant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already in this meeting")
    
    # Erstelle neuen Join-Eintrag (auch wenn User schon mal da war)
    join_participant = models.MeetingParticipant(
        user_id=current_user.id,
        meeting_id=meeting.id  # Jetzt Integer!
    )

    db.add(join_participant)
    db.commit()
    db.refresh(join_participant)
    return meeting

@router.post("/leave", status_code=status.HTTP_200_OK)
async def leave_meeting(
    meeting_code: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
    ):
    
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    
    meeting = db.query(models.Meeting).filter(models.Meeting.meeting_code == meeting_code).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    participant = db.query(models.MeetingParticipant).filter(
        models.MeetingParticipant.user_id == current_user.id,
        models.MeetingParticipant.meeting_id == meeting.id,
        models.MeetingParticipant.left_at.is_(None)  # Nur aktive Teilnahme
    ).first()
    
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You are not in this meeting")
    
    # UPDATE: Setze left_at Timestamp (aber lösche den Eintrag NICHT!)
    participant.left_at = func.now()
    db.commit()
    return {"left_meeting": participant.left_at}


class MeetingConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, dict[int, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, meeting_code: str, user_id: int):
        if meeting_code not in self.active_connections:
            self.active_connections[meeting_code] = {}
        self.active_connections[meeting_code][user_id] = websocket

    def disconnect(self, meeting_code: str, user_id: int):
        if meeting_code in self.active_connections and user_id in self.active_connections[meeting_code]:
            del self.active_connections[meeting_code][user_id]
            if not self.active_connections[meeting_code]:
                del self.active_connections[meeting_code]

    async def broadcast(self, message: str, meeting_code: str, sender_id: int):
        if meeting_code in self.active_connections:
            for user_id, connection in self.active_connections[meeting_code].items():
                if user_id != sender_id:
                    await connection.send_text(message)
                    
    async def send_to_user(self, message: str, meeting_code: str, user_id: int):
        if meeting_code in self.active_connections and user_id in self.active_connections[meeting_code]:
            await self.active_connections[meeting_code][user_id].send_text(message)
                
meeting_manager = MeetingConnectionManager()

@router.websocket("/ws/{meeting_code}")
async def meeting_websocket(websocket: WebSocket, meeting_code: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_ws)):
    await websocket.accept()  # GEÄNDERT: await hinzugefügt!
    user_id = current_user.id
    existing_user_ids = []
    if meeting_code in meeting_manager.active_connections:
        existing_user_ids = list(meeting_manager.active_connections[meeting_code].keys())
        
    await websocket.send_text(json.dumps({
        "type": "existing_users",
        "user_ids": existing_user_ids
    }))
      
    await meeting_manager.connect(websocket, meeting_code, user_id)

    # Informiere alle anderen, dass ein neuer User da ist
    await meeting_manager.broadcast(
        json.dumps({"type": "user_joined", "user_id": user_id}),
        meeting_code,
        sender_id=user_id # Eigene Nachricht nicht empfangen
    )

    # --- Hauptschleife für Nachrichten ---
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data) 
            
            # Füge die ID des Absenders hinzu, damit der Empfänger weiß, von wem die Nachricht kommt
            message_data['sender_id'] = user_id
           
            recipient_id = message_data.get('recipient_id')

            if recipient_id:
                # Wenn es einen bestimmten Empfänger gibt -> gezielt senden
                await meeting_manager.send_to_user(
                    json.dumps(message_data),
                    meeting_code,
                    recipient_id
                )
            else:
                # Wenn es keinen Empfänger gibt -> an alle senden
                await meeting_manager.broadcast(
                    json.dumps(message_data),
                    meeting_code,
                    user_id
                )
            
    except WebSocketDisconnect:
        # --- Verbindungsabbruch ---
        meeting_manager.disconnect(meeting_code, user_id)
        # Informiere alle verbleibenden, dass der User gegangen ist
        await meeting_manager.broadcast(
            json.dumps({"type": "user_left", "user_id": user_id}),
            meeting_code,
            sender_id=user_id
        )
        
import os # Wichtig für das Löschen der Datei


summaries = {}  # Einfaches In-Memory-Postfach für Zusammenfassungen

@router.websocket("/ws/audio/{meeting_code}")
async def audio_websocket(
    websocket: WebSocket,
    meeting_code: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user_ws)
):
    await websocket.accept()
    print(f"🎤 Audio WebSocket VERBUNDEN für Meeting {meeting_code}, User {current_user.id}")
    
    temp_audio_path = f"temp_audio_{meeting_code}_{current_user.id}.webm"
    
    try:
        with open(temp_audio_path, "ab") as audio_file:
            while True:
                audio_data = await websocket.receive_bytes()
                audio_file.write(audio_data)
                print(f"📝 Audio-Chunk empfangen: {len(audio_data)} bytes")

    except WebSocketDisconnect:
        print(f"🔌 Audio WebSocket GETRENNT! Meeting: {meeting_code}")
        print(f"🚀 Starte KI-Pipeline für {temp_audio_path}...")
        
        # Prüfe ob Datei existiert und Größe
        if os.path.exists(temp_audio_path):
            file_size = os.path.getsize(temp_audio_path)
            print(f"📁 Audio-Datei Größe: {file_size} bytes")
            
            if file_size > 0:
                transkript = transcribe_audio_google(temp_audio_path, "ai-meeting-audio-bucket")
                print(f"📝 Fertiges Transkript: {transkript}")
                
                if transkript and transkript != "Keine Sprache erkannt":
                    zusammenfassung = summarize_with_gemini(transkript)
                    print(f"📄 Fertige Zusammenfassung: {zusammenfassung}")
                    
                    summaries[meeting_code] = zusammenfassung
                    print(f"💾 Zusammenfassung gespeichert! summaries = {summaries}")
                else:
                    print("❌ Kein gültiges Transkript erhalten")
            else:
                print("❌ Audio-Datei ist leer!")
        else:
            print("❌ Audio-Datei existiert nicht!")
        
        # Aufräumen
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
            print(f"🗑️ Audio-Datei gelöscht: {temp_audio_path}")

    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
            print(f"🗑️ (Finally) Audio-Datei gelöscht: {temp_audio_path}")

@router.get("/{meeting_code}/summary")
def get_summary(meeting_code: str):
    print(f"🔍 Summary angefragt für Meeting: {meeting_code}")
    print(f"📋 Aktuelle summaries: {summaries}")
    
    summary = summaries.get(meeting_code)
    if summary:
        print(f"✅ Zusammenfassung gefunden!")
        return {"status": "ready", "summary": summary}
    else:
        print(f"⏳ Zusammenfassung noch nicht bereit")
        return {"status": "processing"}