from email import policy
from email.parser import BytesParser

def parse_eml(file_bytes: bytes) -> dict:
    msg = BytesParser(policy=policy.default).parsebytes(file_bytes)

    attachments = []
    body_text = ""
    body_html = ""

    for part in msg.walk():
        content_disposition = part.get_content_disposition()
        content_type = part.get_content_type()

        if content_disposition == "attachment" or (part.get_filename() and content_disposition != "inline"):
            payload = part.get_payload(decode=True) or b""
            attachments.append({
                "filename": part.get_filename() or "unnamed_attachment",
                "content_type": content_type,
                "size": len(payload),
                "raw_bytes": payload
            })
        elif content_type == "text/plain" and not body_text:
            try:
                body_text = part.get_content()
            except Exception:
                payload = part.get_payload(decode=True)
                body_text = payload.decode(errors="replace") if payload else ""
        elif content_type == "text/html" and not body_html:
            try:
                body_html = part.get_content()
            except Exception:
                payload = part.get_payload(decode=True)
                body_html = payload.decode(errors="replace") if payload else ""

    # Fallback if neither plain text nor html was parsed in walk
    if not body_text and not body_html:
        try:
            body_text = msg.get_content()
        except Exception:
            payload = msg.get_payload(decode=True)
            body_text = payload.decode(errors="replace") if payload else ""

    received_headers = msg.get_all("Received", [])
    auth_results = msg.get_all("Authentication-Results", [])

    return {
        "subject": msg.get("Subject") or "(No Subject)",
        "from": msg.get("From") or "",
        "to": msg.get("To") or "",
        "reply_to": msg.get("Reply-To") or "",
        "return_path": msg.get("Return-Path") or "",
        "date": msg.get("Date") or "",
        "message_id": msg.get("Message-ID") or "",
        "received_headers": received_headers,
        "auth_results_headers": auth_results,
        "body": body_text or body_html or "",
        "body_html": body_html,
        "attachments": attachments,
        "headers": dict(msg.items()),
    }
