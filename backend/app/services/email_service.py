import asyncio
import logging
import smtplib
from email.message import EmailMessage

from core.config import get_settings


logger = logging.getLogger(__name__)


class EmailService:
    async def send_password_reset(self, recipient: str, reset_url: str):
        settings = get_settings()
        if not settings.smtp_host:
            logger.warning("Development password reset link for %s: %s", recipient, reset_url)
            return
        await asyncio.to_thread(self._send_smtp, recipient, reset_url)

    @staticmethod
    def _send_smtp(recipient: str, reset_url: str):
        settings = get_settings()
        message = EmailMessage()
        message["Subject"] = "Reset your Sepsis Command password"
        message["From"] = settings.smtp_from_email
        message["To"] = recipient
        message.set_content(
            "A password reset was requested for your account.\n\n"
            f"Reset your password: {reset_url}\n\n"
            f"This link expires in {settings.password_reset_expire_minutes} minutes. "
            "If you did not request this, contact your administrator."
        )
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
