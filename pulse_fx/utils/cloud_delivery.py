"""Send Gmail notifications about pulse_fx runs (optional, env-driven)."""

from __future__ import annotations

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

logger = logging.getLogger(__name__)

_LOG_TAIL_BYTES = 12_000


def send_gmail_notification(
    *,
    subject: str,
    body: str,
    smtp_user: str,
    app_password: str,
    to_addresses: list[str],
) -> bool:
    """Send plain-text email via Gmail SMTP (use an App Password, not your normal password)."""
    if not to_addresses:
        return False
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = ", ".join(to_addresses)
    msg.attach(MIMEText(body, "plain", "utf-8"))
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=60) as smtp:
            smtp.starttls()
            smtp.login(smtp_user, app_password)
            smtp.sendmail(smtp_user, to_addresses, msg.as_string())
        logger.info("Sent notification email to %s", to_addresses)
        return True
    except Exception:
        logger.exception("Gmail notification failed")
        return False


def _read_log_tail(path: str, max_bytes: int = _LOG_TAIL_BYTES) -> str:
    p = Path(path)
    if not p.is_file():
        return "(log file missing)"
    data = p.read_bytes()
    if len(data) <= max_bytes:
        return data.decode("utf-8", errors="replace")
    return data[-max_bytes:].decode("utf-8", errors="replace")


def deliver_run_notifications(*, log_path: str | None, success: bool) -> None:
    """
    If Gmail env vars are set, email a run summary.
    Never raises; logs problems only.
    """
    if not log_path:
        logger.debug("No log file path; skipping cloud delivery")
        return

    smtp_user = os.getenv("GMAIL_SMTP_USER", "").strip()
    app_pw = os.getenv("GMAIL_APP_PASSWORD", "").strip()
    raw_to = os.getenv("GMAIL_NOTIFY_TO", "").strip()

    if smtp_user and app_pw and raw_to:
        to_list = [a.strip() for a in raw_to.split(",") if a.strip()]
        status = "succeeded" if success else "finished with errors"
        subject = f"pulse_fx run {status}"
        lines = [
            f"Run {status}.",
            "",
            "Log file path (on runner):",
            log_path,
            "",
        ]
        lines.append("--- log tail ---")
        lines.append(_read_log_tail(log_path))
        body = "\n".join(lines)
        send_gmail_notification(
            subject=subject,
            body=body,
            smtp_user=smtp_user,
            app_password=app_pw,
            to_addresses=to_list,
        )
    else:
        logger.debug("Gmail env not fully set; skipping email notification")
