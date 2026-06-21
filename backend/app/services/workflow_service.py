from bson import ObjectId
from datetime import datetime
from typing import Optional, Dict, Any, List
from ..database import get_database
from ..schemas.workflow import CreateWorkflowRequest, UpdateWorkflowRequest
from .activity import log_activity


def _serialize_workflow(workflow: dict) -> dict:
    out = dict(workflow)
    out["id"] = str(out.pop("_id"))
    if "formIds" not in out:
        out["formIds"] = []
    return out


async def _validate_form_assignments(
    company_id: str,
    form_ids: List[str],
    exclude_workflow_id: Optional[str] = None,
) -> None:
    db = get_database()
    seen: set[str] = set()
    for form_id in form_ids:
        if form_id in seen:
            raise Exception("Duplicate form selected in workflow assignment")
        seen.add(form_id)

        form = await db.forms.find_one({"_id": ObjectId(form_id), "companyId": company_id})
        if not form:
            raise Exception("One or more selected forms were not found for this company")

        query: Dict[str, Any] = {
            "companyId": company_id,
            "formIds": form_id,
        }
        if exclude_workflow_id:
            query["_id"] = {"$ne": ObjectId(exclude_workflow_id)}

        conflict = await db.workflows.find_one(query)
        if conflict:
            raise Exception(
                f"Form \"{form.get('name')}\" is already assigned to workflow \"{conflict.get('name')}\""
            )


async def get_workflow_for_form(company_id: str, form_id: str) -> Optional[dict]:
    """Resolve workflow for a form: explicit assignment first, then legacy company-wide workflow."""
    db = get_database()
    specific = await db.workflows.find_one({"companyId": company_id, "formIds": form_id})
    if specific:
        return specific

    legacy = await db.workflows.find_one(
        {"companyId": company_id, "formIds": {"$exists": False}}
    )
    return legacy


async def list_workflows_by_company(company_id: str) -> List[dict]:
    db = get_database()
    workflows: List[dict] = []
    async for workflow in db.workflows.find({"companyId": company_id}).sort("updatedAt", -1):
        workflows.append(_serialize_workflow(workflow))
    return workflows


async def get_workflow_by_id(workflow_id: str) -> Optional[dict]:
    db = get_database()
    workflow = await db.workflows.find_one({"_id": ObjectId(workflow_id)})
    if not workflow:
        return None
    return _serialize_workflow(workflow)


async def create_workflow(data: CreateWorkflowRequest, admin_user: Dict[str, Any]) -> str:
    db = get_database()
    company = await db.companies.find_one({"_id": ObjectId(data.companyId)})
    if not company:
        raise Exception("Company not found")

    await _validate_form_assignments(data.companyId, data.formIds)

    now = datetime.utcnow()
    workflow_data = {
        "companyId": data.companyId,
        "name": data.name,
        "formIds": data.formIds,
        "levels": [level.dict() for level in data.levels],
        "createdAt": now,
        "updatedAt": now,
        "createdBy": admin_user.get("email", "admin"),
    }
    result = await db.workflows.insert_one(workflow_data)
    workflow_id = str(result.inserted_id)

    await log_activity(
        user_id=str(admin_user.get("_id", "admin")),
        action="CREATE_WORKFLOW",
        entity_id=workflow_id,
        entity_type="WORKFLOW",
        metadata={"companyId": data.companyId, "companyName": company.get("name"), "formIds": data.formIds},
    )

    return workflow_id


async def update_workflow(
    workflow_id: str,
    data: UpdateWorkflowRequest,
    admin_user: Dict[str, Any],
) -> str:
    db = get_database()
    existing = await db.workflows.find_one({"_id": ObjectId(workflow_id)})
    if not existing:
        raise Exception("Workflow not found")

    company_id = existing["companyId"]
    await _validate_form_assignments(company_id, data.formIds, exclude_workflow_id=workflow_id)

    await db.workflows.update_one(
        {"_id": ObjectId(workflow_id)},
        {
            "$set": {
                "name": data.name,
                "formIds": data.formIds,
                "levels": [level.dict() for level in data.levels],
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    company = await db.companies.find_one({"_id": ObjectId(company_id)})
    await log_activity(
        user_id=str(admin_user.get("_id", "admin")),
        action="UPDATE_WORKFLOW",
        entity_id=workflow_id,
        entity_type="WORKFLOW",
        metadata={
            "companyId": company_id,
            "companyName": company.get("name") if company else company_id,
            "formIds": data.formIds,
        },
    )

    return workflow_id


async def delete_workflow(workflow_id: str, admin_user: Dict[str, Any]) -> None:
    db = get_database()
    existing = await db.workflows.find_one({"_id": ObjectId(workflow_id)})
    if not existing:
        raise Exception("Workflow not found")

    await db.workflows.delete_one({"_id": ObjectId(workflow_id)})

    company = await db.companies.find_one({"_id": ObjectId(existing["companyId"])})
    await log_activity(
        user_id=str(admin_user.get("_id", "admin")),
        action="DELETE_WORKFLOW",
        entity_id=workflow_id,
        entity_type="WORKFLOW",
        metadata={
            "companyId": existing["companyId"],
            "companyName": company.get("name") if company else existing["companyId"],
        },
    )
