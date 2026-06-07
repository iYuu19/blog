# Challenge Blog

一个基于 Astro 的个人题解与经验沉淀博客，适合部署到 Cloudflare Pages。

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## Cloudflare Pages

```bash
wrangler pages project create iyu-challenge-blog
wrangler pages deploy dist --project-name iyu-challenge-blog
```

如果你后续绑定自定义域名，记得把 `astro.config.mjs` 里的 `site` 改成正式域名。
