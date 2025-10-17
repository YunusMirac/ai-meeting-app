from .database import Base
from sqlalchemy import TIMESTAMP, Column, Integer, String, Boolean, DateTime, ForeignKey, func
from datetime import datetime
from pydantic_settings import BaseSettings

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    
    # Email-Verification Felder
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# Einfache Friends-Tabelle - nur 2 Spalten!
class Friend(Base):
    __tablename__ = 'friends'
    
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    friend_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    message = Column(String(1000), nullable=False)
    timestamp = Column(TIMESTAMP(timezone=True), nullable=False, default=func.now())

class Meeting(Base):
    __tablename__ = 'meetings'
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_code = Column(String(10), unique=True, nullable=False, index=True)
    meeting_name = Column(String(100), nullable=False)
    host_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    password = Column(String(255), nullable=False)

class MeetingParticipant(Base):
    __tablename__ = 'meeting_participants'

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey('meetings.id'), nullable=False)  # Integer statt String!
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    joined_at = Column(DateTime, default=func.now(), nullable=False)
    left_at = Column(DateTime, nullable=True)  # NULL = noch im Meeting