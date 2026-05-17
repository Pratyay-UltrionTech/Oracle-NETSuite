from __future__ import annotations

import logging
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.netsuite_service import fetch_tax_nature_from_netsuite

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
    return search.lower() in str(row.get("name") or "").lower()


async def fetch_tax_nature_live(*, force_refresh: bool = False) -> List[Dict[str, str]]:
    """Load tax nature rows from NetSuite (in-memory TTL cache only)."""
    now = time.time()
    cached = _cache.get("rows")
    if (
        not force_refresh
        and isinstance(cached, list)
        and (now - float(_cache.get("at") or 0)) < _CACHE_TTL_SEC
    ):
        return cached

    rows = await fetch_tax_nature_from_netsuite()
    _cache["rows"] = rows
    _cache["at"] = now
    return rows


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
        "action": "FETCH_TAX_NATURE",
        "entityType": "tax_nature",
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
        logger.exception("Failed to write FETCH_TAX_NATURE activity log")


def _filter_rows(
    rows: List[Dict[str, str]], search: Optional[str] = None
) -> List[Dict[str, str]]:
    s = _sanitize_search(search)
    out = [r for r in rows if _matches_search(r, s)]
    out.sort(key=lambda r: str(r.get("name") or "").lower())
    return out


def _to_options(rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
    return [{"name": str(r.get("name") or "")} for r in rows if r.get("name")]


async def get_tax_nature_live(
    db: Optional[AsyncIOMotorDatabase] = None,
    *,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    try:
        rows = await fetch_tax_nature_live()
        data = _to_options(rows)
        await _log_fetch(db, user_id=user_id, response_count=len(data), success=True)
        return {
            "success": True,
            "count": len(data),
            "data": data,
            "source": "netsuite",
        }
    except Exception:
        logger.exception("Tax nature live fetch failed")
        await _log_fetch(db, user_id=user_id, response_count=0, success=False)
        return {
            "success": False,
            "message": "Unable to fetch tax nature data",
            "count": 0,
            "data": [],
        }


async def search_tax_nature(
    db: Optional[AsyncIOMotorDatabase] = None,
    *,
    q: str = "",
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    try:
        rows = _filter_rows(await fetch_tax_nature_live(), search=q)
        data = _to_options(rows)
        if q.strip():
            await _log_fetch(db, user_id=user_id, response_count=len(data), success=True)
        return {
            "success": True,
            "count": len(data),
            "data": data,
            "source": "netsuite",
        }
    except Exception:
        logger.exception("Tax nature search failed")
        return {
            "success": False,
            "message": "Unable to fetch tax nature data",
            "count": 0,
            "data": [],
        }
