from dotenv import load_dotenv
from pathlib import Path

# --- FIX 1: Umgebungsvariablen laden, BEVOR ein anderes Modul importiert wird ---
# Die .env-Datei befindet sich in 'verifications/.env' relativ zum 'app/' Ordner.
dotenv_path = Path(__file__).parent / ".." / ".env"
load_dotenv(dotenv_path=dotenv_path)
# --------------------------------------------------------------------------------

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import authentication, user, chat, meeting
 
app = FastAPI(title="AI-Meeting Backend")

# CORS-Middleware hinzufügen für Frontend-Kommunikation
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Router einbinden
app.include_router(authentication.router)
app.include_router(user.router)
app.include_router(chat.router) 
app.include_router(meeting.router) 
