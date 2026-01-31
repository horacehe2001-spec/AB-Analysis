# SPC 智能分析 Agent 技术架构设计文档

- **版本**：V1.0
- **日期**：2026年1月
- **对应产品文档**：SPC智能分析Agent产品功能设计文档 V1.0

---

## 1. 系统总体架构

### 1.1 设计原则
本系统采用**前后端分离**架构，以微服务思想构建Agent能力层。核心设计原则如下：
-   **高内聚低耦合**：各Agent模块（判断、计算、检测）独立封装，通过标准接口通信。
-   **无状态服务**：计算服务不保存中间状态，便于水平扩展。
-   **异步优先**：耗时的可分析任务和预警推送采用异步消息队列解耦。

### 1.2 逻辑架构图

```mermaid
graph TD
    Client[客户端 (Web/Mobile/API)] --> Gateway[API 网关 (Nginx/Kong)]
    
    subgraph "应用服务层 (Application Layer)"
        Gateway --> AuthSvc[认证授权服务]
        Gateway --> TaskSvc[任务调度服务]
        Gateway --> ReportSvc[报告生成服务]
    end
    
    subgraph "Agent 核心层 (Core Agent Layer)"
        TaskSvc -.-> |消息队列| MQ[RabbitMQ/Kafka]
        MQ --> JudgeAgent[数据判断 Agent]
        MQ --> CalcAgent[统计计算 Agent]
        MQ --> DetectAgent[异常检测 Agent]
        MQ --> AlertAgent[预警通知 Agent]
        
        JudgeAgent --> CalcAgent
        CalcAgent --> DetectAgent
        DetectAgent --> AlertAgent
    end
    
    subgraph "数据存储层 (Data Layer)"
        DB[(SQLite)]
        Cache[(Redis)]
        FileStore[对象存储 (MinIO/S3)]
    end
    
    JudgeAgent & CalcAgent & DetectAgent --> DB
    JudgeAgent & CalcAgent & DetectAgent --> Cache
    TaskSvc --> FileStore
```

### 1.3 技术栈选型

| 模块 | 技术选型 | 理由 |
| :--- | :--- | :--- |
| **前端** | React 18 + TypeScript + ECharts | 强大的组件生态，ECharts在统计图表由于其专业性是首选 |
| **后端框架** | Python FastAPI | 高性能异步IO，完美兼容数据科学库（Pandas/NumPy） |
| **大模型/智能生成** | 智普 GLM-4.6 | 中文优化，负责智能诊断话术/建议生成 |
| **数据处理** | Pandas, NumPy, SciPy | 业界标准的统计计算库，向量化运算保证性能 |
| **数据库** | SQLite 3.44+ | 轻量单机持久化（启用 WAL 提升并发），Redis 继续负责缓存 |
| **缓存** | Redis 7 | 缓存中间计算结果、Session管理、频率限制 |
| **消息队列** | RabbitMQ | 保证异步任务的可靠投递 |
| **部署** | Docker + Kubernetes | 容器化部署，弹性伸缩 |

---

## 2. 核心模块与算法设计

### 2.1 数据判断模块 (Judge Agent)

该模块负责解析原始数据并推断数据属性。

**核心逻辑流程：**
1.  **数据清洗**：去除空值、非数值字符清洗。
2.  **类型推断**：
    -   `is_discrete`: `unique_count / total_count < 0.05` OR `dtype` is integer.
    -   如果 `is_discrete` 为真，进一步尝试分类为 `二元数据` (0/1, OK/NG) 或 `计数数据` (0, 1, 2...)。
3.  **样本量识别**：
    -   检测是否存在分组列。若无，默认按时间序 `n=1`。
    -   若有分组，计算每组样本量 `sample_size`。

### 2.2 统计计算模块 (Calculation Agent)

负责基于选择的控制图类型计算控制限（CL, UCL, LCL）。

**算法实现标准：**
-   **Xbar-R**:
    -   $CL = \bar{\bar{X}}$
    -   $UCL = \bar{\bar{X}} + A_2\bar{R}$
    -   $LCL = \bar{\bar{X}} - A_2\bar{R}$
    -   常数 $A_2$ 查表内置于系统常量库。
-   **I-MR**:
    -   $MR_i = |X_i - X_{i-1}|$
    -   $CL = \bar{X}$
    -   $UCL = \bar{X} + 2.66 \times \bar{MR}$
    -   $LCL = \bar{X} - 2.66 \times \bar{MR}$

### 2.3 异常检测模块 (Detection Agent)

实现8条西联规则。采用 **滑动窗口 (Sliding Window)** 算法优化性能。

**数据结构设计：**
-   输入：时间序列数据点数组 `Points[]`, 控制限 `Limit`。
-   标准化：将所有点转换为 Z-score: $Z_i = (X_i - CL) / \sigma$。

**规则实现逻辑 (Z-score 简化版)：**
1.  **规则1 (1个点 > 3σ)**: `abs(Z[i]) > 3`
2.  **规则2 (连续9点同侧)**: `CheckRun(Z[i-8:i], sign)`
3.  **规则3 (连续6点递增/减)**: `CheckTrend(Points[i-5:i])`
4.  **规则4 (连续14点交替)**: `CheckAlternating(Points[i-13:i])`
...以此类推。

---

## 3. 数据库设计

### 3.1 ER 图概念模型

-   `Project` (项目/工作空间) 1:N `Dataset`
-   `Dataset` (原始数据) 1:N `AnalysisTask`
-   `AnalysisTask` (分析任务) 1:1 `ControlChartResult`
-   `ControlChartResult` 1:N `AnomalyPoint`

### 3.2 关键表结构定义

#### 3.2.1 分析任务表 (analysis_tasks)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| dataset_id | UUID | 关联数据集 |
| status | VARCHAR | PENDING, PROCESSING, COMPLETED, FAILED |
| chart_type | VARCHAR | Xbar-R, I-MR, P, NP, C, U |
| config_json | JSONB | 分析配置（用户指定的列、样本量等） |
| created_at | TIMESTAMP | 创建时间 |

#### 3.2.2 计算结果表 (calculation_results)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| task_id | UUID | 关联任务 |
| cl | FLOAT | 中心线 |
| ucl | FLOAT | 控制上限 |
| lcl | FLOAT | 控制下限 |
| sigma | FLOAT | 估算的Sigma值 |
| series_data | JSONB | 处理后的绘图数据序列 (数组) |

#### 3.2.3 异常记录表 (anomalies)
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | BIGINT | 主键 |
| task_id | UUID | 关联任务 |
| point_index | INT | 数据点索引 |
| rule_id | INT | 触发的西联规则ID (1-8) |
| severity | VARCHAR | CRITICAL, WARNING, INFO |
| value | FLOAT | 异常时的数值 |

---

## 4. API 接口设计

### 4.1 数据上传
-   **URL**: `POST /api/v1/datasets/upload`
-   **Content-Type**: `multipart/form-data`
-   **Response**:
    ```json
    {
      "dataset_id": "uuid...",
      "preview": [...],          // 前10行预览
      "columns": [               // 自动识别的列信息
        {"name": "measure_val", "type": "float", "suggested_role": "value"},
        {"name": "batch_no", "type": "string", "suggested_role": "group"}
      ]
    }
    ```

### 4.2 提交分析任务
-   **URL**: `POST /api/v1/analysis`
-   **Body**:
    ```json
    {
      "dataset_id": "uuid...",
      "value_column": "measure_val",
      "group_column": "batch_no",  // 可选
      "chart_type": "auto",       // "auto" 或指定类型如 "Xbar-R"
      "rules_enabled": [1, 2, 3, 4] // 启用的检测规则
    }
    ```

### 4.3 获取分析结果
-   **URL**: `GET /api/v1/analysis/{task_id}/result`
-   **Response**:
    ```json
    {
      "status": "COMPLETED",
      "chart_info": {
        "type": "Xbar-R",
        "ucl": 10.5,
        "cl": 10.0,
        "lcl": 9.5
      },
      "series": [
        {"x": "Batch001", "y": 10.1, "is_anomaly": false},
        {"x": "Batch002", "y": 10.8, "is_anomaly": true, "rule_violated": [1]}
      ],
      "anomalies_summary": {
        "total_count": 1,
        "rules_breakdown": {"1": 1}
      }
    }
    ```

---

## 5. 非功能性需求设计

### 5.1 性能要求
-   **响应时间**：10万级别数据点的分析计算需在 1秒 内完成（利用 NumPy 向量化优势）。
-   **并发能力**：支持至少 100 QPS 的并发分析请求。

### 5.2 安全性
-   **数据隔离**：基于 Workspace/Project 的逻辑隔离，确保用户只能访问自己的数据。
-   **输入验证**：严格校验上传文件格式，防止 CSV注入 攻击。

### 5.3 扩展性
-   **规则引擎**：设计为插件式架构，便于未来增加除了西联规则之外的自定义企业规则。

| **???/????** | ?? GLM-4.6 | ?????????????/???? |
