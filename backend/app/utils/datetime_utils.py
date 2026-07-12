from datetime import datetime, timezone


def to_utc_iso(value):
    """Serialize datetimes consistently while leaving strings and None intact."""
    if not isinstance(value, datetime):
        return value
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()
