from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_STARTTLS: bool
    MAIL_SSL_TLS: bool

    # --- FIX 2: Korrekte Pydantic V2 Syntax verwenden ---
    # Da wir load_dotenv() in main.py verwenden, ist 'env_file' hier optional, 
    # wird aber für die Vollständigkeit beibehalten.
    model_config = SettingsConfigDict(
        env_file="verifications/.env", # Pfad zur .env-Datei
        env_file_encoding='utf-8',
        extra='ignore' 
    )

settings = Settings()