# 蜡笔小新主题 CTF 取证博客 — 创意落地方案

> 博客技术栈：Astro + 内容集合（YAML/Markdown）
> 主题角色：小新、小白、动感超人、巧克比、风间、妮妮、阿呆、正男、美冴、广志、向日葵
> 内容方向：CTF 取证 WP、赛后复盘、专题总结

---

## 一、主题沉浸感增强

### 1. 「春日部事件档案」文章模板

把取证 WP 的文章结构做成**案件卷宗**风格：

- 顶部「案件编号」自动生成（如 `KAS-2026-003`，KAS = Kasukabe 春日部）
- 证据区用「小白叼来的线索」卡片样式（命令输出、hex dump、截图）
- 关键 payload 用「动感超人必杀技」高亮框（红色边框 + 闪电装饰）
- 解题步骤用「春日部防卫队巡逻日志」时间线样式
- 文末加「结案报告」摘要卡（结论 + 关键 takeaways）

**落地方式**：改造 `forensics-wp-template.md` 模板和 `[slug].astro` 文章详情页，新增 CSS class（`.evidence-card`、`.payload-highlight`、`.patrol-log`、`.case-report`）。

### 2. 角色语音气泡评论框

Giscus 评论区外面包一层蜡笔小新风格的对话框：

- 用户评论显示在「小新气泡」里（歪歪扭扭的漫画对话框，`clip-path` + SVG 气泡尾巴）
- 博主回复用「美冴气泡」（更方正、带怒气符号）
- 整体评论区背景用浅色笔记本纸张纹理

**落地方式**：在 `GiscusComments.astro` 外层加装饰层，纯 CSS 实现，不修改 Giscus 本身。

---

## 二、互动体验

### 3. 「小白寻宝」CTF 工具箱页面

做一个独立的 `/toolbox` 页面，把常用取证工具按蜡笔小新道具分类：

| 道具名 | 对应角色 | 工具类别 | 示例工具 |
|--------|----------|----------|----------|
| 小白的鼻子 | 小白 | 文件分析 | file、binwalk、foremost |
| 动感光波 | 动感超人 | 内存取证 | Volatility、MemProcFS |
| 巧克比饼干盒 | 巧克比 | 编码解码 | CyberChef、Base64 |
| 广志的臭袜子 | 广志 | 流量分析 | Wireshark、tshark |
| 美冴的扫把 | 美冴 | 日志清理/分析 | logparser、jq |
| 风间的笔记本 | 风间 | 密码破解 | hashcat、john |

每个工具卡片带一键复制命令，hover 时角色做小动画。

**落地方式**：新增 `src/pages/toolbox.astro`，工具数据放在 `src/content/site-toolbox/` YAML collection 里。

### 4. 「双叶幼稚园成绩单」技能雷达图

在 About 页面加一个可视化技能图：

- 维度：内存取证、流量分析、磁盘取证、隐写、编码、Web
- 用 Canvas 或 SVG 画雷达图，风格做成幼稚园蜡笔画（手绘线条感、蜡笔配色）
- 数据从文章标签自动统计（如 `volatility` 标签出现几次就加几分）
- 图表标题用「双叶幼稚园成绩单」

**落地方式**：About 页面加一个 `<canvas>` 或 SVG 组件，从 posts 的 tags 聚合数据计算各维度分数。

---

## 三、内容玩法

### 5. 「每日一题」小新挑战

首页底部或侧栏加一个互动模块：

- 每天展示一道 mini 取证小题（一段 hex、一个隐写图片、一段 base64）
- 答案折叠，点击「动感超人揭晓」展开
- 数据源是一个 JSON/Markdown collection，按日期索引
- 题目旁边放小新思考的 SVG 动画

**落地方式**：新增 `src/content/daily-challenge/` collection，首页 `index.astro` 加一个小组件读取当天题目。

### 6. 「春日部通缉令」比赛预告卡片

比赛卡片做成通缉令风格：

- 顶部大字「通缉」红色印章（SVG 叠加层）
- 比赛名称用毛笔风格字体
- 底部加「悬赏：XX 分」
- 已结束的比赛盖「结案」红色圆戳
- 进行中的比赛盖「搜查中」蓝色方戳

**落地方式**：改造 `contestCards` 的 CSS，加 SVG 印章叠加层。在 `contest` 数据中加 `status` 字段（ongoing/ended）。

---

## 四、视觉细节

### 7. 404 页面：小新迷路了

404 页面做成小新在春日部街头迷路的场景：

- 大字「哎呀，走错路了！」
- 小新挠头的 SVG 动画（复用 `ShinchanCharacter.astro` 组件）
- 下面放小白脚印引导回首页（脚印用 CSS 伪元素画，带动画）
- 背景用春日部街道的简笔画线条

**落地方式**：改造 `src/pages/404.astro`。

### 8. 标签药丸 → 角色贴纸

把现在的 `TagPill` 改成蜡笔小新贴纸风格：

- 圆角矩形带阴影，像贴在本子上的贴纸
- 不同分类用不同角色配色：
  - 取证 → 小白白（#FFFFFF + 灰边框）
  - Web → 动感超人蓝（#4ECDC4）
  - 隐写 → 巧克比棕（#C8963E）
  - 密码 → 风间紫（#9B59B6）
  - 杂项 → 小新红（#E85C4A）
- hover 时微微旋转（`transform: rotate(-3deg)`）

**落地方式**：改造 `TagPill.astro` 的 CSS，根据标签名映射角色配色。

### 9. 滚动时小新跟跑

页面右下角固定一个小新走路动画（已有 SVG），随滚动方向切换：

- 向下滚 → 小新往右走（CSS `animation: walk`）
- 停下来 → 小新站着晃（CSS `animation: idle`）
- 回到顶部 → 小新挥手

**落地方式**：用 `IntersectionObserver` + scroll 事件监听，复用 `ShinchanCharacter.astro`，加 `position: fixed` 在右下角。

---

## 五、实用功能

### 10. WP 文章一键复制命令

取证 WP 里经常有长命令，加一个「巧克比复制按钮」：

- 代码块右上角小饼干图标
- 点击复制到剪贴板，显示「已复制！巧克比真好吃」toast 提示
- toast 自动 2 秒消失

**落地方式**：在 `[slug].astro` 里给 `<pre><code>` 加按钮，JS 用 `navigator.clipboard.writeText()` 几行实现。

### 11. 文章难度可视化

用「幼稚园星级」代替文字难度：

| 难度值 | 显示 | 含义 |
|--------|------|------|
| 1 | ⭐ | 幼稚园小班（入门） |
| 2 | ⭐⭐ | 幼稚园中班 |
| 3 | ⭐⭐⭐ | 幼稚园大班 |
| 4 | ⭐⭐⭐⭐ | 春日部小学 |
| 5 | ⭐⭐⭐⭐⭐ | 动感超人级 |

星级用 SVG/CSS 画，风格偏蜡笔手绘（不圆、有粗细变化）。

**落地方式**：`difficulty` 字段映射成星级组件，新增 `DifficultyStars.astro`。

---

## 建议实施优先级

### 第一批（核心体验，改动小收益大）

1. **案件卷宗模板** — 让 WP 文章从第一眼就有主题感
2. **404 迷路页面** — 独立页面，不影响其他逻辑
3. **一键复制命令** — 实用功能，取证 WP 刚需
4. **难度星级** — 数据已有，只差展示组件

### 第二批（视觉增强，中等改动）

5. **贴纸标签** — 改造现有组件
6. **通缉令比赛卡** — 改造现有组件
7. **工具箱页面** — 新增页面，数据驱动

### 第三批（锦上添花，较大改动）

8. **气泡评论** — 需要处理 Giscus 样式覆盖
9. **小新跟跑** — 需要动画和滚动监听
10. **每日一题** — 需要新 collection 和内容维护
11. **技能雷达图** — 需要数据聚合和图表组件

---

## 现有文件参考

需要改动的关键文件：

- `src/pages/index.astro` — 首页
- `src/pages/blog/[slug].astro` — 文章详情页
- `src/pages/404.astro` — 404 页面
- `src/components/TagPill.astro` — 标签组件
- `src/components/ShinchanCharacter.astro` — 角色 SVG 组件
- `src/components/GiscusComments.astro` — 评论区
- `src/content/blog/forensics-wp-template.md` — 取证 WP 模板
- `src/content/config.ts` — 内容集合 schema
- `src/styles/global.css` — 全局样式
- `src/content/site-home/home.yaml` — 首页文案配置
- `src/content/site-brand/brand.yaml` — 品牌配置

需要新增的文件：

- `src/pages/toolbox.astro` — 工具箱页面
- `src/components/DifficultyStars.astro` — 难度星级组件
- `src/content/daily-challenge/` — 每日一题 collection（第三批）
