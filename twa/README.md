# SullyOS TWA 真机试验包

这个目录只服务于 `codex/sullyos-twa-test` 的验证，不是现有 Capacitor 私人版的替代品。

- Web 基线：`origin/master`（建立分支时为 `73ec0ef`）
- 测试 origin：`https://twa-test.noir2.cc.cd`
- Android 包名：`com.sullyos.twa.test`
- 通知：TWA Notification Delegation + 网页原有 Web Push
- 签名：本机 Android debug keystore，仅供真机比较；公开发布必须换正式长期签名

构建所需的本机 JDK/SDK 路径放在未跟踪的 `bubblewrap-config.local.json`。
站点的 Digital Asset Links 位于 `public/.well-known/assetlinks.json`。

## 本机构建说明

- Android SDK：`D:\Program Files\Android\SDK`
- JDK 17：`C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot`
- Bubblewrap 的 SDK 路径校验仍要求 SDK 根目录存在 `bin` 或 `tools`；本机只创建了空的 `SDK\bin` 兼容目录，没有重复安装 SDK。
- Bubblewrap 在 Windows 上调用空格路径中的 Java 签名器会失败。Gradle 生成 `app-release-unsigned-aligned.apk` 后，使用 Android SDK 自带的 `apksigner.bat` 完成签名即可。

当前真机试验包的 SHA-256：

`6622D585F62FF5FCF758ADC1A1F091EC6B3032663CF6FD402B4654C06E811295`

## TWA 专用网页构建

使用 `pnpm run build:twa`，它会读取 `.env.twa`：

- 强制隐藏非 release 分支的“开发中内容”角标；
- 只在 Android TWA/standalone 环境启用返回手势桥，转调 SullyOS 已有的 `handleBack()`；
- 普通 `pnpm run build`、master 网页和 Capacitor 构建均不受影响。
