from fastapi import APIRouter, Query
from app.services.netsuite_service import get_employees, send_to_netsuite
from app.services.purchase_order_netsuite_service import (
    create_purchase_order_in_netsuite,
    sample_purchase_order_payload,
)
from app.services.vendor_bill_netsuite_service import (
    create_vendor_bill_in_netsuite,
    sample_vendor_bill_payload,
)

router = APIRouter(prefix="/api/netsuite", tags=["NetSuite"])


@router.get("/employees")
def fetch_employees(refresh: bool = Query(False, description="Bypass cache")):
    """Employees for dropdowns (cached 5 min; stale fallback on rate limit)."""
    return get_employees(force_refresh=refresh)

@router.post("/test-submit")
def test_submit():
    """
    Test endpoint to simulate sending data to NetSuite.
    """
    payload = {
        "firstname": "Test",
        "lastname": "User",
        "email": "test@test.com",
        "subsidiary": 1
    }
    return send_to_netsuite(payload)


@router.post("/test-po")
def test_purchase_order():
    """
    Test endpoint that sends sample Purchase Order data to the NetSuite PO RESTlet.
    """
    payload = sample_purchase_order_payload()
    return create_purchase_order_in_netsuite(payload)


@router.post("/test-vendor-bill")
def test_vendor_bill():
    """
    Test endpoint that sends sample Vendor Bill data to the NetSuite VB RESTlet.
    """
    payload = sample_vendor_bill_payload()
    return create_vendor_bill_in_netsuite(payload)
