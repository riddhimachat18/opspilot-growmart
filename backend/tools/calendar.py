"""
backend/tools/calendar.py — Google Calendar API wrapper for the Scheduling Agent.

On Render / cloud: set GOOGLE_SERVICE_ACCOUNT_JSON to the full JSON key contents.
Locally:          set GOOGLE_SERVICE_ACCOUNT_FILE to the absolute path of the key file.
"""

import os
import json
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/calendar"]
BUSINESS_HOUR_START   = 10
BUSINESS_HOUR_END     = 18
SLOT_DURATION_MINUTES = 30


def _get_calendar_service():
    load_dotenv(override=False)

    # Cloud deployment: full JSON contents as env var
    sa_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        try:
            info = json.loads(sa_json)
            credentials = service_account.Credentials.from_service_account_info(
                info, scopes=SCOPES
            )
        except Exception as e:
            raise EnvironmentError(f"GOOGLE_SERVICE_ACCOUNT_JSON could not be parsed: {e}")
    else:
        # Local dev: file path
        sa_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
        if not sa_file or not os.path.exists(sa_file):
            raise EnvironmentError(
                "Set GOOGLE_SERVICE_ACCOUNT_JSON (cloud) or "
                "GOOGLE_SERVICE_ACCOUNT_FILE (local) in your environment."
            )
        credentials = service_account.Credentials.from_service_account_file(
            sa_file, scopes=SCOPES
        )

    calendar_id = os.getenv("GOOGLE_CALENDAR_ID", "primary")
    service = build("calendar", "v3", credentials=credentials)
    return service, calendar_id

    return build("calendar", "v3", credentials=credentials), calendar_id


def get_available_slots(days_ahead: int = 3, max_slots: int = 3) -> list[dict]:
    """
    Return up to `max_slots` open 30-minute slots within business hours over
    the next `days_ahead` days, by checking existing events via freebusy.

    Returns:
        list of {"start": iso_string, "end": iso_string, "label": "Mon, Jul 14, 10:00 AM"}
    """
    service, calendar_id = _get_calendar_service()

    now = datetime.now(timezone.utc)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=days_ahead)).isoformat()

    freebusy_query = {
        "timeMin": time_min,
        "timeMax": time_max,
        "items": [{"id": calendar_id}],
    }
    freebusy_result = service.freebusy().query(body=freebusy_query).execute()
    busy_periods = freebusy_result["calendars"][calendar_id]["busy"]

    busy_ranges = [
        (datetime.fromisoformat(b["start"]), datetime.fromisoformat(b["end"]))
        for b in busy_periods
    ]

    available_slots = []
    day_cursor = now.replace(hour=BUSINESS_HOUR_START, minute=0, second=0, microsecond=0)
    if day_cursor < now:
        day_cursor += timedelta(days=1)
        day_cursor = day_cursor.replace(hour=BUSINESS_HOUR_START, minute=0)

    for _ in range(days_ahead):
        slot_time = day_cursor
        end_of_day = day_cursor.replace(hour=BUSINESS_HOUR_END, minute=0)

        while slot_time < end_of_day and len(available_slots) < max_slots:
            slot_end = slot_time + timedelta(minutes=SLOT_DURATION_MINUTES)

            overlaps = any(slot_time < b_end and slot_end > b_start for b_start, b_end in busy_ranges)
            if not overlaps and slot_time > now:
                available_slots.append({
                    "start": slot_time.isoformat(),
                    "end": slot_end.isoformat(),
                    "label": slot_time.strftime("%a, %b %d, %I:%M %p"),
                })

            slot_time += timedelta(minutes=SLOT_DURATION_MINUTES)

        day_cursor += timedelta(days=1)
        day_cursor = day_cursor.replace(hour=BUSINESS_HOUR_START, minute=0)

        if len(available_slots) >= max_slots:
            break

    return available_slots


def book_slot(start_iso: str, end_iso: str, customer_name: str, customer_email: str, reason: str = "") -> dict:
    """
    Book a callback event on the shared demo calendar.

    Args:
        start_iso: ISO datetime string for the slot start (from get_available_slots).
        end_iso: ISO datetime string for the slot end.
        customer_name: Name of the customer to include in the event title.
        customer_email: Customer email, added as an event attendee.
        reason: Brief reason for the callback (e.g. "Refund escalation - Order GM-10240").

    Returns:
        dict with the created event's id and htmlLink, or an {"error": ...} dict.
    """
    try:
        service, calendar_id = _get_calendar_service()

        event = {
            "summary": f"GrowMart Callback — {customer_name}",
            "description": reason or "Scheduled via OpsPilot Scheduling Agent",
            "start": {"dateTime": start_iso},
            "end": {"dateTime": end_iso},
            "attendees": [{"email": customer_email}] if customer_email else [],
        }

        created_event = service.events().insert(
            calendarId=calendar_id, body=event, sendUpdates="none"
        ).execute()

        return {
            "event_id": created_event["id"],
            "html_link": created_event.get("htmlLink"),
            "start": start_iso,
            "status": "confirmed",
        }
    except Exception as e:
        return {"error": "booking_failed", "detail": str(e)}


if __name__ == "__main__":
    # Smoke test — run with: python -m backend.tools.calendar
    slots = get_available_slots()
    print("Available slots:", slots)

    if slots:
        result = book_slot(
            start_iso=slots[0]["start"],
            end_iso=slots[0]["end"],
            customer_name="Test Customer",
            customer_email="test@example.com",
            reason="Smoke test booking",
        )
        print("Booking result:", result)