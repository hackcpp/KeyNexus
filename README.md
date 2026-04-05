# SoloBiz - 一人公司系统

一个基于 Next.js 和 Supabase 的一人公司管理系统，采用零知识架构，所有敏感数据在客户端加密后存储。

## 功能模块

- **密钥管理** — 加密存储 API Key，支持单密钥和 ID+密钥两种模式
- **收支账本** — 记录收入/支出，支持按月统计、分类饼图、年度趋势图
- **系统总览** — 本月收支概要、各模块快捷入口

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript
- **样式**: CSS Variables, 暗色主题
- **后端**: Supabase (Auth + Database)
- **加密**: Web Crypto API (AES-GCM + PBKDF2)
- **图表**: recharts
- **部署**: Vercel

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境配置

```bash
cp .env.local.example .env.local
```

填入以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MASTER_PASSWORD=your_secure_master_password
```

### Supabase 配置

1. 在 [Supabase Dashboard](https://supabase.com/dashboard) 创建项目
2. 执行数据库迁移：
   ```bash
   npx supabase db push
   ```
   迁移文件位于 `supabase/migrations/` 目录
3. 配置 Google / GitHub OAuth（详见 [认证指南](docs/AUTH_GUIDE.md)）

### 运行

```bash
npm run dev       # 开发模式
npm run build     # 生产构建
npm start         # 启动生产服务器
```

## 项目结构

```
SoloBiz/
├── app/                        # Next.js App Router
│   ├── globals.css             # 全局样式
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 系统总览
│   ├── vault/page.tsx          # 密钥管理
│   └── ledger/page.tsx         # 收支账本（统计 + 记账）
├── components/                 # React 组件
│   ├── ClientLayout.tsx        # Provider 包装 + 登录守卫
│   ├── AppShell.tsx            # 侧边栏 + 内容区布局
│   ├── Sidebar.tsx             # 导航侧边栏
│   ├── DashboardOverview.tsx   # 总览页
│   ├── LoginPage.tsx           # 登录页
│   ├── KeyForm.tsx             # 密钥添加表单
│   ├── VaultList.tsx           # 密钥列表
│   ├── ledger/                 # 账本模块
│   │   ├── LedgerForm.tsx      # 记账表单
│   │   ├── LedgerList.tsx      # 记录列表
│   │   ├── LedgerStats.tsx     # 统计分析（图表）
│   │   └── MonthPicker.tsx     # 年月选择器
│   └── providers/              # 上下文提供者
├── lib/                        # 工具库
│   ├── crypto.ts               # 加密/解密函数
│   └── supabase/               # Supabase 客户端
├── supabase/migrations/        # 数据库迁移
├── types/                      # TypeScript 类型定义
└── docs/                       # 项目文档
```

## 安全模型

### 零知识架构

1. **客户端加密** — 所有密钥和账本数据在浏览器中加密
2. **密钥派生** — PBKDF2-HMAC-SHA256，310,000 次迭代，生成 256-bit 密钥
3. **对称加密** — AES-GCM 确保数据完整性和机密性
4. **服务器隔离** — Supabase 仅存储密文，RLS 确保用户数据隔离

### 数据库表

| 表名 | 用途 |
|------|------|
| `api_keys` | 密钥管理（name 明文，payload 加密） |
| `ledger_entries` | 账本记录（全字段加密） |
| `ledger_categories` | 账本分类（预留） |

## 文档

- [部署与配置指南](docs/SETUP.md)
- [认证与授权指南](docs/AUTH_GUIDE.md)
- [产品需求文档](docs/PRD.md)
- [开发计划](docs/PLAN.md)

## 开发

```bash
npm run lint      # 代码检查
npm run build     # 构建检查
```

## 许可证

MIT License
