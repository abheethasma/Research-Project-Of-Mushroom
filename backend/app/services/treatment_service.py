# backend/app/services/treatment_service.py

import os
from functools import lru_cache

from groq import Groq


@lru_cache(maxsize=1)
def _get_groq_client() -> Groq:
    """
    Lazily create and cache the Groq client.
    It reads the API key from the GROQ_API_KEY environment variable.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY environment variable is not set.")
    return Groq(api_key=api_key)


def generate_treatment_recommendation(label: str, severity: str) -> str:
    """
    Use Groq LLM to generate a short treatment recommendation
    for the detected mushroom disease.

    label:   "healthy", "black_mold", "green_mold", "invalid_image", ...
    severity: "none", "mild", "moderate", "severe"
    """

    # Simple fixed messages for non-disease cases
    if label == "healthy":
        return (
            "No visible disease detected. Maintain good hygiene, monitor the bags "
            "daily, and keep temperature and humidity within the recommended range "
            "for oyster mushroom cultivation."
        )

    if label == "invalid_image":
        return (
            "The image is not clear enough for diagnosis. Please capture a close, "
            "well-lit image of a single mushroom cultivation bag showing the "
            "mycelium surface and any discolored patches."
        )

    client = _get_groq_client()

    # Convert internal label to more descriptive disease name
    disease_name_map = {
        "black_mold": "black mold contamination (Trichoderma-like)",
        "green_mold": "green mold contamination (Penicillium/Trichoderma-like)",
    }
    disease_name = disease_name_map.get(label, label)

    # Build the prompt for Groq LLM
    user_prompt = f"""
Detected disease: {disease_name}
Severity level: {severity}

The farmer is cultivating oyster mushrooms in polythene bags in an indoor grow room
in South Asian conditions.

Write a short, practical treatment recommendation:
1. Briefly explain what this contamination means for the mushroom bags.
2. Give clear Immediate Actions (what to do now / today).
3. Give Prevention Steps (what to do in the next days/weeks).
4. Use simple language. Focus on hygiene, bag handling, ventilation, humidity
   control and safe, commonly available actions. Avoid complicated chemical names.

Keep the answer under 200–250 words.
Use short paragraphs and bullet points where helpful.
""".strip()

    try:
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Groq model ID
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert assistant for oyster mushroom cultivation.",
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

        content = chat_completion.choices[0].message.content
        return content or (
            "Treatment recommendation is unavailable at the moment. Isolate visibly "
            "contaminated bags, avoid opening them near healthy bags, and maintain "
            "strict hygiene and proper ventilation in the grow room."
        )

    except Exception:
        # Fallback if Groq API call fails for any reason
        return (
            "Unable to load detailed AI recommendation right now. As a general guide, "
            "isolate heavily contaminated bags, avoid opening them indoors, improve "
            "air circulation, control humidity, and keep the growing area clean to "
            "prevent further spread."
        )