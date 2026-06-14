"""Shared helpers for the model layer."""

import re
from datetime import date, datetime, timezone

ISIKUKOOD_RE = re.compile(r"^\d{11}$")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def compute_age(ddn: date | None) -> int | None:
    if ddn is None:
        return None
    today = date.today()
    return today.year - ddn.year - ((today.month, today.day) < (ddn.month, ddn.day))
