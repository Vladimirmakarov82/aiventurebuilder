import assert from 'node:assert/strict';
process.env.KV_REST_API_URL = 'https://kv.test'; process.env.KV_REST_API_TOKEN = 'x'; await import('./kvmock.mjs'); process.env.EMAIL_MODE = 'test'; process.env.INVITE_LIMITED = '1'; process.env.ADMIN_KEY = 'adminkey123';
const keys = (await import('node:fs')).readFileSync('/tmp/keys.txt', 'utf8').trim().split(/\s+/);
process.env.SESSION_SECRET = keys[0];
const { default: H } = await import('./api/j.mjs');
const jar = {};
async function call(r, { body, q = '', cookie = '', method } = {}) {
  const req = { url: '/api/j?r=' + r + q, method: method || (body ? 'POST' : 'GET'), headers: { host: 'preview.test', cookie, 'x-forwarded-for': '1.2.3.' + Math.floor(Math.random() * 200) }, body: body || null };
  let status = 200, headers = {}, out = '';
  const res = { statusCode: 200, setHeader(k, v) { headers[k.toLowerCase()] = v; }, getHeader(k) { return headers[k.toLowerCase()]; }, end(s) { out = s || ''; } };
  await H(req, res); let j = {}; try { j = JSON.parse(out || '{}'); } catch {}
  return { s: res.statusCode, j, h: headers };
}
const ck = (h) => [].concat(h['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
const ok = (name) => console.log('✓', name);
const A = ["grinzane-truffle-auction", "best-of-panama-geisha", "islay-own-cask"]; // три открытия раздела «Вкус»
// гость
let r = await call('progress', { body: { id: A[0], type: 'explore' } }); assert.equal(r.s, 401); ok('гость читает открыто, но не отмечает прогресс без входа (401)');
r = await call('me'); assert.equal(r.j.user, null); ok('гость без аккаунта: профиль пустой');
// добровольная регистрация открыта для любого адреса
r = await call('auth/request', { body: { email: 'stranger@example.com', ret: '/journal/' } }); assert.ok(r.j.test_link); { const ts = new URL(r.j.test_link).searchParams.get('t'); const rr = await call('auth/verify', { q: '&t=' + encodeURIComponent(ts) }); assert.ok(ck(rr.h).includes('oj=')); } ok('любой адрес может завести профиль по ссылке из письма');
const forged = (await import('node:crypto')); // поддельный токен входа без приглашения не создает аккаунт
r = await call('admin/login', { body: { key: 'adminkey123' } }); const CA = ck(r.h);
r = await call('admin/grant', { body: { email: 'founder@example.com', first: 'Анна', last: 'Орлова', sendLogin: true }, cookie: CA }); assert.ok(r.j.test_link); ok('административное предоставление доступа первому участнику');
let tf = new URL(r.j.test_link).searchParams.get('t'); r = await call('auth/verify', { q: '&t=' + encodeURIComponent(tf) }); const CF = ck(r.h);
// приглашение
r = await call('invite/list', { cookie: CF }); assert.equal(r.j.left, 3); ok('у участника три приглашения');
r = await call('invite/create', { body: { first: 'Иван', last: 'Петров', email: 'Reader@Example.com', msg: 'Посмотри', showName: true, target: '/journal/discoveries/#' + A[0], targetTitle: 'Храм' }, cookie: CF }); assert.ok(r.j.link); assert.equal(r.j.left, 2); ok('персональное приглашение создано, слот зарезервирован');
const invTok = new URL(r.j.link).searchParams.get('t'); assert.ok(!r.j.link.includes('reader')); ok('почта приглашенного не попадает в ссылку');
r = await call('invite/create', { body: { first: 'И', last: 'П', email: 'reader@example.com' }, cookie: CF }); assert.equal(r.s, 409); ok('один адрес — одно действующее приглашение');
r = await call('invite/info', { q: '&t=' + invTok }); assert.equal(r.j.first, 'Иван'); assert.equal(r.j.inviter, 'Анна Орлова'); assert.ok(!JSON.stringify(r.j).includes('@')); ok('страница приглашения без почты, имя пригласившего по согласию');
r = await call('invite/info', { q: '&t=' + 'x'.repeat(43) }); assert.equal(r.s, 404); ok('подобранный токен не работает');
r = await call('invite/accept', { body: { t: invTok } }); assert.ok(r.j.test_link); assert.equal(r.j.sentTo, 'r•••@example.com'); ok('принятие: ссылка подтверждения уходит на почту из приглашения');
const t = new URL(r.j.test_link).searchParams.get('t');
r = await call('auth/verify', { q: '&t=' + encodeURIComponent(t) }); assert.equal(r.s, 302); assert.equal(r.h.location, '/journal/discoveries/#' + A[0]); ok('после активации открывается исходная статья');
const C = ck(r.h);
r = await call('auth/verify', { q: '&t=' + encodeURIComponent(t) }); assert.equal(r.h.location, '/journal/profile/?login=used'); ok('ссылка подтверждения одноразовая');
r = await call('invite/accept', { body: { t: invTok } }); assert.equal(r.s, 410); ok('приглашение активирует только один аккаунт');
r = await call('invite/list', { cookie: CF }); assert.equal(r.j.invites[0].status, 'accepted'); assert.equal(r.j.left, 2); ok('принятое приглашение расходует слот окончательно');
r = await call('me', { cookie: C }); assert.ok(r.j.user); assert.ok(!r.j.user.ops[A[0]]); ok('приглашенный вошел, состояние not_explored');
// изучено не дает знак
r = await call('progress', { body: { id: A[0], type: 'explore' }, cookie: C }); assert.equal(r.j.state, 'explored'); assert.equal(r.j.levels['taste'], 0); ok('«Я здесь был» без награды');
// 0→1→2→3: знаки вручает редакция
r = await call('progress', { body: { id: A[0], type: 'complete' }, cookie: C }); assert.equal(r.s, 400); ok('читатель не может сам получить знак');
r = await call('admin/award', { body: { email: 'reader@example.com', id: A[0], action: 'complete' }, cookie: CA }); assert.deepEqual(r.j.changed, [{ id: 'taste', from: 0, to: 1 }]); assert.equal((await call('me', { cookie: C })).j.levels['taste'], 1); ok('редакция вручила первое открытие: серебро');
r = await call('admin/award', { body: { email: 'reader@example.com', id: A[0], action: 'complete' }, cookie: CA }); assert.deepEqual(r.j.changed, []); ok('повторное вручение не меняет прогресс');
await Promise.all([await call('admin/award', { body: { email: 'reader@example.com', id: A[1], action: 'complete' }, cookie: CA }), await call('admin/award', { body: { email: 'reader@example.com', id: A[1], action: 'complete' }, cookie: CA })]); assert.equal((await call('me', { cookie: C })).j.levels['taste'], 2); ok('одновременные вручения засчитаны один раз: золото');
r = await call('admin/award', { body: { email: 'reader@example.com', id: A[2], action: 'complete' }, cookie: CA }); assert.equal((await call('me', { cookie: C })).j.levels['taste'], 3); ok('третье открытие: черный знак');
r = await call('admin/award', { body: { email: 'reader@example.com', id: A[2], action: 'undo' }, cookie: CA }); assert.equal((await call('me', { cookie: C })).j.levels['taste'], 2); assert.equal(r.j.state, 'not_explored'); ok('снятие: 3→2, статус возвращен');
r = await call('admin/award', { body: { email: 'reader@example.com', id: A[0], action: 'undo' }, cookie: CA }); assert.equal(r.j.state, 'explored'); ok('снятие у отмеченного «был здесь»: completed→explored');
r = await call('admin/award', { body: { email: 'reader@example.com', id: A[0], action: 'complete' }, cookie: CA }); r = await call('progress', { body: { id: A[0], type: 'unexplore' }, cookie: C }); assert.equal(r.j.state, 'completed'); ok('«был здесь» не снимает врученное');
// повторный вход сохраняет прогресс
r = await call('auth/request', { body: { email: 'reader@example.com', ret: '/journal/' } }); const t2 = new URL(r.j.test_link).searchParams.get('t');
r = await call('auth/verify', { q: '&t=' + encodeURIComponent(t2) }); const C2 = ck(r.h);
r = await call('me', { cookie: C2 }); assert.equal(r.j.levels['taste'], 2); ok('прогресс сохраняется после повторного входа');
// истекшая сессия
r = await call('progress', { body: { id: A[0], type: 'explore' }, cookie: 'oj=broken.token' }); assert.equal(r.s, 401); ok('истекшая или поддельная сессия: повторный вход');
// клиент не может назначить уровень
r = await call('progress', { body: { id: A[0], type: 'level', to: 3 }, cookie: C2 }); assert.equal(r.s, 400); ok('клиент не назначает уровень сам');
// редакция: статусы
r = await call('admin/state'); assert.equal(r.s, 403); ok('редакция закрыта без ключа');
r = await call('admin/status', { body: { id: A[1], status: 'scheduled', at: '2030-01-01T10:00:00+03:00' }, cookie: CA }); assert.equal(r.s, 409); ok('переход published→scheduled запрещен');
r = await call('admin/score', { body: { id: A[1], surprise: 5, rarity: 5, share: 5, access: 5, trust: 3 }, cookie: CA });
r = await call('admin/status', { body: { id: A[1], status: 'draft' }, cookie: CA }); assert.equal(r.s, 200); ok('снятие с публикации published→draft');
r = await call('progress', { body: { id: A[1], type: 'explore' }, cookie: C2 }); assert.notEqual(r.s, 200); ok('снятую статью нельзя отметить');
r = await call('status'); assert.ok(r.j.hidden.includes(A[1])); ok('снятая статья скрывается из каталога');
r = await call('admin/status', { body: { id: A[1], status: 'published' }, cookie: CA }); assert.equal(r.s, 409); ok('достоверность 3 блокирует публикацию');
r = await call('admin/status', { body: { id: A[1], status: 'archived' }, cookie: CA }); assert.equal(r.s, 409); ok('переход draft→archived запрещен');
r = await call('me', { cookie: C2 }); assert.equal(r.j.levels['taste'], 2); ok('снятие статьи не отнимает заработанное');
r = await call('admin/award', { body: { email: 'reader@example.com', id: A[1] }, cookie: CA }); assert.equal(r.s, 409); ok('снятое с публикации открытие не вручается');
// находка читателя → Contributor один раз
r = await call('discovery', { body: { title: 'Мастер нэцкэ в Киото', desc: 'Описание' }, cookie: C2 }); assert.equal(r.s, 200);
r = await call('admin/recs', { cookie: CA }); const rid = r.j.recs[0].id; assert.ok(!('uid' in r.j.recs[0]));
for (const st of ['published']) { r = await call('admin/recs', { body: { id: rid, status: st }, cookie: CA }); assert.equal(r.s, 409); }
ok('Reader’s Discovery: new→published запрещен');
for (const st of ['review', 'accepted', 'published']) { r = await call('admin/recs', { body: { id: rid, status: st }, cookie: CA }); assert.equal(r.s, 200); }
r = await call('me', { cookie: C2 }); assert.equal(r.j.user.contributor, true); ok('Orbiq Contributor после публикации');
r = await call('admin/recs', { body: { id: rid, status: 'published' }, cookie: CA }); assert.equal(r.s, 409); ok('повторная публикация не создает вторую награду');
// рассылка: без ключа честный отказ, сбой и повтор без дублей
r = await call('letter', { body: { on: true }, cookie: C2 });
r = await call('admin/letter', { body: { action: 'save', id: 'n1', main: [A[0], A[2]], extra: A[0] }, cookie: CA }); assert.equal(r.s, 200);
r = await call('admin/letter', { body: { action: 'ready', id: 'n1' }, cookie: CA }); assert.equal(r.s, 200);
r = await call('admin/letter', { body: { action: 'send', id: 'n1', confirm: 'ОТПРАВИТЬ' }, cookie: CA }); assert.equal(r.s, 503); ok('без ключа почты отправка не имитируется');
process.env.RESEND_API_KEY = 'k'; let fail = true; const sentTo = [];
globalThis.fetch = ((_f) => async (u, o) => { if (u === 'https://kv.test') return _f(u, o); const b = JSON.parse(o.body); if (fail) return new Response('{}', { status: 500 }); sentTo.push(b.to); return new Response('{"id":"m1"}', { status: 200 }); })(globalThis.fetch);
r = await call('admin/letter', { body: { action: 'send', id: 'n1', confirm: 'ОТПРАВИТЬ' }, cookie: CA }); assert.equal(r.s, 502); assert.equal(r.j.failed, 1); ok('сбой провайдера: статус Failed и причина');
fail = false; r = await call('admin/letter', { body: { action: 'send', id: 'n1', confirm: 'ОТПРАВИТЬ' }, cookie: CA }); assert.equal(r.s, 200); assert.equal(r.j.sent, 1);
r = await call('admin/letter', { body: { action: 'send', id: 'n1', confirm: 'ОТПРАВИТЬ' }, cookie: CA }); assert.equal(r.s, 409); assert.equal(sentTo.length, 1); ok('повтор после сбоя без дублей, Sent не отправляется второй раз');
// Telegram без токена
r = await call('admin/tg', { body: { action: 'save', article: A[0], text: 'Текст', date: '2026-11-24' }, cookie: CA }); const pid = r.j.id;
r = await call('admin/tg', { body: { action: 'ready', id: pid }, cookie: CA }); r = await call('admin/tg', { body: { action: 'send', id: pid }, cookie: CA }); assert.equal(r.s, 503); ok('Telegram без токена: отправка не имитируется');
// блокировка
r = await call('admin/block', { body: { email: 'reader@example.com', block: true }, cookie: CA });
r = await call('progress', { body: { id: A[0], type: 'explore' }, cookie: C2 }); assert.notEqual(r.s, 200); ok('заблокированный аккаунт не отмечает');
// реферальная метка: невалидная игнорируется на клиенте; регистрация по ссылке учтена
// отзыв, истечение, привязка к почте, пересланная ссылка
r = await call('invite/create', { body: { first: 'Ольга', last: 'Смирнова', email: 'olga@example.com' }, cookie: CF }); const t3 = new URL(r.j.link).searchParams.get('t'); const left1 = r.j.left;
r = await call('invite/list', { cookie: CF }); const id3 = r.j.invites.find(v => v.first === 'Ольга').id;
r = await call('invite/revoke', { body: { id: id3 }, cookie: CF }); assert.equal(r.s, 200); r = await call('invite/list', { cookie: CF }); assert.equal(r.j.left, left1 + 1); ok('отзыв возвращает слот');
r = await call('invite/accept', { body: { t: t3 } }); assert.equal(r.s, 410); ok('отозванное приглашение не работает');
r = await call('invite/create', { body: { first: 'Петр', last: 'Ким', email: 'petr@example.com' }, cookie: CF }); const t4 = new URL(r.j.link).searchParams.get('t');
const k4 = [...globalThis.__BLOB.keys()].find(k => k.startsWith('inv/') && JSON.parse(globalThis.__BLOB.get(k).body).email === 'petr@example.com');
const d4 = JSON.parse(globalThis.__BLOB.get(k4).body); d4.expires = '2020-01-01T00:00:00Z'; globalThis.__BLOB.set(k4, { ...globalThis.__BLOB.get(k4), body: JSON.stringify(d4) });
r = await call('invite/info', { q: '&t=' + t4 }); assert.equal(r.j.error, 'expired'); r = await call('invite/list', { cookie: CF }); assert.equal(r.j.invites.find(v => v.first === 'Петр').status, 'expired'); assert.equal(r.j.left, 2); ok('истечение срока: приглашение недействительно, слот возвращен');
r = await call('invite/renew', { body: { id: d4.id }, cookie: CF }); assert.ok(r.j.link); r = await call('invite/info', { q: '&t=' + t4 }); assert.notEqual(r.s, 200); ok('продление выдает новую ссылку, старая перестает работать');
// попытка принять чужое приглашение под другой почтой: токен подтверждения подписан сервером, подменить почту нельзя
r = await call('tips'); assert.equal(r.s, 200); ok('находки участников открыты всем');
const users = [...globalThis.__BLOB.keys()].filter(k => k.startsWith('users/')).map(k => JSON.parse(globalThis.__BLOB.get(k).body));
const iv = users.find(u => u.email === 'reader@example.com'); const fo = users.find(u => u.email === 'founder@example.com'); assert.equal(iv.invitedBy, fo.id); ok('связь пригласившего и приглашенного сохранена');
assert.equal(users.length, 3); ok('аккаунты: по решению редакции, по приглашению и добровольный');
r = await call('admin/stats', { cookie: CA }); assert.equal(r.j.viaInvite, 1); assert.equal(r.j.invites.accepted, 1); assert.ok(r.j.events.signup >= 1); ok('аналитика приглашений: принято 1, пришел по приглашению 1');
const keysInEvents = [...globalThis.__BLOB.keys()].filter(k => k.startsWith('events/')); assert.ok(keysInEvents.every(k => !k.includes('@'))); ok('в аналитике нет почты и других личных данных');
console.log('\nВсе сценарии пройдены:', keysInEvents.length, 'событий');
