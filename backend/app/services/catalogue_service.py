from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..schemas.catalogue import CatalogueFieldCreate, CatalogueFieldUpdate

# Excel catalogue: 13 body + 8 line (Receive / PO Line Item are grid UI, not separate catalogue rows)
ITEM_RECEIPT_BODY_IDS = [
    "trandate",
    "entity",
    "custbody_rg_po_start_date",
    "custbody_rg_po_end_date",
    "custbody_rg_po_number",
    "subsidiary",
    "location",
    "currency",
    "custbody_rg_prm_invoice_num",
    "custbody_rg_prm_total_amount",
    "createdfrom",
    "postingperiod",
    "custbody_podate",
]

ITEM_RECEIPT_LINE_IDS = [
    "item",
    "quantity",
    "rate",
    "amount",
    "location",
    "department",
    "class",
    "description",
]

ITEM_RECEIPT_ALLOWED_IDS = set(ITEM_RECEIPT_BODY_IDS + ITEM_RECEIPT_LINE_IDS)


class CatalogueService:
    @staticmethod
    def _item_receipt_default_fields() -> List[Dict[str, Any]]:
        def f(
            internal_id: str,
            label: str,
            field_type: str,
            section: str = "body",
            sub_section: Optional[str] = None,
            group: str = "Primary Information",
            tab: str = "Main",
            required: bool = False,
            ds: Optional[Dict[str, Any]] = None,
        ) -> Dict[str, Any]:
            row: Dict[str, Any] = {
                "internalId": internal_id,
                "label": label,
                "type": field_type,
                "transactionType": "item_receipt",
                "section": section,
                "subSection": sub_section,
                "group": group,
                "tab": tab,
                "required": required,
                "nlapiSubmitField": False,
                "isSystemField": True,
                "displayOrder": 100,
                "origin": "system",
            }
            if ds:
                row["dataSource"] = ds
            return row

        order = 10

        def next_order() -> int:
            nonlocal order
            order += 10
            return order

        fields: List[Dict[str, Any]] = []

        def add(field: Dict[str, Any]) -> None:
            field["displayOrder"] = next_order()
            fields.append(field)

        add(f("trandate", "Date", "date", required=True))
        add(f("entity", "Vendor", "select", required=True, ds={"type": "netsuite_vendor_live"}))
        add(f("custbody_rg_po_start_date", "PO Start Date", "date"))
        add(f("custbody_rg_po_end_date", "PO End Date", "date"))
        add(f("custbody_rg_po_number", "PO Number", "text"))
        add(f("subsidiary", "Subsidiary", "select", required=True))
        add(f("location", "To Location", "select", required=True, ds={"type": "netsuite_location"}))
        add(f("currency", "Currency", "select", required=True, ds={"type": "netsuite_currency"}))
        add(f("custbody_rg_prm_invoice_num", "PRM Invoice Number", "text"))
        add(f("custbody_rg_prm_total_amount", "PRM Total Amount", "currency"))
        add(f("createdfrom", "Created From", "select", required=True))
        add(f("postingperiod", "Posting Period", "select", required=True))
        add(f("custbody_podate", "PO Date", "text"))

        add(
            f(
                "item",
                "Item",
                "select",
                section="sublist",
                sub_section="item",
                group="Line Items",
                tab="Items",
                required=True,
                ds={"type": "netsuite_item_live"},
            )
        )
        add(
            f(
                "quantity",
                "Quantity",
                "float",
                section="sublist",
                sub_section="item",
                group="Line Items",
                tab="Items",
                required=True,
            )
        )
        add(f("rate", "Rate", "currency", section="sublist", sub_section="item", group="Line Items", tab="Items"))
        add(f("amount", "Amount", "currency", section="sublist", sub_section="item", group="Line Items", tab="Items"))
        add(
            f(
                "location",
                "Location",
                "select",
                section="sublist",
                sub_section="item",
                group="Line Items",
                tab="Items",
                ds={"type": "netsuite_location"},
            )
        )
        add(
            f(
                "department",
                "Department",
                "select",
                section="sublist",
                sub_section="item",
                group="Line Items",
                tab="Items",
                ds={"type": "netsuite_department"},
            )
        )
        add(
            f(
                "class",
                "Class",
                "select",
                section="sublist",
                sub_section="item",
                group="Line Items",
                tab="Items",
                ds={"type": "netsuite_class_live"},
            )
        )
        add(f("description", "Description", "text", section="sublist", sub_section="item", group="Line Items", tab="Items"))

        return fields

    @staticmethod
    def _merge_item_receipt_fields(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Keep only Excel-defined fields, in catalogue order."""
        allowed_rows = [r for r in rows if r.get("internalId") in ITEM_RECEIPT_ALLOWED_IDS]
        by_id = {r["internalId"]: r for r in allowed_rows}
        defaults = {d["internalId"]: d for d in CatalogueService._item_receipt_default_fields()}
        order = ITEM_RECEIPT_BODY_IDS + ITEM_RECEIPT_LINE_IDS
        merged: List[Dict[str, Any]] = []
        for iid in order:
            if iid in by_id:
                merged.append(by_id[iid])
            elif iid in defaults:
                merged.append(defaults[iid])
        return merged

    @staticmethod
    async def get_fields(db: AsyncIOMotorDatabase, trans_type: str) -> List[Dict[str, Any]]:
        cursor = db.field_catalogue.find({"transactionType": trans_type}).sort("displayOrder", 1)
        rows = await cursor.to_list(length=1000)
        if trans_type == "item_receipt":
            return CatalogueService._merge_item_receipt_fields(rows)
        return rows

    @staticmethod
    async def get_grouped_catalogue(db: AsyncIOMotorDatabase, trans_type: str) -> Dict[str, Any]:
        fields = await CatalogueService.get_fields(db, trans_type)
        
        # Structure: Group by Tab -> Group for "body", and Tab -> subSection for "sublist"
        tabs_dict = {}
        
        for field in fields:
            if field.get("_id") is not None:
                field["_id"] = str(field["_id"])
            else:
                field["_id"] = f'{field.get("transactionType", "catalogue")}:{field.get("internalId", "field")}'
            tab_name = field.get("tab", "Main")
            section = field.get("section", "body")
            
            if tab_name not in tabs_dict:
                tabs_dict[tab_name] = {
                    "name": tab_name,
                    "groups": [],
                    "subSections": {}
                }
            
            if section == "body":
                group_name = field.get("group", "Standard Information")
                # Find or create group
                group = next((g for g in tabs_dict[tab_name]["groups"] if g["name"] == group_name), None)
                if not group:
                    group = {"name": group_name, "fields": []}
                    tabs_dict[tab_name]["groups"].append(group)
                group["fields"].append(field)
            
            elif section == "sublist":
                sub_section = field.get("subSection", "item")
                if sub_section not in tabs_dict[tab_name]["subSections"]:
                    tabs_dict[tab_name]["subSections"][sub_section] = []
                tabs_dict[tab_name]["subSections"][sub_section].append(field)

        if trans_type == "item_receipt":
            _item_order = ITEM_RECEIPT_LINE_IDS
        else:
            _item_order = [
                "item", "hsncode", "custcol_hsn_code", "quantity", "rate",
                "taxcode", "amount", "units", "description",
            ]
        for tab in tabs_dict.values():
            items = tab.get("subSections", {}).get("item")
            if items:

                def _rank(f: dict) -> int:
                    iid = (f.get("internalId") or "").lower()
                    try:
                        return _item_order.index(iid)
                    except ValueError:
                        return 999

                tab["subSections"]["item"] = sorted(items, key=_rank)

        # Convert dictionary to ordered list of tabs
        # Preferred order: Main, Items, Shipping, Billing, Tax Details
        preferred_order = ["Main", "Items", "Shipping", "Billing", "Tax Details"]
        
        sorted_tabs = []
        for name in preferred_order:
            if name in tabs_dict:
                sorted_tabs.append(tabs_dict[name])
                del tabs_dict[name]
        
        # Add any remaining tabs
        for tab in tabs_dict.values():
            sorted_tabs.append(tab)

        return {"tabs": sorted_tabs}

    @staticmethod
    async def bulk_import(db: AsyncIOMotorDatabase, fields: List[Dict[str, Any]]):
        if not fields:
            return
        
        # Optional: Add validation or mapping to schema here
        await db.field_catalogue.insert_many(fields)

    @staticmethod
    async def add_field(db: AsyncIOMotorDatabase, field_data: Dict[str, Any]):
        result = await db.field_catalogue.insert_one(field_data)
        return str(result.inserted_id)

    @staticmethod
    async def update_field(db: AsyncIOMotorDatabase, field_id: str, field_data: Dict[str, Any]):
        from bson import ObjectId
        await db.field_catalogue.update_one(
            {"_id": ObjectId(field_id)},
            {"$set": field_data}
        )
