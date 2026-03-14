import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    model_name="gemini-3-flash-preview",
    system_instruction="You are a clinical decision support assistant.",
)


def generate_explanation(signals):

    prompt = f"""
Explain why a patient monitoring system raised a priority alert.

Signals detected:
Lab indicators: {signals.get('lab', 'None provided')}
Vital sign anomalies: {signals.get('vitals', 'None provided')}
Priority level: {signals.get('priority', 'Unknown')}

Explain the reasoning in clear medical language in 2-3 sentences.
"""

    try:
        response = model.generate_content(prompt)

        if response.prompt_feedback and response.prompt_feedback.block_reason:
            return f"Error: Prompt blocked due to safety settings. Reason: {response.prompt_feedback.block_reason}"

        return response.text

    except Exception as e:
        return f"An error occurred while generating the explanation: {str(e)}"
