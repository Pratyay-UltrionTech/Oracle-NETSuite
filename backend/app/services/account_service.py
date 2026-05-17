from __future__ import annotations

import logging
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.netsuite_service import fetch_accounts_from_netsuite

logger = logging.getLogger(__name__)

_MAX_SEARCH_LEN = 200
_CACHE_TTL_SEC = 300

_cache: Dict[str, Any] = {"rows": None, "at": 0.0}


def _sanitize_search(q: Optional[str]) -> str:
    if not q:
        return ""
    s = re.sub(r"[^\w\s\-.,%()/+]", "", q, flags=re.UNICODE).strip()
    return s[:_MAX_SEARCH_LEN]


def _matches_search(row: Dict[str, str], search: str) -> bool:
    if not search:
        return True
    s = search.lower()
    for key in ("number", "name", "type", "internalId"):
        if s in str(row.get(key) or "").lower():
            return True
    return False


def _to_api_row(row: Dict[str, str]) -> Dict[str, Any]:
    iid = str(row.get("internalId") or "")
    return {
        "_id": iid,
        "internalId": iid,
        "number": str(row.get("number") or ""),
        "name": str(row.get("name") or ""),
        "type": str(row.get("type") or ""),
        "generalratetype": str(row.get("generalratetype") or ""),
        "cashflowratetype": str(row.get("cashflowratetype") or ""),
        "source": "netsuite",
        "isActive": True,
    }


async def fetch_accounts_live(*, force_refresh: bool = False) -> List[Dict[str, str]]:
    """Fetch account rows from NetSuite RESTlet; optional 5-minute in-memory cache."""
    now = time.time()
    cached = _cache.get("rows")
    if (
        not force_refresh
        and isinstance(cached, list)
        and (now - float(_cache.get("at") or 0)) < _CACHE_TTL_SEC
    ):
        return cached

    rows = await fetch_accounts_from_netsuite()
    _cache["rows"] = rows
    _cache["at"] = now
    logger.info("Account cache refreshed from NetSuite count=%s", len(rows))
    return rows


def _filter_rows(
    rows: List[Dict[str, str]],
    *,
    search: Optional[str] = None,
) -> List[Dict[str, str]]:
    s = _sanitize_search(search)
    out: List[Dict[str, str]] = []
    for row in rows:
        if not _matches_search(row, s):
            continue
        out.append(row)
    out.sort(
        key=lambda r: (
            str(r.get("number") or "").lower(),
            str(r.get("name") or "").lower(),
            str(r.get("internalId") or ""),
        )
    )
    return out


async def _log_fetch(
    db: Optional[AsyncIOMotorDatabase],
    *,
    user_id: Optional[str],
    response_count: int,
    success: bool,
) -> None:
    if db is None:
        return
    doc: Dict[str, Any] = {
        "action": "FETCH_ACCOUNTS",
        "entityType": "account",
        "responseCount": response_count,
        "success": success,
        "timestamp": datetime.now(timezone.utc),
        "performedBy": user_id,
    }
    if user_id:
        doc["userId"] = user_id
    try:
        await db.activity_log.insert_one(doc)
    except Exception:
        logger.exception("Failed to write FETCH_ACCOUNTS activity log")


async def refresh_accounts_from_netsuite() -> Dict[str, Any]:
    rows = await fetch_accounts_live(force_refresh=True)
    return {
        "success": True,
        "fetched": len(rows),
        "cached": True,
        "source": "netsuite",
    }


async def get_accounts_live(
    db: Optional[AsyncIOMotorDatabase] = None,
    *,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> Dict[str, Any]:
    try:
        rows = _filter_rows(await fetch_accounts_live(), search=search)
        page = max(1, page)
        limit = min(max(1, limit), 200)
        total = len(rows)
        start = (page - 1) * limit
        page_rows = rows[start : start + limit]
        data = [_to_api_row(r) for r in page_rows]
        await _log_fetch(db, user_id=user_id, response_count=total, success=True)
        return {
            "success": True,
            "count": total,
            "page": page,
            "limit": limit,
            "data": data,
            "source": "netsuite",
        }
    except Exception:
        logger.exception("Account live fetch failed")
        await _log_fetch(db, user_id=user_id, response_count=0, success=False)
        return {
            "success": False,
            "message": "Unable to fetch account data",
            "count": 0,
            "data": [],
        }


async def get_accounts_page(
    db: Optional[AsyncIOMotorDatabase] | None,
    *,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
) -> Dict[str, Any]:
    del db
    page = max(1, page)
    limit = min(max(1, limit), 200)
    rows = _filter_rows(await fetch_accounts_live(), search=search)
    total = len(rows)
    start = (page - 1) * limit
    page_rows = rows[start : start + limit]
    return {
        "success": True,
        "count": total,
        "page": page,
        "limit": limit,
        "data": [_to_api_row(r) for r in page_rows],
        "source": "netsuite",
    }


async def search_accounts(
    db: Optional[AsyncIOMotorDatabase] | None,
    *,
    q: str,
    page: int = 1,
    limit: int = 50,
) -> Dict[str, Any]:
    del db
    page = max(1, page)
    limit = min(max(1, limit), 100)
    rows = _filter_rows(await fetch_accounts_live(), search=q)
    total = len(rows)
    start = (page - 1) * limit
    page_rows = rows[start : start + limit]
    return {
        "success": True,
        "count": total,
        "page": page,
        "limit": limit,
        "data": [_to_api_row(r) for r in page_rows],
        "source": "netsuite",
    }


async def get_account_by_internal_id(
    db: Optional[AsyncIOMotorDatabase] | None, internal_id: str
) -> Optional[Dict[str, Any]]:
    del db
    iid = str(internal_id).strip()
    if not iid:
        return None
    for row in await fetch_accounts_live():
        if str(row.get("internalId")) == iid:
            return _to_api_row(row)
    return None
