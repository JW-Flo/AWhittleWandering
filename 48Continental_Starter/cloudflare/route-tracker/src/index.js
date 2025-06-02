export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "GET") {
      const current = await env.ROUTE_KV.get("current");
      const next = await env.ROUTE_KV.get("next");
      const eta = await env.ROUTE_KV.get("eta");
      return new Response(JSON.stringify({ current, next, eta }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (request.method === "POST") {
      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
        return new Response("Unauthorized", { status: 401 });
      }
      const body = await request.json();
      await env.ROUTE_KV.put("current", body.current || "");
      await env.ROUTE_KV.put("next", body.next || "");
      await env.ROUTE_KV.put("eta", body.eta || "");
      return new Response("Route updated", { status: 200 });
    }
    return new Response("Method Not Allowed", { status: 405 });
  }
};