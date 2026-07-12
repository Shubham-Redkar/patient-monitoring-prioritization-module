from collections import OrderedDict
import logging

from groq import Groq

from core.config import get_settings


logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "You are a clinical decision support tool writing for attending physicians "
    "and nurses. Be direct and clinically precise. Never mention AI, machine "
    "learning, SHAP, models, predictions, or algorithms. Focus only on the "
    "patient's physiological status."
)


class ExplanationService:
    def __init__(self, cache_size: int = 256):
        self.cache_size = cache_size
        self.cache = OrderedDict()

    @staticmethod
    def _fingerprint(signals: dict) -> str:
        values = sorted(signals.get("lab", [])) + sorted(signals.get("vitals", []))
        return "|".join(values)

    @staticmethod
    def _format_findings(values: list[str], empty_message: str) -> str:
        return "\n".join(f"  - {value}" for value in values) if values else empty_message

    def _build_prompt(self, signals: dict, priority: str) -> str:
        lab = signals.get("lab_llm") or signals.get("lab", [])
        vitals = signals.get("vitals_llm") or signals.get("vitals", [])
        lab_text = self._format_findings(lab, "  - No lab data available")
        vital_text = self._format_findings(vitals, "  - No vital sign data available")
        return f"""You are reviewing a patient flagged as {priority} priority for sepsis risk.

The following are the most clinically significant findings from their recent lab results and vital signs:

Lab Results:
{lab_text}

Vital Signs:
{vital_text}

Write exactly 2 sentences for the treating clinician:
1. What these specific values indicate about this patient's current condition.
2. What warrants close attention or follow-up.

Use plain clinical language. Reference actual values. Do not mention algorithms, models, scores, or statistical methods. Maximum 80 words. Always complete both sentences fully."""

    @staticmethod
    def _structured_rationale(signals: dict, priority: str) -> str:
        lab = signals.get("lab_llm") or signals.get("lab", [])
        vitals = signals.get("vitals_llm") or signals.get("vitals", [])
        findings = [*lab[:2], *vitals[:2]]
        if not findings:
            return ""
        return (
            f"The {priority.lower()} priority assessment is primarily supported by "
            f"{'; '.join(findings)}. Review these findings with the full clinical "
            "picture and local escalation protocol."
        )

    def _get_cached(self, key):
        value = self.cache.get(key)
        if value is not None:
            self.cache.move_to_end(key)
        return value

    def _store(self, key, value):
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.cache_size:
            self.cache.popitem(last=False)

    def generate(self, signals: dict, patient_id: int, priority: str) -> str:
        key = (patient_id, priority, self._fingerprint(signals))
        cached = self._get_cached(key)
        if cached is not None:
            return cached

        settings = get_settings()
        if not settings.groq_api_key:
            result = self._structured_rationale(signals, priority)
            self._store(key, result)
            return result
        try:
            response = Groq(api_key=settings.groq_api_key).chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": self._build_prompt(signals, priority)},
                ],
                temperature=0.1,
                max_tokens=200,
            )
            result = (response.choices[0].message.content or "").strip()
        except Exception as error:
            logger.warning(
                "Generated clinical explanation failed; using fallback: %s",
                error,
            )
            result = self._structured_rationale(signals, priority)

        self._store(key, result)
        return result
