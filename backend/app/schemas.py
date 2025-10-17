
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic_settings import BaseSettings


# Dieses Schema ist für eingehende Daten (vom Frontend)
class CreateUserSchema(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class LoginUserSchema(BaseModel):
    email: EmailStr
    password: str

# Dieses Schema ist für ausgehende Daten (zum Frontend)
# Es enthält aus Sicherheitsgründen kein Passwort
class ReturnUserSchema(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)
    
class ContactWithUnreadSchema(ReturnUserSchema):
    unread_count: int
        

class ReturnUserWithTokenSchema(ReturnUserSchema):
    access_token: str
    token_type: str

    model_config = ConfigDict(from_attributes=True)
        
        
class SearchUserSchema(BaseModel):
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


# Einfache Freunde Schemas - nur das Nötigste!
class AddFriendSchema(BaseModel):
    user_id: int
    friend_id: int

class FriendSchema(BaseModel):
    user_id: int
    friend_id: int
    
    model_config = ConfigDict(from_attributes=True)
    
class ChatMessageSchematwo(BaseModel):
    receiver_id: int
    message: str
    
class ChatMessageSchema(BaseModel):
    sender_id: int
    receiver_id: int
    message: str
    
class GetChatMessage(ChatMessageSchema):
    id: int  
    timestamp: datetime  # ISO 8601 Format
    
    model_config = ConfigDict(from_attributes=True)

class GetAllofChatMessages(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message: str
    timestamp: datetime  # ISO 8601 Format

    model_config = ConfigDict(from_attributes=True)


class CreateMeetingSchema(BaseModel):
    meeting_name: str
    password: str
    
class ReturnMeetingSchema(BaseModel):
    id: int
    meeting_code: str
    host_id: int
    password: str
    meeting_name: str
    
    model_config = ConfigDict(from_attributes=True)
    
class JoinMeetingSchema(BaseModel):
    meeting_code: str
    password: str