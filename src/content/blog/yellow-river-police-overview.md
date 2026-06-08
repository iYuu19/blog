---
title: "第四届黄河流域公安院校网络安全技能挑战赛记录"
description: "先把这场比赛目前做出来的题目整理到一起，方便按比赛统一回看。"
pubDate: 2026-06-08
category: "赛后复盘"
contest: "黄河流域公安院校网络安全技能挑战赛"
contestSlug: "yellow-river-police-2026"
coverImage: "/contest-covers/yellow-river-police-2026.svg"
track: "赛后复盘"
tags: ["CTF", "赛后复盘", "Web", "Misc"]
oj: "黄河流域"
difficulty: "Notes"
language: "Markdown"
featured: false
draft: false
---

## 这场比赛先记什么

先把目前已经做出来、并且手上材料比较完整的题整理到一起。这样后面补题或者写更细的复盘时，至少同一场比赛的内容已经能统一挂在一个分类下面。

目前先放上这几题：

1. `喵喵宠物医院`
2. `ezfile`
3. `ai_reply`

## 目前这几题的大致方向

### 1. 喵喵宠物医院

- 方向：`Web`
- 关键词：`PyYAML`、`反序列化`、`Unicode 转义绕过`
- 核心链路：前端 JS 找到 `/api/terminal`，再通过 `parse_diet_recipe` 触发危险 tag，最后借错误回显拿到 flag。

### 2. ezfile

- 方向：`Web`
- 关键词：`Node.js`、`原型污染`、`数组参数`、`任意文件读取`
- 核心链路：先污染 `Object.prototype.nonce` 伪造管理员，再利用 `file` 的数组类型和截断顺序问题读 `/flag`。

### 3. ai_reply

- 方向：`Misc`
- 关键词：`文本隐写`、`标点统计`、`二进制映射`
- 核心链路：从长文本里提取 4 种标点，把它们映射成 2 bit，最终还原出完整 flag。

## 这场比赛目前的感受

目前做出来的这几题风格差别还挺大：

- `Web` 题更偏接口分析、漏洞链拼接和利用细节。
- `Misc` 题更偏观察文本形式和快速写脚本验证。

这种组合对复盘还挺有帮助，因为能明显看出自己在不同方向上的节奏差异。

## 后面准备怎么补

后面如果继续补这场比赛的内容，我准备按两层来写：

1. 单题 WP
2. 整场比赛复盘

单题 WP 负责把题本身做清楚，整场复盘再总结当时的节奏、失误和哪些点应该更早反应过来。
