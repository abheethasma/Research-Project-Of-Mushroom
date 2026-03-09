from __future__ import annotations

import os
from groq import Groq # type: ignore


def format_solution_with_groq(
    *,
    language: str,
    title: str,
    current_value: float | None,
    optimal_min: float | None,
    optimal_max: float | None,
    immediate: list[str],
    short_term: list[str],
    long_term: list[str],
    safety: list[str],
) -> str | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    client = Groq(api_key=api_key)

    lang_name = "Sinhala" if language == "si" else "English"

    system_prompt = (
        "You rewrite approved mushroom farm guidance. "
        "Use only the approved actions given to you. "
        "Do not add new actions, chemicals, tools, warnings, or assumptions. "
        "Do not change the meaning. "
        f"Write in simple {lang_name}. "
        "Keep the tone practical and natural for farmers. "
        "Keep it short and clear."
    )

    # system_prompt = (
    #     "You rewrite approved mushroom farm guidance. "
    #     "Use only the approved actions given to you. "
    #     "Do not add new actions, chemicals, tools, warnings, or assumptions. "
    #     "Do not change the meaning. "
    #     f"Write in simple {lang_name}. "
    #     "Keep the tone practical and natural for farmers. "
    #     "If the response language is Sinhala, keep the response mostly in Sinhala and avoid unnecessary English words. "
    #     "Only keep technical words in English when there is no simple natural Sinhala alternative. "
    #     "Keep it short and clear."
    # )

    user_prompt = f"""
Problem title: {title}
Current value: {current_value}
Optimal min: {optimal_min}
Optimal max: {optimal_max}

Immediate actions:
- {"; ".join(immediate) if immediate else "None"}

Short-term actions:
- {"; ".join(short_term) if short_term else "None"}

Long-term actions:
- {"; ".join(long_term) if long_term else "None"}

Safety:
- {"; ".join(safety) if safety else "None"}

Format:
1. One short problem summary
2. Immediate actions
3. One short-term action
4. One long-term action
5. One safety note

Important:
Use only the actions provided above.
Do not invent any new recommendation.
"""

    try:
        response = client.chat.completions.create(
            model=model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        text = response.choices[0].message.content
        if text:
            return text.strip()
        return None

    except Exception:
        return None