# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SoloBiz 是一人公司的智能管理系统，部署于 Vercel，使用 Supabase 存储。采用**零知识架构**：所有敏感数据在浏览器中加密后才离开设备，服务端不触碰明文。

### 功能模块

1. **密钥管理** — 加密存储 API Key（单密钥 / ID+密钥 两种模式）
2. **收支账本** — 加密存储收入/支出记录，客户端解密后进行统计分析

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript
- **Backend**: Supabase (Auth + Database)
- **Authentication**: Google / GitHub OAuth via Supabase Auth
- **Encryption**: AES-GCM with PBKDF2 key derivation (client-side only)
- **Charts**: recharts (收支统计图表)

## Architecture

### App Structure

```
app/
  layout.tsx          # 根布局，集成 ClientLayout（Provider 树 + 登录守卫）
  page.tsx            # 系统总览（Dashboard）
  vault/page.tsx      # 密钥管理
  ledger/page.tsx     # 收支账本（统计 + 记账 tab 切换）
components/
  ClientLayout.tsx    # Toast → Auth → MasterPassword Provider 包装
  AppShell.tsx        # 侧边栏 + 内容区布局
  Sidebar.tsx         # 导航侧边栏
  DashboardOverview   # 总览页
  KeyForm / VaultList # 密钥模块
  ledger/             # 账本模块（LedgerForm, LedgerList, LedgerStats, MonthPicker）
```

### Security Model

- Master password is never sent to the server
- PBKDF2-HMAC-SHA256 derives a 256-bit key from master password
- AES-GCM encryption ensures ciphertext integrity
- Row-Level Security (RLS) on Supabase ensures multi-tenant isolation

### Database Schema

```
api_keys table:        # 密钥管理
- id, user_id, name, type, encrypted_payload, iv, salt, created_at

ledger_entries table:  # 账本记录（加密 payload 含 type/amount/category/note/date）
- id, user_id, encrypted_payload, iv, salt, created_at

ledger_categories table: # 账本分类（预留，当前未使用）
- id, user_id, encrypted_payload, iv, salt, created_at
```

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_MASTER_PASSWORD
```

## Key Patterns

- All encryption/decryption happens client-side
- Master password loaded from env var via MasterPasswordProvider
- Ledger statistics computed client-side after decrypting all entries
- Custom events for cross-component refresh: `vault:refresh`, `ledger:refresh`
- Two credential modes for keys: 单密钥 (single) and ID+密钥 (pair)
