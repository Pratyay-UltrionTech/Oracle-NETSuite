from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from .netsuite_service import send_to_netsuite


def build_item_receipt_payload(submission: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build a configurable Item Receipt payload.
    Keeps mapping isolated so NetSuite API changes do not affect workflow engine.
    """
    body_fields = submission.get("bodyFields") or {}
    if not isinstance(body_fields, dict):
        body_fields = {}

    line_items = submission.get("lineItems") or submission.get("values", {}).get("lineItems") or []
    if not isinstance(line_items, list):
        line_items = []

    return {
        "vendor": body_fields.get("entity"),
        "location": body_fields.get("location"),
        "currency": body_fields.get("currency"),
        "createdFrom": body_fields.get("createdfrom"),
        "trandate": body_fields.get("trandate"),
        "items": line_items,
    }


def send_item_receipt_to_netsuite(submission: Dict[str, Any]) -> Dict[str, Any]:
    payload = build_item_receipt_payload(submission)
    result = send_to_netsuite(payload)
    if isinstance(result, dict):
        result.setdefault("sentAt", datetime.utcnow().isoformat())
    return result

