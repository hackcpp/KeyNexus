# KeyNexus 部署与配置指南

## 1. 环境变量

复制 `.env.local.example` 为 `.env.local`，填入：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MASTER_PASSWORD=your_secure_master_password
```

> **注意**：`NEXT_PUBLIC_MASTER_PASSWORD` 是用于客户端加解密的固定主密码，请确保其足够复杂且安全。

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

## 3. 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 4. Vercel 部署步骤

1. **导入仓库**：
   - 在 [Vercel Dashboard](https://vercel.com/dashboard) 点击 **Add New** -> **Project**。
   - 关联并导入您的 GitHub 仓库。

2. **配置环境变量**：
   - 在 **Configure Project** 阶段，展开 **Environment Variables** 区域。
   - 添加以下三个变量：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_MASTER_PASSWORD` (您的固定主密码)

3. **配置生产环境重定向 (核心安全步骤)**：
   - **为什么要配置？** OAuth 登录后，Google 和 Supabase 需要确认跳转回的域名是受信任的，否则会因安全策略报错。
   - **获取域名**：在 Vercel 部署完成后，复制分配给你的生产域名（例如 `https://key-nexus.vercel.app`）。
   - **配置 Supabase** (Dashboard -> Authentication -> URL Configuration)：
     - **Site URL**：填入你的 Vercel 域名。这确保了系统发送的确认邮件和重置链接指向正确的生产地址。
     - **Redirect URLs**：新增一条你的 Vercel 域名（建议末尾加 `/**`，如 `https://your-app.vercel.app/**`）。这告诉 Supabase 允许将登录成功的用户重定向回该地址。
   - **配置 Google Cloud** (Console -> APIs & Services -> Credentials)：
     - 在对应的 OAuth 2.0 客户端 ID 设置中，找到 **已授权的重定向 URI** (Authorized redirect URIs)。
     - 确保包含 Supabase 的回调地址（格式为 `https://[PROJECT_REF].supabase.co/auth/v1/callback`）。
     - 在 **已授权的 JavaScript 来源** (Authorized JavaScript origins) 中添加你的 Vercel 域名。

4. **完成**：
   - 现在您可以通过 Vercel 域名安全地访问 KeyNexus 了。
