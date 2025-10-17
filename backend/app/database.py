from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Die Verbindungs-URL
# Diese Zeile sagt SQLAlchemy, wo sich Ihre Datenbank befindet und wie man sich verbindet.
DATABASE_URL = "postgresql://yunus@localhost/ai_meeting_db"

# 2. Die "Engine"
# Die Engine ist das Herzstück der Verbindung. Sie verwaltet die Verbindungen zur Datenbank.
engine = create_engine(DATABASE_URL)

# 3. Die "Session"
# Eine Session ist quasi ein einzelnes "Gespräch" mit der Datenbank.
# Hiermit erstellen wir eine Vorlage für diese Gespräche.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Die "Base"-Klasse
# Alle Ihre Datenbank-Modelle in `models.py` werden von dieser Klasse erben.
# Sie hilft SQLAlchemy, die Python-Klassen auf Datenbank-Tabellen abzubilden.
Base = declarative_base()

# 5. Die Dependency-Funktion
# Diese Funktion wird von jedem API-Endpunkt aufgerufen, der mit der Datenbank sprechen muss.
# Sie stellt eine frische Session zur Verfügung und schließt sie danach automatisch wieder.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()