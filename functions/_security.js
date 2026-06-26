const DEFAULT_ALLOWED_ORIGIN = "https://0xiyuu.top";
const DEFAULT_MAX_BODY_BYTES = 4096;

function getAllowedOrigins(env) {
  const configured = env.ALLOWED_ORIGINS || env.SITE_URL || DEFAULT_ALLOWED_ORIGIN;
  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return request.headers.get("cf-connecting-ip") || forwardedFor.split(",")[0].trim() || "unknown";
}

export function rejectCrossOriginRequest(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) {
    return null;
  }

  const allowedOrigins = getAllowedOrigins(env);
  if (allowedOrigins.includes(origin)) {
    return null;
  }

  return Response.json(
    { error: "forbidden_origin", message: "This API only accepts same-site browser requests." },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

export function rejectOversizedJson(request, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json(
      { error: "unsupported_media_type", message: "Expected application/json." },
      { status: 415, headers: { "Cache-Control": "no-store" } }
    );
  }

  const length = Number(request.headers.get("Content-Length") || "0");
  if (length > maxBytes) {
    return Response.json(
      { error: "payload_too_large", message: "Request body is too large." },
      { status: 413, headers: { "Cache-Control": "no-store" } }
    );
  }

  return null;
}

async function hashValue(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function enforceRateLimit(store, request, { scope, limit, windowSeconds }) {
  if (!store) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSeconds);
  const fingerprint = await hashValue(`${getClientIp(request)}:${request.headers.get("user-agent") || ""}`);
  const key = `rate:${scope}:${bucket}:${fingerprint}`;
  const current = Number((await store.get(key)) || "0");

  if (current >= limit) {
    return Response.json(
      { error: "rate_limited", message: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(windowSeconds)
        }
      }
    );
  }

  await store.put(key, String(current + 1), { expirationTtl: windowSeconds * 2 });
  return null;
}

export function noStoreHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store",
    ...extra
  };
}
