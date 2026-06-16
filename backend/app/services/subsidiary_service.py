from __future__ import annotations

import logging
import re
import time
from typing import Any, Dict, List, Optional

from app.services.netsuite_service import fetch_subsidiaries_from_netsuite

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
    for key in ("name", "internalId"):
        if s in str(row.get(key) or "").lower():
            return True
    return False


def _to_api_row(row: Dict[str, str]) -> Dict[str, Any]:
    iid = str(row.get("internalId") or "")
    return {
        "_id": iid,
        "internalId": iid,
        "name": str(row.get("name") or ""),
        "source": "netsuite",
        "isActive": True,
    }


async def _load_subsidiaries(*, force_refresh: bool = False) -> List[Dict[str, str]]:
    now = time.time()
    cached = _cache.get("rows")
    if (
        not force_refresh
        and isinstance(cached, list)
        and (now - float(_cache.get("at") or 0)) < _CACHE_TTL_SEC
    ):
        return cached

    rows = await fetch_subsidiaries_from_netsuite()
    _cache["rows"] = rows
    _cache["at"] = now
    logger.info("Subsidiary cache refreshed from NetSuite count=%s", len(rows))
    return rows


async def refresh_subsidiaries_from_netsuite() -> Dict[str, Any]:
    rows = await _load_subsidiaries(force_refresh=True)
    return {
        "success": True,
        "fetched": len(rows),
        "cached": True,
        "source": "netsuite",
    }


async def get_all_subsidiaries(
    *,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    rows = await _load_subsidiaries()
    q = _sanitize_search(search)
    return [_to_api_row(row) for row in rows if _matches_search(row, q)]


async def get_subsidiary_by_internal_id(subsidiary_id: str) -> Optional[Dict[str, Any]]:
    rows = await _load_subsidiaries()
    sid = str(subsidiary_id or "").strip()
    for row in rows:
        if str(row.get("internalId") or "") == sid:
            return _to_api_row(row)
    return None


def _looks_like_internal_id(value: Any) -> bool:
    s = str(value or "").strip()
    return bool(s) and s.isdigit()


def _subsidiary_name_key(name: str) -> str:
    """Normalize subsidiary labels for fuzzy matching (hierarchy, suffixes, lists)."""
    s = re.sub(r"\s+", " ", str(name or "").strip().lower())
    if not s:
        return ""
    if "," in s:
        s = s.split(",")[0].strip()
    if ":" in s:
        parts = [p.strip() for p in s.split(":") if p.strip()]
        s = parts[-1] if parts else s
    for suffix in (
        " private limited",
        " pvt. ltd.",
        " pvt ltd",
        " llc",
        " inc",
        " ltd",
    ):
        if s.endswith(suffix):
            s = s[: -len(suffix)].strip()
    return s


def _match_subsidiary_name(raw: str, candidate_name: str) -> bool:
    raw_lower = raw.strip().lower()
    name_lower = candidate_name.strip().lower()
    if not raw_lower or not name_lower:
        return False
    if raw_lower == name_lower:
        return True
    if raw_lower in name_lower or name_lower in raw_lower:
        return True
    raw_key = _subsidiary_name_key(raw)
    name_key = _subsidiary_name_key(candidate_name)
    if raw_key and name_key and raw_key == name_key:
        return True
    if raw_key and name_key and (raw_key in name_key or name_key in raw_key):
        return True
    return False


async def resolve_subsidiary_internal_id(
    value: Any,
    *,
    force_refresh: bool = False,
) -> tuple[str, Optional[str]]:
    """
    Resolve a subsidiary field value to NetSuite internalId.
    Returns (internalId, displayName if resolved from label). Never returns a label as the id.
    """
    raw = str(value or "").strip()
    if not raw:
        return "", None
    if _looks_like_internal_id(raw):
        return raw, None

    rows = await _load_subsidiaries(force_refresh=force_refresh)
    for row in rows:
        name = str(row.get("name") or "").strip()
        iid = str(row.get("internalId") or "").strip()
        if not iid:
            continue
        if _match_subsidiary_name(raw, name):
            return iid, name

    if not force_refresh:
        return await resolve_subsidiary_internal_id(value, force_refresh=True)

    logger.warning("Subsidiary value could not be resolved to internalId: %s", raw[:120])
    return "", None
