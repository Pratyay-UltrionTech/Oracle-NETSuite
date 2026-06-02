from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query

from ..services.purchase_order_service import PurchaseOrderService
from ..utils.deps import get_current_user

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])


@router.get("/search")
async def search_purchase_orders(
    q: Optional[str] = Query(None, description="Search by PO number, vendor, or internal id"),
    current_user: dict = Depends(get_current_user),
):
    company_id = current_user.get("companyId") if current_user.get("role") != "super_admin" else None
    return await PurchaseOrderService.search_purchase_orders(q, company_id=company_id)


@router.get("/{po_id}")
async def get_purchase_order(
    po_id: str,
    current_user: dict = Depends(get_current_user),
):
    company_id = current_user.get("companyId") if current_user.get("role") != "super_admin" else None
    return await PurchaseOrderService.get_purchase_order(po_id, company_id=company_id)

