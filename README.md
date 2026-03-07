# KeyNexus - 智能密钥保险箱

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2FKeyNexus&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_MASTER_PASSWORD)

一个基于 Next.js 和 Supabase 的云端密钥管理工具，采用零知识架构，确保敏感数据在客户端加密后才离开设备。

## ✨ 特性

- 🔐 **零知识加密**: 所有敏感数据在浏览器中加密，服务器永不接触明文密钥
- 🔑 **AES-GCM 加密**: 使用 PBKDF2 密钥派生和 AES-GCM 加密算法
- 🌐 **Google OAuth**: 通过 Supabase Auth 集成 Google 登录
- 📱 **响应式设计**: 现代化的暗色主题 UI
- 🔄 **实时同步**: 通过 Supabase 实现跨设备数据同步
- 🛡️ **行级安全**: Supabase RLS 确保多租户数据隔离

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Supabase 账户

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量模板：
```bash
cp .env.local.example .env.local
```

2. 配置 Supabase：
   - 在 [Supabase Dashboard](https://supabase.com/dashboard) 创建新项目
   - 启用 Google OAuth 并配置重定向 URI
   - 获取项目 URL 和 API Key

3. 更新 `.env.local`：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MASTER_PASSWORD=your_secure_master_password
```

### 数据库设置

1. 启动本地 Supabase（可选）：
```bash
npx supabase start
```

2. 应用数据库迁移：
```bash
npx supabase db push
```

### 运行项目

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start
```

## 📁 项目结构

```
KeyNexus/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── Header.tsx         # 页面头部
│   ├── KeyForm.tsx        # 密钥添加表单
│   ├── VaultList.tsx      # 密钥列表
│   ├── LoginPage.tsx      # 登录页面
│   └── providers/         # 上下文提供者
├── lib/                   # 工具库
│   ├── crypto.ts          # 加密/解密函数
│   └── supabase/          # Supabase 客户端
├── supabase/              # Supabase 配置
│   └── migrations/        # 数据库迁移
└── types/                 # TypeScript 类型定义
```

## 🔧 技术栈

- **前端**: Next.js 16, React 19, TypeScript
- **样式**: CSS Variables, 暗色主题
- **后端**: Supabase (Auth + Database)
- **加密**: Web Crypto API (AES-GCM + PBKDF2)
- **部署**: Vercel

## 🔒 安全模型

### 零知识架构

1. **客户端加密**: 所有密钥在浏览器中加密
2. **密钥派生**: 使用 PBKDF2-HMAC-SHA256 从主密码生成 256-bit 密钥
3. **对称加密**: AES-GCM 确保数据完整性和机密性
4. **服务器隔离**: Supabase 仅存储加密数据

### 数据库模式

```sql
-- API 密钥表
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('simple', 'pair')),
  encrypted_payload TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 行级安全策略
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);
```

## 📖 使用指南

### 添加密钥

1. 使用 Google 账户登录
2. 点击"简单 Key"或"ID + Secret"选项卡
3. 填写服务名称和密钥信息
4. 点击"保存"按钮

### 复制密钥

- 点击密钥卡片上的"复制 Key"按钮
- 密钥将自动复制到剪贴板
- 成功消息会短暂显示

### 密钥类型

- **简单 Key**: 单密钥存储（如 API Token）
- **ID + Secret**: 双密钥存储（如 App ID + App Secret）

## 🛠️ 开发

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 配置
- 提交前运行测试和构建

```bash
# 代码检查
npm run lint

# 构建检查
npm run build
```

### 加密实现

核心加密逻辑位于 `lib/crypto.ts`：

- `encrypt()`: 加密 JSON 数据为 Base64 密文
- `decrypt()`: 从 Base64 密文解密为 JSON 数据
- `deriveKey()`: 从密码派生加密密钥

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系

如有问题，请通过 GitHub Issues 联系。