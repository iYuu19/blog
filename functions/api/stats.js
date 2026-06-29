const KV_BINDING = "BLOG_ANALYTICS";
import { enforceRateLimit, noStoreHeaders } from "../_security.js";

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

function isIgnoredPath(path = "") {
  return path.includes("debug-codex-pageview");
}

function countVisiblePathViews(paths = {}) {
  return Object.entries(paths).reduce((total, [path, item]) => {
    if (isIgnoredPath(path)) {
      return total;
    }
    return total + (item?.views ?? 0);
  }, 0);
}

function toVisibleViews(totalViews = 0, paths = {}) {
  const ignoredViews = Object.entries(paths).reduce((total, [path, item]) => {
    if (!isIgnoredPath(path)) {
      return total;
    }
    return total + (item?.views ?? 0);
  }, 0);
  return Math.max(0, (totalViews ?? 0) - ignoredViews);
}

function countVisibleVisitors(visitorDetails = {}, fallbackCount = 0) {
  const details = Object.values(visitorDetails);
  if (!details.length) {
    return fallbackCount;
  }

  const visibleCount = details.filter((item) => countVisiblePathViews(item?.paths || {}) > 0).length;
  if (!fallbackCount || fallbackCount <= details.length) {
    return visibleCount;
  }

  const ignoredOnlyCount = details.filter((item) => {
    const paths = item?.paths || {};
    return countVisiblePathViews(paths) === 0 && toVisibleViews(item?.views ?? 0, paths) === 0;
  }).length;

  return Math.max(0, fallbackCount - ignoredOnlyCount);
}

function toTopPages(paths = {}, limit = 12) {
  return Object.entries(paths)
    .filter(([path]) => !isIgnoredPath(path))
    .map(([path, item]) => ({
      path,
      title: item?.title || path,
      views: item?.views ?? 0,
      lastSeen: item?.lastSeen || ""
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

function isContentPath(path = "") {
  if (isIgnoredPath(path)) {
    return false;
  }

  return (
    (path.startsWith("/blog/") && path !== "/blog/") ||
    (path.startsWith("/contests/") && path !== "/contests/")
  );
}

function toContentPages(paths = {}, limit = 30) {
  return toTopPages(paths, 120)
    .filter((item) => isContentPath(item.path))
    .slice(0, limit);
}

function getPathViews(paths = {}, path = "") {
  if (isIgnoredPath(path)) {
    return 0;
  }

  return paths?.[path]?.views ?? 0;
}

function toContentDetails(contentPages = [], todayPaths = {}, recentDayItems = []) {
  return contentPages.map((item) => {
    const recentDays = recentDayItems.map((day) => ({
      date: day.date,
      views: getPathViews(day.paths, item.path)
    }));

    return {
      ...item,
      todayViews: getPathViews(todayPaths, item.path),
      recentViews: recentDays.reduce((total, day) => total + day.views, 0),
      recentDays
    };
  });
}

function toReferrers(referrers = {}, limit = 8) {
  return Object.entries(referrers)
    .map(([name, views]) => ({ name, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

function toSearchTerms(searchTerms = {}, limit = 12) {
  return Object.entries(searchTerms)
    .map(([name, item]) => ({
      name,
      views: item?.views ?? 0,
      lastSeen: item?.lastSeen || ""
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

function toVisitorList(visitors = {}, limit = 24) {
  return Object.entries(visitors)
    .map(([key, item]) => {
      const profile = item?.profile || {};
      const paths = item?.paths || {};
      const visibleViews = countVisiblePathViews(paths);
      if (!visibleViews) {
        return null;
      }

      const topPaths = toTopPages(paths, 5);
      const topReferrers = toReferrers(item?.referrers || {}, 3);

      return {
        id: item?.id || key.slice(-12),
        views: visibleViews,
        firstSeen: item?.firstSeen || "",
        lastSeen: item?.lastSeen || "",
        profile: {
          country: profile.country || "unknown",
          region: profile.region || "",
          city: profile.city || "",
          timezone: profile.timezone || "",
          colo: profile.colo || "",
          language: profile.language || "unknown",
          browser: profile.browser || "unknown",
          os: profile.os || "unknown",
          device: profile.device || "unknown"
        },
        topPaths,
        topReferrers
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0))
    .slice(0, limit);
}

function isAuthorized(request, env) {
  const expected = env.ANALYTICS_ADMIN_TOKEN;
  if (!expected) {
    return false;
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

  const limited = await enforceRateLimit(store, request, {
    scope: "stats",
    limit: 20,
    windowSeconds: 60
  });
  if (limited) {
    return limited;
  }

  if (!env.ANALYTICS_ADMIN_TOKEN) {
    return Response.json(
      {
        error: "missing_admin_token",
        message: "Cloudflare Pages needs ANALYTICS_ADMIN_TOKEN before stats can be viewed."
      },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  if (!isAuthorized(request, env)) {
    return Response.json(
      {
        error: "unauthorized",
        message: "需要统计后台 token。"
      },
      { status: 401, headers: noStoreHeaders() }
    );
  }

  const todayKey = getShanghaiDate(0);
  const recentKeys = Array.from({ length: 7 }, (_, index) => getShanghaiDate(-index)).reverse();

  const [summary, today, recentDayItems] = await Promise.all([
    readJson(store, "summary", {
      totalViews: 0,
      firstSeen: "",
      lastSeen: "",
      paths: {},
      searchTerms: {},
      recentVisitors: {}
    }),
    readJson(store, `day:${todayKey}`, {
      date: todayKey,
      views: 0,
      visitorIds: [],
      paths: {},
      referrers: {},
      searchTerms: {},
      visitorDetails: {}
    }),
    Promise.all(
      recentKeys.map(async (date) => {
        const item = await readJson(store, `day:${date}`, {
          date,
          views: 0,
          visitorIds: [],
          paths: {},
          referrers: {},
          searchTerms: {},
          visitorDetails: {}
        });

        return {
          date,
          views: item.views ?? 0,
          visitors: countVisibleVisitors(item.visitorDetails, item.visitorIds?.length ?? 0),
          paths: item.paths ?? {}
        };
      })
    )
  ]);

  const articlePages = toContentDetails(toContentPages(summary.paths, 30), today.paths, recentDayItems);

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      protected: Boolean(env.ANALYTICS_ADMIN_TOKEN),
      summary: {
        totalViews: toVisibleViews(summary.totalViews, summary.paths),
        firstSeen: summary.firstSeen || "",
        lastSeen: summary.lastSeen || ""
      },
      today: {
        date: today.date,
        views: toVisibleViews(today.views, today.paths),
        visitors: countVisibleVisitors(today.visitorDetails, today.visitorIds?.length ?? 0),
        topPages: toTopPages(today.paths, 8),
        articlePages: toContentPages(today.paths, 12),
        referrers: toReferrers(today.referrers, 8),
        searchTerms: toSearchTerms(today.searchTerms, 10),
        visitorDetails: toVisitorList(today.visitorDetails, 18)
      },
      recentDays: recentDayItems.map((day) => ({
        date: day.date,
        views: toVisibleViews(day.views, day.paths),
        visitors: day.visitors
      })),
      articlePages,
      searchTerms: toSearchTerms(summary.searchTerms, 20),
      topPages: toTopPages(summary.paths, 12),
      recentVisitors: toVisitorList(summary.recentVisitors, 24)
    },
    {
      headers: noStoreHeaders()
    }
  );
}
