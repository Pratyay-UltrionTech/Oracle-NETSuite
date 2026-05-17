from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_database
from app.services import class_service
from app.utils.deps import get_client_admin, get_current_user

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.post("/sync", status_code=status.HTTP_200_OK)
async def refresh_classes_cache(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    """Refresh in-memory NetSuite class cache (no MongoDB master-data write)."""
    del current_user
    return await class_service.refresh_classes_from_netsuite()


@router.get("/live", status_code=status.HTTP_200_OK)
async def classes_live(
    page: int = Query(1, ge=1),
    limit: int = Query(200, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    subsidiary: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    db = get_database()
    return await class_service.get_classes_live(
        db,
        user_id=current_user.get("id"),
        search=search,
        subsidiary=subsidiary,
        page=page,
        limit=limit,
    )


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_classes_endpoint(
    q: str = Query("", max_length=200),
    limit: int = Query(50, ge=1, le=100),
    subsidiary: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await class_service.search_classes(
        None, q=q, limit=limit, subsidiary=subsidiary
    )


@router.get("/lookup/by-internal/{internal_id}", status_code=status.HTTP_200_OK)
async def lookup_class_by_internal_id(
    internal_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await class_service.get_class_by_internal_id(None, internal_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Class not found in NetSuite")
    return doc


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_classes(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    subsidiary: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await class_service.get_classes_page(
        None,
        page=page,
        limit=limit,
        search=search,
        subsidiary=subsidiary,
    )


@router.get("/{class_id}", status_code=status.HTTP_200_OK)
async def get_class(
    class_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await class_service.get_class_by_internal_id(None, class_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Class not found in NetSuite")
    return doc
