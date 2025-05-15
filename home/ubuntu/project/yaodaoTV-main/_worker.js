// File: _worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 检查路径是否以 /proxy/ 开头
    if (url.pathname.startsWith("/proxy/")) {
      // 提取 /proxy/ 后面的真实目标 URL
      // 例如，如果请求是 /proxy/https://example.com/api ，目标 URL 就是 https://example.com/api
      let targetUrl = url.pathname.substring("/proxy/".length );

      // 如果原始请求有查询参数，也附加到目标 URL 上
      if (url.search) {
        targetUrl += url.search;
      }

      // 验证目标 URL 是否以 http:// 或 https:// 开头
      if (!targetUrl.startsWith("http://" ) && !targetUrl.startsWith("https://" )) {
        return new Response("Invalid target URL in proxy request. Must start with http:// or https://.", { status: 400 } );
      }

      try {
        // 创建一个新的请求到目标 URL，复制原始请求的方法、头部等信息
        // 注意：为了简单起见，这里没有完全复制所有头部，实际应用中可能需要更精细的处理
        const proxyRequest = new Request(targetUrl, {
          method: request.method,
          headers: request.headers, // 将原始请求的头部传递过去
          body: request.body,
          redirect: "follow" // 遵循重定向
        });

        // 发起代理请求
        const response = await fetch(proxyRequest);

        // 返回从目标 API 收到的响应
        // 需要确保跨域头部 (CORS) 被正确处理，如果目标 API 没有设置，这里可能需要添加
        // 为简单起见，我们直接返回响应，但实际中可能需要 new Response(response.body, { headers: newHeaders }) 来修改头部
        return response;

      } catch (error) {
        return new Response(`Proxy request failed: ${error.message}`, { status: 500 });
      }
    }

    // 如果请求路径不是 /proxy/，则正常提供静态资源
    // env.ASSETS.fetch 会处理静态文件的服务
    return env.ASSETS.fetch(request);
  }
};
