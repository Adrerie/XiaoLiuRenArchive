# R4 测试版设备验证

本说明覆盖 `feature/r4-device-validation-beta-hardening` 的 `0.4.0-beta.1` / `beta-debug` 设备验证边界。应用保持 local-first：起课、知识、解释和 JSON 导出均在本地完成，不上传问题文本、身份字段或结果内容。

## GitHub Actions 验证

在 PR 或手动触发 `Android beta device smoke` workflow。成功运行会生成两个短期 artifact：

- `xiaoliurenarchive-beta-debug-apk`：可安装的 unsigned debug APK，保留 7 天。
- `xiaoliurenarchive-device-smoke-report`：设备 smoke 测试结果、logcat 和截图，保留 7 天。

下载 APK 后可用以下命令安装到已连接的 Android 设备：

```bash
adb install -r app-debug.apk
```

该 APK 仅用于测试，不是签名 release 包，也不代表已达到 Google Play 发布条件。

## 本地构建与 smoke

```bash
npm ci
npm run validate:version
npm run mobile:sync
npm run mobile:build:debug
```

有可用模拟器时，执行：

```bash
adb shell svc wifi disable
adb shell svc data disable
adb shell cmd connectivity airplane-mode enable
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
cd android
./gradlew connectedDebugAndroidTest --no-daemon
```

Windows PowerShell 使用 `gradlew.bat` 替换 `./gradlew`。设备 smoke 使用稳定 DOM 选择器，不使用坐标点击；默认手动农历三月初五辰时应得到“小吉”，并覆盖资料库检索、系统返回键、复制 JSON、About 版本信息和 local-first 说明。

## 隐私与系统边界

- Android manifest 不声明 `INTERNET`，并关闭 cleartext traffic 与 Android backup。
- 外部来源通过系统浏览器打开，不在 WebView 内导航或后台请求。
- Android JSON 文件只写入应用 Cache，再调用系统分享面板；不申请公共存储权限。
- 浏览器端继续使用 Clipboard API 和 Blob 下载；Android 端使用原生 Clipboard、Filesystem、Share 插件。
- 分享取消或插件/系统失败会显示准确的状态，不把失败报告为成功。
