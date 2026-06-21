from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
from bson import ObjectId
from datetime import datetime
from ..schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from ..database import get_database
from ..utils.deps import get_super_admin, get_client_admin
from ..services.activity import log_activity
from ..services.company_service import delete_company_and_related_data
from ..services.company_logo import save_company_logo, delete_company_logo_files

router = APIRouter(prefix="/companies", tags=["Companies"])

def _serialize_company(company: dict) -> dict:
    out = dict(company)
    out["id"] = str(out.pop("_id"))
    return out


def _assert_company_logo_access(current_user: dict, company_id: str) -> None:
    if current_user["role"] == "super_admin":
        return
    if current_user["role"] == "client_admin":
        if current_user.get("companyId") != company_id:
            raise HTTPException(
                status_code=403,
                detail="You can only manage your own company logo",
            )
        return
    raise HTTPException(status_code=403, detail="Requires Super Admin or Client Admin role")

@router.post("", response_model=CompanyOut)
async def create_company(
    company: CompanyCreate, 
    current_admin: dict = Depends(get_super_admin)
):
    db = get_database()
    new_company = {
        "name": company.name,
        "createdAt": datetime.utcnow(),
        "createdBy": current_admin["email"]
    }
    result = await db.companies.insert_one(new_company)
    new_company["id"] = str(result.inserted_id)
    
    await log_activity(
        str(current_admin["_id"]), 
        "CREATE_COMPANY", 
        role=current_admin["role"],
        entity_id=new_company["id"], 
        entity_type="COMPANY"
    )
    
    return new_company

@router.get("", response_model=List[CompanyOut])
async def list_companies(current_user: dict = Depends(get_client_admin)):
    db = get_database()
    companies = []
    
    query = {}
    if current_user["role"] == "client_admin":
        if not current_user.get("companyId"):
            return []
        query = {"_id": ObjectId(current_user["companyId"])}
        
    async for company in db.companies.find(query):
        companies.append(_serialize_company(company))
    return companies

@router.get("/{id}", response_model=CompanyOut)
async def get_company(id: str, current_admin: dict = Depends(get_super_admin)):
    db = get_database()
    company = await db.companies.find_one({"_id": ObjectId(id)})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return _serialize_company(company)

@router.put("/{id}", response_model=CompanyOut)
async def update_company(
    id: str, 
    company_update: CompanyUpdate, 
    current_admin: dict = Depends(get_super_admin)
):
    db = get_database()
    update_data = {k: v for k, v in company_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
        
    result = await db.companies.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
        
    updated_company = await db.companies.find_one({"_id": ObjectId(id)})
    
    await log_activity(
        str(current_admin["_id"]), 
        "UPDATE_COMPANY", 
        role=current_admin["role"],
        entity_id=id, 
        entity_type="COMPANY"
    )
    
    return _serialize_company(updated_company)

@router.post("/{id}/logo", response_model=CompanyOut)
async def upload_company_logo(
    id: str,
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_client_admin),
):
    _assert_company_logo_access(current_admin, id)
    db = get_database()
    company = await db.companies.find_one({"_id": ObjectId(id)})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    logo_url = await save_company_logo(id, file)
    await db.companies.update_one({"_id": ObjectId(id)}, {"$set": {"logoUrl": logo_url}})

    await log_activity(
        str(current_admin["_id"]),
        "UPDATE_COMPANY_LOGO",
        role=current_admin["role"],
        entity_id=id,
        entity_type="COMPANY",
    )

    updated = await db.companies.find_one({"_id": ObjectId(id)})
    return _serialize_company(updated)

@router.delete("/{id}/logo", response_model=CompanyOut)
async def remove_company_logo(
    id: str,
    current_admin: dict = Depends(get_client_admin),
):
    _assert_company_logo_access(current_admin, id)
    db = get_database()
    company = await db.companies.find_one({"_id": ObjectId(id)})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    delete_company_logo_files(id)
    await db.companies.update_one({"_id": ObjectId(id)}, {"$unset": {"logoUrl": ""}})

    updated = await db.companies.find_one({"_id": ObjectId(id)})
    return _serialize_company(updated)

@router.delete("/{id}")
async def delete_company(id: str, current_admin: dict = Depends(get_super_admin)):
    delete_company_logo_files(id)
    result = await delete_company_and_related_data(id)

    await log_activity(
        str(current_admin["_id"]),
        "DELETE_COMPANY",
        role=current_admin["role"],
        entity_id=id,
        entity_type="COMPANY",
        metadata={"cascade": result.get("deleted", {})},
    )

    return result
