from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


def infer_column_type(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return "bool"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_numeric_dtype(series):
        return "number"
    # Heuristic: low cardinality -> category
    non_null = series.dropna()
    if not non_null.empty:
        nunique = int(non_null.nunique(dropna=True))
        unique_ratio = nunique / max(len(non_null), 1)
        # For small samples, a 2-group column should still be treated as category
        if (len(non_null) <= 50 and nunique <= 10) or (unique_ratio <= 0.5 and nunique <= 50):
            return "category"
    return "text"


def build_data_summary(df: pd.DataFrame) -> dict[str, Any]:
    df2 = df.copy()
    column_names = [str(c) for c in df2.columns.tolist()]
    col_types: dict[str, str] = {}
    col_stats: dict[str, dict[str, float]] = {}
    for col in column_names:
        col_types[col] = infer_column_type(df2[col])
        if col_types[col] == "number":
            numeric = pd.to_numeric(df2[col], errors="coerce").dropna()
            if len(numeric) > 0:
                mean_val = float(np.mean(numeric))
                std_val = float(np.std(numeric, ddof=1)) if len(numeric) > 1 else 0.0
                col_stats[col] = {
                    "mean": round(mean_val, 6),
                    "std": round(std_val, 6),
                    "min": round(float(np.min(numeric)), 6),
                    "max": round(float(np.max(numeric)), 6),
                }
    return {
        "rows": int(df2.shape[0]),
        "columns": int(df2.shape[1]),
        "column_names": column_names,
        "column_types": col_types,
        "column_stats": col_stats,
    }
