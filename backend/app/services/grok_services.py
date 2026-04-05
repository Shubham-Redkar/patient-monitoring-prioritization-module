import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_explanation(signals):
    # Use LLM-specific signals (no ML jargon) when available, fall back to UI signals
    lab = signals.get("lab_llm") or signals.get("lab", [])
    vitals = signals.get("vitals_llm") or signals.get("vitals", [])
    priority = signals.get("priority", "Unknown")

    lab_text = (
        "\n".join(f"  - {s}" for s in lab) if lab else "  - No lab data available"
    )
    vital_text = (
        "\n".join(f"  - {s}" for s in vitals)
        if vitals
        else "  - No vital sign data available"
    )

    prompt = f"""You are reviewing a patient flagged as {priority} priority for sepsis risk.

The following are the most clinically significant findings from their recent lab results and vital signs:

Lab Results:
{lab_text}

Vital Signs:
{vital_text}

Write 2 short sentences for the treating clinician:
1. What these specific values indicate about this patient's current condition.
2. What warrants close attention or follow-up.

Use plain clinical language. Reference actual values. Do not mention algorithms, models, scores, or statistical methods. Maximum 60 words."""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
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
            max_tokens=130,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        raise RuntimeError(f"Groq explanation failed: {str(e)}")
