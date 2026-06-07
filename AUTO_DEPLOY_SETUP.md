# GitHub + Cloudflare 自动部署

这个项目已经适合直接接入 GitHub 和 Cloudflare Pages。

## 目标

做到以后只需要：

1. 改文章或样式
2. 提交代码到 GitHub
3. Cloudflare 自动构建并更新站点

不再手动上传 `dist`

## 第一步：把项目放到 GitHub

如果你还没有 GitHub 仓库：

1. 在 GitHub 网页上新建一个仓库
2. 仓库名可以用 `iyuu-notes`
3. 不要勾选自动生成 README、`.gitignore`、License

然后在本地项目目录执行：

```bash
git init
git branch -M main
git add .
git commit -m "Initial blog setup"
git remote add origin 你的仓库地址
git push -u origin main
```

仓库地址通常像这样：

```bash
https://github.com/你的用户名/iyuu-notes.git
```

## 第二步：在 Cloudflare 新建 Git 集成项目

注意：你现在的 Pages 项目如果是 `Direct Upload` 模式，不能直接切换成 `Git integration`。

所以要新建一个新的 Pages 项目来接 GitHub。

在 Cloudflare 后台：

1. 进入 `Workers & Pages`
2. 点 `Create application`
3. 选 `Pages`
4. 选 `Connect to Git`
5. 授权 GitHub
6. 选中你的仓库

## 第三步：构建配置

Cloudflare 里填这些：

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`

## 第四步：以后怎么更新

以后每次更新文章，只要：

```bash
git add .
git commit -m "add new post"
git push
```

Cloudflare 就会自动重新部署。

## 关于你现在的 `iyuu.pages.dev`

如果你想继续保留完全一样的 `iyuu.pages.dev` 地址，
大概率需要把当前的 Direct Upload 项目替换掉，再用同名的新 Git 集成项目接管。

如果你不介意先换一个地址，也可以先新建一个新的 Pages 项目名，后面再处理域名。

这一点我建议你在 Cloudflare 面板里操作时确认一下，因为它和你当前 Pages 项目名是否占用有关。
