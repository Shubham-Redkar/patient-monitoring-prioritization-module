def determine_alert(priority, previous_priority=None):

    if priority == "Critical":
        return {
            "alert": True,
            "level": "CRITICAL",
            "message": "Immediate attention required",
        }

    if priority == "High" and previous_priority != "High":
        return {
            "alert": True,
            "level": "HIGH",
            "message": "Patient showing elevated risk",
        }

    return {"alert": False, "level": None, "message": None}
