// Orbiq CRM: чистые функции без хранилища и сети (права, проекции, круг 360°, зачет, выборка, подбор, очистка)

// ---------- справочники ----------
export const CATS = {
  citizenship: 'Гражданство и ВНЖ', realty: 'Недвижимость', watches: 'Часы и коллекции', finance: 'Финансы и переводы',
  preipo: 'Pre-IPO и инвестиции', security: 'Безопасность', health: 'Здоровье', education: 'Образование детей',
  travel: 'Путешествия и события', art: 'Искусство', aviation: 'Авиация и яхты', legal: 'Право и наследство',
  digital: 'Цифровая инфраструктура', other: 'Другое',
};
export const AGES = ['<35', '35–44', '45–54', '55–64', '65+'];
export const CAPS = ['<1', '1–3', '3–10', '10–25', '25–100', '100+'];
export const INVESTING = ['active', 'sometimes', 'no'];
export const KINDS = ['fact', 'hypothesis', 'unknown', 'na'];
export const SECTORS = [
  { id: 'about', title: 'О человеке', cells: [['age', 'Какой примерно возраст?'], ['region', 'В каком регионе обычно живет?'], ['places', 'Где регулярно бывает?']] },
  { id: 'business', title: 'Дело', cells: [['source', 'В какой сфере заработал основной капитал?'], ['now', 'Какими направлениями занимается сейчас?'], ['project', 'Какой проект хотел бы развить?']] },
  { id: 'family', title: 'Семья', cells: [['circle', 'С кем обычно планирует поездки или досуг?'], ['kids', 'Есть ли дети или внуки, для которых подбирает возможности, какого они примерно возраста?'], ['gift', 'Для кого хотел бы получить или подарить подборку?']] },
  { id: 'interests', title: 'Интересы', cells: [['time', 'На что охотно тратит свободное время?'], ['subject', 'Какой конкретный предмет, мастер или направление его увлекает?'], ['memory', 'Какой опыт запомнился и чем?']] },
  { id: 'prefs', title: 'Предпочтения', cells: [['formats', 'Какие форматы ему нравятся?'], ['no', 'Что просил больше не предлагать?'], ['style', 'Как предпочитает обсуждать варианты?']] },
  { id: 'plans', title: 'Планы и запросы', cells: [['asked', 'С чем уже обращался к партнеру?'], ['next', 'Что хочет сделать в ближайшие месяцы?'], ['timing', 'Какие сроки или обстоятельства важны?']] },
];
export const CELL_KEYS = SECTORS.flatMap(s => s.cells.map(c => `${s.id}.${c[0]}`));
export const QUESTIONS = Object.fromEntries(SECTORS.flatMap(s => s.cells.map(c => [`${s.id}.${c[0]}`, c[1]])));
export const QUAL_MIN = 15, QUAL_DENOM = 18, PF_NEED = 50, SEATS_MAX = 2, TRIAL_QUOTA = 3, PAID_FAMILY_INVITES = 20, PRIORITY_HOURS = 72;
export const FREE_ALIASES = ['Атлас', 'Орион', 'Вега', 'Сириус', 'Альтаир', 'Лира', 'Персей', 'Кассиопея', 'Андромеда', 'Полярис', 'Капелла', 'Антарес'];

// ---------- мелкие утилиты ----------
export function fnv(str) { let h = 0x811c9dc5; for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
export function rng(seed) { let a = fnv(seed); return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const low = (s) => String(s ?? '').toLowerCase().replace(/ё/g, 'е');
const normText = (s) => low(s).replace(/[^a-zа-я0-9]+/g, ' ').trim();
export const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
export function ruDate(d) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return m ? `${m[3]}.${m[2]}.${m[1]}` : ''; }
export function plural(n, f) { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2]; }
// +n месяцев с прижатием к последнему дню месяца (активация 31-го числа)
export function addMonths(iso, n) {
  const d = new Date(iso); const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, last), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())).toISOString();
}

// ---------- имя карточки ----------
export function normAlias(s) {
  const alias = String(s ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
  return { alias, norm: alias.toLowerCase().replace(/ё/g, 'е') };
}
export function aliasError(alias) {
  if (!alias) return 'Укажите имя или псевдоним';
  if (alias.length > 40) return 'Имя не длиннее 40 символов';
  if (!/^[\p{L}\p{N} .'’\-«»"]+$/u.test(alias)) return 'В имени можно использовать буквы, цифры, пробел и дефис';
  if (/\d{5,}/.test(alias)) return 'Имя не должно содержать номера';
  return '';
}

// ---------- очистка персональных данных ----------
const RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const RE_URL = /\b(?:https?:\/\/|www\.)[^\s<>"')]+|\b(?:t\.me|wa\.me|vk\.com|instagram\.com|facebook\.com|linkedin\.com)\/[^\s<>"')]*/gi;
const RE_PHONE = /(?:\+|\b)\d[\d\s().-]{6,}\d/g;
const RE_HANDLE = /(^|[\s(])@[A-Za-z0-9_]{4,}/g;
export function scrubPII(text) {
  const removed = { email: 0, phone: 0, url: 0, handle: 0 };
  let t = String(text ?? '');
  t = t.replace(RE_EMAIL, () => { removed.email++; return '[почта удалена]'; });
  t = t.replace(RE_URL, () => { removed.url++; return '[ссылка удалена]'; });
  t = t.replace(RE_PHONE, (m) => { if (m.replace(/\D/g, '').length < 7) return m; removed.phone++; return '[телефон удален]'; });
  t = t.replace(RE_HANDLE, (m, p) => { removed.handle++; return p + '[контакт удален]'; });
  return { text: t, removed };
}
export const hasContacts = (s) => { const r = scrubPII(s).removed; return r.email + r.phone + r.url + r.handle > 0; };

// ---------- карточка: нормализация полей ----------
export const PATCH_FIELDS = ['alias', 'age', 'capital', 'kids', 'investing', 'interests', 'requests', 'cells', 'relation', 'capitalBasis', 'publicText', 'stage'];
export const STAGES = ['draft', 'ready', 'offered', 'consent', 'link', 'active', 'renewed', 'ended', 'refused', 'later'];
const str = (v, n) => String(v ?? '').trim().slice(0, n);
// проверка и приведение патча; возвращает {patch} или {error}
export function cleanPatch(card, patch, newId) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return { error: 'Нет изменений' };
  const bad = Object.keys(patch).filter(k => !PATCH_FIELDS.includes(k));
  if (bad.length) return { error: 'Поле нельзя менять: ' + bad.join(', ') };
  const out = {};
  if ('alias' in patch) out.alias = String(patch.alias ?? '');
  if ('age' in patch) { if (patch.age && !AGES.includes(patch.age)) return { error: 'Возраст: выберите диапазон' }; out.age = patch.age || ''; }
  if ('capital' in patch) { if (patch.capital && !CAPS.includes(patch.capital)) return { error: 'Капитал: выберите диапазон' }; out.capital = patch.capital || ''; }
  if ('kids' in patch) { const k = patch.kids; if (k === '' || k == null) out.kids = null; else { const n = Number(k); if (!Number.isInteger(n) || n < 0 || n > 20) return { error: 'Дети: число от 0 до 20' }; out.kids = n; } }
  if ('investing' in patch) { if (patch.investing && !INVESTING.includes(patch.investing)) return { error: 'Инвестирует: Активно / Иногда / Сейчас нет' }; out.investing = patch.investing || ''; }
  if ('stage' in patch) { if (patch.stage && !STAGES.includes(patch.stage)) return { error: 'Неизвестный этап' }; out.stage = patch.stage || 'draft'; }
  if ('interests' in patch) { if (!Array.isArray(patch.interests)) return { error: 'Интересы: список' }; out.interests = [...new Set(patch.interests.map(x => str(x, 40)).filter(x => x && !hasContacts(x)))].slice(0, 12); } // SEC: интересы видны сети, контакты в них не принимаются
  if ('capitalBasis' in patch) out.capitalBasis = str(patch.capitalBasis, 1000);
  if ('relation' in patch) { const r = patch.relation || {}; const rr = cleanRelation(r); if (rr.error) return rr; const prev = card.relation || {}; out.relation = { role: str(r.role, 200), lastContact: str(r.lastContact, 40), topic: str(r.topic, 200), years: 'years' in r ? rr.years : (prev.years ?? null), isClient: 'isClient' in r ? rr.isClient : (prev.isClient || 'unknown') }; }
  if ('requests' in patch) {
    if (!Array.isArray(patch.requests) || patch.requests.length > 20) return { error: 'Запросы: список до 20' };
    const prev = Object.fromEntries((card.requests || []).map(r => [r.id, r])); const seen = new Set(); const reqs = [];
    for (const r of patch.requests) {
      if (!r || !CATS[r.cat]) return { error: 'Запрос: выберите категорию' };
      const text = scrubPII(str(r.text, 300)).text; if (!text) return { error: 'Запрос: короткая формулировка' };
      const status = r.status === 'closed' ? 'closed' : 'open';
      let id = /^r[A-Za-z0-9_-]{1,20}$/.test(r.id || '') && !seen.has(r.id) ? r.id : newId(); seen.add(id);
      const p = prev[id];
      const brief = 'brief' in r ? cleanBrief(r.brief) : (p && p.brief) || null;
      reqs.push({ id, cat: r.cat, text, status, at: (p && p.at) || new Date().toISOString(), public: r.public === false ? false : true, ...(brief ? { brief } : {}) });
    }
    out.requests = reqs;
  }
  if ('cells' in patch) {
    if (!patch.cells || typeof patch.cells !== 'object') return { error: 'Круг: объект ячеек' };
    const cells = { ...(card.cells || {}) };
    for (const [k, v] of Object.entries(patch.cells)) {
      if (!CELL_KEYS.includes(k)) return { error: 'Неизвестная ячейка: ' + k };
      if (v == null) { delete cells[k]; continue; }
      if (!KINDS.includes(v.kind)) return { error: 'Ячейка: факт, гипотеза, не знаю или не применимо' };
      const cur = cells[k];
      cells[k] = { v: str(v.v, 500), kind: v.kind, src: 'manual', at: new Date().toISOString(), ver: ((cur && cur.ver) || 0) + 1 };
    }
    out.cells = cells;
  }
  if ('publicText' in patch) {
    const reqs = out.requests || card.requests || []; const ids = new Set(reqs.map(r => r.id)); const pt = {};
    for (const [k, v] of Object.entries(patch.publicText || {})) { if (!ids.has(k)) return { error: 'Нет такого запроса' }; const t = str(scrubPII(v).text, 300); if (t) pt[k] = t; }
    out.publicText = pt;
  }
  return { patch: out };
}
// сколько лет знакомы и платил ли деньги партнеру (SPEC-v2, блок 6)
export function cleanRelation(r = {}) {
  let years = null; if (r.years !== undefined && r.years !== null && r.years !== '') { const n = Number(r.years); if (!Number.isFinite(n) || n < 0 || n > 80) return { error: 'Сколько лет знакомы: число от 0 до 80' }; years = Math.round(n); }
  const isClient = ['yes', 'no', 'unknown'].includes(r.isClient) ? r.isClient : (r.isClient === true ? 'yes' : r.isClient === false ? 'no' : 'unknown');
  return { years, isClient };
}
// после правки запросов: формулировка для сети сбрасывается, если исходный текст изменился
export function mergePatch(card, p) {
  const c = { ...card, ...p };
  if (p.requests && !p.publicText) {
    const before = Object.fromEntries((card.requests || []).map(r => [r.id, r.text])); const pt = { ...(card.publicText || {}) };
    for (const id of Object.keys(pt)) { const r = p.requests.find(x => x.id === id); if (!r || r.text !== before[id]) delete pt[id]; }
    c.publicText = pt;
  }
  if (p.cells) syncFromCells(c);
  return c;
}
function syncFromCells(c) { const a = c.cells && c.cells['about.age']; if (a && a.kind === 'fact') { const r = ageRange(a.v); if (r) c.age = r; } }
// упоминание возраста человека: годы календаря, стаж знакомства и возраст детей не считаются; score — насколько конкретно
const AGE_NOT = /знаком|дружим|работа|опыт|стаж|назад|в течение|уже \d|сын|доч|внук|ребен|дет(и|ей|ям)|жен[аеыу]|супруг|компани|бизнес|фирм/;
export function ageMention(s) {
  const t = low(s); let m;
  if ((m = /(?<![а-я])(?:ему|ей|возраст[а-я]*|исполнилось)\s*[:—-]?\s*(?:около|примерно|под|за|почти|чуть больше)?\s*(?<![\d.,])(\d{2})(?![\d.,%])/.exec(t))) return { range: ageRange(m[1]), score: /около|примерно|под|за|почти|чуть/.test(m[0]) ? 3 : 4 };
  // «58 лет, жена и двое сыновей 12 и 24 лет»: берем число, перед которым нет слов о семье, знакомстве и годах работы
  if ((m = /(?<![\d.,])(\d{2})(?![\d.,%])\s*(лет|года?)(?![а-я])/.exec(t)) && !AGE_NOT.test(t.slice(0, m.index))) return { range: ageRange(m[1]), score: 2 };
  if (AGE_NOT.test(t)) return null;
  if ((m = /(?:около|под|за|примерно)\s*(?<![\d.,])(\d{2})(?![\d.,%])(?!\s*(млн|млрд|миллион|тыс|\$|€|%|год))/.exec(t)) && /лет|возраст|ему|ей/.test(t)) return { range: ageRange(m[1]), score: 1 };
  return null;
}
export function ageRange(v) {
  if (AGES.includes(v)) return v; const m = /(\d{2})/.exec(String(v || '')); if (!m) return '';
  const n = +m[1]; return n < 35 ? '<35' : n < 45 ? '35–44' : n < 55 ? '45–54' : n < 65 ? '55–64' : '65+';
}

// ---------- круг 360° ----------
const EMPTY = new Set(['', '-', '—', 'нет данных', 'неизвестно', 'не знаю', 'нет', 'n/a', 'na']);
const meaningful = (v) => { const t = normText(v); return t.length >= 2 && !EMPTY.has(t); };
// заполненные ячейки: факт со значимым текстом; повтор одного и того же текста в разных ячейках считается один раз
function factCells(card) {
  const seen = new Set(); const out = [];
  for (const k of CELL_KEYS) { const c = (card.cells || {})[k]; if (!c || c.kind !== 'fact' || !meaningful(c.v)) continue; const n = normText(c.v); if (seen.has(n)) continue; seen.add(n); out.push(k); }
  return out;
}
export function circle(card) {
  const cells = card.cells || {}; const na = CELL_KEYS.filter(k => cells[k] && cells[k].kind === 'na').length;
  const filledKeys = factCells(card); const applicable = CELL_KEYS.length - na; const filled = filledKeys.length;
  const pct = applicable ? Math.round(100 * filled / applicable) : null;
  const sectors = SECTORS.map(s => { const keys = s.cells.map(c => `${s.id}.${c[0]}`); const app = keys.filter(k => !(cells[k] && cells[k].kind === 'na'));
    const next = keys.find(k => !filledKeys.includes(k) && !(cells[k] && cells[k].kind === 'na'));
    return { id: s.id, title: s.title, filled: keys.filter(k => filledKeys.includes(k)).length, applicable: app.length, next: next ? { cell: next, q: QUESTIONS[next] } : null }; });
  return { filled, applicable, pct, label: applicable ? `${filled} из ${applicable} · ${pct}%` : 'Пока нет данных', sectors };
}

// ---------- сетевое представление и строки таблицы ----------
const bs = (v, n = 300) => (typeof v === 'string' ? scrubPII(v.trim().slice(0, n)).text : '');
export function cleanBrief(b) {
  if (!b || typeof b !== 'object') return null;
  const arr = (a, n) => (Array.isArray(a) ? a.map(x => bs(x, 160)).filter(Boolean).slice(0, n) : []);
  const o = { deal: bs(b.deal, 40), budget: bs(b.budget, 60), where: bs(b.where, 120), when: bs(b.when, 80), what: bs(b.what, 900), money: bs(b.money, 240), seen: bs(b.seen, 240),
    details: arr(b.details, 10), hurdles: arr(b.hurdles, 6),
    steps: (Array.isArray(b.steps) ? b.steps : []).filter(x => Array.isArray(x) && bs(x[0], 40)).slice(0, 6).map(x => [bs(x[0], 40), x[1] ? 1 : 0]) };
  if (b.doc && typeof b.doc === 'object') { const secs = (Array.isArray(b.doc.sections) ? b.doc.sections : []).filter(x => Array.isArray(x)).slice(0, 12).map(x => [bs(x[0], 60), bs(x[1], 1500)]).filter(x => x[0] && x[1]); if (bs(b.doc.name, 120) && secs.length) o.doc = { name: bs(b.doc.name, 120), meta: bs(b.doc.meta, 80), sections: secs }; }
  return o.what || o.budget ? o : null;
}
export function networkView(c) {
  const pt = c.publicText || {};
  return {
    id: c.id, alias: c.alias, age: c.age || '', capital: c.capital || '', kids: c.kids ?? null, investing: c.investing || '',
    interests: (c.interests || []).filter(x => !hasContacts(x)),
    requests: (c.requests || []).filter(r => r.status === 'open' && r.public === true).map(r => ({ id: r.id, cat: r.cat, text: pt[r.id] || '', at: r.at || '', ...(r.brief ? { brief: cleanBrief(r.brief) } : {}) })),
    mine: false,
  };
}
// ---------- готовность карточки: 6 блоков (SPEC-v2) ----------
export const BLOCKS = [
  ['ageFamily', 'Возраст и семья'], ['capital', 'Капитал и откуда оценка'], ['business', 'На чем заработал'],
  ['interests', 'Интересы'], ['request', 'Подтвержденный запрос'], ['relation', 'Знакомство и оплата'],
];
const BLOCK_Q = {
  age: 'Сколько человеку примерно лет?', family: 'Есть ли семья и дети?', capital: 'Какой у него примерно личный капитал?', capitalBasis: 'Почему вы так оцениваете капитал: продажа бизнеса, доля, другое?',
  business: 'На чем он заработал: отрасль, масштаб, его роль в компании?', interests: 'Чем он увлекается? Что конкретно: марка, место, вид спорта?',
  request: 'Что ему нужно сейчас? Какой запрос он сам подтвердил?', years: 'Сколько лет вы знакомы?', isClient: 'Он ваш клиент: платил ли вам деньги?',
};
export function readiness(card, fields = {}, cells = [], requests = []) {
  const f = { ...card, ...fields }; const rel = { ...(card.relation || {}), ...(fields.relation || {}) };
  const has = (k) => { const x = (card.cells || {})[k]; return (x && x.kind === 'fact' && meaningful(x.v)) || cells.some(c => c.cell === k && c.kind === 'fact' && meaningful(c.value)); };
  const miss = {
    ageFamily: [!(f.age || has('about.age')) && 'age', !((f.kids !== null && f.kids !== undefined && f.kids !== '') || has('family.kids') || has('family.circle')) && 'family'].filter(Boolean),
    capital: [!CAPS.includes(f.capital) && 'capital', !(str(f.capitalBasis, 1000).length >= 3 && meaningful(f.capitalBasis)) && 'capitalBasis'].filter(Boolean),
    business: has('business.source') || has('business.now') ? [] : ['business'],
    interests: (f.interests || []).length || ['interests.time', 'interests.subject', 'interests.memory'].some(has) ? [] : ['interests'],
    request: (card.requests || []).some(r => r.status === 'open') || requests.length ? [] : ['request'],
    relation: [!(Number.isFinite(rel.years) && rel.years >= 0) && 'years', !['yes', 'no'].includes(rel.isClient) && 'isClient'].filter(Boolean),
  };
  const blocks = BLOCKS.map(([id, title]) => ({ id, title, ok: !miss[id].length, q: miss[id].map(k => BLOCK_Q[k]) }));
  const okSet = new Set(blocks.filter(b => b.ok).map(b => b.id)); const filled = okSet.size;
  const ready = filled >= 5 && ['capital', 'business', 'request', 'relation'].every(k => okSet.has(k));
  return { filled, of: 6, ready, pct: Math.round(100 * filled / 6), label: `${filled} из 6`, blocks };
}
export function ownRow(c, next) {
  return { id: c.id, alias: c.alias, age: c.age || '', capital: c.capital || '', kids: c.kids ?? null, investing: c.investing || '', interests: [...(c.interests || [])],
    requests: (c.requests || []).map(r => ({ id: r.id, cat: r.cat, text: r.text, status: r.status, public: r.public })), stage: c.stage || 'draft',
    circle: (({ filled, applicable, pct, label }) => ({ filled, applicable, pct, label }))(circle(c)), ready: (({ filled, of, ready, pct, label }) => ({ filled, of, ready, pct, label }))(readiness(c)),
    relation: { years: (c.relation || {}).years ?? null, isClient: (c.relation || {}).isClient || 'unknown' }, next: next || null, updated: c.updated, mine: true };
}
export function filterRows(rows, q = {}) {
  const s = q.q ? normAlias(q.q).norm : '';
  return rows.filter(r => {
    if (s && !normAlias(r.alias).norm.includes(s)) return false;
    if (q.cat && !(r.requests || []).some(x => x.cat === q.cat && (x.status === undefined || x.status === 'open'))) return false;
    if (q.interest && !(r.interests || []).some(i => low(i) === low(q.interest))) return false;
    if (q.capital && r.capital !== q.capital) return false;
    if (q.investing && r.investing !== q.investing) return false;
    return true;
  });
}
// спрос для кандидата: агрегаты по его категориям без имен и id; одинаковые запросы считаются один раз
export function demand(cards, cats) {
  return (cats || []).filter(c => CATS[c]).map(cat => {
    const seen = new Set(); const ex = [];
    for (const c of cards) for (const r of networkView(c).requests) {
      if (r.cat !== cat) continue; const key = normText(r.text) + '|' + c.age + '|' + c.capital + '|' + (r.text ? '' : c.id); if (seen.has(key)) continue; seen.add(key);
      ex.push({ text: r.text, age: c.age || '', capital: c.capital || '' });
    }
    return { cat, title: CATS[cat], count: ex.length, examples: ex.slice(0, 5) };
  });
}

// ---------- права ----------
// эффективное состояние тарифа: проба истекла, второй платеж просрочен, срок места закончился
// SPEC-v2: статусы new → basic → paid; networker — отдельная роль. Миграция v1: candidate → new, trial → basic
export const TIERS = ['new', 'basic', 'paid'];
export const normTier = (t) => t === 'candidate' ? 'new' : t === 'trial' ? 'basic' : TIERS.includes(t) ? t : 'new';
export function effTier(p, now = Date.now()) {
  if (!p) return null;
  if (p.kind === 'networker') return normTier(p.tier) === 'new' ? 'networker_new' : 'networker'; // до 50 готовых карточек и проверки — как новый партнер
  const t = normTier(p.tier);
  if (t === 'paid') {
    const pd = p.paid || {};
    if (pd.end && Date.parse(pd.end) < now) return 'basic';
    if (pd.pay2Due && !pd.pay2 && Date.parse(pd.pay2Due) < now) return 'paid_hold';
    return 'paid';
  }
  return t;
}
const OWN = ['crm.own', 'notes', 'tasks', 'demand', 'rq.read', 'pf.submit', 'tg', 'fit', 'seat.count'];
export const MATRIX = {
  new: [...OWN],
  basic: [...OWN, 'net.view', 'rq.create', 'catalog'],
  paid: [...OWN, 'net.view', 'rq.create', 'rq.unlimited', 'priority', 'catalog', 'invite.create'],
  paid_hold: [...OWN, 'net.view', 'rq.create', 'rq.unlimited', 'priority', 'catalog'],
  networker: ['crm.own', 'notes', 'tasks', 'rq.read', 'tg', 'net.view', 'rq.create', 'rq.refer', 'catalog'],
  networker_new: ['crm.own', 'notes', 'tasks', 'demand', 'rq.read', 'pf.submit', 'tg'],
  owner: ['net.view', 'net.full', 'owner.admin', 'notes', 'catalog', 'tg', 'crm.own', 'tasks', 'priority'],
};
// запрет по умолчанию: неизвестная роль, тариф или операция → false
export function can(role, tier, suspended, op) {
  if (suspended) return false;
  if (role === 'owner') return MATRIX.owner.includes(op);
  if (role === 'partner') return (MATRIX[tier] || []).includes(op);
  return false;
}

// ---------- квота знакомств и места ----------
export function seatTake(doc, pid, at, max = SEATS_MAX) {
  const d = { taken: [], wait: [], ...(doc || {}) };
  if (d.taken.some(x => x.pid === pid)) return { doc: d, already: true };
  if (d.taken.length >= max) return { err: 'full', doc: { ...d, wait: d.wait.includes(pid) ? d.wait : [...d.wait, pid] } };
  return { doc: { ...d, taken: [...d.taken, { pid, since: at }], wait: d.wait.filter(x => x !== pid) } };
}
export function seatFree(doc, pid) { const d = { taken: [], wait: [], ...(doc || {}) }; return { ...d, taken: d.taken.filter(x => x.pid !== pid) }; }

// ---------- зачет карточки и выборка ----------
export function qualifyCard(card, partner, cardsOfPartner = []) {
  // SPEC-v2: карточка засчитывается, если готова по 6 блокам, капитал от $1 млн и нет дубля
  const reasons = []; const facts = factCells(card).length; const rd = readiness(card);
  for (const b of rd.blocks) if (!b.ok) reasons.push(`Не заполнено: ${b.title.toLowerCase()}`);
  if (rd.ready) reasons.length = 0;
  if (card.capital && CAPS.indexOf(card.capital) < 1) reasons.push('Капитал ниже $1 млн');
  // дубль: такой же текст запроса или основания у более ранней карточки этого партнера
  const sig = (c) => ({ reqs: (c.requests || []).filter(x => x.status === 'open').map(x => normText(x.text)).filter(Boolean), basis: normText(c.capitalBasis) });
  const me = sig(card);
  const earlier = cardsOfPartner.filter(c => c.id !== card.id && !c.archived && (c.created < card.created || (c.created === card.created && c.id < card.id)));
  if (earlier.some(c => { const s = sig(c); return (me.basis && me.basis === s.basis) || me.reqs.some(t => s.reqs.includes(t)); })) reasons.push('Повтор: такой же запрос или основание уже есть в другой карточке');
  return { ok: reasons.length === 0, reasons, facts, ready: rd.filled };
}
// из каждой полной двадцатки одна карточка плюс одна из остатка; детерминировано по seed
export function selectSample(cids, seed) {
  const r = rng(seed); const out = []; const full = Math.floor(cids.length / 20), rem = cids.length % 20;
  for (let i = 0; i < full; i++) out.push(cids[i * 20 + Math.floor(r() * 20)]);
  if (rem) out.push(cids[full * 20 + Math.floor(r() * rem)]);
  return out;
}
export function extendSample(cids, sample, seed) { const rest = cids.filter(c => !sample.includes(c)); if (!rest.length) return sample; return [...sample, rest[Math.floor(rng(seed + '|' + sample.length)() * rest.length)]]; }

// ---------- разбор текста без модели (резерв и тесты) ----------
const RULES = [
  ['prefs.no', /не предлага|не нравит|не любит|не интересн|отказал|раздража|больше не /],
  ['family.gift', /подар|для жены|для дочер|для сына|для внук/],
  ['family.kids', /(^|[^а-я])(дети|детей|детям|дочь|дочер|сын|внук|ребен)/],
  ['about.age', { test: (t) => !!ageMention(t) }],
  ['family.circle', /(^|[^а-я])(жена|женой|жену|супруг|с семьей|семья|с друзьями)/],
  ['about.region', /живет|проживает|резидент|родом/],
  ['about.places', /бывает|ездит|летает|отдыха|проводит (зиму|лето)/],
  ['business.source', /заработал|сколотил|сделал (состояние|деньги)|основн[а-я]* капитал|состояни|основал|основатель|собственник|владеет|владел|продал (бизнес|компан|долю)|построил (бизнес|компан)|дистрибуц|производств|девелоп|строительн|нефт|ритейл|сеть (магазин|аптек|клиник)|^(бизнес|сфера|отрасль|дело)\s*[:—-]/],
  ['business.project', /развить|хотел бы (запустить|построить|создать)|новый проект/],
  ['business.now', /сейчас занимается|управляет|инвестир|вложил|совладел|директор|бизнес/],
  ['interests.memory', /запомнил|впечатлил|вспомина/],
  ['interests.subject', /коллекц|увлека|часы|часов|архитект|искусств|живопис|(^|[^а-я])вин(о|а|ом)([^а-я]|$)|винодел|яхт|авиац|гольф|охот|джаз|опер/],
  ['interests.time', /свободн\w* врем|хобби|любит|выходны|досуг/],
  ['prefs.style', /обсужда|по телефону|лично|мессенджер|письменно|коротко/],
  ['prefs.formats', /формат|нравятся|предпочита|камерн/],
  ['plans.asked', /обращался|просил|спрашивал|запрос/],
  ['plans.timing', /до (конца|весны|лета|осени|зимы)|срок|к (весне|лету|осени|зиме)|(январ|феврал|март|апрел|мае|июн|июл|август|сентябр|октябр|ноябр|декабр)/],
  ['plans.next', /планиру|собирается|хочет|в ближайш|думает о/],
];
const HEAD = [[/о человеке/, 'about'], [/дело/, 'business'], [/семья/, 'family'], [/интерес/, 'interests'], [/предпочтени/, 'prefs'], [/портрет/, 'prefs'], [/план/, 'plans'], [/уточнить/, 'clarify']];
const SECTOR_DEFAULT = { about: 'about.region', business: 'business.now', family: 'family.circle', interests: 'interests.subject', prefs: 'prefs.formats', plans: 'plans.next' };
function kindOf(s) {
  const t = low(s);
  if (/не знаю|неизвестно|непонятно|нет данных/.test(t)) return 'unknown';
  if (/возможно|кажется|наверное|вероятно|похоже|гипотез|может быть|предполага/.test(t)) return 'hypothesis';
  return 'fact';
}
const REL_SENT = /последний раз|виделись|общались|созванивались|переписывались|познакомил|знакомы (с|по|через)|через общих/;
function cellFor(s, sector) {
  const t = low(s);
  if (!sector && REL_SENT.test(t)) { const a = ageMention(t); return a && a.score >= 3 ? 'about.age' : ''; } // знакомство идет в relation; явный возраст в той же фразе сохраняем
  for (const [cell, re] of RULES) { if (sector && !cell.startsWith(sector + '.')) continue; if (re.test(t)) return cell; }
  return sector ? SECTOR_DEFAULT[sector] : '';
}
export function heuristicExtract(text) {
  const items = []; let sector = '';
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const h = /^#{1,6}\s*(.+)$/.exec(line);
    if (h) { const t = low(h[1]); const m = HEAD.find(([re]) => re.test(t)); sector = m ? m[1] : ''; continue; }
    if (/^\|?\s*-{3,}/.test(line)) continue;
    const body = line.replace(/^[-*•]\s*/, '');
    if (body.includes('|')) { // строка MD: суть | факт или гипотеза | источник | год
      const parts = body.split('|').map(x => x.trim()).filter(Boolean); if (!parts.length) continue;
      const v = parts[0]; if (/^(суть|утверждение)$/i.test(v)) continue;
      const kraw = low(parts[1] || ''); let kind = /гипотез/.test(kraw) ? 'hypothesis' : /неизвест|не знаю/.test(kraw) ? 'unknown' : /факт/.test(kraw) ? 'fact' : kindOf(v);
      let sec = sector; if (sec === 'clarify') { sec = ''; kind = 'hypothesis'; }
      const cell = cellFor(v, sec) || (sector === 'clarify' ? 'interests.subject' : ''); if (cell) items.push({ cell, value: v.slice(0, 300), kind });
      continue;
    }
    for (const sent of body.split(/(?<=[.!?;])\s+/)) {
      const s = sent.trim().replace(/[.;]+$/, ''); if (s.length < 3) continue;
      let sec = sector, kind = kindOf(s); if (sec === 'clarify') { sec = ''; kind = 'hypothesis'; }
      const cell = cellFor(s, sec);
      if (cell) items.push({ cell, value: s.slice(0, 300), kind });
      const am = ageMention(s); if (am && am.score >= 2 && cell !== 'about.age' && kind === 'fact') items.push({ cell: 'about.age', value: am.range, kind: 'fact', ageScore: am.score }); // возраст в одной фразе с семьей
    }
  }
  return items;
}
// схлопнуть по ячейкам: один факт на ячейку (значения через «; »), противоречия отдельно
export function buildProposals(card, items) {
  const by = new Map(); const contradictions = []; const skipped = [];
  for (const it of items) {
    if (!CELL_KEYS.includes(it.cell) || !KINDS.includes(it.kind)) continue;
    let value = String(it.value || '').trim().slice(0, 300); if (!value) continue;
    if (it.cell === 'about.age' && it.kind === 'fact') value = (ageMention(value) || {}).range || ageRange(value) || value;
    const cur = by.get(it.cell);
    if (!cur) { by.set(it.cell, { cell: it.cell, value, kind: it.kind, ...(it.cell === 'about.age' ? { ageScore: it.ageScore || (ageMention(it.value) || {}).score || 0 } : {}) }); continue; }
    if (cur.kind === it.kind && it.cell === 'about.age') { const sc = it.ageScore || (ageMention(it.value) || {}).score || 0; if (sc > (cur.ageScore || 0)) { cur.value = value; cur.ageScore = sc; } }
    else if (cur.kind === it.kind) { if (!low(cur.value).includes(low(value))) cur.value = (cur.value + '; ' + value).slice(0, 500); }
    else { // в одной ячейке факт и догадка: факт важнее, догадка остается отдельной подсказкой
      const keepNew = it.kind === 'fact' || (cur.kind === 'unknown' && it.kind === 'hypothesis');
      skipped.push({ cell: it.cell, value: keepNew ? cur.value : value, kind: keepNew ? cur.kind : it.kind });
      if (keepNew) by.set(it.cell, { cell: it.cell, value, kind: it.kind });
    }
  }
  const proposals = [];
  for (const p of by.values()) {
    const ex = (card.cells || {})[p.cell];
    if (ex && ex.kind === 'fact' && p.kind === 'fact' && normText(ex.v) !== normText(p.value)) {
      p.conflict = { current: ex.v, src: ex.src }; contradictions.push({ cell: p.cell, q: QUESTIONS[p.cell], values: [ex.v, p.value], note: ex.src === 'client' ? 'Клиент сам уточнил это значение' : 'Отличается от сохраненного' });
    }
    delete p.ageScore; p.q = QUESTIONS[p.cell]; proposals.push(p);
  }
  return { proposals, contradictions, skipped };
}

// ---------- интересы ----------
export const TAGS = [
  ['Часы', /часы|часами|часам([^а-я]|$)|часов(ые|ой|ых)|часовщ|watch/], ['Архитектура', /архитект/], ['Искусство', /искусств|живопис|галере|картин|художник/],
  ['Вино', /(^|[^а-я])вин(о|а|ом|ные|ный)([^а-я]|$)|винодел|сомелье/], ['Гастрономия', /гастроном|ресторан|трюфел|кухн/],
  ['Путешествия', /путешеств|поездк|экспедиц/], ['Яхты', /яхт/], ['Авиация', /авиац|самолет|джет|вертолет/], ['Автомобили', /автомоб|суперкар|ралли/],
  ['Спорт', /спорт|гольф|теннис|лыж|регат|марафон/], ['Охота и рыбалка', /охот|рыбалк/], ['Здоровье', /здоров|медиц|клиник|долголет/],
  ['Образование', /образован|школ|университет/], ['Благотворительность', /благотвор/], ['Коллекции', /коллекц/], ['Музыка', /музык|джаз|опер|концерт/],
];
export function tagsFrom(text) { const t = low(text); return TAGS.filter(([, re]) => re.test(t)).map(([n]) => n); }
const TAG_THEMES = { 'Часы': ['watches', 'collect'], 'Архитектура': ['art', 'realty'], 'Искусство': ['art'], 'Вино': ['taste'], 'Гастрономия': ['taste'], 'Путешествия': ['travel'],
  'Яхты': ['aviation'], 'Авиация': ['aviation'], 'Автомобили': ['cars'], 'Спорт': ['sport'], 'Охота и рыбалка': ['sport', 'hobby'], 'Здоровье': ['health'], 'Образование': ['education', 'kids'],
  'Благотворительность': ['charity'], 'Коллекции': ['collect'], 'Музыка': ['art', 'hobby'] };
const CAT_THEMES = { citizenship: ['citizenship'], realty: ['realty'], watches: ['watches', 'collect'], finance: ['finance', 'wealth'], preipo: ['preipo', 'wealth', 'first1m'], security: ['security'],
  health: ['health'], education: ['education', 'kids'], travel: ['travel', 'taste', 'spirit'], art: ['art'], aviation: ['aviation', 'cars'], legal: ['legal', 'wealth'], digital: ['digital', 'security'], other: [] };
export const DIR_THEMES = { taste: ['taste', 'travel'], art: ['art'], cars: ['cars', 'aviation'], first1m: ['first1m', 'finance'], sport: ['sport', 'travel'], hobby: ['hobby'], collect: ['collect', 'watches', 'art'],
  her: ['her', 'travel', 'health'], kids: ['kids', 'education'], health: ['health'], spirit: ['spirit', 'travel'], charity: ['charity'], wealth: ['wealth', 'finance', 'legal'], security: ['security', 'digital'], asymmetry: ['asymmetry'] };

// подтвердить предложенные факты; повтор тех же фактов ничего не меняет
export function applyItems(card, items, src = 'md', now = new Date().toISOString()) {
  const c = JSON.parse(JSON.stringify(card)); c.cells = c.cells || {}; let n = 0; const errors = [];
  for (const it of items || []) {
    if (!it || !CELL_KEYS.includes(it.cell) || !KINDS.includes(it.kind)) { errors.push(it && it.cell); continue; }
    let value = String(it.value ?? '').trim().slice(0, 500);
    if (it.cell === 'about.age' && it.kind === 'fact') value = (ageMention(value) || {}).range || ageRange(value) || value;
    const cur = c.cells[it.cell];
    if (cur && cur.kind === 'fact' && (it.kind === 'hypothesis' || it.kind === 'unknown')) continue; // догадка не затирает факт
    if (cur && cur.kind === it.kind && normText(cur.v) === normText(value)) continue;
    if (cur && cur.src === 'client' && src !== 'client') continue; // уточнение клиента важнее импорта
    c.cells[it.cell] = { v: value, kind: it.kind, src: ['dict', 'md', 'manual', 'client'].includes(src) ? src : 'md', at: now, ver: ((cur && cur.ver) || 0) + 1 }; n++;
  }
  syncFromCells(c);
  const before = new Set((card.interests || []).map(low)); const add = [];
  for (const k of ['interests.time', 'interests.subject', 'interests.memory']) { const x = c.cells[k]; if (x && x.kind === 'fact') for (const t of tagsFrom(x.v)) if (!before.has(low(t)) && !add.includes(t)) add.push(t); }
  c.interests = [...(card.interests || []), ...add].slice(0, 12);
  const changed = [];
  const W = ['один', 'два', 'три', 'четыре'];
  if (add.length) changed.push(`${add.length === 1 ? 'Добавлен' : add.length < 5 ? 'Добавлены' : 'Добавлено'} ${W[add.length - 1] || add.length} ${plural(add.length, ['интерес', 'интереса', 'интересов'])}`);
  if (n) changed.push(`Обновлено ${n} ${plural(n, ['ячейка', 'ячейки', 'ячеек'])} круга`);
  return { card: c, changed, n, errors };
}

// ---------- каталог и подбор ----------
// факты статьи журнала: «Повторить», «Подготовка», «Гости», «Стоимость» → понятное описание предложения
export function articleFacts(html) {
  const out = {}; const re = /<dt>([^<]+)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g; let m;
  while ((m = re.exec(String(html || '')))) out[m[1].trim()] = m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return out;
}
export const CATALOG_HIDE = new Set(['cars-rolls-starlight']);
export const journalUrl = (id) => `/journal/a/${id}/`;
export function catalogFromContent(content) {
  return Object.entries((content && content.articles) || {}).filter(([id]) => !CATALOG_HIDE.has(id)).map(([id, a]) => { const f = articleFacts(a.facts);
    return {
      id, title: a.title, themes: DIR_THEMES[a.dir] || [a.dir], format: 'journal', region: a.geo || '', online: false, terms: '', cost: f['Стоимость'] || '', dates: f['Подготовка'] || '', deadline: '',
      verifiedAt: '', status: (a.status || 'published') === 'published' ? 'available' : 'idea', deliver: f['Повторить'] || a.hook || '', guests: f['Гости'] || '', hook: a.hook || '', url: journalUrl(id), confirmBy: 'Orbiq', prepDays: 14,
    }; });
}
export function cleanItem(x) {
  const s = (v, n) => String(v ?? '').trim().slice(0, n); const id = s(x.id, 80).replace(/[^a-z0-9_-]/gi, '');
  if (!id || !s(x.title, 200)) return null;
  return { id, title: s(x.title, 200), themes: (Array.isArray(x.themes) ? x.themes : []).map(t => s(t, 40)).filter(Boolean).slice(0, 10), format: s(x.format, 40), region: s(x.region, 120), online: !!x.online,
    terms: s(x.terms, 500), cost: s(x.cost, 120), dates: s(x.dates, 120), deadline: /^\d{4}-\d{2}-\d{2}$/.test(x.deadline || '') ? x.deadline : '', verifiedAt: s(x.verifiedAt, 30),
    status: x.status === 'idea' ? 'idea' : 'available', deliver: s(x.deliver, 300), confirmBy: s(x.confirmBy || 'Orbiq', 80), cover: /^(\/[^\s]*|https:\/\/[^\s]+)$/.test(String(x.cover || '')) ? s(x.cover, 300) : '', next: s(x.next, 200), url: /^(\/[^\s]*|https:\/\/[^\s]+)$/.test(String(x.url || '')) ? s(x.url, 300) : '', guests: s(x.guests, 80), hook: s(x.hook, 400), prepDays: Math.max(0, Math.min(180, parseInt(x.prepDays ?? 14, 10) || 0)) };
}
const STOP = new Set(['котор', 'потом', 'всего', 'очень', 'много', 'сейча', 'хочет', 'хотел', 'обычн', 'компа', 'котор', 'после', 'перед', 'между', 'также', 'тольк', 'когда', 'можно', 'будет', 'своих', 'своим', 'своей', 'этого', 'этому']);
const stems = (t) => new Set(normText(t).split(' ').filter(w => w.length >= 5).map(w => w.slice(0, 5)).filter(w => !STOP.has(w)));
const lcFirst = (s) => { const t = String(s || '').trim().replace(/[.!]+$/, ''); return t ? t[0].toLowerCase() + t.slice(1) : t; };
export function qid(kind, key) { return 'q' + fnv(kind + '|' + key).toString(36); }

export function matchCard(card, catalog, now = Date.now(), signals = {}) {
  const today = isoDay(now); const cells = card.cells || {}; const qstate = card.qstate || {};
  const hidden = new Set([...(signals.hide || []), ...((card.clientSignals || {}).hide || [])]);
  const less = new Set([...(signals.less || []), ...((card.clientSignals || {}).less || [])]);
  const reqs = (card.requests || []).filter(r => r.status === 'open');
  const tags = card.interests || [];
  const planFacts = ['plans.next', 'plans.timing', 'plans.asked', 'business.project'].map(k => cells[k]).filter(x => x && x.kind === 'fact');
  const interestFacts = ['interests.time', 'interests.subject', 'interests.memory'].map(k => cells[k]).filter(x => x && x.kind === 'fact');
  const noThemes = new Set(); const no = cells['prefs.no']; if (no && no.kind === 'fact') for (const t of tagsFrom(no.v)) for (const th of TAG_THEMES[t] || []) noThemes.add(th);
  const items = [];
  for (const it of catalog || []) {
    if (it.status !== 'available' || hidden.has(it.id)) continue;
    if (it.deadline && it.deadline < today) continue; // просроченное скрываем
    const th = new Set(it.themes || []); if ([...th].some(x => noThemes.has(x))) continue;
    let score = 0, why = '', basis = '', reason = '', cw = '';
    for (const r of reqs) if ((CAT_THEMES[r.cat] || []).some(x => th.has(x))) { score += 30; if (!why) { why = `связано с запросом «${r.text}»`; basis = `вам нужно: ${lcFirst(r.text)}`; reason = 'request'; cw = `Связано с вашим запросом: ${CATS[r.cat] || 'Другое'}`; } }
    for (const t of tags) if ((TAG_THEMES[t] || []).some(x => th.has(x))) { score += 20; if (!why) { why = `связано с интересом «${t}»`; cw = `Связано с вашим интересом «${t}»`; const f = interestFacts.find(x => tagsFrom(x.v).includes(t)); basis = f ? lcFirst(f.v) : `вам интересно: ${low(t)}`; reason = 'interest'; } }
    const its = stems(it.title + ' ' + (it.deliver || ''));
    for (const f of planFacts) if ([...stems(f.v)].some(w => its.has(w))) { score += 10; if (!why) { why = `связано с фактом «${f.v}»`; basis = lcFirst(f.v); reason = 'plan'; cw = 'Связано с вашими планами'; } else if (reason !== 'plan') reason = reason + '+plan'; }
    if (!score) continue;
    if (less.has(it.id)) score -= 15;
    items.push({ itemId: it.id, title: it.title, why, deliver: it.deliver || it.terms || '', confirmBy: it.confirmBy || 'Orbiq', deadline: it.deadline || '', score, reason, basis, cw, prepDays: it.prepDays ?? 14 });
  }
  items.sort((a, b) => b.score - a.score || (a.deadline || '9999') .localeCompare(b.deadline || '9999') || a.itemId.localeCompare(b.itemId));
  // вопросы: окно возможности → план → уточнение гипотезы; при равенстве раньше ближайшая дата
  const qs = [];
  for (const m of items.slice(0, 20)) {
    const dl = m.deadline; let date = today;
    if (dl) { const d = isoDay(Date.parse(dl) - m.prepDays * 864e5); date = d > today ? d : today; }
    const group = dl ? 0 : /plan/.test(m.reason) ? 1 : 1.5;
    const text = `${card.alias}, вы как-то рассказывали, что ${m.basis}. Я вспомнил об этом, когда увидел «${m.title}».${dl ? ` До ${ruDate(dl)} это еще можно успеть.` : ''} Вам было бы интересно?`;
    qs.push({ id: qid('offer', m.itemId), kind: 'offer', itemId: m.itemId, text, basis: m.why, date, deadline: dl, group, score: m.score, yes: 'Отправить запрос через Orbiq' });
  }
  for (const k of CELL_KEYS) {
    const c = cells[k]; if (!c || !meaningful(c.v)) continue;
    if (c.kind === 'hypothesis') qs.push({ id: qid('clarify', k + '|' + normText(c.v)), kind: 'clarify', cell: k, text: `Уточнение интереса: ${lcFirst(c.v)}. Это так?`, basis: 'догадка, требует подтверждения', date: today, deadline: '', group: 2, score: 0, topic: c.v, yes: 'Отметить как факт' });
    else if (c.kind === 'fact' && k.startsWith('business.') && /инвест|вложил|совладел/.test(low(c.v)))
      qs.push({ id: qid('clarify', k + '|' + normText(c.v)), kind: 'clarify', cell: k, text: `Вы вкладывали в эту отрасль: ${lcFirst(c.v)}. Интересна ли она вам лично сегодня?`, basis: 'инвестиция в отрасль еще не означает личный интерес', date: today, deadline: '', group: 2, score: 0, topic: c.v, yes: 'Если нет предложения, появится задача на поиск' });
  }
  qs.sort((a, b) => a.group - b.group || a.date.localeCompare(b.date) || b.score - a.score || a.id.localeCompare(b.id));
  const out = []; let nowN = 0; const seen = new Set();
  for (const q of qs) {
    if (seen.has(q.id)) continue; seen.add(q.id); if (out.length >= 30) break;
    const st = qstate[q.id]; let bucket;
    if (st && (st.state === 'done' || st.state === 'asked')) bucket = 'done';
    else if (st && st.state === 'later' && (!st.returnAfter || st.returnAfter > today)) bucket = 'later';
    else if (nowN < 3 && q.date <= today) { bucket = 'now'; nowN++; } else bucket = 'later';
    const { group, score, ...rest } = q; out.push({ ...rest, bucket, answer: st && st.answer ? st.answer : undefined });
  }
  return { items: items.slice(0, 12).map(({ score, reason, basis, prepDays, cw, ...x }) => x), questions: out, clientWhy: Object.fromEntries(items.map(x => [x.itemId, x.cw])) };
}
// клиентская лента: только факты, без заметок и гипотез; скрытое исчезает сразу, «меньше такого» уходит вниз
export function feedFor(card, catalog, prefs = {}, now = Date.now(), opts = {}) {
  const today = isoDay(now); const hide = new Set(prefs.hide || []), less = new Set(prefs.less || []), like = new Set(prefs.like || []), want = new Set(prefs.want || []);
  const base = card ? { ...card, cells: Object.fromEntries(Object.entries(card.cells || {}).filter(([, v]) => v.kind === 'fact')), qstate: {}, clientSignals: {} } : null;
  const mm = base ? matchCard(base, catalog, now, { hide: [...hide] }) : { items: [], clientWhy: {} }; const m = mm.items.map(x => x.itemId);
  const likedThemes = new Set(); for (const it of catalog) if (like.has(it.id) || want.has(it.id)) for (const t of it.themes || []) likedThemes.add(t);
  const avail = catalog.filter(it => it.status === 'available' && !hide.has(it.id) && !(it.deadline && it.deadline < today));
  const rank = (it) => { const i = m.indexOf(it.id); let s = i >= 0 ? 1000 - i * 10 : 0; if ((it.themes || []).some(t => likedThemes.has(t))) s += 50; if (like.has(it.id)) s += 100; if (less.has(it.id)) s -= 2000; return s; };
  const items = avail.map(it => [it, rank(it)]).sort((a, b) => b[1] - a[1] || a[0].id.localeCompare(b[0].id)).map(([it]) => it.id);
  const themes = []; for (const id of items) { const it = avail.find(x => x.id === id); for (const t of it.themes || []) if (!themes.includes(t)) themes.push(t); }
  const why = {}; for (const id of items.slice(0, 6)) if (mm.clientWhy[id]) why[id] = mm.clientWhy[id];
  // карточки предложений каталога, которых нет среди статей журнала
  const jids = opts.journalIds || new Set(); const cards = {};
  for (const id of items) { if (jids.has(id)) continue; const it = avail.find(x => x.id === id);
    cards[id] = { id, title: it.title, ...(it.cover ? { cover: it.cover } : {}), terms: it.terms || it.deliver || '', cost: it.cost || '', deadline: it.deadline || '', next: it.next || (it.online ? 'Перейти к организатору' : 'Запрос партнеру Orbiq') }; }
  return { items, themes, matched: m.length, why, cards };
}

// ---------- свободный текст → все поля карточки (резерв без модели) ----------
const NUMW = { 'один': 1, 'одна': 1, 'одного': 1, 'двое': 2, 'два': 2, 'две': 2, 'двух': 2, 'трое': 3, 'три': 3, 'трех': 3, 'четверо': 4, 'четыре': 4, 'пятеро': 5, 'пять': 5 };
export const CAT_RE = [
  ['citizenship', /гражданств|внж|вид на жительство|паспорт|резидентств|golden visa|виз[аыу]/], ['realty', /недвижим|вилл|квартир|апартамент|(^|[^а-я])дом(а|у)?([^а-я]|$)|участок/],
  ['watches', /часы|часов(ой|ые)|часовщ/], ['preipo', /pre-?ipo|ipo|стартап|венчур|акци/], ['finance', /перевод|счет в банке|банк|финанс|кредит|деньги за рубеж/],
  ['security', /охран|безопасн/], ['health', /клиник|здоров|лечен|медиц|обследован|чекап/], ['education', /школ|университет|образован|учеб|поступ/],
  ['aviation', /яхт|самолет|джет|вертолет/], ['art', /искусств|картин|галере|художник/], ['legal', /наслед|завещ|юрист|траст|структурир|фонд семь/],
  ['digital', /сайт|цифров|кибер|it-|айти/], ['travel', /путешеств|поездк|тур[ау ]|отдых|отел|сафари|экспедиц/],
];
export const catOf = (t) => { const s = low(t); const m = CAT_RE.find(([, re]) => re.test(s)); return m ? m[0] : 'other'; };
export function capitalRange(n) { return n < 1 ? '<1' : n < 3 ? '1–3' : n < 10 ? '3–10' : n < 25 ? '10–25' : n < 100 ? '25–100' : '100+'; }
const sentencesOf = (text) => String(text || '').split(/\r?\n|(?<=[.!?;])\s+/).map(s => s.replace(/^[-*•#\s]+/, '').trim()).filter(s => s.length > 2);
const MONTHS = 'январ|феврал|март|апрел|мая|май|июн|июл|август|сентябр|октябр|ноябр|декабр';
const YWORD = { 'год': 1, 'два': 2, 'двух': 2, 'три': 3, 'трех': 3, 'четыре': 4, 'пять': 5, 'шесть': 6, 'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10, 'пятнадцать': 15, 'двадцать': 20, 'тридцать': 30 };
// «знакомы 8 лет», «лет 10 знаем друг друга», «работаем с 2018», «знакомы с 2015» → сколько лет знакомы
export function yearsKnown(t, now = Date.now()) {
  const Y = new Date(now).getUTCFullYear(); let m;
  if (!/знаком|знаем|работаем|сотруднича|дружим|общаемся|ведем|ведём|клиент/.test(t)) return null;
  if ((m = /(?:с|со)\s+(19\d{2}|20\d{2})(?:\s*г(?:ода|\.)?)?/.exec(t)) && /знаком|знаем|работаем|сотруднича|дружим|общаемся|ведем|клиент/.test(t)) { const y = +m[1]; if (y <= Y && y > Y - 80) return Y - y; }
  if ((m = /познакомились\s+(?:в\s+)?(19\d{2}|20\d{2})/.exec(t))) { const y = +m[1]; if (y <= Y) return Y - y; }
  if ((m = /(\d{1,2})\s*(?:лет|года?)\s*(?:знаем|знакомы|работаем|сотруднича|дружим|общаемся)/.exec(t)) || (m = /(?:знакомы|знаем друг друга|работаем вместе|работаем|сотрудничаем|дружим|общаемся)\s*(?:уже|около|примерно|больше|более)?\s*(\d{1,2})\s*(?:лет|года?)/.exec(t)) || (m = /лет\s*(\d{1,2})\s*(?:знаем|знакомы|работаем|дружим)/.exec(t))) return +m[1];
  if ((m = /(?:знакомы|знаем друг друга|работаем|дружим)\s*(?:уже|около|примерно|больше|более)?\s*(?:лет\s+)?(год|два|двух|три|трех|четыре|пять|шесть|семь|восемь|девять|десять|пятнадцать|двадцать|тридцать)(?:\s+лет)?/.exec(t)) || (m = /лет\s+(десять|пять|семь|восемь|девять|пятнадцать|двадцать|тридцать)\s*(?:знаем|знакомы|работаем|дружим)?/.exec(t))) return YWORD[m[1]];
  return null;
}
export function heuristicFields(text, now = Date.now()) {
  const fields = {}; const requests = []; const ss = sentencesOf(text); let ageBest = {};
  for (const s of ss) {
    const t = low(s);
    { const a = ageMention(s); if (a && a.score > (ageBest.score || 0)) { ageBest = a; fields.age = a.range; } }
    if (!fields.capital && /капитал|состояни|активы|стоит|оценива|млн|млрд|миллион|миллиард/.test(t)) {
      let n = null; const m = /(\d+(?:[.,]\d+)?)\s*(млрд|миллиард|млн|миллион|m\b|mln)/.exec(t);
      if (m) n = parseFloat(m[1].replace(',', '.')) * (/млрд|миллиард/.test(m[2]) ? 1000 : 1); else if (/миллиард/.test(t)) n = 1000;
      if (n != null && /капитал|состояни|актив|оценива|стоит|личн/.test(t)) { fields.capital = capitalRange(n); if (!fields.capitalBasis) fields.capitalBasis = s.slice(0, 300); }
    }
    if (!fields.capitalBasis && /продал (бизнес|долю|компан)|доля в|оценка (капитала|состояния)|владеет долей|выплат.*дивиденд/.test(t)) fields.capitalBasis = s.slice(0, 300);
    if (fields.kids == null) {
      if (/детей нет|без детей|нет детей/.test(t)) fields.kids = 0;
      else { const m = /(\d+|один|одна|двое|два|две|трое|три|четверо|четыре|пятеро|пять)\s*(дет|ребен|сын|доч|внук)/.exec(t); if (m) fields.kids = /^\d+$/.test(m[1]) ? +m[1] : NUMW[m[1]];
        else if (/(сын|дочь|дочка)\s+и\s+(сын|дочь|дочка)/.test(t)) fields.kids = 2; else if (/(^|[^а-я])(есть сын|есть дочь|его сын|его дочь|сын учится|дочь учится)/.test(t)) fields.kids = 1; }
    }
    if (!fields.investing) { if (/активно инвест|регулярно инвест|постоянно инвест/.test(t)) fields.investing = 'active'; else if (/иногда инвест|время от времени инвест|изредка/.test(t)) fields.investing = 'sometimes'; else if (/не инвест|сейчас не вкладыва|инвестиции на паузе/.test(t)) fields.investing = 'no'; }
    if (/ищет|хочет|нужн|нужен|просил|запрос|планирует (купить|получить|переех|оформ)|подбира|интересуется покупк|думает о покупк/.test(t) && !/не предлага|не хочет/.test(t))
      requests.push({ cat: catOf(s), text: s.replace(/[.;]+$/, '').slice(0, 200) });
    const r = fields.relation || {};
    if (!r.role && /(мой|моя|наш) (клиент|друг|знаком|партнер|сосед|коллег)|знаком(ы|ились|илась|ился)?( с| по| через|ство)|познакомил|через (общих |общего )?(друз|знаком|коллег|партнер|клуб)|друг семьи|бывш[а-я]* коллег|покупал у (меня|нас)|работали вместе|клиент (по|с)/.test(t)) r.role = s.replace(/[.;]+$/, '').slice(0, 200);
    if (!r.lastContact && /общал|виделись|встречал|созванивал|разговаривал|последний раз|писал|переписыва/.test(t)) {
      const m = new RegExp(`((${MONTHS})[а-я]*(\\s+\\d{4})?|\\d{4}|на прошлой неделе|на этой неделе|вчера|недавно|в прошлом месяце|в этом месяце|месяц назад)`).exec(t);
      if (m) r.lastContact = m[1].slice(0, 40);
      else { const k = /(последний раз [а-я]+|виделись|общались|созванивались|встречались)\s+(.+)/.exec(t); if (k) r.lastContact = k[2].replace(/[.;,].*$/, '').slice(0, 40); }
    }
    if (!r.topic) { const m = /(обсуждали|говорили о|говорили об|говорили про|разговор (о|про)|советовался (о|по)|по поводу|по вопросу)\s+(.+)/.exec(s.toLowerCase().replace(/ё/g, 'е')); if (m) r.topic = m[m.length - 1].replace(/[.;]+$/, '').slice(0, 200); }
    if (r.years == null) { const y = yearsKnown(t, now); if (y != null) r.years = y; }
    if (!r.isClient) { if (/не (наш|мой) клиент|не покупал|не платил|пока не клиент/.test(t)) r.isClient = 'no'; else if (/(наш|мой|моя|наша) (клиент|клиентка)|покупал у (нас|меня)|покупала у (нас|меня)|платил (за|нам|мне)|оплачивал|заказывал у (нас|меня)|клиент (нашей|моей|компании)|является клиентом/.test(t)) r.isClient = 'yes'; }
    if (r.role || r.lastContact || r.topic || r.years != null || r.isClient) fields.relation = { role: r.role || '', lastContact: r.lastContact || '', topic: r.topic || '', ...(r.years != null ? { years: r.years } : {}), ...(r.isClient ? { isClient: r.isClient } : {}) };
  }
  const tags = new Set(); for (const s of ss) if (/увлека|любит|хобби|интересуется|коллекц|в свободное время|страсть/.test(low(s)) && !/не любит/.test(low(s))) for (const g of tagsFrom(s)) tags.add(g);
  // списки через запятую после «любит / увлекается / интересуется / интересы / хобби» берем как есть: «вина, регаты»
  const listed = [];
  for (const s0 of ss) { const m = /(?:любит|увлекается|интересуется|интересы|хобби)\s*[:—-]?\s*([^.;!?]+)/i.exec(s0); if (!m || !m[1].includes(',') || /не любит/i.test(s0)) continue;
    for (const it of m[1].split(/,|\s+и\s+/)) { const x = it.trim().replace(/^(очень|особенно|также|еще)\s+/i, '').slice(0, 40); if (x.length >= 3 && !/\d{3,}/.test(x)) listed.push(x[0].toUpperCase() + x.slice(1)); } }
  if (listed.length) fields.interests = [...new Set(listed)].slice(0, 8);
  else if (tags.size) fields.interests = [...tags].slice(0, 12);
  const seen = new Set(); const reqs = requests.filter(x => { const k = normText(x.text); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 10);
  return { fields, requests: reqs };
}
// поля от модели или правил → только допустимые значения
export function cleanFields(f = {}) {
  const out = {}; const s = (v, n) => String(v ?? '').trim().slice(0, n);
  if (f.age) { const a = AGES.includes(f.age) ? f.age : ageRange(f.age); if (a) out.age = a; }
  if (f.capital) { let c = CAPS.includes(f.capital) ? f.capital : ''; if (!c) { const m = /(\d+(?:[.,]\d+)?)/.exec(String(f.capital)); if (m) c = capitalRange(parseFloat(m[1].replace(',', '.'))); } if (c) out.capital = c; }
  if (f.kids !== undefined && f.kids !== null && f.kids !== '') { const n = Number(f.kids); if (Number.isInteger(n) && n >= 0 && n <= 20) out.kids = n; }
  if (INVESTING.includes(f.investing)) out.investing = f.investing;
  if (Array.isArray(f.interests)) { const a = [...new Set(f.interests.map(x => s(x, 40)).filter(Boolean))].slice(0, 12); if (a.length) out.interests = a; }
  if (f.relation && typeof f.relation === 'object') { const rr = cleanRelation(f.relation); const r = { role: s(f.relation.role, 200), lastContact: s(f.relation.lastContact, 40), topic: s(f.relation.topic, 200) }; if (!rr.error && rr.years !== null) r.years = rr.years; if (!rr.error && rr.isClient !== 'unknown') r.isClient = rr.isClient; if (r.role || r.lastContact || r.topic || 'years' in r || 'isClient' in r) out.relation = r; }
  if (s(f.capitalBasis, 1000)) out.capitalBasis = s(f.capitalBasis, 1000);
  return out;
}
export const cleanRequests = (rs) => (Array.isArray(rs) ? rs : []).map(r => ({ cat: CATS[r && r.cat] ? r.cat : catOf(r && r.text), text: String((r && r.text) || '').trim().slice(0, 200) })).filter(r => r.text).slice(0, 10);
// недостающие блоки готовности с вопросами (SPEC-v2)
export function missingFor(card, fields = {}, cells = [], requests = []) {
  return readiness(card, fields, cells, requests).blocks.filter(b => !b.ok).map(b => ({ key: b.id, title: b.title, q: b.q.join(' ') }));
}

// ---------- профиль продукта партнера (SPEC-v2 §3) ----------
const money = (t) => { const out = []; const re = /(\$|usd|€|eur)?\s*(\d[\d\s]{0,9}(?:[.,]\d+)?)\s*(тыс\.?|тысяч|k|к|млн|миллион[а-я]*)?\s*(\$|usd|долл[а-я]*|€|евро)?/gi; let m;
  while ((m = re.exec(t))) { const cur = m[1] || m[4]; const mult = m[3]; if (!cur && !mult) continue; let n = parseFloat(m[2].replace(/\s/g, '').replace(',', '.')); if (!Number.isFinite(n) || n <= 0) continue;
    if (mult && /тыс|k|к/i.test(mult)) n *= 1000; else if (mult && /млн|миллион/i.test(mult)) n *= 1e6; if (!cur && n < 1000) continue; out.push(Math.round(n)); } return out; };
export function cleanProduct(x = {}) {
  const s = (v, n) => scrubPII(String(v ?? '')).text.trim().slice(0, n);
  const e = x.typicalEarnPerClient || {}; const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n < 1e9 ? Math.round(n) : null; };
  let min = num(e.min), max = num(e.max); if (min != null && max != null && min > max) [min, max] = [max, min];
  return { summary: s(x.summary, 600), whoNeeds: s(x.whoNeeds, 400), fitSignals: [...new Set((Array.isArray(x.fitSignals) ? x.fitSignals : []).map(v => s(v, 60)).filter(Boolean))].slice(0, 12),
    categories: [...new Set((Array.isArray(x.categories) ? x.categories : []).filter(c => CATS[c]))].slice(0, 5), typicalEarnPerClient: { min, max, currency: 'USD' } };
}
export function heuristicProduct(text) {
  const clean = scrubPII(text).text; const ss = sentencesOf(clean); const t = low(clean);
  const cats = []; for (const [c, re] of CAT_RE) if (re.test(t) && !cats.includes(c)) cats.push(c);
  const who = ss.find(x => /для (тех|клиент|семей|людей|владельц|предпринимател|состоятельн)|подходит|нужно тем|тем, кто/.test(low(x))) || '';
  const sig = [...new Set([...tagsFrom(clean), ...cats.map(c => CATS[c])])];
  const earnS = ss.find(x => /зарабат|комисси|доход|вознагражд|чек|с клиента|за клиента/.test(low(x)));
  const nums = money(low(earnS || '')); const all = nums.length ? nums : [];
  return cleanProduct({ summary: ss.slice(0, 2).join(' '), whoNeeds: who, fitSignals: sig, categories: cats.slice(0, 3),
    typicalEarnPerClient: { min: all.length ? Math.min(...all) : null, max: all.length ? Math.max(...all) : null } });
}

// ---------- досье и подборка под продукт (SPEC-v2 §4) ----------
const INDUSTRY = [[/фарм|аптек|лекарств/, 'фармацевтика'], [/дистрибуц|оптов/, 'дистрибуция'], [/строит|девелоп|застрой/, 'строительство и девелопмент'], [/нефт|газ|энергет/, 'энергетика'],
  [/ритейл|магазин|торгов/, 'торговля'], [/(^|[^а-я])it([^a-z]|$)|софт|программ|разработк|айти/, 'IT'], [/логист|перевоз|транспорт/, 'логистика'], [/производ|завод|фабрик/, 'производство'],
  [/агро|сельск|ферм|зерн/, 'агробизнес'], [/медиц|клиник|стоматолог/, 'медицина'], [/банк|финанс|инвестиц/, 'финансы и инвестиции'], [/ресторан|кафе|общепит/, 'ресторанный бизнес'],
  [/недвиж|аренд/, 'недвижимость'], [/металл|добыч|горнодоб/, 'металлургия и добыча'], [/автомоб|автосалон|дилер/, 'автобизнес'], [/медиа|реклам/, 'медиа и реклама']];
const REGIONS = [[/краснодар|ростов|сочи|крым|ставропол|кубан|юг/, 'юг России'], [/москв|подмосков|тул|калуг|рязан|ярослав|твер|владимир/, 'центр России'], [/петербург|питер|ленинград|карел|мурманск|архангел|калинингр/, 'северо-запад России'],
  [/казан|татарст|самар|нижн|поволж|уф[аеу]|башкир|саратов|волгоград|пенз|ульянов/, 'Поволжье'], [/екатеринб|челябин|урал|тюмен|перм|сургут|ханты|ямал/, 'Урал'], [/новосиб|омск|томск|красноярск|иркутск|сибир|барнаул|кемеров/, 'Сибирь'],
  [/владивосток|хабаров|дальн|сахалин|камчат|якут/, 'Дальний Восток'], [/дуба|оаэ|эмират|абу-даби/, 'ОАЭ'], [/кипр|испан|итал|франц|герман|европ|португал|черногор|лондон|англи|швейцар/, 'Европа'], [/казахст|алмат|астан|узбек|ташкент|кыргыз|бишкек/, 'Центральная Азия'], [/таиланд|бали|индонез|сингапур|вьетнам|ази/, 'Азия']];
const ROLE = [[/собственник|владел|основал|основатель|совладел|свой бизнес/, 'собственник бизнеса'], [/генеральн|директор|руковод|ceo/, 'руководитель'], [/инвестор|инвестирует/, 'инвестор'], [/партнер в|управляющ/, 'управляющий партнер']];
const pick = (list, t) => { const o = []; for (const [re, v] of list) if (re.test(t) && !o.includes(v)) o.push(v); return o; };
// структурированная основа досье: только укрупненные сведения из подтвержденных фактов
export function dossierBase(card) {
  const cells = card.cells || {}; const fact = (k) => { const x = cells[k]; return x && x.kind === 'fact' ? low(x.v) : ''; };
  const biz = [fact('business.source'), fact('business.now'), fact('business.project')].join(' ');
  return { age: card.age || '', capital: card.capital || '', industry: pick(INDUSTRY, biz).slice(0, 2), role: pick(ROLE, biz)[0] || '', region: pick(REGIONS, fact('about.region') + ' ' + fact('about.places'))[0] || '',
    interests: [...(card.interests || [])].slice(0, 4), kids: card.kids ?? null };
}
export function dossierText(b) {
  const out = [];
  const who = b.role ? b.role[0].toUpperCase() + b.role.slice(1) : 'Предприниматель';
  out.push(`${who}${b.age ? `, ${b.age} лет` : ''}${b.industry.length ? `, ${b.industry.join(' и ')}` : ''}.`);
  if (b.capital) out.push(`Личный капитал в диапазоне $${b.capital} млн.`);
  if (b.region) out.push(`Живет и ведет дела: ${b.region}.`);
  if (b.interests.length) out.push(`Интересы: ${b.interests.map(x => low(x)).join(', ')}.`);
  return out.slice(0, 4).join(' ');
}
// подборка сетевых карточек под продукт; requests — уже отфильтрованные для зрителя (с учетом 72 часов)
export function fitRows(cards, product, leadByOf = () => 'партнер') {
  const pr = cleanProduct(product || {}); const sig = pr.fitSignals.map(low); const pcats = new Set(pr.categories);
  const earn = pr.typicalEarnPerClient; const rows = []; let tmin = 0, tmax = 0;
  for (const { card, requests } of cards) {
    const why = []; let score = 0; let hasRequest = false; let reqAt = ''; let reqText = ''; let reqBrief = null; let reqId = '';
    for (const r of requests || []) if (pcats.has(r.cat)) { hasRequest = true; score += 30; why.push(`Открытый запрос: ${CATS[r.cat]}`); if (r.at && (!reqAt || r.at > reqAt)) { reqAt = r.at; reqText = r.text || ''; reqBrief = r.brief || null; reqId = r.id; } }
    for (const tag of card.interests || []) { const t = low(tag); const th = TAG_THEMES[tag] || []; if (sig.some(s => s.includes(t) || t.includes(s)) || [...pcats].some(c => (CAT_THEMES[c] || []).some(x => th.includes(x)))) { score += 10; why.push(`Интерес: ${low(tag)}`); } }
    if (!hasRequest) continue; // в лиды попадают только клиенты с запросом на продукт
    const potential = earn.min != null || earn.max != null ? { min: earn.min ?? earn.max, max: earn.max ?? earn.min } : null;
    if (potential) { if (hasRequest) tmin += potential.min; tmax += potential.max; }
    rows.push({ cid: card.id, alias: card.alias, age: card.age || '', capital: card.capital || '', dossier: dossierText(dossierBase(card)), whyFit: [...new Set(why)].slice(0, 3).join('; '), potential, hasRequest, reqAt, reqText, reqBrief, reqId, leadBy: leadByOf(card), score });
  }
  rows.sort((a, b) => (b.reqAt || '').localeCompare(a.reqAt || '') || b.score - a.score || a.alias.localeCompare(b.alias));
  return { total: rows.length, potential: earn.min != null || earn.max != null ? { min: tmin, max: tmax } : null, rows: rows.map(({ score, ...r }) => r) };
}
