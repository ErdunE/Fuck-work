# FuckWork - 完整实施计划总纲领

**Version:** 2.0  
**Created:** December 8, 2025  
**Status:** Phase 1 Complete | Phase 2 In Progress  
**Timeline:** 6 Months (Month 1 Complete)  
**Document Type:** Supreme Guiding Document

---

## 文档说明

这是 FuckWork 项目的**最高指导文档**。

**用途：**
- 📍 随时了解当前进度
- 🎯 明确下一步行动
- 🗺️ 理解完整系统架构
- ✅ 验收每个里程碑
- 🔄 Review 时的参考基准

**原则：**
- 本文档是"活文档"，随项目推进更新
- 所有重大决策必须反映在此文档
- 任何架构调整必须更新此文档
- 每个 Phase 完成后更新状态

---

# 第一部分：项目愿景与目标

## 1.1 核心问题陈述

**现状痛点：**

作为国际学生求职者，我每天面临：

1. **假职位泛滥（70% 痛点）**
   - LinkedIn/Indeed 上大量 body shop、外包、evergreen 假职位
   - 浪费大量时间阅读和评估垃圾职位
   - 无法判断哪些是真实的招聘意图

2. **投递流程繁琐（20% 痛点）**
   - 即使用 Simplify，每天投 30-50 份简历仍需 2-3 小时
   - 手动选择简历版本
   - 手动生成 cover letter
   - 手动填写复杂问题
   - 手动追踪投递记录

3. **缺乏系统性（10% 痛点）**
   - 不知道哪些职位真正值得投
   - 无法批量管理和决策
   - 容易遗漏好机会
   - 投递质量不一致

**时间成本：**
- 当前：每天 2-3 小时，大部分浪费在假职位上
- 情感成本：疲惫、挫败感、低效

---

## 1.2 项目愿景

**打造一个智能的、自动化的求职编排系统，让求职者：**

1. **过滤垃圾**
   - 系统自动抓取、评估、过滤职位
   - 只看到高质量、真实的机会
   - 节省 70% 的筛选时间

2. **批量决策**
   - 每天看一个精选列表（50 个高质量职位）
   - 5-10 分钟快速审核
   - 批量选择、一键提交

3. **智能投递**
   - 系统自动准备简历、cover letter、答案
   - 用户最后确认或完全自动
   - 从 2-3 小时 → 30 分钟

4. **全程追踪**
   - 自动记录所有投递
   - 状态更新
   - 数据分析

**最终状态：**
```
早上 9:00 - 打开应用，系统已准备好今天的 50 个职位
早上 9:10 - 快速审核，勾选 30 个
早上 9:15 - 点击「批量投递」，喝杯咖啡
早上 9:45 - 系统投完，查看报告
早上 10:00 - 开始做其他事情

节省时间：从每天 3 小时 → 45 分钟
投递数量：从 20 个 → 30-50 个
投递质量：从混乱 → 精准
```

---

## 1.3 核心价值主张

**差异化：**

| 功能 | Simplify | Teal | Jobright | **FuckWork** |
|------|----------|------|----------|--------------|
| Autofill | ✅ | ✅ | ✅ | ✅ |
| Job Tracker | ✅ | ✅ | ✅ | ✅ |
| **真实性评分** | ❌ | ❌ | ❌ | ✅ ⭐ |
| **自动职位发现** | ❌ | ❌ | 部分 | ✅ ⭐ |
| **AI 智能问答** | ❌ | ❌ | 部分 | ✅ ⭐ |
| **批量自动投递** | ❌ | ❌ | ❌ | ✅ ⭐ |
| **本地优先/隐私** | ❌ | ❌ | ❌ | ✅ ⭐ |

**我们的独特价值：**
1. **真实性评分** - 过滤 70% 假职位（无人在做）
2. **主动发现** - 系统每天推送新职位（不需要手动搜索）
3. **智能编排** - 从发现到投递的完整自动化
4. **本地优先** - 数据隐私，不依赖云服务

---

# 第二部分：完整系统架构

## 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LAYER 1: 数据采集层                                 │
│                      (每天自动运行)                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────┐│
│  │  GitHub Jobs 采集器   │  │ LinkedIn Guest API   │  │ 浏览器扩展     ││
│  │  (完全合法)           │  │ (免费，灰色地带)     │  │ (用户主动)     ││
│  │                      │  │                      │  │                ││
│  │  • Markdown 解析     │  │  • REST API 调用     │  │  • 页面提取    ││
│  │  • 500 jobs/day      │  │  • 200-500 jobs/day  │  │  • 20-30 /day  ││
│  │  • 零风险            │  │  • 低风险            │  │  • 零风险      ││
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬───────┘│
│             │                         │                       │        │
│             └─────────────────────────┼───────────────────────┘        │
│                                       ↓                                │
└───────────────────────────────────────────────────────────────────────┘
                                        │
                                        ↓
┌───────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: 数据处理层                                 │
│                    (实时处理)                                          │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                   PostgreSQL 数据库                               │ │
│  │  • jobs 表 (所有职位，30-90天过期)                                │ │
│  │  • users 表 (用户账号)                                            │ │
│  │  • profiles 表 (用户 profile + 简历)                             │ │
│  │  • applications 表 (投递记录)                                     │ │
│  │  • queue 表 (待投递队列)                                          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                       ↓                                │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │              Python 后端引擎 (FastAPI)                            │ │
│  │                                                                   │ │
│  │  [1] 去重引擎        → URL + 公司 + 标题去重                      │ │
│  │  [2] 真实性评分      → Phase 1 引擎 (51 rules)                   │ │
│  │  [3] 简历匹配引擎    → 选择最佳简历版本                           │ │
│  │  [4] AI 问答引擎     → 生成个性化回答                             │ │
│  │  [5] 投递编排引擎    → 协调自动投递流程                           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬──────────────────────────────────────┘
                                 ↓
┌───────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: 用户界面层                                 │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │            桌面应用 (Tauri + React)                               │ │
│  │                                                                   │ │
│  │  [界面 1] Profile 管理                                            │ │
│  │    • 个人信息、教育、工作经历                                      │ │
│  │    • 简历上传 + AI 解析                                           │ │
│  │    • 技能、项目、奖项                                              │ │
│  │                                                                   │ │
│  │  [界面 2] 今日职位队列                                            │ │
│  │    • 系统推荐：30 个可自动投，20 个需审核                          │ │
│  │    • 筛选：真实度、匹配度、日期                                    │ │
│  │    • 批量选择 + 一键提交                                           │ │
│  │                                                                   │ │
│  │  [界面 3] 投递监控                                                │ │
│  │    • 实时进度显示                                                  │ │
│  │    • 成功/失败统计                                                 │ │
│  │    • 异常处理                                                      │ │
│  │                                                                   │ │
│  │  [界面 4] 投递历史                                                │ │
│  │    • 所有申请记录                                                  │ │
│  │    • 状态追踪                                                      │ │
│  │    • 导出 CSV                                                     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬──────────────────────────────────────┘
                                 ↓
┌───────────────────────────────────────────────────────────────────────┐
│                 LAYER 4: 自动化执行层                                  │
│                 (批量投递引擎)                                          │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │          投递引擎 (Python Playwright)                             │ │
│  │                                                                   │ │
│  │  [组件 1] 浏览器自动化                                            │ │
│  │    • 自动打开职位页面                                              │ │
│  │    • 模拟人类行为（随机延迟、鼠标移动）                            │ │
│  │    • Session 管理                                                 │ │
│  │                                                                   │ │
│  │  [组件 2] Simplify 集成                                           │ │
│  │    • 检测 Simplify 是否可用                                       │ │
│  │    • 触发 autofill                                                │ │
│  │    • 验证填充完成                                                  │ │
│  │                                                                   │ │
│  │  [组件 3] AI 问答集成                                             │ │
│  │    • 检测开放性问题                                                │ │
│  │    • 调用 LLM 生成答案                                            │ │
│  │    • 填入表单                                                      │ │
│  │                                                                   │ │
│  │  [组件 4] 节奏控制                                                │ │
│  │    • 每个职位间隔 1-3 分钟（随机）                                 │ │
│  │    • 每小时最多 20 个申请                                          │ │
│  │    • 避免 bot 检测                                                │ │
│  │                                                                   │ │
│  │  [组件 5] 异常处理                                                │ │
│  │    • 验证码 → 通知用户                                            │ │
│  │    • 网络错误 → 重试 3 次                                         │ │
│  │    • 未知页面 → 跳过并记录                                        │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2.2 数据流详解

### 数据采集流 (每天自动运行)

```
08:00 AM - 定时任务触发
    ↓
[采集器 1: GitHub Jobs]
    → GET markdown 文件
    → 解析表格 (Company | Role | Location | Link | Date)
    → 提取 ~500 个职位
    → 检查数据库是否存在 (URL 去重)
    → 保存新职位
    ↓
[采集器 2: LinkedIn Guest API]
    → API 调用 (keywords: "Software Engineer New Grad")
    → 过滤 past 24 hours
    → 解析 JSON 响应
    → 提取 ~200-500 个职位
    → URL 去重
    → 保存新职位
    ↓
[评分引擎: 批量处理]
    → SELECT * FROM jobs WHERE authenticity_score IS NULL
    → 逐个调用 Phase 1 scorer
    → 更新 authenticity_score, level, confidence, red_flags
    → 标记 recommended_action (auto_apply / manual_review / skip)
    ↓
[去重 + 清理]
    → 删除完全重复的职位
    → 合并相似职位（同公司同标题不同 URL）
    → 删除过期职位 (expires_at < NOW)
    ↓
08:15 AM - 采集完成
    → 数据库新增：700-1000 个职位
    → 所有职位已评分
    → 准备好供用户审核
```

---

### 用户投递流 (用户使用时)

```
用户打开桌面应用
    ↓
[主界面加载]
    → 从数据库读取今日职位
    → 筛选：authenticity_score >= 55
    → 排序：匹配度降序
    → 显示列表 (50 个职位)
    ↓
[系统推荐分类]
    → 自动投递推荐 (30 个)
       条件：score >= 80 AND match >= 70 AND easy_apply = true
    → 手动审核建议 (15 个)
       条件：score >= 60 AND match >= 60
    → 跳过 (5 个)
       条件：score < 60 OR match < 50
    ↓
[用户操作: 批量选择]
    → 勾选 25 个自动投递
    → 勾选 8 个手动审核
    → 点击「提交到队列」
    ↓
[后台处理]
    → 33 个职位加入 applications 表
    → status = 'queued'
    → 为每个职位：
       - 选择最佳简历版本 (resume matching engine)
       - 生成 cover letter (AI)
       - 预填充常见问题答案
    ↓
[用户操作: 开始投递]
    → 点击「开始批量投递」
    → 选择模式：
       [Level 1] 智能辅助（我点提交）
       [Level 2] 批量自动（我在场）
       [Level 3] 完全自动（高风险，可选）
    ↓
[投递引擎执行 - Level 1 示例]
    → 队列中第 1 个职位：
       1. 打开 URL
       2. 等待页面加载 (3-5 秒)
       3. 检测 Simplify 可用性
       4. 触发 Simplify autofill
       5. 检测复杂问题 ("Why this company?")
       6. AI 生成答案并显示预览
       7. 用户审核答案
       8. 用户点击「提交」
       9. 更新 status = 'submitted'
    → 间隔 30 秒
    → 队列中第 2 个职位：
       (重复上述流程)
    → ...
    → 完成 25 个职位
    ↓
[投递完成]
    → 生成投递报告：
       - 成功：23 个
       - 跳过：2 个 (页面异常)
       - 总时间：30 分钟
    → 更新数据库状态
    → 显示详细日志
```

---

## 2.3 数据库 Schema (PostgreSQL)

### 核心表设计

```sql
-- ============================================================
-- JOBS 表 - 所有抓取的职位
-- ============================================================
CREATE TABLE jobs (
    -- 主键
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) UNIQUE NOT NULL,  -- 平台职位 ID
    
    -- 基本信息 (P0 - 必须有)
    title VARCHAR(500) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    url TEXT UNIQUE NOT NULL,  -- URL 唯一，用于去重
    platform VARCHAR(50) NOT NULL,  -- GitHub, LinkedIn, Indeed, YC, etc.
    
    -- 职位内容
    jd_text TEXT NOT NULL,
    
    -- 时间管理
    posted_date TIMESTAMP,
    discovered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,  -- posted_date + 30 days (可配置)
    
    -- Phase 1 评分结果
    authenticity_score FLOAT,
    authenticity_level VARCHAR(20),  -- likely_real, uncertain, likely_fake
    confidence VARCHAR(20),  -- Low, Medium, High
    red_flags JSONB,  -- ["Posted by recruiter", "Old posting", ...]
    positive_signals JSONB,
    
    -- Phase 4 匹配结果
    match_score FLOAT,  -- 简历匹配度 (0-100)
    recommended_resume_id INTEGER,  -- 推荐的简历版本
    
    -- 系统推荐
    recommended_action VARCHAR(50),  -- auto_apply, manual_review, skip
    
    -- 状态管理
    status VARCHAR(50) DEFAULT 'discovered',
    -- discovered: 刚抓取，未处理
    -- scored: 已评分
    -- queued: 用户已选中，待投递
    -- applying: 投递中
    -- applied: 已投递
    -- rejected: 用户主动拒绝
    -- expired: 已过期
    
    -- 完整数据 (JSONB 灵活存储)
    poster_info JSONB,
    company_info JSONB,
    platform_metadata JSONB,
    derived_signals JSONB,
    
    -- 审计
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 性能索引
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_auth_score ON jobs(authenticity_score);
CREATE INDEX idx_jobs_match_score ON jobs(match_score);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date);
CREATE INDEX idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX idx_jobs_company ON jobs(company_name);
CREATE INDEX idx_jobs_platform ON jobs(platform);
CREATE INDEX idx_jobs_recommended_action ON jobs(recommended_action);

-- 全文搜索索引 (职位描述)
CREATE INDEX idx_jobs_jd_text_search ON jobs USING gin(to_tsvector('english', jd_text));


-- ============================================================
-- USERS 表 - 用户账号 (Month 3)
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 设置
    settings JSONB,  -- { "auto_apply_threshold": 80, "risk_level": "conservative" }
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);


-- ============================================================
-- PROFILES 表 - 用户详细信息 (Month 3)
-- ============================================================
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- 基本信息
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(255),
    email VARCHAR(255),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    
    -- 详细信息 (JSONB 灵活结构)
    education JSONB,
    -- [
    --   {
    --     "degree": "BS Computer Science",
    --     "school": "Northeastern University",
    --     "graduation_year": 2026,
    --     "gpa": 3.8,
    --     "relevant_coursework": ["Algorithms", "Machine Learning"]
    --   }
    -- ]
    
    work_experience JSONB,
    -- [
    --   {
    --     "title": "SWE Intern",
    --     "company": "Amazon",
    --     "duration": "Jun 2024 - Aug 2024",
    --     "description": "Built scalable APIs...",
    --     "tech_stack": ["Python", "AWS", "DynamoDB"]
    --   }
    -- ]
    
    skills JSONB,
    -- {
    --   "languages": ["Python", "Java", "JavaScript"],
    --   "frameworks": ["React", "Django", "Spring"],
    --   "tools": ["Git", "Docker", "AWS"],
    --   "proficiency": {
    --     "Python": "expert",
    --     "Java": "intermediate"
    --   }
    -- }
    
    projects JSONB,
    -- [
    --   {
    --     "name": "PromptLint",
    --     "description": "AI prompt validation tool",
    --     "tech_stack": ["Python", "OpenAI"],
    --     "url": "github.com/user/project",
    --     "achievements": "Used by 1000+ developers"
    --   }
    -- ]
    
    awards JSONB,
    -- [
    --   {
    --     "title": "Dean's List",
    --     "issuer": "Northeastern",
    --     "date": "2024"
    --   }
    -- ]
    
    -- 其他
    visa_status VARCHAR(50),  -- F1, H1B, Citizen, etc.
    work_authorization TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- RESUMES 表 - 简历版本管理 (Month 3)
-- ============================================================
CREATE TABLE resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,  -- "Backend", "ML", "Startup", "General"
    file_path TEXT,  -- PDF 文件路径
    
    -- AI 解析结果
    parsed_content JSONB,
    -- {
    --   "skills": ["Python", "AWS", ...],
    --   "focus_areas": ["Backend", "Infrastructure"],
    --   "key_achievements": [...],
    --   "tech_stack": [...]
    -- }
    
    focus_area VARCHAR(100),  -- Backend, ML, Full-Stack, Product
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- APPLICATIONS 表 - 投递记录 (Month 4)
-- ============================================================
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id),
    
    -- 投递内容
    cover_letter TEXT,
    ai_generated_answers JSONB,  -- { "question": "Why here?", "answer": "Because..." }
    
    -- 投递方式
    application_method VARCHAR(50),  -- manual, level1_assisted, level2_auto, level3_full_auto
    
    -- 时间追踪
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    viewed_at TIMESTAMP,  -- 公司查看简历时间（如果平台提供）
    responded_at TIMESTAMP,
    
    -- 状态追踪
    status VARCHAR(50) DEFAULT 'submitted',
    -- submitted: 刚提交
    -- viewed: 公司已查看
    -- rejected: 收到拒信
    -- interview_scheduled: 面试安排
    -- offer: 收到 offer
    -- accepted: 接受 offer
    -- withdrawn: 用户撤回
    
    -- 反馈
    rejection_reason TEXT,
    interview_notes TEXT,
    offer_details JSONB,  -- { "salary": 150000, "equity": "0.1%", ... }
    
    -- 审计
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束：同一个用户不能对同一个职位投两次
    UNIQUE(user_id, job_id)
);


-- ============================================================
-- QUEUE 表 - 投递队列 (Month 4)
-- ============================================================
CREATE TABLE queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    
    -- 队列优先级
    priority INTEGER DEFAULT 0,  -- 越高越优先
    
    -- 准备状态
    resume_selected BOOLEAN DEFAULT FALSE,
    cover_letter_generated BOOLEAN DEFAULT FALSE,
    ai_answers_ready BOOLEAN DEFAULT FALSE,
    
    -- 队列状态
    status VARCHAR(50) DEFAULT 'pending',
    -- pending: 等待处理
    -- processing: 正在投递
    -- completed: 已完成
    -- failed: 失败
    -- paused: 用户暂停
    
    -- 时间
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- 结果
    result JSONB,  -- { "success": true, "error": null, "screenshot": "..." }
    
    UNIQUE(user_id, job_id)
);


-- ============================================================
-- 视图: 今日推荐职位 (常用查询)
-- ============================================================
CREATE OR REPLACE VIEW todays_recommended_jobs AS
SELECT 
    j.*,
    CASE 
        WHEN j.authenticity_score >= 80 AND j.match_score >= 70 
             AND j.platform_metadata->>'easy_apply' = 'true' 
        THEN 'auto_apply'
        WHEN j.authenticity_score >= 60 AND j.match_score >= 60 
        THEN 'manual_review'
        ELSE 'skip'
    END as system_recommendation
FROM jobs j
WHERE 
    j.posted_date >= CURRENT_DATE - INTERVAL '7 days'
    AND j.expires_at > CURRENT_TIMESTAMP
    AND j.status NOT IN ('applied', 'rejected', 'expired')
    AND j.authenticity_score >= 55
ORDER BY 
    j.match_score DESC,
    j.authenticity_score DESC,
    j.posted_date DESC;


-- ============================================================
-- 自动清理函数 (定时运行)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除过期职位
    DELETE FROM jobs 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND status NOT IN ('applied', 'queued');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 定时任务：每天凌晨 2 点清理
-- (在 Python backend 中用 APScheduler 调用)
```

---

## 2.4 技术栈总览

```
┌─────────────────────────────────────────────────────────┐
│                   前端 / 界面                            │
├─────────────────────────────────────────────────────────┤
│  • Tauri 2.0 (桌面应用框架)                              │
│  • React 18 + TypeScript                                │
│  • TailwindCSS (样式)                                    │
│  • Zustand (状态管理)                                    │
│  • React Query (数据获取)                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                后端 / 引擎                               │
├─────────────────────────────────────────────────────────┤
│  • Python 3.11+                                         │
│  • FastAPI (REST API)                                   │
│  • SQLAlchemy (ORM)                                     │
│  • Alembic (数据库迁移)                                  │
│  • APScheduler (定时任务)                                │
│  • Playwright (浏览器自动化)                             │
│  • OpenAI/Claude API (AI 问答)                          │
│  • sentence-transformers (简历匹配)                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  浏览器扩展                              │
├─────────────────────────────────────────────────────────┤
│  • Manifest V3                                          │
│  • TypeScript                                           │
│  • Webpack 5                                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   数据库                                 │
├─────────────────────────────────────────────────────────┤
│  • PostgreSQL 16                                        │
│  • Docker (本地开发)                                     │
│  • 未来：Supabase / Neon / AWS RDS (云部署)             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    DevOps                               │
├─────────────────────────────────────────────────────────┤
│  • Git (版本控制)                                        │
│  • GitHub Actions (CI/CD)                               │
│  • Docker Compose (本地环境)                             │
│  • pytest (Python 测试)                                  │
│  • 未来：Docker + Kubernetes (云部署)                    │
└─────────────────────────────────────────────────────────┘
```

---

# 第三部分：6 个月完整实施计划

## Month 1: Phase 1 - 真实性评分引擎 ✅ COMPLETE

**状态：已完成并合并到 dev**

**交付成果：**
- ✅ 51 条评分规则（A1-A14, B1-B20, C1-C10, D1-D7）
- ✅ RuleEngine + ScoreFusion + ExplanationEngine
- ✅ 105 个测试全部通过
- ✅ FAANG 职位评分 100.0
- ✅ Scam 职位评分 2.3
- ✅ 零技术债

**里程碑验收：**
- ✅ 所有 acceptance criteria 满足
- ✅ 手动验证报告完成
- ✅ 代码合并到 dev 分支

---

## Month 2: Phase 2 - 数据采集系统 + 数据库

**当前状态：** Week 1, Stage 1/14 完成

**目标：** 建立完整的数据采集 pipeline，每天自动收集 700-1000 个职位

### **Week 1: 数据库 + GitHub Jobs 采集器**

#### Stage 1: 浏览器扩展项目脚手架 ✅ COMPLETE
- ✅ 已完成
- ✅ 已提交

#### Stage 2: PostgreSQL 数据库设计 + 部署 ⏳ NEXT
**时间：** 1 天

**任务：**
1. 创建 `apps/backend/docker-compose.yml`
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:16
       environment:
         POSTGRES_DB: fuckwork
         POSTGRES_USER: fuckwork
         POSTGRES_PASSWORD: fuckwork_dev
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. 创建 `apps/backend/database/schema.sql`
   - 复制上面的完整 schema
   - 包含所有表、索引、视图、函数

3. 创建 `apps/backend/database/models.py`
   ```python
   # SQLAlchemy ORM 模型
   from sqlalchemy import Column, Integer, String, Text, Float, TIMESTAMP, JSON
   from sqlalchemy.ext.declarative import declarative_base
   
   Base = declarative_base()
   
   class Job(Base):
       __tablename__ = 'jobs'
       id = Column(Integer, primary_key=True)
       job_id = Column(String(255), unique=True, nullable=False)
       # ... 其他字段
   ```

4. 创建 `apps/backend/database/__init__.py`
   ```python
   from sqlalchemy import create_engine
   from sqlalchemy.orm import sessionmaker
   
   DATABASE_URL = "postgresql://fuckwork:fuckwork_dev@localhost:5432/fuckwork"
   engine = create_engine(DATABASE_URL)
   SessionLocal = sessionmaker(bind=engine)
   ```

5. 测试数据库连接

**验收标准：**
- ✅ `docker-compose up -d` 启动数据库成功
- ✅ Python 连接数据库成功
- ✅ 所有表创建成功
- ✅ 测试插入/查询数据

**Commit:**
```
feat: add PostgreSQL database with complete schema

- Docker Compose配置
- 完整 schema (jobs, users, profiles, resumes, applications, queue)
- SQLAlchemy ORM 模型
- 索引优化
- 视图和清理函数

Database ready for data collection.

Phase: 2 Stage 2/14
```

#### Stage 3: GitHub Jobs 采集器
**时间：** 1-2 天

**文件结构：**
```
apps/backend/data_collection/
├── __init__.py
├── github_collector.py      # GitHub markdown 解析器
├── linkedin_collector.py    # LinkedIn API 客户端 (Stage 4)
├── base_collector.py        # 基础采集器类
└── scheduler.py             # 定时任务调度器 (Stage 7)
```

**任务：**
1. 创建 `apps/backend/data_collection/github_collector.py`
   ```python
   import requests
   import re
   from typing import List, Dict
   from datetime import datetime
   
   class GitHubJobsCollector:
       """
       从 GitHub job lists 抓取职位。
       
       数据源：
       - https://github.com/speedyapply/2026-SWE-College-Jobs
       - https://github.com/speedyapply/2026-AI-College-Jobs
       
       格式：Markdown 表格
       """
       
       SOURCES = [
           "https://raw.githubusercontent.com/speedyapply/2026-SWE-College-Jobs/main/NEW_GRAD_USA.md",
           "https://raw.githubusercontent.com/speedyapply/2026-AI-College-Jobs/main/NEW_GRAD_USA.md",
       ]
       
       def collect(self) -> List[Dict]:
           """抓取所有 GitHub job lists"""
           all_jobs = []
           
           for url in self.SOURCES:
               try:
                   response = requests.get(url, timeout=10)
                   response.raise_for_status()
                   jobs = self.parse_markdown(response.text)
                   all_jobs.extend(jobs)
               except Exception as e:
                   logger.error(f"Failed to fetch {url}: {e}")
                   continue
           
           return all_jobs
       
       def parse_markdown(self, markdown: str) -> List[Dict]:
           """
           解析 markdown 表格。
           
           格式示例：
           | Company | Role | Location | Application | Date Posted |
           |---------|------|----------|-------------|-------------|
           | Google | SWE | CA | [Apply](url) | Oct 15 |
           """
           jobs = []
           
           # 提取表格行
           lines = markdown.split('\n')
           for line in lines:
               if '|' not in line or line.startswith('|---'):
                   continue
               
               # 解析行
               cells = [c.strip() for c in line.split('|')[1:-1]]
               if len(cells) < 4:
                   continue
               
               # 提取数据
               company = cells[0]
               role = cells[1]
               location = cells[2]
               
               # 提取 URL from markdown link [text](url)
               apply_cell = cells[3]
               url_match = re.search(r'\((https?://[^\)]+)\)', apply_cell)
               if not url_match:
                   continue
               
               url = url_match.group(1)
               
               # 构建 job 对象
               job = {
                   'job_id': f"github_{hash(url) % 1000000}",
                   'title': role,
                   'company_name': company,
                   'location': location,
                   'url': url,
                   'platform': 'GitHub',
                   'jd_text': f"Role: {role} at {company}. Apply at: {url}",
                   'posted_date': datetime.now(),  # GitHub lists 不提供确切日期
                   'platform_metadata': {
                       'posted_days_ago': 0,
                       'repost_count': 0,
                       'applicants_count': None,
                       'views_count': None,
                       'actively_hiring_tag': True,  # GitHub lists 默认 active
                       'easy_apply': self.check_easy_apply(url),
                   },
                   'derived_signals': {
                       'company_domain_mismatch': False,
                       'poster_no_company': False,
                       'poster_job_location_mismatch': False,
                       'company_poster_mismatch': False,
                       'no_poster_identity': True,  # GitHub 无 poster
                   },
               }
               
               jobs.append(job)
           
           return jobs
       
       def check_easy_apply(self, url: str) -> bool:
           """检测是否是 easy apply (LinkedIn 链接)"""
           return 'linkedin.com' in url.lower()
   ```

2. 创建 `apps/backend/data_collection/base_collector.py`
   ```python
   from abc import ABC, abstractmethod
   from typing import List, Dict
   
   class BaseCollector(ABC):
       """所有采集器的基类"""
       
       @abstractmethod
       def collect(self) -> List[Dict]:
           """抓取职位，返回 JobData 格式"""
           pass
       
       def save_to_db(self, jobs: List[Dict]):
           """保存到数据库，自动去重"""
           from database import SessionLocal
           from database.models import Job
           
           session = SessionLocal()
           
           for job_data in jobs:
               # URL 去重
               existing = session.query(Job).filter(
                   Job.url == job_data['url']
               ).first()
               
               if existing:
                   continue  # 跳过重复
               
               # 创建新记录
               job = Job(**job_data)
               job.expires_at = job.posted_date + timedelta(days=30)
               session.add(job)
           
           session.commit()
           session.close()
   ```

3. 测试采集器
   ```python
   # Test script
   collector = GitHubJobsCollector()
   jobs = collector.collect()
   print(f"Collected {len(jobs)} jobs from GitHub")
   collector.save_to_db(jobs)
   ```

**验收标准：**
- ✅ 成功抓取 GitHub job lists
- ✅ 解析至少 400 个职位
- ✅ 保存到数据库无错误
- ✅ 去重逻辑正常工作

**Commit:**
```
feat: implement GitHub Jobs collector

- GitHubJobsCollector class
- Markdown table parser
- Automatic deduplication
- Tested on 2026-SWE and AI job lists
- Collected 487 jobs successfully

Data source: 100% legal, zero risk.

Phase: 2 Stage 3/14
```

#### Stage 4: 自动评分 Pipeline
**时间：** 半天

**任务：**
创建 `apps/backend/scoring_pipeline.py`

```python
from authenticity_scoring import AuthenticityScorer
from database import SessionLocal
from database.models import Job

class ScoringPipeline:
    """批量评分 pipeline"""
    
    def __init__(self):
        self.scorer = AuthenticityScorer("authenticity_scoring/data/authenticity_rule_table.json")
    
    def score_unscored_jobs(self):
        """评分所有未评分的职位"""
        session = SessionLocal()
        
        # 查询未评分职位
        unscored = session.query(Job).filter(
            Job.authenticity_score == None
        ).all()
        
        logger.info(f"Found {len(unscored)} unscored jobs")
        
        for job in unscored:
            try:
                # 转换为 scorer 需要的格式
                job_dict = job.to_dict()
                
                # 评分
                result = self.scorer.score_job(job_dict)
                
                # 更新数据库
                job.authenticity_score = result['authenticity_score']
                job.authenticity_level = result['level']
                job.confidence = result['confidence']
                job.red_flags = result['red_flags']
                job.positive_signals = result['positive_signals']
                
                # 设置推荐 action
                if result['authenticity_score'] >= 80:
                    job.recommended_action = 'auto_apply'
                elif result['authenticity_score'] >= 60:
                    job.recommended_action = 'manual_review'
                else:
                    job.recommended_action = 'skip'
                
                job.status = 'scored'
                
            except Exception as e:
                logger.error(f"Failed to score job {job.job_id}: {e}")
                continue
        
        session.commit()
        session.close()
        
        logger.info(f"Scored {len(unscored)} jobs successfully")
```

**验收：**
- ✅ 批量评分 100 个 GitHub 职位
- ✅ 所有职位有 authenticity_score
- ✅ 推荐 action 正确分类

**Commit:**
```
feat: add automatic scoring pipeline

- Batch scoring for unscored jobs
- Integration with Phase 1 scorer
- Automatic recommendation (auto_apply/manual/skip)
- Tested on 487 GitHub jobs

All jobs scored successfully.

Phase: 2 Stage 4/14
```

---

### **Week 2: LinkedIn API + 整合测试**

#### Stage 5: LinkedIn Guest API 客户端
**时间：** 1-2 天

**任务：**
创建 `apps/backend/data_collection/linkedin_collector.py`

```python
import requests
from bs4 import BeautifulSoup
from typing import List, Dict

class LinkedInGuestAPICollector:
    """
    使用 LinkedIn Guest API 抓取职位。
    
    API endpoint:
    https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search
    
    完全公开，无需认证，但灰色地带（未官方支持）。
    """
    
    BASE_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    
    def collect(self, keywords: str = "Software Engineer New Grad", 
                location: str = "United States",
                hours: int = 24) -> List[Dict]:
        """
        搜索职位并返回列表。
        
        参数：
        - keywords: 搜索关键词
        - location: 位置
        - hours: 过去 X 小时内发布的
        """
        params = {
            "keywords": keywords,
            "location": location,
            "f_TPR": f"r{hours * 3600}",  # r86400 = past 24 hours
            "start": 0,
            "count": 25,  # 每页数量
        }
        
        all_jobs = []
        
        # 分页获取 (最多 10 页 = 250 个职位)
        for page in range(10):
            params["start"] = page * 25
            
            try:
                response = requests.get(self.BASE_URL, params=params, timeout=10)
                response.raise_for_status()
                
                # LinkedIn 返回 HTML，需要解析
                jobs = self.parse_response(response.text)
                
                if not jobs:
                    break  # 没有更多职位
                
                all_jobs.extend(jobs)
                
                # 延迟避免被限流
                time.sleep(2)
                
            except Exception as e:
                logger.error(f"Failed to fetch page {page}: {e}")
                break
        
        return all_jobs
    
    def parse_response(self, html: str) -> List[Dict]:
        """解析 LinkedIn 响应 HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        job_cards = soup.find_all('div', class_='base-card')
        
        jobs = []
        for card in job_cards:
            try:
                # 提取基本信息
                title_elem = card.find('h3', class_='base-search-card__title')
                company_elem = card.find('h4', class_='base-search-card__subtitle')
                location_elem = card.find('span', class_='job-search-card__location')
                link_elem = card.find('a', class_='base-card__full-link')
                date_elem = card.find('time', class_='job-search-card__listdate')
                
                if not all([title_elem, company_elem, link_elem]):
                    continue
                
                title = title_elem.text.strip()
                company = company_elem.text.strip()
                location = location_elem.text.strip() if location_elem else ''
                url = link_elem['href']
                
                # 解析日期
                posted_date = self.parse_date(date_elem['datetime'] if date_elem else None)
                
                # 生成 job_id
                job_id = f"linkedin_{url.split('/')[-1].split('?')[0]}"
                
                # 构建 job 对象 (简化版，需要单独请求获取完整 JD)
                job = {
                    'job_id': job_id,
                    'title': title,
                    'company_name': company,
                    'location': location,
                    'url': url,
                    'platform': 'LinkedIn',
                    'jd_text': '',  # 需要单独请求
                    'posted_date': posted_date,
                    # ... 其他字段默认值
                }
                
                jobs.append(job)
                
            except Exception as e:
                logger.warning(f"Failed to parse job card: {e}")
                continue
        
        return jobs
    
    def fetch_job_details(self, job_url: str) -> str:
        """
        获取职位详细描述。
        
        API: https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}
        """
        job_id = job_url.split('/')[-1].split('?')[0]
        detail_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
        
        try:
            response = requests.get(detail_url, timeout=10)
            data = response.json()
            return data.get('description', {}).get('text', '')
        except:
            return ""
```

**验收：**
- ✅ 成功调用 LinkedIn Guest API
- ✅ 解析职位列表
- ✅ 获取职位详细描述
- ✅ 保存到数据库

**Commit:**
```
feat: implement LinkedIn Guest API collector

- LinkedIn公开API客户端
- HTML响应解析
- 职位详情获取
- 测试抓取200+职位成功

Data source: Free but grey area.

Phase: 2 Stage 5/14
```

#### Stage 6: 去重引擎
**时间：** 半天

**任务：**
创建 `apps/backend/deduplication.py`

```python
from database import SessionLocal
from database.models import Job
from difflib import SequenceMatcher

class DeduplicationEngine:
    """职位去重引擎"""
    
    def deduplicate_by_url(self):
        """URL 完全匹配去重（已在 save 时处理）"""
        pass
    
    def deduplicate_by_similarity(self, threshold: float = 0.85):
        """
        基于相似度去重。
        
        相同公司 + 相似标题 (>85% 相似度) → 视为重复
        保留最新的一个。
        """
        session = SessionLocal()
        
        jobs = session.query(Job).filter(
            Job.status == 'discovered'
        ).order_by(Job.posted_date.desc()).all()
        
        groups = {}  # company_name -> [jobs]
        
        # 按公司分组
        for job in jobs:
            company = job.company_name.lower()
            if company not in groups:
                groups[company] = []
            groups[company].append(job)
        
        # 在每个公司内检测重复
        for company, company_jobs in groups.items():
            for i, job1 in enumerate(company_jobs):
                for job2 in company_jobs[i+1:]:
                    # 计算标题相似度
                    similarity = SequenceMatcher(
                        None, 
                        job1.title.lower(), 
                        job2.title.lower()
                    ).ratio()
                    
                    if similarity >= threshold:
                        # 标记旧的为重复
                        older_job = job1 if job1.posted_date < job2.posted_date else job2
                        older_job.status = 'duplicate'
                        logger.info(
                            f"Marked duplicate: {older_job.company_name} - {older_job.title}"
                        )
        
        session.commit()
        session.close()
```

**验收：**
- ✅ 重复职位正确标记
- ✅ 保留最新版本
- ✅ 不误删不同职位

#### Stage 7: 定时任务调度器
**时间：** 半天

**任务：**
创建 `apps/backend/data_collection/scheduler.py`

```python
from apscheduler.schedulers.background import BackgroundScheduler
from .github_collector import GitHubJobsCollector
from .linkedin_collector import LinkedInGuestAPICollector
from ..scoring_pipeline import ScoringPipeline
from ..deduplication import DeduplicationEngine

class DataCollectionScheduler:
    """数据采集定时任务"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.github_collector = GitHubJobsCollector()
        self.linkedin_collector = LinkedInGuestAPICollector()
        self.scoring_pipeline = ScoringPipeline()
        self.dedup_engine = DeduplicationEngine()
    
    def start(self):
        """启动定时任务"""
        
        # 每天早上 8:00 运行完整采集
        self.scheduler.add_job(
            self.daily_collection,
            'cron',
            hour=8,
            minute=0,
            id='daily_collection'
        )
        
        # 每小时运行一次评分 (处理用户手动添加的)
        self.scheduler.add_job(
            self.scoring_pipeline.score_unscored_jobs,
            'cron',
            minute=0,
            id='hourly_scoring'
        )
        
        # 每天凌晨 2:00 清理过期
        self.scheduler.add_job(
            self.cleanup_expired,
            'cron',
            hour=2,
            minute=0,
            id='cleanup'
        )
        
        self.scheduler.start()
        logger.info("Scheduler started")
    
    def daily_collection(self):
        """每日数据采集流程"""
        logger.info("Starting daily collection...")
        
        # 1. GitHub
        github_jobs = self.github_collector.collect()
        self.github_collector.save_to_db(github_jobs)
        logger.info(f"GitHub: {len(github_jobs)} jobs")
        
        # 2. LinkedIn
        linkedin_jobs = self.linkedin_collector.collect()
        self.linkedin_collector.save_to_db(linkedin_jobs)
        logger.info(f"LinkedIn: {len(linkedin_jobs)} jobs")
        
        # 3. 去重
        self.dedup_engine.deduplicate_by_similarity()
        logger.info("Deduplication complete")
        
        # 4. 评分
        self.scoring_pipeline.score_unscored_jobs()
        logger.info("Scoring complete")
        
        logger.info("Daily collection complete")
    
    def cleanup_expired(self):
        """清理过期职位"""
        from database import SessionLocal
        session = SessionLocal()
        
        deleted = session.execute(
            "SELECT cleanup_expired_jobs()"
        ).scalar()
        
        session.close()
        logger.info(f"Cleaned up {deleted} expired jobs")
```

**验收：**
- ✅ 定时任务正常运行
- ✅ 每天 8:00 自动采集
- ✅ 日志记录完整

**Commit:**
```
feat: add data collection scheduler

- Daily collection at 8:00 AM
- Hourly scoring
- Nightly cleanup
- APScheduler integration

Automated pipeline complete.

Phase: 2 Stage 7/14
```

---

### **Week 3-4: 浏览器扩展（补充数据源）**

**目标：** 用户浏览时额外保存职位

**Stages 8-14:** 继续之前的浏览器扩展计划，但调整为：
- 主要用途：补充数据源（用户手动关注的职位）
- 次要用途：显示评分（如果数据库已有）
- 保存到 PostgreSQL（不是 localStorage）

---

## Month 3: Phase 3 - 用户系统 + Profile 管理

**目标：** 用户可以创建账号、填写 profile、上传简历

### Week 1: 账号系统

**Stage 1: 用户注册/登录**
- 本地账号（SQLite auth table 或 PostgreSQL users 表）
- 密码加密（bcrypt）
- Session 管理

**Stage 2: 账号设置**
- 投递偏好（风险等级、自动化程度）
- 通知设置

**验收：**
- ✅ 用户可以注册
- ✅ 登录后看到个性化界面

---

### Week 2-3: Profile 管理

**Stage 3: Profile 表单界面**
- 个人信息录入
- 教育背景
- 工作经历
- 技能列表
- 项目经历
- 奖项

**Stage 4: 简历上传**
- PDF 上传
- 多简历版本管理（Backend, ML, Startup, General）

**Stage 5: AI 简历解析**
```python
def parse_resume_with_ai(pdf_path: str) -> Dict:
    """
    用 AI 解析简历 PDF。
    
    流程：
    1. PDF → 文本提取 (pdfplumber)
    2. 文本 → OpenAI/Claude API
    3. 结构化输出 → profile JSON
    """
    # Extract text
    text = extract_text_from_pdf(pdf_path)
    
    # AI 解析
    prompt = f"""
    解析以下简历，提取结构化信息：
    
    {text}
    
    返回 JSON 格式：
    {{
      "education": [...],
      "work_experience": [...],
      "skills": [...],
      "projects": [...],
      "awards": [...]
    }}
    """
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)
```

**验收：**
- ✅ 用户可以上传 PDF
- ✅ AI 自动解析并填充 profile
- ✅ 用户可以手动编辑

---

### Week 4: 简历-职位匹配引擎 (基础版)

**Stage 6: 匹配算法实现**

```python
class ResumeMatchingEngine:
    """简历-职位匹配引擎"""
    
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def match_job_to_resume(self, job: Job, resumes: List[Resume]) -> Dict:
        """
        为职位选择最佳简历。
        
        返回：
        {
          "best_resume_id": 3,
          "match_score": 85.2,
          "required_coverage": 0.80,
          "missing_skills": ["Kubernetes", "GraphQL"],
          "strengths": ["Python", "AWS", "APIs"]
        }
        """
        # 提取职位技能
        job_skills = self.extract_skills(job.jd_text)
        
        # 计算每个简历的匹配度
        matches = []
        for resume in resumes:
            resume_skills = resume.parsed_content.get('skills', [])
            
            # 技能覆盖率
            coverage = len(set(job_skills) & set(resume_skills)) / len(job_skills)
            
            # 语义相似度 (embeddings)
            job_emb = self.model.encode(job.jd_text)
            resume_emb = self.model.encode(json.dumps(resume.parsed_content))
            similarity = cosine_similarity([job_emb], [resume_emb])[0][0]
            
            # 综合评分
            match_score = (coverage * 0.6 + similarity * 0.4) * 100
            
            matches.append({
                'resume_id': resume.id,
                'match_score': match_score,
                'coverage': coverage,
            })
        
        # 返回最佳匹配
        best = max(matches, key=lambda x: x['match_score'])
        return best
```

**验收：**
- ✅ 为 100 个职位选择最佳简历
- ✅ 匹配分数合理
- ✅ 用户可以手动覆盖

---

## Month 4: Phase 4 - 桌面应用 UI

**目标：** 批量审核界面 + 队列管理

### Week 1: Tauri 框架搭建

**Stage 1: Tauri 项目初始化**
```bash
cd apps
npm create tauri-app
# 选择：React + TypeScript
```

**Stage 2: 与后端 API 集成**
- Tauri commands 调用 Python backend
- 或 HTTP API 调用

**Stage 3: 基础 UI 框架**
- React Router 设置
- 导航栏
- 基础布局

**验收：**
- ✅ Tauri app 启动成功
- ✅ 可以调用 backend API
- ✅ 基础界面显示

---

### Week 2-3: 职位列表 + 筛选界面 ⭐ 核心

**Stage 4: 职位列表组件**

```typescript
interface JobListProps {
  jobs: Job[];
  onSelect: (jobIds: string[]) => void;
}

const JobList: React.FC<JobListProps> = ({ jobs, onSelect }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState({
    minAuthScore: 55,
    minMatchScore: 60,
    recommendedAction: 'all',  // all, auto_apply, manual_review
  });
  
  // 筛选逻辑
  const filteredJobs = jobs.filter(job => 
    job.authenticity_score >= filter.minAuthScore &&
    job.match_score >= filter.minMatchScore &&
    (filter.recommendedAction === 'all' || 
     job.recommended_action === filter.recommendedAction)
  );
  
  return (
    <div className="job-list">
      {/* 筛选器 */}
      <FilterBar filter={filter} onChange={setFilter} />
      
      {/* 职位列表 */}
      {filteredJobs.map(job => (
        <JobCard 
          key={job.id}
          job={job}
          selected={selected.has(job.id)}
          onSelect={() => toggleSelect(job.id)}
        />
      ))}
      
      {/* 批量操作 */}
      <BatchActions 
        selectedCount={selected.size}
        onSubmit={() => onSelect(Array.from(selected))}
      />
    </div>
  );
};
```

**JobCard 设计：**
```typescript
const JobCard: React.FC<{job: Job, selected: boolean}> = ({ job, selected }) => (
  <div className={`job-card ${selected ? 'selected' : ''}`}>
    <div className="job-header">
      <input type="checkbox" checked={selected} />
      <h3>{job.title}</h3>
      <span className="company">{job.company_name}</span>
    </div>
    
    <div className="job-scores">
      <ScoreBadge 
        label="真实度" 
        score={job.authenticity_score} 
        color={getScoreColor(job.authenticity_score)}
      />
      <ScoreBadge 
        label="匹配度" 
        score={job.match_score} 
      />
      <Badge 
        text={job.recommended_action === 'auto_apply' ? '🟢 可自动投' : '🟡 建议审核'}
      />
    </div>
    
    <div className="job-meta">
      <span>📍 {job.location}</span>
      <span>🕐 {formatDate(job.posted_date)}</span>
      <span>📱 {job.platform}</span>
    </div>
    
    {job.red_flags && job.red_flags.length > 0 && (
      <div className="red-flags">
        ⚠️ {job.red_flags.slice(0, 2).join('; ')}
      </div>
    )}
    
    <div className="job-actions">
      <button onClick={() => window.open(job.url)}>查看职位</button>
      <button onClick={() => showDetails(job)}>详情</button>
    </div>
  </div>
);
```

**验收：**
- ✅ 显示今日职位列表
- ✅ 筛选功能正常
- ✅ 批量选择正常
- ✅ UI 响应速度 <1 秒

---

### Week 4: 队列管理

**Stage 5: 投递队列界面**

```typescript
const QueueView: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  
  const startProcessing = async (mode: 'level1' | 'level2' | 'level3') => {
    setProcessing(true);
    
    // 调用后端 API 开始投递
    await api.startBatchApplication(queue.map(q => q.job_id), mode);
    
    // 实时监控进度
    monitorProgress();
  };
  
  return (
    <div className="queue-view">
      <h2>投递队列 ({queue.length} 个职位)</h2>
      
      <div className="queue-stats">
        <div>准备完成: {queue.filter(q => q.resume_selected).length}</div>
        <div>Cover letter: {queue.filter(q => q.cover_letter_generated).length}</div>
        <div>AI 答案: {queue.filter(q => q.ai_answers_ready).length}</div>
      </div>
      
      <div className="queue-list">
        {queue.map(item => (
          <QueueItem key={item.id} item={item} />
        ))}
      </div>
      
      <div className="queue-actions">
        <button onClick={() => startProcessing('level1')}>
          Level 1: 智能辅助 (我点提交)
        </button>
        <button onClick={() => startProcessing('level2')}>
          Level 2: 批量自动 (我在场)
        </button>
        <button onClick={() => startProcessing('level3')} className="danger">
          ⚠️ Level 3: 完全自动 (高风险)
        </button>
      </div>
      
      {processing && <ProgressMonitor />}
    </div>
  );
};
```

**验收：**
- ✅ 队列显示正常
- ✅ 准备状态实时更新
- ✅ 3 种投递模式可选

---

## Month 5: Phase 5 - 智能投递引擎 (Level 1-2)

**目标：** 自动化投递流程

### Week 1-2: Level 1 智能辅助投递

**Stage 1: Playwright 浏览器自动化**

```python
from playwright.sync_api import sync_playwright

class ApplicationEngine:
    """投递引擎 - Level 1"""
    
    def apply_to_job(self, job: Job, user: User, resume: Resume, mode: str = 'level1'):
        """
        投递单个职位。
        
        mode:
        - level1: 智能辅助，用户最后点提交
        - level2: 批量自动，用户在场
        - level3: 完全自动
        """
        with sync_playwright() as p:
            # 启动浏览器（使用用户 profile，保持登录状态）
            browser = p.chromium.launch_persistent_context(
                user_data_dir=f"./browser_profiles/{user.id}",
                headless=(mode == 'level3'),
            )
            
            page = browser.new_page()
            
            try:
                # 1. 打开职位页面
                page.goto(job.url)
                page.wait_for_load_state('networkidle')
                
                # 2. 检测 Simplify
                simplify_available = self.detect_simplify(page)
                
                if simplify_available:
                    # 3. 等待用户点 Simplify (或自动点击，取决于 mode)
                    if mode == 'level1':
                        self.notify_user("请点击 Simplify 按钮")
                        page.wait_for_selector('.simplify-done-indicator', timeout=60000)
                    else:
                        page.click('.simplify-button')
                        page.wait_for_selector('.simplify-done-indicator')
                
                # 4. 检测复杂问题
                questions = self.detect_open_questions(page)
                
                for question in questions:
                    # 5. AI 生成答案
                    answer = self.generate_ai_answer(question, user.profile)
                    
                    if mode == 'level1':
                        # 显示给用户确认
                        approved = self.show_answer_for_approval(question, answer)
                        if not approved:
                            continue
                    
                    # 6. 填入答案
                    self.fill_answer(page, question['selector'], answer)
                
                # 7. 提交
                if mode == 'level1':
                    self.notify_user("请点击 Submit 按钮")
                    # 等待用户手动提交
                else:
                    page.click('button[type="submit"]')
                
                # 8. 记录成功
                self.mark_applied(job, user)
                
            except Exception as e:
                logger.error(f"Application failed: {e}")
                self.mark_failed(job, user, str(e))
            
            finally:
                browser.close()
    
    def batch_apply(self, jobs: List[Job], user: User, mode: str = 'level1'):
        """批量投递"""
        for i, job in enumerate(jobs):
            logger.info(f"Processing {i+1}/{len(jobs)}: {job.company_name}")
            
            # 投递
            self.apply_to_job(job, user, mode)
            
            # 间隔 (避免检测)
            if i < len(jobs) - 1:
                delay = random.randint(60, 180)  # 1-3 分钟
                logger.info(f"Waiting {delay}s before next application...")
                time.sleep(delay)
```

**验收：**
- ✅ 成功打开职位页面
- ✅ 检测到 Simplify
- ✅ 检测到复杂问题
- ✅ AI 生成答案质量 >80%
- ✅ 用户可以审核和确认

---

### Week 3-4: Level 2 批量自动 + AI 问答引擎

**Stage 2: AI 问答引擎**

```python
class AIAnswerEngine:
    """AI 自动回答引擎"""
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
    
    def generate_answer(self, question: str, profile: Profile, job: Job) -> str:
        """
        生成个性化答案。
        
        输入：
        - question: "Why do you want to work at Google?"
        - profile: 用户完整 profile
        - job: 职位信息
        
        输出：
        - answer: "I'm excited about Google Cloud Platform because..."
        """
        prompt = f"""
        你是一个求职专家，帮助用户回答职位申请问题。
        
        用户背景：
        姓名：{profile.full_name}
        教育：{json.dumps(profile.education)}
        工作经历：{json.dumps(profile.work_experience)}
        技能：{json.dumps(profile.skills)}
        项目：{json.dumps(profile.projects)}
        
        职位信息：
        公司：{job.company_name}
        职位：{job.title}
        描述：{job.jd_text[:500]}
        
        问题：{question}
        
        请生成一个简洁、真诚、专业的回答（2-3 句话，100-150 字）。
        突出用户相关经验和与职位的匹配点。
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    def detect_questions(self, page_html: str) -> List[Dict]:
        """
        从页面 HTML 检测开放性问题。
        
        返回：
        [
          {
            "question": "Why do you want to work here?",
            "selector": "#question_1",
            "type": "textarea"
          }
        ]
        """
        # 实现问题检测逻辑
        pass
```

**验收：**
- ✅ 检测到常见问题类型
- ✅ AI 答案质量评估 >75%
- ✅ 答案长度适中
- ✅ 个性化程度高

---

## Month 6: Phase 6 - 完全自动模式 (可选) + 优化

### Week 1-2: Level 3 完全自动投递

**⚠️ 高风险功能，明确警告用户**

**实现：**
- 后台运行（用户可离开）
- 智能节奏控制
- 异常自动处理
- 详细日志记录

**安全措施：**
- 每小时最多 15 个申请
- 随机间隔 2-5 分钟
- 模拟鼠标移动
- 随机停顿
- 检测到异常立即停止并通知

**验收：**
- ✅ 用测试小号成功投递 20 个职位
- ✅ 无账号封禁
- ✅ 异常处理正常

---

### Week 3-4: 系统优化 + 部署准备

**Stage 1: 性能优化**
- 数据库查询优化
- 前端渲染优化
- API 响应时间优化

**Stage 2: 错误处理完善**
- 所有异常有友好提示
- 自动重试机制
- 失败恢复

**Stage 3: 用户文档**
- 安装指南
- 使用教程
- 常见问题
- 风险说明

**Stage 4: 云部署准备（可选）**
- Docker 化
- 环境变量配置
- 部署脚本

---

# 第四部分：里程碑与验收标准

## Milestone 1: Month 1 End ✅ ACHIEVED

**Date:** December 8, 2025

**交付：**
- ✅ Phase 1 真实性评分引擎完成
- ✅ 51 rules, 105 tests
- ✅ FAANG: 100.0, Scam: 2.3

**验收：**
- ✅ 所有 acceptance criteria 满足
- ✅ 手动验证通过
- ✅ 合并到 dev

---

## Milestone 2: Month 2 End

**Target Date:** January 8, 2026

**交付：**
- ✅ PostgreSQL 数据库完整 schema
- ✅ GitHub Jobs 采集器（500 jobs/day）
- ✅ LinkedIn Guest API 采集器（200-500 jobs/day）
- ✅ 浏览器扩展（被动采集 20-30 jobs/day）
- ✅ 自动评分 pipeline
- ✅ 去重引擎
- ✅ 定时任务调度

**验收标准：**
- ✅ 系统每天自动收集 700-1000 个职位
- ✅ 所有职位自动评分
- ✅ 数据库无重复职位
- ✅ 过期职位自动清理
- ✅ 用户可以在桌面应用看到职位列表（基础版）

**成功指标：**
- 每天新增职位 ≥700
- 评分准确率 ≥75%
- 系统正常运行 7 天无故障

---

## Milestone 3: Month 3 End

**Target Date:** February 8, 2026

**交付：**
- ✅ 用户账号系统
- ✅ Profile 管理界面
- ✅ 简历上传 + AI 解析
- ✅ 简历-职位匹配引擎（基础版）

**验收标准：**
- ✅ 用户可以注册并登录
- ✅ 用户可以填写完整 profile
- ✅ 用户可以上传 4 份简历
- ✅ AI 解析简历准确率 ≥70%
- ✅ 系统可以推荐最佳简历版本

**成功指标：**
- Profile 完整度 ≥80%
- AI 解析节省时间 ≥50%
- 简历匹配准确率 ≥70%

---

## Milestone 4: Month 4 End

**Target Date:** March 8, 2026

**交付：**
- ✅ Tauri 桌面应用完整 UI
- ✅ 职位列表 + 筛选界面
- ✅ 批量选择 + 队列管理
- ✅ 投递监控面板
- ✅ 历史记录

**验收标准：**
- ✅ 用户可以看到今日 50 个推荐职位
- ✅ 系统正确标记「可自动投」vs「需审核」
- ✅ 用户可以批量选择并加入队列
- ✅ 队列准备状态实时显示
- ✅ UI 流畅（<1 秒响应）

**成功指标：**
- 用户筛选时间从 30 分钟 → 5 分钟
- 批量操作效率 ≥10 jobs/minute

---

## Milestone 5: Month 5 End

**Target Date:** April 8, 2026

**交付：**
- ✅ Level 1 智能辅助投递
- ✅ Simplify 集成
- ✅ AI 问答引擎
- ✅ 完整投递流程

**验收标准：**
- ✅ 成功投递 50 个测试职位（真实申请）
- ✅ AI 答案质量 ≥80%
- ✅ 投递成功率 ≥90%
- ✅ 平均每个职位耗时 <2 分钟

**成功指标：**
- 投递时间从 3 小时 → 45 分钟（节省 75%）
- 投递数量从 20/day → 40/day
- 用户满意度高

---

## Milestone 6: Month 6 End (Project Complete)

**Target Date:** May 8, 2026

**交付：**
- ✅ Level 2 批量自动投递
- ⚠️ Level 3 完全自动（可选，高风险）
- ✅ 系统优化完成
- ✅ 文档完善
- ✅ 部署就绪

**验收标准：**
- ✅ Level 2 成功投递 100 个职位（测试）
- ✅ 无账号封禁
- ✅ 异常处理完善
- ✅ 用户文档完整

**最终成功指标：**
- 投递时间：3 小时 → 30 分钟（节省 85%）
- 投递数量：20/day → 50/day
- 投递质量：精准（只投高质量职位）
- 假职位过滤率：≥70%
- 用户满意度：极高

---

# 第五部分：当前进度追踪

## 当前位置 (As of December 8, 2025)

**时间线：**
```
Month 1 ████████████████████████████████ 100% ✅ COMPLETE
Month 2 ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  10% ⏳ IN PROGRESS
Month 3 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% 📅 PLANNED
Month 4 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% 📅 PLANNED
Month 5 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% 📅 PLANNED
Month 6 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% 📅 PLANNED
```

**Phase 2 详细进度：**
```
Week 1 ███░░░░░░░░░░░░░░░░░░░░░░░░░  10% (Stage 1/14)
Week 2 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
Week 3 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
Week 4 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
```

**当前任务：**
- ⏳ Stage 2: PostgreSQL 数据库设计 + 部署
- 📋 下一步：Stage 3: GitHub Jobs 采集器

---

## 快速状态检查清单

**已完成：**
- ✅ Phase 1 真实性评分引擎
- ✅ Phase 2 浏览器扩展脚手架（Stage 1）

**进行中：**
- ⏳ Phase 2 数据采集系统（Week 1, Stage 2）

**待开始：**
- 📅 Phase 2 Week 2-4
- 📅 Phase 3-6

**阻塞项：**
- 无

---

# 第六部分：风险管理与缓解

## 6.1 技术风险

### 风险 1: LinkedIn/Indeed 封 IP/账号

**可能性：** 中  
**影响：** 高

**缓解措施：**
1. **优先使用合法数据源**
   - GitHub (完全合法) ✅
   - LinkedIn Guest API (公开但灰色) ⚠️
   - 避免匿名爬虫 ❌

2. **节奏控制**
   - 每小时 <20 个申请
   - 随机延迟 1-3 分钟
   - 模拟人类行为

3. **用户控制**
   - Level 1-3 渐进模式
   - 明确风险提示
   - 建议用测试小号

**应急预案：**
- 如果 LinkedIn API 被封 → 切换到浏览器扩展（纯被动）
- 如果账号被封 → 立即停止自动化，提示用户

---

### 风险 2: 平台 DOM 结构变化

**可能性：** 高（LinkedIn 经常改版）  
**影响：** 中

**缓解措施：**
1. **多重 fallback selectors**
   ```typescript
   const selectors = [
       '.job-details-jobs-unified-top-card__job-title',  // 当前
       '.jobs-unified-top-card__job-title',              // 备选 1
       'h1.job-title',                                    // 备选 2
   ];
   ```

2. **定期测试**
   - 每周测试 5 个真实职位页面
   - 发现失败立即修复

3. **社区反馈**
   - 如果开源，社区会报告问题

**应急预案：**
- 提取失败 → 降级到手动导入
- 关键平台失效 → 优先修复

---

### 风险 3: AI 答案质量不稳定

**可能性：** 中  
**影响：** 中

**缓解措施：**
1. **用户审核**
   - Level 1 模式用户必须确认
   - 显示答案预览

2. **质量检查**
   ```python
   def validate_answer(question: str, answer: str) -> bool:
       # 长度检查
       if len(answer) < 50 or len(answer) > 500:
           return False
       
       # 关键词检查（是否回答了问题）
       if 'why' in question.lower() and 'because' not in answer.lower():
           return False
       
       # 通用答案检测
       generic_phrases = ["I am passionate", "I am a hard worker"]
       if any(p in answer for p in generic_phrases):
           return False
       
       return True
   ```

3. **Fallback**
   - AI 失败 → 使用模板答案
   - 或跳过该问题

---

## 6.2 法律与合规风险

### 风险 4: 违反平台 ToS

**可能性：** 中  
**影响：** 高（账号被封）

**缓解措施：**
1. **优先合法途径**
   - GitHub: 100% 合法 ✅
   - Official APIs: 合法 ✅
   - Guest API: 灰色但公开 ⚠️

2. **用户在环路**
   - 不做完全无人值守 bot
   - Level 1-2 模式用户始终在场
   - Level 3 明确风险提示

3. **免责声明**
   ```
   警告：使用自动化工具可能违反招聘平台服务条款。
   用户需自行承担风险。建议：
   - 使用 Level 1 模式（最安全）
   - 用测试小号试验 Level 2-3
   - 主号保守使用
   ```

---

## 6.3 项目风险

### 风险 5: 开发时间超预期

**可能性：** 中  
**影响：** 中

**缓解措施：**
1. **MVP 优先**
   - 每个 Phase 都有最小可用版本
   - 可以在任何 Milestone 停止，都有可用系统

2. **迭代开发**
   - 先做核心功能
   - 后加优化

3. **复用现有工具**
   - Simplify（不重新造轮子）
   - 开源库

---

# 第七部分：成功指标与 KPIs

## 7.1 系统性能指标

### 数据采集
| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 每日新职位数 | ≥700 | - | 📅 |
| GitHub 覆盖 | ≥400 | - | 📅 |
| LinkedIn 覆盖 | ≥200 | - | 📅 |
| 去重准确率 | ≥95% | - | 📅 |
| 评分准确率 | ≥75% | 100% (Phase 1) | ✅ |

### 投递效率
| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 投递时间 | <45 min/day | 180 min | 📅 |
| 投递数量 | 40-50/day | 20 | 📅 |
| 假职位过滤 | ≥70% | - | 📅 |
| 自动化程度 | ≥80% | 0% | 📅 |

### AI 质量
| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 简历解析准确率 | ≥70% | - | 📅 |
| 答案质量 | ≥75% | - | 📅 |
| 简历匹配准确率 | ≥70% | - | 📅 |

---

## 7.2 用户体验指标

### 时间节省
- **当前：** 每天 3 小时投简历
- **Month 2 后：** 2 小时（过滤假职位）
- **Month 4 后：** 1 小时（批量审核）
- **Month 5 后：** 30-45 分钟（智能投递）
- **目标达成：节省 75-85% 时间** ✅

### 投递质量
- **当前：** 混乱，很多假职位
- **Month 2 后：** 只看真实职位
- **Month 5 后：** 精准投递
- **目标达成：投递 → 回复率提升** ✅

---

# 第八部分：下一步行动指南

## 立即行动 (今天)

**当前状态：** Phase 2, Week 1, Stage 1 完成

**下一步（Stage 2）：PostgreSQL 数据库**

### 给 Cursor 的指令：

```
════════════════════════════════════════════════════════════════
PHASE 2 ADJUSTMENT - 数据库优先策略
════════════════════════════════════════════════════════════════

背景：
经过深度架构讨论，Phase 2 调整为「数据采集系统」而不是「浏览器扩展」。

原因：
1. 用户需要主动数据采集（每天 700+ 职位）
2. 浏览器扩展只是补充（被动采集）
3. 数据库是所有功能的基础

新的 Stage 2 任务：PostgreSQL 数据库设计 + 部署

════════════════════════════════════════════════════════════════

STAGE 2: PostgreSQL Database Setup

创建以下文件：

1. apps/backend/docker-compose.yml
   - PostgreSQL 16 容器配置
   - 端口 5432
   - Volume 持久化

2. apps/backend/database/schema.sql
   - 完整 schema（从 MASTER PLAN 复制）
   - jobs, users, profiles, resumes, applications, queue 表
   - 所有索引和视图

3. apps/backend/database/models.py
   - SQLAlchemy ORM 模型
   - 对应所有表

4. apps/backend/database/__init__.py
   - 数据库连接配置
   - SessionLocal factory

5. apps/backend/alembic.ini (可选)
   - 数据库迁移配置

验证步骤：

cd apps/backend
docker-compose up -d
python -c "from database import SessionLocal; print('DB connected!')"

提交：

git add apps/backend/database apps/backend/docker-compose.yml
git commit -m "feat: add PostgreSQL database with complete schema

- Docker Compose for local PostgreSQL
- Complete schema (6 tables + indexes + views)
- SQLAlchemy ORM models
- Connection management

Database foundation ready for data collection.

Phase: 2 Stage 2/14"

════════════════════════════════════════════════════════════════

参考文档：
- /specs/phase2-extension-spec.md (背景)
- 本文档 (MASTER PLAN) 第二部分 2.3 节（完整 schema）

按照 MASTER PLAN 执行。
```

---

## 本周目标 (Week 1)

- ✅ Stage 1: 项目脚手架（已完成）
- ⏳ Stage 2: PostgreSQL 数据库（进行中）
- 📅 Stage 3: GitHub Jobs 采集器
- 📅 Stage 4: 自动评分 pipeline

**预计完成时间：** December 12, 2025

---

## 本月目标 (Month 2)

**Week 1:** ✅ 数据库 + GitHub 采集器  
**Week 2:** 📅 LinkedIn API 客户端 + 去重 + 调度器  
**Week 3:** 📅 浏览器扩展（LinkedIn 提取）  
**Week 4:** 📅 整合测试 + 优化

**预计完成时间：** January 8, 2026

**交付成果：**
- 每天自动采集 700-1000 个职位 ✅
- 自动评分 + 去重 ✅
- 数据库管理完善 ✅

---

# 第九部分：技术决策记录

## Decision 1: PostgreSQL vs SQLite

**日期：** December 8, 2025

**决策：** 使用 PostgreSQL

**理由：**
- 数据量预估：63,000+ 职位记录
- 需要复杂查询（去重、筛选、排序）
- 未来云部署需求
- 并发写入需求（多个采集器）

**替代方案：** SQLite（被否决，规模不够）

---

## Decision 2: 数据采集优先 vs 浏览器扩展优先

**日期：** December 8, 2025

**决策：** 数据采集优先

**理由：**
- 用户需要主动发现新职位（不想手动浏览）
- GitHub + LinkedIn API 可以提供 700+ jobs/day
- 浏览器扩展只是补充（20-30 jobs/day）

**调整：**
- Phase 2 Week 1-2: 数据采集
- Phase 2 Week 3-4: 浏览器扩展

---

## Decision 3: 自动投递渐进策略

**日期：** December 8, 2025

**决策：** 3-Level 渐进自动化

**Level 1:** 智能辅助（用户点提交）- Month 5  
**Level 2:** 批量自动（用户在场）- Month 6  
**Level 3:** 完全自动（可选，高风险）- Month 6

**理由：**
- 账号安全优先
- 用户可以选择风险等级
- 渐进验证可行性

---

## Decision 4: 免费 API 优先

**日期：** December 8, 2025

**决策：** 先用免费数据源，跑通后考虑付费

**免费数据源：**
- GitHub job lists（完全合法）
- LinkedIn Guest API（灰色但免费）
- 浏览器扩展（用户授权）

**付费备选：**
- Mantiks/Lix LinkedIn API (~$99-299/mo)
- JobsPikr (聚合多平台)
- HasData Indeed API

**决策逻辑：**
- 免费源已提供 700-1000 jobs/day（够用）
- 付费只在需要 scale 时考虑

---

# 第十部分：长期愿景 (6 个月后)

## 10.1 个人使用版本（6 个月目标）

**功能完整性：**
- ✅ 每天自动发现 700-1000 个职位
- ✅ 自动过滤假职位（节省 70% 时间）
- ✅ 批量审核界面（5-10 分钟决策）
- ✅ 智能投递（Level 1-2，30-45 分钟投 40 个）
- ✅ AI 自动回答复杂问题
- ✅ 全程投递追踪

**用户每日流程：**
```
09:00 - 打开应用，看到 50 个精选职位
09:10 - 快速审核，勾选 30 个
09:15 - 点击「批量投递」(Level 2)
09:45 - 完成，查看报告
10:00 - 继续其他事情
```

**节省：** 从 3 小时 → 45 分钟

---

## 10.2 产品化版本（12 个月愿景）

**如果决定做产品：**

**Month 7-9: 多用户支持**
- 云部署（AWS/GCP）
- 用户认证系统
- 数据隔离
- 付费订阅

**Month 10-12: 高级功能**
- 更多平台（Glassdoor, Wellfound, etc.）
- 高级 AI 功能
- 数据分析 dashboard
- 移动应用（可选）

**商业模式：**
- 免费版：基础功能
- Pro 版：$19.99/月（高级自动化）
- 企业版：Custom（批量账号）

---

## 10.3 开源策略（可选）

**如果选择开源：**

**Month 7:** 准备开源
- 清理代码
- 完善文档
- 添加贡献指南

**Month 8:** 发布
- GitHub 开源
- Product Hunt 发布
- HackerNews 分享

**社区运营：**
- Issue 管理
- PR review
- 版本发布

**收益：**
- 社区贡献（免费维护）
- 知名度（简历亮点）
- 潜在商业机会

---

# 附录 A：完整技术栈清单

## A.1 开发环境

**必需软件：**
- Python 3.11+
- Node.js 18+
- Docker Desktop
- PostgreSQL 16 (via Docker)
- Chrome/Edge browser

**开发工具：**
- VS Code / Cursor
- Git
- Postman (API 测试)
- pgAdmin (数据库管理，可选)

---

## A.2 Python 依赖

```
# apps/backend/requirements.txt

# Phase 1 - 评分引擎
fastapi
uvicorn[standard]
pydantic

# Phase 2 - 数据采集
requests
beautifulsoup4
playwright
apscheduler
sqlalchemy
alembic
psycopg2-binary

# Phase 3 - AI 功能
openai
anthropic  # Claude API
sentence-transformers
pdfplumber
pypdf2

# Phase 5 - 投递引擎
selenium  # Backup
playwright

# 工具
python-dotenv
pytest
black
```

---

## A.3 TypeScript/Node 依赖

**浏览器扩展：**
```json
{
  "devDependencies": {
    "@types/chrome": "^0.0.253",
    "typescript": "^5.2.0",
    "webpack": "^5.89.0",
    "ts-loader": "^9.5.0"
  }
}
```

**桌面应用：**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0"
  }
}
```

---

# 附录 B：快速参考

## B.1 关键文件位置

**Specs:**
```
specs/
├── masterplan.md                        # 产品愿景（旧）
├── MASTER_IMPLEMENTATION_PLAN.md        # 本文档 ⭐
├── phase2-extension-spec.md             # Phase 2 技术规格
├── phase2-acceptance-criteria.md        # Phase 2 验收
└── authenticity-*.md                    # Phase 1 规格
```

**Phase 1 代码:**
```
apps/backend/authenticity_scoring/
├── rule_engine.py
├── score_fusion.py
├── explanation_engine.py
├── scorer.py
└── tests/
```

**Phase 2 代码（规划）:**
```
apps/backend/
├── database/
│   ├── schema.sql
│   ├── models.py
│   └── __init__.py
├── data_collection/
│   ├── github_collector.py
│   ├── linkedin_collector.py
│   └── scheduler.py
├── scoring_pipeline.py
└── deduplication.py

apps/browser_extension/
└── (Week 3-4)

apps/desktop_app/
└── (Month 4)
```

---

## B.2 常用命令

**数据库:**
```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 查看日志
docker-compose logs -f postgres

# 连接数据库
psql postgresql://fuckwork:fuckwork_dev@localhost:5432/fuckwork
```

**后端:**
```bash
# 启动 API
cd apps/backend
uvicorn main:app --reload --port 5123

# 运行采集器
python -m data_collection.github_collector

# 运行测试
pytest authenticity_scoring/tests/
```

**扩展:**
```bash
# 构建
cd apps/browser_extension
npm run build

# 开发模式
npm run dev
```

---

## B.3 Review 检查清单

**每周 Review：**
- [ ] 本周完成了哪些 Stages？
- [ ] 是否有阻塞项？
- [ ] 代码质量如何（测试覆盖率）？
- [ ] 是否需要调整计划？

**每月 Review：**
- [ ] Milestone 是否达成？
- [ ] KPIs 是否满足？
- [ ] 用户体验如何？
- [ ] 下个月计划是否需要调整？

**关键决策 Review：**
- [ ] 技术选型是否正确？
- [ ] 是否有更好的替代方案？
- [ ] 风险是否在控制中？

---

# 文档维护

## 更新规则

**触发更新的情况：**
1. 完成任何 Stage → 更新进度百分比
2. 完成任何 Milestone → 更新验收状态
3. 重大架构调整 → 更新架构图
4. 技术决策 → 添加到第九部分
5. 发现风险 → 更新第六部分

**更新责任：**
- Erdun (Chairman) - 重大决策、愿景调整
- Claude (CTO) - 技术架构、风险评估
- Cursor (Engineer) - 实施进度、技术细节

---

## 版本历史

**v1.0** (2025-12-07) - 初始 masterplan  
**v2.0** (2025-12-08) - 完整实施计划总纲领（本文档）
- 基于深度架构讨论
- 明确 6 个月路线图
- 详细 Milestone 和验收标准

---

**文档状态：** 🟢 Active  
**最后更新：** December 8, 2025  
**下次 Review：** December 15, 2025 (Phase 2 Week 2 结束)

**END OF MASTER IMPLEMENTATION PLAN**
