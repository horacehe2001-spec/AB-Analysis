from math import sqrt
from statistics import mean, pstdev
from typing import Dict, List, Tuple

# 常数表：A2、A3、d2 等（子组 2-10）
A2_TABLE = {
    2: 1.880,
    3: 1.023,
    4: 0.729,
    5: 0.577,
    6: 0.483,
    7: 0.419,
    8: 0.373,
    9: 0.337,
    10: 0.308,
}
A3_TABLE = {
    2: 2.659,
    3: 1.954,
    4: 1.628,
    5: 1.427,
    6: 1.287,
    7: 1.182,
    8: 1.099,
    9: 1.032,
    10: 0.975,
}
d2_TABLE = {
    2: 1.128,
    3: 1.693,
    4: 2.059,
    5: 2.326,
    6: 2.534,
    7: 2.704,
    8: 2.847,
    9: 2.970,
    10: 3.078,
}


def compute_basic_limits(values: List[float]) -> Dict[str, float]:
    """
    基础 IX 控制限计算：CL=均值，Sigma=总体标准差，UCL/LCL = CL ± 3*Sigma。
    """
    cl = mean(values)
    sigma = pstdev(values) if len(values) > 1 else 0.0
    ucl = cl + 3 * sigma
    lcl = cl - 3 * sigma
    return {"cl": cl, "ucl": ucl, "lcl": lcl, "sigma": sigma}


def compute_xbar_r_limits(values: List[float], subgroup_size: int = 5) -> Dict[str, float]:
    """
    简化版 Xbar-R 控制限计算。
    - 将数据按 subgroup_size 切分，计算子组均值和极差
    - 控制限基于均值的 A2 常数
    返回 chart_series（子组均值）供后续规则判定。
    """
    if subgroup_size < 2:
        subgroup_size = 2
    subgroups = [values[i : i + subgroup_size] for i in range(0, len(values), subgroup_size) if values[i : i + subgroup_size]]
    if not subgroups:
        return compute_basic_limits(values)

    sub_means = [mean(g) for g in subgroups]
    sub_ranges = [max(g) - min(g) if len(g) > 1 else 0 for g in subgroups]
    xbarbar = mean(sub_means)
    rbar = mean(sub_ranges)

    # 常见 A2 常数表（n=2..10）；超出范围时用近似 3/(d2*sqrt(n))
    A2 = A2_TABLE.get(subgroup_size)
    if A2 is None:
        # 近似：d2 ~ 1.128*sqrt(n-1) ; A2 = 3/(d2*sqrt(n))
        d2 = 1.128 * sqrt(subgroup_size - 1)
        A2 = 3 / (d2 * sqrt(subgroup_size))
    d2 = d2_TABLE.get(subgroup_size, 1.0)

    ucl = xbarbar + A2 * rbar
    lcl = xbarbar - A2 * rbar

    # sigma 使用 rbar/d2 估计
    sigma = rbar / d2 if rbar else 0.0

    return {
        "cl": xbarbar,
        "ucl": ucl,
        "lcl": lcl,
        "sigma": sigma,
        "chart_series": sub_means,
    }


def compute_xbar_sigma_limits(values: List[float], subgroup_size: int = 5) -> Dict[str, float]:
    """
    简化版 Xbar-S 控制限计算。
    sigma 估计使用子组标准差均值。
    """
    if subgroup_size < 2:
        subgroup_size = 2
    subgroups = [values[i : i + subgroup_size] for i in range(0, len(values), subgroup_size) if values[i : i + subgroup_size]]
    if not subgroups:
        return compute_basic_limits(values)

    sub_means = [mean(g) for g in subgroups]
    sub_sigmas = [pstdev(g) if len(g) > 1 else 0.0 for g in subgroups]
    xbarbar = mean(sub_means)
    sbar = mean(sub_sigmas)

    A3 = A3_TABLE.get(subgroup_size, 0.0)
    ucl = xbarbar + A3 * sbar
    lcl = xbarbar - A3 * sbar

    return {
        "cl": xbarbar,
        "ucl": ucl,
        "lcl": lcl,
        "sigma": sbar,
        "chart_series": sub_means,
    }


def _normalize_sample_sizes(values: List[float], sample_size: int, sample_sizes: List[int] | None) -> List[int]:
    """
    返回与 values 等长的样本量列表。
    """
    if sample_sizes and len(sample_sizes) == len(values):
        return sample_sizes
    return [max(sample_size, 1)] * len(values)


def compute_p_limits(defect_rates: List[float], sample_size: int, sample_sizes: List[int] | None = None) -> Dict[str, float]:
    """
    P 图：输入为每批次的不合格品率 (0-1)；sample_size 为每批次样本量。
    """
    sample_sizes = _normalize_sample_sizes(defect_rates, sample_size, sample_sizes)
    p_bar = mean(defect_rates)
    # sigma_i 按样本量计算，控制限以均值与平均 sigma 估计
    sigma_list = [(p_bar * (1 - p_bar) / n) ** 0.5 if p_bar >= 0 else 0.0 for n in sample_sizes]
    sigma = mean(sigma_list)
    ucl = p_bar + 3 * sigma
    lcl = max(0.0, p_bar - 3 * sigma)
    return {"cl": p_bar, "ucl": ucl, "lcl": lcl, "sigma": sigma, "chart_series": defect_rates}


def compute_np_limits(defect_counts: List[float], sample_size: int, sample_sizes: List[int] | None = None) -> Dict[str, float]:
    """
    NP 图：输入为每批次不合格品数；sample_size 为每批次样本量。
    """
    sample_sizes = _normalize_sample_sizes(defect_counts, sample_size, sample_sizes)
    np_bar = mean(defect_counts)
    p_bar = np_bar / mean(sample_sizes)
    sigma_list = [(n * p_bar * (1 - p_bar)) ** 0.5 if p_bar >= 0 else 0.0 for n in sample_sizes]
    sigma = mean(sigma_list)
    ucl = np_bar + 3 * sigma
    lcl = max(0.0, np_bar - 3 * sigma)
    return {"cl": np_bar, "ucl": ucl, "lcl": lcl, "sigma": sigma, "chart_series": defect_counts}


def compute_c_limits(defect_counts: List[float]) -> Dict[str, float]:
    """
    C 图：单位固定面积/时间内缺陷数。
    """
    c_bar = mean(defect_counts)
    sigma = c_bar ** 0.5
    ucl = c_bar + 3 * sigma
    lcl = max(0.0, c_bar - 3 * sigma)
    return {"cl": c_bar, "ucl": ucl, "lcl": lcl, "sigma": sigma, "chart_series": defect_counts}


def compute_u_limits(defect_counts: List[float], sample_size: int, sample_sizes: List[int] | None = None) -> Dict[str, float]:
    """
    U 图：可变样本量的单位缺陷率；sample_size 为每批次样本量。
    """
    sample_sizes = _normalize_sample_sizes(defect_counts, sample_size, sample_sizes)
    # u_i = c_i / n_i
    u_values = [c / n if n > 0 else 0.0 for c, n in zip(defect_counts, sample_sizes)]
    u_bar = mean(u_values)
    sigma_list = [(u_bar / n) ** 0.5 if n > 0 else 0.0 for n in sample_sizes]
    sigma = mean(sigma_list)
    ucl = u_bar + 3 * sigma
    lcl = max(0.0, u_bar - 3 * sigma)
    return {"cl": u_bar, "ucl": ucl, "lcl": lcl, "sigma": sigma, "chart_series": u_values}


def _sign(v: float) -> int:
    if v > 0:
        return 1
    if v < 0:
        return -1
    return 0


def detect_western_rules(values: List[float], cl: float, sigma: float, enabled_rules: List[int]) -> List[Tuple[int, int]]:
    """
    返回 (index, rule_id) 列表。
    规则参考：1~8 西电规则；实现为简化滑窗逻辑。
    """
    if sigma <= 0:
        return []

    z = [(v - cl) / sigma for v in values]
    anomalies: List[Tuple[int, int]] = []
    n = len(values)

    def add(idx: int, rule_id: int):
        anomalies.append((idx, rule_id))

    for i in range(n):
        zi = z[i]
        # Rule 1: 1 point beyond 3 sigma
        if 1 in enabled_rules and abs(zi) > 3:
            add(i, 1)

        # Rule 2: 9 consecutive on same side
        if 2 in enabled_rules and i >= 8:
            window = z[i - 8 : i + 1]
            if all(v > 0 for v in window) or all(v < 0 for v in window):
                add(i, 2)

        # Rule 3: 6 points in a row steadily increasing or decreasing
        if 3 in enabled_rules and i >= 5:
            window = values[i - 5 : i + 1]
            if all(window[j] > window[j - 1] for j in range(1, 6)) or all(
                window[j] < window[j - 1] for j in range(1, 6)
            ):
                add(i, 3)

        # Rule 4: 14 points alternating up and down
        if 4 in enabled_rules and i >= 13:
            window = values[i - 13 : i + 1]
            if all((window[j] - window[j - 1]) * (window[j - 1] - window[j - 2]) < 0 for j in range(2, 14)):
                add(i, 4)

        # Rule 5: 2 of 3 consecutive beyond 2 sigma (same side)
        if 5 in enabled_rules and i >= 2:
            window = z[i - 2 : i + 1]
            if sum(1 for v in window if v > 2) >= 2 or sum(1 for v in window if v < -2) >= 2:
                add(i, 5)

        # Rule 6: 4 of 5 consecutive beyond 1 sigma (same side)
        if 6 in enabled_rules and i >= 4:
            window = z[i - 4 : i + 1]
            if sum(1 for v in window if v > 1) >= 4 or sum(1 for v in window if v < -1) >= 4:
                add(i, 6)

        # Rule 7: 15 consecutive within 1 sigma (both sides)
        if 7 in enabled_rules and i >= 14:
            window = z[i - 14 : i + 1]
            if all(abs(v) < 1 for v in window):
                add(i, 7)

        # Rule 8: 8 consecutive outside 1 sigma (either side)
        if 8 in enabled_rules and i >= 7:
            window = z[i - 7 : i + 1]
            if all(abs(v) > 1 for v in window):
                add(i, 8)

    # 去重: 同一索引可能触发多规则，保留全部
    return anomalies


def compute_limits(chart_type: str, values: List[float], subgroup_size: int = 5, sample_sizes: List[int] | None = None) -> Dict[str, float]:
    """
    分发控制限计算；未覆盖的图型回退 IX。
    chart_series: 用于规则检测的序列（例如 Xbar-R 使用子组均值）。
    """
    chart_type = chart_type.upper()
    if chart_type in ("XBAR-R", "XBAR_R", "XBAR"):
        return compute_xbar_r_limits(values, subgroup_size=subgroup_size)
    if chart_type in ("XBAR-S", "XBAR_S"):
        return compute_xbar_sigma_limits(values, subgroup_size=subgroup_size)
    if chart_type == "P":
        return compute_p_limits(values, sample_size=subgroup_size, sample_sizes=sample_sizes)
    if chart_type == "NP":
        return compute_np_limits(values, sample_size=subgroup_size, sample_sizes=sample_sizes)
    if chart_type == "C":
        return compute_c_limits(values)
    if chart_type == "U":
        return compute_u_limits(values, sample_size=subgroup_size, sample_sizes=sample_sizes)
    # 默认 IX-MR
    base = compute_basic_limits(values)
    base["chart_series"] = values
    return base
