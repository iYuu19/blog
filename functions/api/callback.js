const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
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

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function renderResultPage({ origin, provider, status, payload, heading, detail }) {
  const body = `
    <h1>${heading}</h1>
    <p>${detail}</p>
    <script>
      const targetOrigin = ${JSON.stringify(origin)};
      const provider = ${JSON.stringify(provider)};
      const payload = ${safeJson(payload)};
      const message = "authorization:" + provider + ":" + ${JSON.stringify(status)} + ":" + JSON.stringify(payload);

      if (window.opener) {
        window.opener.postMessage(message, targetOrigin);
        window.close();
      }
    </script>
  `;

  return html(status === "success" ? "登录成功" : "登录失败", body);
}

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(/;\s*/);
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return rest.join("=");
    }
  }

  return null;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;
  const provider = "github";
  const clearStateCookie = serializeCookie(STATE_COOKIE, "", {
    maxAge: 0,
    path: "/api/callback",
    sameSite: "Lax",
    httpOnly: true,
    secure: true
  });

  const error = url.searchParams.get("error");
  if (error) {
    const errorDescription = url.searchParams.get("error_description") || "GitHub 没有返回授权码。";
    return new Response(
      renderResultPage({
        origin,
        provider,
        status: "error",
        payload: { message: `${error}: ${errorDescription}` },
        heading: "GitHub 登录失败",
        detail: "你可以关闭这个窗口，然后回到后台重试。"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": clearStateCookie
        }
      }
    );
  }

  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
    return new Response(
      renderResultPage({
        origin,
        provider,
        status: "error",
        payload: { message: "Cloudflare Pages 缺少 GitHub OAuth 环境变量。" },
        heading: "后台配置不完整",
        detail: "请先在 Cloudflare Pages 里设置 GitHub OAuth 环境变量。"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": clearStateCookie
        }
      }
    );
  }

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const cookieState = parseCookie(request.headers.get("Cookie"), STATE_COOKIE);

  if (!state || !cookieState || state !== cookieState) {
    return new Response(
      renderResultPage({
        origin,
        provider,
        status: "error",
        payload: { message: "OAuth state 校验失败，请重新登录。" },
        heading: "登录已过期",
        detail: "这个授权窗口已经失效，请关闭后重新点击登录。"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": clearStateCookie
        }
      }
    );
  }

  if (!code) {
    return new Response(
      renderResultPage({
        origin,
        provider,
        status: "error",
        payload: { message: "GitHub 没有返回授权码。" },
        heading: "登录失败",
        detail: "没有拿到授权码，请关闭后重试。"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": clearStateCookie
        }
      }
    );
  }

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
      state,
      redirect_uri: `${origin}/api/callback`
    })
  });

  const tokenData = await tokenResponse.json().catch(() => null);

  if (!tokenResponse.ok || !tokenData?.access_token) {
    const message =
      tokenData?.error_description || tokenData?.error || "GitHub 返回的 access token 无效。";
    return new Response(
      renderResultPage({
        origin,
        provider,
        status: "error",
        payload: { message },
        heading: "GitHub 登录失败",
        detail: "授权码已经返回，但换取 token 失败了，请稍后再试。"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": clearStateCookie
        }
      }
    );
  }

  const successPayload = {
    token: tokenData.access_token,
    provider,
    scope: tokenData.scope || ""
  };

  return new Response(
    renderResultPage({
      origin,
      provider,
      status: "success",
      payload: successPayload,
      heading: "登录成功",
      detail: "这个窗口会自动关闭。"
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": clearStateCookie
      }
    }
  );
}
