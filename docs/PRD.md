# 产品需求文档 (PRD): SoloBiz 一人公司系统

## 1. 文档概述

### 1.1 产品定义

SoloBiz 是一个面向一人公司/独立开发者的管理系统，当前包含两个核心模块：

1. 密钥管理（Vault）：敏感凭证采用客户端加密后存储（零知识）。
2. 收支账本（Ledger）：记录收入/支出并提供统计图表分析。

### 1.2 目标用户

* 需要跨设备同步 API 凭证的开发者。
* 需要轻量记账与收支分析的一人公司经营者。

---

## 2. 功能需求

### 2.1 身份与访问控制

* **Google / GitHub OAuth 登录**：集成 Supabase Auth，支持两种第三方登录方式。
* **RLS 多租户隔离**：所有业务表按 `auth.uid() = user_id` 隔离访问。
* **主密码机制（仅用于密钥模块）**：
  * 主密码通过 `NEXT_PUBLIC_MASTER_PASSWORD` 注入客户端。
  * 仅在浏览器端参与密钥加解密，不上传服务端。



### 2.2 业务模块

* **密钥管理 (多模式支持)**：
    * 支持两种主要的凭证录入模式：
        1. **简单模式 (Simple Key)**：适用于 OpenAI、Anthropic 等单 Key 服务。
        2. **组合模式 (ID + Secret)**：适用于微信、AWS、阿里云等需要 App ID 和 App Secret 配对的服务。
    * **删除功能**：支持删除不再需要的密钥记录。

* **收支账本**：
    * 支持新增收入/支出记录（金额、日期、分类、备注）。
    * 支持列表查看与删除记录。
    * 支持统计视图：全部/按年/按月，折线趋势图 + 分类饼图 + 汇总卡片。

### 2.3 核心交互逻辑

* **Vault 加密存储**：输入数据 -> JSON 序列化 -> 客户端 AES-GCM 加密 -> 上传密文。
* **Vault 解密复制**：点击解密 -> 客户端解密 -> 写入剪贴板。
* **Ledger 明文字段存储**：账本记录以结构化字段存储（`type/amount/category/note/date`），用于统计计算与图表展示。

---

## 3. 技术架构设计

### 3.1 安全架构：零知识（Vault）

* **PBKDF2 密钥派生**：`PBKDF2-HMAC-SHA256` 派生 256 位密钥。
* **AES-GCM 加密**：用于 Vault 密钥数据加密存储。
* **行级安全性 (RLS)**：确保用户只能访问自己的数据行。

### 3.2 数据库模型 (Supabase)

**表名：`api_keys`（密钥模块）**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `id` | UUID | 主键 |
| `user_id` | UUID | 关联 `auth.users`，多租户隔离 |
| `name` | String | 服务名称（明文，如 "Github Token"） |
| `type` | String | 模式类型：`simple` 或 `pair` |
| `encrypted_payload` | Text | 加密后的 JSON 密文 |
| `iv` | Text | 12字节初始化向量 (Base64) |
| `salt` | Text | PBKDF2 专用盐值 (Base64) |
| `created_at` | Timestamp | 创建时间 |

**表名：`ledger_entries`（账本模块）**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `id` | UUID | 主键 |
| `user_id` | UUID | 关联 `auth.users`，多租户隔离 |
| `type` | Text | `income` / `expense` |
| `amount` | Numeric(14,2) | 金额，必须 > 0 |
| `category` | Text | 分类，默认 `未分类` |
| `note` | Text | 备注，默认空字符串 |
| `date` | Date | 业务日期 |
| `created_at` | Timestamp | 创建时间 |

---

## 4. 界面 (UI/UX) 规范

### 4.1 页面与导航

* `/`：系统总览（累计统计、本月概况、模块快捷入口）
* `/vault`：密钥管理（新增 + 列表 + 解密复制）
* `/ledger`：收支账本（统计 / 记账两个 Tab）


### 4.2 交互状态

* **操作反馈**：
    * **Toast 提示**：所有的保存、复制、错误提示均采用非阻塞的 Toast (通知气泡) 形式，显示在页面右下角。
    * **自动消失**：提示框在 2 秒后自动消失。
    * **状态区分**：成功操作显示绿色边框，失败操作显示红色边框（纯文字，不带图标）。
* **加载反馈**：提交时按钮显示 "Saving..." 状态并禁用，防止重复点击。

---

## 5. 核心逻辑实现 (完整代码参考)

### 5.1 Vault 数据准备与加密逻辑

```javascript
// 假设数据结构
const simpleData = { key: "sk-123..." };
const pairData = { appId: "wx...", appSecret: "sct..." };

// 加密前统一转为 JSON 字符串
const payload = JSON.stringify(isPair ? pairData : simpleData);

```

### 5.2 主密码管理

为了简化开发与部署体验：

* **主密码管理**：当前版本采用**环境变量注入**方式。
* **环境变量名**：`NEXT_PUBLIC_MASTER_PASSWORD`。
* **安全性保证**：密码仅存在于客户端内存中，不随数据上传，维持“零知识”架构的核心原则。

---

## 6. 当前状态与后续方向

* **已完成**：Vault 加密存储、Ledger 记账与统计、Dashboard 总览、Google/GitHub OAuth。
* **可迭代方向**：账本高级筛选、导入导出、预算/目标管理、更多可视化报表。

---

## 7. 部署与环境准备

1. **Vercel**: 关联 GitHub 仓库，开启自动部署。
2. **Supabase**:
* 配置 Google / GitHub Auth 重定向 URL。
* 运行迁移创建 `api_keys` 与 `ledger_entries` 表并启用 RLS 策略。


3. **环境变量**:
* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `NEXT_PUBLIC_MASTER_PASSWORD` (用于派生加密密钥)

