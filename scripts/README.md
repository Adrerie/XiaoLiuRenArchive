# Validation Scripts

本目录提供按需校验工具，默认遵循 `codex/execution-first-policy.md`。

## R1 默认命令

第一版只需优先提供：

```json
{
  "scripts": {
    "test:core": "运行核心算法测试",
    "test:ethics": "运行关键伦理场景",
    "build": "生产构建"
  }
}
```

知识加载失败时，再实现或运行对应的 Schema 与引用检查。

## 按需命令

以下命令保留为后续能力，不是每轮开发的默认门槛：

```text
validate:schemas
validate:references
validate:fixtures
audit:text
audit:network
validate:sources-online
```

在以下情况运行：

- 知识结构或 Schema 批量变化
- 安全规则发生实质变化
- 出现无法定位的跨模块故障
- 准备正式发布

## 实现原则

- 校验逻辑在 Node 中运行，不散落在 UI
- 错误返回文件、字段或 ID，便于直接定位模块
- 不自动修改知识文件
- 不删除未知字段来让校验通过
- 不静默修改黄金或红队预期
- 不生成默认提交到仓库的大型报告

## 当前必要检查

R1 只需直接确认：

- 六宫基础数据可加载
- 当前领域和片段引用有效
- 核心基准案例正确
- 五个关键伦理守卫生效
- 问题文本没有上传路径

失败时只运行与失败模块直接相关的扩展检查。
