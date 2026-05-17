from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, Query

from app.database import get_database
from app.services import tax_nature_service
from app.utils.deps import get_current_user

router = APIRouter(prefix="/tax-nature", tags=["Tax Nature"])


@router.get("/live", status_code=200)
async def tax_nature_live(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    db = get_database()
    return await tax_nature_service.get_tax_nature_live(
        db, user_id=current_user.get("id")
    )


@router.get("/search", status_code=200)
async def tax_nature_search(
    q: str = Query("", max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    db = get_database()
    return await tax_nature_service.search_tax_nature(
        db, q=q, user_id=current_user.get("id")
    )
