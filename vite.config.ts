import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-content-saver',
      configureServer(server) {
        server.middlewares.use('/api/save-content', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                // Save to public/content.json
                const publicJsonPath = path.resolve(__dirname, 'public/content.json');
                fs.writeFileSync(publicJsonPath, JSON.stringify(data, null, 2), 'utf-8');

                // Save to src/data/content.ts
                const tsPath = path.resolve(__dirname, 'src/data/content.ts');
                const tsCode = `import { BirthdayContent } from '../types/content.types';\n\nexport const birthdayContent: BirthdayContent = ${JSON.stringify(data, null, 2)};\n`;
                fs.writeFileSync(tsPath, tsCode, 'utf-8');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: true,
                    message: 'Saved directly to public/content.json & src/data/content.ts',
                  })
                );
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Failed to write content';
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: msg }));
              }
            });
          } else {
            res.writeHead(405);
            res.end();
          }
        });
      },
    },
  ],
  base: '/Love/',
})
