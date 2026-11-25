// Локальный стенд Orbiq: API (CRM + журнал) на моке Redis и статика сайта. Запуск: node tests/e2e-server.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.KV_REST_API_URL = 'https://kv.test'; process.env.KV_REST_API_TOKEN = 't';
process.env.SESSION_SECRET = 'e2e-secret-1234567890'; process.env.EMAIL_MODE = 'test'; process.env.ADMIN_KEY = 'e2e-admin-key';
process.env.CRM_OWNER_EMAILS = 'owner@e2e.test'; process.env.CRON_SECRET = 'cron'; process.env.OPS_KEY = 'ops-key-e2e-0123456789abcdef0123456789'; process.env.SITE_URL = '';
for (const k of ['AI_GATEWAY_API_KEY', 'RESEND_API_KEY', 'TG_BOT_TOKEN', 'VERCEL_OIDC_TOKEN', 'AI_BASE_URL']) delete process.env[k];
await import(pathToFileURL(path.join(ROOT, 'tests', 'kvmock.mjs')).href);
const crm = (await import(pathToFileURL(path.join(ROOT, 'api', 'crm.mjs')).href)).default;
const j = (await import(pathToFileURL(path.join(ROOT, 'api', 'j.mjs')).href)).default;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const port = +(process.argv[2] || 8790);
http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/api/crm' || u.pathname === '/api/crm/') return await crm(req, res);
    if (u.pathname === '/api/j' || u.pathname === '/api/j/') return await j(req, res);
    let p = path.join(ROOT, decodeURIComponent(u.pathname));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p) && fs.existsSync(p + '.html')) p = p + '.html';
    if (!fs.existsSync(p)) { res.statusCode = 404; return res.end('404'); }
    res.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream'); fs.createReadStream(p).pipe(res);
  } catch (e) { console.error(e); if (!res.headersSent) { res.statusCode = 500; res.end(String(e)); } }
}).listen(port, () => console.log('e2e on ' + port));
