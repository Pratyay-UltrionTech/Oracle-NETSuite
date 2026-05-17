from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_database
from app.services import item_service
from app.utils.deps import get_client_admin, get_current_user

router = APIRouter(prefix="/items", tags=["Items"])


@router.post("/sync", status_code=status.HTTP_200_OK)
async def refresh_items_cache(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    return await item_service.refresh_items_from_netsuite()


@router.get("/live", status_code=status.HTTP_200_OK)
async def items_live(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    db = get_database()
    return await item_service.get_items_live(
        db,
        user_id=current_user.get("id"),
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_items_endpoint(
    q: str = Query("", max_length=200),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await item_service.search_items(None, q=q, page=page, limit=limit)


@router.get("/lookup/by-internal/{internal_id}", status_code=status.HTTP_200_OK)
async def lookup_item_by_internal_id(
    internal_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await item_service.get_item_by_internal_id(None, internal_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found in NetSuite")
    return doc


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_items(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await item_service.get_items_page(
        None,
        page=page,
        limit=limit,
        search=search,
    )


@router.get("/{item_id}", status_code=status.HTTP_200_OK)
async def get_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await item_service.get_item_by_internal_id(None, item_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found in NetSuite")
    return doc
