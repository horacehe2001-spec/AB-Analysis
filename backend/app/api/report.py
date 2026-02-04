from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.config_store import get_model_config
from app.services.llm.client import LLMError, LLMModelConfig, call_llm_json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/report")

_EFFECT_LEVEL_CN = {"small": "小", "medium": "中等", "large": "大"}
_EFFECT_TYPE_CN = {
    "cohens_d": "Cohen's d",
    "r_squared": "R²",
    "eta_squared": "η²",
    "cramers_v": "Cramér's V",
}


class AnalysisItem(BaseModel):
    x_variable: str | None = None
    y_variable: str | None = None
    method: str = ""
    method_name: str = ""
    p_value: float | None = None
    significant: bool = False
    effect_size: dict[str, Any] = Field(default_factory=dict)
    interpretation: str = ""
    suggestions: list[str] = Field(default_factory=list)


class ConclusionRequest(BaseModel):
    session_id: str | None = None
    analyses: list[AnalysisItem]
    data_summary: dict[str, Any] | None = None


class ConclusionResponse(BaseModel):
    conclusion: str


@router.post("/conclusion", response_model=ConclusionResponse)
def generate_conclusion(req: ConclusionRequest, db: Session = Depends(get_db)) -> ConclusionResponse:
    llm_config = get_model_config(db)
    if not llm_config.get("api_key"):
        raise HTTPException(status_code=400, detail="未配置大语言模型，请先在设置中配置模型 API Key")

    # Build analysis summaries
    analysis_summaries = []
    for i, a in enumerate(req.analyses, 1):
        es = a.effect_size
        var_info = ""
        if a.x_variable and a.y_variable:
            var_info = f"自变量={a.x_variable}, 因变量={a.y_variable}, "

        summary = (
            f"分析{i}: {var_info}"
            f"方法={a.method_name}, "
            f"p值={a.p_value}, "
            f"显著={'是' if a.significant else '否'}, "
            f"效应量类型={_EFFECT_TYPE_CN.get(es.get('type', ''), es.get('type', ''))}, "
            f"效应量值={es.get('value')}, "
            f"效应量水平={_EFFECT_LEVEL_CN.get(es.get('level', ''), es.get('level', ''))}, "
            f"初步解读={a.interpretation}"
        )
        analysis_summaries.append(summary)

    data_info = ""
    if req.data_summary:
        ds = req.data_summary
        data_info = (
            f"数据概况：{ds.get('rows')}行 × {ds.get('columns')}列，"
            f"字段：{', '.join(ds.get('column_names', []))}"
        )

    system_prompt = (
        "你是一位资深的统计分析师和数据科学家。请根据提供的假设检验分析结果，"
        "撰写一份专业、通俗易懂的分析报告结论。\n"
        "要求：\n"
        "1. 用自然语言总结每个分析的核心发现\n"
        "2. 解释统计结果的实际业务含义\n"
        "3. 给出可操作的建议\n"
        "4. 如有多组分析，进行综合对比总结\n"
        "5. 语言专业但易懂，适合非统计专业人员阅读\n"
        "6. 使用 Markdown 格式组织内容（标题、列表、加粗等）\n"
        "7. 直接输出结论文本，不要输出 JSON"
    )

    user_prompt = (
        f"{data_info}\n\n"
        f"以下是假设检验分析结果：\n"
        + "\n".join(analysis_summaries)
        + "\n\n请撰写分析报告结论。"
    )

    try:
        cfg_dict = {**llm_config, "max_tokens": max(int(llm_config.get("max_tokens", 4096)), 4096)}
        cfg = LLMModelConfig(**cfg_dict)
        conclusion = call_llm_json(config=cfg, system_prompt=system_prompt, user_prompt=user_prompt).strip()
        if req.session_id:
            from app.services.sessions import get_session_or_404

            s = get_session_or_404(db, req.session_id)
            s.report_conclusion = conclusion
            db.add(s)
            db.commit()
        return ConclusionResponse(conclusion=conclusion)
    except LLMError as e:
        logger.error("LLM conclusion failed: %s", e)
        raise HTTPException(status_code=500, detail=f"大模型调用失败: {e}")
    except Exception as e:
        logger.exception("conclusion_generation_failed")
        raise HTTPException(status_code=500, detail=str(e))
