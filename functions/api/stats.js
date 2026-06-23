const KV_BINDING = "BLOG_ANALYTICS";

function getAnalyticsStore(env) {
  return env[KV_BINDING];
}

function getShanghaiDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

async function readJson(store, key, fallback) {
  const value = await store.get(key, { type: "json" });
  return value ?? fallback;
}

function toTopPages(paths = {}, limit = 12) {
  return Object.entries(paths)
    .map(([path, item]) => ({
      path,
      title: item?.title || path,
      views: item?.views ?? 0,
      lastSeen: item?.lastSeen || ""
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

function toReferrers(referrers = {}, limit = 8) {
  return Object.entries(referrers)
    .map(([name, views]) => ({ name, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

function isAuthorized(request, env) {
  const expected = env.ANALYTICS_ADMIN_TOKEN;
  if (!expected) {
    return true;
  }

  const authorization = request.headers.get("Authorization") || "";
  return authorization === `Bearer ${expected}`;
}

export async function onRequestGet({ request, env }) {
  const store = getAnalyticsStore(env);
  if (!store) {
    return Response.json(
      {
        error: "missing_kv_binding",
        message: "Cloudflare Pages 需要绑定 KV 命名空间 BLOG_ANALYTICS。"
      },
      { status: 500 }
    );
  }

  if (!isAuthorized(request, env)) {
    return Response.json(
      {
        error: "unauthorized",
        message: "需要统计后台 token。"
      },
      { status: 401 }
    );
  }

  const todayKey = getShanghaiDate(0);
  const recentKeys = Array.from({ length: 7 }, (_, index) => getShanghaiDate(-index)).reverse();

  const [summary, today, recentDays] = await Promise.all([
    readJson(store, "summary", {
      totalViews: 0,
      firstSeen: "",
      lastSeen: "",
      paths: {}
    }),
    readJson(store, `day:${todayKey}`, {
      date: todayKey,
      views: 0,
      visitorIds: [],
      paths: {},
      referrers: {}
    }),
    Promise.all(
      recentKeys.map(async (date) => {
        const item = await readJson(store, `day:${date}`, {
          date,
          views: 0,
          visitorIds: [],
          paths: {},
          referrers: {}
        });

        return {
          date,
          views: item.views ?? 0,
          visitors: item.visitorIds?.length ?? 0
        };
      })
    )
  ]);

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      protected: Boolean(env.ANALYTICS_ADMIN_TOKEN),
      summary: {
        totalViews: summary.totalViews ?? 0,
        firstSeen: summary.firstSeen || "",
        lastSeen: summary.lastSeen || ""
      },
      today: {
        date: today.date,
        views: today.views ?? 0,
        visitors: today.visitorIds?.length ?? 0,
        topPages: toTopPages(today.paths, 8),
        referrers: toReferrers(today.referrers, 8)
      },
      recentDays,
      topPages: toTopPages(summary.paths, 12)
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

