"""
tools/crm.py — thin wrapper around Airtable's REST API for GrowMart's
mock CRM (the "Leads" table). Used by the Sales Agent to create and
update leads.

API docs: https://airtable.com/developers/web/api/introduction

Requires:
    pip install requests python-dotenv

.env must contain:
    AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
    AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
    AIRTABLE_TABLE_NAME=Leads
"""

import os
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_NAME = os.getenv("AIRTABLE_TABLE_NAME", "Leads")

BASE_URL = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_NAME}"

HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_API_KEY}",
    "Content-Type": "application/json",
}


def _check_config():
    if not AIRTABLE_API_KEY or not AIRTABLE_BASE_ID:
        raise EnvironmentError(
            "Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in environment. "
            "Check your .env file."
        )


def create_lead(
    Name: str,
    Email: str,
    Product_Interest: str,
    Budget_Range: str,
    Use_Case_Notes: str = "",
    Stage: str = "New",
) -> dict:
    """
    Create a new lead record in Airtable.

    Args:
        name: Customer's name.
        email: Customer's email.
        product_interest: Product they're interested in (e.g. "MagCharge 15W Wireless Charger").
        budget_range: One of "Under ₹1000", "₹1000–2000", "₹2000+".
        use_case_notes: Free-text notes from the conversation.
        stage: One of "New", "Contacted", "Qualified". Defaults to "New".

    Returns:
        dict with the created record's Airtable `id` and `fields`, or an
        `error` key if the request failed.
    """
    _check_config()

    payload = {
        "fields": {
            "Name": Name,
            "Email": Email,
            "Product_Interest": Product_Interest,
            "Budget_Range": Budget_Range,
            "Use_Case_Notes": Use_Case_Notes,
            "Stage": Stage,
            "Created_At": datetime.now(timezone.utc).isoformat(),
        }
    }

    response = requests.post(BASE_URL, headers=HEADERS, json=payload, timeout=10)

    if response.status_code not in (200, 201):
        return {"error": response.status_code, "detail": response.text}

    data = response.json()
    return {"id": data["id"], "fields": data["fields"]}


def get_lead(record_id: str) -> dict:
    """
    Fetch a single lead by its Airtable record ID.

    Args:
        record_id: Airtable record ID (e.g. "recXXXXXXXXXXXXXX").

    Returns:
        dict with `id` and `fields`, or an `error` key if not found/failed.
    """
    _check_config()

    url = f"{BASE_URL}/{record_id}"
    response = requests.get(url, headers=HEADERS, timeout=10)

    if response.status_code != 200:
        return {"error": response.status_code, "detail": response.text}

    data = response.json()
    return {"id": data["id"], "fields": data["fields"]}


def find_lead_by_email(email: str) -> dict | None:
    """
    Look up an existing lead by email, useful before creating a duplicate
    for a returning customer. Returns the first match or None.
    """
    _check_config()

    params = {"filterByFormula": f"{{email}} = '{email}'", "maxRecords": 1}
    response = requests.get(BASE_URL, headers=HEADERS, params=params, timeout=10)

    if response.status_code != 200:
        return None

    records = response.json().get("records", [])
    if not records:
        return None

    record = records[0]
    return {"id": record["id"], "fields": record["fields"]}


def update_lead_stage(record_id: str, stage: str) -> dict:
    """
    Update a lead's pipeline stage.

    Args:
        record_id: Airtable record ID (e.g. "recXXXXXXXXXXXXXX").
        stage: One of "New", "Contacted", "Qualified".

    Returns:
        dict with the updated record's `id` and `fields`, or an `error` key.
    """
    _check_config()

    valid_stages = {"New", "Contacted", "Qualified"}
    if stage not in valid_stages:
        return {"error": "invalid_stage", "detail": f"stage must be one of {valid_stages}"}

    url = f"{BASE_URL}/{record_id}"
    payload = {"fields": {"stage": stage}}

    response = requests.patch(url, headers=HEADERS, json=payload, timeout=10)

    if response.status_code != 200:
        return {"error": response.status_code, "detail": response.text}

    data = response.json()
    return {"id": data["id"], "fields": data["fields"]}


if __name__ == "__main__":
    # Quick manual smoke test — run with: python -m backend.tools.crm
    test_lead = create_lead(
        Name="Test Lead",
        Email="test.lead@example.com",
        Product_Interest="SmartPlug Duo Pack",
        Budget_Range="₹1000–2000",
        Use_Case_Notes="Created via smoke test.",
    )
    print("Created:", test_lead)

    if "id" in test_lead:
        fetched = get_lead(test_lead["id"])
        print("Fetched:", fetched)

        updated = update_lead_stage(test_lead["id"], "Contacted")
        print("Updated:", updated)