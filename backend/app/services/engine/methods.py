from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np
import pandas as pd
import scipy.stats as st
import statsmodels.api as sm

from app.services.engine.spc import compute_limits, detect_western_rules


EffectType = Literal["cohens_d", "r_squared", "eta_squared", "cramers_v"]


@dataclass(frozen=True)
class EngineResult:
    method: str
    method_name: str
    p_value: float | None
    significant: bool
    effect_size: dict[str, Any]
    interpretation: str
    suggestions: list[str]
    visualizations: list[dict[str, Any]]


def _significant(p_value: float, alpha: float) -> bool:
    try:
        return float(p_value) < float(alpha)
    except Exception:
        return False


def _cohens_d(x: np.ndarray, y: np.ndarray) -> float:
    x = x.astype(float)
    y = y.astype(float)
    nx = len(x)
    ny = len(y)
    if nx < 2 or ny < 2:
        return float("nan")
    vx = np.var(x, ddof=1)
    vy = np.var(y, ddof=1)
    s = np.sqrt(((nx - 1) * vx + (ny - 1) * vy) / (nx + ny - 2))
    if s == 0:
        return 0.0
    return (np.mean(x) - np.mean(y)) / s


def _level_for_effect(effect_type: EffectType, value: float) -> str:
    v = abs(float(value))
    if effect_type == "cohens_d":
        if v < 0.2:
            return "small"
        if v < 0.5:
            return "medium"
        return "large"
    if effect_type == "r_squared":
        if v < 0.13:
            return "small"
        if v < 0.26:
            return "medium"
        return "large"
    if effect_type == "eta_squared":
        if v < 0.01:
            return "small"
        if v < 0.06:
            return "medium"
        return "large"
    if effect_type == "cramers_v":
        if v < 0.1:
            return "small"
        if v < 0.3:
            return "medium"
        return "large"
    return "medium"


def _scatter_chart(x: pd.Series, y: pd.Series, title: str) -> dict[str, Any]:
    return {
        "type": "scatter",
        "title": title,
        "data": {"points": [[float(a), float(b)] for a, b in zip(x.tolist(), y.tolist())]},
        "xLabel": str(x.name),
        "yLabel": str(y.name),
    }


def _box_chart(groups: dict[str, list[float]], title: str, x_label: str, y_label: str) -> dict[str, Any]:
    return {
        "type": "box",
        "title": title,
        "data": {"groups": list(groups.keys()), "values": list(groups.values())},
        "xLabel": x_label,
        "yLabel": y_label,
    }

def _distribution_chart(values: pd.Series, title: str) -> dict[str, Any]:
    v = pd.to_numeric(values, errors="coerce").dropna().to_numpy(dtype=float)
    if v.size == 0:
        bins = []
        counts = []
    else:
        counts, edges = np.histogram(v, bins="auto")
        bins = [[float(edges[i]), float(edges[i + 1])] for i in range(len(edges) - 1)]
        counts = [int(c) for c in counts.tolist()]
    return {
        "type": "distribution",
        "title": title,
        "data": {"bins": bins, "counts": counts},
        "xLabel": str(values.name),
        "yLabel": "count",
    }


def _residual_chart(x: np.ndarray, residuals: np.ndarray, title: str, x_label: str) -> dict[str, Any]:
    return {
        "type": "residual",
        "title": title,
        "data": {"points": [[float(a), float(b)] for a, b in zip(x.tolist(), residuals.tolist())]},
        "xLabel": x_label,
        "yLabel": "residual",
    }


def _is_normal(values: np.ndarray, alpha: float = 0.05) -> bool:
    values = values[np.isfinite(values)]
    if values.size < 3:
        return False
    # Shapiro is ok for small-to-medium; cap for perf.
    sample = values if values.size <= 5000 else np.random.default_rng(0).choice(values, size=5000, replace=False)
    try:
        _, p = st.shapiro(sample)
        return float(p) >= float(alpha)
    except Exception:
        return False


def pearson_correlation(df: pd.DataFrame, x: str, y: str, alpha: float = 0.05) -> EngineResult:
    x_s = pd.to_numeric(df[x], errors="coerce")
    y_s = pd.to_numeric(df[y], errors="coerce")
    mask = x_s.notna() & y_s.notna()
    x_s = x_s[mask]
    y_s = y_s[mask]
    if len(x_s) < 3:
        raise ValueError("Not enough valid rows for correlation")
    r, p_value = st.pearsonr(x_s.to_numpy(dtype=float), y_s.to_numpy(dtype=float))
    effect_type: EffectType = "r_squared"
    r2 = float(r) ** 2
    effect = {"type": effect_type, "value": r2, "level": _level_for_effect(effect_type, r2)}
    sig = _significant(float(p_value), alpha)
    interp = f"Pearson 相关：{x} 与 {y} 的线性相关{'显著' if sig else '不显著'}（p={float(p_value):.4g}，r={float(r):.3g}）。"
    viz = [_scatter_chart(x_s, y_s, f"{x} vs {y}")]
    return EngineResult(
        method="pearson",
        method_name="Pearson 相关",
        p_value=float(p_value),
        significant=sig,
        effect_size=effect,
        interpretation=interp,
        suggestions=["若存在异常值或非线性关系，可尝试 Spearman 相关或可视化检视。"],
        visualizations=viz,
    )


def spearman_correlation(df: pd.DataFrame, x: str, y: str, alpha: float = 0.05) -> EngineResult:
    x_s = pd.to_numeric(df[x], errors="coerce")
    y_s = pd.to_numeric(df[y], errors="coerce")
    mask = x_s.notna() & y_s.notna()
    x_s = x_s[mask]
    y_s = y_s[mask]
    if len(x_s) < 3:
        raise ValueError("Not enough valid rows for correlation")
    r, p_value = st.spearmanr(x_s.to_numpy(dtype=float), y_s.to_numpy(dtype=float))
    effect_type: EffectType = "r_squared"
    r2 = float(r) ** 2
    effect = {"type": effect_type, "value": r2, "level": _level_for_effect(effect_type, r2)}
    sig = _significant(float(p_value), alpha)
    interp = f"Spearman 相关：{x} 与 {y} 的单调相关{'显著' if sig else '不显著'}（p={float(p_value):.4g}，ρ={float(r):.3g}）。"
    viz = [_scatter_chart(x_s, y_s, f"{x} vs {y}")]
    return EngineResult(
        method="spearman",
        method_name="Spearman 相关",
        p_value=float(p_value),
        significant=sig,
        effect_size=effect,
        interpretation=interp,
        suggestions=["Spearman 对非正态与异常值更稳健，但不代表因果关系。"],
        visualizations=viz,
    )


def mann_whitney_u(df: pd.DataFrame, group: str, value: str, alpha: float = 0.05) -> EngineResult:
    g = df[group].astype(str)
    v = pd.to_numeric(df[value], errors="coerce")
    mask = g.notna() & v.notna()
    g = g[mask]
    v = v[mask]
    levels = g.unique().tolist()
    if len(levels) != 2:
        raise ValueError("Mann–Whitney U requires exactly 2 groups")
    a = v[g == levels[0]].to_numpy(dtype=float)
    b = v[g == levels[1]].to_numpy(dtype=float)
    if len(a) < 2 or len(b) < 2:
        raise ValueError("Not enough samples in each group")
    stat, p_value = st.mannwhitneyu(a, b, alternative="two-sided")
    # Use Cohen's d for continuity with UI (approx)
    d = _cohens_d(a, b)
    effect_type: EffectType = "cohens_d"
    effect = {"type": effect_type, "value": float(d), "level": _level_for_effect(effect_type, float(d))}
    sig = _significant(float(p_value), alpha)
    interp = (
        f"Mann–Whitney U：组 {levels[0]} 与 {levels[1]} 的 {value} 分布差异{'显著' if sig else '不显著'}"
        f"（p={float(p_value):.4g}）。"
    )
    groups = {levels[0]: a.tolist(), levels[1]: b.tolist()}
    viz = [_box_chart(groups, f"{value} by {group}", group, value)]
    return EngineResult(
        method="mann_whitney_u",
        method_name="Mann–Whitney U",
        p_value=float(p_value),
        significant=sig,
        effect_size=effect,
        interpretation=interp,
        suggestions=["该检验对非正态更稳健；同时建议查看箱线图与分布图。"],
        visualizations=viz + [_distribution_chart(pd.Series(a, name=f"{value}({levels[0]})"), "分布")],
    )


def anova_oneway(df: pd.DataFrame, group: str, value: str, alpha: float = 0.05) -> EngineResult:
    g = df[group].astype(str)
    v = pd.to_numeric(df[value], errors="coerce")
    mask = g.notna() & v.notna()
    g = g[mask]
    v = v[mask]
    levels = g.unique().tolist()
    if len(levels) < 3:
        raise ValueError("ANOVA requires 3+ groups")
    arrays = [v[g == lvl].to_numpy(dtype=float) for lvl in levels]
    if any(len(a) < 2 for a in arrays):
        raise ValueError("Not enough samples in one of the groups")
    f_stat, p_value = st.f_oneway(*arrays)
    # eta^2
    all_vals = v.to_numpy(dtype=float)
    grand_mean = float(np.mean(all_vals))
    ss_between = float(sum(len(arr) * (float(np.mean(arr)) - grand_mean) ** 2 for arr in arrays))
    ss_total = float(sum((float(x) - grand_mean) ** 2 for x in all_vals))
    eta2 = ss_between / ss_total if ss_total > 0 else 0.0
    effect_type: EffectType = "eta_squared"
    effect = {"type": effect_type, "value": float(eta2), "level": _level_for_effect(effect_type, float(eta2))}
    sig = _significant(float(p_value), alpha)
    interp = f"单因素 ANOVA：不同 {group} 组的 {value} 均值差异{'显著' if sig else '不显著'}（p={float(p_value):.4g}，η²={eta2:.3g}）。"
    groups = {lvl: arr.tolist() for lvl, arr in zip(levels, arrays)}
    viz = [_box_chart(groups, f"{value} by {group}", group, value)]
    return EngineResult(
        method="anova",
        method_name="单因素 ANOVA",
        p_value=float(p_value),
        significant=sig,
        effect_size=effect,
        interpretation=interp,
        suggestions=["若不满足正态/方差齐性，可尝试 Kruskal–Wallis 检验；显著时可做事后检验。"],
        visualizations=viz,
    )


def kruskal_wallis(df: pd.DataFrame, group: str, value: str, alpha: float = 0.05) -> EngineResult:
    g = df[group].astype(str)
    v = pd.to_numeric(df[value], errors="coerce")
    mask = g.notna() & v.notna()
    g = g[mask]
    v = v[mask]
    levels = g.unique().tolist()
    if len(levels) < 3:
        raise ValueError("Kruskal–Wallis requires 3+ groups")
    arrays = [v[g == lvl].to_numpy(dtype=float) for lvl in levels]
    if any(len(a) < 2 for a in arrays):
        raise ValueError("Not enough samples in one of the groups")
    h_stat, p_value = st.kruskal(*arrays)
    # reuse eta_squared slot with 0; UI just needs effect_size present
    effect_type: EffectType = "eta_squared"
    effect = {"type": effect_type, "value": 0.0, "level": "small"}
    sig = _significant(float(p_value), alpha)
    interp = f"Kruskal–Wallis：不同 {group} 组的 {value} 分布差异{'显著' if sig else '不显著'}（p={float(p_value):.4g}）。"
    groups = {lvl: arr.tolist() for lvl, arr in zip(levels, arrays)}
    viz = [_box_chart(groups, f"{value} by {group}", group, value)]
    return EngineResult(
        method="kruskal",
        method_name="Kruskal–Wallis",
        p_value=float(p_value),
        significant=sig,
        effect_size=effect,
        interpretation=interp,
        suggestions=["该检验对非正态更稳健；显著时可做 Dunn 事后比较（可扩展）。"],
        visualizations=viz,
    )


def linear_regression(df: pd.DataFrame, x: str, y: str, alpha: float = 0.05) -> EngineResult:
    x_s = pd.to_numeric(df[x], errors="coerce")
    y_s = pd.to_numeric(df[y], errors="coerce")
    mask = x_s.notna() & y_s.notna()
    x_s = x_s[mask]
    y_s = y_s[mask]
    if len(x_s) < 3:
        raise ValueError("Not enough valid rows for regression")

    X = sm.add_constant(x_s.to_numpy(dtype=float))
    model = sm.OLS(y_s.to_numpy(dtype=float), X).fit()
    p_value = float(model.pvalues[1]) if len(model.pvalues) > 1 else float("nan")
    r2 = float(model.rsquared)

    effect_type: EffectType = "r_squared"
    effect_value = r2
    effect = {"type": effect_type, "value": effect_value, "level": _level_for_effect(effect_type, effect_value)}

    sig = _significant(p_value, alpha)
    interp = (
        f"线性回归结果：{x} 对 {y} 的影响{'显著' if sig else '不显著'}（p={p_value:.4g}，R²={r2:.3g}）。"
    )
    suggestions = []
    if not sig:
        suggestions.append("可以尝试增加样本量或检查是否存在非线性关系。")
    suggestions.append("建议检查异常值与残差分布，必要时加入控制变量。")

    residuals = model.resid
    viz = [
        _scatter_chart(x_s, y_s, f"{x} vs {y}"),
        _residual_chart(x_s.to_numpy(dtype=float), residuals.astype(float), "Residuals", x),
    ]
    return EngineResult(
        method="linear_regression",
        method_name="线性回归",
        p_value=p_value,
        significant=sig,
        effect_size=effect,
        interpretation=interp,
        suggestions=suggestions,
        visualizations=viz,
    )


def t_test_independent(df: pd.DataFrame, group: str, value: str, alpha: float = 0.05) -> EngineResult:
    g = df[group].astype(str)
    v = pd.to_numeric(df[value], errors="coerce")
    mask = g.notna() & v.notna()
    g = g[mask]
    v = v[mask]

    levels = g.unique().tolist()
    if len(levels) != 2:
        raise ValueError("t-test requires exactly 2 groups")
    a = v[g == levels[0]].to_numpy(dtype=float)
    b = v[g == levels[1]].to_numpy(dtype=float)
    if len(a) < 2 or len(b) < 2:
        raise ValueError("Not enough samples in each group")

    stat, p_value = st.ttest_ind(a, b, equal_var=False, nan_policy="omit")
    d = _cohens_d(a, b)
    effect_type: EffectType = "cohens_d"
    effect = {"type": effect_type, "value": float(d), "level": _level_for_effect(effect_type, float(d))}

    sig = _significant(float(p_value), alpha)
    interp = (
        f"独立样本 t 检验：组 {levels[0]} 与 {levels[1]} 的 {value} 差异{'显著' if sig else '不显著'}"
        f"（p={float(p_value):.4g}，Cohen's d={float(d):.3g}）。"
    )
    groups = {levels[0]: a.tolist(), levels[1]: b.tolist()}
    viz = [_box_chart(groups, f"{value} by {group}", group, value), _distribution_chart(pd.Series(v, name=value), "分布")]
    return EngineResult(
        method="t_test",
        method_name="独立样本 t 检验",
        p_value=float(p_value),
        significant=sig,
        effect_size=effect,
        interpretation=interp,
        suggestions=["如不满足正态/方差齐性，可尝试 Mann–Whitney U 检验。"],
        visualizations=viz,
    )


def chi_square(df: pd.DataFrame, x: str, y: str, alpha: float = 0.05) -> EngineResult:
    table = pd.crosstab(df[x], df[y])
    if table.shape[0] < 2 or table.shape[1] < 2:
        raise ValueError("Chi-square requires at least 2x2 contingency table")
    chi2, p_value, dof, expected = st.chi2_contingency(table)
    n = table.values.sum()
    phi2 = chi2 / max(n, 1)
    r, k = table.shape
    denom = min(k - 1, r - 1)
    v = float(np.sqrt(phi2 / denom)) if denom > 0 else 0.0

    effect_type: EffectType = "cramers_v"
    effect = {"type": effect_type, "value": v, "level": _level_for_effect(effect_type, v)}
    sig = _significant(float(p_value), alpha)
    interp = f"卡方检验：{x} 与 {y} {'相关' if sig else '未发现显著相关'}（p={float(p_value):.4g}，Cramér's V={v:.3g}）。"
    viz = [
        {
            "type": "bar",
            "title": f"{x} x {y} 频数",
            "data": {"table": table.to_dict()},
            "xLabel": x,
            "yLabel": y,
        }
    ]
    return EngineResult(
        method="chi_square",
        method_name="卡方检验",
        p_value=float(p_value),
        significant=sig,
        effect_size=effect,
        interpretation=interp,
        suggestions=["若期望频数过小，可合并类别或使用 Fisher 精确检验（2x2）。"],
        visualizations=viz,
    )


_RULE_DESCRIPTIONS = {
    1: "规则1：1点超出3σ",
    2: "规则2：连续9点在中心线同侧",
    3: "规则3：连续6点递增或递减",
    4: "规则4：连续14点交替上下",
    5: "规则5：3点中有2点超出2σ（同侧）",
    6: "规则6：5点中有4点超出1σ（同侧）",
    7: "规则7：连续15点在1σ内",
    8: "规则8：连续8点在1σ外",
}


def _choose_chart_type(values: list[float]) -> str:
    """自动选择控制图类型：连续型默认 IX-MR，离散型根据值域判断。"""
    arr = np.array(values)
    unique_ratio = len(set(values)) / len(values) if values else 1.0
    is_integer = np.all(arr == np.floor(arr))

    if unique_ratio < 0.05 and is_integer:
        # 离散型
        if np.all(arr >= 0) and np.all(arr <= 1):
            return "P"
        if np.max(arr) <= 50 and np.mean(arr) < 10:
            return "C"
        return "NP"
    # 连续型 — MVP 阶段默认单值
    return "IX-MR"


def spc_control_chart(df: pd.DataFrame, y: str, alpha: float = 0.05) -> EngineResult:
    """SPC 控制图分析：自动选型 → 计算控制限 → 西联规则检测。"""
    series = pd.to_numeric(df[y], errors="coerce").dropna()
    if len(series) < 5:
        raise ValueError(f"列 '{y}' 的有效数值不足 5 个，无法进行 SPC 分析")

    values = series.tolist()
    chart_type = _choose_chart_type(values)

    # 计算控制限
    limits = compute_limits(chart_type, values)
    cl = limits["cl"]
    ucl = limits["ucl"]
    lcl = limits["lcl"]
    sigma = limits["sigma"]
    chart_series = limits.get("chart_series", values)

    # 西联规则检测（启用全部 8 条）
    enabled_rules = list(range(1, 9))
    anomalies = detect_western_rules(chart_series, cl, sigma, enabled_rules)

    # 按索引聚合触发的规则
    anomaly_map: dict[int, list[int]] = {}
    for idx, rule_id in anomalies:
        anomaly_map.setdefault(idx, []).append(rule_id)

    # 构建控制图数据点
    points = []
    for i, val in enumerate(chart_series):
        rules = anomaly_map.get(i, [])
        points.append({
            "x": i + 1,
            "y": round(float(val), 6),
            "is_anomaly": len(rules) > 0,
            "rule_violated": rules,
        })

    anomaly_count = len(anomaly_map)
    triggered_rules = sorted(set(r for rules in anomaly_map.values() for r in rules))

    # 可视化
    viz = [{
        "type": "control_chart",
        "title": f"{chart_type} 控制图 — {y}",
        "data": {
            "points": points,
            "ucl": round(ucl, 6),
            "cl": round(cl, 6),
            "lcl": round(lcl, 6),
            "chart_type": chart_type,
        },
    }]

    # 解读
    if anomaly_count == 0:
        level = "过程受控"
        interp = f"SPC 分析（{chart_type} 控制图）：{y} 过程受控，未检测到异常点。CL={cl:.4g}，UCL={ucl:.4g}，LCL={lcl:.4g}。"
    else:
        level = "过程失控" if anomaly_count >= 3 else "过程预警"
        rule_desc = "、".join(_RULE_DESCRIPTIONS.get(r, f"规则{r}") for r in triggered_rules)
        interp = (
            f"SPC 分析（{chart_type} 控制图）：{y} {level}，"
            f"共 {anomaly_count} 个异常点，触发规则：{rule_desc}。"
            f"CL={cl:.4g}，UCL={ucl:.4g}，LCL={lcl:.4g}。"
        )

    suggestions = []
    if anomaly_count > 0:
        suggestions.append("建议排查异常点对应的生产批次或时间段，寻找特殊原因。")
        if 1 in triggered_rules:
            suggestions.append("规则1触发：存在极端偏离，优先检查该点的原材料或设备状态。")
        if 2 in triggered_rules:
            suggestions.append("规则2触发：过程均值可能发生偏移，建议检查是否有系统性变化。")
    else:
        suggestions.append("过程稳定，可继续监控。如有新数据，建议定期更新控制图。")

    return EngineResult(
        method="spc",
        method_name=f"SPC {chart_type} 控制图",
        p_value=None,
        significant=anomaly_count > 0,
        effect_size={"type": "cohens_d", "value": 0.0, "level": "small"},
        interpretation=interp,
        suggestions=suggestions,
        visualizations=viz,
    )


def suggest_default_method(df: pd.DataFrame) -> tuple[str, dict[str, Any]]:
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    cat_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
    if len(numeric_cols) >= 2:
        x = str(numeric_cols[0])
        y = str(numeric_cols[1])
        # Use Pearson as the most conservative default if user didn't ask for causality
        return "pearson", {"x": x, "y": y}
    if cat_cols and numeric_cols:
        group = str(cat_cols[0])
        value = str(numeric_cols[0])
        # Choose parametric vs non-param based on normality of each group
        g = df[group].astype(str)
        v = pd.to_numeric(df[value], errors="coerce")
        mask = g.notna() & v.notna()
        g = g[mask]
        v = v[mask]
        levels = g.unique().tolist()
        if len(levels) == 2:
            a = v[g == levels[0]].to_numpy(dtype=float)
            b = v[g == levels[1]].to_numpy(dtype=float)
            if _is_normal(a) and _is_normal(b):
                return "t_test", {"group": group, "value": value}
            return "mann_whitney_u", {"group": group, "value": value}
        if len(levels) >= 3:
            arrays = [v[g == lvl].to_numpy(dtype=float) for lvl in levels]
            if all(_is_normal(a) for a in arrays):
                return "anova", {"group": group, "value": value}
            return "kruskal", {"group": group, "value": value}
        return "t_test", {"group": group, "value": value}
    raise ValueError("Cannot suggest method from data")
