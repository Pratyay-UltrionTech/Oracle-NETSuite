from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from app.config import settings
from app.services import account_service, vendor_service
from app.services.netsuite_record_resolver import resolve_record_ref_value
from app.services.netsuite_restlet import restlet_post_sync_with_retry

logger = logging.getLogger(__name__)


def is_vendor_bill_restlet_configured() -> bool:
    return bool(settings.NETSUITE_VB_SCRIPT.strip() and settings.NETSUITE_VB_DEPLOY.strip())

_VENDOR_KEYS = ("entity", "vendor", "vendorId")
_SUBSIDIARY_KEYS = ("subsidiary", "subsidiaryId")
_VB_NUMBER_KEYS = ("tranid", "vendorbillnumber", "invoiceNumber")

_ITEM_LINE_KEYS = (
    "item",
    "quantity",
    "rate",
    "amount",
    "location",
    "department",
    "class",
    "description",
    "taxcode",
    "hsnsac",
)

_EXPENSE_LINE_KEYS = (
    "account",
    "amount",
    "memo",
    "department",
    "class",
    "location",
    "taxcode",
)


def _first_present(source: Dict[str, Any], keys: tuple[str, ...]) -> Any:
    for key in keys:
        value = source.get(key)
        if value is not None and value != "":
            return value
    return None


def _map_line(line: Dict[str, Any], keys: tuple[str, ...]) -> Dict[str, Any]:
    mapped: Dict[str, Any] = {}
    for key in keys:
        if key == "hsnsac":
            value = _first_present(
                line,
                ("hsnsac", "hsn_sac", "custcol_hsnsac", "hsncode", "hsn_code"),
            )
        else:
            value = line.get(key)
        if value is not None and value != "":
            mapped[key] = value
    return mapped


def _looks_like_internal_id(value: Any) -> bool:
    s = str(value or "").strip()
    return bool(s) and s.isdigit()


async def _resolve_field(
    kind: str,
    value: Any,
    display_values: Dict[str, str],
    field_key: str,
) -> Any:
    if kind == "account":
        resolved, label = await _resolve_account_value(value)
    else:
        resolved, label = await resolve_record_ref_value(kind, value)
    if label:
        display_values[field_key] = label
    if kind == "subsidiary":
        return resolved if _looks_like_internal_id(resolved) else ""
    return resolved or value


async def _subsidiary_from_vendor(vendor_value: Any) -> Any:
    """When the body has no subsidiary, derive internalId from the selected vendor master record."""
    from app.services.subsidiary_service import resolve_subsidiary_internal_id

    raw = str(vendor_value or "").strip()
    if not raw:
        return None
    vendor = await vendor_service.get_vendor_by_internal_id(None, raw)
    if not vendor:
        return None
    sub_id = str(vendor.get("subsidiaryId") or "").strip()
    if _looks_like_internal_id(sub_id):
        return sub_id
    sub_name = str(vendor.get("subsidiary") or "").strip()
    if not sub_name:
        return None
    resolved, _ = await resolve_subsidiary_internal_id(sub_name)
    return resolved or None


async def _resolve_account_value(value: Any) -> Tuple[str, Optional[str]]:
    raw = str(value or "").strip()
    if not raw:
        return "", None
    if raw.isdigit():
        return raw, None

    lower = raw.lower()
    for row in await account_service.fetch_accounts_live():
        iid = str(row.get("internalId") or "").strip()
        if not iid:
            continue
        name = str(row.get("name") or row.get("displayName") or "").strip()
        if iid == raw:
            return iid, None
        if name and (lower == name.lower() or lower in name.lower() or name.lower() in lower):
            return iid, name
    return raw, None


def _is_meaningful_item_line(line: Dict[str, Any]) -> bool:
    return bool(_first_present(line, ("item",)))


def _is_meaningful_expense_line(line: Dict[str, Any]) -> bool:
    return bool(line.get("account"))


def validate_vendor_bill_payload(payload: Dict[str, Any]) -> List[str]:
    """Return validation error messages; empty list means valid."""
    errors: List[str] = []
    if not payload.get("vendor"):
        errors.append("vendor is required")
    subsidiary = payload.get("subsidiary")
    if not subsidiary:
        errors.append("subsidiary is required")
    elif not _looks_like_internal_id(subsidiary):
        errors.append(
            f"subsidiary must be a valid NetSuite internal ID (got '{subsidiary}')"
        )
    if not payload.get("trandate"):
        errors.append("trandate is required")

    items = payload.get("items") or []
    expenses = payload.get("expenses") or []
    has_item = any(_is_meaningful_item_line(row) for row in items if isinstance(row, dict))
    has_expense = any(
        _is_meaningful_expense_line(row) for row in expenses if isinstance(row, dict)
    )
    if not has_item and not has_expense:
        errors.append("at least one item line or one expense line is required")
    return errors


async def build_vendor_bill_payload(submission: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map an approved workflow submission into the NetSuite Vendor Bill RESTlet payload.
    """
    body_fields = submission.get("bodyFields") or {}
    if not isinstance(body_fields, dict):
        body_fields = {}

    values = submission.get("values") or {}
    if not isinstance(values, dict):
        values = {}

    merged_body = {**values, **body_fields}

    line_items = submission.get("lineItems")
    if not isinstance(line_items, list):
        line_items = values.get("lineItems") if isinstance(values.get("lineItems"), list) else []

    expense_lines = submission.get("expenseLines")
    if not isinstance(expense_lines, list):
        expense_lines = (
            values.get("expenseLines") if isinstance(values.get("expenseLines"), list) else []
        )

    display_values: Dict[str, str] = dict(submission.get("displayValues") or {})

    vendor_raw = _first_present(merged_body, _VENDOR_KEYS)
    subsidiary_raw = _first_present(merged_body, _SUBSIDIARY_KEYS)
    location_raw = merged_body.get("location")
    department_raw = merged_body.get("department")
    class_raw = merged_body.get("class")
    terms_raw = merged_body.get("terms")

    vendor_id = await _resolve_field("vendor", vendor_raw, display_values, "vendor")
    if not subsidiary_raw:
        subsidiary_raw = await _subsidiary_from_vendor(vendor_id or vendor_raw)
    subsidiary_id = await _resolve_field(
        "subsidiary", subsidiary_raw, display_values, "subsidiary"
    )
    location_id = await _resolve_field("location", location_raw, display_values, "location")
    department_id = await _resolve_field(
        "department", department_raw, display_values, "department"
    )
    class_id = await _resolve_field("class", class_raw, display_values, "class")

    items: List[Dict[str, Any]] = []
    for index, row in enumerate(line_items):
        if not isinstance(row, dict) or not row:
            continue
        line = _map_line(row, _ITEM_LINE_KEYS)
        if not line or not _is_meaningful_item_line(line):
            continue
        if line.get("item"):
            line["item"] = await _resolve_field(
                "item", line["item"], display_values, f"items.{index}.item"
            )
        if line.get("location"):
            line["location"] = await _resolve_field(
                "location", line["location"], display_values, f"items.{index}.location"
            )
        if line.get("department"):
            line["department"] = await _resolve_field(
                "department", line["department"], display_values, f"items.{index}.department"
            )
        if line.get("class"):
            line["class"] = await _resolve_field(
                "class", line["class"], display_values, f"items.{index}.class"
            )
        if line.get("taxcode"):
            line["taxcode"] = await _resolve_field(
                "taxcode", line["taxcode"], display_values, f"items.{index}.taxcode"
            )
        items.append(line)

    expenses: List[Dict[str, Any]] = []
    for index, row in enumerate(expense_lines):
        if not isinstance(row, dict) or not row:
            continue
        line = _map_line(row, _EXPENSE_LINE_KEYS)
        if not line or not _is_meaningful_expense_line(line):
            continue
        if line.get("account"):
            line["account"] = await _resolve_field(
                "account", line["account"], display_values, f"expenses.{index}.account"
            )
        if line.get("location"):
            line["location"] = await _resolve_field(
                "location", line["location"], display_values, f"expenses.{index}.location"
            )
        if line.get("department"):
            line["department"] = await _resolve_field(
                "department", line["department"], display_values, f"expenses.{index}.department"
            )
        if line.get("class"):
            line["class"] = await _resolve_field(
                "class", line["class"], display_values, f"expenses.{index}.class"
            )
        if line.get("taxcode"):
            line["taxcode"] = await _resolve_field(
                "taxcode", line["taxcode"], display_values, f"expenses.{index}.taxcode"
            )
        expenses.append(line)

    submission_id = str(submission.get("_id") or submission.get("id") or "")
    submission["displayValues"] = display_values

    payload: Dict[str, Any] = {
        "vendor": vendor_id,
        "subsidiary": subsidiary_id,
        "location": location_id,
        "department": department_id,
        "class": class_id,
        "memo": merged_body.get("memo"),
        "trandate": merged_body.get("trandate"),
        "duedate": merged_body.get("duedate"),
        "terms": terms_raw,
        "vendorbillnumber": _first_present(merged_body, _VB_NUMBER_KEYS),
        "submissionId": submission_id,
        "items": items,
        "expenses": expenses,
    }

    return {
        k: v
        for k, v in payload.items()
        if (v is not None and v != "") or k in ("items", "expenses")
    }


def create_vendor_bill_in_netsuite(
    payload: Dict[str, Any],
    *,
    max_retries: int = 3,
) -> Dict[str, Any]:
    """
    POST a Vendor Bill payload to the NetSuite RESTlet using OAuth 1.0 credentials.
    Retries transient and governance failures with exponential backoff.
    """
    if not is_vendor_bill_restlet_configured():
        logger.info(
            "NetSuite VB create skipped: NETSUITE_VB_SCRIPT/DEPLOY not configured submissionId=%s",
            payload.get("submissionId"),
        )
        return {
            "status": "skipped",
            "success": False,
            "message": "Vendor Bill NetSuite integration is not configured",
        }

    validation_errors = validate_vendor_bill_payload(payload)
    if validation_errors:
        message = "; ".join(validation_errors)
        logger.warning(
            "NetSuite VB create: validation failed submissionId=%s errors=%s",
            payload.get("submissionId"),
            message,
        )
        return {"status": "error", "success": False, "message": message}

    logger.info(
        "NetSuite VB create: start submissionId=%s vendor=%s itemCount=%s expenseCount=%s",
        payload.get("submissionId"),
        payload.get("vendor"),
        len(payload.get("items") or []),
        len(payload.get("expenses") or []),
    )

    try:
        data = restlet_post_sync_with_retry(
            settings.NETSUITE_VB_SCRIPT,
            settings.NETSUITE_VB_DEPLOY,
            payload,
            timeout=120,
            max_retries=max_retries,
        )
        if isinstance(data, dict):
            data.setdefault("sentAt", datetime.utcnow().isoformat())
            logger.info(
                "NetSuite VB create: response submissionId=%s status=%s billId=%s",
                payload.get("submissionId"),
                data.get("status") or data.get("success"),
                data.get("billId"),
            )
            return data
        return {"status": "error", "success": False, "message": "Unexpected NetSuite response type"}
    except Exception as exc:
        logger.exception(
            "NetSuite VB create failed submissionId=%s: %s",
            payload.get("submissionId"),
            exc,
        )
        return {"status": "error", "success": False, "message": str(exc)}


def is_netsuite_vb_success(response: Dict[str, Any]) -> bool:
    if not isinstance(response, dict):
        return False
    status = str(response.get("status") or "").lower()
    if status == "skipped":
        return False
    if status in {"success", "ok"}:
        return True
    if response.get("success") is True:
        return True
    if response.get("billId") or response.get("internalId") or response.get("id"):
        return True
    return False


def extract_netsuite_error_message(response: Dict[str, Any]) -> str:
    if not isinstance(response, dict):
        return "Unknown NetSuite error"
    for key in ("message", "errorMessage", "error"):
        value = response.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, dict):
            nested = value.get("message") or value.get("code")
            if nested:
                return str(nested)
    return "NetSuite Vendor Bill sync failed"


def extract_bill_id(response: Dict[str, Any]) -> Optional[str]:
    for key in ("billId", "internalId", "id", "netsuiteId"):
        value = response.get(key)
        if value is not None and str(value).strip():
            return str(value)
    data = response.get("data")
    if isinstance(data, dict):
        for key in ("billId", "internalId", "id"):
            value = data.get(key)
            if value is not None and str(value).strip():
                return str(value)
    return None


def extract_document_number(response: Dict[str, Any]) -> Optional[str]:
    for key in ("documentNumber", "tranid", "document_number", "vendorbillnumber"):
        value = response.get(key)
        if value is not None and str(value).strip():
            return str(value)
    data = response.get("data")
    if isinstance(data, dict):
        for key in ("documentNumber", "tranid", "document_number", "vendorbillnumber"):
            value = data.get(key)
            if value is not None and str(value).strip():
                return str(value)
    return None


def build_vendor_bill_sync_update(
    response: Dict[str, Any],
    submission_id: str,
) -> Dict[str, Any]:
    """
    Build the MongoDB fields to persist after a Vendor Bill NetSuite sync attempt.
    """
    if str(response.get("status") or "").lower() == "skipped":
        return {
            "submissionId": submission_id,
            "netsuiteResponse": response,
            "syncStatus": "NOT_CONFIGURED",
            "updatedAt": datetime.utcnow(),
        }

    is_success = is_netsuite_vb_success(response)
    update: Dict[str, Any] = {
        "submissionId": submission_id,
        "netsuiteResponse": response,
        "updatedAt": datetime.utcnow(),
    }

    if is_success:
        update["status"] = "SYNCED_TO_NETSUITE"
        update["syncStatus"] = "SYNCED_TO_NETSUITE"
        bill_id = extract_bill_id(response)
        doc_number = extract_document_number(response)
        if bill_id:
            update["billId"] = bill_id
        if doc_number:
            update["documentNumber"] = doc_number
        update["netsuiteSyncError"] = None
    else:
        update["status"] = "NETSUITE_SYNC_FAILED"
        update["syncStatus"] = "NETSUITE_SYNC_FAILED"
        update["netsuiteSyncError"] = extract_netsuite_error_message(response)

    return update


async def send_vendor_bill_to_netsuite(submission: Dict[str, Any]) -> Dict[str, Any]:
    payload = await build_vendor_bill_payload(submission)
    return create_vendor_bill_in_netsuite(payload)


def sample_vendor_bill_payload() -> Dict[str, Any]:
    """Sample Vendor Bill payload for the test endpoint."""
    return {
        "vendor": "1",
        "subsidiary": "1",
        "location": "1",
        "department": "1",
        "class": "1",
        "memo": "Test Vendor Bill from API",
        "trandate": datetime.utcnow().strftime("%Y-%m-%d"),
        "duedate": datetime.utcnow().strftime("%Y-%m-%d"),
        "terms": "1",
        "vendorbillnumber": f"TEST-VB-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "submissionId": "test-submission",
        "items": [
            {
                "item": "1",
                "quantity": 1,
                "rate": 100,
                "amount": 100,
                "location": "1",
                "department": "1",
                "class": "1",
                "description": "Test line item",
                "taxcode": "1",
                "hsnsac": "1234",
            }
        ],
        "expenses": [],
    }
