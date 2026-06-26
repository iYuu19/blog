const KV_BINDING = "BLOG_ANALYTICS";
const MAX_VISITOR_IDS_PER_DAY = 5000;
const MAX_TRACKED_PATHS = 120;
const MAX_REFERRERS = 80;
const MAX_VISITOR_DETAILS_PER_DAY = 80;
const MAX_RECENT_VISITORS = 120;
const MAX_VISITOR_PATHS = 10;
const PAGEVIEW_DEDUPE_SECONDS = 60;
import {
  enforceRateLimit,
  getClientIp,
  noStoreHeaders,
  rejectCrossOriginRequest,
  rejectOversizedJson
} from "../_security.js";

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

function getPrimaryLanguage(request) {
  const language = request.headers.get("accept-language") || "";
  return language.split(",")[0].trim().slice(0, 24) || "unknown";
}

function getBrowserName(userAgent) {
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/OPR\//i.test(userAgent)) return "Opera";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/CriOS\//i.test(userAgent)) return "Chrome iOS";
  if (/Chrome\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent)) return "Safari";
  return "unknown";
}

function getOsName(userAgent) {
  if (/Windows NT/i.test(userAgent)) return "Windows";
  if (/Android/i.test(userAgent)) return "Android";
  if (/(iPhone|iPad|iPod)/i.test(userAgent)) return "iOS";
  if (/Mac OS X/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "unknown";
}

function getDeviceType(userAgent) {
  if (/iPad|Tablet/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return "mobile";
  return "desktop";
}

function getClientProfile(request) {
  const userAgent = request.headers.get("user-agent") || "";
  const cf = request.cf || {};

  return {
    country: cf.country || "unknown",
    region: cf.region || "",
    city: cf.city || "",
    timezone: cf.timezone || "",
    colo: cf.colo || "",
    language: getPrimaryLanguage(request),
    browser: getBrowserName(userAgent),
    os: getOsName(userAgent),
    device: getDeviceType(userAgent)
  };
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

function trimVisitorDetails(value, limit) {
  return Object.fromEntries(
    Object.entries(value)
      .sort((a, b) => new Date(b[1]?.lastSeen || 0) - new Date(a[1]?.lastSeen || 0))
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

async function getVisitorKey({ request, today, visitorId }) {
  if (visitorId) {
    return `client:${await hashValue(visitorId)}`;
  }

  const clientIp = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `network:${await hashValue(`${today}:${clientIp || "unknown"}:${userAgent}`)}`;
}

async function isDuplicatePageView(store, { today, visitorKey, path }) {
  if (!visitorKey) {
    return false;
  }

  const fingerprint = await hashValue(`${visitorKey}:${path}`);
  const key = `dedupe:${today}:${fingerprint}`;
  const existing = await store.get(key);
  if (existing) {
    return true;
  }

  await store.put(key, "1", { expirationTtl: PAGEVIEW_DEDUPE_SECONDS });
  return false;
}

function bumpVisitorDetails(visitors, visitorKey, { nowIso, path, title, referrer, profile }) {
  if (!visitorKey) {
    return;
  }

  const current = visitors[visitorKey] ?? {
    id: visitorKey.slice(-12),
    firstSeen: nowIso,
    lastSeen: "",
    views: 0,
    paths: {},
    referrers: {},
    profile
  };

  current.firstSeen ||= nowIso;
  current.lastSeen = nowIso;
  current.views = (current.views ?? 0) + 1;
  current.profile = { ...(current.profile || {}), ...profile };
  current.paths ||= {};
  current.referrers ||= {};
  bumpMapEntry(current.paths, path, title);
  current.paths = trimObjectByViews(current.paths, MAX_VISITOR_PATHS);
  current.referrers[referrer] = (current.referrers[referrer] ?? 0) + 1;
  current.referrers = trimObjectByViews(current.referrers, 5);
  visitors[visitorKey] = current;
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
  const visitorKey = await getVisitorKey({ request, today, visitorId });
  const profile = getClientProfile(request);
  const referrer = normalizeReferrer(payload.referrer, origin);

  if (await isDuplicatePageView(store, { today, visitorKey, path })) {
    return;
  }

  const [summary, day] = await Promise.all([
    readJson(store, "summary", {
      totalViews: 0,
      firstSeen: nowIso,
      lastSeen: nowIso,
      paths: {},
      searchTerms: {},
      recentVisitors: {}
    }),
    readJson(store, `day:${today}`, {
      date: today,
      views: 0,
      visitorIds: [],
      paths: {},
      referrers: {},
      searchTerms: {},
      visitorDetails: {}
    })
  ]);

  summary.totalViews = (summary.totalViews ?? 0) + 1;
  summary.firstSeen ||= nowIso;
  summary.lastSeen = nowIso;
  summary.paths ||= {};
  summary.searchTerms ||= {};
  summary.recentVisitors ||= {};
  bumpMapEntry(summary.paths, path, title);
  summary.paths = trimObjectByViews(summary.paths, MAX_TRACKED_PATHS);
  bumpVisitorDetails(summary.recentVisitors, visitorKey, { nowIso, path, title, referrer, profile });
  summary.recentVisitors = trimVisitorDetails(summary.recentVisitors, MAX_RECENT_VISITORS);

  day.views = (day.views ?? 0) + 1;
  day.paths ||= {};
  day.referrers ||= {};
  day.searchTerms ||= {};
  day.visitorIds ||= [];
  day.visitorDetails ||= {};
  bumpMapEntry(day.paths, path, title);
  day.paths = trimObjectByViews(day.paths, MAX_TRACKED_PATHS);
  day.referrers[referrer] = (day.referrers[referrer] ?? 0) + 1;
  day.referrers = trimObjectByViews(day.referrers, MAX_REFERRERS);
  bumpVisitorDetails(day.visitorDetails, visitorKey, { nowIso, path, title, referrer, profile });
  day.visitorDetails = trimVisitorDetails(day.visitorDetails, MAX_VISITOR_DETAILS_PER_DAY);

  if (visitorKey && !day.visitorIds.includes(visitorKey) && day.visitorIds.length < MAX_VISITOR_IDS_PER_DAY) {
    day.visitorIds.push(visitorKey);
  }

  await Promise.all([
    store.put("summary", JSON.stringify(summary)),
    store.put(`day:${today}`, JSON.stringify(day))
  ]);
}

export async function onRequestPost(context) {
  const store = getAnalyticsStore(context.env);
  const rejectedOrigin = rejectCrossOriginRequest(context.request, context.env);
  if (rejectedOrigin) {
    return rejectedOrigin;
  }

  const rejectedBody = rejectOversizedJson(context.request, 2048);
  if (rejectedBody) {
    return rejectedBody;
  }

  const limited = await enforceRateLimit(store, context.request, {
    scope: "track",
    limit: 60,
    windowSeconds: 60
  });
  if (limited) {
    return limited;
  }

  if (!store) {
    return new Response(null, { status: 204 });
  }

  context.waitUntil(recordPageView(context));
  return new Response(null, {
    status: 204,
    headers: noStoreHeaders()
  });
}
