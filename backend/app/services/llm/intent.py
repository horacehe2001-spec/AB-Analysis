from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Intent:
    task: str
    x: str | None = None
    y: str | None = None
    group: str | None = None
    alpha: float = 0.05
    usl: float | None = None
    lsl: float | None = None


_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)


def parse_intent_heuristic(message: str, column_names: list[str]) -> Intent:
    """
    Heuristic intent parser:
    - Supports explicit patterns: X=列名,Y=列名; group=列名,value=列名
    - Supports JSON blob: {"task":"...","x":"...","y":"..."}
    - Supports natural language: "A 和 B", "A vs B", "分析A和B"
    - Otherwise returns unknown task (engine will choose a default).
    """

    msg = message.strip()
    m = _JSON_RE.search(msg)
    if m:
        try:
            data = json.loads(m.group(0))
            return Intent(
                task=str(data.get("task") or "auto"),
                x=data.get("x"),
                y=data.get("y"),
                group=data.get("group"),
                alpha=float(data.get("alpha") or 0.05),
            )
        except Exception:
            pass

    def fuzzy_match(name: str) -> str | None:
        """Fuzzy match column name from column_names."""
        if not name:
            return None
        name = name.strip()
        
        # Exact match
        for c in column_names:
            if c == name:
                return c
        
        # Case-insensitive match
        name_lower = name.lower()
        for c in column_names:
            if c.lower() == name_lower:
                return c
        
        # Partial match: check if name is contained in column name or vice versa
        for c in column_names:
            c_lower = c.lower()
            if name_lower in c_lower or c_lower in name_lower:
                return c
        
        # Split by space and try matching parts
        name_parts = [p.strip() for p in name.split() if p.strip()]
        for c in column_names:
            c_parts = [p.strip() for p in c.split()]
            # If most parts match
            matches = sum(1 for np in name_parts if np in c_parts)
            if matches >= min(len(name_parts), len(c_parts)):
                return c
        
        return None

    x = None
    y = None
    group = None
    
    # X=, Y=
    m = re.search(r"\bX\s*=\s*([^\s,]+(?:\s+[^\s,]+)*)", msg, flags=re.IGNORECASE)
    if m:
        x = fuzzy_match(m.group(1))
    m = re.search(r"\bY\s*=\s*([^\s,]+(?:\s+[^\s,]+)*)", msg, flags=re.IGNORECASE)
    if m:
        y = fuzzy_match(m.group(1))
    m = re.search(r"\bgroup\s*=\s*([^\s,]+(?:\s+[^\s,]+)*)", msg, flags=re.IGNORECASE)
    if m:
        group = fuzzy_match(m.group(1))
    m = re.search(r"\bvalue\s*=\s*([^\s,]+(?:\s+[^\s,]+)*)", msg, flags=re.IGNORECASE)
    if m and not y:
        y = fuzzy_match(m.group(1))

    # Natural language: "A 和 B", "A vs B", "A与B"
    if not x or not y:
        # Match patterns like "A 和 B", "A与B", "A vs B", "A,B"
        patterns = [
            r"([^\s,]+(?:\s+[^\s,]+)*)\s*[和与vs,&]\s*([^\s,]+(?:\s+[^\s,]+)*)",
            r"([^\s,]+(?:\s+[^\s,]+)*)\s*[,，]\s*([^\s,]+(?:\s+[^\s,]+)*)",
        ]
        for pattern in patterns:
            m = re.search(pattern, msg, flags=re.IGNORECASE)
            if m:
                var1 = fuzzy_match(m.group(1))
                var2 = fuzzy_match(m.group(2))
                if var1 and var2:
                    x = var1
                    y = var2
                    break

    task = "auto"
    if "回归" in msg or "影响" in msg or "预测" in msg:
        task = "regression"
    if "差异" in msg or "对比" in msg:
        task = "difference"
    if "相关" in msg:
        task = "correlation"
    if "卡方" in msg or "列联" in msg:
        task = "chi_square"

    return Intent(task=task, x=x, y=y, group=group, alpha=0.05)


def plan_from_intent(intent: Intent) -> dict[str, Any]:
    if intent.task in {"chi_square"}:
        return {"method": "chi_square", "params": {"x": intent.x, "y": intent.y, "alpha": intent.alpha}}
    if intent.task in {"difference"}:
        return {
            "method": "auto_group_diff",
            "params": {"group": intent.group or intent.x, "value": intent.y, "alpha": intent.alpha},
        }
    if intent.task in {"correlation"}:
        return {"method": "spearman", "params": {"x": intent.x, "y": intent.y, "alpha": intent.alpha}}
    if intent.task in {"regression"}:
        return {"method": "linear_regression", "params": {"x": intent.x, "y": intent.y, "alpha": intent.alpha}}
    return {"method": "auto", "params": {"alpha": intent.alpha}}
