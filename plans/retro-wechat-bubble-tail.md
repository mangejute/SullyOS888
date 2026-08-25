# 复古微信 · 气泡尾巴改造（进行中，已交接）

> 状态：**未完成，代码停在一个有已知缺陷的中间态**。2026-08-25 记录。
> 接手前请先读「当前状态」和「必踩的坑」两节，否则大概率重蹈覆辙。

## 背景：原来是什么样

角色（AI）侧气泡**不是 CSS 画的**。`components/chat/MessageItem.tsx:2012` 的 `renderBubbleTail()` 写的是
`isUser ? <span/> : null` —— 角色侧直接返回 `null`，整只气泡连尾巴是两张 PNG 靠 `border-image` 贴出来的
（`public/chat-themes/retro-wechat-ai-single.png` / `-multiline.png`）。

因此主题 CSS 里所有 `.sully-bubble-tail-ai` 规则都是**死代码**，没有任何元素带这个 class
（`utils/messageItemModuleLayout.test.ts` 里还有断言在守着这一点）。

用户诉求：**回到纯 CSS 画尾巴**，并且要求
1. 气泡顶与头像顶对齐；
2. 单行消息气泡与头像等高；
3. 尾巴位置固定 —— 单行时居中于气泡，多行时不许下移；引用消息同理；
4. 尾巴与气泡要像**一整块**，不能是「长方形 + 突兀的三角形」。

## 实测出来的原始缺陷（改造前，浏览器实测口径）

| 用例 | 气泡顶−头像顶 | 单行气泡高 | 尾巴中心距气泡顶 |
|---|---|---|---|
| 角色侧 | **+6px** | **16px**（头像 28） | 无尾巴元素 |
| 用户侧普通消息 | 0 | 28 | **22px**（应为 14） |
| 用户侧引用消息 | 0 | 28 | 14 ✓ |

- 角色气泡的盒子本来就比头像低 6px，靠 `border-image-outset:6px` 在视觉上找补；单行高被砍成 `avatar-12px`
  去迁就 PNG 的描边厚度。
- 用户侧普通消息的尾巴**一直偏低 8px、从来没居中过**：`.sully-bubble-layer > .sully-bubble-tail` 那条
  `top: calc(var(--sully-chat-bubble-mt) + avatar/2)` 里的 `+ mt` 是多余的。
  实测 **layer 的顶就等于气泡的顶**（气泡的 margin-top 没有 collapse 出 layer，因为祖先
  `.relative.flex.flex-col` 是 flex 容器，flex item 建立了 BFC）。引用消息那条没加 `+mt`，所以反而是对的。

## 当前状态（已改 / 未改）

### 已完成并实测通过

改动落在两个文件（**都是同一段 CSS 的两份副本**，见「必踩的坑」1）：
- `components/chat/ChromeCssEditor.tsx` —— 「复古微信」预设的 `code` 模板字符串
- `apps/Chat.tsx` —— `retroChatCssActive ? ... : ...` 守护样式分支

内容：
1. **拆掉角色侧 PNG**：`border-image:none`，角色气泡回到和用户侧同构的纯 CSS 渐变 + 1px 边框，
   `margin-top` 回到 `var(--sully-chat-bubble-mt)`，单行高回到 `var(--sully-chat-avatar-size)`。
   → 气泡顶−头像顶 = 0（8/8 用例，含引用消息）；单行气泡高 = 28 = 头像高。
2. **气泡渐变改成「固定高度走完 + 续接末端同色纯色」**：
   `background: linear-gradient(#f7f7f7,#d8d8d8) 0 0/100% var(--sully-bubble-sheen) no-repeat, #d8d8d8`
   （`--sully-bubble-sheen` 默认 = `--sully-chat-avatar-size` = 28px）。
   渐变末端色与续接的纯色相同，所以气泡自身看不出接缝；换来的性质是
   **尾巴所在那一段的颜色不再随气泡高度漂移**，单行/多行完全一致。这条是尾巴能与气泡同色的前提，别删。
3. **尾巴位置抽成恒等式**：
   `--sully-tail-top: calc(var(--sully-chat-avatar-size)/2 - var(--sully-tail-h)/2)`
   → 尾巴中心恒 = 气泡顶 + 14px。单行时正好是气泡中线（居中），多行时原地不动。8/8 用例实测通过。
4. 旧的 SVG 尾巴节点在本主题下 `display:none`（`.sully-chat-root .sully-bubble-tail`）。
   注意只在复古微信分支关，别动 `styles/tailwind.css` 的通用基础层 —— 其它主题仍在用那个 SVG 尾巴。

`node node_modules/vitest/vitest.mjs run utils/messageItemModuleLayout.test.ts` 15 项通过。

### ⚠ 未完成：尾巴描边不可见

当前源码里尾巴是这样画的：`.sully-bubble-layer::before` 用 `clip-path` 切三角形，
描边靠 `filter: drop-shadow(...) drop-shadow(...)`。

**这个描边根本没渲染出来。** 原因：CSS 的渲染顺序是 `filter` 先、`clip-path` 后，
`drop-shadow` 产生的偏移副本落在三角形轮廓之外，随后被 `clip-path` 整个裁掉。

已用受控实验坐实：把描边色临时改成红色 → 看不到红边；再把 `clip-path` 强制 `none` → 红边立刻出现。
（做这个实验时注意特异性：源码选择器是 `(0,4,1)`，覆盖用的选择器要 `(0,5,1)` 以上，
例如补一个 `.sully-bubble-layer-user` 类，否则你以为改了其实没改。）

所以现在的效果是：尾巴形状和位置都对、和气泡同色无缝，但**没有 1px 描边**，
角色侧尤其明显（浅灰填充贴在浅灰背景上，只剩抗锯齿边缘）。用户就是看到这个才提的问。

## 接着怎么做：用用户给的素材（推荐，已验证可行）

用户后来直接给了两张尾巴素材，我已裁好放进项目：

- `public/chat-themes/retro-wechat-tail-ai.png` —— 9×15，尖端朝左，浅灰填充 `#e4e4e4` + `#bbb` 描边
- `public/chat-themes/retro-wechat-tail-user.png` —— 9×15，尖端朝右，深色实心 + 深色描边

（原图是 32×28，不透明区域在 (12,7) 处 9×15，垂直中心 y=14 —— 正好是单行气泡中线，
和上面第 3 条的恒等式天然吻合。裁切时用 `alpha>0` 取包围盒，保住了边缘抗锯齿像素。）

用素材替换掉「clip-path + drop-shadow」那一段即可，描边问题随之消失（描边画在图里）。
下面这段已在浏览器实测：8/8 用例 `气泡顶−头像顶=0`、`尾巴中心距气泡顶=14`、素材正确加载。

```css
/* 变量：挂在 .sully-chat-root 上 */
--sully-tail-w:9px;
--sully-tail-h:15px;
--sully-tail-top:calc(var(--sully-chat-avatar-size,1.75rem) / 2 - var(--sully-tail-h) / 2);
--sully-tail-overlap:0px;   /* 想让尾巴吃掉气泡边框接缝就调成 1px */

/* 素材按侧别选，必须挂在消息行上（见「必踩的坑」2） */
.sully-chat-message-ai{--sully-tail-img:url('./chat-themes/retro-wechat-tail-ai.png');}
.sully-chat-message-user{--sully-tail-img:url('./chat-themes/retro-wechat-tail-user.png');}

.sully-chat-root .sully-bubble-layer:not(:has(> .sully-bubble-with-reply))::before,
.sully-chat-root .sully-bubble-reply-stack::before{
  content:""!important;position:absolute!important;
  top:var(--sully-tail-top)!important;
  width:var(--sully-tail-w)!important;height:var(--sully-tail-h)!important;
  background:var(--sully-tail-img) 0 0/100% 100% no-repeat!important;
  clip-path:none!important;filter:none!important;border:0!important;
  z-index:3!important;pointer-events:none!important;
}
.sully-chat-root .sully-chat-message-ai .sully-bubble-layer:not(:has(> .sully-bubble-with-reply))::before,
.sully-chat-root .sully-chat-message-ai .sully-bubble-reply-stack::before{
  left:calc(-1 * var(--sully-tail-w) + var(--sully-tail-overlap))!important;right:auto!important;
}
.sully-chat-root .sully-chat-message-user .sully-bubble-layer:not(:has(> .sully-bubble-with-reply))::before,
.sully-chat-root .sully-chat-message-user .sully-bubble-reply-stack::before{
  right:calc(-1 * var(--sully-tail-w) + var(--sully-tail-overlap))!important;left:auto!important;
}
```

落地时记得把源码里旧的那段（`clip-path:polygon(...)` + `filter:drop-shadow(...)` +
`--sully-tail-fill` / `--sully-tail-border` / `--sully-tail-drop` / `--sully-tail-nose`）删掉，
**两个文件都要改**。

未做完的判断题（需要看效果定）：
- `--sully-tail-overlap` 取 `0px`（尾巴紧贴气泡外边框）还是 `1px`（往气泡里埋 1px 盖住边框接缝）。
  0px 已截图确认可用；1px 没来得及看。
- 素材是位图，在 3x DPR 屏上会被插值放大，边缘会比 CSS 画的略糊。
- 用户侧素材实测取色 `#3d3d3d~#525252`，比气泡在该高度的渐变色（`#414141~#303030`）偏亮一点，
  接缝处可能有轻微色差；角色侧素材 `#e4e4e4` 对气泡的 `#efefef~#e0e0e0` 也略偏灰。
  介意的话要么调素材，要么把气泡渐变往素材靠。

### 备选方案（如果想回到纯 CSS 不用素材）

描边改用**双伪元素**，不要用 `filter`：
`::before` 画一个按法向外扩 1px 的「放大三角」当描边（纯边框色），`::after` 画填充三角盖在上面，
只在两条外斜边露出 1px。外扩量：
`gx = 1px * √(W² + (H/2)²) / (H/2)`、`gy = gx * (H/2) / W`，
W = 露出宽 + 1px 埋入，H/2 = 半高。W=6、H/2=5 时 → `gx=1.562px`、`gy=1.302px`。
两层都只用 `clip-path`，不碰 `filter`，就绕开了裁剪问题。
这版写到一半（`cand6.css` 的思路），没跑完验证。

## 必踩的坑

1. **同一段主题 CSS 有三份副本，改一处不生效**：
   - `components/chat/ChromeCssEditor.tsx` 的预设源文本（点预设时写入的模板）
   - `localStorage.os_theme.chatChromeCustomCss`（用户**实际生效**的那份，老用户存的是旧文本）
   - `apps/Chat.tsx` 的 `retroChatCssActive` 守护样式段
   守护样式**注入在用户 CSS 之后且全是 `!important`**，所以它既是「改了主题 CSS 却没反应」的常见真因，
   也是让改动对老存档自动生效的抓手。
   验收要分别测「新预设」和「localStorage 还是旧 CSS」两种组合 —— 我两种都测过，都通过。

2. **CSS 变量的继承方向**（我在这里栽过一次）：
   尾巴伪元素挂在 `.sully-bubble-layer` 上，而 `.sully-bubble-ai` / `.sully-bubble-user` 是它的**子**元素。
   变量只向下继承，把 `--sully-tail-*` 写在气泡本体上，父级的伪元素读不到，
   `background` / `filter` 会双双解析成 `none` —— **尾巴直接隐形**。
   必须写在 `.sully-chat-message-ai` / `.sully-chat-message-user`（消息行，是 layer 的祖先）上。

3. **`clip-path` 会裁掉 `filter` 的输出**，所以 `drop-shadow` 做描边在有 `clip-path` 的元素上无效。

4. **引用消息的尾巴宿主不同**：普通消息在 `.sully-bubble-layer`，引用消息在 `.sully-bubble-reply-stack`
   （`MessageItem.tsx:3797`）。所以 layer 那条选择器要用 `:not(:has(> .sully-bubble-with-reply))` 排除，
   否则引用消息会长出两条尾巴。

5. **别给 `.sully-bubble-reply-main` 加 `margin-top`**：引用外壳 `.sully-bubble-with-reply` 已经承担了
   顶部节距，正文再加一次会让引用消息的气泡比头像低 8px。
   （给 `.sully-bubble-ai.sully-bubble-ai-reference-*` 设 `margin-top` 时会误伤到它，记得补一条清零。）

6. **验收探针必须同时验「可见性」，不能只验几何**：
   我有一版 `getBoundingClientRect` / computed `top` 全部达标、8/8 绿灯，但尾巴在页面上根本看不见
   （就是坑 2）。探针要一并断言
   `backgroundImage !== 'none' && filter !== 'none' && clipPath !== 'none'`，最好再看放大截图。

## 怎么验证（这个项目没有 Playwright）

用 Node 内置 WebSocket 直连 CDP：
Chrome 带 `--remote-debugging-port=9222 --user-data-dir=<临时目录>` 启动，
`fetch('http://127.0.0.1:9222/json/list')` 拿 target，再走 `Runtime.evaluate` / `Page.captureScreenshot`。

dev server：`node node_modules/vite/bin/vite.js --port 4173`（pnpm 不在 PATH 里，直接调 vite）。
注意 vite 只绑 localhost，用 `http://localhost:4173` 而不是 `127.0.0.1`。

真实 app 要建角色、发消息才能看到聊天页，很慢。我的做法是在 `public/` 下放一个临时静态页，
按 `MessageItem.tsx` 的真实 DOM 树手写 8 个用例（角色/用户 × 单行/多行 × 有无引用），
再把三层样式按真实注入顺序叠上去：
`styles/tailwind.css` 的 `@layer components` → 主题 CSS → `Chat.tsx` 守护样式。
主题和守护样式可以用脚本从源码里把模板字符串抠出来（注意处理 `${retroChatCssActive ? ... : ...}` 的嵌套反引号），
这样测的就是真实代码而不是手抄副本。测完把临时页删掉。

## 遗留（本次没动，超出范围）

`.sully-bubble-layer > .sully-bubble-tail` 里那个多余的 `+ var(--sully-chat-bubble-mt)`
在 `styles/tailwind.css:78-80` 和 `apps/Chat.tsx` 的通用段里还在。
**其它仍在用 SVG 尾巴的主题，用户侧尾巴同样偏低 8px。**
复古微信已经不走这条路所以不受影响。要不要顺手修，等产品决定。
