# 前端约定

Vite + React 19 + TypeScript（strict）+ Tailwind CSS v4 + React Router v7 + Radix UI 原语 +
Lucide 图标。新增或改版 UI 前先读项目根目录 `DESIGN.md`，以及 app-studio-dev Skill 中的
`references/frontend/ui-spec.md`（视觉规范）与 `references/frontend/dev-guide.md`（工程机制）。

## 目录

```
src/
├── components/
│   ├── ui/              # 基础组件：Button Input Field Select Checkbox/Switch Tabs Dialog Sheet
│   │                    #   DropdownMenu Tooltip Badge Card Table Feedback(EmptyState/Alert/Skeleton) Toaster
│   ├── layout/          # AppShell（侧栏 + 顶栏 + 移动端抽屉）、Page / PageHeader
│   ├── LocaleToggle.tsx
│   └── ThemeToggle.tsx
├── pages/
│   ├── HomePage.tsx         # 概览（空状态）
│   ├── WorkspacePage.tsx    # 标准列表页参考实现，业务开发时替换
│   ├── NotFoundPage.tsx
│   └── UnauthorizedPage.tsx
├── lib/cn.ts          # clsx + tailwind-merge
├── i18n/              # zh.ts（Messages 类型）/ en.ts / index.ts
├── App.tsx            # 路由表 + 鉴权门控 + Toaster；非首页路由 lazy 加载
├── api.ts             # 统一请求（自动携带 JWT），组件中不直接 fetch
├── auth.ts / auth-context.tsx   # SSO JWT + /v1/ping 权限校验
├── UserAvatar.tsx     # ByteCloud 头像与中文名
├── theme-context.tsx  # 深浅主题（.dark 类，localStorage 持久化）
├── index.css          # 全部设计 token
└── main.tsx
```

## 必须遵守

- **颜色只用语义 utility**：`bg-surface` `bg-canvas` `bg-muted` `border` `border-border-strong`
  `text-fg` `text-fg-muted` `text-fg-subtle` `bg-primary` `text-primary` `bg-primary-soft`
  `text-success-fg` `bg-danger-soft` 等。不写十六进制、不写 `blue-600` / `emerald-700` 等原始色，
  不为颜色补 `dark:` 变体（token 已含暗色值）。
- **单一品牌色**：`--color-brand-*`（根据应用性质选择，脚手架默认蓝色 `#245BDB`）只用于
  主按钮、选中态、链接、焦点环。换品牌只改色阶，并同步 favicon、MCP View fallback 与 `DESIGN.md`。
- **复用组件**：按钮、表单、下拉、弹窗、菜单、表格、状态、Toast 一律用 `components/ui`；
  不用原生 `<select>`，不自建 div 弹层，不引入其他组件库或图标库。新组件基于 `radix-ui` 原语
  放入 `components/ui/`。
- **用户头像**：凡是需要显示用户头像或用户标识的地方，统一使用 `src/UserAvatar.tsx` 的
  `UserAvatar` 组件（自动拉取 ByteCloud 头像与中文名，带首字母 fallback）。不自建头像 div
  或 `<img>` 拼圆角，不引入第三方 Avatar 库。
- **页面结构**：每个路由以 `<Page>` 为根、`<PageHeader>` 开头，最多一个 primary 按钮；
  控件默认 32px 高；圆角 6px（控件）/ 8px（容器）；阴影只给浮层。
- **状态完整**：数据区实现 loading（Skeleton）、empty、无结果、error（可重试）；写操作按钮
  `loading`，结果用 `toast`。
- **文案**：全部进 `i18n`；不写营销语、emoji、感叹号；缺失值显示 `—`。
- **禁止 AI 味**：紫色 / 渐变 / 发光 / 毛玻璃、染色页面背景、彩色图标方块统计卡、卡片套卡片、
  大写眉标与衬线大标题、彩虹 Badge、`rounded-2xl` 以上圆角。

## 主题与 i18n

- `ThemeProvider` 切换 `<html>.dark`；`index.html` 内联脚本在首帧前恢复主题。
- `useLocale()` 返回 `{ locale, setLocale, t }`；`en.ts` 以 `satisfies Messages` 对齐 `zh.ts`；
  时间数字用 `Intl` 按 locale 格式化。
