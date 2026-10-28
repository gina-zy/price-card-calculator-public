# 价卡计算器（公开版）

这是一个基于 React + Vite 的价卡计算器，可作为静态网站部署到 Vercel。

## 本地运行

```bash
npm install
npm run dev
```

## 构建验证

```bash
npm run build
```

构建产物位于 `dist` 目录。

## 部署到 Vercel

### 第一步：创建 GitHub 仓库

1. 登录 GitHub，打开 <https://github.com/new>。
2. 仓库名称填写 `price-card-calculator-public`。
3. 选择 **Public**。
4. 不勾选 README、`.gitignore` 和 License。
5. 点击 **Create repository**。

### 第二步：上传项目

在项目目录运行：

```bash
git init
git add -A
git commit -m "Initial public deployment"
git branch -M main
git remote add origin https://github.com/<你的用户名>/price-card-calculator-public.git
git push -u origin main
```

GitHub 不支持使用账号密码执行 `git push`。如命令要求认证，请使用 GitHub Personal Access Token，或在 GitHub 网页中手动上传项目文件。不要把密码或 Token 写入代码、配置文件或聊天消息。

### 第三步：导入 Vercel

1. 打开 <https://vercel.com/new>，选择 **Continue with GitHub**。
2. 授权 Vercel 访问 GitHub。
3. 找到并导入 `price-card-calculator-public` 仓库。
4. 填写以下构建配置：

| 配置项 | 值 |
| --- | --- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 第四步：配置环境变量

在 Vercel 项目的 **Environment Variables** 中添加：

| 变量名 | 值 | 说明 |
| --- | --- | --- |
| `VITE_API_TIMEOUT_MS` | `1000` | 内网 API 在外网不可达时快速回退 |
| `VITE_ADMIN_PASSWORD_SHA256` | 管理员密码的 SHA-256 值 | 可选；保留静态版管理入口 |

不要将管理员密码明文填入环境变量。可在自己的电脑上计算 SHA-256：

```bash
printf '%s' '你的管理员密码' | shasum -a 256
```

复制输出中的 64 位十六进制值，填入 `VITE_ADMIN_PASSWORD_SHA256`。

配置完成后点击 **Deploy**。部署成功后，Vercel 会提供一个 `https://...vercel.app` 公网链接。

## 重要说明

- 页面访问和计算功能可以在外网使用；内网 API 不可达时会自动使用内置价卡数据。
- 静态部署下，管理员上传并发布的价卡保存在当前浏览器的 `localStorage` 中，只对当前浏览器生效，不会同步给其他访问者。
- `VITE_ADMIN_PASSWORD_SHA256` 属于前端校验，只能作为便捷访问控制，不是强安全边界。
- 如果需要“一次发布、所有外部用户同步更新”，需将价卡 API 和持久化存储一并迁移到公网后端。

## Vercel 常见问题

### 构建失败

先在本地运行：

```bash
npm install
npm run build
```

本地构建通过后再重新部署。

### 页面一直显示数据加载失败

确认已配置：

```text
VITE_API_TIMEOUT_MS=1000
```

即使内网 API 不可达，页面仍会回退到内置数据。

### 修改环境变量后没有生效

在 Vercel 项目的 **Deployments** 页面执行一次 **Redeploy**。Vite 环境变量会在构建阶段写入前端产物，因此修改后必须重新构建。
