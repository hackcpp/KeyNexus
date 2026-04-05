# 一人公司系统开发计划

## 概述

将现有 KeyNexus 项目从单页 API Key 管理工具扩展为多模块的「一人公司系统」，新增账本模块（加密存储、图表统计、自定义分类），并重构应用结构以支持模块化导航。

## 进度追踪

- [x] 重构应用结构：Provider 提升到根布局、新增 AppShell/Sidebar 导航、创建多路由页面骨架
- [x] 创建 Supabase 迁移文件：ledger_entries + ledger_categories 表及 RLS 策略
- [x] 新增类型定义（types/index.ts）、安装 recharts 依赖
- [x] 实现分类管理功能（CategoryManager 组件 + 分类 CRUD）
- [x] 实现账本记录功能（LedgerForm 新增 + LedgerList 列表/搜索/删除）
- [x] 实现统计分析页（MonthPicker + LedgerStats 图表与汇总卡片）
- [x] 实现首页总览（本月收支概要 + 各模块快捷入口）
- [x] 样式扩展：侧边栏、账本组件、图表容器、响应式适配

---

## 一、应用架构重构

当前项目是单页应用（`app/page.tsx` 承载所有逻辑）。需要重构为多路由、多模块架构。

### 路由结构

```
app/
  layout.tsx          # 根布局（保留）
  page.tsx            # 首页 Dashboard（总览页）
  vault/
    page.tsx          # API Key 管理（从现有 page.tsx 迁移）
  ledger/
    page.tsx          # 账本主页（记录列表 + 新增入口）
    stats/
      page.tsx        # 统计分析页（图表 + 汇总）
    categories/
      page.tsx        # 分类管理页
```

### 共享布局与导航

在已登录状态下，新增**侧边栏导航**组件 `components/Sidebar.tsx`，包含：

- 总览（Dashboard）
- 密钥保险箱（Vault）
- 账本（Ledger）
- 统计（Stats）

Provider 树提升到根布局层级（`components/ClientLayout.tsx`），使所有子路由共享 Auth/Toast/MasterPassword 上下文。

`components/AppShell.tsx` 作为已登录用户的布局容器（侧边栏 + 内容区）。

---

## 二、数据库设计

### 新增表：`ledger_entries`（账本记录）

```sql
CREATE TABLE public.ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  encrypted_payload TEXT NOT NULL,  -- 加密内容：{ type, amount, category, note, date }
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

加密 payload 结构：

```typescript
interface LedgerEntryData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date, e.g. "2026-04-05"
}
```

### 新增表：`ledger_categories`（自定义分类）

```sql
CREATE TABLE public.ledger_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  encrypted_payload TEXT NOT NULL,  -- 加密内容：{ name, type }
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

加密 payload 结构：

```typescript
interface LedgerCategoryData {
  name: string;
  type: 'income' | 'expense';
}
```

两张表均启用 RLS，策略与现有 `api_keys` 一致（`auth.uid() = user_id`）。

### 零知识统计方案

由于采用加密存储，所有统计计算在**客户端**完成：

1. 拉取用户全部 `ledger_entries` 记录
2. 逐条解密得到明文
3. 客户端按年/月/分类聚合计算

对于一人公司场景（年交易量预计数百到数千条），此方案性能可接受。

---

## 三、新增依赖

- **recharts** — 图表库，用于收支统计可视化（柱状图、饼图）

---

## 四、新增组件

### 导航与布局

- `components/Sidebar.tsx` — 侧边栏导航（模块切换）
- `components/AppShell.tsx` — 已登录用户的布局壳（Sidebar + Content）
- `components/ClientLayout.tsx` — Provider 包装 + 登录守卫

### 账本模块

- `components/ledger/LedgerForm.tsx` — 新增收入/支出表单（金额、分类选择、备注、日期）
- `components/ledger/LedgerList.tsx` — 账本记录列表（解密展示、搜索过滤、删除）
- `components/ledger/LedgerStats.tsx` — 统计面板（月/年汇总卡片 + recharts 图表）
- `components/ledger/CategoryManager.tsx` — 分类管理（增删自定义分类）
- `components/ledger/MonthPicker.tsx` — 年月选择器

### 首页总览

- `components/DashboardOverview.tsx` — 总览页（本月收支概要 + 快捷入口）

---

## 五、类型定义

在 `types/index.ts` 中新增：

```typescript
type LedgerType = 'income' | 'expense';

interface LedgerEntryData {
  type: LedgerType;
  amount: number;
  category: string;
  note: string;
  date: string;
}

interface LedgerEntryRecord {
  id: string;
  user_id: string;
  encrypted_payload: string;
  iv: string;
  salt: string;
  created_at: string;
}

interface LedgerCategoryData {
  name: string;
  type: LedgerType;
}

interface LedgerCategoryRecord {
  id: string;
  user_id: string;
  encrypted_payload: string;
  iv: string;
  salt: string;
  created_at: string;
}

interface DecryptedLedgerEntry extends LedgerEntryData {
  id: string;
  created_at: string;
}

interface DecryptedLedgerCategory extends LedgerCategoryData {
  id: string;
}
```

---

## 六、样式扩展

在 `app/globals.css` 中扩展：

- 侧边栏样式（`.sidebar`、`.sidebar-link`、`.sidebar-link-active`）
- AppShell 布局（`.app-shell`、`.app-content`）
- 账本相关样式（`.ledger-card`、`.stat-card`、`.chart-container` 等）
- 调整 `main` 最大宽度以适配侧边栏布局（从 720px 扩展）
- 收入/支出的色彩标识（收入绿色、支出红色）

---

## 七、数据流架构

```
客户端                          Supabase
┌─────────────────────┐        ┌──────────────────────┐
│  账本 UI            │        │  ledger_entries 表    │
│  ↓                  │        │  ledger_categories 表 │
│  加密/解密模块       │ ←───→ │  RLS 用户隔离         │
│  ↓                  │        └──────────────────────┘
│  统计计算引擎        │
│  ↓                  │
│  图表渲染 (recharts) │
└─────────────────────┘
```

- 写入：UI 输入明文 → 加密模块加密 → 写入 Supabase
- 读取：Supabase 返回密文 → 加密模块解密 → UI 展示
- 统计：全量解密后 → 客户端聚合计算 → 图表渲染

---

## 八、迁移步骤概要

1. 重构应用结构（Provider 提升、新增路由、导航）
2. 创建数据库迁移文件（两张新表 + RLS）
3. 新增类型定义
4. 实现分类管理功能
5. 实现账本记录的增删查
6. 实现统计分析页（图表 + 汇总）
7. 实现首页总览
8. 样式适配与响应式调整

