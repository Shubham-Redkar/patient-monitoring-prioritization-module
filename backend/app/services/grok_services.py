import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_explanation(signals):

    lab = signals.get("lab", [])
    vitals = signals.get("vitals", [])
    priority = signals.get("priority", "Unknown")

    lab_text = "\n".join(f"  - {s}" for s in lab) if lab else "  - None"
    vital_text = "\n".join(f"  - {s}" for s in vitals) if vitals else "  - None"

    prompt = f"""
A patient monitoring system has raised a {priority} sepsis alert based on the following clinical data:

Lab Results:
{lab_text}

Vital Signs:
{vital_text}

In 1-2 sentences, explain what these specific values indicate clinically and why they triggered a {priority} alert.
Be specific — reference the actual values provided. Maximum 60 words.
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a clinical decision support assistant. Always respond with 1-2 medically accurate sentences referencing the specific values provided.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.2,
            max_tokens=120,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        raise RuntimeError(f"Groq explanation failed: {str(e)}")
