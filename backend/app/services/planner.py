from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from app.services.engine.methods import (
    anova_oneway,
    chi_square,
    kruskal_wallis,
    linear_regression,
    mann_whitney_u,
    pearson_correlation,
    spearman_correlation,
    spc_control_chart,
    suggest_default_method,
    t_test_independent,
)
from app.services.llm.intent import Intent


@dataclass(frozen=True)
class Plan:
    method: str
    params: dict


def choose_plan(df: pd.DataFrame, intent: Intent) -> Plan:
    # explicit task hint
    if intent.task == "spc":
        return Plan(method="spc", params={"y": intent.y, "alpha": intent.alpha})
    if intent.task == "chi_square":
        return Plan(method="chi_square", params={"x": intent.x, "y": intent.y, "alpha": intent.alpha})
    if intent.task == "correlation":
        return Plan(method="spearman", params={"x": intent.x, "y": intent.y, "alpha": intent.alpha})
    if intent.task == "regression":
        return Plan(method="linear_regression", params={"x": intent.x, "y": intent.y, "alpha": intent.alpha})
    if intent.task == "difference":
        return Plan(
            method="auto_group_diff",
            params={"group": intent.group or intent.x, "value": intent.y, "alpha": intent.alpha},
        )

    # auto task: if user specified x and y, choose method based on column types
    if intent.task == "auto" and intent.x and intent.y:
        x_col = intent.x
        y_col = intent.y
        x_is_numeric = pd.api.types.is_numeric_dtype(df[x_col]) if x_col in df.columns else False
        y_is_numeric = pd.api.types.is_numeric_dtype(df[y_col]) if y_col in df.columns else False

        if x_is_numeric and y_is_numeric:
            # Both numeric: correlation
            return Plan(method="pearson", params={"x": x_col, "y": y_col, "alpha": intent.alpha})
        elif not x_is_numeric and y_is_numeric:
            # X is categorical, Y is numeric: group difference test
            return Plan(
                method="auto_group_diff",
                params={"group": x_col, "value": y_col, "alpha": intent.alpha},
            )
        elif x_is_numeric and not y_is_numeric:
            # X is numeric, Y is categorical: swap and do group difference
            return Plan(
                method="auto_group_diff",
                params={"group": y_col, "value": x_col, "alpha": intent.alpha},
            )
        else:
            # Both categorical: chi-square
            return Plan(method="chi_square", params={"x": x_col, "y": y_col, "alpha": intent.alpha})

    method, params = suggest_default_method(df)
    params["alpha"] = intent.alpha
    return Plan(method=method, params=params)


def run_plan(df: pd.DataFrame, plan: Plan):
    method = plan.method
    p = plan.params
    alpha = float(p.get("alpha") or 0.05)

    if method == "linear_regression":
        return linear_regression(df, x=str(p["x"]), y=str(p["y"]), alpha=alpha)
    if method == "pearson":
        return pearson_correlation(df, x=str(p["x"]), y=str(p["y"]), alpha=alpha)
    if method == "spearman":
        return spearman_correlation(df, x=str(p["x"]), y=str(p["y"]), alpha=alpha)
    if method == "t_test":
        return t_test_independent(df, group=str(p["group"]), value=str(p["value"]), alpha=alpha)
    if method == "mann_whitney_u":
        return mann_whitney_u(df, group=str(p["group"]), value=str(p["value"]), alpha=alpha)
    if method == "anova":
        return anova_oneway(df, group=str(p["group"]), value=str(p["value"]), alpha=alpha)
    if method == "kruskal":
        return kruskal_wallis(df, group=str(p["group"]), value=str(p["value"]), alpha=alpha)
    if method == "chi_square":
        return chi_square(df, x=str(p["x"]), y=str(p["y"]), alpha=alpha)
    if method == "spc":
        return spc_control_chart(df, y=str(p["y"]), alpha=alpha)
    if method == "auto_group_diff":
        # reuse engine default chooser for group/value by subsetting column choices
        group = p.get("group")
        value = p.get("value")
        if not group or not value:
            raise ValueError("缺少 group/value 列名")
        # Determine group count and numeric distribution; delegate to suggest_default_method on a reduced frame
        reduced = df[[group, value]].copy()
        chosen, params = suggest_default_method(reduced)
        params["alpha"] = alpha
        if chosen in {"t_test", "mann_whitney_u", "anova", "kruskal"}:
            return run_plan(df, Plan(method=chosen, params=params))
        raise ValueError("无法为组间差异选择合适方法")

    raise ValueError(f"Unsupported method: {method}")

