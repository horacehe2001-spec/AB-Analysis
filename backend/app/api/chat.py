from __future__ import annotations

import logging
import math
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.api import ChatRequest, ChatResponse
from app.schemas.llm import IntentOut, PlanOut
from app.services.config_store import get_model_config, get_prompt_templates
from app.services.data_loader import load_dataframe
from app.services.engine.data_summary import build_data_summary
from app.services.llm.client import LLMError, LLMModelConfig, call_llm_json
from app.services.llm.intent import Intent, parse_intent_heuristic
from app.services.llm.json_parse import extract_first_json_object
from app.services.planner import Plan, choose_plan, run_plan
from app.services.sessions import add_message, create_session, get_session_or_404
from app.services.storage.files import save_upload_base64

logger = logging.getLogger(__name__)

router = APIRouter()


def _sanitize_nan(obj: Any) -> Any:
    """Replace NaN/Inf floats with None recursively to ensure JSON compliance."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _sanitize_nan(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize_nan(v) for v in obj]
    return obj


def _ensure_session_data(db: Session, *, session_id: str, file_b64: str | None, industry: str | None) -> tuple[str, dict]:
    s = get_session_or_404(db, session_id)
    if industry and not s.industry:
        s.industry = industry
    if file_b64:
        file_name, file_path = save_upload_base64(session_id, "data.csv", file_b64)
        s.file_name = file_name
        s.file_uri = file_path
        loaded = load_dataframe(file_path)
        summary = build_data_summary(loaded.df)
        s.data_summary = summary
        db.add(s)
        db.commit()
    if not s.file_uri:
        raise HTTPException(status_code=400, detail="请先上传数据文件（/api/v2/upload）或在本次请求携带 file(base64)")
    if not s.data_summary:
        loaded = load_dataframe(s.file_uri)
        s.data_summary = build_data_summary(loaded.df)
        db.add(s)
        db.commit()
    return s.file_uri, s.data_summary


def _fill_missing_params(plan: Plan, df) -> Plan:
    # Best-effort parameter filling when user didn't specify columns
    import pandas as pd

    numeric_cols = [str(c) for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    cat_cols = [str(c) for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]

    # Heuristic: exclude columns that look like IDs/序号 (monotonically increasing integers)
    def _is_id_like(col_name: str) -> bool:
        s = df[col_name]
        if not pd.api.types.is_integer_dtype(s):
            return False
        name_lower = col_name.lower()
        if any(kw in name_lower for kw in ["id", "序号", "编号", "index", "no"]):
            return True
        # Check if monotonically increasing with step 1
        vals = s.dropna().values
        if len(vals) > 2 and all(vals[i] == vals[0] + i for i in range(len(vals))):
            return True
        return False

    # Prefer non-ID numeric columns as value columns
    value_cols = [c for c in numeric_cols if not _is_id_like(c)]
    if not value_cols:
        value_cols = numeric_cols  # fallback

    # For group: also consider low-cardinality numeric columns as potential group columns
    potential_group_cols = list(cat_cols)
    for c in numeric_cols:
        nunique = df[c].nunique()
        if nunique <= 20 and nunique < len(df) * 0.3:
            potential_group_cols.append(c)

    p = dict(plan.params or {})

    def _set(key: str, val):
        """Set param if missing or None."""
        if not p.get(key):
            p[key] = val

    if plan.method in {"linear_regression", "pearson", "spearman"}:
        _set("x", numeric_cols[0] if len(numeric_cols) >= 1 else None)
        _set("y", numeric_cols[1] if len(numeric_cols) >= 2 else None)
    if plan.method in {"t_test", "mann_whitney_u", "anova", "kruskal", "auto_group_diff"}:
        _set("group", potential_group_cols[0] if potential_group_cols else None)
        _set("value", value_cols[0] if value_cols else None)
    if plan.method in {"chi_square"}:
        _set("x", cat_cols[0] if len(cat_cols) >= 1 else None)
        _set("y", cat_cols[1] if len(cat_cols) >= 2 else None)

    return Plan(method=plan.method, params=p)


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    try:
        if req.session_id:
            session_id = req.session_id
            _ = get_session_or_404(db, session_id)
        else:
            session = create_session(db, industry=req.industry)
            session_id = session.session_id

        add_message(db, session_id=session_id, role="user", content=req.message, analysis=None)

        file_uri, data_summary = _ensure_session_data(db, session_id=session_id, file_b64=req.file, industry=req.industry)

        loaded = load_dataframe(file_uri)
        df = loaded.df

        model_cfg_raw = get_model_config(db)
        prompts = get_prompt_templates(db)

        intent = None
        plan = None

        # Check if message is an explicit JSON with task/x/y (from variable picker)
        _explicit_intent = False
        try:
            import json as _json
            msg_obj = _json.loads(req.message)
            if isinstance(msg_obj, dict) and msg_obj.get("task") and (msg_obj.get("x") or msg_obj.get("y")):
                intent = Intent(
                    task=str(msg_obj.get("task", "auto")),
                    x=msg_obj.get("x"),
                    y=msg_obj.get("y"),
                    group=msg_obj.get("group"),
                    alpha=float(msg_obj.get("alpha", 0.05)),
                    usl=float(msg_obj["usl"]) if msg_obj.get("usl") is not None else None,
                    lsl=float(msg_obj["lsl"]) if msg_obj.get("lsl") is not None else None,
                )
                _explicit_intent = True
                logger.info("Explicit intent from JSON message: %s", intent)
        except (ValueError, TypeError):
            pass

        # Optional LLM path: only when api_key is set AND intent was not explicit
        if not _explicit_intent:
            try:
                if model_cfg_raw.get("api_key"):
                    cfg = LLMModelConfig(**model_cfg_raw)
                    system = "你是一个统计分析助手。严格只输出 JSON，不要输出额外文字。"

                    intent_prompt = (
                        f"{prompts.get('intent','')}\n\n"
                        f"用户问题：{req.message}\n"
                        f"数据列名：{data_summary.get('column_names',[])}\n\n"
                        "请输出 JSON：{task,x,y,group,value,alpha}，task 只能是 auto/regression/difference/correlation/chi_square。"
                    )
                    intent_text = call_llm_json(config=cfg, system_prompt=system, user_prompt=intent_prompt)
                    intent_obj = extract_first_json_object(intent_text)
                    intent_out = IntentOut.model_validate(intent_obj)

                    plan_prompt = (
                        f"{prompts.get('planning','')}\n\n"
                        f"intent：{intent_out.model_dump()}\n"
                        f"data_summary：{data_summary}\n\n"
                        "请输出 JSON：{method,params}，method 只能是 "
                        "auto/linear_regression/pearson/spearman/t_test/mann_whitney_u/anova/kruskal/chi_square/auto_group_diff。"
                    )
                    plan_text = call_llm_json(config=cfg, system_prompt=system, user_prompt=plan_prompt)
                    plan_obj = extract_first_json_object(plan_text)
                    plan_out = PlanOut.model_validate(plan_obj)

                    intent = Intent(
                        task=intent_out.task,
                        x=intent_out.x,
                        y=intent_out.y or intent_out.value,
                        group=intent_out.group,
                        alpha=float(intent_out.alpha),
                    )
                    plan = Plan(method=plan_out.method, params=plan_out.params)
            except (LLMError, ValueError, Exception):
                # Fall back to heuristic
                intent = None
                plan = None

        if intent is None:
            intent = parse_intent_heuristic(req.message, data_summary["column_names"])

        if plan is None:
            plan = choose_plan(df, intent)

        plan = _fill_missing_params(plan, df)
        result = run_plan(df, plan)

        s = get_session_or_404(db, session_id)
        used = s.methods_used or []
        if result.method not in used:
            used.append(result.method)
        s.methods_used = used
        db.add(s)
        db.commit()

        analysis = _sanitize_nan({
            "method": result.method,
            "method_name": result.method_name,
            "p_value": result.p_value,
            "effect_size": result.effect_size,
            "significant": result.significant,
            "interpretation": result.interpretation,
            "suggestions": result.suggestions,
            "visualizations": result.visualizations,
        })
        reply = result.interpretation
        add_message(db, session_id=session_id, role="assistant", content=reply, analysis=analysis)

        # Build response as plain dict and force NaN-safe JSON serialization
        # to avoid Pydantic/Starlette rejecting NaN floats from numpy
        import json as _json, re as _re
        resp_data = {
            "session_id": session_id,
            "reply": reply,
            "analysis": analysis,
            "suggestions": result.suggestions,
            "visualizations": _sanitize_nan(result.visualizations),
        }
        raw = _json.dumps(resp_data, ensure_ascii=False, allow_nan=True, default=str)
        raw = _re.sub(r'\bNaN\b', 'null', raw)
        raw = _re.sub(r'\b-?Infinity\b', 'null', raw)
        from fastapi.responses import JSONResponse
        return JSONResponse(content=_json.loads(raw))
    except KeyError:
        raise HTTPException(status_code=404, detail="会话不存在")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("chat_failed")
        # Match frontend interceptor: message or detail
        raise HTTPException(status_code=400, detail=str(e))
