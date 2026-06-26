const KV_BINDING = "BLOG_ANALYTICS";
const MAX_SEARCH_TERMS = 100;
const SEARCH_DEDUPE_SECONDS = 600;
import {
  enforceRateLimit,
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

function normalizeTerm(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function trimObjectByViews(value, limit) {
  return Object.fromEntries(
    Object.entries(value)
      .sort((a, b) => (b[1]?.views ?? 0) - (a[1]?.views ?? 0))
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

async function isDuplicateSearch(store, { today, visitorId, term }) {
  if (!visitorId) {
    return false;
  }

  const fingerprint = await hashValue(`${visitorId}:${term.toLowerCase()}`);
  const key = `search-dedupe:${today}:${fingerprint}`;
  const existing = await store.get(key);
  if (existing) {
    return true;
  }

  await store.put(key, "1", { expirationTtl: SEARCH_DEDUPE_SECONDS });
  return false;
}

function bumpSearchTerm(terms, term, nowIso) {
  const current = terms[term] ?? { views: 0, lastSeen: "" };
  current.views += 1;
  current.lastSeen = nowIso;
  terms[term] = current;
}

async function recordSearchTerm({ request, env }) {
  const store = getAnalyticsStore(env);
  if (!store) {
    return;
  }

  const payload = await request.json().catch(() => ({}));
  const term = normalizeTerm(payload.term);
  if (term.length < 2) {
    return;
  }

  const visitorId = typeof payload.visitorId === "string" ? payload.visitorId.slice(0, 80) : "";
  const now = new Date();
  const nowIso = now.toISOString();
  const today = getShanghaiDate(now);

  if (await isDuplicateSearch(store, { today, visitorId, term })) {
    return;
  }

  const [summary, day] = await Promise.all([
    readJson(store, "summary", {
      totalViews: 0,
      firstSeen: nowIso,
      lastSeen: nowIso,
      paths: {},
      searchTerms: {}
    }),
    readJson(store, `day:${today}`, {
      date: today,
      views: 0,
      visitorIds: [],
      paths: {},
      referrers: {},
      searchTerms: {}
    })
  ]);

  summary.searchTerms ||= {};
  day.searchTerms ||= {};
  bumpSearchTerm(summary.searchTerms, term, nowIso);
  bumpSearchTerm(day.searchTerms, term, nowIso);
  summary.searchTerms = trimObjectByViews(summary.searchTerms, MAX_SEARCH_TERMS);
  day.searchTerms = trimObjectByViews(day.searchTerms, MAX_SEARCH_TERMS);

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

  const rejectedBody = rejectOversizedJson(context.request, 1024);
  if (rejectedBody) {
    return rejectedBody;
  }

  const limited = await enforceRateLimit(store, context.request, {
    scope: "search",
    limit: 20,
    windowSeconds: 60
  });
  if (limited) {
    return limited;
  }

  if (!store) {
    return new Response(null, { status: 204 });
  }

  context.waitUntil(recordSearchTerm(context));
  return new Response(null, {
    status: 204,
    headers: noStoreHeaders()
  });
}
