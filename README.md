# AI Interviewer

围绕真实简历、目标岗位和动态追问构建的 AI 模拟面试系统。

![AI Interviewer 首页展示](frontend/image%20copy%206.png)

## 项目概览

AI Interviewer 当前已经打通一条完整的前后端闭环：

- 首页 `/`：产品化首页，采用 `Pinned Canvas Narrative` 结构展示准备、聚焦和追问复盘的主线
- 准备工作区 `/prepare`：上传简历、输入岗位信息、生成准备结果
- 面试页 `/interview`：围绕准备结果启动模拟面试并进行动态追问
- 复盘页 `/report`：输出结构化复盘结果

这不是一个普通聊天机器人，而是一个围绕求职面试场景拆分出的流程型 AI 工具。

## 当前能力

- 基于 PDF 简历和目标岗位文本生成准备结果
- 抽取候选人画像、岗位画像和 `fit focus` 重点
- 启动多轮模拟面试并根据回答继续追问
- 生成结构化复盘报告
- 支持普通 JSON 接口和 SSE 流式接口
- 前端内置首页、准备工作区、面试页、复盘页的完整导航与状态恢复

## 页面结构

### 首页 `/`

- 白底产品化首页
- 左侧阶段叙事，右侧 pinned canvas 场景
- 用于解释这套产品的工作方式，不承载复杂表单

### 准备工作区 `/prepare`

- 上传简历 PDF
- 输入目标岗位 / JD
- 生成准备结果
- 为后续面试页提供 `prepare_id` 和上下文

### 面试页 `/interview`

- 从准备结果进入
- 启动模拟面试
- 接收问题、提交回答、触发继续追问

### 复盘页 `/report`

- 根据面试会话生成复盘结果
- 展示总分、摘要和结构化反馈

## 技术栈

### 前端

- Next.js 15
- React 19
- TypeScript
- Vitest

### 后端

- FastAPI
- Pydantic Settings
- OpenAI Python SDK
- Uvicorn
- SQLite

### 模型接入

- 当前默认支持 Qwen / DashScope 兼容模式
- 后端通过 `LLM_PROVIDER`、`LLM_MODEL`、`LLM_BASE_URL`、`DASHSCOPE_API_KEY` 驱动

## 仓库结构

```text
.
├── backend/                  # FastAPI 后端
│   ├── app/
│   │   ├── api/              # /api/v1/prepare、/interview、/report、/health
│   │   ├── llm/              # 模型客户端与结构化输出适配
│   │   ├── services/         # prepare / interview / report 业务流程
│   │   └── storage.py        # SQLite 持久化
│   ├── tests/
│   ├── pyproject.toml
│   └── .env.example
├── frontend/                 # Next.js 前端
│   ├── app/                  # 首页、prepare、interview、report 与 API route
│   ├── components/           # 首页叙事、流程工作区等组件
│   ├── lib/                  # 前后端请求、文案、会话快照
│   ├── package.json
│   └── .env.example
└── README.md
```

## 本地启动

### 1. 启动后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -e ".[dev]"
cp .env.example .env
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

后端默认地址：

- `http://127.0.0.1:8000`
- 健康检查：`http://127.0.0.1:8000/health`

### 2. 启动前端

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev -- --hostname 127.0.0.1 --port 3003
```

前端默认地址：

- `http://127.0.0.1:3003`

如果你希望前端指向非默认后端地址，修改 `frontend/.env.local`：

```env
BACKEND_API_BASE_URL=http://127.0.0.1:8000
```

## 环境变量

### 后端 `backend/.env`

参考 [backend/.env.example](backend/.env.example)：

```env
LLM_PROVIDER=qwen
LLM_MODEL=qwen3-32b
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_API_KEY=sk-your-dashscope-key
```

说明：

- `DASHSCOPE_API_KEY` 生效时，后端会自动按 Qwen 兼容模式接线
- `LLM_BASE_URL` 需要填写兼容模式根路径，不要写到 `/chat/completions`

### 前端 `frontend/.env.local`

参考 `frontend/.env.example`：

```env
BACKEND_API_BASE_URL=http://127.0.0.1:8000
```

## 常用命令

### 前端

```bash
cd frontend
npm run test
npm run build
npm run start -- --hostname 127.0.0.1 --port 3003
```

### 后端

```bash
cd backend
source .venv/bin/activate
python3 -m pytest
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## API 概览

后端核心接口都挂在 `/api/v1` 下：

- `POST /api/v1/prepare`
- `POST /api/v1/prepare/stream`
- `POST /api/v1/interview/start`
- `POST /api/v1/interview/start/stream`
- `POST /api/v1/interview/answer`
- `POST /api/v1/interview/answer/stream`
- `POST /api/v1/interview/finish`
- `POST /api/v1/interview/finish/stream`
- `GET /api/v1/report/{session_id}`
- `GET /health`

前端通过 `frontend/app/api/*` route handlers 转发这些请求，因此浏览器端通常访问的是：

- `/api/prepare`
- `/api/interview/start`
- `/api/interview/answer`
- `/api/interview/finish`
- `/api/report/:sessionId`

## 测试状态

当前仓库至少包含这两类验证链路：

- 前端组件与流程测试：`vitest`
- 后端接口与模型客户端测试：`pytest`

推荐在提交前至少执行：

```bash
cd frontend && npm run test && npm run build
cd ../backend && python3 -m pytest
```

## 当前产品方向

当前首页方向不是传统营销页，而是：

- 白底高端工具风
- `Pinned Canvas Narrative` 叙事结构
- 首页负责建立产品理解
- `/prepare` 承接真实操作

后续继续演进时，建议保持这个分工，不要再把复杂准备表单塞回首页。
