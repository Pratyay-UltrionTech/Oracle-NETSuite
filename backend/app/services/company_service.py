from typing import Any, Dict, List

from bson import ObjectId
from fastapi import HTTPException

from ..database import get_database


def _valid_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid company id") from exc


async def delete_company_and_related_data(company_id: str) -> Dict[str, Any]:
    """
    Permanently remove a company and all data scoped to it:
    users, forms, submissions (all types), and workflows.
    """
    db = get_database()
    company_oid = _valid_object_id(company_id)
    company_id_str = str(company_oid)

    company = await db.companies.find_one({"_id": company_oid})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    form_ids: List[str] = []
    async for form in db.forms.find({"companyId": company_id_str}, {"_id": 1}):
        form_ids.append(str(form["_id"]))

    user_ids: List[str] = []
    async for user in db.users.find({"companyId": company_id_str}, {"_id": 1}):
        user_ids.append(str(user["_id"]))

    submission_filters = [{"companyId": company_id_str}]
    if form_ids:
        submission_filters.append({"formId": {"$in": form_ids}})
    submission_query = (
        {"$or": submission_filters} if len(submission_filters) > 1 else submission_filters[0]
    )

    submission_ids: List[str] = []
    async for submission in db.submissions.find(submission_query, {"_id": 1}):
        submission_ids.append(str(submission["_id"]))

    item_receipt_result = await db.item_receipt_submissions.delete_many({"companyId": company_id_str})
    vendor_bill_result = await db.vendor_bill_submissions.delete_many({"companyId": company_id_str})

    submissions_result = await db.submissions.delete_many(submission_query)
    forms_result = await db.forms.delete_many({"companyId": company_id_str})
    workflows_result = await db.workflows.delete_many({"companyId": company_id_str})
    users_result = await db.users.delete_many(
        {"companyId": company_id_str, "role": {"$ne": "super_admin"}}
    )

    activity_entity_ids = [company_id_str, *form_ids, *submission_ids, *user_ids]
    activity_result = await db.activity_log.delete_many(
        {
            "$or": [
                {"metadata.companyId": company_id_str},
                {"entityId": {"$in": activity_entity_ids}},
                {"userId": {"$in": user_ids}},
            ]
        }
    )

    company_result = await db.companies.delete_one({"_id": company_oid})
    if company_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")

    return {
        "message": "Company and all related data deleted successfully",
        "deleted": {
            "users": users_result.deleted_count,
            "forms": forms_result.deleted_count,
            "submissions": submissions_result.deleted_count,
            "itemReceiptSubmissions": item_receipt_result.deleted_count,
            "vendorBillSubmissions": vendor_bill_result.deleted_count,
            "workflows": workflows_result.deleted_count,
            "activityLogEntries": activity_result.deleted_count,
        },
    }
