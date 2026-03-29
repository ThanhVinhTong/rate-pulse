"""Upload run logs to Google Drive and send Gmail notifications (optional, env-driven)."""

from __future__ import annotations

import json
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_DRIVE_SCOPE = ("https://www.googleapis.com/auth/drive.file",)
_LOG_TAIL_BYTES = 12_000


def _load_drive_credentials():
    """Return google.oauth2.service_account.Credentials or None."""
    try:
        from google.oauth2 import service_account
    except ImportError:
        logger.warning("google-auth not installed; skipping Google Drive upload")
        return None

    raw_json = os.getenv("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON", "").strip()
    if raw_json:
        try:
            info = json.loads(raw_json)
        except json.JSONDecodeError as e:
            logger.error("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is not valid JSON: %s", e)
            return None
        return service_account.Credentials.from_service_account_info(info, scopes=_DRIVE_SCOPE)

    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if path and Path(path).is_file():
        return service_account.Credentials.from_service_account_file(path, scopes=_DRIVE_SCOPE)

    return None


def upload_log_to_google_drive(log_path: str, folder_id: str) -> dict[str, Any] | None:
    """
    Upload a file into a shared Drive folder (folder must be shared with the service account).
    Returns API response dict with id/webViewLink on success.
    """
    path = Path(log_path)
    if not path.is_file():
        logger.warning("Log file not found for Drive upload: %s", log_path)
        return None

    creds = _load_drive_credentials()
    if creds is None:
        return None

    try:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
    except ImportError:
        logger.warning("google-api-python-client not installed; skipping Google Drive upload")
        return None

    try:
        service = build("drive", "v3", credentials=creds)
        name = path.name
        meta = {"name": name, "parents": [folder_id]}
        media = MediaFileUpload(str(path), mimetype="text/plain", resumable=False)
        created = (
            service.files()
            .create(body=meta, media_body=media, fields="id, name, webViewLink, mimeType")
            .execute()
        )
        logger.info("Uploaded log to Google Drive: file_id=%s", created.get("id"))
        return created
    except Exception:
        logger.exception("Google Drive upload failed")
        return None


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
    If env vars are set, upload log to Drive and/or email a summary.
    Never raises; logs problems only.
    """
    if not log_path:
        logger.debug("No log file path; skipping cloud delivery")
        return

    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "").strip()
    drive_result: dict[str, Any] | None = None
    if folder_id:
        drive_result = upload_log_to_google_drive(log_path, folder_id)
    else:
        logger.debug("GOOGLE_DRIVE_FOLDER_ID not set; skipping Drive upload")

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
        if drive_result:
            fid = drive_result.get("id")
            link = drive_result.get("webViewLink")
            lines.append("Google Drive:")
            if link:
                lines.append(link)
            elif fid:
                lines.append(f"file id: {fid}")
            lines.append("")
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
