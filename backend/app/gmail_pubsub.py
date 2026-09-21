import base64
import json
import logging

from fastapi import APIRouter, Request

router = APIRouter()

logger = logging.getLogger("sentinel_mesh.gmail_pubsub")


@router.post("/api/gmail/pubsub")
async def gmail_pubsub_webhook(payload: dict):
    """
    Receives Gmail mailbox-change notifications
    delivered through Google Cloud Pub/Sub.
    """

    message = payload.get("message", {})

    encoded_data = message.get("data")

    if not encoded_data:
        logger.warning("Pub/Sub message did not contain message.data")
        return {"status": "ignored"}

    try:
        padding = "=" * (-len(encoded_data) % 4)

        decoded_data = base64.urlsafe_b64decode(
            encoded_data + padding
        )

        notification = json.loads(
            decoded_data.decode("utf-8")
        )

    except Exception:
        logger.exception(
            "Failed to decode Gmail Pub/Sub notification"
        )
        return {"status": "invalid_notification"}

    email_address = notification.get("emailAddress")
    history_id = notification.get("historyId")

    logger.info(
        "Gmail notification received | email=%s | historyId=%s",
        email_address,
        history_id,
    )

    return {
        "status": "received",
        "emailAddress": email_address,
        "historyId": history_id,
    }