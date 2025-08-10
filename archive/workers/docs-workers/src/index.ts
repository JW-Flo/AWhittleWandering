export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const reqId = crypto.randomUUID();
    const start = Date.now();
    try {
      return new Response(JSON.stringify({ ok: true, requestId: reqId }), {
        headers: { "content-type": "application/json" }
      });
    } finally {
      const dur = Date.now() - start;
      // simple metric/log example; replace with real telemetry sink
      console.log(JSON.stringify({ level: "info", reqId, dur }));
    }
  }
};
