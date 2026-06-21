from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Approver(BaseModel):
    userId: str
    name: str
    email: str
    role: str


class WorkflowLevel(BaseModel):
    level: int
    approvers: List[Approver]


class CreateWorkflowRequest(BaseModel):
    companyId: str
    name: str
    formIds: List[str] = Field(..., min_length=1)
    levels: List[WorkflowLevel]


class UpdateWorkflowRequest(BaseModel):
    name: str
    formIds: List[str] = Field(..., min_length=1)
    levels: List[WorkflowLevel]


class WorkflowResponse(BaseModel):
    id: str
    companyId: str
    name: str
    formIds: List[str] = []
    levels: List[WorkflowLevel]
    createdBy: str
    createdAt: datetime
    updatedAt: datetime
