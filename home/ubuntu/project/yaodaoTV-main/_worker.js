// File: _worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/proxy/")) {
      let encodedTargetUrlPart = url.pathname.substring("/proxy/".length);
      if (url.search) {
        encodedTargetUrlPart += url.search;
      }

      let targetUrl;
      try {
        targetUrl = decodeURIComponent(encodedTargetUrlPart);
      } catch (e) {
        return new Response(`Failed to decode target URL part: ${encodedTargetUrlPart}. Error: ${e.message}`, { status: 400 });
      }

      if (!targetUrl.startsWith("http://" ) && !targetUrl.startsWith("https://" )) {
        return new Response(`Invalid target URL after decoding: "${targetUrl}". It must start with http:// or https://. Original encoded part: "${encodedTargetUrlPart}"`, { status: 400 } );
      }

      try {
        const proxyRequest = new Request(targetUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          redirect: "follow"
        });

        const response = await fetch(proxyRequest);
        // Create a new response to ensure correct headers for CORS if needed, and to make it mutable.
        const newHeaders = new Headers(response.headers);
        newHeaders.set("Access-Control-Allow-Origin", "*"); // Allow all origins for simplicity
        newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });

      } catch (error) {
        return new Response(`Proxy request to "${targetUrl}" failed: ${error.message}`, { status: 502 }); // 502 Bad Gateway for upstream errors
      }
    }

    return env.ASSETS.fetch(request);
  }
};
