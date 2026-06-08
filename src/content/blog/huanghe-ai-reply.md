---
title: "ai_reply"
description: "一道文本隐写签到题，从标点统计到二进制映射，最后还原出完整 flag。"
pubDate: 2026-06-08
category: "比赛 WP"
contest: "黄河流域公安院校网络安全技能挑战赛"
contestSlug: "yellow-river-police-2026"
coverImage: "/contest-covers/yellow-river-police-2026.svg"
track: "Misc"
tags: ["CTF", "Misc", "文本隐写", "标点统计"]
oj: "黄河流域"
difficulty: "Easy"
language: "Python"
featured: false
draft: false
---

## 题目概述

这是一道 Misc 文本隐写题。题目给了一个文本文件 `ai_reply.txt`，正文看起来是一大段重复、空泛的中文 AI 回复。

这类题通常不会真的要求我们逐字理解长篇废话，而是把信息藏在“外观层”，例如：

- 标点符号
- 换行位置
- 空格数量
- 字符长度
- 重复段落之间的差异

本题的核心就是：提取中文标点符号，并把 4 种不同标点映射成二进制数据，最终还原 flag。

最终 flag：

```text
sdpcsec{welcome_2026_4nd_competiton!}
```

## 环境准备

本题只需要 Python 3。

推荐把终端切到题目目录：

```powershell
cd D:\codex1\黄河流域\signin
```

确认文件存在：

```powershell
dir
```

可以看到：

```text
ai_reply.txt
```

## 第一步：观察题目文件

先直接打开 `ai_reply.txt`。

如果用支持 UTF-8 的编辑器打开，可以看到它是一段正常中文，内容大概一直在重复类似意思：

```text
从整体节奏来看这个方向确实具备继续推进的空间。
如果换一个更稳妥的说法当前结论依然成立：
很多表达之所以显得复杂只是因为包装层数太多，
...
```

其中有几处非常像提示：

```text
先判断文本里有没有异常结构
多留意形式本身
段落之间的节奏标点习惯以及重复出现的细节
信息藏在外观层而不是语义层
```

这些句子基本是在提醒我们：

不要只看正文语义，要看文本形式。

## 第二步：统计标点符号

因为正文一直提示“节奏、标点、形式”，所以我们先统计所有标点。

写一个简单脚本 `check_punct.py`：

```python
from pathlib import Path
from collections import Counter
import unicodedata

p = Path("ai_reply.txt")
s = p.read_text(encoding="utf-8")

puncts = [ch for ch in s if unicodedata.category(ch).startswith("P")]

print("文本字符数:", len(s))
print("标点数量:", len(puncts))
print("标点统计:", Counter(puncts))
print("前 80 个标点:", "".join(puncts[:80]))
```

运行：

```powershell
python check_punct.py
```

得到的关键信息：

```text
文本字符数: 3446
标点数量: 148
标点统计: Counter({'。': 54, '：': 40, '，': 27, '；': 27})
```

可以看到，全文只出现了 4 种中文标点：

```text
，
。
；
：
```

这里非常关键。

因为 4 种符号正好可以表示 4 个状态：

```text
00
01
10
11
```

也就是说，每个标点可以表示 2 bit。

题目里一共有 148 个标点：

```text
148 * 2 = 296 bit
296 / 8 = 37 byte
```

37 字节很像一个 flag 的长度。

所以推测：

题目把 flag 转成二进制后，每 2 bit 换成一个标点藏进了文本里。

## 第三步：枚举标点到二进制的映射

现在的问题是：

4 个标点分别对应哪个 2 bit？

例如可能是：

```text
， -> 00
。 -> 01
； -> 10
： -> 11
```

也可能是其他顺序。

一共只有 4 个符号，所以所有可能映射数量是：

```text
4! = 24
```

只有 24 种，非常适合直接暴力枚举。

写脚本 `solve.py`：

```python
from pathlib import Path
from itertools import permutations
import string
import unicodedata

p = Path("ai_reply.txt")
s = p.read_text(encoding="utf-8")

puncts = [ch for ch in s if unicodedata.category(ch).startswith("P")]
symbols = sorted(set(puncts), key=lambda c: ord(c))

print("symbols:", symbols)
print("punctuation count:", len(puncts))

printable = set(bytes(string.printable, "ascii"))

for perm in permutations(range(4)):
    mapping = dict(zip(symbols, perm))
    bits = "".join(format(mapping[ch], "02b") for ch in puncts)
    data = bytes(int(bits[i:i + 8], 2) for i in range(0, len(bits), 8))
    score = sum(ch in printable for ch in data)

    if score == len(data) or b"{" in data:
        try:
            text = data.decode("ascii")
        except UnicodeDecodeError:
            continue

        print("mapping:", mapping)
        print("result:", text)
```

运行：

```powershell
python solve.py
```

输出：

```text
symbols: ['。', '，', '：', '；']
punctuation count: 148
mapping: {'。': 1, '，': 0, '：': 3, '；': 2}
result: sdpcsec{welcome_2026_4nd_competiton!}
```

所以正确映射为：

```text
， -> 00
。 -> 01
； -> 10
： -> 11
```

## 第四步：写成最终解题脚本

枚举确认映射后，可以写一个更简洁的最终脚本。

```python
from pathlib import Path
import unicodedata

p = Path("ai_reply.txt")
s = p.read_text(encoding="utf-8")

puncts = [ch for ch in s if unicodedata.category(ch).startswith("P")]

mapping = {
    "\uff0c": "00",
    "\u3002": "01",
    "\uff1b": "10",
    "\uff1a": "11",
}

bits = "".join(mapping[ch] for ch in puncts)

flag = bytes(
    int(bits[i:i + 8], 2)
    for i in range(0, len(bits), 8)
).decode("ascii")

print(flag)
```

运行：

```powershell
python final_solve.py
```

输出：

```text
sdpcsec{welcome_2026_4nd_competiton!}
```

## Flag

```text
sdpcsec{welcome_2026_4nd_competiton!}
```

## 复盘

这题的提示其实藏在正文里：

```text
多留意形式本身
段落之间的节奏标点习惯
信息藏在外观层而不是语义层
```

看到这种“很长、很顺、很空”的文本时，不要急着读懂每句话。

更有效的排查顺序是：

1. 统计字符、行数、标点、空格。
2. 看是否存在固定数量的符号种类。
3. 判断数量是否能整除 8、16、32 等常见编码单位。
4. 尝试二进制、四进制、ASCII 解码。
5. 对小规模不确定映射进行暴力枚举。

本题就是一个很典型的新手 Misc 文本隐写题。
