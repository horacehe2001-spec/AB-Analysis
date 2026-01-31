from __future__ import annotations

from pydantic import BaseModel, Field


class IntentOut(BaseModel):
    task: str = Field(default="auto", pattern="^(auto|regression|difference|correlation|chi_square|spc)$")
    x: str | None = None
    y: str | None = None
    group: str | None = None
    value: str | None = None
    alpha: float = Field(default=0.05, ge=0.000001, le=0.5)


class PlanOut(BaseModel):
    method: str = Field(
        ...,
        pattern="^(auto|linear_regression|pearson|spearman|t_test|mann_whitney_u|anova|kruskal|chi_square|auto_group_diff|spc)$",
    )
    params: dict = Field(default_factory=dict)

