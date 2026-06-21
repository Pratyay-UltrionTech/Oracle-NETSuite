from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..schemas.workflow import (
    CreateWorkflowRequest,
    UpdateWorkflowRequest,
    WorkflowResponse,
)
from ..services.workflow_service import (
    create_workflow,
    update_workflow,
    delete_workflow,
    list_workflows_by_company,
    get_workflow_by_id,
)
from ..services.workflow_engine import approve_submission, reject_submission
from ..utils.deps import get_current_user, get_client_admin
from ..services.token_service import decode_token
from bson import ObjectId
from fastapi.responses import HTMLResponse
from ..database import get_database

router = APIRouter(prefix="/workflows", tags=["Workflows"])


def _assert_company_access(current_user: dict, company_id: str) -> None:
    if current_user["role"] != "super_admin" and current_user.get("companyId") != company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this company")


@router.post("", response_model=dict)
async def create_workflow_route(
    data: CreateWorkflowRequest,
    current_admin: dict = Depends(get_client_admin),
):
    if current_admin["role"] == "client_admin" and data.companyId != current_admin["companyId"]:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    try:
        workflow_id = await create_workflow(data, current_admin)
        return {"id": workflow_id, "message": "Workflow created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{workflowId}", response_model=dict)
async def update_workflow_route(
    workflowId: str,
    data: UpdateWorkflowRequest,
    current_admin: dict = Depends(get_client_admin),
):
    existing = await get_workflow_by_id(workflowId)
    if not existing:
        raise HTTPException(status_code=404, detail="Workflow not found")

    _assert_company_access(current_admin, existing["companyId"])

    try:
        await update_workflow(workflowId, data, current_admin)
        return {"id": workflowId, "message": "Workflow updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{workflowId}", response_model=dict)
async def delete_workflow_route(
    workflowId: str,
    current_admin: dict = Depends(get_client_admin),
):
    existing = await get_workflow_by_id(workflowId)
    if not existing:
        raise HTTPException(status_code=404, detail="Workflow not found")

    _assert_company_access(current_admin, existing["companyId"])

    try:
        await delete_workflow(workflowId, current_admin)
        return {"message": "Workflow deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/company/{companyId}", response_model=List[WorkflowResponse])
async def list_company_workflows(
    companyId: str,
    current_user: dict = Depends(get_current_user),
):
    _assert_company_access(current_user, companyId)
    return await list_workflows_by_company(companyId)


@router.get("/item/{workflowId}", response_model=WorkflowResponse)
async def get_workflow_item(
    workflowId: str,
    current_user: dict = Depends(get_current_user),
):
    workflow = await get_workflow_by_id(workflowId)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    _assert_company_access(current_user, workflow["companyId"])
    return workflow


@router.get("/action", response_class=HTMLResponse)
async def workflow_action(token: str):
    try:
        data = decode_token(token)

        submission_id = data["submissionId"]
        user_id = data["userId"]
        action = data["action"]

        db = get_database()
        user = await db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            return HTMLResponse("<h2>Error: User not found</h2>", status_code=404)

        user_dict = {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", "Approver"),
            "role": user["role"],
        }

        if action == "approve":
            await approve_submission(submission_id, user_dict)
            return HTMLResponse(
                "<h2 style='color:green;text-align:center;font-family:Arial;padding-top:50px;'>✅ Approved Successfully</h2>"
            )

        elif action == "reject":
            await reject_submission(submission_id, user_dict)
            return HTMLResponse(
                "<h2 style='color:red;text-align:center;font-family:Arial;padding-top:50px;'>❌ Rejected Successfully</h2>"
            )

    except Exception as e:
        return HTMLResponse(
            f"<h2 style='color:red;text-align:center;font-family:Arial;padding-top:50px;'>⚠️ Error processing action: {str(e)}</h2>",
            status_code=400,
        )


@router.post("/{submissionId}/approve")
async def approve(
    submissionId: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        await approve_submission(submissionId, current_user)
        return {"message": "Approved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{submissionId}/reject")
async def reject(
    submissionId: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        await reject_submission(submissionId, current_user)
        return {"message": "Rejected successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
