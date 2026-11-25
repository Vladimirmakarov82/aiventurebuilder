// Orbiq Journal API: один обработчик, маршрут в ?r=
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apply, levels as coreLevels, artTransition, artLive, recTransition, msgTransition, oppState } from './_core.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ENV = process.env;
const SITE = ENV.SITE_URL || 'https://orbiqgroup.com';
const TZ = 'Europe/Moscow';
const KVK = Object.keys(ENV).find(k => /(KV_REST_API_URL|REDIS_REST_URL|REST_API_URL)$/.test(k) && !/READ_ONLY/.test(k));
const KV_URL = KVK ? ENV[KVK] : '';
const KV_TOKEN = KVK ? (ENV[KVK.replace(/URL$/, 'TOKEN')] || '') : '';
const STORE_OK = !!(KV_URL && KV_TOKEN);

// ---------- утилиты ----------
const DEV_RANDOM = crypto.randomBytes(32).toString('hex');
const b64u = (b) => Buffer.from(b).toString('base64url');
const hmac = (s) => crypto.createHmac('sha256', ENV.SESSION_SECRET || (ENV.VERCEL_ENV ? DEV_RANDOM : 'dev')).update(s).digest('base64url');
function sign(obj) { const p = b64u(JSON.stringify(obj)); return p + '.' + hmac(p); }
function unsign(tok) {
  if (!tok || tok.indexOf('.') < 0) return null;
  const [p, s] = tok.split('.');
  const good = hmac(p);
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return (o.exp && o.exp < Date.now()) ? null : o; } catch { return null; }
}
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const uidOf = (email) => sha((ENV.SESSION_SECRET || '') + '|' + email.toLowerCase()).slice(0, 24);
const rid = (n = 10) => crypto.randomBytes(n).toString('base64url').slice(0, n);
function cookies(req) { const o = {}; (req.headers.cookie || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) o[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); }); return o; }
function setCookie(res, name, val, maxAge) { const prev = res.getHeader('Set-Cookie') || []; res.setHeader('Set-Cookie', [].concat(prev, `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`)); }
function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
async function body(req) { if (req.body && typeof req.body === 'object') return req.body; let s = ''; for await (const c of req) s += c; try { return JSON.parse(s || '{}'); } catch { return {}; } }
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: TZ });

// ---------- хранилище (Upstash Redis через REST: документы JSON по ключам) ----------
class NoStore extends Error {}
async function kv(cmd) {
  if (!STORE_OK) throw new NoStore();
  const r = await fetch(KV_URL, { method: 'POST', headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({})); if (!r.ok || j.error) throw new Error('kv ' + r.status + ' ' + (j.error || '')); return j.result;
}
async function sget(p) { const v = await kv(['GET', p]); return v == null ? null : JSON.parse(v); }
async function sgetE(p) { const v = await kv(['GET', p]); return v == null ? { doc: null, etag: null } : { doc: JSON.parse(v), etag: v }; }
// транзакционное обновление документа: запись только если документ не изменился с момента чтения (сравнение на стороне Redis)
const CAS = "local c=redis.call('GET',KEYS[1]) if (ARGV[1]=='' and c==false) or c==ARGV[1] then redis.call('SET',KEYS[1],ARGV[2]) return 1 end return 0";
async function update(p, fn) {
  for (let i = 0; i < 8; i++) {
    const { doc, etag } = await sgetE(p); const res = await fn(doc); if (!res || !res.doc) return res;
    if (await kv(['EVAL', CAS, '1', p, etag || '', JSON.stringify(res.doc)]) === 1) return res;
    await new Promise(r => setTimeout(r, 60 * (i + 1) + Math.random() * 80));
  }
  throw new Error('conflict');
}
async function auditLog(who, what, obj) { if (STORE_OK) { await kv(['LPUSH', 'audit', JSON.stringify({ who, what, obj, at: new Date().toISOString() })]).catch(() => {}); await kv(['LTRIM', 'audit', '0', '4999']).catch(() => {}); } }
async function sput(p, obj) { await kv(['SET', p, JSON.stringify(obj)]); }
async function slist(prefix, limit = 1000) {
  if (prefix === 'events/') { const l = await kv(['LRANGE', 'events', '0', String(limit - 1)]); return (l || []).map(x => ({ pathname: 'events/' + x })); }
  const out = []; let cur = '0';
  do { const [n, keys] = await kv(['SCAN', cur, 'MATCH', prefix + '*', 'COUNT', '1000']); cur = String(n); for (const k of keys) out.push({ pathname: k }); } while (cur !== '0' && out.length < limit);
  return out.sort((a, b) => (a.pathname < b.pathname ? -1 : 1)).slice(0, limit);
}
async function sdel(p) { if (STORE_OK) await kv(['DEL', p]).catch(() => {}); }

// ---------- контент (открыт на сайте; здесь нужен админке, рассылке и проверке статусов) ----------
let CONTENT = null;
function content() { return CONTENT || (CONTENT = JSON.parse(fs.readFileSync(path.join(DIR, '_data', 'content.json'), 'utf8'))); }
const ACH = JSON.parse(fs.readFileSync(path.join(DIR, '_data', 'achievements.json')));

async function statusMap() { return (STORE_OK && await sget('content/status.json').catch(() => null)) || {}; }
function isLive(id, st) { const a = content().articles[id]; if (!a) return false; return artLive(st[id] || { status: a.status || 'published' }); }
function statusOf(id, st) { const a = content().articles[id]; return (st[id] && st[id].status) || (a && a.status) || 'published'; }

// ---------- пользователи ----------
async function me(req) { const c = cookies(req); const s = unsign(c.oj); if (!s || !s.u || !s.e || !(s.exp > Date.now())) return null; return s; } // токен отписки {u} сессией не считается
async function loadUser(uid) { return await sget(`users/${uid}.json`); }
const levels = (user) => coreLevels(user, ACH);
const opsView = (u) => { const o = {}; for (const [k, v] of Object.entries((u && u.ops) || {})) o[k] = v.completed_at ? 'completed' : 'explored'; return o; };
async function logEvent(type, a = '', ch = '', s = '') {
  if (!STORE_OK) return;
  const clean = (x) => String(x || '-').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 60) || '-';
  await kv(['LPUSH', 'events', `${Date.now()}_${clean(type)}_${clean(a)}_${clean(ch)}_${clean(s)}_${rid(4)}.e`]).catch(() => {});
}
async function rateLimit(key, max, windowMin) {
  if (!STORE_OK) return true;
  const slot = Math.floor(Date.now() / (windowMin * 60000));
  const p = `rl/${sha(key).slice(0, 20)}-${slot}`;
  const n = await kv(['INCR', p]); if (n === 1) await kv(['EXPIRE', p, String(windowMin * 60 + 5)]).catch(() => {});
  return n <= max;
}

// ---------- почта (Resend) ----------
async function mail(to, subject, html) {
  if (!ENV.RESEND_API_KEY) return { ok: false, reason: 'no_key' };
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${ENV.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: ENV.MAIL_FROM || 'Orbiq Journal <journal@orbiqgroup.com>', to, subject, html }) });
  return { ok: r.ok, reason: r.ok ? '' : ('resend_' + r.status) };
}
function loginMail(link) {
  return `<div style="font-family:Georgia,serif;max-width:520px;margin:auto;padding:32px;color:#111"><p style="letter-spacing:.3em;font-size:13px">ORBIQ</p><h1 style="font-weight:500">Вход в Orbiq Journal</h1><p>Ссылку можно сохранить: она открывает профиль на любом устройстве в течение года.</p><p><a href="${esc(link)}" style="display:inline-block;background:#111;color:#fff;padding:14px 22px;text-decoration:none;border-radius:999px">Войти в профиль</a></p><p style="color:#777;font-size:13px">Если письмо пришло по ошибке, его можно удалить.</p></div>`;
}

// ---------- админ ----------
function isAdmin(req) { const s = unsign(cookies(req).oja); return !!(s && s.adm); }

// ---------- маршруты ----------
const R = {};

R['status'] = async (req, res) => { // публично: какие статьи скрыты
  const st = await statusMap(); const hidden = Object.keys(content().articles).filter(id => !isLive(id, st));
  res.setHeader('Cache-Control', 'public, max-age=60'); send(res, 200, { hidden });
};

R['me'] = async (req, res) => {
  const s = await me(req); if (!s) return send(res, 200, { user: null });
  let u = null; try { u = await loadUser(s.u); } catch (e) { if (e instanceof NoStore) return send(res, 200, { user: { id: s.u, email: s.e, nostore: true } }); throw e; }
  if (!u) return send(res, 200, { user: null });
  if (u.blocked) return send(res, 200, { user: null, blocked: true });
  send(res, 200, { user: { email: u.email, letter: !!u.letter, contributor: !!u.contributor, ops: opsView(u), pins: u.pins || {} }, levels: levels(u) });
};

R['auth/request'] = async (req, res) => {
  const b = await body(req);
  if (b.website) return send(res, 200, { ok: true }); // ловушка для ботов
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) return send(res, 400, { error: 'Проверьте адрес почты' });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0];
  try { if (!(await rateLimit('ip:' + ip, 8, 60)) || !(await rateLimit('em:' + email, 3, 15))) return send(res, 429, { error: 'Слишком много запросов. Попробуйте через несколько минут' }); }
  catch (e) { if (e instanceof NoStore) return send(res, 503, { error: 'Регистрация временно недоступна: хранилище не подключено' }); throw e; }
  const ret = String(b.ret || '/journal/').startsWith('/journal') ? String(b.ret || '/journal/') : '/journal/';
  // регистрация добровольная и открыта для любого адреса; приглашение дает только отметку «приглашенный»
  const u = await loadUser(uidOf(email));
  const generic = { ok: true, generic: true };
  if (u && u.blocked) return send(res, 200, generic);
  if (!u) { // действующее приглашение на этот адрес: ссылка подтверждения и активации
    const ix = await sget(`invidx/${sha(email).slice(0, 32)}.json`); const inv = ix && await sget(`inv/${ix.id}.json`);
    if (inv && inv.status === 'created' && Date.parse(inv.expires) > Date.now() && inv.email === email) {
      const vt = sign({ e: email, r: inv.target || '/journal/', inv: inv.id, j: rid(12), exp: Date.now() + LINK_TTL });
      return deliverLogin(req, res, email, vt, { generic: true });
    }
    const nt = sign({ e: email, r: ret, nw: 1, ref: String(b.ref || '').slice(0, 40), j: rid(12), exp: Date.now() + LINK_TTL }); // открытая регистрация
    return deliverLogin(req, res, email, nt, { generic: true });
  }
  const tok = sign({ e: email, r: ret, j: rid(12), exp: Date.now() + LINK_TTL });
  return deliverLogin(req, res, email, tok, { generic: true });
};
async function deliverLogin(req, res, email, tok, extra = {}) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const link = `https://${host}/api/j/?r=auth/verify&t=${encodeURIComponent(tok)}`;
  if (ENV.RESEND_API_KEY) { const m = await mail(email, 'Вход в Orbiq Journal', loginMail(link)); if (!m.ok) return send(res, 502, { error: 'Письмо не отправлено, попробуйте позже' }); return send(res, 200, { ok: true, ...extra }); }
  if (ENV.EMAIL_MODE === 'test') return send(res, 200, { ok: true, test_link: link, ...extra });
  return send(res, 503, { error: 'Отправка писем не подключена' });
}

R['auth/pw'] = async (req, res) => { // вход по почте и паролю: пароль задают при принятии приглашения Orbiq
  const b = await body(req); const email = String(b.email || '').trim().toLowerCase(); const pw = String(b.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !pw) return send(res, 400, { error: 'Нужны почта и пароль' });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0];
  if (!(await rateLimit('pwi:' + ip, 20, 15)) || !(await rateLimit('pwe:' + email, 8, 15))) return send(res, 429, { error: 'Слишком много попыток. Попробуйте через 15 минут' });
  const u = await loadUser(uidOf(email));
  const h = u && u.pw ? crypto.scryptSync(pw, u.pw.salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex') : '';
  if (!u || !u.pw || h.length !== u.pw.hash.length || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(u.pw.hash))) return send(res, 401, { error: 'Почта или пароль не подошли' });
  if (u.blocked) return send(res, 403, { error: 'Доступ закрыт' });
  setCookie(res, 'oj', sign({ u: u.id, e: email, exp: Date.now() + 365 * 864e5 }), 365 * 86400); send(res, 200, { ok: true });
};
R['auth/verify'] = async (req, res) => {
  const q = new URL(req.url, 'http://x').searchParams; const t = unsign(q.get('t') || '');
  if (!t) { res.statusCode = 302; res.setHeader('Location', '/journal/profile/?login=expired'); return res.end(); }
  const uid = uidOf(t.e); let u = await loadUser(uid);
  if (u && u.blocked) { res.statusCode = 302; res.setHeader('Location', '/journal/?login=suspended'); return res.end(); }
  let target = t.r || '/journal/';
  if (t.inv) { // активация персонального приглашения
    const ip = `inv/${t.inv}.json`; let invInfo = null;
    const out = await update(ip, (inv) => {
      if (!inv) return { err: 'gone' };
      if (inv.email !== t.e) return { err: 'email' };
      if (inv.status === 'accepted') return { err: inv.acceptedUid === uid ? 'again' : 'used' };
      if (inv.status !== 'created' || Date.parse(inv.expires) < Date.now()) return { err: 'expired' };
      invInfo = inv; return { doc: { ...inv, status: 'accepted', accepted_at: new Date().toISOString(), acceptedUid: uid } };
    });
    if (out.err && out.err !== 'again') { res.statusCode = 302; res.setHeader('Location', '/journal/?invite=' + out.err); return res.end(); }
    if (invInfo) {
      await sdel(`invidx/${sha(t.e).slice(0, 32)}.json`);
      if (!u) { u = { id: uid, email: t.e, first: invInfo.first, last: invInfo.last, created: new Date().toISOString(), invitedBy: invInfo.inviter, invite: invInfo.id, ref: invInfo.s || '', letter: false, ops: {}, pins: {}, contributor: false, blocked: false, inviteLimit: 3 }; await sput(`users/${uid}.json`, u); await logEvent('signup', '', 'invite', invInfo.s || ''); }
      await logEvent('invite_accepted', '', '', String(Math.round((Date.now() - Date.parse(invInfo.created)) / 3600000)));
      target = invInfo.target || target;
    }
  }
  if (!u && t.nw) { u = { id: uid, email: t.e, first: '', last: '', created: new Date().toISOString(), ref: t.ref || '', letter: false, ops: {}, pins: {}, contributor: false, blocked: false, inviteLimit: 3 }; await update(`users/${uid}.json`, (cur) => cur ? { noop: 1 } : { doc: u }); await logEvent('signup', '', 'open', t.ref || ''); }
  if (!u) { res.statusCode = 302; res.setHeader('Location', '/journal/profile/?login=expired'); return res.end(); }
  const seen = new Date().toISOString(); await update(`users/${uid}.json`, (cur) => ({ doc: { ...(cur || u), seen } }));
  setCookie(res, 'oj', sign({ u: uid, e: t.e, exp: Date.now() + 365 * 864e5 }), 365 * 86400);
  res.statusCode = 302; res.setHeader('Location', target); res.end();
};

// ---------- персональные приглашения ----------
const INV_DAYS = 30;
const invHash = (tok) => sha('inv|' + tok).slice(0, 40);
function invView(inv) { const st = (inv.status === 'created' && Date.parse(inv.expires) < Date.now()) ? 'expired' : inv.status; return { id: inv.id, first: inv.first, last: inv.last, status: st, created: inv.created, expires: inv.expires, target: inv.targetTitle || '' }; }
async function myInvites(u) { const out = []; for (const id of (u.invites || [])) { const inv = await sget(`inv/${id}.json`); if (inv) out.push(inv); } return out; }
const LINK_TTL = 365 * 864e5; // ссылка для входа работает год и много раз: вход всегда в одно нажатие
const INVITE_UNLIMITED = ENV.INVITE_LIMITED !== '1'; // решение Владимира 21.11.2026: приглашения без лимита на старте
function slotsLeft(u, invs) { if (INVITE_UNLIMITED) return 999; const used = invs.map(invView).filter(v => v.status === 'created' || v.status === 'accepted').length; return Math.max(0, (u.inviteLimit ?? 3) - used); }
function inviteLink(req, tok) { const host = req.headers['x-forwarded-host'] || req.headers.host; return `https://${host}/journal/invite/?t=${tok}`; }
R['invite/list'] = async (req, res) => {
  const s = await me(req); if (!s) return send(res, 401, { error: 'login' }); const u = await loadUser(s.u); if (!u || u.blocked) return send(res, 403, { error: 'member' });
  const invs = await myInvites(u); send(res, 200, { left: slotsLeft(u, invs), limit: u.inviteLimit ?? 3, invites: invs.map(invView).reverse() });
};
R['invite/create'] = async (req, res) => {
  const s = await me(req); if (!s) return send(res, 401, { error: 'login' });
  const b = await body(req); if (b.website) return send(res, 200, { ok: true });
  const first = String(b.first || '').trim().slice(0, 60), last = String(b.last || '').trim().slice(0, 60), email = String(b.email || '').trim().toLowerCase();
  if (!first || !last) return send(res, 400, { error: 'Укажите имя и фамилию' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return send(res, 400, { error: 'Проверьте адрес почты' });
  if (!(await rateLimit('invc:' + s.u, 10, 1440))) return send(res, 429, { error: 'Слишком много приглашений за сутки' });
  const u = await loadUser(s.u); if (!u || u.blocked) return send(res, 403, { error: 'member' });
  if (email === u.email) return send(res, 400, { error: 'Это ваш собственный адрес' });
  if (await loadUser(uidOf(email))) return send(res, 409, { error: 'Этот человек уже участник Orbiq Journal' });
  const invs = await myInvites(u); if (slotsLeft(u, invs) < 1) return send(res, 409, { error: 'Свободных приглашений нет' });
  const ix = `invidx/${sha(email).slice(0, 32)}.json`; const prev = await sget(ix);
  if (prev) { const p = await sget(`inv/${prev.id}.json`); if (p && invView(p).status === 'created') return send(res, 409, { error: 'У этого адреса уже есть действующее приглашение' }); }
  const tok = crypto.randomBytes(32).toString('base64url'); const id = invHash(tok);
  const target = String(b.target || '').startsWith('/journal/') ? String(b.target).slice(0, 200) : '';
  const inv = { id, inviter: s.u, inviterName: [u.first, u.last].filter(Boolean).join(' ') || '', showName: !!b.showName, first, last, email, msg: String(b.msg || '').slice(0, 600), target, targetTitle: String(b.targetTitle || '').slice(0, 200), s: String(b.s || '').slice(0, 12), status: 'created', created: new Date().toISOString(), expires: new Date(Date.now() + INV_DAYS * 864e5).toISOString() };
  await sput(`inv/${id}.json`, inv); await sput(ix, { id });
  await update(`users/${s.u}.json`, (cur) => ({ doc: { ...cur, invites: [...(cur.invites || []), id] } }));
  await logEvent('invite_created', '', b.ch || '', ''); await auditLog(s.u, 'invite_create', { id });
  send(res, 200, { ok: true, link: inviteLink(req, tok), left: slotsLeft(u, [...invs, inv]) });
};
async function myInvite(req, id) { const s = await me(req); if (!s) return { err: 401 }; const u = await loadUser(s.u); if (!u || !(u.invites || []).includes(id)) return { err: 404 }; return { s, u }; }
R['invite/revoke'] = async (req, res) => {
  const b = await body(req); const m = await myInvite(req, b.id); if (m.err) return send(res, m.err, { error: 'not_found' });
  const out = await update(`inv/${b.id}.json`, (inv) => (inv && inv.status === 'created') ? { doc: { ...inv, status: 'revoked', revoked_at: new Date().toISOString() } } : { err: 409 });
  if (out.err) return send(res, 409, { error: 'Отозвать можно только непринятое приглашение' });
  await sdel(`invidx/${sha(out.doc.email).slice(0, 32)}.json`); await logEvent('invite_revoked'); send(res, 200, { ok: true });
};
R['invite/renew'] = async (req, res) => { // повторная отправка: новый токен и новый срок, старая ссылка перестает работать
  const b = await body(req); const m = await myInvite(req, b.id); if (m.err) return send(res, m.err, { error: 'not_found' });
  const old = await sget(`inv/${b.id}.json`); if (!old || !['created', 'expired'].includes(invView(old).status)) return send(res, 409, { error: 'Продлить можно только непринятое приглашение' });
  if (invView(old).status === 'expired' && slotsLeft(m.u, await myInvites(m.u)) < 1) return send(res, 409, { error: 'Свободных приглашений нет' });
  const tok = crypto.randomBytes(32).toString('base64url'); const id = invHash(tok);
  await sput(`inv/${id}.json`, { ...old, id, status: 'created', created: old.created, renewed: new Date().toISOString(), expires: new Date(Date.now() + INV_DAYS * 864e5).toISOString() });
  await sput(`inv/${old.id}.json`, { ...old, status: 'revoked', replacedBy: id }); await sput(`invidx/${sha(old.email).slice(0, 32)}.json`, { id });
  await update(`users/${m.s.u}.json`, (cur) => ({ doc: { ...cur, invites: [...(cur.invites || []).filter(x => x !== old.id), id] } }));
  send(res, 200, { ok: true, link: inviteLink(req, tok) });
};
R['invite/info'] = async (req, res) => { // публично по токену: без email и персональных данных приглашенного
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0];
  if (!(await rateLimit('invi:' + ip, 40, 60))) return send(res, 429, { error: 'Слишком много попыток' });
  const tok = new URL(req.url, 'http://x').searchParams.get('t') || ''; if (!/^[A-Za-z0-9_-]{40,50}$/.test(tok)) return send(res, 404, { error: 'invalid' });
  const inv = await sget(`inv/${invHash(tok)}.json`); if (!inv) return send(res, 404, { error: 'invalid' });
  const v = invView(inv); if (v.status !== 'created') return send(res, 410, { error: v.status });
  send(res, 200, { first: inv.first, inviter: inv.showName ? inv.inviterName : '', msg: inv.msg, target: inv.targetTitle || '' });
};
R['invite/accept'] = async (req, res) => { // письмо со ссылкой подтверждения на адрес из приглашения
  const b = await body(req); const tok = String(b.t || ''); const ip = (req.headers['x-forwarded-for'] || '').split(',')[0];
  if (!(await rateLimit('inva:' + ip, 10, 60))) return send(res, 429, { error: 'Слишком много попыток' });
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(tok)) return send(res, 404, { error: 'invalid' });
  const inv = await sget(`inv/${invHash(tok)}.json`); if (!inv || invView(inv).status !== 'created') return send(res, 410, { error: 'Приглашение недействительно' });
  const vt = sign({ e: inv.email, r: inv.target || '/journal/', inv: inv.id, j: rid(12), exp: Date.now() + LINK_TTL });
  const masked = inv.email.replace(/^(.).*(@.*)$/, '$1•••$2');
  return deliverLogin(req, res, inv.email, vt, { sentTo: masked });
};

R['logout'] = async (req, res) => { setCookie(res, 'oj', '', 0); send(res, 200, { ok: true }); };

R['progress'] = async (req, res) => { // читатель отмечает только «Я здесь был»; знаки вручает редакция (admin/award)
  const s = await me(req); if (!s) return send(res, 401, { error: 'login' });
  const b = await body(req); const id = String(b.id || ''); const type = String(b.type || '');
  if (!['explore', 'unexplore'].includes(type)) return send(res, 400, { error: 'bad_event' });
  if (!content().articles[id]) return send(res, 404, { error: 'not_found' });
  const st = await statusMap(); const available = isLive(id, st);
  if (type === 'explore' && !available) return send(res, 404, { error: 'not_found' });
  let out;
  try {
    out = await update(`users/${s.u}.json`, (u) => { if (!u) return { err: 401 }; const r = apply(u, { type, id, now: new Date().toISOString() }, ACH, available); if (r.error) return { err: r.error === 'blocked' ? 403 : 409, msg: r.error }; return { doc: r.user, r }; });
  } catch (e) { if (e instanceof NoStore) return send(res, 503, { error: 'Хранилище не подключено' }); throw e; }
  if (out.err) return send(res, out.err, { error: out.msg || 'login' });
  await logEvent(type, id); for (const c of out.r.changed) await logEvent(c.to > c.from ? 'level' + c.to : 'leveldown' + c.to, c.id);
  send(res, 200, { ok: true, state: out.r.state, levels: out.r.levels, changed: out.r.changed });
};

R['letter'] = async (req, res) => { // согласие на The Orbiq Letter
  const s = await me(req); if (!s) return send(res, 401, { error: 'login' });
  const b = await body(req); const out = await update(`users/${s.u}.json`, (u) => u ? { doc: { ...u, letter: !!b.on } } : { err: 401 });
  if (out.err) return send(res, 401, { error: 'login' }); await logEvent(b.on ? 'letter_on' : 'letter_off'); send(res, 200, { ok: true, letter: !!b.on });
};

R['unsub'] = async (req, res) => {
  const t = unsign(new URL(req.url, 'http://x').searchParams.get('t') || '');
  if (t && t.u) { const u = await loadUser(t.u); if (u) { u.letter = false; await sput(`users/${t.u}.json`, u); await logEvent('letter_off'); } }
  res.statusCode = 302; res.setHeader('Location', '/journal/profile/?unsub=1'); res.end();
};

R['event'] = async (req, res) => {
  const b = await body(req);
  const ok = ['share_intent', 'share_click', 'copy_ok', 'landing', 'landing_bad', 'gate_view', 'gate_submit', 'badge_share', 'ach_open', 'org_open', 'next_open', 'tg_click', 'mail_click', 'preview_view', 'open'];
  if (ok.includes(b.type)) await logEvent(b.type, b.a, b.ch, b.s).catch(() => {});
  send(res, 200, { ok: true });
};

R['discovery'] = async (req, res) => {
  const s = await me(req); if (!s) return send(res, 401, { error: 'login' });
  const b = await body(req); if (b.website) return send(res, 200, { ok: true });
  const f = (k, n) => String(b[k] || '').trim().slice(0, n);
  const rec = { id: Date.now() + '-' + rid(5), uid: s.u, title: f('title', 160), desc: f('desc', 1500), why: f('why', 1000), link: f('link', 500), note: f('note', 1000), credit: !!b.credit, status: 'new', at: new Date().toISOString() };
  if (!rec.title || !rec.desc) return send(res, 400, { error: 'Заполните название и описание' });
  try { if (!(await rateLimit('rec:' + s.u, 5, 1440))) return send(res, 429, { error: 'Не больше пяти рекомендаций в сутки' }); }
  catch (e) { if (e instanceof NoStore) return send(res, 503, { error: 'Хранилище не подключено' }); throw e; }
  await sput(`rec/${rec.id}.json`, rec); await logEvent('discovery'); send(res, 200, { ok: true });
};

// Асимметрия: рекомендации участников (видят все, присылают участники, публикует редакция)
const TIP_CATS = ['food', 'doctor', 'asset', 'service'];
R['tip/create'] = async (req, res) => {
  const s = await me(req); if (!s) return send(res, 401, { error: 'login' });
  const b = await body(req); if (b.website) return send(res, 200, { ok: true });
  const u = await loadUser(s.u); if (!u || u.blocked) return send(res, 403, { error: 'member' });
  const f = (k, n) => String(b[k] || '').trim().slice(0, n);
  if (!TIP_CATS.includes(b.cat)) return send(res, 400, { error: 'Выберите тип рекомендации' });
  const tip = { id: Date.now() + '-' + rid(5), kind: 'tip', uid: s.u, cat: b.cat, title: f('title', 140), city: f('city', 80), why: f('why', 1200), link: f('link', 500), price: f('price', 80), until: f('until', 20), credit: !!b.credit, author: b.credit ? [u.first, u.last].filter(Boolean).join(' ') : '', status: 'new', at: new Date().toISOString() };
  if (!tip.title || !tip.why) return send(res, 400, { error: 'Заполните название и почему это стоит своих денег' });
  if (!(await rateLimit('tip:' + s.u, 5, 1440))) return send(res, 429, { error: 'Не больше пяти рекомендаций в сутки' });
  await sput(`rec/${tip.id}.json`, tip); await logEvent('tip_created', '', tip.cat); send(res, 200, { ok: true });
};
R['tips'] = async (req, res) => { // опубликованные рекомендации открыты всем
  const bl = await slist('rec/', 2000); const out = [];
  for (const x of bl) { const r = await sget(x.pathname); if (r && r.kind === 'tip' && r.status === 'published' && !(r.until && r.until < today())) out.push({ id: r.id, cat: r.cat, title: r.title, city: r.city, why: r.why, link: r.link, price: r.price, until: r.until, author: r.credit ? r.author : '', note: r.reason || '' }); }
  out.sort((a, b) => (a.id < b.id ? 1 : -1)); send(res, 200, { tips: out });
};
R['og'] = async (req, res) => { // обложка для мессенджеров: ручная замена или автоматическая
  const q = new URL(req.url, 'http://x').searchParams; const id = (q.get('id') || '').replace(/[^a-z0-9-]/g, '');
  const ov = (await sget('content/og.json').catch(() => null)) || {};
  res.statusCode = 302; res.setHeader('Cache-Control', 'public, max-age=300'); res.setHeader('Location', ov[id] || `/og/a/${id}.jpg`); res.end();
};

// ----- админ -----
R['admin/login'] = async (req, res) => {
  const b = await body(req); const k = String(b.key || '');
  const good = ENV.ADMIN_KEY || ''; if (!good || k.length !== good.length || !crypto.timingSafeEqual(Buffer.from(k), Buffer.from(good))) { await new Promise(r => setTimeout(r, 800)); return send(res, 403, { error: 'Неверный ключ' }); }
  setCookie(res, 'oja', sign({ adm: 1, exp: Date.now() + 7 * 864e5 }), 7 * 86400); send(res, 200, { ok: true });
};
R['admin/state'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const c = content(); const st = await statusMap().catch(() => ({})); const sc = (await sget('content/scores.json').catch(() => null)) || {};
  const arts = Object.entries(c.articles).map(([id, a]) => ({ id, title: a.title, dir: a.dir, status: (st[id] || {}).status || a.status || 'published', at: (st[id] || {}).at || '', score: sc[id] || null }));
  send(res, 200, { store: STORE_OK, mail: !!ENV.RESEND_API_KEY, mailMode: ENV.EMAIL_MODE || '', tg: !!(ENV.TELEGRAM_BOT_TOKEN && ENV.TELEGRAM_CHANNEL_ID), tz: TZ, articles: arts });
};
R['admin/status'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const b = await body(req); const st = await statusMap(); const sc = (await sget('content/scores.json').catch(() => null)) || {};
  if (!['draft', 'scheduled', 'published', 'archived'].includes(b.status)) return send(res, 400, { error: 'status' });
  const from = statusOf(b.id, st); if (from !== b.status && !artTransition(from, b.status)) return send(res, 409, { error: `Переход ${from} → ${b.status} не разрешен` });
  if (b.status === 'scheduled' && !(b.at && Date.parse(b.at))) return send(res, 400, { error: 'Укажите дату и время публикации' });
  if (b.status === 'published' || b.status === 'scheduled') { const s = sc[b.id]; if (!s) return send(res, 409, { error: 'Сначала оцените материал по пяти критериям' }); const low = ['surprise', 'rarity', 'share', 'access', 'trust'].filter(k => (s[k] ?? 0) < 4); if (low.length) return send(res, 409, { error: 'Публикация закрыта: ниже 4 баллов — ' + low.join(', ') }); }
  await update('content/status.json', (cur) => { const m = cur || {}; m[b.id] = { status: b.status, at: b.status === 'scheduled' ? new Date(b.at).toISOString() : '' }; return { doc: m }; }); await auditLog('editor', 'status', { id: b.id, from, to: b.status, at: b.at || '' }); send(res, 200, { ok: true });
};
R['admin/score'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const b = await body(req); const sc = (await sget('content/scores.json').catch(() => null)) || {};
  const v = {}; for (const k of ['surprise', 'rarity', 'share', 'access', 'trust']) v[k] = Math.max(0, Math.min(5, parseInt(b[k] ?? 0, 10) || 0));
  v.note = String(b.note || '').slice(0, 2000); v.at = new Date().toISOString(); sc[b.id] = v; await sput('content/scores.json', sc); send(res, 200, { ok: true, score: v });
};
R['admin/og'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const b = await body(req); const ov = (await sget('content/og.json').catch(() => null)) || {};
  if (b.url) ov[b.id] = String(b.url).slice(0, 500); else delete ov[b.id]; await sput('content/og.json', ov); send(res, 200, { ok: true });
};
R['admin/recs'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  if (req.method === 'POST') {
    const b = await body(req); let from = '';
    const out = await update(`rec/${b.id}.json`, (r) => { if (!r) return { err: 404 }; from = r.status; if (!recTransition(r.status, b.status)) return { err: 409 }; return { doc: { ...r, status: b.status, reason: String(b.reason || r.reason || '').slice(0, 1000), [b.status + '_at']: new Date().toISOString() } }; });
    if (out.err) return send(res, out.err, { error: out.err === 409 ? `Переход ${from} → ${b.status} не разрешен` : 'not_found' });
    if (b.status === 'published') { await update(`users/${out.doc.uid}.json`, (u) => (u && !u.contributor) ? { doc: { ...u, contributor: true, contributor_at: new Date().toISOString() } } : { noop: 1 }); }
    await auditLog('editor', 'rec', { id: b.id, from, to: b.status });
    return send(res, 200, { ok: true });
  }
  const bl = await slist('rec/', 500); const recs = [];
  for (const x of bl) { const r = await sget(x.pathname); if (r) { delete r.uid; recs.push(r); } }
  recs.sort((a, b) => (a.at < b.at ? 1 : -1)); send(res, 200, { recs });
};
R['admin/award'] = async (req, res) => { // редакция вручает открытие, организованное вместе с Orbiq, или снимает его
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const b = await body(req); const email = String(b.email || '').trim().toLowerCase(); const id = String(b.id || ''); const type = b.action === 'undo' ? 'undo' : 'complete';
  if (!content().articles[id]) return send(res, 404, { error: 'Статья не найдена' });
  const st = await statusMap(); const available = isLive(id, st);
  const out = await update(`users/${uidOf(email)}.json`, (u) => { if (!u) return { err: 404, msg: 'Участник не найден' }; const r = apply(u, { type, id, now: new Date().toISOString() }, ACH, available); if (r.error) return { err: 409, msg: r.error === 'unavailable' ? 'Статья снята с публикации' : r.error }; return { doc: r.user, r }; });
  if (out.err) return send(res, out.err, { error: out.msg });
  await auditLog('editor', 'award_' + type, { uid: uidOf(email), id }); for (const c of out.r.changed) await logEvent(c.to > c.from ? 'level' + c.to : 'leveldown' + c.to, c.id);
  send(res, 200, { ok: true, state: out.r.state, changed: out.r.changed });
};
R['admin/block'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const b = await body(req); const email = String(b.email || '').trim().toLowerCase(); const uid = uidOf(email);
  const out = await update(`users/${uid}.json`, (u) => u ? { doc: { ...u, blocked: !!b.block } } : { err: 404 });
  if (out.err) return send(res, 404, { error: 'Пользователь не найден' }); await auditLog('editor', b.block ? 'block' : 'unblock', { uid }); send(res, 200, { ok: true });
};
R['admin/grant'] = async (req, res) => { // административное предоставление доступа
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const b = await body(req); const email = String(b.email || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return send(res, 400, { error: 'Проверьте адрес' });
  const uid = uidOf(email); const out = await update(`users/${uid}.json`, (u) => u ? { noop: 1 } : { doc: { id: uid, email, first: String(b.first || '').slice(0, 60), last: String(b.last || '').slice(0, 60), created: new Date().toISOString(), grantedBy: 'admin', letter: false, ops: {}, pins: {}, contributor: false, blocked: false, inviteLimit: 3 } });
  await auditLog('editor', 'grant', { uid }); await logEvent('member_granted');
  if (b.sendLogin) { const tok = sign({ e: email, r: '/journal/', j: rid(12), exp: Date.now() + LINK_TTL }); return deliverLogin(req, res, email, tok, { existed: !!out.noop }); }
  send(res, 200, { ok: true, existed: !!out.noop });
};
R['admin/limit'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const b = await body(req); const uid = uidOf(String(b.email || '').trim().toLowerCase()); const n = Math.max(0, Math.min(50, parseInt(b.limit, 10) || 0));
  const out = await update(`users/${uid}.json`, (u) => u ? { doc: { ...u, inviteLimit: n } } : { err: 404 });
  if (out.err) return send(res, 404, { error: 'Участник не найден' }); await auditLog('editor', 'limit', { uid, n }); send(res, 200, { ok: true });
};
R['admin/stats'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const bl = await slist('events/', 20000); const by = {}, ch = {};
  for (const x of bl) { const f = x.pathname.split('/').pop().split('_'); const t = f[1]; by[t] = (by[t] || 0) + 1; if (t === 'share_click') ch[f[3]] = (ch[f[3]] || 0) + 1; }
  const ul = await slist('users/', 5000); const dist = { 1: 0, 2: 0, 3: 0 }; let withDone = 0, withExplore = 0, letter = 0, viaRef = 0, viaInvite = 0, active30 = 0;
  for (const x of ul) { const u = await sget(x.pathname); if (!u) continue; const lv = levels(u); for (const v of Object.values(lv)) if (v) dist[v]++; const ops = Object.values(u.ops || {}); if (ops.some(o => o.completed_at)) withDone++; if (ops.some(o => o.explored_at)) withExplore++; if (u.letter) letter++; if (u.ref) viaRef++; if (u.invitedBy) viaInvite++; if (u.seen && Date.now() - Date.parse(u.seen) < 30 * 864e5) active30++; }
  const il = await slist('inv/', 5000); const inv = { created: 0, accepted: 0, revoked: 0, expired: 0, hours: [] };
  for (const x of il) { const v = await sget(x.pathname); if (!v || v.replacedBy) continue; const st = invView(v).status; inv[st] = (inv[st] || 0) + 1; if (st === 'accepted') inv.hours.push((Date.parse(v.accepted_at) - Date.parse(v.created)) / 3600000); }
  inv.medianHours = inv.hours.length ? inv.hours.sort((a, b) => a - b)[Math.floor(inv.hours.length / 2)].toFixed(1) : null; delete inv.hours;
  send(res, 200, { events: by, channels: ch, users: ul.length, withDone, withExplore, letter, viaRef, viaInvite, active30, badges: dist, invites: inv });
};
function letterHtml(L, uid) {
  const c = content(); const host = SITE;
  const card = (id, big) => { const a = c.articles[id]; if (!a) return ''; const url = `${host}/journal/a/${id}/?utm=letter`;
    return `<tr><td style="padding:0 0 28px"><a href="${url}"><img src="${host}${a.img}" width="560" style="width:100%;max-width:560px;display:block;border:0"></a><p style="font:12px monospace;letter-spacing:.15em;text-transform:uppercase;color:#888;margin:14px 0 6px">${esc(a.geo)}</p><h2 style="font:600 ${big ? 26 : 21}px Georgia,serif;margin:0 0 8px"><a href="${url}" style="color:#111;text-decoration:none">${esc(a.title)}</a></h2><p style="font:16px/1.5 Georgia,serif;color:#333;margin:0">${esc(a.hook)}</p></td></tr>`; };
  const unsub = uid ? `${host}/api/j/?r=unsub&t=${encodeURIComponent(sign({ u: uid }))}` : '#';
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec"><tr><td align="center" style="padding:32px 16px"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;padding:32px"><tr><td style="padding-bottom:24px"><p style="font:600 15px Georgia,serif;letter-spacing:.35em">ORBIQ</p><p style="font:12px monospace;letter-spacing:.15em;color:#888">THE ORBIQ LETTER · ${esc(L.date || '')}</p>${L.intro ? `<p style="font:17px/1.55 Georgia,serif">${esc(L.intro)}</p>` : ''}</td></tr>${(L.main || []).map(i => card(i, true)).join('')}<tr><td style="padding:0 0 10px;font:12px monospace;letter-spacing:.15em;color:#888">РЕКОМЕНДАЦИЯ РЕДАКЦИИ</td></tr>${L.extra ? card(L.extra, false) : ''}<tr><td style="font:12px Georgia,serif;color:#999;padding-top:12px">Письмо можно переслать другу: ссылки открывают превью без регистрации. <a href="${unsub}" style="color:#999">Отписаться</a></td></tr></table></td></tr></table>`;
}
R['admin/letter'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const b = await body(req); const id = String(b.id || today()).replace(/[^0-9a-z-]/gi, '');
  const L = { id, date: b.date || today(), subject: String(b.subject || 'The Orbiq Letter').slice(0, 140), intro: String(b.intro || '').slice(0, 800), main: (b.main || []).slice(0, 2), extra: b.extra || '' };
  if (b.action === 'preview') return send(res, 200, { html: letterHtml(L, '') });
  const p = `letter/${id}.json`;
  if (b.action === 'save') { const out = await update(p, (cur) => { if (cur && !['draft', 'ready', 'cancelled'].includes(cur.status)) return { err: 409 }; return { doc: { ...(cur || {}), ...L, status: 'draft', sentTo: (cur && cur.sentTo) || [] } }; }); return out.err ? send(res, 409, { error: 'Письмо уже в отправке или отправлено' }) : send(res, 200, { ok: true }); }
  if (['ready', 'scheduled', 'cancelled', 'draft'].includes(b.action)) {
    let from = ''; const out = await update(p, (cur) => { if (!cur) return { err: 404 }; from = cur.status; if (!msgTransition(cur.status, b.action)) return { err: 409 }; return { doc: { ...cur, status: b.action, at: b.action === 'scheduled' ? String(b.at || '') : cur.at } }; });
    if (out.err) return send(res, out.err, { error: `Переход ${from} → ${b.action} не разрешен` }); await auditLog('editor', 'letter', { id, from, to: b.action }); return send(res, 200, { ok: true });
  }
  if (b.action === 'send') {
    if (!ENV.RESEND_API_KEY) return send(res, 503, { error: 'Отправка писем не подключена: нужен RESEND_API_KEY' });
    if (b.confirm !== 'ОТПРАВИТЬ') return send(res, 400, { error: 'Нужно подтверждение' });
    const st = await update(p, (cur) => (cur && msgTransition(cur.status, 'sending')) ? { doc: { ...cur, status: 'sending' } } : { err: 409, cur });
    if (st.err) return send(res, 409, { error: 'Отправка возможна из статусов ready, scheduled или failed' });
    const doc = st.doc; const sent = new Set(doc.sentTo || []); const fails = [];
    const ul = await slist('users/', 5000);
    for (const x of ul) { const u = await sget(x.pathname); if (!u || !u.letter || u.blocked || sent.has(u.id)) continue; const r = await mail(u.email, doc.subject, letterHtml(doc, u.id)); if (r.ok) sent.add(u.id); else fails.push(r.reason); }
    const final = fails.length ? 'failed' : 'sent';
    await update(p, (cur) => ({ doc: { ...cur, status: final, sentTo: [...sent], failures: fails.slice(0, 50), finished: new Date().toISOString() } }));
    await logEvent('letter_' + final, '', '', String(sent.size)); await auditLog('editor', 'letter_send', { id, final, sent: sent.size, failed: fails.length });
    return send(res, final === 'sent' ? 200 : 502, { ok: final === 'sent', sent: sent.size, failed: fails.length, reasons: [...new Set(fails)] });
  }
  const bl = await slist('letter/', 200); const out = []; for (const x of bl) { const d = await sget(x.pathname); if (d) { d.recipients = (d.sentTo || []).length; delete d.sentTo; out.push(d); } }
  const subs = (await slist('users/', 5000)).length; send(res, 200, { letters: out, users: subs });
};
// Telegram: график и посты; без токена бота отправка честно недоступна
async function tgSend(text) {
  if (!(ENV.TELEGRAM_BOT_TOKEN && ENV.TELEGRAM_CHANNEL_ID)) return { ok: false, error: 'Telegram не подключен: нужны TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_ID' };
  const r = await fetch(`https://api.telegram.org/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: ENV.TELEGRAM_CHANNEL_ID, text, disable_web_page_preview: false }) });
  const j = await r.json().catch(() => ({})); return { ok: !!j.ok, message_id: j.ok ? j.result.message_id : null, error: j.ok ? '' : (j.description || 'telegram_error') };
}
R['admin/tg'] = async (req, res) => {
  if (!isAdmin(req)) return send(res, 403, { error: 'admin' });
  const b = req.method === 'POST' ? await body(req) : {};
  const cfg = (await sget('settings/telegram.json').catch(() => null)) || { days: { 2: 'Новое открытие', 4: 'Редкая возможность', 0: 'The Orbiq Letter' }, time: '11:00' };
  if (b.action === 'settings') { await sput('settings/telegram.json', { days: b.days || cfg.days, time: b.time || cfg.time }); await auditLog('editor', 'tg_settings', b); return send(res, 200, { ok: true }); }
  if (b.action === 'draft') { const a = content().articles[b.article]; if (!a) return send(res, 404, {}); return send(res, 200, { text: `${a.title}\n\n${a.fact || a.hook}\n\n${a.hook}\n\n${SITE}/journal/a/${b.article}/?utm=tg` }); }
  if (b.action === 'save') { const id = b.id || (Date.now() + '-' + rid(4)); const out = await update(`tg/${id}.json`, (cur) => { if (cur && !['draft', 'ready', 'cancelled'].includes(cur.status)) return { err: 409 }; return { doc: { ...(cur || {}), id, article: b.article, text: String(b.text || '').slice(0, 3500), date: b.date || '', status: 'draft' } }; }); return out.err ? send(res, 409, { error: 'Пост уже отправляется или отправлен' }) : send(res, 200, { ok: true, id }); }
  if (['ready', 'scheduled', 'cancelled', 'draft'].includes(b.action)) { let from = ''; const out = await update(`tg/${b.id}.json`, (cur) => { if (!cur) return { err: 404 }; from = cur.status; if (!msgTransition(cur.status, b.action)) return { err: 409 }; if (b.action === 'scheduled' && !cur.date) return { err: 400 }; return { doc: { ...cur, status: b.action } }; }); if (out.err) return send(res, out.err, { error: out.err === 400 ? 'Укажите дату публикации' : `Переход ${from} → ${b.action} не разрешен` }); return send(res, 200, { ok: true }); }
  if (b.action === 'send') { const r = await tgDeliver(`tg/${b.id}.json`); return send(res, r.ok ? 200 : 503, r); }
  const bl = await slist('tg/', 300); const posts = []; for (const x of bl) posts.push(await sget(x.pathname));
  send(res, 200, { cfg, posts: posts.filter(Boolean), connected: !!(ENV.TELEGRAM_BOT_TOKEN && ENV.TELEGRAM_CHANNEL_ID) });
};
async function tgDeliver(p) {
  if (!(ENV.TELEGRAM_BOT_TOKEN && ENV.TELEGRAM_CHANNEL_ID)) return { ok: false, error: 'Telegram не подключен: нужны TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_ID' };
  const st = await update(p, (cur) => (cur && msgTransition(cur.status, 'sending') && !cur.tg_message_id) ? { doc: { ...cur, status: 'sending' } } : { err: 409 });
  if (st.err) return { ok: false, error: 'Пост не готов к отправке или уже отправлен' };
  const r = await tgSend(st.doc.text);
  await update(p, (cur) => ({ doc: { ...cur, status: r.ok ? 'sent' : 'failed', tg_message_id: r.message_id || null, error: r.ok ? '' : r.error, finished: new Date().toISOString() } }));
  return r;
}
R['cron'] = async (req, res) => { // ежедневно: отправить посты со статусом scheduled и наступившей датой
  if (ENV.CRON_SECRET && req.headers.authorization !== `Bearer ${ENV.CRON_SECRET}`) return send(res, 403, {});
  if (!STORE_OK) return send(res, 200, { skipped: 'no store' });
  const bl = await slist('tg/', 300); let n = 0;
  for (const x of bl) { const p = await sget(x.pathname); if (p && p.status === 'scheduled' && p.date && p.date <= today()) { const r = await tgDeliver(x.pathname); if (r.ok) n++; } }
  send(res, 200, { sent: n });
};

export default async function handler(req, res) {
  const r = new URL(req.url, 'http://x').searchParams.get('r') || '';
  const fn = R[r]; if (!fn) return send(res, 404, { error: 'route' });
  try { await fn(req, res); }
  catch (e) { if (e instanceof NoStore) return send(res, 503, { error: 'Хранилище не подключено' }); console.error(e); send(res, 500, { error: 'server' }); }
}
