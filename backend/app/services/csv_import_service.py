import io

import pandas as pd
from pydantic import ValidationError

from schemas.lab_schema import LabInput
from schemas.vital_schema import VitalInput


REQUIRED_COLUMNS = {
    "patient_id", "hour_from_admission", "heart_rate", "respiratory_rate",
    "spo2_pct", "temperature_c", "systolic_bp", "diastolic_bp", "wbc_count",
    "lactate", "creatinine", "crp_level", "hemoglobin",
}


class CsvImportError(Exception):
    def __init__(self, detail):
        self.detail = detail


def _validation_messages(error: ValidationError) -> list[str]:
    return [
        f"{item['loc'][-1] if item['loc'] else 'unknown'}: {item['msg']}"
        for item in error.errors()
    ]


def parse_patient_csv(contents: bytes) -> list[dict]:
    try:
        frame = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except (UnicodeDecodeError, pd.errors.ParserError, pd.errors.EmptyDataError):
        raise CsvImportError("Could not parse file as CSV.")

    if frame.empty:
        raise CsvImportError("CSV file is empty.")
    missing = REQUIRED_COLUMNS - set(frame.columns)
    if missing:
        raise CsvImportError(
            f"Missing required columns: {', '.join(sorted(missing))}"
        )

    readings, row_errors = [], []
    for index, row in frame.iterrows():
        errors = []
        try:
            vital = VitalInput.model_validate(row.to_dict())
        except ValidationError as error:
            vital = None
            errors.extend(_validation_messages(error))
        try:
            lab = LabInput.model_validate(row.to_dict())
        except ValidationError as error:
            lab = None
            errors.extend(_validation_messages(error))
        if errors:
            row_errors.append(
                {"row": index + 2, "errors": errors}
            )
            continue

        vital_data = vital.model_dump(exclude={"patient_id", "hour_from_admission"})
        lab_data = lab.model_dump(exclude={"patient_id", "hour_from_admission"})
        readings.append(
            {
                "patient_id": vital.patient_id,
                "hour_from_admission": vital.hour_from_admission,
                "vitals": vital_data,
                "labs": lab_data,
            }
        )

    if row_errors:
        raise CsvImportError(
            {
                "message": (
                    f"{len(row_errors)} row(s) failed validation. "
                    "No data was inserted."
                ),
                "errors": row_errors,
            }
        )
    return readings
