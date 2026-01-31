from __future__ import annotations

import json
import re
from typing import Any


_JSON_OBJ_RE = re.compile(r"\{.*\}", re.DOTALL)


def extract_first_json_object(text: str) -> dict[str, Any]:
    """
    Extracts and parses the first JSON object found in text.
    Accepts responses that contain extra prose/code fences.
    """
    raw = text.strip()
    raw = raw.replace("```json", "```").replace("```JSON", "```")
    if raw.startswith("```") and raw.endswith("```"):
        raw = raw.strip("`").strip()
    m = _JSON_OBJ_RE.search(raw)
    if not m:
        raise ValueError("No JSON object found in LLM output")
    obj = m.group(0)
    return json.loads(obj)

