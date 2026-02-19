import { httpRouter } from "convex/server";

const http = httpRouter();

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: (async (request: any) => {
    return new Response(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "2.0.0",
        message: "Dubai Borka House Backend is running"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as any,
});

export default http;
