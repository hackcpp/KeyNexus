# 产品需求文档 (PRD): KeyNexus 智能密钥保险箱

## 1. 文档概述

### 1.1 产品定义

KeyNexus 是一个面向开发者的云端密钥管理工具，部署于 Vercel，利用 Supabase 存储。其核心特性是**“零知识架构”**：所有敏感数据在离开浏览器前均已加密，服务端不触碰任何明文。

### 1.2 目标用户

* 需要跨设备（公司/家里）同步 API 配置的开发者。
* 经常处理“仅显示一次”的 API Key 并担心明文记录安全性的用户。

---

## 2. 功能需求

### 2.1 身份与访问控制

* **Google OAuth 登录**：集成 Supabase Auth，仅允许授权用户访问其私有仓库。
* **主密码机制 (Master Password)**：
* 用户登录后必须输入主密码。
* 该密码不上传服务器，仅用于派生本地加密/解密密钥。



### 2.2 密钥管理 (多模式支持)

支持两种主要的凭证录入模式：

1. **简单模式 (Simple Key)**：适用于 OpenAI、Anthropic 等单 Key 服务。
2. **组合模式 (ID + Secret)**：适用于微信、AWS、阿里云等需要 App ID 和 App Secret 配对的服务。

### 2.3 核心交互逻辑

* **加密存储**：输入数据 -> JSON 序列化 -> 客户端 AES-GCM 加密 -> 上传密文。
* **解密复制**：点击解密 -> 客户端从内存获取主密码 -> 解密密文 -> 解析 JSON -> 存入剪贴板。
* **自动脱敏**：列表页默认只显示服务名称和类型标签，不显示任何 Key 内容。

---

## 3. 技术架构设计

### 3.1 安全架构：零知识证明 (Zero-Knowledge)

* **PBKDF2 密钥派生**：使用 `PBKDF2-HMAC-SHA256` 算法，将用户的主密码转换为 256 位的强密钥。
* **AES-GCM 加密**：使用带身份验证的加密模式，防止密文被篡改。
* **行级安全性 (RLS)**：在 Supabase 开启 RLS，确保用户 `A` 永远无法通过 API 查看到用户 `B` 的加密数据（即使是密文）。

### 3.2 数据库模型 (Supabase)

**表名：`api_keys**`

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `id` | UUID | 主键 |
| `user_id` | UUID | 关联 `auth.users`，多租户隔离 |
| `name` | String | 服务名称（明文，如 "Github Token"） |
| `type` | String | 模式类型：`simple` 或 `pair` |
| `encrypted_payload` | Text | 加密后的 JSON 密文 (Base64) |
| `iv` | Text | 12字节初始化向量 (Base64) |
| `salt` | Text | PBKDF2 专用盐值 (Base64) |
| `created_at` | Timestamp | 创建时间 |

---

## 4. 界面 (UI/UX) 规范

### 4.1 页面布局

1. **控制台顶部**：
* 用户信息及退出按钮。
* **主密码输入栏**（关键）：常驻顶部或以浮层形式，若未输入，下方所有复制按钮置灰。


2. **录入区 (Form)**：
* 一个 Tab 切换器：[简单 Key] | [ID + Secret]。
* 动态表单：根据 Tab 改变输入框数量。


3. **列表区 (Vault)**：
* 卡片式设计，显示服务名、类型图标、创建日期。
* 动作组：
* 简单模式：[复制 Key]
* 组合模式：[复制 ID] [复制 Secret]


### 4.2 交互状态

* **锁定状态**：未输入主密码时，列表显示，但无法解密。
* **错误反馈**：若主密码输入错误，解密会失败并弹出“密码校验失败”提示。

---

## 5. 核心逻辑实现 (完整代码参考)

### 5.1 数据准备与加密逻辑

```javascript
// 假设数据结构
const simpleData = { key: "sk-123..." };
const pairData = { appId: "wx...", appSecret: "sct..." };

// 加密前统一转为 JSON 字符串
const payload = JSON.stringify(isPair ? pairData : simpleData);

```

### 5.2 安全存储建议 (Session Management)

为了平衡安全与体验：

* **主密码存储**：建议存放在 `window.sessionStorage` 中。
* **效果**：刷新页面无需重输，但关闭浏览器标签页后立即清除，防止他人使用该电脑查看。

---

## 6. 项目路线图 (Roadmap)

* **Phase 1 (MVP)**：完成 Google 登录、AES-GCM 基础加解密、简单/组合模式录入。
* **Phase 2 (优化)**：增加模糊搜索、分类标签（Tags）、最近使用排序。
* **Phase 3 (进阶)**：增加“安全检查”功能（检测 Key 是否在 GitHub 等平台泄露）、生成强随机密码小工具。

---

## 7. 部署与环境准备

1. **Vercel**: 关联 GitHub 仓库，开启自动部署。
2. **Supabase**:
* 配置 Google Auth 重定向 URL。
* 运行 SQL 创建 `api_keys` 表并启用 RLS 策略。


3. **环境变量**:
* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`

