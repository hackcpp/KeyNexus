# AGENTS.md

本文件用于指导 Codex 以及其他能够理解仓库级指令的 AI 编码代理在本仓库中工作。

如果某个代理不会读取 `AGENTS.md`，它可能会改用自己的项目指令文件。在本仓库中，`CLAUDE.md` 主要给 Claude Code 使用，`README.md` 主要给人类读者使用。

## 项目概览

SoloBiz 是一人公司的智能管理系统，部署于 Vercel，使用 Supabase 存储。项目采用**零知识架构**：所有敏感数据会先在浏览器中加密，再离开设备，服务端不接触明文。

### 功能模块

1. **密钥管理** - 加密存储 API Key，支持单密钥和 ID+密钥两种模式
2. **收支账本** - 加密存储收入和支出记录，客户端解密后进行统计分析

## 技术栈

- **Frontend**: Next.js (App Router), React, TypeScript
- **Backend**: Supabase (Auth + Database)
- **Authentication**: Google / GitHub OAuth via Supabase Auth
- **Encryption**: AES-GCM with PBKDF2 key derivation (client-side only)
- **Charts**: recharts (收支统计图表)

## 架构

### 应用结构

```
app/
  layout.tsx          # 根布局，集成 ClientLayout（Provider 树 + 登录守卫）
  page.tsx            # 系统总览（Dashboard）
  globals.css         # 全局样式（全局 class + imports）
  styles/variables.css # 主题变量与字体导入
  ledger/
    page.tsx          # 收支账本页面（记账 + 统计）
  vault/
    page.tsx          # 密钥管理（Vault）

components/
  ClientLayout.tsx    # Provider 树：Toast, Auth, MasterPassword 等
  AppShell.tsx        # 侧栏 + 内容区布局（app shell）
  Sidebar.tsx         # 导航侧边栏
  DashboardOverview.tsx # Dashboard 概览组件
  LoginPage.tsx       # 登录页组件
  vault/
    KeyForm.tsx       # 密钥输入 / 编辑表单
    VaultList.tsx     # 密钥列表视图
  ledger/
    LedgerForm.tsx    # 账本记录表单
    LedgerList.tsx    # 账本列表视图
    LedgerStats.tsx   # 账本统计（图表与汇总）
    MonthPicker.tsx   # 月份选择器

providers/
  ToastProvider.tsx   # 通知 / toast 提供者
  AuthProvider.tsx    # Supabase Auth 封装
  MasterPasswordProvider.tsx # 主密码与密钥派生
```

### 安全模型

- 主密码不会发送到服务端
- 使用 PBKDF2-HMAC-SHA256 从主密码派生 256 位密钥
- 使用 AES-GCM 保证密文完整性
- Supabase 上的 Row-Level Security（RLS）确保多租户隔离

### 数据库结构

```
api_keys table:        # 密钥管理
- id, user_id, name, type, encrypted_payload, iv, salt, created_at

ledger_entries table:  # 账本记录（加密 payload 含 type/amount/category/note/date）
- id, user_id, encrypted_payload, iv, salt, created_at

ledger_categories table: # 账本分类（预留，当前未使用）
- id, user_id, encrypted_payload, iv, salt, created_at
```

## 常用命令

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
```

## 校验规则

- 每次修改代码后，交付前都要运行 `npm run lint`。
- 如果改动影响页面、布局或可见交互，还要补跑相关的 E2E 测试。
- 先跑最小且有意义的测试范围；只有当改动涉及共享导航、认证或跨页面行为时，才扩大测试范围。

## 环境变量

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_MASTER_PASSWORD
```

## 关键约定

- 所有加密和解密都在客户端完成
- 主密码通过 `MasterPasswordProvider` 从环境变量读取
- 收支统计在解密全部记录后于客户端计算
- 跨组件刷新通过自定义事件完成：`vault:refresh`、`ledger:refresh`
- 密钥支持两种凭据模式：单密钥（single）和 ID+密钥（pair）
