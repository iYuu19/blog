# 内容维护说明

这个博客现在的文章内容都在：

- `src/content/blog`

你现在看到的几篇文章，是先用来搭结构的示例内容。后面你可以自己替换成真实文章，也可以直接把 Word 文档发给我，我来帮你整理成博客文章。

## 自己写一篇新文章

1. 复制 `src/content/blog/_template.md`
2. 改文件名，比如 `luogu-p1002.md`
3. 把 `draft: true` 改成 `draft: false`
4. 改标题、摘要、日期、标签这些信息
5. 执行：

```bash
npm run dev
```

预览没问题后执行：

```bash
npm run build
```

然后把新的 `dist` 上传到 Cloudflare Pages。

## 如果你有 Word 文档

可以，直接给我 `.docx` 就行，我可以帮你：

- 提取正文
- 拆成适合博客的标题结构
- 补 frontmatter
- 转成站里能直接显示的 Markdown
- 需要的话顺手做排版微调

你最好提前告诉我这篇内容是什么类型：

- 题解
- 专题总结
- 周总结 / 复盘
- 随笔 / 个人记录

## 你自己最常改的地方

主要就是每篇文章顶部这一段：

```md
---
title: "文章标题"
description: "一句摘要"
pubDate: 2026-06-07
tags: ["标签1", "标签2"]
oj: "LeetCode"
difficulty: "Medium"
language: "C++"
featured: false
draft: false
---
```

其中：

- `title` 是标题
- `description` 是列表页显示的摘要
- `tags` 是标签
- `oj` 可以写平台名，也可以写“总结”“经验”
- `difficulty` 不一定非要 Easy / Medium / Hard，也可以写 `Notes`
- `draft: true` 表示先不公开显示

## 如果你不想让示例文章继续显示

有两种方式：

1. 直接删掉 `src/content/blog` 里的示例文件
2. 把它们的 `draft` 改成 `true`

如果你下一步把 Word 文档给我，我可以直接替你落进去。
