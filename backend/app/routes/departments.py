from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.services import department_service
from app.utils.deps import get_client_admin, get_current_user

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.post("/sync", status_code=status.HTTP_200_OK)
async def refresh_departments_cache(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    """
    Refresh the in-memory NetSuite department cache (no MongoDB persistence).
    """
    del current_user
    return await department_service.refresh_departments_from_netsuite()


@router.post("/test-sync", status_code=status.HTTP_200_OK)
async def test_refresh_departments_cache(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    return await department_service.refresh_departments_from_netsuite()


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_departments_endpoint(
    q: str = Query("", max_length=200),
    limit: int = Query(50, ge=1, le=100),
    subsidiary: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await department_service.search_departments(
        None, q=q, limit=limit, subsidiary=subsidiary
    )


@router.get("/lookup/by-internal/{internal_id}", status_code=status.HTTP_200_OK)
async def lookup_department_by_internal_id(
    internal_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await department_service.get_department_by_internal_id(None, internal_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Department not found in NetSuite")
    return doc


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_departments(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    subsidiary: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await department_service.get_departments_page(
        None,
        page=page,
        limit=limit,
        search=search,
        subsidiary=subsidiary,
    )


@router.get("/{department_id}", status_code=status.HTTP_200_OK)
async def get_department(
    department_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await department_service.get_department_by_id(None, department_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Department not found in NetSuite")
    return doc
