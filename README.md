# 无名小卒工坊 Web 管理系统

> 面向软件技术专业学校工作室场景的成员学习与管理 Web App。

项目仓库：<https://github.com/Goz1-star/---app.git/>

## 项目介绍

**无名小卒工坊** 是一套用于学校工作室日常运营的学习与管理系统，帮助管理员统一管理成员、课程/活动、公告、打卡、积分、任务提交、资料仓库、榜单、小测试和数据导出。

系统区分 **管理员端** 和 **学员端**：

- 管理员负责成员管理、内容发布、任务布置、提交评价、积分奖惩、资料维护、测试管理和数据导出。
- 学员负责查看公告/活动、报名、打卡、提交任务/代码文件、查看资料、积分、榜单和测试结果。

## 核心功能

### 管理员端

- 管理员登录
- 数据概览
- 成员管理
- 积分管理
- 公告管理
- 课程/活动管理与报名审核
- 任务创建与提交评价
- 代码/文件提交管理
- GitHub 写入同步状态查看与重试
- 资料仓库管理
- 阶段性小测试管理
- 系统设置
- Excel 数据导出

### 学员端

- 学员登录
- 查看公告
- 查看课程/活动并报名
- 拍照/时长打卡
- 查看积分
- 提交任务说明、代码文件、文档、图片或 GitHub 链接
- 可选择将代码文件同步写入 GitHub
- 查看任务反馈与 GitHub 同步状态
- 查看资料仓库
- 参加阶段性小测试
- 查看排行榜

## 技术栈

- **Next.js 15**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Prisma**
- **SQLite**
- **Server Actions**
- **ExcelJS**
- **GitHub Contents API**

## 环境要求

建议使用：

- Node.js 20+
- npm

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Goz1-star/---app.git
cd ---app
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env
```

`.env` 示例：

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="dev-session-secret-change-me"
UPLOAD_DIR="./uploads"

# GitHub fine-grained personal access token
# 需要目标仓库 Contents: Read and write 权限
GITHUB_TOKEN=""
```

如果需要启用任务代码文件自动写入 GitHub，请在 `GITHUB_TOKEN` 中填写 GitHub Token。

### 4. 初始化数据库

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. 启动开发服务

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

## 默认测试账号

执行 `npm run db:seed` 后可使用以下账号登录：

| 角色 | 手机号 | 密码 |
| --- | --- | --- |
| 管理员 | `18800000001` | `123456` |
| 学员 | `18800000002` | `123456` |
| 双身份账号 | `18800000003` | `123456` |

手机号验证码登录使用模拟验证码：

```text
123456
```

## 页面入口

管理员端：

```text
/admin/login
```

学员端：

```text
/student/login
```

## GitHub 写入同步配置

系统支持学员提交任务代码文件时，自动写入指定 GitHub 仓库。

### 1. 配置 Token

在 `.env` 中配置：

```env
GITHUB_TOKEN="你的 GitHub Token"
```

Token 建议使用 GitHub fine-grained personal access token，并授予目标仓库：

- Repository access：指定目标仓库
- Contents：Read and write

### 2. 后台开启同步

管理员登录后进入：

```text
/admin/settings
```

在 **GitHub 写入配置** 中填写或确认：

- 仓库地址
- Owner
- 仓库名称
- 默认分支
- 基础目录
- 是否启用任务代码文件自动写入 GitHub

### 3. 学员提交任务

学员进入：

```text
/student/tasks
```

上传 `.js`、`.ts`、`.html`、`.css`、`.vue`、`.java`、`.py` 等代码文件，并勾选 GitHub 写入后，系统会尝试将代码文件写入 GitHub。

### 4. 管理员查看状态与重试

管理员进入：

```text
/admin/tasks
```

可查看每次提交的 GitHub 同步状态：

- 未请求
- 同步中
- 已同步
- 同步失败
- 已跳过

失败后管理员可点击 **重试 GitHub 同步**。

## 常用脚本

```bash
# 启动开发服务
npm run dev

# 生产构建
npm run build

# 启动生产服务
npm run start

# ESLint 检查
npm run lint

# TypeScript 类型检查
npm run typecheck

# 生成 Prisma Client
npm run db:generate

# 同步数据库结构
npm run db:push

# 初始化演示数据
npm run db:seed

# 打开 Prisma Studio
npm run db:studio
```

## 数据与上传文件

- 默认数据库：`prisma/dev.db`
- 默认上传目录：`uploads/`
- 上传目录可通过 `.env` 中的 `UPLOAD_DIR` 修改。
- 代码文件单文件最大限制：`200MB`

## 项目结构

```text
.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── admin/
│   │   └── student/
│   ├── components/
│   └── lib/
├── .env.example
├── package.json
└── README.md
```

## 注意事项

- `.env` 不应提交到 Git 仓库。
- `GITHUB_TOKEN` 不会保存在系统设置中，只从服务端环境变量读取。
- 如果 GitHub 仓库是空仓库，请先初始化默认分支，例如创建 `README.md`，否则 GitHub Contents API 可能无法写入。
- 普通学员不能访问管理员后台功能。
- Web 管理后台仅供管理员使用。

## License

当前项目为学习与工作室管理场景使用，未单独声明开源许可证。
