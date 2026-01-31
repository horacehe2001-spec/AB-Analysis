# 后端（FastAPI）

## 运行（本机）
1. （建议）创建虚拟环境：`python -m venv .venv`，并激活 `.venv`
2. 安装依赖：`python -m pip install -r backend/requirements.txt`
3. 启动：`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend`
4. 打开接口文档：`http://localhost:8000/docs`

## 与前端联调
前端 `.env` 配置 `VITE_API_BASE_URL=http://localhost:8000`。

## 自检
运行接口冒烟测试：`python -m unittest discover -s backend/tests -p "test_*.py" -q`

## LLM（可选）
- 在设置页保存 `/api/v2/config/model`（或直接调用接口）后，`/api/v2/chat` 会在检测到 `api_key` 非空时优先走 LLM 解析（失败自动回退到启发式）。
- 当前实现支持：
  - `provider=openai/custom/zhipu/qwen`：按 OpenAI-compatible 的 `POST {base_url}/v1/chat/completions` 调用
  - `provider=claude`：按 Anthropic Messages API 调用

## 备注
- 当前 `/api/v2/chat` 默认使用启发式解析（支持 `X=列名,Y=列名` / `group=列名,value=列名`），后续可把 `services/llm` 替换为真实 LLM 调用。
