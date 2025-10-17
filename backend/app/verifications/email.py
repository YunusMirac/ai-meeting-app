
from datetime import datetime, timedelta
import os
import secrets
from fastapi_mail import ConnectionConfig
from .config import settings
from fastapi_mail import FastMail, MessageSchema


conf = ConnectionConfig(
    MAIL_USERNAME = settings.MAIL_USERNAME,
    MAIL_PASSWORD = settings.MAIL_PASSWORD,
    MAIL_FROM = settings.MAIL_FROM,
    MAIL_PORT = settings.MAIL_PORT,
    MAIL_SERVER = settings.MAIL_SERVER,
    MAIL_STARTTLS = settings.MAIL_STARTTLS,
    MAIL_SSL_TLS = settings.MAIL_SSL_TLS,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_verification_email(email_to: str, token: str):
    """Sendet eine Verifizierungs-E-Mail an den Benutzer"""

    # BACKEND-URL für direkte Verification!
    verification_link = f"http://localhost:8000/auth/verify-email?token={token}"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Email-Bestätigung</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }}
            .footer {{ background: #e9e9e9; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email bestätigen</h1>
            </div>
            <div class="content">
                <h2>Hallo!</h2>
                <p>Vielen Dank für Ihre Registrierung bei AI-Meeting. Klicken Sie auf den Button unten, um Ihre Email-Adresse zu bestätigen:</p>
                
                <div style="text-align: center;">
                    <a href="{verification_link}" class="button">Email-Adresse bestätigen</a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Durch das Klicken auf den Button bestätigen Sie Ihre Email-Adresse und aktivieren Ihr Konto.
                </p>
                
                <p><strong>Wichtig:</strong> Dieser Link ist 24 Stunden gültig.</p>
            </div>
            <div class="footer">
                <p>© 2025 AI-Meeting. Alle Rechte vorbehalten.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    message = MessageSchema(
        subject="Bestätigen Sie Ihre Email-Adresse - AI-Meeting",
        recipients=[email_to],
        body=html_body,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)