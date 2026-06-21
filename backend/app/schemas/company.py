from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):
    name: str

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None

class CompanyOut(CompanyBase):
    id: str
    createdAt: datetime
    createdBy: Optional[str] = None
    logoUrl: Optional[str] = None

    class Config:
        from_attributes = True
