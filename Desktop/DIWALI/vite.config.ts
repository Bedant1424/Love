import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './src/server/api';

function cloudflareApiDevMiddleware(): Plugin {
  return {
    name: 'cloudflare-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          try {
            const host = req.headers.host || 'localhost:3000';
            const fullUrl = `http://${host}${req.url}`;

            let body: string | undefined;
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              const buffers: Buffer[] = [];
              for await (const chunk of req) {
                buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
              }
              body = Buffer.concat(buffers).toString('utf-8');
            }

            const headers = new Headers();
            for (const [key, val] of Object.entries(req.headers)) {
              if (val) {
                if (Array.isArray(val)) {
                  val.forEach((v) => headers.append(key, v));
                } else {
                  headers.set(key, val);
                }
              }
            }

            const webReq = new Request(fullUrl, {
              method: req.method,
              headers,
              body: body || undefined,
            });

            const webRes = await handleApiRequest(webReq);
            res.statusCode = webRes.status;
            webRes.headers.forEach((v, k) => {
              res.setHeader(k, v);
            });
            const text = await webRes.text();
            res.end(text);
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: { message: err?.message || 'Server error' } }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), cloudflareApiDevMiddleware()],
  server: {
    port: 3000,
  },
});
