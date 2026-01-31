from __future__ import annotations

from sqlalchemy import text

from app.db.models import Base
from app.db.session import engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    if engine.dialect.name == "sqlite":
        with engine.connect() as conn:
            cols = conn.execute(text("PRAGMA table_info(sessions)")).fetchall()
            col_names = {row[1] for row in cols}
            if "report_conclusion" not in col_names:
                conn.execute(text("ALTER TABLE sessions ADD COLUMN report_conclusion TEXT"))
                conn.commit()
