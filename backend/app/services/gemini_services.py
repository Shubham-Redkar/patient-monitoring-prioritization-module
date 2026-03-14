import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client()


def generate_explanation(signals):

    prompt = f"""
Explain why a patient monitoring system raised a priority alert.

Signals detected:
Lab indicators: {signals.get('lab', 'None')}
Vital sign anomalies: {signals.get('vitals', 'None')}
Priority level: {signals.get('priority', 'Unknown')}

Provide a concise, 1-sentence medical explanation for the alert. Maximum 50 words.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="You are a clinical decision support assistant. Always respond with a single medically accurate sentence.",
                temperature=0.2,
                max_output_tokens=100,
            ),
        )
        return response.text

    except Exception as e:
        raise RuntimeError(f"Gemini explanation failed: {str(e)}")
