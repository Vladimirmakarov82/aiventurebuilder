// Машина состояний Orbiq Discovery: чистые функции без хранилища (тестируются отдельно)
export const ART_STATUS = ['draft', 'scheduled', 'published', 'archived'];
const ART_T = { draft: ['scheduled', 'published'], scheduled: ['published', 'draft'], published: ['archived', 'draft'], archived: [] };
export function artTransition(from, to) { return (ART_T[from] || []).includes(to); }
export function artLive(st, now = Date.now()) { if (!st) return false; if (st.status === 'published') return true; return st.status === 'scheduled' && !!st.at && Date.parse(st.at) <= now; }

const REC_T = { new: ['review'], review: ['accepted', 'rejected'], accepted: ['published', 'review'], rejected: ['review'], published: [] };
export function recTransition(from, to) { return (REC_T[from] || []).includes(to); }

const MSG_T = { draft: ['ready', 'cancelled'], ready: ['scheduled', 'draft', 'sending', 'cancelled'], scheduled: ['sending', 'ready', 'cancelled'], sending: ['sent', 'failed'], failed: ['sending', 'cancelled'], sent: [], cancelled: ['draft'] };
export function msgTransition(from, to) { return (MSG_T[from] || []).includes(to); }

// один раздел = один знак: любые три разных подтвержденных открытия раздела; больше трех не считается
export function levels(user, ACH) {
  const ops = (user && user.ops) || {}, out = {};
  for (const sec of ACH.sections) out[sec.id] = Math.min(3, sec.items.filter(i => ops[i] && ops[i].completed_at).length);
  return out;
}
export function oppState(user, id) { const o = (user.ops || {})[id] || {}; return o.completed_at ? 'completed' : o.explored_at ? 'explored' : 'not_explored'; }
function audit(u, ev) { u.history = (u.history || []).concat([{ ...ev, at: new Date().toISOString() }]).slice(-300); }

// события: explore | complete | undo; результат детерминирован и идемпотентен
export function apply(user, ev, ACH, available) {
  const u = JSON.parse(JSON.stringify(user)); u.ops = u.ops || {};
  if (u.blocked) return { user, error: 'blocked' };
  const before = levels(u, ACH); const o = u.ops[ev.id] || {};
  if (ev.type === 'explore') { if (!o.explored_at) { o.explored_at = ev.now; u.ops[ev.id] = o; audit(u, { t: 'explore', id: ev.id }); } }
  else if (ev.type === 'complete') {
    if (!available) return { user, error: 'unavailable' };
    if (!o.completed_at) {
      o.completed_at = ev.now; u.ops[ev.id] = o;
      audit(u, { t: 'complete', id: ev.id });
    }
  } else if (ev.type === 'unexplore') {
    if (o.explored_at && !o.completed_at) { delete o.explored_at; if (Object.keys(o).length) u.ops[ev.id] = o; else delete u.ops[ev.id]; audit(u, { t: 'unexplore', id: ev.id }); }
  } else if (ev.type === 'undo') {
    if (o.completed_at) { delete o.completed_at; if (o.explored_at) u.ops[ev.id] = o; else delete u.ops[ev.id]; audit(u, { t: 'undo', id: ev.id }); }
  } else return { user, error: 'bad_event' };
  const after = levels(u, ACH);
  const changed = Object.keys(after).filter(k => after[k] !== before[k]).map(k => ({ id: k, from: before[k], to: after[k] }));
  for (const c of changed) audit(u, { t: 'level', id: c.id, from: c.from, to: c.to });
  return { user: u, levels: after, changed, state: oppState(u, ev.id) };
}
