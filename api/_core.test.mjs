import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, levels, artTransition, artLive, recTransition, msgTransition, oppState } from './_core.mjs';
const ACH = { lifestyle: [{ id: 'g1', current: 1, versions: [{ v: 1, items: ['a', 'b', 'c'] }] }] };
const U = () => ({ id: 'u1', ops: {}, pins: {} });
const now = '2026-11-21T10:00:00Z';
const run = (u, type, id, av = true) => apply(u, { type, id, now }, ACH, av);

test('0 → 1 → 2 → 3 прохождения дают серебро, золото, черный', () => {
  let r = run(U(), 'complete', 'a'); assert.equal(r.levels.g1, 1); assert.deepEqual(r.changed, [{ id: 'g1', from: 0, to: 1 }]);
  r = run(r.user, 'complete', 'b'); assert.equal(r.levels.g1, 2);
  r = run(r.user, 'complete', 'c'); assert.equal(r.levels.g1, 3);
});
test('3 → 2 → 1 → 0 при отмене', () => {
  let u = U(); for (const i of ['a', 'b', 'c']) u = run(u, 'complete', i).user;
  let r = run(u, 'undo', 'c'); assert.equal(r.levels.g1, 2); r = run(r.user, 'undo', 'b'); assert.equal(r.levels.g1, 1); r = run(r.user, 'undo', 'a'); assert.equal(r.levels.g1, 0);
});
test('повторное подтверждение не увеличивает прогресс', () => {
  let r = run(U(), 'complete', 'a'); r = run(r.user, 'complete', 'a'); assert.equal(r.levels.g1, 1); assert.deepEqual(r.changed, []);
});
test('одновременные подтверждения сводятся к одному (идемпотентность по состоянию)', () => {
  const base = U(); const r1 = run(base, 'complete', 'a'), r2 = run(base, 'complete', 'a');
  assert.deepEqual(r1.user.ops, r2.user.ops); const merged = run(r1.user, 'complete', 'a'); assert.equal(merged.levels.g1, 1);
});
test('изучение не дает знак и независимо от совершения', () => {
  let r = run(U(), 'explore', 'a'); assert.equal(r.levels.g1, 0); assert.equal(r.state, 'explored');
  r = run(r.user, 'complete', 'a'); assert.equal(r.state, 'completed'); r = run(r.user, 'undo', 'a'); assert.equal(r.state, 'explored');
  let s = run(U(), 'complete', 'b'); s = run(s.user, 'undo', 'b'); assert.equal(s.state, 'not_explored');
});
test('недоступная возможность не принимается', () => { const r = run(U(), 'complete', 'a', false); assert.equal(r.error, 'unavailable'); });
test('заблокированный аккаунт не меняет состояние', () => { const u = { ...U(), blocked: true }; assert.equal(run(u, 'complete', 'a').error, 'blocked'); });
test('изменение состава: закрепленная версия сохраняет черный знак', () => {
  let u = U(); for (const i of ['a', 'b', 'c']) u = run(u, 'complete', i).user;
  const ACH2 = { lifestyle: [{ id: 'g1', current: 2, versions: [{ v: 1, items: ['a', 'b', 'c'] }, { v: 2, items: ['a', 'b', 'd'] }] }] };
  assert.equal(levels(u, ACH2).g1, 3);
  const fresh = apply(U(), { type: 'complete', id: 'd', now }, ACH2, true); assert.equal(fresh.levels.g1, 1); assert.equal(fresh.user.pins.g1, 2);
});
test('архивирование статьи не отнимает заработанное', () => {
  let u = U(); for (const i of ['a', 'b']) u = run(u, 'complete', i).user; assert.equal(levels(u, ACH).g1, 2);
});
test('сохранение прогресса после повторного входа (документ пользователя тот же)', () => {
  const u = run(U(), 'complete', 'a').user; const reloaded = JSON.parse(JSON.stringify(u)); assert.equal(levels(reloaded, ACH).g1, 1);
});
test('переходы статусов статьи', () => {
  assert.ok(artTransition('draft', 'scheduled')); assert.ok(artTransition('scheduled', 'published')); assert.ok(artTransition('published', 'archived'));
  assert.ok(artTransition('draft', 'published')); assert.ok(artTransition('scheduled', 'draft')); assert.ok(artTransition('published', 'draft'));
  assert.ok(!artTransition('archived', 'published')); assert.ok(!artTransition('draft', 'archived'));
  assert.ok(artLive({ status: 'scheduled', at: '2020-01-01T00:00:00Z' })); assert.ok(!artLive({ status: 'scheduled', at: '2999-01-01T00:00:00Z' })); assert.ok(!artLive({ status: 'draft' }));
});
test('Reader’s Discovery: допустимые и запрещенные переходы', () => {
  assert.ok(recTransition('new', 'review')); assert.ok(recTransition('review', 'accepted')); assert.ok(recTransition('accepted', 'published'));
  assert.ok(!recTransition('new', 'published')); assert.ok(!recTransition('published', 'review'));
});
test('рассылка: Sent только после Sending, повтор из Failed', () => {
  assert.ok(msgTransition('draft', 'ready')); assert.ok(msgTransition('ready', 'scheduled')); assert.ok(msgTransition('sending', 'sent')); assert.ok(msgTransition('sending', 'failed')); assert.ok(msgTransition('failed', 'sending'));
  assert.ok(!msgTransition('draft', 'sent')); assert.ok(!msgTransition('sent', 'sending'));
});
