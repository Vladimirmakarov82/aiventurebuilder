const M = new Map(); const L = new Map(); globalThis.__BLOB = { keys: () => [...M.keys()].filter(k => !k.startsWith('rl/')), get: (k) => ({ body: M.get(k) }), set: (k, v) => M.set(k, v.body) };
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opt) => {
  if (url !== 'https://kv.test') return realFetch(url, opt);
  const c = JSON.parse(opt.body); const [op, ...a] = c; let r = null;
  const glob = (p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  switch (op) {
    case 'GET': r = M.has(a[0]) ? M.get(a[0]) : null; break;
    case 'SET': M.set(a[0], a[1]); r = 'OK'; break;
    case 'DEL': r = M.delete(a[0]) ? 1 : 0; break;
    case 'INCR': { const v = (+M.get(a[0]) || 0) + 1; M.set(a[0], String(v)); r = v; break; }
    case 'EXPIRE': r = 1; break;
    case 'SCAN': { const re = glob(a[2]); r = ['0', [...M.keys()].filter(k => re.test(k))]; break; }
    case 'EVAL': { const key = a[2], old = a[3], nw = a[4]; const cur = M.has(key) ? M.get(key) : null; if ((old === '' && cur === null) || cur === old) { M.set(key, nw); r = 1; } else r = 0; break; }
    case 'LPUSH': { const l = L.get(a[0]) || []; l.unshift(a[1]); L.set(a[0], l); r = l.length; break; }
    case 'LTRIM': { const l = L.get(a[0]) || []; L.set(a[0], l.slice(+a[1], +a[2] + 1)); r = 'OK'; break; }
    case 'LRANGE': { const l = L.get(a[0]) || []; r = l.slice(+a[1], +a[2] + 1); break; }
    default: throw new Error('mock op ' + op);
  }
  return new Response(JSON.stringify({ result: r }), { status: 200 });
};
