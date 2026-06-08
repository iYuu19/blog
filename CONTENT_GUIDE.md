# 内容维护说明

这个博客现在的文章内容都在：

- `src/content/blog`

这个站现在更适合写：

- 比赛 WP
- 赛后复盘
- 专题总结
- 工具记录

后面你可以自己写真实文章，也可以直接把 Word 文档发给我，我来帮你整理成博客文章。

## 自己写一篇新文章

1. 复制 `src/content/blog/_template.md`
2. 改文件名，比如 `2026-huanghe-web-wp.md`
3. 把 `draft: true` 改成 `draft: false`
4. 改标题、摘要、日期、标签这些信息
5. 执行：

```bash
npm run dev
```

预览没问题后可以执行：

```bash
npm run build
```

确认无误后提交：

```bash
git add .
git commit -m "新增比赛 WP"
git push
```

Cloudflare Pages 会自动更新，不需要手动上传 `dist`。

## 如果你有 Word 文档

可以，直接给我 `.docx` 就行，我可以帮你：

- 提取正文
- 拆成适合博客的标题结构
- 补 frontmatter
- 转成站里能直接显示的 Markdown
- 需要的话顺手做排版微调

你最好提前告诉我这篇内容是什么类型：

- 比赛 WP
- 赛后复盘
- 专题总结
- 工具记录

## 你自己最常改的地方

主要就是每篇文章顶部这一段：

```md
---
title: "文章标题"
description: "一句摘要"
pubDate: 2026-06-07
category: "比赛 WP"
contest: "比赛名"
track: "Web"
tags: ["CTF", "Web", "标签1"]
oj: "简称，可留空"
difficulty: "Notes"
language: "Markdown"
featured: false
draft: false
---
```

其中：

- `title` 是标题
- `description` 是列表页显示的摘要
- `category` 建议写 `比赛 WP / 赛后复盘 / 专题总结 / 工具记录`
- `contest` 写比赛全名
- `contestSlug` 控制比赛分类页链接，建议用英文或拼音短名
- `coverImage` 是比赛海报或封面图，放在 `public/contest-covers` 里最方便
- `track` 写方向，比如 `Web`、`电子取证`、`Misc`
- `tags` 写具体技术点
- `oj` 现在更适合写简称，或者不写
- `difficulty` 不一定非要 Easy / Medium / Hard，也可以写 `Notes`
- `draft: true` 表示先不公开显示

## 如果你不想让示例文章继续显示

有两种方式：

1. 直接删掉 `src/content/blog` 里的示例文件
2. 把它们的 `draft` 改成 `true`

如果你下一步把 Word 文档给我，我可以直接替你落进去。
