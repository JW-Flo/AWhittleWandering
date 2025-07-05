/**
 * CORS handler for Cloudflare Workers
 */
export function handleCORS(request, config) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  const origin = request.headers.get("Origin");
  if (origin && config.cors.allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    headers["Access-Control-Allow-Origin"] = "null";
  }

  return headers;
}

/**
 * 404 Not Found handler
 */
export function handleNotFound() {
  // Cloudflare Workers environment provides global Response
  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
