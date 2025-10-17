

import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from .. import models, database
from ..functions.function import get_current_user, get_current_user_ws
from .. import schemas

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/get_chat", response_model=list[schemas.GetChatMessage])
def get_chat_messages(
    friend_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Ruft alle Chat-Nachrichten zwischen dem eingeloggten Benutzer und einem Freund ab."""
    messages = db.query(models.ChatMessage).filter(
        ((models.ChatMessage.sender_id == current_user.id) & (models.ChatMessage.receiver_id == friend_id)) |
        ((models.ChatMessage.sender_id == friend_id) & (models.ChatMessage.receiver_id == current_user.id)),
        models.ChatMessage.timestamp.isnot(None)
    ).order_by(models.ChatMessage.timestamp).all()
    return messages


@router.post("/{contact}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_messages_as_read(
    contact: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Markiert alle Nachrichten von einem Kontakt als gelesen, indem der Timestamp in der Friends-Tabelle aktualisiert wird."""
    friendship = db.query(models.Friend).filter(
        models.Friend.user_id == current_user.id,
        models.Friend.friend_id == contact
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friendship not found")

    friendship.timestamp = func.now()
    db.commit()
    return {"detail": "Messages marked as read."}

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        websockets = self.active_connections.get(user_id)
        if websockets:
            for websocket in websockets:
                await websocket.send_text(message)
            
manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    db: Session = Depends(database.get_db),
    # 1. Authentifizierung: Sicher und sauber über Depends
    #    Liest den Token aus dem Query-Parameter "?token=..."
    current_user: models.User = Depends(get_current_user_ws)
):
    user_id = current_user.id
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # 2. Nachrichtenformat: Robust dank JSON
            payload = json.loads(data)
            
            # Speichere die Nachricht in der Datenbank
            new_message = models.ChatMessage(
                sender_id=user_id,
                receiver_id=payload['receiver_id'],
                message=payload['message'],
                timestamp=func.now()
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)

            response_message = schemas.GetChatMessage.model_validate(new_message)
            response_json = response_message.model_dump_json()

            # Sende an Empfänger und Sender
            await manager.send_personal_message(response_json, payload['receiver_id'])
            await manager.send_personal_message(response_json, user_id)
            
            

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)