# KeyNexus 部署与配置指南

## 1. 环境变量

复制 `.env.local.example` 为 `.env.local`，填入：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Supabase 配置

### 2.1 创建数据库表

在 Supabase Dashboard → SQL Editor 中执行迁移脚本：

```bash
# 或使用 Supabase CLI
supabase db push
```

迁移文件位于 `supabase/migrations/20250301000000_create_api_keys.sql`。

### 2.2 配置 Google OAuth

1. 进入 Supabase Dashboard → Authentication → Providers
2. 启用 Google 提供商
3. 在 Google Cloud Console 创建 OAuth 2.0 凭据
4. 将 Supabase 提供的重定向 URL 添加到 Google OAuth 的「已授权的重定向 URI」
5. 将 Client ID 和 Client Secret 填入 Supabase

### 2.3 重定向 URL 示例

- 开发：`http://localhost:3000/`
- 生产：`https://your-vercel-domain.vercel.app/`

## 3. 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 4. Vercel 部署

1. 将仓库关联到 Vercel
2. 在 Vercel 项目设置中配置环境变量
3. 在 Supabase 的 Google Auth 重定向 URL 中添加 Vercel 生产域名
