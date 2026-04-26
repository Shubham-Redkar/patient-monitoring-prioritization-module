import os
from collections import OrderedDict
from groq import Groq
from core.config import get_settings


def _get_client() -> Groq:
    return Groq(api_key=get_settings().groq_api_key)


_CACHE_MAX = 256
_explanation_cache: OrderedDict[tuple, str] = OrderedDict()


def _signal_fingerprint(signals: dict) -> str:
    """Stable string that changes only when clinically meaningful signals change."""
    lab = sorted(signals.get("lab", []))
    vitals = sorted(signals.get("vitals", []))
    return "|".join(lab + vitals)


def _cache_get(key: tuple) -> str | None:
    if key not in _explanation_cache:
        return None
    _explanation_cache.move_to_end(key)
    return _explanation_cache[key]


def _cache_set(key: tuple, value: str) -> None:
    if key in _explanation_cache:
        _explanation_cache.move_to_end(key)
    _explanation_cache[key] = value
    if len(_explanation_cache) > _CACHE_MAX:
        _explanation_cache.popitem(last=False)


def generate_explanation(signals, patient_id=None, priority=None):
    cache_key = None
    if patient_id is not None and priority is not None:
        cache_key = (patient_id, priority, _signal_fingerprint(signals))
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

    lab = signals.get("lab_llm") or signals.get("lab", [])
    vitals = signals.get("vitals_llm") or signals.get("vitals", [])
    priority_label = signals.get("priority", priority or "Unknown")

    lab_text = (
        "\n".join(f"  - {s}" for s in lab) if lab else "  - No lab data available"
    )
    vital_text = (
        "\n".join(f"  - {s}" for s in vitals)
        if vitals
        else "  - No vital sign data available"
    )

    prompt = f"""You are reviewing a patient flagged as {priority_label} priority for sepsis risk.

The following are the most clinically significant findings from their recent lab results and vital signs:

Lab Results:
{lab_text}

Vital Signs:
{vital_text}

Write exactly 2 sentences for the treating clinician:
1. What these specific values indicate about this patient's current condition.
2. What warrants close attention or follow-up.

Use plain clinical language. Reference actual values. Do not mention algorithms, models, scores, or statistical methods. Maximum 80 words. Always complete both sentences fully."""

    try:
        s = get_settings()
        response = _get_client().chat.completions.create(
            model=s.groq_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a clinical decision support tool writing for attending physicians and nurses. "
                        "Be direct and clinically precise. Never mention AI, machine learning, SHAP, models, "
                        "predictions, or algorithms. Focus only on the patient's physiological status."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.1,
            max_tokens=200,
        )
        content = response.choices[0].message.content
        result = content.strip() if content is not None else ""

        if cache_key is not None:
            _cache_set(cache_key, result)

        return result

    except Exception as e:
        raise RuntimeError(f"Groq explanation failed: {str(e)}")
