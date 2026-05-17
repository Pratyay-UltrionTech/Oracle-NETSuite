from fastapi import APIRouter, Query
from app.services.netsuite_service import get_employees, send_to_netsuite

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
