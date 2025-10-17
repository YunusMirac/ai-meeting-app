from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Korrekte, saubere Imports
from .. import database, schemas, models
from ..functions.function import get_current_user


router = APIRouter(
    prefix="/user",
    tags=["User"]
)

# --- Endpunkt zum Suchen eines Users (öffentlich) ---
@router.get("/", response_model=schemas.ReturnUserSchema)
def get_user_by_email(email: str, db: Session = Depends(database.get_db)):
    """Sucht einen Benutzer anhand seiner E-Mail-Adresse."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# --- Endpunkt zum Hinzufügen eines Kontakts (jetzt sicher) ---
@router.post("/add_contact", response_model=schemas.FriendSchema, status_code=status.HTTP_201_CREATED)
def add_contact(
    friend_data: schemas.AddFriendSchema, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Fügt einen Kontakt zur Liste des eingeloggten Benutzers hinzu."""
    user_id = current_user.id
    friend_id = friend_data.friend_id

    if user_id == friend_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Du kannst dich nicht selbst als Kontakt hinzufügen")
    
    friend_to_add = db.query(models.User).filter(models.User.id == friend_id).first()
    if not friend_to_add:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Der anzufreundende Benutzer wurde nicht gefunden")
    
    existing_friendship = db.query(models.Friend).filter(
        models.Friend.user_id == user_id,
        models.Friend.friend_id == friend_id
    ).first()
    
    if existing_friendship:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dieser Kontakt wurde bereits hinzugefügt")
    
    new_friendship = models.Friend(user_id=user_id, friend_id=friend_id)
    db.add(new_friendship)
    db.commit()
    db.refresh(new_friendship)
    return new_friendship

# --- Endpunkt zum Abrufen aller Kontakte (jetzt sicher und korrekt) ---
@router.get("/get_contacts", response_model=list[schemas.ContactWithUnreadSchema])
def get_contacts(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Gibt die vollständigen Profile aller Kontakte des eingeloggten Benutzers zurück."""
    friendships = db.query(models.Friend).filter(models.Friend.user_id == current_user.id).all()
    
    if not friendships:
        return [] 
    
    # Die Liste, die wir am Ende zurückgeben
    contacts_with_unread = []
        
    # 2. Gehe durch jede Freundschaft und berechne die ungelesenen Nachrichten
    for friendship in friendships:
        friend_user = db.query(models.User).filter(models.User.id == friendship.friend_id).first()
        if not friend_user:
            continue

        # 3. Zähle die Nachrichten vom Freund, die neuer sind als der "Zuletzt Gelesen"-Zeitstempel
        unread_count = db.query(models.ChatMessage).filter(
            models.ChatMessage.sender_id == friend_user.id,
            models.ChatMessage.receiver_id == current_user.id,
            models.ChatMessage.timestamp > friendship.timestamp
        ).count()

        # 4. Kombiniere die Benutzerdaten mit der Anzahl
        contact_data = {
            "id": friend_user.id,
            "email": friend_user.email,
            "first_name": friend_user.first_name,
            "last_name": friend_user.last_name,
            "unread_count": unread_count
        }
        contacts_with_unread.append(contact_data)
        
    return contacts_with_unread