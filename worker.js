const ALLOWED_ORIGIN = "https://maru75180-max.github.io";

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin), "Cache-Control": "no-store" } });
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
async function validSession(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|; )tapbiz_session=([^;]+)/);
  if (!m) return false;
  const [payload, signature] = m[1].split(".");
  if (!payload || !signature || !env.SESSION_SECRET) return false;
  let decoded;
  try { decoded = atob(payload.replace(/-/g,"+").replace(/_/g,"/")); } catch { return false; }
  const [expiry] = decoded.split(":");
  if (!expiry || Number(expiry) < Math.floor(Date.now()/1000)) return false;
  return (await sign(payload, env.SESSION_SECRET)) === signature;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) return new Response("Forbidden origin", { status: 403 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(request.url);
    if (url.pathname === "/api/login" && request.method === "POST") {
      let body; try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400, origin); }
      if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || body.password !== env.ADMIN_PASSWORD) return json({ error: "Invalid password" }, 401, origin);
      const payload = btoa(`${Math.floor(Date.now()/1000)+60*60*8}:admin`).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
      const sig = await sign(payload, env.SESSION_SECRET);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type":"application/json", ...cors(origin), "Cache-Control":"no-store", "Set-Cookie":`tapbiz_session=${payload}.${sig}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=28800` } });
    }
    if (url.pathname === "/api/logout" && request.method === "POST") {
      return new Response(JSON.stringify({ok:true}), {status:200, headers:{"Content-Type":"application/json",...cors(origin),"Set-Cookie":"tapbiz_session=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0"}});
    }
    if (url.pathname === "/api/businesses" && request.method === "GET") {
      const row = await env.TAPBIZ_DB.prepare("SELECT data FROM business_store WHERE id = 1").first();
      return json({ businesses: row ? JSON.parse(row.data) : [] }, 200, origin);
    }
    if (url.pathname === "/api/businesses" && request.method === "POST") {
      if (!(await validSession(request, env))) return json({error:"Admin login required"}, 401, origin);
      let body; try { body = await request.json(); } catch { return json({error:"Invalid JSON"}, 400, origin); }
      if (!Array.isArray(body.businesses) || body.businesses.length > 1000) return json({error:"Invalid business list"}, 400, origin);
      const data = JSON.stringify(body.businesses);
      await env.TAPBIZ_DB.prepare("INSERT INTO business_store (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data").bind(data).run();
      return json({ok:true}, 200, origin);
    }
    return json({error:"Not found"},404,origin);
  }
};
