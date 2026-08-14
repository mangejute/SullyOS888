# 小雨手机 / SullyOS888 项目永久记忆

> 供后续所有开发窗口使用。开始工作前先读本文件；完成改动后同步更新版本号、构建产物和本文件中的状态。

## 唯一开发入口（优先级最高）

本项目虽基于“手抓糯米机 / SullyOS”，但当前这套 `customization` 分支是用户自己的**小雨手机二改版**。以后所有需求只能在下面的唯一源码目录实现：

`C:\Users\Yu\Documents\ChatGPT\nuomi\SullyOS888-workspace\SullyOS888-master`

禁止误改上游原版、`SullyOS-github`、任何 `SullyOS888-update-*`、`SullyOS888-pages-*` 或 `_orig_tmp_*` 历史/备份目录。唯一上传成品目录是 `C:\Users\Yu\Documents\GitHub\SullyOS888`。根目录的 `AGENTS.md` 也写有此硬性约定。

## 项目与发布

- 源码仓库：`C:\Users\Yu\Documents\ChatGPT\nuomi\SullyOS888-workspace\SullyOS888-master`
- 工作分支：`customization`
- 远程：`upstream`（`https://github.com/mangejute/SullyOS888.git`）
- 用户上传成品目录：`C:\Users\Yu\Documents\GitHub\SullyOS888`
- 成品目录根部必须是可直接发布的静态网站；`source` 子目录保存源码备份。
- 不要同步/提交：`node_modules`、`.git`、`chrome-check`、`.env`、`.env.local`。

每次交付都必须完成：

1. 修改 `utils/buildInfo.ts` 的 `APP_VERSION`，使用中文日期版本号，例如 `8月14日-1`，每次改动递增，不能漏改。
2. 同步 `public/version.json`，两处版本号必须一致。
3. 在仓库根目录运行 `$env:GITHUB_PAGES='true'; pnpm build`，确认构建成功。
4. 将 `dist` 内容同步到成品目录根部，并将源码同步到成品目录 `source`。
5. 提交并推送 `upstream customization`。
6. 核对本地提交号、`git ls-remote upstream refs/heads/customization` 和成品目录中的 `version.json`。

建议同步命令：

```powershell
$source='C:\Users\Yu\Documents\ChatGPT\nuomi\SullyOS888-workspace\SullyOS888-master'
$target='C:\Users\Yu\Documents\GitHub\SullyOS888'
robocopy $source $target /MIR /XD node_modules .git chrome-check dist /XF .env .env.local
robocopy (Join-Path $source 'dist') $target /MIR
robocopy $source (Join-Path $target 'source') /MIR /XD node_modules .git chrome-check dist /XF .env .env.local
```

电脑和手机必须使用同一份最新成品。用户主要通过成品目录上传，不要只改源码而不更新成品。

## 长期合作约定

- 用户主要使用中文；沟通直接、具体，默认直接修改、构建、测试、同步和发布，不只给方案。
- 发布前必须实际测试，不能只说“应该可以”。电脑和手机的交互、布局、版本内容要一致。
- 任何 API 配置、预设、角色设置、阅读进度、阅读样式、批注、聊天记录和导入导出数据都必须持久化；网页版本更新不能恢复默认或丢失用户填写内容。
- 备份导入导出要向后兼容，新增字段不能让旧备份白屏、卡死或破坏聊天数据。
- 图片/语音等失效资源不要继续送进上下文，避免远程 API 因 404 文件下载失败而返回 500。
- 不要破坏用户已有工作树，不使用 `git reset --hard` 等破坏性操作，不把密钥或临时文件提交。

## 已实现功能要点

### 聊天与消息

- 只发送一张或多张图片时，必须等用户点击发送才触发 AI；图片在发送前只作为待发送内容，发送后才进入聊天记录。
- 失效图片不再放入后续上下文。
- “重新生成/重回”放在长按消息的局部操作菜单中；菜单半透明、按钮颜色中性，点击空白退出。
- 聊天界面发起的视频通话：真正挂断后直接回到当前聊天界面；“先忙别的”只缩成悬浮绿条并保持通话。桌面电话应用保持原有逻辑。

### API、语音与 TTS

- 已接入 MiniMax、Fish Audio、Qwen TTS、小米 MiMo TTS。
- 角色聊天/视频通话语音服务与书库朗读服务必须分开选择；书库的小米选项选择音色，不选择角色。
- 小米默认地址：`https://api.xiaomimimo.com/v1`；默认模型：`mimo-v2.5-tts`。
- 各服务商配置、模型/音色列表、预设、测试连接、试听和保存必须持久化，更新版本不能清空。
- 默认试听文本：`你好，当前正在测试是否成功，你听到此语音，代表测试成功。`
- 书库小米朗读：当前章节按自然段/句末切成约 420 字片段，先全部生成再播放，片段间约 1.5 秒停顿；支持暂停、继续、停止；临时音频只保留当前阅读会话，离开阅读器释放。

### 书库与阅读器

- EPUB 目录必须读取真实目录标题，保留“第几部/第几章”等原名；目录点击要跳转到对应章节，而不是回到第一页。
- 用户进度自动保存，并提供“保存当前进度”；下次打开直接恢复上次位置。进度、样式、批注、共读记录都进入导入导出。
- 阅读样式包括字体、字号、行距、加粗、背景、黑白/墨水屏模式和可保存的自定义预设；布局必须适配不同屏幕，不能遮挡最后一行。
- 普通阅读采用整章上下滚动；涂鸦模式固定页面并禁止误触滚动，提供上一页/下一页、上一章/下一章。
- 涂鸦只支持划线和橡皮擦，可调粗细，有“清屏”按钮；退出书库即清除，不持久保存。墨水屏上要尽量降低绘制卡顿。
- “一起阅读本章”必须把书名、作者、第几部、第几章和完整章节内容发给 AI；批注应精确落在被吐槽的原文句子上，并显示波浪线和角色批注框；章节末附 100~300 字阅读感悟。
- 共读批注、感悟和保存进度要实时以卡片写入对应角色聊天记录/记忆；读过 5 章应有 5 张卡片。

### 家园

- 时间卡下方是“命运抉择”。右上角“生成”按钮让 AI 读取当前节点剧情、角色位置/行程、群聊、伏笔、世界观和当前时刻后，生成 3 条具体且方向不同的下一节点选项。
- 每条选项约 45~100 字，必须承接当前剧情、涉及现有角色/地点/事件，不能是通用套话。
- 点击选项后作为强制 `storyDirective` 注入所有角色和 NPC 的下一段提示词；成功推进时间后因 `storyClock` 变化自动重新生成 3 条。
- `WorldProfile` 相关字段：`storyDirective`、`storyOptions`。演绎完成后临时指令自动清除。
- 伏笔只保留最近 3 天（约 12 段），打开家园时也要清理旧伏笔，不能无限累积。

## 当前代码位置

- 版本：`utils/buildInfo.ts`、`public/version.json`
- 书库/阅读器/TTS：`apps/VRWorldApp.tsx`、`utils/xiaomiTts.ts`、`utils/ttsRouter.ts`
- 家园：`apps/WorldHomeApp.tsx`、`utils/worldHome/engine.ts`、`utils/worldHome/prompts.ts`、`types.ts`
- 小雨手机角色世界空间：聊天 `＋` 面板中的独立 `地图` / `NPC` 入口；实现于 `apps/Chat.tsx`、`components/chat/ChatInputArea.tsx`、`components/chat/WorldSpaceModal.tsx`。地图保存到角色 `worldMap`，NPC 保存到角色 `worldNpcs`；地图重新打开时恢复已保存的可视化节点布局。

### 8月15日-2：地图与 NPC 资料体验

- 地图和 NPC 的资料/AI 识别区在已有数据时默认折叠，保存后自动折叠；可随时展开重新识别或编辑资料。
- 地图采用可横向查看的固定网格布局，地点图标缩小、名称自动换行；无论地点数量多少，打开时都以此清晰布局展示，不使用旧的随机坐标堆叠方式。
- 地点卡只显示 AI 识别出的 `家` / `工作` 标签，不给用户逐项勾选；原有 `isHome` / `isWork` 字段继续用于日程和家园联动。
- 地图和 NPC 页面均可单独导出/导入 JSON，也会随整合备份的角色资料保存。
- NPC 新增 `relationType`、`relationStrength`、`relationStatus`、`contactFrequency`、`relationReason`。AI 要独立判断关系类别与实际亲密度，血缘不自动等于亲密；关系图以强度控制与角色中心的距离和连线样式。

## 当前待核验

- `8月15日-1` 家园首次打开/重新回到前台会按时间顺序补齐当天已经到达的凌晨、早上、中午、晚上段；未来段不会提前演绎。顺序固定为家园当天生活计划、角色今日日程、家园分段演绎。每段只有成功落库后才计为完成，失败会留待下次检查重试。新家园默认启用四段自动运行；已有家园可在世界设置中自行勾选时段。

- `8月13日-9` 的家园动态选项已实现，但真实网页/手机尚未完整验证。
- 提交 `b2e4817c` 最后一次推送曾遇到 GitHub 网络失败；下次发布前先核对远程分支是否已包含该提交。
- 历史上 `tsc --noEmit` 有大量旧错误；验证时区分新增错误，构建成功是发布最低标准。

## 发布前自检

- [ ] 版本号已递增且两处一致
- [ ] 构建成功，成品根目录可直接打开
- [ ] 电脑端和手机端核心路径实测
- [ ] 设置、预设、聊天、阅读进度和导入导出没有被重置
- [ ] 成品目录已同步，远程提交号已核对
