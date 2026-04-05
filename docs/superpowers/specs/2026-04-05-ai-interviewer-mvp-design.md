# AI Interviewer MVP Spec

日期：2026-04-05

## 1. 项目定位

AI Interviewer 是一个面向 `AI 应用工程师 / LLM 应用工程师` 求职场景的、`以 Python 后端为核心` 的岗位定制 AI 面试官与面试复盘系统。

它的目标不是做通用聊天，而是做一个可现场演示的 AI 产品闭环：

- 上传真实 PDF 简历
- 粘贴真实 JD
- 生成贴岗问题
- 基于回答做有限度动态追问
- 输出结构化复盘报告

求职展示时，项目要让面试官快速记住三点：

- 这是一个完整跑通的前后端 AI 应用
- 这是一个由 Python 后端主导业务编排和 AI 能力落地的产品
- 它的核心价值是输出有行动价值的复盘，而不是只会提问

## 2. MVP 成功标准

MVP 只要求以下闭环稳定成立：

- 用户可上传一份 PDF 简历
- 用户可粘贴一段目标岗位 JD
- 系统可发起一场 3 到 5 轮短面试
- 每轮问题与简历和 JD 有可解释关联
- 至少支持 1 到 2 次基于回答内容的动态追问
- 面试结束后可生成结构化复盘报告
- 全流程可在 5 到 8 分钟内完成演示

## 3. MVP 范围

本期必须实现：

- `简历输入`
  - 支持 PDF 上传
  - 抽取原始文本
  - 做基础结构化解析
- `JD 输入`
  - 支持文本粘贴
  - 提取岗位关键词、能力要求、业务背景
- `面试启动`
  - 基于简历解析结果和 JD 解析结果生成首轮问题
- `短轮次面试流程`
  - 控制 3 到 5 轮问答
  - 保持演示时长和稳定性
- `动态追问`
  - 至少支持回答过于笼统、缺少细节、指标无依据三类追问触发
- `结构化评分`
  - 按固定维度对每轮回答评分并给出理由
- `复盘报告`
  - 输出总评、维度分、亮点、短板、改进建议、建议追练题
- `轻量 RAG`
  - 仅用于增强问题生成和复盘质量
- `前后端闭环`
  - 前端可操作，后端有明确 API，结果可完整展示
- `Python 后端主导`
  - 核心能力集中在 FastAPI 服务、会话编排、Prompt 管理、RAG 检索、评分与复盘生成
- `Apple 风格前端`
  - 强调留白、克制、卡片层级、细腻动效与高质感排版

## 4. 非目标范围

这版明确不做：

- 用户登录、注册、权限系统
- 多人协作、多租户
- 语音识别、语音播报、录音
- 长时记忆和多场次成长档案
- 大规模题库运营后台
- 高并发、任务队列、分布式架构
- 多岗位泛化优化
- 自动生成标准答案
- 非技术岗适配
- 复杂作弊检测、视频面试、真人对练

## 5. 演示主线

推荐现场演示路径：

1. 上传一份真实 PDF 简历
2. 粘贴一个 AI 应用工程师 JD
3. 点击解析并展示岗位重点与候选人摘要
4. 开始面试，完成 2 到 3 个主问题并触发 1 到 2 次追问
5. 点击结束，生成复盘报告
6. 重点讲解复盘如何指出表达短板、证据不足和下一步改进动作

## 6. 系统边界

### 6.1 前端边界

前端只负责采集输入、承载流程、展示结果，不承担核心 AI 决策。

前端负责：

- 上传 PDF 简历、输入 JD、输入回答
- 展示简历和 JD 解析摘要
- 展示当前问题、追问、轮次和简评分
- 展示最终复盘报告
- 管理页面状态，如准备中、面试中、报告生成中、已结束
- 用 Apple 风格完成高质量演示感

前端定位：

- 是 Python 后端产品的展示层和交互层
- 不作为项目的核心技术卖点

前端不负责：

- 不直接在浏览器调用 LLM
- 不做 Prompt 拼装
- 不做 RAG 检索和重排
- 不做评分逻辑判断
- 不维护复杂业务规则

### 6.2 后端边界

后端负责业务编排、状态管理、AI 调用整合和结构化输出约束，是这个项目的核心主体。

后端负责：

- 简历结构化解析
- JD 结构化解析
- 面试会话创建与轮次推进
- 问题生成、追问生成、评分、复盘的统一编排
- RAG 检索结果注入 Prompt
- 限制总轮数、追问次数、输出 JSON 结构
- 保存会话、问答、评分和最终报告

后端在求职叙事中的核心卖点：

- 用 Python 服务把多阶段 Prompt 串成稳定流程
- 用结构化 schema 约束模型输出
- 用轻量 RAG 提升提问和复盘稳定性
- 用会话状态管理让产品像真实系统而不是单轮聊天

后端不负责：

- 不做复杂微服务拆分
- 不做异步任务平台
- 不做大规模缓存和并发优化
- 不做训练、自建模型、在线学习
- 不做重运营后台

后端在 MVP 中应是基于 `FastAPI + Pydantic` 的单体 AI orchestration service。

### 6.3 Prompt 边界

Prompt 负责定义各阶段 AI 任务的角色、约束和输出结构，但不负责状态存储。

Prompt 负责：

- 定义解析、出题、追问、评分、复盘任务
- 约束模型输出 JSON 或固定结构
- 明确评分维度、追问策略、复盘模板
- 要求输出尽量引用简历、回答和 JD 中的证据

Prompt 不负责：

- 不替代后端流程判断
- 不直接访问数据库
- 不控制会话状态迁移
- 不做知识检索
- 不承担前端展示逻辑

### 6.4 RAG 边界

RAG 在 MVP 中只做相关性和稳定性增强，不做万能知识中枢。

RAG 负责：

- 检索与 AI 应用工程师相关的题目、知识点、追问角度
- 检索与候选人项目关键词相关的参考追问方向
- 在评分和复盘阶段提供岗位关注点和改进建议参考

RAG 不负责：

- 不替代简历解析和 JD 解析
- 不承担对话记忆
- 不直接生成最终答案
- 不做开放域搜索
- 不做知识图谱和多跳推理

### 6.5 调用关系

固定链路如下：

1. 前端收集输入并调用后端接口
2. 后端整理业务上下文
3. 后端按阶段决定是否使用 RAG
4. 后端把结构化输入和检索结果交给对应 Prompt
5. LLM 返回结构化结果
6. 后端校验、裁剪、入库
7. 前端渲染结果

关键原则：

- 前端不直连模型
- RAG 不对前端单独暴露
- Prompt 不直接控制流程跳转
- 流程控制权在后端

## 7. 核心模块与输入输出

### 7.1 Resume Ingestor

职责：接收 PDF 简历、提取原始文本。

输入：

- `resume_file`
- 文件元信息

输出：

- `raw_resume_text`
- `extract_status`
- `extract_error_message`

### 7.2 Resume Parser

职责：把简历文本转成结构化候选人画像。

输入：

- `raw_resume_text`

输出：

- `candidate_profile`
- `skills`
- `projects`
- `project_highlights`
- `risk_points`
- `work_experience_summary`
- `education_summary`

### 7.3 JD Parser

职责：把 JD 文本转成岗位要求画像。

输入：

- `jd_text`

输出：

- `target_role`
- `required_skills`
- `preferred_skills`
- `business_context`
- `interview_focus`
- `jd_keywords`

### 7.4 RAG Retriever

职责：根据岗位和项目关键词检索辅助材料。

输入：

- `required_skills`
- `jd_keywords`
- `candidate_profile.skills`
- `candidate_profile.projects`
- 阶段标记：`question_generation` 或 `review_generation`

输出：

- `retrieved_topics`
- `retrieved_questions`
- `retrieved_followup_angles`
- `retrieved_review_references`

### 7.5 Interview Planner

职责：生成首轮主问题和本场面试计划。

输入：

- `candidate_profile`
- `jd_profile`
- `retrieval_context`
- 面试配置，如轮数上限和深挖开关

输出：

- `interview_plan`
- `opening_questions`
- `focus_dimensions`
- `planned_round_count`

### 7.6 Session Manager

职责：管理面试生命周期和轮次状态。

输入：

- `session_create_request`
- `session_id`
- `current_answer`
- 当前轮上下文

输出：

- `session_state`
- `current_round`
- `question_history`
- `answer_history`
- `followup_count`
- `finish_signal`

### 7.7 Answer Evaluator

职责：对当前回答做结构化评估。

输入：

- `current_question`
- `current_answer`
- `candidate_profile`
- `jd_profile`
- 可选 `retrieval_context`

输出：

- `dimension_scores`
- `evidence_spans`
- `strengths`
- `weaknesses`
- `followup_needed`
- `followup_reason`

### 7.8 Follow-up Engine

职责：在必要时生成 1 个高质量追问。

输入：

- `current_question`
- `current_answer`
- `evaluation_result`
- `candidate_profile`
- `jd_profile`

输出：

- `followup_question`
- `followup_type`
- `followup_goal`

追问类型只保留：

- `detail_missing`
- `evidence_missing`
- `depth_missing`

### 7.9 Interview Turn Orchestrator

职责：决定本轮后续动作。

输入：

- `session_state`
- `evaluation_result`
- `followup_count`
- `remaining_rounds`

输出：

- `next_action`
- `next_question`
- `round_summary`
- `session_state_update`

可能动作：

- `ask_followup`
- `ask_next_main_question`
- `finish_interview`

### 7.10 Review Generator

职责：汇总整场面试并生成最终复盘。

输入：

- `candidate_profile`
- `jd_profile`
- `session_transcript`
- `all_round_scores`
- `retrieval_context`

输出：

- `overall_score`
- `dimension_breakdown`
- `key_strengths`
- `major_gaps`
- `improvement_suggestions`
- `recommended_practice_questions`
- `final_summary`

### 7.11 Report Presenter DTO

职责：把复盘结果整理成适合前端展示的固定结构。

输入：

- `review_report`

输出：

- `report_header`
- `score_cards`
- `strength_cards`
- `gap_cards`
- `action_items`
- `next_questions`

### 7.12 主链路

建议依赖顺序如下：

1. `Resume Ingestor`
2. `Resume Parser`
3. `JD Parser`
4. `RAG Retriever`
5. `Interview Planner`
6. `Session Manager`
7. `Answer Evaluator`
8. `Follow-up Engine`
9. `Interview Turn Orchestrator`
10. `Review Generator`
11. `Report Presenter DTO`

## 8. 前端页面与接口闭环

### 8.1 页面范围

MVP 只保留 3 个核心页面。

`/` 启动页：

- 上传 PDF 简历
- 粘贴 JD
- 展示解析摘要
- 开始面试

`/interview/[sessionId]` 面试页：

- 展示当前问题
- 接收回答
- 返回追问或下一题
- 展示轻量评分反馈
- 支持结束面试

`/report/[sessionId]` 复盘页：

- 展示总评、总分、维度评分
- 展示亮点、短板、改进建议
- 展示下一轮推荐练习题

### 8.2 页面闭环流程

1. 用户在启动页上传简历并粘贴 JD
2. 点击解析并预览
3. 系统返回简历摘要、岗位重点、预计考察方向
4. 用户点击开始面试
5. 进入面试页完成 3 到 5 轮短面试
6. 用户点击结束并生成复盘
7. 跳转报告页查看结果

### 8.3 接口范围

MVP 只暴露 5 个核心接口。

`POST /api/v1/prepare`

输入：

- `resume_file`
- `jd_text`

输出：

- `prepare_id`
- `resume_summary_preview`
- `jd_summary_preview`
- `candidate_profile`
- `jd_profile`
- `fit_focus_preview`

`POST /api/v1/interview/start`

输入：

- `prepare_id`
- `mode`
- `planned_round_count`

输出：

- `session_id`
- `first_question`
- `planned_round_count`
- `focus_dimensions`
- `session_status`

`POST /api/v1/interview/answer`

输入：

- `session_id`
- `answer_text`

输出：

- `next_action`
- `next_question`
- `turn_score_summary`
- `turn_feedback`
- `current_round`
- `remaining_rounds`
- `session_status`

`next_action` 只允许：

- `ask_followup`
- `ask_next_main_question`
- `finish_ready`

`POST /api/v1/interview/finish`

输入：

- `session_id`

输出：

- `report_id`
- `overall_score`
- `report_summary`
- `session_status`

`GET /api/v1/report/{session_id}`

输出：

- `report_header`
- `dimension_breakdown`
- `strength_cards`
- `gap_cards`
- `action_items`
- `recommended_questions`
- `final_summary`

### 8.4 MVP 级错误处理

需要覆盖：

- PDF 提取失败
- JD 为空或过短
- 模型返回结构不合法
- 面试会话不存在
- 报告生成失败

前端策略：

- 首页用轻提示卡片展示错误
- 面试页提交失败时保留输入并允许重试
- 报告失败时允许重新生成一次

## 9. Prompt 链路

MVP 建议拆成 5 类 Prompt。

### 9.1 Resume Parse Prompt

输入：

- `raw_resume_text`

输出：

- `skills`
- `projects`
- `highlights`
- `risk_points`
- `experience_summary`

要求：

- 不做过度推断
- 允许字段为空
- 项目亮点尽量保留技术动作和结果

### 9.2 JD Parse Prompt

输入：

- `jd_text`

输出：

- `target_role`
- `required_skills`
- `preferred_skills`
- `business_context`
- `interview_focus`

要求：

- 优先抽取会被面试重点追问的内容
- 不做 HR 风格泛化总结

### 9.3 Question Planning Prompt

输入：

- `candidate_profile`
- `jd_profile`
- `retrieval_context`
- `planned_round_count`

输出：

- `opening_questions`
- `question_rationale`
- `focus_dimensions`

要求：

- 问题必须能解释为什么问
- 优先围绕简历项目与岗位要求交集出题
- 避免八股题堆砌

### 9.4 Turn Evaluation + Follow-up Prompt

输入：

- `current_question`
- `current_answer`
- `candidate_profile`
- `jd_profile`
- `current_round_context`

输出：

- `dimension_scores`
- `strengths`
- `weaknesses`
- `followup_needed`
- `followup_type`
- `followup_question`

要求：

- 每次最多生成 1 个追问
- 追问只服务于补细节、补证据、补深度
- 不允许生成闲聊式开放问题

### 9.5 Final Review Prompt

输入：

- `candidate_profile`
- `jd_profile`
- `session_transcript`
- `all_turn_scores`
- `retrieval_context`

输出：

- `overall_score`
- `dimension_breakdown`
- `key_strengths`
- `major_gaps`
- `improvement_suggestions`
- `recommended_practice_questions`
- `final_summary`

要求：

- 建议必须可执行
- 每个短板尽量对应证据
- 语气要像专业面试反馈

### 9.6 Prompt 设计原则

- `单任务原则`
- `结构化输出原则`
- `证据约束原则`
- `弱推断原则`

## 10. RAG 数据范围

建议只保留 4 类知识源：

- `AI 应用工程师岗位题库`
- `岗位技能知识点清单`
- `项目追问角度模板`
- `高质量复盘表达模板`

本期不做：

- 大规模 JD 语料库
- 开放互联网检索
- 多跳知识图谱
- 标准答案库
- 大规模行业知识库

RAG 只在两个阶段介入：

- 问题生成前
- 最终复盘前

关键限制：

- 每次检索只返回少量高相关片段
- RAG 只提供参考，不直接生成最终文案
- 最终判断权在 Prompt 和后端编排

## 11. 评分与复盘输出结构

### 11.1 评分维度

固定为 5 个维度：

- `Technical Accuracy`
- `Relevance`
- `Depth`
- `Evidence`
- `Clarity`

每项 1 到 5 分。

建议权重：

- `Technical Accuracy` 30%
- `Relevance` 20%
- `Depth` 20%
- `Evidence` 15%
- `Clarity` 15%

### 11.2 单轮评分输出

建议结构：

```json
{
  "question": "你在这个 RAG 项目里为什么要加入 rerank？",
  "answer_summary": "候选人解释了召回噪声问题，但没有讲评估方法。",
  "dimension_scores": {
    "technical_accuracy": 4,
    "relevance": 5,
    "depth": 3,
    "evidence": 2,
    "clarity": 4
  },
  "strengths": [
    "能够说明 rerank 的核心作用",
    "回答基本贴合问题"
  ],
  "weaknesses": [
    "缺少具体评估指标",
    "没有说明为什么选择当前 rerank 方案"
  ],
  "followup_needed": true,
  "followup_type": "evidence_missing",
  "followup_question": "你提到效果更好，具体是用什么指标或对比实验验证的？"
}
```

### 11.3 最终复盘结构

固定包含：

- `overall_summary`
- `overall_score`
- `dimension_breakdown`
- `key_strengths`
- `major_gaps`
- `action_items`
- `recommended_practice_questions`

建议示例：

```json
{
  "overall_score": 78,
  "overall_summary": "候选人具备 AI 应用项目经验，项目表达较真实，但在指标论证和方案取舍说明上偏弱。",
  "dimension_breakdown": {
    "technical_accuracy": 4,
    "relevance": 4,
    "depth": 3,
    "evidence": 2,
    "clarity": 4
  },
  "key_strengths": [
    "能结合真实项目讲 RAG 流程设计",
    "对 Prompt 和检索增强有较明确理解"
  ],
  "major_gaps": [
    "效果提升缺少量化验证依据",
    "对失败案例和设计权衡讲述不充分"
  ],
  "action_items": [
    "为每个核心项目补齐 2 到 3 个可量化指标",
    "准备一次关于召回、rerank、生成三段链路的取舍说明",
    "练习用问题-方案-结果结构回答项目题"
  ],
  "recommended_practice_questions": [
    "如果召回结果噪声很高，你会如何定位问题出在召回还是生成阶段？",
    "为什么你的项目里需要 rerank，而不是只调 embedding 模型？",
    "你如何验证一个 Prompt 改动是真的提升效果，而不是偶然样本命中？"
  ]
}
```

## 12. 技术栈建议

为满足闭环、轻量和演示稳定性，建议技术栈保持如下：

- 前端：`Next.js + React + TypeScript + Tailwind CSS`
- 后端：`Python + FastAPI + Pydantic`
- AI：`OpenAI Compatible API`
- RAG：`FAISS + 本地 JSON/Markdown 知识源`
- 存储：`SQLite`

原则：

- 优先保证跑通和可讲
- 不引入重基础设施
- 不为 MVP 提前设计复杂系统

## 13. 风险与取舍

### 13.1 主要风险

- PDF 提取质量不稳定
- LLM 结构化输出偶发漂移
- 动态追问过多会拉长演示时间
- 复盘如果过于空泛，会削弱项目亮点

### 13.2 MVP 取舍

- 轮次缩短到 3 到 5 轮
- 每个主问题最多追问 1 次
- RAG 数据范围收窄到岗位题库和复盘模板
- 页面数量压缩到 3 页
- 接口数量压缩到 5 个

## 14. 结论

这个 MVP 应被定义为一个 `以 Python 后端为核心、可工程化落地的 AI 面试训练产品`，而不是一个聊天机器人包装层。

它的核心叙事是：

- 用真实简历和真实 JD 触发岗位定制问题
- 用 Python 后端完成解析、编排、RAG、评分和复盘的主逻辑
- 用有限度追问模拟更真实的面试过程
- 用结构化评分和复盘报告交付核心价值
- 用清晰的前后端边界、Prompt 链路和轻量 RAG 体现 AI 应用工程能力

后续实现阶段应优先保证：

- 前后端闭环稳定
- 复盘报告质量可讲
- Apple 风格界面具备展示感
- 架构不过度设计
