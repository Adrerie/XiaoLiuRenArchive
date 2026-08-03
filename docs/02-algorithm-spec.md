# 小六壬算法规范 v1

## 1. 六宫序列

固定顺序：

大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡

内部编号：

```text
0 大安
1 留连
2 速喜
3 赤口
4 小吉
5 空亡
```

## 2. 起课流程

传统规则：

月上起日，日上起时。

计算过程必须展示：

- 月宫
- 日宫
- 时宫

不得只输出最终宫位。

## 3. 输入

输入：

- 农历月份
- 农历日期
- 十二时辰

时间转换属于独立历法模块。

## 4. 纯函数要求

核心算法禁止：

- 网络请求
- AI调用
- 随机数
- 用户画像
- 性别判断
- 地区文化修正

输入相同，输出必须相同。

## 5. 输出结构

```ts
interface XiaoLiuRenResult {
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
  monthPalace: Palace;
  dayPalace: Palace;
  hourPalace: Palace;
  trace: Step[];
}
```

## 6. 扩展规则

五行、六神、分类象意属于知识解释层，不得改变核心起课结果。

