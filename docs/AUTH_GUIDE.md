# KeyNexus 认证与授权方案指南 (Supabase + Google OAuth)

本文档详细记录了 KeyNexus 项目中集成的身份认证方案，涵盖了从架构设计到多环境部署的核心逻辑与配置。

## 1. 架构设计

### 1.1 技术栈
- **认证服务**: Supabase Auth (GoTrue)
- **身份提供商 (IdP)**: Google OAuth
- **前端框架**: Next.js 15 (App Router)
- **状态管理**: React Context API (`AuthProvider`)

### 1.2 核心流程
1. **客户端发起**: 用户点击“使用 Google 登录”，通过 `supabase.auth.signInWithOAuth` 发起请求。
2. **三方验证**: 用户在 Google 页面完成验证，Google 回调至 Supabase。
3. **会话建立**: Supabase 验证 Google 响应，建立会话，并根据配置重定向回应用。
4. **状态同步**: 客户端 `onAuthStateChange` 监听到状态变化，更新全局 `User` 状态。

---

## 2. 关键代码实现

### 2.1 动态重定向处理
为了支持多环境（本地、预览、生产），在调用登录时使用 `window.location.origin` 动态获取当前域名。

```typescript
// components/providers/AuthProvider.tsx
const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { 
      redirectTo: `${window.location.origin}/` 
    },
  })
}
```

### 2.2 客户端容错初始化
为了防止 Next.js 构建阶段（Prerendering）因缺少环境变量而报错，采用了安全初始化策略。

```typescript
// lib/supabase/client.ts
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // 构建阶段或变量缺失时不抛出异常，返回占位客户端避免进程崩溃
    return createClient(url || 'http://localhost:54321', key || 'placeholder')
  }
  return createClient(url, key)
}
```

---

## 3. 多环境部署配置 (关键)

### 3.1 Supabase 后台设置
进入 **Authentication -> URL Configuration**：

| 配置项 | 推荐设置 | 说明 |
| :--- | :--- | :--- |
| **Site URL** | `https://your-app.vercel.app` | 生产环境主域名，用于系统邮件和默认重定向。 |
| **Redirect URLs** | `http://localhost:3000/**`<br>`https://*-preview.vercel.app/**` | **白名单列表**。必须包含本地地址和所有可能的预览/生产地址。 |

### 3.2 Google Cloud Console 设置
进入 **APIs & Services -> Credentials**：

1. **已授权的重定向 URI**:
   - 填入 Supabase 的回调地址：`https://[PROJECT_ID].supabase.co/auth/v1/callback`
2. **已授权的 JavaScript 来源**:
   - 填入本地地址：`http://localhost:3000`
   - 填入 Vercel 生产地址：`https://aiziyou.shop`

---

## 4. 常见问题排查 (Troubleshooting)

### Q: 为什么在线上点击登录后跳转到了 localhost:3000？
**A**: 这是因为 Supabase 的 **Site URL** 仍设置为 `localhost`，且发起请求的 Vercel 域名不在 **Redirect URLs** 白名单中。Supabase 会出于安全考虑回退到 Site URL。

### Q: 报错 "Redirect URI mismatch"？
**A**: 
1. 检查 Google Cloud Console 中的回调地址是否与 Supabase 提供的完全一致。
2. 确保发起登录的域名已添加到 Google 的“已授权的 JavaScript 来源”中。

### Q: 构建时报错 "Missing Supabase environment variables"？
**A**: 检查 `createBrowserClient` 是否在模块顶层直接调用了抛出异常的逻辑。应确保在环境变量缺失时能平滑降级（如返回 placeholder），仅在真正需要调用 API 时再进行检查。

---

## 5. 安全建议
- **环境变量前缀**: 客户端使用的变量必须以 `NEXT_PUBLIC_` 开头。
- **敏感信息**: 主密码 (`MASTER_PASSWORD`) 绝不能存储在数据库中，必须通过环境变量注入且仅在客户端内存中使用，以维持“零知识”架构。
