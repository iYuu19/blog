const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const STATE_COOKIE = "decap_cms_github_state";

function html(title, body) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f4f1eb;
        color: #1d2228;
        font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
      }
      main {
        width: min(92vw, 520px);
        padding: 32px;
        border: 1px solid #ded7cb;
        border-radius: 18px;
        background: rgba(255, 253, 249, 0.96);
        box-shadow: 0 16px 36px rgba(20, 24, 28, 0.08);
      }
      h1 {
        margin-top: 0;
        font-size: 1.4rem;
      }
      p {
        line-height: 1.7;
      }
      code {
        font-family: "JetBrains Mono", Consolas, monospace;
      }
      button {
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: #1f5c57;
        color: #fff;
        font: inherit;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`;
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`];
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }
  if (options.httpOnly) {
    parts.push("HttpOnly");
  }
  if (options.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") || "github";

  if (provider !== "github") {
    return new Response(html("不支持的登录方式", "<h1>登录失败</h1><p>当前只支持 <code>github</code> 登录。</p>"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  if (!env.GITHUB_OAUTH_CLIENT_ID) {
    return new Response(
      html(
        "缺少配置",
        "<h1>后台还没配置完成</h1><p>Cloudflare Pages 里还没有设置 <code>GITHUB_OAUTH_CLIENT_ID</code>。</p>"
      ),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }
    );
  }

  const origin = url.origin;
  const scope = url.searchParams.get("scope") || "repo";
  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/callback`;
  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  const body = `
    <h1>正在跳转到 GitHub</h1>
    <p>如果浏览器没有自动跳转，请点击下面的按钮继续登录。</p>
    <p><button id="continue">继续登录 GitHub</button></p>
    <script>
      const provider = ${JSON.stringify(provider)};
      const targetOrigin = ${JSON.stringify(origin)};
      const authorizeUrl = ${JSON.stringify(authorizeUrl.toString())};
      const startAuth = () => window.location.replace(authorizeUrl);

      document.getElementById("continue").addEventListener("click", startAuth);

      if (!window.opener) {
        startAuth();
      } else {
        window.addEventListener("message", function onMessage(event) {
          if (event.origin !== targetOrigin) return;
          if (event.data === "authorizing:" + provider) {
            window.removeEventListener("message", onMessage);
            startAuth();
          }
        });

        window.opener.postMessage("authorizing:" + provider, targetOrigin);
      }
    </script>
  `;

  return new Response(html("GitHub 登录", body), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": serializeCookie(STATE_COOKIE, state, {
        maxAge: 600,
        path: "/api/callback",
        sameSite: "Lax",
        httpOnly: true,
        secure: true
      })
    }
  });
}
