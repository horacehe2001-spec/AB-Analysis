# 智能假设检验分析服务 - 前端详细设计文档

> 版本: v2.0
> 日期: 2025-01-06

---

## 1. 项目概述

### 1.1 技术栈
- **框架**: React 18 + TypeScript
- **UI组件库**: Material UI v5
- **图表**: ECharts
- **状态管理**: Zustand
- **路由**: React Router v6
- **HTTP**: Axios
- **构建**: Vite

### 1.2 核心功能
1. 数据上传（CSV/Excel，支持行业分类）
2. 对话式分析（自然语言描述需求）
3. 结果展示（统计卡片 + 图表 + 解读）
4. 历史记录（查询、筛选、恢复会话）
5. 报告导出（Markdown/Word）
6. 模型配置（Claude/OpenAI/智谱/通义千问）

---

## 2. 项目结构

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/              # API层
│   │   ├── index.ts
│   │   ├── chat.ts
│   │   ├── upload.ts
│   │   ├── sessions.ts
│   │   ├── export.ts
│   │   └── config.ts
│   ├── components/
│   │   ├── Layout/
│   │   ├── Chat/
│   │   ├── Upload/
│   │   ├── Analysis/
│   │   ├── Charts/
│   │   ├── History/
│   │   ├── Settings/
│   │   ├── Export/
│   │   └── Industry/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── store/
│   │   ├── chatStore.ts
│   │   ├── sessionStore.ts
│   │   └── configStore.ts
│   ├── types/
│   │   ├── chat.ts
│   │   ├── analysis.ts
│   │   ├── session.ts
│   │   └── config.ts
│   ├── constants/
│   │   ├── industries.ts
│   │   └── models.ts
│   ├── hooks/
│   ├── utils/
│   └── theme/
```

---

## 3. 类型定义

### 3.1 对话类型
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: AnalysisResult;
}

interface AnalysisResult {
  method: string;
  p_value: number;
  effect_size: { type: string; value: number; level: string };
  significant: boolean;
  interpretation: string;
  suggestions: string[];
  visualizations: ChartConfig[];
}
```

### 3.2 会话类型
```typescript
type Industry = 'ecommerce' | 'finance' | 'healthcare' | 'education'
  | 'manufacturing' | 'internet' | 'hr' | 'marketing' | 'other';

interface Session {
  session_id: string;
  created_at: string;
  file_name: string;
  industry?: Industry;
  first_query: string;
  methods_used: string[];
  message_count: number;
}
```

### 3.3 配置类型
```typescript
type ModelProvider = 'claude' | 'openai' | 'zhipu' | 'qwen' | 'custom';

interface ModelConfig {
  provider: ModelProvider;
  api_key: string;
  base_url?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
}
```

---

## 4. API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/v2/chat | POST | 对话分析 |
| /api/v2/upload | POST | 上传数据 |
| /api/v2/sessions | GET | 历史列表 |
| /api/v2/session/{id} | GET | 会话详情 |
| /api/v2/export | POST | 导出报告 |
| /api/v2/config/model | GET/PUT | 模型配置 |

---

## 5. 常量定义

### 5.1 行业分类
```typescript
{ value: 'ecommerce', label: '电商零售' }
{ value: 'finance', label: '金融保险' }
{ value: 'healthcare', label: '医疗健康' }
{ value: 'education', label: '教育培训' }
{ value: 'manufacturing', label: '制造业' }
{ value: 'internet', label: '互联网' }
{ value: 'hr', label: '人力资源' }
{ value: 'marketing', label: '市场营销' }
{ value: 'other', label: '其他' }
```

### 5.2 模型提供商
```typescript
claude: { baseUrl: 'https://api.anthropic.com', models: ['opus','sonnet','haiku'] }
openai: { baseUrl: 'https://api.openai.com', models: ['gpt-4-turbo','gpt-4','gpt-3.5-turbo'] }
zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas', models: ['glm-4-plus','glm-4','glm-4-flash'] }
qwen: { baseUrl: 'https://dashscope.aliyuncs.com/api', models: ['qwen-max','qwen-plus','qwen-turbo'] }
```

---

## 6. 页面设计

### 6.1 首页 (Home)
- 文件上传区（拖拽上传 + 行业选择）
- 对话消息列表
- 分析结果展示（统计卡片 + 图表）
- 输入框（支持快捷建议）

### 6.2 历史记录 (History)
- 搜索过滤栏（关键词、行业、时间、方法）
- 历史列表表格（分页）
- 操作：查看详情、导出报告、继续分析

### 6.3 模型配置 (Settings)
- 提供商选择（Claude/OpenAI/智谱/通义千问/自定义）
- API配置（API Key、Base URL、模型）
- 模型参数（Temperature、Max Tokens、Top P）
- Prompt模板编辑

---

## 7. 开发计划

| 阶段 | 任务 | 预计文件数 |
|------|------|-----------|
| 1 | 项目初始化 + 配置 | 5 |
| 2 | 类型 + 常量 | 6 |
| 3 | API层 | 5 |
| 4 | Store | 3 |
| 5 | 布局组件 | 2 |
| 6 | 上传组件 | 2 |
| 7 | 对话组件 | 5 |
| 8 | 分析结果组件 | 4 |
| 9 | 图表组件 | 5 |
| 10 | 历史页面 | 4 |
| 11 | 配置页面 | 4 |
| 12 | 导出功能 | 2 |
| 13 | 主页面 + 路由 | 3 |

**总计**: 约 50 个文件
