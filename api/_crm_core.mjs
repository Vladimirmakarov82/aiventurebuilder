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
export const QUAL_MIN = 15, QUAL_DENOM = 18, PF_NEED = 30, SEATS_MAX = 2, TRIAL_QUOTA = 3;
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
  if ('relation' in patch) { const r = patch.relation || {}; out.relation = { role: str(r.role, 200), lastContact: str(r.lastContact, 40), topic: str(r.topic, 200) }; }
  if ('requests' in patch) {
    if (!Array.isArray(patch.requests) || patch.requests.length > 20) return { error: 'Запросы: список до 20' };
    const prev = Object.fromEntries((card.requests || []).map(r => [r.id, r])); const seen = new Set(); const reqs = [];
    for (const r of patch.requests) {
      if (!r || !CATS[r.cat]) return { error: 'Запрос: выберите категорию' };
      const text = str(r.text, 300); if (!text) return { error: 'Запрос: короткая формулировка' };
      const status = r.status === 'closed' ? 'closed' : 'open';
      let id = /^r[A-Za-z0-9_-]{1,20}$/.test(r.id || '') && !seen.has(r.id) ? r.id : newId(); seen.add(id);
      const p = prev[id];
      reqs.push({ id, cat: r.cat, text, status, at: (p && p.at) || new Date().toISOString(), public: r.public === false ? false : true });
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
export function networkView(c) {
  const pt = c.publicText || {};
  return {
    id: c.id, alias: c.alias, age: c.age || '', capital: c.capital || '', kids: c.kids ?? null, investing: c.investing || '',
    interests: (c.interests || []).filter(x => !hasContacts(x)),
    requests: (c.requests || []).filter(r => r.status === 'open' && r.public === true).map(r => ({ id: r.id, cat: r.cat, text: pt[r.id] || '' })),
    mine: false,
  };
}
export function ownRow(c, next) {
  return { id: c.id, alias: c.alias, age: c.age || '', capital: c.capital || '', kids: c.kids ?? null, investing: c.investing || '', interests: [...(c.interests || [])],
    requests: (c.requests || []).map(r => ({ id: r.id, cat: r.cat, text: r.text, status: r.status, public: r.public })), stage: c.stage || 'draft',
    circle: (({ filled, applicable, pct, label }) => ({ filled, applicable, pct, label }))(circle(c)), next: next || null, updated: c.updated, mine: true };
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
export function effTier(p, now = Date.now()) {
  if (!p) return null;
  if (p.tier === 'trial') return p.trial && p.trial.end && Date.parse(p.trial.end) < now ? 'trial_expired' : 'trial';
  if (p.tier === 'paid') {
    const pd = p.paid || {};
    if (pd.end && Date.parse(pd.end) < now) return 'paid_ended';
    if (pd.pay2Due && !pd.pay2 && Date.parse(pd.pay2Due) < now) return 'paid_hold';
    return 'paid';
  }
  return 'candidate';
}
const OWN = ['crm.own', 'notes', 'tasks', 'demand', 'rq.read', 'pf.submit', 'tg'];
export const MATRIX = {
  candidate: [...OWN],
  trial: [...OWN, 'net.view', 'rq.create', 'catalog'],
  trial_expired: [...OWN],
  paid: [...OWN, 'net.view', 'rq.create', 'catalog', 'invite.create'],
  paid_hold: [...OWN, 'net.view', 'rq.create', 'catalog'],
  paid_ended: [...OWN],
  owner: ['net.view', 'net.full', 'owner.admin', 'notes', 'catalog', 'tg'],
};
// запрет по умолчанию: неизвестная роль, тариф или операция → false
export function can(role, tier, suspended, op) {
  if (suspended) return false;
  if (role === 'owner') return MATRIX.owner.includes(op);
  if (role === 'partner') return (MATRIX[tier] || []).includes(op);
  return false;
}

// ---------- квота знакомств и места ----------
export function introUse(p, rid) {
  if (p.tier !== 'trial') return { err: p.tier === 'paid' ? 'paid' : 'tier' };
  const t = { quota: TRIAL_QUOTA, used: 0, intros: [], ...(p.trial || {}) }; t.intros = t.intros || [];
  if (t.intros.includes(rid)) return { already: true, p };
  if (t.used >= t.quota) return { err: 'quota' };
  return { p: { ...p, trial: { ...t, used: t.used + 1, intros: [...t.intros, rid] } } };
}
export function seatTake(doc, pid, at, max = SEATS_MAX) {
  const d = { taken: [], wait: [], ...(doc || {}) };
  if (d.taken.some(x => x.pid === pid)) return { doc: d, already: true };
  if (d.taken.length >= max) return { err: 'full', doc: { ...d, wait: d.wait.includes(pid) ? d.wait : [...d.wait, pid] } };
  return { doc: { ...d, taken: [...d.taken, { pid, since: at }], wait: d.wait.filter(x => x !== pid) } };
}
export function seatFree(doc, pid) { const d = { taken: [], wait: [], ...(doc || {}) }; return { ...d, taken: d.taken.filter(x => x.pid !== pid) }; }

// ---------- зачет карточки и выборка ----------
export function qualifyCard(card, partner, cardsOfPartner = []) {
  const reasons = []; const facts = factCells(card).length;
  if (facts < QUAL_MIN) reasons.push(`Заполнено ${facts} из ${QUAL_DENOM}, нужно ${QUAL_MIN}`);
  if (CAPS.indexOf(card.capital) < 1) reasons.push('Капитал не указан или ниже $1 млн');
  if (str(card.capitalBasis, 1000).length < 10) reasons.push('Нет основания оценки капитала');
  const r = card.relation || {}; if (!str(r.role, 200) || !str(r.lastContact, 40) || !str(r.topic, 200)) reasons.push('Не описаны отношения: роль, когда общались, какую задачу обсуждали');
  const own = new Set(partner.categories || []);
  const other = (card.requests || []).filter(x => x.status === 'open' && !own.has(x.cat) && meaningful(x.text));
  if (!other.length) reasons.push('Нет актуального запроса на другую услугу каталога');
  // дубль: такой же текст запроса или основания у более ранней карточки этого партнера
  const sig = (c) => ({ reqs: (c.requests || []).filter(x => x.status === 'open').map(x => normText(x.text)).filter(Boolean), basis: normText(c.capitalBasis) });
  const me = sig(card);
  const earlier = cardsOfPartner.filter(c => c.id !== card.id && !c.archived && (c.created < card.created || (c.created === card.created && c.id < card.id)));
  if (earlier.some(c => { const s = sig(c); return (me.basis && me.basis === s.basis) || me.reqs.some(t => s.reqs.includes(t)); })) reasons.push('Повтор: такой же запрос или основание уже есть в другой карточке');
  return { ok: reasons.length === 0, reasons, facts };
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
  ['about.age', /\d{2}\s*(лет|год)|возраст/],
  ['family.circle', /(^|[^а-я])(жена|женой|жену|супруг|с семьей|семья|с друзьями)/],
  ['about.region', /живет|проживает|резидент|родом/],
  ['about.places', /бывает|ездит|летает|отдыха|проводит (зиму|лето)/],
  ['business.source', /заработал|сколотил|основн\w* капитал|состояни|основал|продал (бизнес|компан)/],
  ['business.project', /развить|хотел бы (запустить|построить|создать)|новый проект/],
  ['business.now', /сейчас занимается|управляет|владеет|инвестир|вложил|совладел|директор|бизнес/],
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
function cellFor(s, sector) {
  const t = low(s);
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
      const cell = cellFor(s, sec); if (!cell) continue;
      items.push({ cell, value: s.slice(0, 300), kind });
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
    if (it.cell === 'about.age' && it.kind === 'fact') value = ageRange(value) || value;
    const cur = by.get(it.cell);
    if (!cur) { by.set(it.cell, { cell: it.cell, value, kind: it.kind }); continue; }
    if (cur.kind === it.kind) { if (!low(cur.value).includes(low(value))) cur.value = (cur.value + '; ' + value).slice(0, 500); }
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
    p.q = QUESTIONS[p.cell]; proposals.push(p);
  }
  return { proposals, contradictions, skipped };
}

// ---------- интересы ----------
export const TAGS = [
  ['Часы', /часы|часов(ые|ой|ых)|часовщ|watch/], ['Архитектура', /архитект/], ['Искусство', /искусств|живопис|галере|картин|художник/],
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
    if (it.cell === 'about.age' && it.kind === 'fact') value = ageRange(value) || value;
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
export function catalogFromContent(content) {
  return Object.entries((content && content.articles) || {}).map(([id, a]) => ({
    id, title: a.title, themes: DIR_THEMES[a.dir] || [a.dir], format: 'journal', region: a.geo || '', online: false, terms: '', cost: '', dates: '', deadline: '',
    verifiedAt: '', status: (a.status || 'published') === 'published' ? 'available' : 'idea', deliver: a.hook || '', confirmBy: 'Orbiq', prepDays: 14,
  }));
}
export function cleanItem(x) {
  const s = (v, n) => String(v ?? '').trim().slice(0, n); const id = s(x.id, 80).replace(/[^a-z0-9_-]/gi, '');
  if (!id || !s(x.title, 200)) return null;
  return { id, title: s(x.title, 200), themes: (Array.isArray(x.themes) ? x.themes : []).map(t => s(t, 40)).filter(Boolean).slice(0, 10), format: s(x.format, 40), region: s(x.region, 120), online: !!x.online,
    terms: s(x.terms, 500), cost: s(x.cost, 120), dates: s(x.dates, 120), deadline: /^\d{4}-\d{2}-\d{2}$/.test(x.deadline || '') ? x.deadline : '', verifiedAt: s(x.verifiedAt, 30),
    status: x.status === 'idea' ? 'idea' : 'available', deliver: s(x.deliver, 300), confirmBy: s(x.confirmBy || 'Orbiq', 80), cover: /^(\/[^\s]*|https:\/\/[^\s]+)$/.test(String(x.cover || '')) ? s(x.cover, 300) : '', next: s(x.next, 200), prepDays: Math.max(0, Math.min(180, parseInt(x.prepDays ?? 14, 10) || 0)) };
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
