# PR #15 R4 Final Device Search Fix Plan

状态：EXECUTION-FIRST · TARGETED FINALIZATION

本轮只关闭 PR #15 尚未覆盖的真机资料库搜索流程，并补齐测试 APK 保留期与本地设备证据。不得重新审查或修改 R1–R3 核心算法、历法公式、知识语义、伦理规则、版本方案、原生导出和 Android 权限边界。

默认优先级：

```text
真实资料库搜索验证 > 稳定设备选择器 > 设备证据 > PR 收尾
```

## 1. 本轮目标

1. 真机 smoke 必须实际向资料库搜索框输入“小吉”。
2. 真机 smoke 必须验证搜索结果已经过滤到小吉，而不是依赖六宫固定顺序。
3. 删除设备测试中的 `.palace-card:nth-child(5)` 定位。
4. 使用稳定宫位选择器打开小吉详情。
5. 重新运行同一实体设备 smoke 并报告真实结果。
6. 将 debug APK artifact 保留期从 3 天调整为 7 天。
7. 生成本次本地设备测试的应用 logcat 与一张截图，但不得提交到 Git。
8. 继续更新原分支和原 PR #15，不创建新实现分支或新 PR，不自行合并。

## 2. 启动与范围

当前实现分支必须为：

```text
feature/r4-device-validation-beta-hardening
```

主代理只读取：

1. 本计划
2. `src/pages/knowledge/KnowledgeLibraryPage.tsx`
3. `src/components/knowledge/PalaceCard.tsx`
4. `android/app/src/androidTest/java/io/github/adrerie/xiaoliurenarchive/AndroidDeviceSmokeTest.java`
5. `scripts/run-android-device-test.mjs`
6. `.github/workflows/ci.yml`
7. PR #15 当前描述

不得全仓扫描。本轮任务较小，不创建子代理。

## 3. 稳定资料库选择器

在 `PalaceCard` 的可点击根元素增加稳定选择器，推荐：

```text
id="palace-card-<palaceId>"
data-palace-id="<palaceId>"
```

小吉应形成：

```text
#palace-card-xiao_ji
```

要求：

- 选择器来自稳定业务 ID，不使用显示顺序、文本层级或 CSS `nth-child`。
- 不改变六宫排序、搜索逻辑、选中逻辑或视觉布局。
- 保留既有可访问名称与键盘行为。

在资料库结果列表增加一个只用于可访问性和测试的结果计数状态，例如：

```text
id="library-result-count"
```

内容可为：

```text
找到 1 条本地资料
```

要求：

- 使用 `role="status"` 或等价可访问语义。
- 不显示调试 ID。
- 空结果时准确显示 0 条。

## 4. 修正实体设备 smoke

修改 `AndroidDeviceSmokeTest` 的资料库阶段：

1. 点击 `#nav-library`。
2. 定位 `#library-search-input`。
3. 清空输入框。
4. 输入中文“小吉”。
5. 等待 React 搜索结果更新。
6. 断言 `#library-result-count` 包含“1”。
7. 断言 `#palace-card-xiao_ji` 存在并可点击。
8. 点击 `#palace-card-xiao_ji`。
9. 断言 `#palace-detail` 包含“小吉”。
10. 再执行既有系统返回键、复制 JSON 和 About 版本检查。

必须删除：

```text
.palace-card:nth-child(5)
```

不得通过 JavaScript 直接修改 React state 或直接调用搜索函数绕过真实输入交互。可以使用 Espresso-Web 的 `clearElement()` 与 `webKeys()`；若中文输入在当前 WebView 驱动中不稳定，只允许通过向输入元素派发标准 `input`/`change` 事件的窄辅助方法完成，不得直接操作业务状态。

增加最小断言辅助方法即可，不重写整个测试类。

## 5. 本地设备证据

调整 `scripts/run-android-device-test.mjs`，在同一次真机测试中生成窄证据：

测试前：

```text
adb -s <serial> logcat -c
```

测试成功后：

- 获取应用进程 PID。
- 优先导出该 PID 的 logcat。
- 若设备不支持 PID 过滤，则只保留包含应用包名、Capacitor WebView 主资源错误或 `FATAL EXCEPTION` 相关的记录。
- 截取当前应用界面一张 PNG。

本地产物目录：

```text
output/device-smoke/
```

文件建议：

```text
r4-app-logcat.txt
r4-final-screen.png
```

要求：

- 目录继续由 `.gitignore` 排除。
- 不提交 logcat、截图、APK 或设备序列号文件。
- 失败时保留已有产物便于排查。
- 不把系统其他进程的无关崩溃当成应用失败。
- PR 描述只报告设备型号和测试结果，不必长期保存完整序列号。

## 6. APK artifact 保留期

在 `.github/workflows/ci.yml` 中将：

```text
retention-days: 3
```

调整为：

```text
retention-days: 7
```

不增加新的 emulator workflow，不改变现有 Web verify 和 Android debug package job。

## 7. 必要验证

本轮只运行：

```text
npm run mobile:test:device
```

该命令必须在已授权的实体 Android 设备上完整通过，并覆盖：

- 三月初五辰时结果为小吉
- 资料库搜索框真实输入“小吉”
- 搜索结果计数为 1
- 稳定宫位选择器打开小吉详情
- 系统返回键
- Android 剪贴板复制 JSON
- About 页版本与构建渠道

随后推送分支，等待 PR #15 最新 head 的现有 GitHub CI：

- Verify local web and knowledge bundle
- Android debug package

不得为了本轮重复浏览器截图、完整 R1–R3 smoke、算法审计或知识回溯。

## 8. PR #15 收尾

更新原 PR #15 描述：

- 增加资料库搜索真实输入与过滤断言。
- 明确不再使用 `nth-child`。
- 报告实体设备型号和 `npm run mobile:test:device` 结果。
- 报告本地 logcat 与截图已生成但未提交。
- 报告 GitHub 两个 job 的最终状态。
- 报告 APK artifact 名称与 7 天保留期。
- 更新最终 head SHA。

提交建议：

```text
fix: verify library search on Android device
```

只提交必要文件。推送：

```text
git push origin feature/r4-device-validation-beta-hardening
```

继续使用 PR #15，不创建重复 PR，不自行合并。

## 9. 完成判定

以下条件全部满足才可报告完成：

- 真机测试真实输入“小吉”。
- 搜索结果经过过滤并被断言。
- 测试不再包含 `.palace-card:nth-child(5)`。
- 小吉卡片使用稳定业务 ID 定位。
- `npm run mobile:test:device` 在实体设备通过。
- 应用范围 logcat 未发现 `FATAL EXCEPTION` 或 WebView 主资源加载失败。
- GitHub Web 与 Android build job 通过。
- APK artifact 保留 7 天。
- PR #15 描述和 head SHA 已更新。
- 未修改 R1–R3 核心合同。
