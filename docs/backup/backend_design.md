# 智能假设检验分析服务 - 后端详细设计文档

> 版本: v2.0  
> 日期: 2026-01-06  
> API 前缀: `/api/v2`

---

## 1. 目标与范围

### 1.1 目标
- 提供面向前端的稳定 API：上传数据、对话式分析、会话查询、报告导出、模型与 Prompt 配置。
- 实现“理解 → 规划 → 执行 → 解读”的 LLM 驱动分析流程，并将统计结果结构化输出给前端展示/导出。
- 支持多轮对话、会话恢复、可观测、可扩展（新增检验方法、模型提供商、导出格式）。

### 1.2 非目标（本版不强制）
- 完整权限体系（RBAC、多租户计费）；仅预留鉴权接口与中间件扩展点。
- 数据源直连（MySQL/PostgreSQL/API）；本版以文件上传为主。
- 全量异步流水线；本版同步优先，重任务可切到 Worker。

---

## 2. 总体架构

### 2.1 分层与职责
- **API 层（FastAPI）**：请求校验、鉴权/限流、路由聚合、错误规范、OpenAPI。
- **会话层（Session）**：会话元数据、消息历史、对话上下文、缓存/TTL。
- **LLM 智能层**：
  - Intent Parser：从自然语言抽取任务与变量（X/Y/任务类型/约束）。
  - Planner：基于数据摘要与任务生成可执行分析计划（method + params + checks）。
  - Interpreter：将统计结果转成业务可读的解释、建议、可视化建议。
- **统计分析引擎（Engine）**：数据加载/类型识别/预处理、检验方法执行、效应量计算、图表数据生成。
- **存储层**：
  - PostgreSQL：会话元数据、消息、分析结果索引、配置（可选）。
  - Redis：会话上下文缓存、任务队列（可选）、限流计数。
  - 对象存储/本地盘：原始文件、导出文件、（可选）图表图片。

### 2.2 推荐目录结构（后端代码）
```
backend/
├─ app/
│  ├─ main.py                 # FastAPI 入口
│  ├─ api/
│  │  ├─ routes.py            # 路由汇总
│  │  ├─ chat.py              # /chat
│  │  ├─ upload.py            # /upload
│  │  ├─ sessions.py          # /sessions, /session/{id}
│  │  ├─ export.py            # /export
│  │  └─ config.py            # /config/*
│  ├─ schemas/                # Pydantic 请求/响应模型
│  ├─ services/
│  │  ├─ llm/                 # Intent/Plan/Interpret
│  │  ├─ engine/              # 统计引擎
│  │  ├─ storage/             # 文件与导出存储
│  │  └─ export/              # Markdown/DOCX 生成
│  ├─ db/
│  │  ├─ models.py            # SQLAlchemy 模型
│  │  ├─ session.py           # DB 会话
│  │  └─ migrations/          # Alembic
│  ├─ core/
│  │  ├─ settings.py          # 环境变量
│  │  ├─ logging.py           # 结构化日志
│  │  └─ security.py          # 鉴权/限流（可选）
│  └─ workers/                # Celery/RQ（可选）
├─ tests/
├─ Dockerfile
├─ docker-compose.yml
└─ requirements.txt
```

---

## 3. 关键数据与存储设计

### 3.1 Session（会话）与 Message（消息）

#### 3.1.1 会话元数据（PostgreSQL）
建议表：`sessions`
- `session_id` (UUID, PK)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `file_name` (text, 可空)
- `file_uri` (text, 可空；对象存储路径/本地路径)
- `industry` (text, 可空)
- `first_query` (text, 可空)
- `methods_used` (jsonb, 默认 `[]`)
- `message_count` (int, 默认 0)
- `data_summary` (jsonb, 可空；与前端 `DataSummary` 对齐)

建议表：`messages`
- `id` (UUID, PK)
- `session_id` (UUID, FK -> sessions.session_id, index)
- `role` (`user`/`assistant`)
- `content` (text)
- `timestamp` (timestamptz)
- `analysis` (jsonb, 可空；与前端 `AnalysisResult` 对齐)

#### 3.1.2 会话上下文缓存（Redis）
键：`session:{session_id}:context`
- 最近 N 轮消息（用于 LLM 上下文窗口控制）
- 最近一次 data summary、用户偏好（置信水平等，若支持）
- TTL：如 7~30 天（与产品策略一致）

### 3.2 文件与导出产物
- 上传原始文件：`uploads/{session_id}/{original_filename}`
- 导出文件：`exports/{session_id}/{timestamp}.{md|docx}`
- 若启用对象存储（S3/OSS/MinIO），`file_uri/download_url` 存储为可访问 URL 或内部 URI + 统一下载接口。

### 3.3 模型配置与 Prompt 模板
建议表：`app_config`（或按 key-value 存储）
- `key` (text, PK)：`model_config` / `prompt_templates`
- `value` (jsonb)
- `updated_at` (timestamptz)

安全约束：
- `api_key` 只在后端解密使用；写库前使用 KMS/环境密钥加密（如 AES-GCM）。
- `GET /config/model` 可“脱敏返回”（如 `sk-***abcd`）；若必须展示明文，需配合鉴权与审计。

---

## 4. API 设计（与前端类型对齐）

### 4.1 统一约定
- **时间字段**：ISO 8601 字符串（UTC），例如 `2026-01-06T01:23:45Z`。
- **错误响应**：前端 Axios 拦截器读取 `message` 或 `detail`，建议统一返回：
```json
{ "code": "INVALID_ARGUMENT", "message": "参数错误", "detail": "message 字段不能为空", "trace_id": "..." }
```
- **分页**：`page` 从 1 开始；`size` 默认 10/20。

### 4.2 Chat：`POST /api/v2/chat`

#### 4.2.1 请求（对应前端 `ChatRequest`）
```json
{
  "session_id": "uuid (可选)",
  "message": "string",
  "file": "base64 (可选，仅首次/无 upload 时)",
  "industry": "ecommerce|finance|... (可选)"
}
```

#### 4.2.2 响应（对应前端 `ChatResponse`）
```json
{
  "session_id": "uuid",
  "reply": "string",
  "analysis": {
    "method": "string",
    "method_name": "string",
    "p_value": 0.003,
    "effect_size": { "type": "r_squared", "value": 0.42, "level": "medium" },
    "significant": true,
    "interpretation": "string",
    "suggestions": ["..."],
    "visualizations": [
      { "type": "scatter", "title": "xxx", "data": {}, "xLabel": "X", "yLabel": "Y" }
    ]
  },
  "suggestions": ["..."],
  "visualizations": [ { "type": "scatter", "title": "xxx", "data": {} } ]
}
```

#### 4.2.3 处理流程（同步版）
1. 定位/创建会话：`session_id` 为空则创建；写入 `industry`、`first_query`（首次）。
2. 数据准备：
   - 若请求带 `file(base64)`：解码→落盘/对象存储→生成 `data_summary`。
   - 否则从 session 绑定的数据文件加载；若无数据则返回 `400`（提示先上传）。
3. LLM 意图解析：抽取 X/Y、任务类型、约束（检验方向、置信水平、分组变量等）。
4. 数据探查与特征摘要：缺失/异常/类型/分布、候选方法的适用性检查。
5. 规划：生成计划（method + params + prechecks + viz）。
6. 执行统计分析：调用引擎得到原始统计量、p 值、效应量、置信区间等。
7. 解读：生成 `reply/interpretation/suggestions`，并生成 `visualizations` 的结构化数据。
8. 持久化：写入 `messages`（user + assistant）、更新 `sessions.methods_used/message_count/updated_at`。

#### 4.2.4 异步化策略（可选）
- 当数据量大/方法耗时：`POST /chat` 返回 `session_id + task_id`，由前端轮询（本版不强制实现）。

### 4.3 Upload：`POST /api/v2/upload`

#### 4.3.1 请求
- `multipart/form-data`
  - `file`: CSV/Excel
  - `industry`（可选）：与前端 `Industry` 枚举一致

#### 4.3.2 响应（对应前端 `UploadResponse`）
```json
{
  "session_id": "uuid",
  "file_name": "example.xlsx",
  "data_summary": {
    "rows": 1000,
    "columns": 12,
    "column_names": ["..."],
    "column_types": { "age": "number", "gender": "category" }
  }
}
```

#### 4.3.3 文件与数据摘要规则
- CSV：`utf-8/gbk` 自动探测（失败则要求用户指定）。
- Excel：默认第一张 sheet；可扩展支持指定 sheet。
- `column_types`：后端统一映射为 `number/category/datetime/text/bool`（或更细），并保持枚举稳定。
- 行数过大：支持抽样生成摘要（例如最多读取前 N 行用于类型推断），完整分析可延后到 Worker。

### 4.4 Sessions：`GET /api/v2/sessions`

#### 4.4.1 Query（对应前端 `SessionsQuery`）
`page, size, keyword, industry, method, start_date, end_date`

#### 4.4.2 响应（对应前端 `SessionsResponse`）
```json
{
  "total": 123,
  "page": 1,
  "items": [
    {
      "session_id": "...",
      "created_at": "...",
      "updated_at": "...",
      "file_name": "...",
      "industry": "finance",
      "first_query": "...",
      "methods_used": ["t_test"],
      "message_count": 6
    }
  ]
}
```

### 4.5 Session 详情：`GET /api/v2/session/{id}`

#### 4.5.1 响应（对应前端 `SessionDetail`）
- `messages[].timestamp`：建议返回字符串；前端渲染时转换为 `Date`。

### 4.6 删除会话：`DELETE /api/v2/session/{id}`
- 行为：软删除（推荐）或硬删除（需要级联清理 uploads/exports）。
- 返回：`204 No Content`。

### 4.7 导出：`POST /api/v2/export`

#### 4.7.1 请求（对应前端 `ExportRequest`）
```json
{ "session_id": "uuid", "format": "md|docx", "include_charts": true }
```

#### 4.7.2 响应（对应前端 `ExportResponse`）
```json
{ "download_url": "https://.../exports/...", "file_name": "report-xxx.docx" }
```

#### 4.7.3 产物内容建议
- 标题页：会话信息（行业/文件/时间）
- 数据摘要：列、类型、缺失概况
- 对话与结论：关键问答、最终结论、显著性与效应量
- 图表（可选）：由后端渲染为图片并嵌入（DOCX）或以链接/图片引用（Markdown）

### 4.8 配置：模型与 Prompt

#### 4.8.1 `GET/PUT /api/v2/config/model`（对应 `ModelConfig`）
```json
{
  "provider": "openai|claude|zhipu|qwen|custom",
  "api_key": "string",
  "base_url": "string (可选)",
  "model": "string",
  "temperature": 0.2,
  "max_tokens": 2048,
  "top_p": 1
}
```

#### 4.8.2 `POST /api/v2/config/model/test`（对应 `TestConnection*`）
- 行为：用最小 token 的探活 prompt 调用一次，返回 `success/message`。

#### 4.8.3 `GET/PUT /api/v2/config/prompts`（对应 `PromptTemplates`）
```json
{ "intent": "...", "planning": "...", "interpret": "..." }
```

---

## 5. 统计分析引擎（Engine）详细设计

### 5.1 数据类型识别
输入：DataFrame + 列名  
输出：`column_types`（用于摘要与方法选择）
- number：可转 float/int
- category：低基数字符串/枚举
- datetime：可解析日期时间
- bool：0/1/true/false
- text：高基数字符串

### 5.2 预处理能力（v2.0）
- 缺失处理：仅做统计摘要提示；默认不自动填充（避免引入偏差），但可在 planner 里提出建议。
- 异常值：默认只检测并提示（IQR/Z-score），不自动删除；支持用户指令“去掉异常值再分析”。
- 过滤：支持基于用户指令/规则过滤子集（建议显式确认，避免误删）。

### 5.3 方法集合（可扩展）
建议实现最小闭环：
- 两组均值差异：t-test（独立/配对），Mann–Whitney U（非正态）
- 多组差异：ANOVA，Kruskal–Wallis
- 列联表：卡方检验（含期望频数检查）
- 相关性：Pearson/Spearman
- 回归：线性回归（含残差图），（可选）Logistic 回归

### 5.4 效应量与显著性
输出对齐前端 `EffectSize`：
- `cohens_d`：两组差异
- `eta_squared`：ANOVA
- `cramers_v`：卡方
- `r_squared`：回归

`level` 分级建议（可按领域调整）：
- small/medium/large：基于常见阈值（例如 Cohen’s d：0.2/0.5/0.8）

### 5.5 可视化数据生成
输出对齐前端 `ChartConfig`：
- scatter：回归/相关
- box：组间分布
- bar：分类对比
- distribution：直方图/密度
- residual：残差图

建议固定 `data` 结构（示例）：
- `scatter/residual`: `{ "points": [[x1,y1],[x2,y2],...] }`
- `box`: `{ "groups": ["A","B"], "values": [[...],[...]] }`
- `distribution`: `{ "bins": [[l,r],...], "counts": [c1,c2,...] }`
- `bar`: `{ "table": { "row": { "col": count }}}`（来自 `pandas.crosstab().to_dict()`）

---

## 6. LLM 智能层（Prompt 与 Tooling）

### 6.1 三段式 Prompt（建议默认）
- `intent`：抽取结构化任务（X/Y/任务类型/约束/预处理指令）。
- `planning`：基于 `data_summary + intent` 生成 `analysis_plan`（可执行 JSON）。
- `interpret`：基于 `analysis_result + context` 输出业务解释、建议与图表选择。

### 6.2 结构化输出约束
为降低模型幻觉，建议对 LLM 输出做严格校验：
- Intent 输出：JSON Schema（必须字段/枚举约束）。
- Plan 输出：method 必须在白名单；参数范围校验；禁止执行任意代码。
- Interpret 输出：只允许引用后端提供的统计结果，不允许生成“伪数值”。

### 6.3 工具调用（可选）
若使用 LangChain/LlamaIndex：
- Tool：`get_data_summary`, `run_test(method, params)`, `compute_effect_size`, `make_charts`
- Memory：从 Redis/DB 裁剪后的对话历史

---

## 7. 安全、合规与可靠性

### 7.1 鉴权与权限（预留）
- 预留 `Authorization: Bearer <token>` 中间件。
- 关键接口（配置、导出、会话列表）支持按用户隔离（扩展 `user_id` 字段）。

### 7.2 输入校验与资源限制
- 文件大小限制（例如 20MB），行数/列数限制（防止内存打爆）。
- 请求超时与并发限制（Uvicorn/Gunicorn worker + 反向代理）。
- 速率限制：IP/Token 维度（Redis 计数）。

### 7.3 LLM 调用安全
- API Key 不写日志；日志中对敏感字段脱敏。
- 失败重试：指数退避；区分 4xx/5xx。
- 成本控制：max_tokens、上下文裁剪、缓存（同一 session 的 data_summary 复用）。

---

## 8. 可观测性与运维

### 8.1 日志与追踪
- 结构化日志：`trace_id/session_id/route/latency/model_provider/method`。
- 错误统一返回 `trace_id`，便于排障。

### 8.2 指标
- API：QPS、P95 延迟、4xx/5xx
- LLM：调用次数、token、失败率、重试次数、成本估算
- Engine：方法耗时、失败原因分布

---

## 9. 部署建议

### 9.1 单机（开发）
- `backend`：`uvicorn app.main:app --reload --port 8000`
- `redis/postgres`：docker-compose

### 9.2 生产（Kubernetes）
- API Pod：FastAPI（多副本）
- Worker Pod：导出/大分析任务
- Redis：会话与队列
- PostgreSQL：元数据与配置
- 对象存储：uploads/exports

---

## 10. 兼容性检查清单（与前端联调）
- `/api/v2/upload` 返回 `UploadResponse`，`data_summary` 字段齐全。
- `/api/v2/chat` 返回 `ChatResponse`，`analysis/suggestions/visualizations` 字段类型对齐 `frontend/src/types/*`。
- `/api/v2/sessions`、`/api/v2/session/{id}`、`DELETE /api/v2/session/{id}` 行为符合前端调用。
- `/api/v2/export` 返回可直接下载的 `download_url`。
- `/api/v2/config/*` 覆盖 `model/test/prompts`。
