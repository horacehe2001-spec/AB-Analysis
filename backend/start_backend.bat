@echo off
cd /d D:\AB\backend
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
