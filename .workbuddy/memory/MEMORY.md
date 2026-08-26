# 小雨手机项目 · 长期记忆

## 用户工作方式（高优先级约定）

- **"我让你改哪，你就只改哪"**：用户每次只下单一明确指令，我只改那一处。绝不顺带"顺手修"相关代码、绝不扩大改动范围、绝不同时改多个互相牵连的视觉点。
- 用户明确表示**不需要我每次改完都停下来等他确认**。按他指的地方改 → 构建 → 打开预览即可，他看了会自己判断。
- 一次只动一个点，别在同一窗口里批量改 3 套独立逻辑（教训：8月26日-3 把 AI 气泡尾巴 + buff chip + 语音条混在一起改，被用户打回）。
- 涉及预设源 / 守护样式 / 基础 CSS 这类"跨文件生效"的代码，除非用户明确要求，否则不动。

## 项目常规

- 源码仓库：`C:\Users\Yu\Documents\ChatGPT\nuomi\SullyOS888-workspace\SullyOS888-master`
- 工作分支：`customization`；成品目录：`C:\Users\Yu\Documents\GitHub\SullyOS888`
- 每次构建前递增 `utils/buildInfo.ts` APP_VERSION（中文日期号），同步 `public/version.json`。
- 构建：`GITHUB_PAGES=true npx pnpm build`（pnpm 不在 PATH，要用 npx）。
- `vite.config.ts` 已设 `build.emptyOutDir: false`（避免 WorkBuddy trash shim 失败），本地预览固定 4173 端口、dev 5173。

## 当前状态（2026-08-26）

- 版本号回到 `8月25日-16`。
- 保留了：API 总开关（`utils/apiMasterSwitch.ts` + `utils/safeApi.ts` 拦截 + `apps/Settings.tsx` 单行卡片）、端口固定、`emptyOutDir: false`。
- 回滚了 8月26日-3/4 的 AI 气泡尾巴、头像对齐、buff chip 单行、语音条美化。
