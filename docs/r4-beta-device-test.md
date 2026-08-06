# R4 实体 Android 设备验证

本说明用于 `feature/r4-device-validation-beta-hardening` 的 `0.4.0-beta.1` 测试版。验证目标是通过 USB 连接的真实 Android 平板；本地 Web 资源、起课、知识、解释和 JSON 导出均保持 local-first。

## 使用已连接的平板

先确认平板已解锁，并在首次连接时允许 USB 调试。Windows PowerShell 可直接检查：

```powershell
$androidSdkAdb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $androidSdkAdb devices -l
```

设备状态必须是 `device`。如果是 `unauthorized`，请在平板上点“允许”。如果同时连接了多个设备，可先设置：

```powershell
$env:ANDROID_SERIAL = "你的设备序列号"
```

然后执行完整的本地真机流程：

```powershell
npm ci
npm run mobile:test:device
```

该命令会构建并同步 Capacitor 资源、生成 Debug APK、安装到已授权的 USB 平板，然后运行 `connectedDebugAndroidTest`。它不会创建模拟器、安装模拟器系统镜像、唤醒或解锁设备，也不会切换 Wi-Fi、移动数据或飞行模式。

## 覆盖的用户流程

真机 smoke 测试使用稳定 DOM 选择器覆盖：

- 默认手动农历三月初五辰时起课，并验证“小吉”；
- 知识库浏览、宫位卡片选择与详情；
- 系统返回键回到首页；
- 复制 JSON 后的剪贴板状态；
- About 页面版本、构建渠道和测试版说明。

Debug APK 仅用于本地验证，不是签名 release 包，也不代表已达到 Google Play 发布条件。
