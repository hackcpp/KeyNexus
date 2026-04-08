# SoloBiz 开发计划（现状对齐版）

## 概述

本文档用于记录当前代码实现与后续迭代方向，作为开发计划与范围边界说明。

## 当前实现（已落地）

- 多路由结构：`/`（系统总览）、`/vault`（密钥管理）、`/ledger`（收支账本）
- 统一布局：`ClientLayout` + `AppShell` + `Sidebar`
- 认证：Supabase Auth，支持 Google / GitHub OAuth
- Vault：客户端加密存储（`api_keys`）
- Ledger：结构化字段记账（`ledger_entries`）+ 统计图表（折线图、饼图）

## 实际路由结构

```text
app/
  layout.tsx
  page.tsx
  vault/page.tsx
  ledger/page.tsx
```

> 说明：当前未拆分 `ledger/stats`、`ledger/categories` 子路由，统计与记账通过 `ledger/page.tsx` 内部 Tab 切换。

## 数据库现状

### `api_keys`（密钥管理，密文存储）

- 核心字段：`name`、`type`、`encrypted_payload`、`iv`、`salt`
- 启用 RLS，仅允许访问本人数据

### `ledger_entries`（账本记录，结构化明文字段）

- 核心字段：`type`、`amount`、`category`、`note`、`date`
- 启用 RLS，仅允许访问本人数据
- 用于客户端统计聚合与图表渲染

> 当前没有 `ledger_categories` 表，也没有分类管理 CRUD 页面。

## 关键组件

- 导航与布局：`Sidebar`、`AppShell`、`ClientLayout`
- Vault：`KeyForm`、`VaultList`
- Ledger：`LedgerForm`、`LedgerList`、`LedgerStats`、`MonthPicker`
- Dashboard：`DashboardOverview`

## 后续迭代建议

1. 账本高级筛选（金额区间、分类多选、时间快捷区间）
2. 导入导出（CSV）
3. 预算与月度目标
4. 按分类趋势对比（跨月/跨年）

