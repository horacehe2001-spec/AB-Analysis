from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import chardet
import pandas as pd


@dataclass(frozen=True)
class LoadedData:
    df: pd.DataFrame
    file_name: str


def _detect_encoding(path: Path, max_bytes: int = 512 * 1024) -> str:
    raw = path.read_bytes()[:max_bytes]
    guess = chardet.detect(raw)
    enc = (guess.get("encoding") or "").lower()
    if enc in {"gb2312", "gbk", "gb18030"}:
        return "gb18030"
    if enc:
        return enc
    return "utf-8"


def load_dataframe(file_path: str) -> LoadedData:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix in {".xlsx", ".xls"}:
        df = pd.read_excel(path)
        return LoadedData(df=df, file_name=path.name)

    if suffix in {".csv", ".txt"}:
        encoding = _detect_encoding(path)
        df = pd.read_csv(path, encoding=encoding)
        return LoadedData(df=df, file_name=path.name)

    raise ValueError(f"Unsupported file type: {suffix}")

