const KV_BINDING = "BLOG_ANALYTICS";
const MAX_VISITOR_IDS_PER_DAY = 5000;
const MAX_TRACKED_PATHS = 120;
const MAX_REFERRERS = 80;
const PAGEVIEW_DEDUPE_SECONDS = 60;

function getAnalyticsStore(env) {
  return env[KV_BINDING];
}

function getShanghaiDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

async function readJson(store, key, fallback) {
  const value = await store.get(key, { type: "json" });
  return value ?? fallback;
}

function normalizePath(pathname) {
  if (!pathname || typeof pathname !== "string") {
    return "/";
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/admin")) {
    return null;
  }

  return pathname.split("#")[0].split("?")[0] || "/";
}

function normalizeTitle(title) {
  return typeof title === "string" ? title.slice(0, 140) : "";
}

function normalizeReferrer(referrer, origin) {
  if (!referrer || typeof referrer !== "string") {
    return "direct";
  }

  try {
    const url = new URL(referrer);
    if (url.origin === origin) {
      return "internal";
    }
    return url.hostname || "external";
  } catch {
    return "external";
  }
}

function bumpMapEntry(map, key, title) {
  const current = map[key] ?? { views: 0, title: "", lastSeen: "" };
  current.views += 1;
  current.lastSeen = new Date().toISOString();
  if (title) {
    current.title = title;
  }
  map[key] = current;
}

function trimObjectByViews(value, limit) {
  return Object.fromEntries(
    Object.entries(value)
      .sort((a, b) => (b[1]?.views ?? b[1] ?? 0) - (a[1]?.views ?? a[1] ?? 0))
      .slice(0, limit)
  );
}

async function hashValue(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function isDuplicatePageView(store, { today, visitorId, path }) {
  if (!visitorId) {
    return false;
  }

  const fingerprint = await hashValue(`${visitorId}:${path}`);
  const key = `dedupe:${today}:${fingerprint}`;
  const existing = await store.get(key);
  if (existing) {
    return true;
  }

  await store.put(key, "1", { expirationTtl: PAGEVIEW_DEDUPE_SECONDS });
  return false;
}

async function recordPageView({ request, env }) {
  const store = getAnalyticsStore(env);
  if (!store) {
    return;
  }

  const origin = new URL(request.url).origin;
  const payload = await request.json().catch(() => ({}));
  const path = normalizePath(payload.path);
  if (!path) {
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const today = getShanghaiDate(now);
  const title = normalizeTitle(payload.title);
  const visitorId = typeof payload.visitorId === "string" ? payload.visitorId.slice(0, 80) : "";
  const referrer = normalizeReferrer(payload.referrer, origin);

  if (await isDuplicatePageView(store, { today, visitorId, path })) {
    return;
  }

  const [summary, day] = await Promise.all([
    readJson(store, "summary", {
      totalViews: 0,
      firstSeen: nowIso,
      lastSeen: nowIso,
      paths: {}
    }),
    readJson(store, `day:${today}`, {
      date: today,
      views: 0,
      visitorIds: [],
      paths: {},
      referrers: {}
    })
  ]);

  summary.totalViews = (summary.totalViews ?? 0) + 1;
  summary.firstSeen ||= nowIso;
  summary.lastSeen = nowIso;
  summary.paths ||= {};
  bumpMapEntry(summary.paths, path, title);
  summary.paths = trimObjectByViews(summary.paths, MAX_TRACKED_PATHS);

  day.views = (day.views ?? 0) + 1;
  day.paths ||= {};
  day.referrers ||= {};
  day.visitorIds ||= [];
  bumpMapEntry(day.paths, path, title);
  day.paths = trimObjectByViews(day.paths, MAX_TRACKED_PATHS);
  day.referrers[referrer] = (day.referrers[referrer] ?? 0) + 1;
  day.referrers = trimObjectByViews(day.referrers, MAX_REFERRERS);

  if (visitorId && !day.visitorIds.includes(visitorId) && day.visitorIds.length < MAX_VISITOR_IDS_PER_DAY) {
    day.visitorIds.push(visitorId);
  }

  await Promise.all([
    store.put("summary", JSON.stringify(summary)),
    store.put(`day:${today}`, JSON.stringify(day))
  ]);
}

export async function onRequestPost(context) {
  const store = getAnalyticsStore(context.env);
  if (!store) {
    return new Response(null, { status: 204 });
  }

  context.waitUntil(recordPageView(context));
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
