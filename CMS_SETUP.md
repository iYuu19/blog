# 可视化后台接入说明

这个项目现在已经加好了 `Decap CMS` 后台代码，访问路径是：

- `/admin`

但要真正能登录发文，还需要你在 GitHub 和 Cloudflare 里补 2 组配置。

## 1. 创建 GitHub OAuth App

进入 GitHub：

- `Settings`
- `Developer settings`
- `OAuth Apps`
- `New OAuth App`

建议这样填：

- `Application name`: `iYuu Notes CMS`
- `Homepage URL`: `https://blog-cx8.pages.dev`
- `Authorization callback URL`: `https://blog-cx8.pages.dev/api/callback`

创建后你会拿到：

- `Client ID`
- `Client Secret`

如果以后你把站点域名换掉了，这里的 `Homepage URL` 和 `Authorization callback URL` 也要一起改。

## 2. 在 Cloudflare Pages 里配置环境变量

打开你的 Pages 项目，进入：

- `Settings`
- `Environment variables`

新增这两个变量：

- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`

值就填你刚才在 GitHub OAuth App 里拿到的那两个值。

加完之后重新部署一次项目。

## 3. 登录后台

部署完成后，打开：

- `https://blog-cx8.pages.dev/admin`

你会看到两个主要入口：

- `站点设置`
- `文章`

### 发文章

在 `文章` 里可以：

- 新建文章
- 改标题、摘要、分类、标签
- 直接写 Markdown 正文
- 上传图片
- 勾选 `草稿`
- 勾选 `首页推荐`

### 改个性化内容

在 `站点设置` 里可以直接改：

- 网站标题
- 顶部副标题
- 首页文案
- 关于页内容
- 页脚描述

这些内容现在都不需要再手改 `.astro` 文件了。

## 4. 如果以后换自定义域名

你需要同时改两处：

1. `public/admin/config.yml` 里的：
   - `base_url`
   - `site_url`
   - `display_url`
2. GitHub OAuth App 里的：
   - `Homepage URL`
   - `Authorization callback URL`
