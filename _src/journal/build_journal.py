"""Собирает скрытую страницу журнала Orbiq из journal/items.json.
Страница: /journal-c0f4ba/ (noindex, нигде не связана с сайтом).
Запуск: python3 journal/build_journal.py"""
import json, html, os, re, urllib.parse
from collections import Counter

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.environ.get('JOURNAL_SITE') or os.path.join(ROOT, '..', 'site')
SLUG = 'journal-c0f4ba'
TG = 'https://t.me/vladimir82makarov?text='

items = json.load(open(os.path.join(ROOT, 'items.json')))
items = [i for i in items if i.get('status') != 'rejected']
items.sort(key=lambda i: (i.get('issue', ''), i.get('order', 0)), reverse=False)
issues = sorted({i.get('issue', '') for i in items}, reverse=True)

FOR = {'она': 'Для нее', 'он': 'Для него', 'дети': 'Для детей', 'семья': 'Для семьи'}
CAT_COL = ['#FF4D00', '#5542FF', '#00A676', '#FFB800', '#E8457C', '#0091FF', '#7A5C3E', '#0B0B0D']
cats = [c for c, _ in Counter(i['cat'] for i in items).most_common()]
col = {c: CAT_COL[k % len(CAT_COL)] for k, c in enumerate(cats)}

e = lambda s: html.escape(str(s or ''), quote=True)

def host(u):
    try:
        return urllib.parse.urlparse(u).netloc.replace('www.', '')
    except Exception:
        return ''

cards = []
for n, i in enumerate(items):
    fr = i.get('for', '')
    frs = [f.strip() for f in re.split(r'[,/]', fr) if f.strip()]
    tg = TG + urllib.parse.quote('Хочу такую историю из журнала Orbiq: ' + re.sub('<[^>]+>', '', i['title']))
    obj = ('<a class="j-src" href="%s" target="_blank" rel="noopener">Сайт мастера или места</a>' % e(i['object_url'])) if i.get('object_url') else ''
    cards.append('''<article class="jc" data-id="%(id)s" data-cat="%(cat)s" data-for="%(for)s" style="--c:%(col)s">
<div class="jc-top"><span class="mono">%(geo)s</span><span class="jc-cat">%(cat)s</span></div>
<h3>%(title)s</h3>
<p class="jc-hook">%(hook)s</p>
<p class="jc-text">%(text)s</p>
<p class="jc-make"><b>Устроим:</b> %(make)s</p>
<div class="jc-meta"><span class="jc-for">%(forl)s</span><a class="j-src" href="%(src)s" target="_blank" rel="noopener">Источник: %(srcn)s</a>%(obj)s</div>
<a class="jc-cta" href="%(tg)s" target="_blank" rel="noopener">Хочу такую историю <span>→</span></a>
<div class="jr" hidden><button type="button" data-v="1" aria-label="Нравится">👍</button><button type="button" data-v="-1" aria-label="Не то">👎</button><input type="text" placeholder="Комментарий"><button type="button" class="mic" aria-label="Надиктовать">🎙</button><span class="jr-id mono">%(id)s</span></div>
</article>''' % dict(id=e(i['id']), cat=e(i['cat']), col=col[i['cat']], geo=e(i['geo']), title=i['title'], hook=i['hook'], text=i['text'],
                       make=i['make'], forl=' · '.join(FOR.get(f, f) for f in frs), src=e(i['source_url']), srcn=e(i.get('source_name') or host(i['source_url'])),
                       obj=obj, tg=e(tg), **{'for': e(' '.join(frs))}))

chips_cat = ''.join('<button type="button" class="jf" data-k="cat" data-v="%s">%s</button>' % (e(c), e(c)) for c in cats)
chips_for = ''.join('<button type="button" class="jf" data-k="for" data-v="%s">%s</button>' % (k, v) for k, v in FOR.items())

page = '''<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>Журнал Orbiq</title>
<link rel="stylesheet" href="/fonts/fonts.css"><link rel="icon" href="/favicon.svg">
<style>
:root{--bg:#F3F4F2;--paper:#fff;--ink:#0B0B0D;--mute:#5E616A;--line:rgba(11,11,13,.1);--or:#FF4D00;--f:"TikTok Sans",system-ui,sans-serif;--m:"Geist Mono",ui-monospace,monospace}
@media (prefers-color-scheme:dark){:root{--bg:#0B0B0D;--paper:#141417;--ink:#F3F4F2;--mute:#9A9DA6;--line:rgba(255,255,255,.12)}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--f);-webkit-font-smoothing:antialiased}
.mono{font-family:var(--m);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.w{max-width:1440px;margin:0 auto;padding:0 clamp(16px,2.2vw,32px)}
header{padding:clamp(40px,8vh,96px) 0 28px}
header .mono{color:var(--mute)}
h1{font-size:clamp(44px,7vw,112px);line-height:.92;letter-spacing:-.045em;margin:14px 0 18px;font-weight:600}
.lead{font-size:clamp(17px,1.4vw,21px);line-height:1.45;color:var(--mute);max-width:56ch;margin:0}
.bar{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line);padding:12px 0}
.fl{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.fl::-webkit-scrollbar{display:none}.fl+.fl{margin-top:8px}
.jf{flex:0 0 auto;font:inherit;font-size:14px;padding:9px 15px;border-radius:999px;border:1px solid var(--line);background:var(--paper);color:var(--ink);cursor:pointer;transition:.25s}
.jf:hover{border-color:var(--or)}.jf.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.cnt{margin-left:auto;align-self:center;color:var(--mute);white-space:nowrap;padding-left:12px}
.grid{columns:3 340px;column-gap:14px;padding:22px 0 80px}
.jc{break-inside:avoid;margin:0 0 14px;background:var(--paper);border-radius:22px;padding:22px 22px 18px;border:1px solid var(--line);position:relative;overflow:hidden;animation:jin .7s cubic-bezier(.16,1,.3,1) both}
.jc::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:var(--c)}
@keyframes jin{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.jc-top{display:flex;justify-content:space-between;gap:10px;color:var(--mute)}
.jc-cat{font-size:12px;color:var(--c);font-weight:600}
.jc h3{font-size:clamp(22px,1.9vw,28px);line-height:1.08;letter-spacing:-.025em;margin:14px 0 10px;font-weight:600}
.jc-hook{font-size:17px;line-height:1.4;margin:0 0 10px;font-weight:500}
.jc-text{font-size:15px;line-height:1.55;color:var(--mute);margin:0 0 12px}
.jc-make{font-size:15px;line-height:1.45;margin:0 0 14px;padding:12px 14px;border-radius:14px;background:color-mix(in srgb,var(--c) 10%,transparent)}
.jc-meta{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--mute);margin-bottom:14px}
.jc-for{font-weight:600;color:var(--ink)}
.j-src{color:var(--mute);text-decoration:underline;text-underline-offset:3px}
.jc-cta{display:flex;justify-content:space-between;align-items:center;text-decoration:none;color:var(--bg);background:var(--ink);padding:13px 18px;border-radius:999px;font-weight:600;font-size:15px;transition:.3s}
.jc-cta span{transition:transform .3s}.jc-cta:hover{background:var(--or)}.jc-cta:hover span{transform:translateX(4px)}
.jc[hidden]{display:none}
.jr{display:flex;gap:6px;align-items:center;margin-top:12px;padding-top:12px;border-top:1px dashed var(--line)}
.jr button{font-size:18px;background:none;border:1px solid var(--line);border-radius:10px;padding:5px 9px;cursor:pointer}
.jr button.on{border-color:var(--or);background:color-mix(in srgb,var(--or) 14%,transparent)}
.jr input{flex:1;min-width:0;font:inherit;font-size:14px;padding:7px 10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}
.jr .mic.rec{background:var(--or);border-color:var(--or)}
.jr-id{display:none}
.jc.v1{outline:2px solid #00A676}.jc.v-1{opacity:.45}
.rv{position:fixed;right:16px;bottom:16px;z-index:9;display:flex;gap:8px}
.rv button{font:inherit;font-weight:600;border:0;border-radius:999px;padding:13px 18px;background:var(--or);color:#fff;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.18)}
.rv button.g{background:var(--ink);color:var(--bg)}
footer{padding:30px 0 60px;color:var(--mute);font-size:13px;line-height:1.5}
@media (max-width:700px){.grid{columns:1}.cnt{display:none}}
@media (prefers-reduced-motion:reduce){.jc{animation:none}}
</style></head><body>
<header class="w"><span class="mono">Orbiq · журнал · выпуск @@issue@@</span><h1>Истории, в которых хочется оказаться</h1>
<p class="lead">Мастера, места и обычаи со всего мира, о которых знают немногие. Любую историю можно повторить: кнопка под карточкой передает запрос консьержу, и он все устраивает.</p></header>
<div class="bar"><div class="w"><div class="fl"><button type="button" class="jf on" data-k="all">Все</button>@@chips_cat@@<span class="cnt mono" id="cnt"></span></div><div class="fl">@@chips_for@@</div></div></div>
<main class="w"><div class="grid" id="grid">@@cards@@</div></main>
<footer class="w">Тексты журнала пересказывают публикации других изданий. Ссылка на источник стоит в каждой карточке.</footer>
<div class="rv" id="rv" hidden><button type="button" class="g" id="rvx">Отзыв: 0</button><button type="button" id="rvc">Скопировать отзыв</button></div>
<script>
(function(){var C=[].slice.call(document.querySelectorAll('.jc')),F={cat:null,for:null},cnt=document.getElementById('cnt');
function ap(){var n=0;C.forEach(function(c){var ok=(!F.cat||c.dataset.cat===F.cat)&&(!F.for||(' '+c.dataset.for+' ').indexOf(' '+F.for+' ')>-1);c.hidden=!ok;if(ok)n++});cnt.textContent=n+' историй'}
document.querySelectorAll('.jf').forEach(function(b){b.addEventListener('click',function(){var k=b.dataset.k;if(k==='all'){F={cat:null,for:null};document.querySelectorAll('.jf').forEach(function(x){x.classList.toggle('on',x===b)})}else{var same=F[k]===b.dataset.v;F[k]=same?null:b.dataset.v;document.querySelectorAll('.jf[data-k="'+k+'"]').forEach(function(x){x.classList.toggle('on',!same&&x===b)});document.querySelector('.jf[data-k="all"]').classList.toggle('on',!F.cat&&!F.for)}ap()})});ap();
/* режим отзыва владельца: ?r=1 */
if(!/[?&]r=1/.test(location.search))return;
var K='orbiq-journal-review',S={};try{S=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
var rv=document.getElementById('rv'),rvx=document.getElementById('rvx');rv.hidden=false;
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}var n=Object.keys(S).filter(function(k){return S[k].v||S[k].t}).length;rvx.textContent='Отзыв: '+n}
C.forEach(function(c){var id=c.dataset.id,r=c.querySelector('.jr'),inp=r.querySelector('input');r.hidden=false;S[id]=S[id]||{};
function paint(){c.classList.remove('v1','v-1');r.querySelectorAll('[data-v]').forEach(function(b){b.classList.toggle('on',String(S[id].v)===b.dataset.v)});if(S[id].v)c.classList.add('v'+S[id].v)}
inp.value=S[id].t||'';paint();
r.querySelectorAll('[data-v]').forEach(function(b){b.addEventListener('click',function(){var v=+b.dataset.v;S[id].v=S[id].v===v?0:v;paint();save()})});
inp.addEventListener('input',function(){S[id].t=inp.value;save()});
var SR=window.SpeechRecognition||window.webkitSpeechRecognition,mic=r.querySelector('.mic');if(!SR){mic.hidden=true}else{mic.addEventListener('click',function(){var s=new SR();s.lang='ru-RU';s.interimResults=false;mic.classList.add('rec');s.onresult=function(ev){inp.value=(inp.value?inp.value+' ':'')+ev.results[0][0].transcript;S[id].t=inp.value;save()};s.onend=function(){mic.classList.remove('rec')};s.start()})}});
save();
document.getElementById('rvc').addEventListener('click',function(){var out=['Отзыв на журнал Orbiq, выпуск @@issue@@:'];C.forEach(function(c){var s=S[c.dataset.id];if(!s||(!s.v&&!s.t))return;out.push((s.v>0?'+ ':s.v<0?'- ':'· ')+c.dataset.id+(s.t?': '+s.t:''))});var t=out.join('\\n');(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){document.getElementById('rvc').textContent='Скопировано, вставь в чат'},function(){prompt('Скопируй и вставь в чат',t)})});
rvx.addEventListener('click',function(){if(confirm('Очистить отзыв?')){S={};localStorage.removeItem(K);location.reload()}});
})();
</script></body></html>'''
for k,v in dict(issue=e(issues[0] if issues else ''), chips_cat=chips_cat, chips_for=chips_for, cards='\n'.join(cards)).items(): page=page.replace('@@%s@@'%k,v)

out = os.path.join(SITE, SLUG)
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w').write(page)
print('journal:', len(items), 'cards ->', '/' + SLUG + '/')
