/* Orbiq CRM · кабинет партнера и владельца. Чистый JS, без сборщика.
   Контракт: /crm/CONTRACT.md. Демо без сервера: /crm/?demo=1&as=owner|new|basic|paid|networker|login|key */
(function(){
'use strict';

/* ================= Утилиты ================= */
var Q=new URLSearchParams(location.search);
var DEMO=Q.get('demo')==='1';
/* Название кабинета: меняется здесь, в одном месте */
var CAB={name:'Orbiq Room',partner:'Orbiq Room',owner:'Orbiq Room · Founder',tag:'Orbiq Room',title:'Orbiq Room'};
document.title=CAB.title;
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function uid(p){return (p||'x')+Math.random().toString(36).slice(2,9)}
function clone(o){return JSON.parse(JSON.stringify(o))}
function nowISO(){return new Date().toISOString()}
function pad(n){return (n<10?'0':'')+n}
var MON=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
function fmtDate(iso,withTime){if(!iso)return '—';var d=new Date(iso);if(isNaN(d))return E(iso);var s=d.getDate()+' '+MON[d.getMonth()];if(d.getFullYear()!==new Date().getFullYear())s+=' '+d.getFullYear();if(withTime)s+=', '+pad(d.getHours())+':'+pad(d.getMinutes());return s}
function relDay(iso){var d=parseDue(iso),t=new Date();var a=new Date(d.getFullYear(),d.getMonth(),d.getDate()),b=new Date(t.getFullYear(),t.getMonth(),t.getDate());var n=Math.round((a-b)/864e5);if(n===0)return 'сегодня, '+pad(d.getHours())+':'+pad(d.getMinutes());if(n===1)return 'завтра';if(n===-1)return 'вчера';return fmtDate(iso)}
function plural(n,a,b,c){n=Math.abs(n)%100;var m=n%10;if(n>10&&n<20)return c;if(m>1&&m<5)return b;if(m===1)return a;return c}
function norm(s){return String(s||'').trim().replace(/\s+/g,' ').toLowerCase().replace(/ё/g,'е')}
function cleanAlias(s){return String(s||'').trim().replace(/\s+/g,' ')}

/* ================= Словари ================= */
var CATS={citizenship:'Гражданство и ВНЖ',realty:'Недвижимость',watches:'Часы и коллекции',finance:'Финансы и переводы',preipo:'Pre-IPO и инвестиции',security:'Безопасность',health:'Здоровье',education:'Образование детей',travel:'Путешествия и события',art:'Искусство',aviation:'Авиация и яхты',legal:'Право и наследство',digital:'Цифровая инфраструктура',other:'Другое'};
var CATC={citizenship:'#5542FF',realty:'#FF4D00',watches:'#B5862A',finance:'#00A884',preipo:'#00A3FF',security:'#111113',health:'#FF5FA2',education:'#F5B400',travel:'#00B8A9',art:'#C03AE0',aviation:'#3D7BFF',legal:'#6B4E2E',digital:'#7A7A80',other:'#9A9AA0'};
var CAPS=['<1','1–3','3–10','10–25','25–100','100+'];
var AGES=['<35','35–44','45–54','55–64','65+'];
var INV={active:'Активно',sometimes:'Иногда',no:'Сейчас нет'};
function capL(c){if(!c)return '—';if(c==='<1')return 'до $1 млн';if(c==='100+')return '$100 млн+';return '$'+c+' млн'}
function ageL(a){return a?(a==='<35'?'до 35':a):'—'}
var TIER={new:'Новый партнер',basic:'Базовый партнер',paid:'Партнер Orbiq',networker:'Нетворкер',candidate:'Новый партнер',trial:'Базовый партнер'};
var KINDP={supplier:'Поставщик',networker:'Нетворкер'};
function normTier(t){return t==='candidate'?'new':t==='trial'?'basic':t}
/* Готовность карточки: 6 блоков */
var BLOCKS=[
 ['b1','Возраст и семья','Сколько лет и какая семья: супруг, дети, их возраст?'],
 ['b2','Капитал и откуда оценка','Какой капитал диапазоном и на чем основана оценка?'],
 ['b3','На чем заработал','Отрасль, масштаб бизнеса и роль человека в компании?'],
 ['b4','Интересы с конкретикой','Что именно увлекает: предмет, мастер, место?'],
 ['b5','Подтвержденный запрос','Что человек сам просил или хочет сделать?'],
 ['b6','Знакомство и клиент ли','Сколько лет знакомы и платил ли он деньги партнеру?']];
function fct(c,k){var x=(c.cells||{})[k];return !!(x&&x.kind==='fact'&&String(x.v||'').trim())}
function ready6(c){
  c=c||{};var sv=c.ready||c.readiness;
  var SID={ageFamily:'b1',capital:'b2',business:'b3',interests:'b4',request:'b5',relation:'b6'};
  if(sv&&Array.isArray(sv.blocks)&&!c._preview){var okS={};sv.blocks.forEach(function(b){okS[SID[b.id]||b.id]=!!(b.ok||b.done)});var nS=BLOCKS.filter(function(b){return okS[b[0]]}).length;return {ok:okS,n:nS,done:sv.ready!=null?!!sv.ready:(okS.b2&&okS.b3&&okS.b5&&okS.b6&&nS>=5)}}
  var rel=c.relation||{},ints=c.interests||[];
  var ok={
   b1:!!(c.age||fct(c,'about.age'))&&((c.kids!=null&&c.kids!=='')||fct(c,'family.kids')||fct(c,'family.circle')),
   b2:!!c.capital&&String(c.capitalBasis||'').trim().length>=3,
   b3:fct(c,'business.source')||fct(c,'business.now'),
   b4:fct(c,'interests.subject')||fct(c,'interests.time')||fct(c,'interests.memory')||ints.length>=1,
   b5:(c.requests||[]).some(function(r){return r.status!=='closed'}),
   b6:rel.years!=null&&rel.years!==''&&isFinite(+rel.years)&&(rel.isClient==='yes'||rel.isClient==='no')};
  var n=BLOCKS.filter(function(b){return ok[b[0]]}).length;
  if(sv&&sv.filled!=null&&!c._preview)return {ok:ok,n:sv.filled,done:!!sv.ready};
  return {ok:ok,n:n,done:ok.b2&&ok.b3&&ok.b5&&ok.b6&&n>=5};
}
function rdots(c){var r=ready6(c);return '<span class="rdots'+(r.done?' done':'')+'" title="Готовность '+r.n+' из 6">'+BLOCKS.map(function(b){return '<i class="'+(r.ok[b[0]]?'on':'')+'"></i>'}).join('')+'<b>'+r.n+'/6</b></span>'}
function readyPanel(c){var r=ready6(c);var mine=c.mine;
  return '<div class="rdy card rv"><div class="row" style="justify-content:space-between"><span class="kick">Готовность карточки</span>'+(r.done?'<span class="chip ok">'+ic('check')+'Готова</span>':'<span class="chip line">'+(6-r.n)+' '+plural(6-r.n,'блок','блока','блоков')+' до готовой</span>')+'</div>'+
  '<div class="rdy-n"><b>'+r.n+'</b><small>из 6</small><span class="rdy-bar'+(r.done?' done':'')+'">'+BLOCKS.map(function(b){return '<i class="'+(r.ok[b[0]]?'on':'')+'"></i>'}).join('')+'</span></div>'+
  '<ul class="rdy-l">'+BLOCKS.map(function(b,i){var on=r.ok[b[0]];return '<li class="'+(on?'on':'')+'"><i>'+(on?ic('check'):(i+1))+'</i><span><b>'+b[1]+'</b>'+(on?'':'<small>'+b[2]+'</small>')+'</span></li>'}).join('')+'</ul>'+
  (mine&&!r.done&&!c._preview?'<a class="btn sm dark" style="align-self:flex-start" href="#/c/'+E(c.id)+'/add">'+ic('plus')+'Дописать текстом или голосом</a>':'')+'</div>'}
var ISCL={yes:'Да, клиент',no:'Нет',unknown:'Не знаю'};
var RQST={new:'Новое',clarify:'На уточнении',passed:'Передано',closed:'Закрыто'};

/* Круг 360: 6 секторов × 3 ячейки, вопросы из §3 ТЗ */
var SECTORS=[
 {id:'about',name:'О человеке',c:'var(--c-about)',hex:'#5542FF',q:[['age','Какой примерно возраст?'],['region','В каком регионе обычно живет?'],['places','Где регулярно бывает?']]},
 {id:'business',name:'Дело',c:'var(--c-business)',hex:'#FF4D00',q:[['source','В какой сфере заработал основной капитал?'],['now','Какими направлениями занимается сейчас?'],['project','Какой проект хотел бы развить?']]},
 {id:'family',name:'Семья',c:'var(--c-family)',hex:'#FF5FA2',q:[['circle','С кем обычно планирует поездки или досуг?'],['kids','Есть ли дети или внуки, для которых подбирает возможности, какого они примерно возраста?'],['gift','Для кого хотел бы получить или подарить подборку?']]},
 {id:'interests',name:'Интересы',c:'var(--c-interests)',hex:'#00A884',q:[['time','На что охотно тратит свободное время?'],['subject','Какой конкретный предмет, мастер или направление его увлекает?'],['memory','Какой опыт запомнился и чем?']]},
 {id:'prefs',name:'Предпочтения',c:'var(--c-prefs)',hex:'#F5B400',q:[['formats','Какие форматы ему нравятся?'],['no','Что просил больше не предлагать?'],['style','Как предпочитает обсуждать варианты?']]},
 {id:'plans',name:'Планы и запросы',c:'var(--c-plans)',hex:'#00A3FF',q:[['asked','С чем уже обращался к партнеру?'],['next','Что хочет сделать в ближайшие месяцы?'],['timing','Какие сроки или обстоятельства важны?']]}
];
var CELLS=[];SECTORS.forEach(function(s){s.q.forEach(function(q){CELLS.push(s.id+'.'+q[0])})});
function cellQ(key){var p=key.split('.');var s=SECTORS.find(function(x){return x.id===p[0]});if(!s)return key;var q=s.q.find(function(x){return x[0]===p[1]});return q?q[1]:key}
function cellSec(key){return SECTORS.find(function(x){return x.id===key.split('.')[0]})||SECTORS[0]}
function circle(cells){cells=cells||{};var na=0,f=0;CELLS.forEach(function(k){var c=cells[k];if(!c)return;if(c.kind==='na')na++;else if(c.kind==='fact')f++});var ap=18-na;return {filled:f,applicable:ap,pct:ap?Math.round(100*f/ap):null,qual:f}}
var KIND={fact:'Факт',hypothesis:'Догадка',unknown:'Не знаю',na:'Не применимо'};

/* Текст задания для своей нейросети: §4 ТЗ дословно (буква «ё» заменена на «е» по правилу интерфейса) */
var AI_TASK='Я готовлю индивидуальную подборку для человека, с которым работаю. Исходные данные для поиска укажу здесь: [имя и фамилия], [ориентир, позволяющий различить однофамильцев]. Найди публично выраженные интересы и планы, которые помогают предложить этому человеку уместную возможность. Работай только с общедоступными источниками. Если веб-поиск недоступен, сообщи об этом.\n\nНачни с собственных интервью, публичных выступлений, авторских публикаций и официальных страниц проектов. Ищи также на языках стран, где человек вел публичную деятельность. Проверь архивные интервью, подкасты и доступные видеозаписи. Если доступна расшифровка, изучи ее. Если доступно аудио и ты умеешь его расшифровать, разбери относящиеся к задаче фрагменты, сохрани таймкоды для моей проверки. Если доступно лишь описание, так и укажи. Не выдавай пересказ за слова героя. Для публичных отзывов сначала установи, что авторство подтверждено. При совпадении имен оставляй спорный материал за пределами результата.\n\nИщи конкретику: чем человек занимался сам, какие предметы или места выделял, почему ему понравился определенный опыт, куда он возвращался, какой проект хотел бы продолжить. Различай инвестицию в отрасль, профессиональную обязанность и личное увлечение. Отмечай давность сведений. Не восстанавливай текущее местоположение, частные маршруты, контакты или сведения о несовершеннолетних. Исключи закрытые базы, утечки, обход ограничений и сведения о здоровье, политике или вере.\n\nСоставь прикладной портрет для общения: какие форматы человек прямо предпочитает, что ценит при выборе, что отклонял. Каждый вывод привяжи к наблюдаемому высказыванию. Отдельно обозначь гипотезы, которые корректно уточнить вопросом. Не ставь диагнозов, не приписывай скрытых мотивов. Если оснований мало, напиши «неизвестно».\n\nВерни два отдельных результата. Первый — справка для меня в чате. Дай каждому источнику код S1, S2 и далее. Укажи ссылку, дату, подтверждение личности и при наличии таймкод. Эта справка остается у меня.\n\nВторой — отдельный файл profile.md для импорта в Orbiq, либо один блок Markdown, если создание файла недоступно. Разделы: «О человеке», «Дело», «Семья», «Интересы», «Предпочтения», «Планы и запросы», «Портрет общения», «Что уточнить». Одна строка на утверждение: суть своими словами | факт или гипотеза | код источника | год или неизвестно. Исключи имена, фамилии, контакты, ссылки, названия собственных компаний, уникальные должности, дословные цитаты и идентифицирующие сочетания событий. Обобщи их до отрасли, периода или региона. Оставь только детали, необходимые для подбора. Перед выдачей перечитай файл как посторонний и убери признаки, по которым легко найти человека. При нехватке сведений сохрани пробелы.';

var IMGS=['first1m-jet-card','art-basel-qatar-2027','cousteau-ambassadors','cars-concours-judge','bonneville-200-club','garrard-tiara-rental','chile-telescope-hosting','crouch-rare-maps','elvish-cave-honey','hemmerle-munich','japan-akiya-bank','guerlain-sur-mesure','grinzane-truffle-auction','islay-own-cask','kiefer-la-ribaute','berengo-murano','mille-miglia-centenary','roger-w-smith-isle-of-man','leica-0-series-wetzlar','lapland-ice-tracks'];
function img(id){return '/img/journal/t/'+id+'.webp'}

/* ================= Иконки ================= */
var IC={
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
plus:'<path d="M5 12h14M12 5v14"/>',cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
star:'<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
spark:'<path d="M12 3l1.9 5.8L20 10.5l-6.1 1.7L12 18l-1.9-5.8L4 10.5l6.1-1.7z"/><path d="M19 3v4M17 5h4"/>',
file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
ar:'<path d="M5 12h14M13 6l6 6-6 6"/>',al:'<path d="M19 12H5M11 18l-6-6 6-6"/>',
check:'<path d="M20 6 9 17l-5-5"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',
copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
archive:'<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',down:'<path d="m6 9 6 6 6-6"/>',
send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
clip:'<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
key:'<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
note:'<path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
pie:'<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
chart:'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
msg:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
handshake:'<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"/>',
gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
redo:'<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>',
tg:'<path d="m22 2-10 10M22 2l-7 20-4-9-9-4 20-7z"/>',
upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'
};
function ic(n,cls){return '<svg class="i'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(IC[n]||'')+'</svg>'}
function btn(label,cls,attrs,icon){return '<button '+(/type=/.test(attrs||'')?'':'type="button" ')+'class="btn '+(cls||'')+'" '+(attrs||'')+'>'+(icon?ic(icon):'')+'<span>'+label+'</span></button>'}

/* ================= Поиск идентификаторов (на устройстве) ================= */
var STOP_CAPS=/^(О|В|На|По|С|У|К|Из|За|Для|Он|Она|Они|Его|Ее|Их|Это|Как|Что|Где|Когда|Есть|Был|Была|Сейчас|Также|Любит|Хочет|Раздел|Дело|Семья|Интересы|Предпочтения|Планы|Портрет|Факт|Гипотеза|Неизвестно)$/;
function findIds(text){
  var out=[];
  function add(re,t,on){re.lastIndex=0;var m;while((m=re.exec(text))){if(!m[0].trim()){re.lastIndex++;continue}out.push({s:m.index,e:m.index+m[0].length,t:t,v:m[0],on:on})}}
  add(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,'email',true);
  add(/(?:https?:\/\/|www\.)[^\s)\]»"]+|(?<![@\w])[a-z0-9-]{2,}\.(?:com|ru|org|net|io|ai|co|uk|de|ch|ae|me|info|рф)(?:\/[^\s)\]»"]*)?/gi,'link',true);
  add(/(?:\+|\b)\d[\d\s().-]{8,}\d/g,'phone',true);
  add(/«[^»\n]{2,40}»|(?:ООО|АО|ПАО|ЗАО|LLC|Ltd|Inc|GmbH|Holding|Холдинг|Group)\s+[«"]?[\p{L}\d-]+(?:\s[\p{L}\d-]+)?[»"]?/gu,'org',true);
  var re=/(?<![\p{L}\d])\p{Lu}\p{Ll}{2,}(?:[ -]\p{Lu}\p{Ll}{2,})+/gu,m;
  while((m=re.exec(text))){out.push({s:m.index,e:m.index+m[0].length,t:'name',v:m[0],on:true})}
  var re2=/(?<=[\p{Ll},;:]\s)\p{Lu}\p{Ll}{2,}(?![\p{L}])/gu;
  while((m=re2.exec(text))){if(!STOP_CAPS.test(m[0]))out.push({s:m.index,e:m.index+m[0].length,t:'name',v:m[0],on:false})}
  out.sort(function(a,b){return a.s-b.s||(b.e-b.s)-(a.e-a.s)});
  var res=[],end=-1;out.forEach(function(f){if(f.s>=end){res.push(f);end=f.e}});
  res.forEach(function(f,i){f.i=i});
  return res;
}
var IDT={email:'Почта',phone:'Телефон',link:'Ссылка',name:'Имя?',org:'Организация'};
function markIds(text,finds){var h='',p=0;finds.forEach(function(f){h+=E(text.slice(p,f.s))+'<mark class="'+f.t+(f.on?'':' off')+'" data-f="'+f.i+'">'+E(f.v)+'</mark>';p=f.e});return h+E(text.slice(p))}
function stripIds(text,finds){var s='',p=0;finds.forEach(function(f){s+=text.slice(p,f.s)+(f.on?'[скрыто]':f.v);p=f.e});return s+text.slice(p)}

/* ================= API ================= */
function api(r,body,q){
  if(DEMO)return new Promise(function(res,rej){setTimeout(function(){try{res(clone(Demo.call(r,body||null,q||{})))}catch(e){rej(e)}},DEMO_LAT)});
  var qs=new URLSearchParams(Object.assign({r:r},q||{}));
  var opt={credentials:'same-origin',headers:{'Accept':'application/json'}};
  if(body){opt.method='POST';opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
  return fetch('/api/crm?'+qs.toString(),opt).then(function(res){
    return res.json().catch(function(){return {}}).then(function(data){
      if(!res.ok){var e=new Error(data.error||'Сервер не ответил. Можно повторить попытку');e.status=res.status;e.data=data;
        if(res.status===401&&r!=='me'&&r.indexOf('auth/')!==0){S.me=null;location.hash='#/login'}
        throw e}
      return adapt(r,data)})});
}
/* Приведение ответов сервера к форме, с которой работает интерфейс */
var AUDL={owner_login:'Вход Founder',partner_invite:'Приглашение партнера',partner_reinvite:'Новая ссылка партнеру',partner_revoke:'Отзыв приглашения',partner_activated:'Партнер вошел впервые',partner_suspend:'Приостановка партнера',partner_tier:'Смена тарифа',payment:'Платеж',rq_create:'Отправка обращения',note_forward:'Заметка передана в Orbiq',rq_send:'Пересылка обращения',rq_status:'Статус обращения',intro_use:'Знакомство засчитано',pf_submit:'Портфель на проверку',pf_decide:'Решение по карточке',pf_extend:'Расширение выборки',pf_final:'Решение по портфелю',client_archive:'Архивирование',client_link:'Связь карточек',client_primary:'Основной партнер',family_invite_create:'Приглашение семьи',family_invite_revoke:'Отзыв приглашения семьи',family_invite_activate:'Активация приглашения семьи',catalog_upsert:'Правка каталога'};
function at0(x){return x&&typeof x==='object'?x.at:x}
function msgs(l){return (l||[]).map(function(m){return Object.assign({},m,{attach:m.attach||(m.attachIds||[])[0]})})}
function adapt(r,d){
  if(!d||typeof d!=='object')return d;
  switch(r){
  case 'me':if(d.role==='owner'){d.partner={id:'owner',name:'Founder',tier:'paid',suspended:false,tg:d.tg||{connected:false}}}
    else if(d.partner){if(d.partner.paid){var pd=d.partner.paid;pd.pay1=at0(pd.pay1);pd.pay2=at0(pd.pay2)}var lm=d.partner.limits;if(lm){if(lm.rqPerMonth==null){d.partner.rqLeft=null;d.partner.rqUnl=true}else{d.partner.rqMax=lm.rqPerMonth;d.partner.rqLeft=Math.max(0,lm.rqPerMonth-(lm.rqUsed||0))}}}return d;
  case 'clients':return (d.rows||[]).map(function(x){if(x.partner)x.ownerName=x.partner.name;if(!x.archivedAt&&x.archived)x.archivedAt=x.updated;return x});
  case 'client/get':if(d.partner)d.ownerName=d.partner.name;return d;
  case 'client/extract':(d.proposals||[]).forEach(function(p){if(p.conflict&&typeof p.conflict==='object')p.conflict=p.conflict.current});
    d.contradictions=(d.contradictions||[]).map(function(x){return typeof x==='string'?x:(x.q||cellQ(x.cell))+': '+(x.values||[]).join(' / ')+(x.note?' · '+x.note:'')});return d;
  case 'note/list':return d.notes||[];
  case 'task/list':return d.tasks||[];
  case 'demand':return d.demand||[];
  case 'audit':return (d.audit||[]).map(function(a){return Object.assign({},a,{who:a.who==='owner'?'Founder':a.who,action:AUDL[a.action]||a.action,obj:a.obj&&typeof a.obj==='object'?Object.keys(a.obj).map(function(k){return k+': '+a.obj[k]}).join(' · '):a.obj})});
  case 'partners':return (d.partners||[]).map(function(p){if(p.paid){p.paid.pay1=at0(p.paid.pay1);p.paid.pay2=at0(p.paid.pay2)}return p});
  case 'seat/list':if(d.seats&&!Array.isArray(d.seats))return Object.keys(d.seats).map(function(k){var x=d.seats[k];return {cat:k,max:2,seats:x.taken||[],waitlist:x.wait||[]}});return d;
  case 'rq/mine':(d.sent||[]).concat(d.inbox||[]).forEach(function(x){x.at=x.at||x.created;x.thread=msgs(x.thread)});return d;
  case 'rq/all':return (d.rqs||[]).map(function(x){x.at=x.at||x.created;x.cardOwner=x.cardOwner&&typeof x.cardOwner==='object'?x.cardOwner:(x.owner||{});return x});
  case 'rq/get':case 'rq/send':if(r==='rq/send')return d;var q=d.rq||d;q.at=q.at||q.created;q.cardOwner=q.owner||{};q.initiator=q.initiator||{name:'Orbiq'};
    q.attachment=(q.attachments||[]).find(function(a){return a.from==='initiator'})||null;q.threads={initiator:msgs((q.threads||{}).initiator),cardOwner:msgs((q.threads||{}).cardOwner)};return q;
  case 'pf/all':return d.portfolios||[];
  case 'catalog':return d.items||[];
  case 'pf/status':var al={};(d.rows||[]).forEach(function(x){al[x.cid]=x.alias});d.sample=(d.sample||[]).map(function(x){return typeof x==='string'?{cid:x,alias:al[x]}:x});return d;
  case 'tg/link':if(d.link&&!d.url)d.url=d.link;return d;
  }
  return d;
}
function parseDue(s){if(!s)return new Date(NaN);return /^\d{4}-\d{2}-\d{2}$/.test(s)?new Date(s+'T12:00'):new Date(s)}
function localDue(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())}
var DEMO_LAT=DEMO?160:0;
function fail(st,msg){var e=new Error(msg);e.status=st;throw e}

/* ================= Демо-режим: вымышленные данные, та же логика прав ================= */
var Demo=(function(){
  var AS={candidate:'new',trial:'basic'}[Q.get('as')]||Q.get('as')||'paid';
  var d0=new Date();function day(n,h,m){var d=new Date();d.setDate(d.getDate()+n);d.setHours(h==null?12:h,m||0,0,0);return d.toISOString()}
  var PH={};
  var P={
    p_irina:{id:'p_irina',name:'Анна Лебедева',email:'anna@example.com',tier:'paid',kind:'supplier',suspended:false,categories:['watches'],tg:{connected:true,on:{orbiq_msg:true,rq_status:true,reminder:true}},paid:{seats:['watches'],pay1:day(-28),pay2Due:day(62)},lastSeen:day(0,9),invite:{status:'used'},
      product:{summary:'Независимые часовщики и редкие часы на заказ: подбор, очередь в мастерской, гравировка к семейной дате',whoNeeds:'Владельцы бизнеса 45+, которые собирают часы или ищут подарок к юбилею, рождению внука',fitSignals:['Интерес к часам или механике','Юбилей в семье','Капитал от $3 млн','Коллекционирует'],categories:['watches'],typicalEarnPerClient:{min:4000,max:15000,currency:'USD'}}},
    p_mark:{id:'p_mark',name:'Марк Орлов',email:'mark@example.com',tier:'basic',kind:'supplier',suspended:false,categories:['citizenship'],tg:{connected:false,on:{}},paid:null,lastSeen:day(-1,18),invite:{status:'used'},
      product:{summary:'Второе гражданство и ВНЖ для семьи под ключ: программа, банк, школа для детей',whoNeeds:'Семьи с детьми-школьниками и бизнесом за рубежом, которым нужна свобода передвижения',fitSignals:['Дети до 18 лет','Бизнес или активы за рубежом','Капитал от $3 млн','Частые поездки'],categories:['citizenship','education'],typicalEarnPerClient:{min:8000,max:20000,currency:'USD'}}},
    p_oleg:{id:'p_oleg',name:'Дмитрий Смирнов',email:'dmitry@example.com',tier:'new',kind:'supplier',suspended:false,categories:['realty'],tg:{connected:false,on:{}},paid:null,lastSeen:day(-2,11),invite:{status:'used'},
      product:{summary:'Покупка виллы или дома у моря в Италии и Испании с юристом и управлением',whoNeeds:'Семьи, которые проводят лето у моря и думают о собственном доме',fitSignals:['Отдыхает в Европе','Дети или внуки','Капитал от $10 млн','Запрос на недвижимость'],categories:['realty'],typicalEarnPerClient:{min:15000,max:60000,currency:'USD'}}},
    p_vera:{id:'p_vera',name:'Вера Ким',email:'vera@example.com',tier:'paid',kind:'supplier',suspended:false,categories:['art'],tg:{connected:true,on:{orbiq_msg:true}},paid:{seats:['art'],pay1:day(-60),pay2Due:day(30),pay2:null},lastSeen:day(-3,10),invite:{status:'used'},
      product:{summary:'Портреты и заказы у современных художников, сопровождение покупки искусства',whoNeeds:'Коллекционеры и семьи, которые готовят подарок к юбилею',fitSignals:['Интерес к искусству','Юбилей','Опера и музеи'],categories:['art'],typicalEarnPerClient:{min:5000,max:25000,currency:'USD'}}},
    p_nina:{id:'p_nina',name:'Нина Волкова',email:'nina@example.com',tier:'networker',kind:'networker',suspended:false,categories:[],tg:{connected:false,on:{}},paid:null,lastSeen:day(-1,12),invite:{status:'used'}},
    p_sasha:{id:'p_sasha',name:'Александр Белов',email:'alex@example.com',tier:'new',kind:'supplier',suspended:false,categories:['aviation'],tg:{connected:false,on:{}},lastSeen:null,invite:{status:'created',expires:day(5)},product:{summary:'Предоплаченные часы полета и перелеты частным бортом',whoNeeds:'Те, кто часто летает с семьей',fitSignals:['Частые перелеты'],categories:['aviation'],typicalEarnPerClient:{min:3000,max:12000,currency:'USD'}}}
  };
  var ME={owner:'orbiq',paid:'p_irina',basic:'p_mark',new:'p_oleg',networker:'p_nina'}[AS];
  function cl(o){return Object.assign({created:day(-40),updated:day(-2),archived:false,cells:{},relation:{},capitalBasis:'',plan:[],history:[],publicText:{},interests:[],requests:[],kids:null,investing:''},o)}
  function cells(m){var r={};Object.keys(m).forEach(function(k){var v=m[k];r[k]={v:v[0],kind:v[1]||'fact',src:'manual',at:day(-10)}});return r}
  var C={
    c_atlas:cl({id:'c_atlas',owner:'p_irina',alias:'Андрей',age:'55–64',capital:'10–25',kids:2,investing:'active',interests:['Часы','Архитектура','Яхтинг'],
      requests:[{id:'r1',cat:'citizenship',text:'Второе гражданство в Европе для всей семьи, сроки важны',status:'open',at:day(-12),public:true},{id:'r2',cat:'realty',text:'Дом у моря в Испании, рядом с хорошей школой',status:'open',at:day(-6),public:true}],
      publicText:{r1:'Второе гражданство в Европе для семьи'},invites:['3f9a1c27b8e04d6aa1c2e3f4a5b6c7d8e9f0a1b2','8c21d0e9f7a64b3c2d1e0f9a8b7c6d5e4f3a2b1c'],linkId:'l_demo01',
      cells:cells({'about.age':['55–64'],'about.region':['Поволжье, большой город'],'about.places':['Дубай зимой, Альпы на Рождество'],'business.source':['Строительство, 2000-е'],'business.now':['Девелопмент жилых кварталов'],'family.circle':['Отдыхает с супругой и младшим сыном'],'family.kids':['Двое детей, 14 и 19 лет'],'interests.time':['Яхтинг в Средиземном море'],'interests.subject':['Независимые часовщики, ручная отделка'],'prefs.style':['Голосовые сообщения вечером','hypothesis'],'plans.asked':['Гражданство для семьи'],'plans.next':['Купить дом в Испании до лета'],'prefs.no':['Без шумных мероприятий'],'family.gift':['','na']}),
      relation:{years:6,isClient:'yes',role:'Клиент по часам',lastContact:'2026-10',topic:'Часы к юбилею'},capitalBasis:'Доля в девелоперской компании, оценка по открытой отчетности',
      history:[{at:day(-40),what:'Карточка создана'},{at:day(-12),what:'Добавлен запрос: гражданство'},{at:day(-3),what:'Добавлены два интереса'}]}),
    c_sokol:cl({id:'c_sokol',owner:'p_irina',alias:'Виктор',age:'45–54',capital:'3–10',kids:1,investing:'sometimes',interests:['Авиация','Гольф'],
      requests:[{id:'r32',cat:'realty',text:'Участок под виллу на Ибице',status:'open',at:day(-11),public:true},{id:'r3',cat:'aviation',text:'Частный самолет на зиму: 25 часов полета',status:'open',at:day(-4),public:true}],
      cells:cells({'about.age':['45–54'],'business.source':['Логистика'],'interests.time':['Гольф по выходным'],'plans.asked':['Перелеты частным бортом']}),relation:{role:'Друг семьи',lastContact:'2026-11',topic:'Перелеты'}}),
    c_lira:cl({id:'c_lira',owner:'p_irina',alias:'Елена',age:'65+',capital:'25–100',kids:3,investing:'no',interests:['Искусство','Опера','Сады'],
      requests:[{id:'r33',cat:'realty',text:'Апартаменты в Милане рядом с Брерой',status:'open',at:day(-48),public:true},{id:'r4',cat:'art',text:'Семейный портрет у современного художника',status:'open',at:day(-9),public:true},{id:'r5',cat:'health',text:'Комплексный чекап в Европе',status:'open',at:day(-2),public:true}],
      publicText:{r4:'Семейный портрет у современного художника'},
      cells:cells({'about.age':['65+'],'about.region':['Москва и Подмосковье'],'about.places':['Флоренция каждую весну'],'business.source':['Фармдистрибуция'],'family.circle':['С дочерью'],'family.kids':['Трое взрослых детей, пятеро внуков'],'interests.time':['Опера, сады'],'interests.subject':['Итальянская живопись'],'interests.memory':['Закрытая экскурсия по Уффици'],'prefs.formats':['Камерные события'],'plans.asked':['Портрет'],'plans.timing':['К юбилею в марте']}),relation:{role:'Давняя клиентка',lastContact:'2026-09',topic:'Подарок внучке'}}),
    c_borey:cl({id:'c_borey',owner:'p_irina',alias:'Сергей',age:'35–44',capital:'1–3',kids:0,investing:'active',interests:['Технологии'],requests:[{id:'r6',cat:'finance',text:'Счет в швейцарском банке',status:'closed',at:day(-30),public:true}]}),
    c_granit:cl({id:'c_granit',owner:'p_mark',alias:'Олег',linkId:'l_demo01',age:'55–64',capital:'10–25',kids:2,investing:'active',interests:['Часы','Охота'],requests:[{id:'r30',cat:'realty',text:'Дом в Марбелье: жить зимой, летом сдавать',status:'open',at:day(-16),public:true},{id:'r7',cat:'watches',text:'Редкие независимые часы к 60-летию',status:'open',at:day(-5),public:true}],publicText:{r7:'Редкие независимые часы к юбилею'},cells:cells({'about.age':['55–64'],'interests.subject':['Часы ручной сборки']}),relation:{role:'Клиент по ВНЖ',lastContact:'2026-11',topic:'Португалия'}}),
    c_kedr:cl({id:'c_kedr',owner:'p_mark',alias:'Наталья',age:'45–54',capital:'3–10',kids:1,investing:'sometimes',interests:['Горы','Образование'],requests:[{id:'r31',cat:'realty',text:'Квартира в Барселоне для дочери-студентки',status:'open',at:day(-24),public:true},{id:'r8',cat:'education',text:'Летний лагерь в Швейцарии для дочери 12 лет',status:'open',at:day(-3),public:true}],publicText:{r8:'Летний лагерь в Швейцарии для ребенка'}}),
    c_neptun:cl({id:'c_neptun',owner:'p_vera',alias:'Марина',age:'45–54',capital:'25–100',kids:2,investing:'active',interests:['Яхты','Вино'],requests:[{id:'r9',cat:'realty',text:'Вилла на Сардинии',status:'open',at:day(-8),public:true},{id:'r10',cat:'watches',text:'Часы к рождению внука',status:'open',at:day(-1),public:true}],publicText:{r9:'Вилла на побережье Италии',r10:'Часы к рождению внука'}}),
    c_orion:cl({id:'c_orion',owner:'p_oleg',alias:'Ирина',age:'55–64',capital:'3–10',kids:2,investing:'no',interests:['Рыбалка'],requests:[{id:'r11',cat:'security',text:'Охрана для поездок',status:'open',at:day(-2),public:true}]}),
    c_tigr:cl({id:'c_tigr',owner:'p_oleg',alias:'Павел',age:'45–54',capital:'10–25',kids:3,investing:'active',interests:['Охота','Авто'],requests:[{id:'r12',cat:'aviation',text:'Вертолет для охоты',status:'open',at:day(-2),public:true}],publicText:{r12:'Вертолет на сезон'}}),
    c_grig:cl({id:'c_grig',owner:'orbiq',alias:'Григорий',age:'55–64',capital:'25–100',kids:2,investing:'active',interests:['Яхты','Вино'],capitalBasis:'Продал сеть клиник в 2022, оценка сделки в открытой прессе',
      requests:[{id:'r20',cat:'realty',text:'Дом у моря в Италии для большой семьи',status:'open',at:day(-3),public:true},{id:'r21',cat:'citizenship',text:'ВНЖ в Португалии для младшего сына',status:'open',at:day(-2),public:true}],publicText:{r20:'Дом у моря в Италии для большой семьи'},
      cells:cells({'about.age':['55–64'],'business.source':['Частная медицина, сеть клиник, основатель'],'family.kids':['Двое сыновей, 12 и 24 года'],'interests.subject':['Бургундские вина, свой погреб'],'interests.time':['Парусные регаты'],'plans.next':['Купить дом у моря до лета']}),relation:{years:12,isClient:'yes',role:'Знакомы по бизнесу',lastContact:'2026-11',topic:'Переезд семьи'}}),
    c_sofia:cl({id:'c_sofia',owner:'orbiq',alias:'Софья',age:'45–54',capital:'10–25',kids:1,investing:'sometimes',interests:['Искусство'],requests:[{id:'r34',cat:'realty',text:'Дом на Майорке до €1 млн',status:'open',at:day(-67),public:true},{id:'r22',cat:'art',text:'Портрет дочери к 18-летию',status:'open',at:day(-1),public:true}],
      cells:cells({'about.age':['45–54'],'interests.subject':['Современная графика']}),relation:{years:4,role:'Через общих друзей'}}),
    c_kost:cl({id:'c_kost',owner:'orbiq',alias:'Константин',age:'35–44',capital:'3–10',interests:['Авиация'],requests:[{id:'r35',cat:'realty',text:'Квартира в Валенсии в ипотеку',status:'open',at:day(-1),public:true}]}),
    c_vega:cl({id:'c_vega',owner:'p_oleg',alias:'Татьяна',archived:true,archivedAt:day(-6),age:'45–54',capital:'1–3',kids:1,investing:'no',interests:['Йога'],requests:[]})
  };
  var NOTES={'p_irina/c_atlas':[{id:'n1',text:'Удобно звонить после 19:00. Про гражданство говорит охотно, про бизнес коротко.',at:day(-5)}],'p_irina/c_granit':[{id:'n2',text:'Возможно, знаком с Андреем по яхт-клубу. Уточнить осторожно.',at:day(-2)}]};
  var TASKS={p_irina:[{id:'t1',cid:'c_atlas',title:'Позвонить Андрею про гражданство',due:day(0,18),tz:'Europe/Moscow',remind:30,done:false},{id:'t2',cid:'c_lira',title:'Отправить Елене подборку к юбилею',due:day(2,11),tz:'Europe/Moscow',remind:60,done:false},{id:'t3',cid:'c_sokol',title:'Уточнить даты перелетов у Виктора',due:day(-3,12),tz:'Europe/Moscow',remind:0,done:false},{id:'t4',title:'Разобрать подборку недели',due:day(5,10),tz:'Europe/Moscow',remind:0,done:false}]};
  var RQ={
    rq1:{id:'rq1',status:'clarify',at:day(-2,14),initiator:'p_irina',cid:'c_granit',requestId:'r7',offer:'Подбор независимого часовщика: два варианта с ручной отделкой до Нового года',terms:'10% от сделки',attachment:null,threads:{initiator:[{id:'m1',from:'initiator',text:'Предлагаю подобрать часы у независимого мастера. Есть два варианта.',at:day(-2,14)},{id:'m2',from:'orbiq',text:'Нужно уточнение: есть ли прямой доступ к мастерским в Женеве?',at:day(-1,10)}],cardOwner:[]},deal:null},
    rq2:{id:'rq2',status:'new',at:day(-26,9,40),initiator:'p_mark',cid:'c_atlas',requestId:'r1',offer:'Гражданство Мальты под ключ: сопровождение семьи, банк, школа',terms:'$5 000 комиссия партнеру после одобрения',attachment:{id:'a1',name:'malta-program.pdf',size:'1,2 МБ'},threads:{initiator:[{id:'m3',from:'initiator',text:'Готов взять семью на сопровождение. Сроки от 6 месяцев.',at:day(0,9,40),attach:'a1'}],cardOwner:[]},deal:null},
    rq3:{id:'rq3',status:'passed',at:day(-6,12),initiator:'p_vera',cid:'c_sokol',requestId:'r3',offer:'Часы полета на частном самолете у брокера с фиксированной ценой часа',terms:'5% от суммы карты',attachment:null,threads:{initiator:[{id:'m4',from:'initiator',text:'Есть брокер с фиксированной ценой часа на зиму.',at:day(-6,12)},{id:'m5',from:'orbiq',text:'Передали владельцу клиента. Ждем ответа.',at:day(-5,10)}],cardOwner:[{id:'m6',from:'orbiq',text:'Для клиента «Виктор» есть предложение по часам полета на частном самолете. Фиксированная цена часа на зиму. Есть ли интерес обсудить с клиентом?',at:day(-5,10)},{id:'m7',from:'cardOwner',text:'Да, клиент готов посмотреть условия.',at:day(-4,16)}]},deal:{payer:'Брокер',amount:'',percent:'5',basis:'Сумма за часы полета',received:false}},
    rq4:{id:'rq4',status:'closed',at:day(-20,12),initiator:'p_irina',cid:'c_neptun',requestId:'r10',offer:'Часы к рождению внука: гравировка даты',terms:'8%',attachment:null,threads:{initiator:[{id:'m8',from:'orbiq',text:'Клиент выбрал другой вариант. Спасибо за предложение.',at:day(-14,10)}],cardOwner:[]},deal:null}
  };
  var PF={
    p_oleg:{status:'draft',submittedAt:null,sample:[],decision:null},
    p_mark:{status:'submitted',submittedAt:day(-1,12),sample:['c_granit','c_kedr'],decisions:{c_granit:{exists:'yes',relation:'yes',capital:'',reason:'Публичная биография и переписка'}},decision:null}
  };
  var AUD=[
    {who:'Владимир',role:'owner',action:'Вход Founder',obj:'—',at:day(0,9,12),status:'ok'},
    {who:'Марк Орлов',role:'partner',action:'Отправка обращения',obj:'rq2',at:day(0,9,40),status:'ok'},
    {who:'Владимир',role:'owner',action:'Пересылка обращения',obj:'rq3 → владельцу карточки',at:day(-5,10),status:'ok'},
    {who:'Владимир',role:'owner',action:'Платеж 1',obj:'Анна Лебедева · $10 000',at:day(-28,15),status:'ok'},
    {who:'Владимир',role:'owner',action:'Смена тарифа',obj:'Анна Лебедева → Платный',at:day(-28,15),status:'ok'},
    {who:'Дмитрий Смирнов',role:'partner',action:'Архивирование',obj:'c_vega',at:day(-6,11),status:'ok'},
    {who:'Владимир',role:'owner',action:'Приглашение партнера',obj:'Александр Белов',at:day(-2,17),status:'ok'}
  ];
  var MATCH={
    c_atlas:{items:[
      {itemId:'roger-w-smith-isle-of-man',title:'Мастерская Роджера Смита на острове Мэн',why:'Связано с фактом: «Независимые часовщики, ручная отделка»',deliver:'Частный визит в мастерскую и очередь на заказ',confirmBy:'Orbiq, до 15 декабря'},
      {itemId:'mille-miglia-centenary',title:'Столетие гонки Mille Miglia',why:'Связано с интересом: яхтинг и техника',deliver:'Место в команде сопровождения на маршруте',confirmBy:'Организатор, заявки до 20 января'},
      {itemId:'japan-akiya-bank',title:'Дом с историей у моря',why:'Связано с запросом: «Дом у моря в Испании»',deliver:'Подборка из трех домов с проверкой юристом',confirmBy:'Партнер по недвижимости'}],
     questions:[
      {id:'q1',text:'Андрей, вы как-то рассказывали, что любите независимых часовщиков. Я вспомнил об этом, когда увидел, что мастерская на острове Мэн открывает очередь. До 15 декабря можно записаться на частный визит, все оформляется через Orbiq. Вам было бы интересно?',basis:'Факт: «Независимые часовщики, ручная отделка»',itemId:'roger-w-smith-isle-of-man',date:day(1),deadline:day(22),bucket:'now',kind:'offer'},
      {id:'q2',text:'Андрей, вы говорили, что хотите дом у моря в Испании до лета. Я увидел подборку домов рядом с хорошими школами. До конца января можно посмотреть три варианта, юрист проверит документы. Вам было бы интересно?',basis:'План: «Купить дом в Испании до лета»',itemId:'japan-akiya-bank',date:day(3),deadline:day(60),bucket:'now',kind:'offer'},
      {id:'q3',text:'Андрей, вы упоминали девелопмент. Вам сейчас интересна эта отрасль как личный проект или только как бизнес?',basis:'Уточнение: «Девелопмент жилых кварталов»',date:day(6),deadline:day(30),bucket:'now',kind:'clarify'},
      {id:'q4',text:'Андрей, как вам удобнее обсуждать варианты: голосом вечером или короткой подборкой в мессенджере?',basis:'Догадка: «Голосовые сообщения вечером»',date:day(14),deadline:day(45),bucket:'later',kind:'clarify'},
      {id:'q5',text:'Обсудили гражданство для семьи',basis:'Запрос: гражданство',date:day(-8),deadline:day(-1),bucket:'done',kind:'offer'}]}
  };
  var DEMAND={realty:{count:7,examples:[{text:'Дом у моря в Испании, рядом со школой',age:'55–64',capital:'10–25',when:'до лета'},{text:'Вилла на побережье Италии',age:'45–54',capital:'25–100',when:'в течение года'},{text:'Квартира в Дубае для сдачи',age:'35–44',capital:'3–10',when:'1–3 месяца'}]},
    aviation:{count:3,examples:[{text:'Частный самолет на зиму: 25 часов полета',age:'45–54',capital:'3–10',when:'до декабря'}]}};
  var ICAL=null,INVREV={};
  var BRIEF={
    r32:{deal:'Участок и стройка',budget:'€3–4 млн',where:'Ибица, север острова: Сан-Жуан, Сан-Мигель',when:'Купить участок до лета 2027, стройка 2 года',
      what:'Ищет участок с лицензией на строительство и видом на закат. Хочет строить сам со своим архитектором. Партнер приложил бриф клиента с требованиями и вопросами.',
      details:['Участок от 5 000 м²','Лицензия на строительство','Вид на запад','До 25 минут до аэропорта'],
      money:'Средства в ОАЭ. Стройку готов финансировать траншами',hurdles:['На севере острова почти нет участков с действующей лицензией','Нужен местный проектный менеджер'],
      seen:'Был на острове в октябре, смотрел 3 участка с местным агентом',steps:[['Запрос подтвержден',1],['Смотрел объекты',1],['Юрист в Испании',0],['Деньги готовы',1]],
      doc:{name:'Бриф клиента · участок Ибица.pdf',meta:'4 страницы · требования и вопросы',sections:[['Задача','Участок под семейную виллу 600–700 м². Хочет жить там 4 месяца в году, остальное время дом закрыт.'],['Обязательно','Действующая лицензия или реальный срок ее получения до 9 месяцев. Вода и электричество на участке. Нет линий электропередач в обзоре.'],['Желательно','Старые оливы на участке. Возможность сделать бассейн 20 м. Соседи не ближе 150 м.'],['Вопросы клиента','Сколько реально занимает получение лицензии на севере острова? Можно ли купить на испанскую компанию? Какой налог при последующей продаже через 10 лет?'],['Бюджет','Участок €1,2–1,8 млн. Стройка и дизайн до €2,2 млн. Сопровождение отдельно.']]}},
    r33:{deal:'Покупка',budget:'€1,5–2 млн',where:'Милан, Брера или Порта Нуова',when:'Хотела купить до весны 2027',
      what:'Апартаменты для поездок в оперу и на выставки, 6–8 раз в год. Важен исторический дом с консьержем и видом на внутренний двор.',
      details:['2 спальни','Исторический дом','Консьерж','Парковка'],money:'Средства в Швейцарии',hurdles:['Клиент мог уже решить вопрос через другого брокера'],
      seen:'Обсуждала с партнером в начале октября',steps:[['Запрос подтвержден',0],['Смотрел объекты',0],['Юрист в Италии',0],['Деньги готовы',1]]},
    r34:{deal:'Покупка',budget:'до €1 млн',where:'Майорка, юго-запад',when:'Отпуск летом 2027',
      what:'Небольшой дом для отпуска с дочерью, 2–3 спальни, можно под ремонт.',details:['2–3 спальни','Можно под ремонт','До 15 минут до моря'],
      money:'Личные средства, возможна ипотека 50%',hurdles:[],seen:'',steps:[['Запрос подтвержден',0],['Смотрел объекты',0],['Юрист в Испании',0],['Деньги готовы',0]]},
    r35:{deal:'Покупка в ипотеку',budget:'€450–600 тыс',where:'Валенсия, Русафа или Эль-Кармен',when:'Хочет купить до лета 2027',
      what:'Переезжает работать в Валенсию на 3–5 лет. Первый взнос 40%, остальное ипотека испанского банка.',details:['2 спальни','Новостройка или после ремонта','Терраса'],
      money:'Первый взнос €200 тыс в европейском банке',hurdles:['Нерезиденту нужна ипотека с подтверждением дохода'],seen:'',steps:[['Запрос подтвержден',1],['Смотрел объекты',0],['Юрист в Испании',0],['Деньги готовы',1]]},
    r20:{deal:'Покупка',budget:'€4–6 млн',where:'Лигурия или Тоскана, первая линия',when:'Сделка до мая 2027',
      what:'Семейный дом на 3 поколения: сам, жена, двое взрослых детей с семьями. Хочет собирать всех на лето с июня по сентябрь. Нужен участок с садом и выходом к морю, без соседей вплотную. Остальное время дом должен стоять под управлением, без сдачи посторонним.',
      details:['7–8 спален','Гостевой дом для персонала','Участок от 4 000 м²','Причал или марина до 15 минут','Аэропорт до часа езды'],
      money:'Средства на счетах в Швейцарии и ОАЭ. Платит без ипотеки, готов внести задаток 10%',
      hurdles:['Итальянскому нотариусу нужно подтвердить происхождение средств','Покупка оформляется на семейный фонд'],
      seen:'Смотрел 4 виллы в Портофино в сентябре. Отказал: мало земли и шумная дорога',
      steps:[['Запрос подтвержден',1],['Смотрел объекты',1],['Юрист в Италии',0],['Деньги готовы',1]]},
    r2:{deal:'Покупка',budget:'€2,5–3,5 млн',where:'Коста-дель-Соль: Марбелья, Сотогранде',when:'Переезд к сентябрю 2027',
      what:'Переезжает с семьей на постоянное жительство. Главное условие: британская или международная школа в 10 минутах на машине. Дом с охраняемым поселком, младшему сыну 9 лет.',
      details:['5 спален','Закрытый поселок с охраной','Школа IB до 10 минут','Сад и бассейн','Готов к заезду, без ремонта'],
      money:'Продает долю в бизнесе, деньги придут в Q2 2027 на счет в Кипре',
      hurdles:['Сделка зависит от закрытия продажи доли','Нужен испанский ВНЖ для детей до начала учебного года'],
      seen:'Шортлист школ уже есть: Aloha College и Sotogrande International',
      steps:[['Запрос подтвержден',1],['Смотрел объекты',0],['Юрист в Испании',1],['Деньги готовы',0]]},
    r9:{deal:'Покупка',budget:'€8–12 млн',where:'Сардиния, Коста-Смеральда',when:'Хочет успеть к сезону 2027',
      what:'Вилла для отдыха и приема гостей. Летом приходит на своей яхте 34 м, поэтому важна стоянка рядом. Хочет вид на море из главной спальни и место под винный погреб.',
      details:['6 спален','Вид на море','Марина Порто-Черво рядом','Винный погреб','Отдельный вход для персонала'],
      money:'Собственные средства в Монако. Рассматривает частичный кредит в швейцарском банке под залог портфеля',
      hurdles:['Ограничения на перестройку в прибрежной зоне','Продавцы просят NDA до показа'],
      seen:'Видела off-market предложение через знакомого брокера, не подошла планировка',
      steps:[['Запрос подтвержден',1],['Смотрел объекты',1],['Юрист в Италии',1],['Деньги готовы',1]]},
    r30:{deal:'Покупка и сдача',budget:'€1,8–2,5 млн',where:'Марбелья, Золотая миля или Нуэва Андалусия',when:'Решение до весны 2027',
      what:'Хочет жить в доме с ноября по март, а летом сдавать. Ждет доходность от сдачи не ниже 4% годовых. Важно управление под ключ: уборка, заезды гостей, ремонт.',
      details:['4 спальни','Лицензия на туристическую сдачу','Пешком до пляжа','Управляющая компания'],
      money:'Средства в ОАЭ, переводит через европейский банк',
      hurdles:['Нужна действующая лицензия на сдачу, новые в районе не выдают'],
      seen:'Сравнивает с апартаментами в Дубае',
      steps:[['Запрос подтвержден',1],['Смотрел объекты',0],['Юрист в Испании',0],['Деньги готовы',1]]},
    r31:{deal:'Покупка',budget:'€900 тыс – 1,3 млн',where:'Барселона, Эшампле или Сант-Жерваси',when:'До сентября 2027',
      what:'Дочь поступает в университет в Барселоне. Квартира на 4–6 лет учебы, потом под сдачу. Нужен консьерж в доме и безопасный район.',
      details:['2–3 спальни','Консьерж','До 20 минут до кампуса','Балкон или терраса'],
      money:'Деньги на счете в Казахстане, нужен понятный маршрут перевода',
      hurdles:['Перевод средств из Казахстана в испанский банк'],
      seen:'Пока изучает районы, объекты не смотрела',
      steps:[['Запрос подтвержден',1],['Смотрел объекты',0],['Юрист в Испании',0],['Деньги готовы',0]]}
  };
  var LASK={};function leadLim(){var n=Object.keys(C).filter(function(k){var c=C[k];return c.owner===ME&&!c.archived&&(c.requests||[]).some(function(r){return r.status==='open'})}).length;var u=Object.keys(LASK).length;return {need:30,per:3,n:n,used:u,left:n>=30?Math.max(0,3-u):0,asked:Object.keys(LASK)}}
  var DOS={c_atlas:'Строительный бизнес с 2000-х, сейчас девелопмент жилья, совладелец. Поволжье. Двое детей, младший школьник. Увлекается парусом и независимыми часовщиками.',
    c_sokol:'Основатель логистической компании среднего масштаба. Центральная Россия. Один ребенок. Гольф по выходным, часто летает частным бортом.',
    c_lira:'Фармдистрибуция, вышла из операционного управления. Москва и область, весной Италия. Трое взрослых детей, пятеро внуков. Опера, итальянская живопись.',
    c_borey:'Технологический предприниматель, ранняя стадия. Инвестирует активно. Детей нет.',
    c_granit:'Бизнес в промышленности, совладелец. Урал. Двое детей. Охота, часы ручной сборки.',
    c_kedr:'Собственник сети клиник, региональный масштаб. Одна дочь 12 лет. Горы и образование детей в Швейцарии.',
    c_neptun:'Девелопмент коммерческой недвижимости, основатель. Юг России, летом Сардиния. Двое детей. Яхты и вино.',
    c_orion:'Агробизнес, владелец. Юг России. Двое детей. Рыбалка, редко выезжает.',
    c_tigr:'Металлоторговля, совладелец. Сибирь. Трое детей. Охота, автомобили.',
    c_grig:'Частная медицина, сеть клиник, продал в 2022. Москва, лето в Италии. Двое сыновей. Бургундские вина, регаты.',
    c_sofia:'Ритейл, совладелец. Санкт-Петербург. Дочь 17 лет. Современная графика.',c_kost:'Финтех, основатель. Москва. Увлекается авиацией.'};
  var CAT=[{id:'roger-w-smith-isle-of-man',title:'Мастерская Роджера Смита на острове Мэн',themes:['watches'],format:'Визит',region:'Остров Мэн',online:false,terms:'Через Orbiq',cost:'По запросу',deadline:day(22).slice(0,10),verifiedAt:day(-2).slice(0,10),status:'available',deliver:'Частный визит и очередь на заказ',next:'Запрос через партнера',confirmBy:'Orbiq'},
    {id:'mille-miglia-centenary',title:'Столетие гонки Mille Miglia',themes:['travel'],format:'Событие',region:'Италия',online:false,terms:'Заявка',cost:'от €12 000',deadline:day(58).slice(0,10),verifiedAt:day(-5).slice(0,10),status:'available',deliver:'Место в команде сопровождения',next:'Запись у организатора',confirmBy:'Организатор'},
    {id:'japan-akiya-bank',title:'Дом с историей у моря',themes:['realty'],format:'Услуга',region:'Испания',online:false,terms:'',cost:'',deadline:'',verifiedAt:'',status:'idea',deliver:'Подборка из трех домов',next:'Исследование',confirmBy:'Партнер по недвижимости'},
    {id:'art-basel-qatar-2027',title:'Второй Art Basel в Дохе',themes:['art','travel'],format:'Событие',region:'Катар',online:false,terms:'VIP-карта',cost:'Бесплатно',deadline:day(-3).slice(0,10),verifiedAt:day(-30).slice(0,10),status:'available',deliver:'Превью для коллекционеров',next:'Запрос через партнера',confirmBy:'Orbiq'}];

  function meP(){return P[ME]}
  function isOwner(){return AS==='owner'}
  function net(){if(isOwner())return true;var p=meP();return p&&!p.suspended&&(p.tier==='basic'||p.tier==='paid'||p.tier==='networker')}
  function pname(pid){return pid==='orbiq'?'Orbiq':(P[pid]||{}).name}
  function leadOf(c){if(c.owner==='orbiq')return 'Orbiq';var pc=((P[c.owner]||{}).categories||[])[0];return pc?'партнер по направлению «'+CATS[pc]+'»':'партнер сети'}
  function view(c){return {id:c.id,alias:c.alias,age:c.age,capital:c.capital,kids:c.kids,investing:c.investing,interests:c.interests.slice(),requests:c.requests.filter(function(r){return r.status==='open'&&r.public}).map(function(r){return {id:r.id,cat:r.cat,text:c.publicText[r.id]||''}}),mine:false,leadBy:leadOf(c),owner:c.owner==='orbiq'?'orbiq':undefined}}
  function full(c){var o=clone(c);o.mine=c.owner===ME;if(isOwner()){o.ownerName=pname(c.owner);o.partner={id:c.owner,name:o.ownerName}}return o}
  function nextTask(cid){var t=(TASKS[ME]||[]).filter(function(t){return t.cid===cid&&!t.done}).sort(function(a,b){return a.due<b.due?-1:1})[0];return t?{title:t.title,due:t.due}:null}
  function filt(list,q){return list.filter(function(c){
    if(q.q&&norm(c.alias).indexOf(norm(q.q))<0)return false;
    if(q.cat&&!c.requests.some(function(r){return r.cat===q.cat&&r.status==='open'}))return false;
    if(q.interest&&c.interests.indexOf(q.interest)<0)return false;
    if(q.capital&&c.capital!==q.capital)return false;
    if(q.investing&&c.investing!==q.investing)return false;return true})}
  var FREE=['Андрей К.','Андрей из Казани','Марина С.','Виктор П.','Елена М.'];
  function aliasTaken(a,except){var n=norm(a);return Object.keys(C).some(function(k){return k!==except&&norm(C[k].alias)===n})}
  function freeName(){return FREE.find(function(f){return !aliasTaken(f)})||'Андрей К.'}
  function own(id){var c=C[id];if(!c||c.archived||c.owner!==ME)fail(404,'Карточка не найдена');return c}
  function needOwner(){if(!isOwner())fail(403,'Нет доступа')}
  function audit(a,o){AUD.unshift({who:isOwner()?'Владимир':meP().name,role:isOwner()?'owner':'partner',action:a,obj:o,at:nowISO(),status:'ok'})}
  function rqView(r,forOwner){var c=C[r.cid]||{};var req=(c.requests||[]).find(function(x){return x.id===r.requestId})||{};
    var o={id:r.id,status:r.status,at:r.at,cid:r.cid,alias:c.alias,request:{cat:req.cat,text:(c.publicText||{})[req.id]||req.text},offer:r.offer,terms:r.terms,attachment:r.attachment};
    if(forOwner){o.initiator={id:r.initiator,name:(P[r.initiator]||{}).name};o.cardOwner={id:c.owner,name:(P[c.owner]||{}).name};o.threads=r.threads;o.deal=r.deal}
    return o}

  function dfields(text){var f={},t=text;var m=/(\d{2})\s*(лет|год)/.exec(t);if(m){var a=+m[1];f.age=a<35?'<35':a<45?'35–44':a<55?'45–54':a<65?'55–64':'65+'}
    m=/(\d+)\s*млн/.exec(t);if(m){var v=+m[1];f.capital=v<1?'<1':v<3?'1–3':v<10?'3–10':v<25?'10–25':v<100?'25–100':'100+';var bs=t.split(/(?<=[.!?\n])\s+/).find(function(x){return /млн/.test(x)});if(bs)f.capitalBasis=bs.replace(/\(|\)/g,'').trim().slice(0,200)}
    m=/(двое|трое|один|одна|\d)\s*(детей|ребен)/i.exec(t)||/(трое|двое)/i.exec(t);if(m){f.kids={'один':1,'одна':1,'двое':2,'трое':3}[m[1].toLowerCase()]||+m[1]||null}
    if(/инвестир/i.test(t))f.investing='active';
    var I=[['яхт','Яхтинг'],['часовщик','Часы'],['опер','Опера'],['искусств','Искусство'],['графи','Графика'],['гольф','Гольф'],['охот','Охота'],['вин','Вино'],['pre-ipo','Pre-IPO']];f.interests=I.filter(function(x){return t.toLowerCase().indexOf(x[0])>=0}).map(function(x){return x[1]});
    m=/(знаком[^.\n]*|познакомились[^.\n]*)/i.exec(t);if(m)f.relation={role:/купил у меня|клиент/i.test(t)?'Клиент':'Знакомый',lastContact:new Date().toISOString().slice(0,7),topic:(/виделись[^.\n]*|общаемся[^.\n]*/i.exec(t)||[''])[0].slice(0,80)};
    var R=[[/гражданств|паспорт|внж/i,'citizenship'],[/дом|вилл|квартир/i,'realty'],[/портрет|картин|искусств/i,'art'],[/школ|университет|лагер/i,'education'],[/чекап|клиник/i,'health'],[/джет|перелет/i,'aviation']];
    var reqs=[];t.split(/(?<=[.!?\n])\s+/).forEach(function(x){if(!/хочет|ищет|думаем|нужн|просил|выбирает/i.test(x))return;R.forEach(function(r){if(r[0].test(x)&&!reqs.some(function(q){return q.cat===r[1]}))reqs.push({cat:r[1],text:x.replace(/^[—\-\s]+/,'').replace(/[.]$/,'').slice(0,120)})})});
    var miss=KQ.filter(function(k){return !k[2].test(t)}).map(function(k){return k[1]});
    return {fields:f,requests:reqs,missing:miss}}
  function heur(text){
    var props=[],contra=[];var sents=text.split(/(?<=[.!?\n])\s+/).map(function(s){return s.trim()}).filter(Boolean);
    var MAP=[[/лет|возраст/i,'about.age'],[/жив.т|город|регион/i,'about.region'],[/бывает|ездит|летает|отдыха/i,'about.places'],[/заработал|капитал|состояни/i,'business.source'],[/сейчас занимается|занимается|бизнес/i,'business.now'],[/проект|развить|запустить/i,'business.project'],[/жен|супруг|муж/i,'family.circle'],[/дет|внук|сын|доч/i,'family.kids'],[/подар/i,'family.gift'],[/хобби|свободное|выходны|увлека/i,'interests.time'],[/коллекц|часы|мастер|вино|искусств/i,'interests.subject'],[/запомнил|впечатл/i,'interests.memory'],[/формат|нравится|любит/i,'prefs.formats'],[/не предлагать|не любит|не надо/i,'prefs.no'],[/обсужда|звонить|писать|голосом/i,'prefs.style'],[/обращался|просил|спрашивал/i,'plans.asked'],[/хочет|планирует|собирается/i,'plans.next'],[/срок|до лета|к весне|к осени|в марте|до конца/i,'plans.timing']];
    var used={};
    sents.forEach(function(s){var key=null;for(var i=0;i<MAP.length;i++){if(MAP[i][0].test(s)&&!used[MAP[i][1]]){key=MAP[i][1];break}}if(!key)return;used[key]=1;
      var kind=/не знаю|неизвестно/i.test(s)?'unknown':/наверное|возможно|кажется|похоже/i.test(s)?'hypothesis':'fact';
      var v=s.replace(/^[-*\s]+/,'').replace(/[.]$/,'');var p={cell:key,value:v,kind:kind};return props.push(p)});
    return {props:props,contra:contra}
  }

  function call(r,b,q){
    if(AS==='login'&&r==='me')return {role:null};
    if(AS==='key'&&r==='me')return {role:null,email:'private@orbiqgroup.com',needKey:true,needSet:Q.get('set')==='1'};
    switch(r){
    case 'me':if(isOwner())return {role:'owner',owner:true,partner:{id:'orbiq',name:'Владимир',tier:'paid',suspended:false,tg:{connected:true}}};
      var p=meP();return {role:'partner',owner:false,access:{'net.view':net()},partner:{id:p.id,name:p.name,tier:p.tier,kind:p.kind,suspended:p.suspended,paid:p.paid,categories:p.categories,product:p.product||null,tg:{connected:p.tg.connected,on:p.tg.on},limits:{leads:leadLim()}}};
    case 'lead/ask':{var ll=leadLim();if(ll.n<ll.need)fail(403,'Сначала нужно загрузить '+ll.need+' своих клиентов с запросами');if(ll.left<1)fail(429,'Все 3 лида использованы');LASK[b.cid]=nowISO();audit('Запрос на связь с лидом',b.cid);return {ok:true,leads:leadLim()}}
    case 'auth/signup':return {ok:true,test_link:'#/fit'};
    case 'auth/request':if(/private@/.test(b.email||''))return {ok:true,password:true};return {ok:true,test_link:'#/clients'};
    case 'auth/owner-login':if(String(b.password||'').length<4)fail(403,'Почта или пароль не подошли');AS='owner';ME='orbiq';return {ok:true};
    case 'auth/owner-key':if(String(b.key||'').length<4)fail(403,'Пароль не подошел');AS='owner';ME='orbiq';return {ok:true};
    case 'auth/owner-setpw':if(String(b.password||'').length<10)fail(400,'Пароль от 10 символов');AS='owner';ME='orbiq';return {ok:true};
    case 'auth/owner-reset':return {ok:true};
    case 'auth/logout':return {ok:true};
    case 'clients':{
      var sc=q.scope||'mine';
      if(sc==='archive'){needOwner();return Object.keys(C).map(function(k){return C[k]}).filter(function(c){return c.archived}).map(function(c){return {id:c.id,alias:c.alias,ownerName:pname(c.owner),archivedAt:c.archivedAt,age:c.age,capital:c.capital}})}
      var all=Object.keys(C).map(function(k){return C[k]}).filter(function(c){return !c.archived});
      if(sc==='all'){if(!net())fail(403,'Сеть откроется со статусом «Базовый партнер»');
        return filt(all,q).map(function(c){if(isOwner()){var o=full(c);o.mine=c.owner===ME;return o}if(c.owner===ME){var f=full(c);f.next=nextTask(c.id);return f}return view(c)})}
      return filt(all.filter(function(c){return c.owner===ME}),q).map(function(c){var f=full(c);f.next=nextTask(c.id);return f})}
    case 'client/intake':{var a2=cleanAlias(b.alias);if(!a2)fail(400,'Нужно имя или псевдоним');if(aliasTaken(a2))fail(409,'Это имя уже занято. Свободный вариант: «'+freeName()+'»');
      var id5='c_'+Math.random().toString(36).slice(2,7);C[id5]=cl({id:id5,owner:ME,alias:a2,created:nowISO(),history:[{at:nowISO(),what:'Карточка создана из текста'}]});
      var h2=heur(String(b.text||''));var df2=dfields(String(b.text||''));return {card:full(C[id5]),proposals:{fields:df2.fields,cells:h2.props,requests:df2.requests},missing:df2.missing}}
    case 'client/create':{var a=cleanAlias(b.alias);if(!a)fail(400,'Нужно имя или псевдоним');if(a.length>40)fail(400,'Имя длиннее 40 символов');
      if(aliasTaken(a))fail(409,'Это имя уже занято. Свободный вариант: «'+freeName()+'»');
      var id='c_'+Math.random().toString(36).slice(2,7);C[id]=cl({id:id,owner:ME,alias:a,created:nowISO(),history:[{at:nowISO(),what:'Карточка создана'}]});return full(C[id])}
    case 'client/get':{var c=C[q.id];if(!c||c.archived)fail(404,'Карточка не найдена');if(c.owner===ME||isOwner())return full(c);if(!net())fail(404,'Карточка не найдена');return view(c)}
    case 'client/update':{var c2=own(b.id);var pt=b.patch||{};
      if(pt.alias!=null){var na=cleanAlias(pt.alias);if(aliasTaken(na,c2.id))fail(409,'Это имя уже занято. Свободный вариант: «'+freeName()+'»');pt.alias=na}
      ['alias','age','capital','kids','investing','interests','requests','relation','capitalBasis','publicText'].forEach(function(k){if(k in pt)c2[k]=pt[k]});if(pt.cells){Object.keys(pt.cells).forEach(function(k){if(pt.cells[k]==null)delete c2.cells[k];else c2.cells[k]=Object.assign({src:'manual',at:nowISO()},pt.cells[k])})}c2.updated=nowISO();return full(c2)}
    case 'client/archive':{var c3=own(b.id);c3.archived=true;c3.archivedAt=nowISO();audit('Архивирование',c3.id);return {ok:true}}
    case 'client/extract':{var c4=own(b.id);var h=heur(String(b.text||''));h.props.forEach(function(p){var ex=c4.cells[p.cell];if(ex&&ex.v&&ex.kind!=='na'&&norm(ex.v)!==norm(p.value))p.conflict=ex.v});
      if(/двое детей|два ребенка/i.test(b.text)&&c4.kids&&c4.kids!==2)h.contra.push('В тексте двое детей, в карточке '+c4.kids);
      var df=dfields(String(b.text||''));return {proposals:h.props,contradictions:h.contra,fields:df.fields,requests:df.requests,missing:df.missing}}
    case 'client/apply':{var c5=own(b.id);var before=circle(c5.cells);var ints=0;(b.items||[]).forEach(function(it){c5.cells[it.cell]={v:it.value,kind:it.kind,src:b.source||'dict',at:nowISO()};if(it.cell.indexOf('interests.')===0)ints++});
      var after=circle(c5.cells);var ch=[];var nf=after.filled-before.filled;if(nf>0)ch.push('Заполнено ячеек: +'+nf);if(ints)ch.push(ints===1?'Добавлен интерес':'Добавлены '+(ints===2?'два':ints)+' интереса');if(nf>0)ch.push('Появился повод для разговора');if(!ch.length)ch.push('Сведения уточнены');
      c5.history.unshift({at:nowISO(),what:ch[0]});return {circle:after,changed:ch}}
    case 'client/match':{var c6=C[q.id];if(!c6||(c6.owner!==ME&&!isOwner()))fail(404,'Карточка не найдена');
      if(MATCH[q.id])return MATCH[q.id];
      var it=c6.interests.length?[{itemId:IMGS[c6.alias.length%IMGS.length],title:'Подборка по интересу «'+c6.interests[0]+'»',why:'Связано с интересом: «'+c6.interests[0]+'»',deliver:'Три проверенных варианта',confirmBy:'Orbiq'}]:[];
      return {items:it,questions:c6.interests.length?[{id:'qx',text:c6.alias+', вы говорили, что вам интересно: '+c6.interests[0].toLowerCase()+'. Я увидел подходящую возможность. Вам было бы интересно?',basis:'Интерес: '+c6.interests[0],date:day(2),deadline:day(30),bucket:'now',kind:'offer'}]:[]}}
    case 'question/mark':{var m=MATCH[b.cid];if(m){var qq=m.questions.find(function(x){return x.id===b.qid});if(qq)qq.bucket=b.state==='asked'?'done':b.state}return {ok:true}}
    case 'note/list':return (NOTES[ME+'/'+q.cid]||[]);
    case 'note/add':{var k=ME+'/'+b.cid;(NOTES[k]=NOTES[k]||[]).unshift({id:uid('n'),text:String(b.text),at:nowISO()});return NOTES[k]}
    case 'note/del':{var k2=ME+'/'+b.cid;NOTES[k2]=(NOTES[k2]||[]).filter(function(n){return n.id!==b.id});return NOTES[k2]}
    case 'note/forward':{if(!net())fail(403,'Передача через Orbiq откроется со статусом «Базовый партнер»');var id2=uid('rq');RQ[id2]={id:id2,status:'new',at:nowISO(),initiator:ME,cid:b.cid,requestId:'',offer:b.text,terms:'',fromNote:true,threads:{initiator:[{id:uid('m'),from:'initiator',text:b.text,at:nowISO()}],cardOwner:[]}};audit('Отправка обращения',id2);return {id:id2}}
    case 'task/list':return (TASKS[ME]||[]);
    case 'task/upsert':{var L=TASKS[ME]=TASKS[ME]||[];var t=b.id&&L.find(function(x){return x.id===b.id});if(t)Object.assign(t,b);else L.push(Object.assign({id:uid('t'),done:false},b));return L}
    case 'task/del':{TASKS[ME]=(TASKS[ME]||[]).filter(function(x){return x.id!==b.id});return TASKS[ME]}
    case 'ical/rotate':ICAL='https://orbiqgroup.com/api/crm?r=ical&k='+Math.random().toString(36).slice(2,14)+Math.random().toString(36).slice(2,14);return {url:ICAL};
    case 'ical/get':return {url:ICAL};
    case 'rq/create':{if(!net())fail(403,'Предлагать через Orbiq можно со статуса «Базовый партнер»');var mp=meP();if(b.kind!=='refer'&&mp.tier==='networker')fail(403,'Нетворкер передает своих клиентов, свой продукт не предлагает');
      if(mp.tier==='basic'&&b.kind!=='refer'){var mk=function(d){var x=new Date(new Date(d).getTime()+3*3600e3);return x.getUTCFullYear()+'-'+x.getUTCMonth()};if(Object.keys(RQ).some(function(k){var r=RQ[k];return r.initiator===ME&&r.kind!=='refer'&&mk(r.at)===mk(Date.now())}))fail(429,'Лимит: одно обращение в месяц. Следующее 1-го числа')}var c7=C[b.cid];if(!c7||c7.archived)fail(404,'Карточка не найдена');if(!b.offer)fail(400,'Нужно описание предложения');
      var id3=uid('rq');RQ[id3]={id:id3,kind:b.kind||'offer',status:'new',at:nowISO(),initiator:ME,cid:b.cid,requestId:b.requestId,offer:b.offer,terms:b.terms||'',attachment:b.attachment?{id:uid('a'),name:b.attachment.name,size:''}:null,threads:{initiator:[{id:uid('m'),from:'initiator',text:b.offer,at:nowISO()}],cardOwner:[]}};audit('Отправка обращения',id3);return {id:id3,status:'new'}}
    case 'rq/mine':{var sent=Object.keys(RQ).map(function(k){return RQ[k]}).filter(function(r){return r.initiator===ME}).map(function(r){var v=rqView(r);v.thread=r.threads.initiator;return v});
      var inb=Object.keys(RQ).map(function(k){return RQ[k]}).filter(function(r){return C[r.cid]&&C[r.cid].owner===ME&&r.threads.cardOwner.length}).map(function(r){return {id:r.id,alias:C[r.cid].alias,status:r.status,thread:r.threads.cardOwner}});
      return {sent:sent,inbox:inb}}
    case 'rq/reply':{var r1=RQ[b.rid];if(!r1)fail(404,'Не найдено');var side=r1.initiator===ME?'initiator':(C[r1.cid].owner===ME?'cardOwner':null);if(!side)fail(404,'Не найдено');r1.threads[side].push({id:uid('m'),from:side,text:b.text,at:nowISO()});return {ok:true}}
    case 'rq/all':needOwner();return Object.keys(RQ).map(function(k){return rqView(RQ[k],true)}).sort(function(a,b){return a.at<b.at?1:-1});
    case 'rq/get':needOwner();if(!RQ[q.rid])fail(404,'Не найдено');return rqView(RQ[q.rid],true);
    case 'rq/send':{needOwner();var r2=RQ[b.rid];var msg={id:uid('m'),from:'orbiq',text:b.text,at:nowISO()};if(b.attachIds&&b.attachIds.length)msg.attach=b.attachIds[0];r2.threads[b.to].push(msg);if(b.to==='cardOwner'&&r2.status==='new')r2.status='passed';audit('Пересылка обращения',r2.id+' → '+(b.to==='initiator'?'инициатору':'владельцу карточки'));return rqView(r2,true)}
    case 'rq/status':{needOwner();var r3=RQ[b.rid];r3.status=b.status;if(b.deal)r3.deal=b.deal;audit('Статус обращения',r3.id+' → '+RQST[b.status]);return rqView(r3,true)}
    case 'pf/status':{var pid=q.pid&&isOwner()?q.pid:ME;var mine=Object.keys(C).map(function(k){return C[k]}).filter(function(c){return c.owner===pid&&!c.archived});
      var rows=mine.map(function(c){var r=ready6(c);return {cid:c.id,alias:c.alias,ok:r.done,reasons:BLOCKS.filter(function(b){return !r.ok[b[0]]}).map(function(b){return 'нет: '+b[1].toLowerCase()})}});
      var NM=['Алексей','Борис','Галина','Денис','Евгений','Жанна','Игорь','Ксения','Лев','Мария','Николай','Ольга','Петр','Роман','Светлана','Тимур','Ульяна','Федор','Юлия','Яков','Аркадий','Вадим','Дарья','Захар','Инна','Кирилл','Лидия','Матвей','Нонна','Остап','Полина','Руслан','Семен','Тамара','Филипп','Эмма','Юрий','Ярослава','Глеб'];
      var demo=[];if(pid==='p_oleg'||pid==='p_nina'||pid==='p_mark')for(var i=0;i<(pid==='p_mark'?50:38);i++)demo.push({cid:'d'+i,alias:NM[i%NM.length]+(i>=NM.length?' '+(i-NM.length+2):''),ok:true,reasons:[]});
      rows=demo.concat(rows);var f=PF[pid]||{status:'draft'};
      return {counted:rows.filter(function(r){return r.ok}).length,of:50,rows:rows,sample:(f.sample||[]).map(function(id){return {cid:id,alias:(C[id]||{}).alias}}),status:f.status,submittedAt:f.submittedAt,decision:f.decision,decisions:f.decisions||{},reason:f.reason}}
    case 'pf/submit':{var f2=PF[ME]=PF[ME]||{};if(f2.status==='submitted')return f2;f2.status='submitted';f2.submittedAt=nowISO();f2.sample=['c_orion','c_tigr','c_vega'];audit('Отправка портфеля','pf/'+ME);return {ok:true}}
    case 'pf/decide':{needOwner();var f3=PF[b.pid];f3.decisions=f3.decisions||{};f3.decisions[b.cid]={exists:b.exists,relation:b.relation,capital:b.capital,reason:b.reason,at:nowISO()};audit('Решение по карточке',b.cid);return {ok:true}}
    case 'pf/final':{needOwner();var f4=PF[b.pid];f4.status='decided';f4.decision=b.decision;f4.reason=b.reason;if(b.decision==='approve'){P[b.pid].tier='basic'}audit('Решение по портфелю',P[b.pid].name+' · '+b.decision);return {ok:true}}
    case 'partners':needOwner();return Object.keys(P).map(function(k){var p=clone(P[k]);p.clients=Object.keys(C).filter(function(c){return C[c].owner===k&&!C[c].archived}).length;p.ready=Object.keys(C).filter(function(c){return C[c].owner===k&&!C[c].archived&&ready6(C[c]).done}).length+({p_oleg:38,p_nina:38,p_mark:50}[k]||0);p.pf=PF[k]?{status:PF[k].status}:null;return p});
    case 'partner/invite':{needOwner();if(!b.name||!b.email)fail(400,'Нужны имя и почта');var id4='p_'+Math.random().toString(36).slice(2,7);var tx=String(b.productText||'');var sn=tx.split(/(?<=[.!?\n])\s+/).map(function(x){return x.trim()}).filter(Boolean);var pr=b.kind==='networker'?null:{summary:(sn[0]||'').replace(/[.]$/,'').slice(0,160),whoNeeds:(sn.find(function(x){return /для|кому|клиент/i.test(x)})||sn[1]||'').replace(/[.]$/,''),fitSignals:['Капитал от $3 млн'].concat(/дет/i.test(tx)?['Дети или внуки']:[]).concat(/бизнес/i.test(tx)?['Бизнес за рубежом']:[]),categories:b.categories||[],typicalEarnPerClient:{min:(+(/(\d+)\s*(тыс|000)/.exec(tx)||[0,5])[1])*1000||5000,max:20000,currency:'USD'}};
      P[id4]={id:id4,name:b.name,email:b.email,tier:b.kind==='networker'?'networker':'new',kind:b.kind||'supplier',suspended:false,categories:b.categories||[],tg:{connected:false,on:{}},clients:0,invite:{status:'created',expires:day(7)},product:pr};audit('Приглашение партнера',b.name);return {pid:id4,product:pr,link:'https://orbiqgroup.com/api/crm?r=pinv/accept&t='+Math.random().toString(36).slice(2,18),expires:day(7)}}
    case 'partner/get':{needOwner();var pp=clone(P[q.pid]);if(!pp)fail(404,'Партнер не найден');pp.clients=Object.keys(C).filter(function(c){return C[c].owner===q.pid}).length;return {partner:pp,history:(PH[q.pid]||[]).map(function(h,i){return Object.assign({i:i},h)})}}
    case 'partner/update':{needOwner();var p0=P[b.pid];PH[b.pid]=PH[b.pid]||[];PH[b.pid].unshift({at:new Date().toISOString(),kind:'profile',before:{name:p0.name,categories:p0.categories},after:{name:b.name,categories:b.categories}});p0.name=b.name;p0.categories=b.categories;return {ok:true}}
    case 'partner/restore':{needOwner();var h=(PH[b.pid]||[])[b.i];if(!h)fail(404,'Версия не найдена');if(h.kind==='product')P[b.pid].product=h.before;else{P[b.pid].name=h.before.name;P[b.pid].categories=h.before.categories}return {ok:true}}
    case 'partner/reinvite':needOwner();P[b.pid].invite={status:'created',expires:day(7)};return {link:'https://orbiqgroup.com/api/crm?r=pinv/accept&t='+Math.random().toString(36).slice(2,18),expires:day(7)};
    case 'partner/revoke':needOwner();P[b.pid].invite.status='revoked';audit('Отзыв приглашения',P[b.pid].name);return {ok:true};
    case 'partner/suspend':needOwner();P[b.pid].suspended=!!b.on;audit(b.on?'Приостановка партнера':'Возврат доступа',P[b.pid].name);return {ok:true};
    case 'partner/tier':needOwner();P[b.pid].tier=b.tier;audit('Смена тарифа',P[b.pid].name+' → '+TIER[b.tier]);return {ok:true};
    case 'partner/payment':{needOwner();var pp2=P[b.pid];pp2.paid=pp2.paid||{seats:[]};pp2.paid['pay'+b.which]=b.at;if(b.which===1){var d=new Date(b.at);d.setDate(d.getDate()+90);pp2.paid.pay2Due=d.toISOString()}audit('Платеж '+b.which,pp2.name+' · $'+b.amount);return {ok:true}}
    case 'partner/product':{if(b&&b.pid){needOwner();PH[b.pid]=PH[b.pid]||[];PH[b.pid].unshift({at:new Date().toISOString(),kind:'product',before:P[b.pid].product||null,after:b.product});P[b.pid].product=b.product;audit('Карточка продукта',P[b.pid].name);return {ok:true}}if(b&&b.suggest)return {ok:true};return {product:(meP()||{}).product||null}}
    case 'product/suggest':return {ok:true};
    case 'stats/public':return Q.get('empty')==='1'?{clients:0,byCapital:[],capitalSum:{min:0,max:0},withRequests:0,ticker:[]}:{clients:128,byCapital:[{range:'1–3',count:22},{range:'3–10',count:41},{range:'10–25',count:28},{range:'25–100',count:14},{range:'100+',count:4}],capitalSum:{min:1240,max:3410},withRequests:57,
      ticker:[{catTitle:'Гражданство и ВНЖ',capital:'10–25',age:'55–64',ago:'2 дня назад'},{catTitle:'Недвижимость',capital:'25–100',age:'45–54',ago:'3 дня назад'},{catTitle:'Образование детей',capital:'3–10',age:'45–54',ago:'4 дня назад'},{catTitle:'Искусство',capital:'10–25',age:'65+',ago:'5 дней назад'},{catTitle:'Здоровье',capital:'25–100',age:'55–64',ago:'неделю назад'},{catTitle:'Авиация и яхты',capital:'100+',age:'45–54',ago:'неделю назад'}]};
    case 'fit/list':{var mp2=meP();if(!mp2||!mp2.product)fail(403,'Подборка строится под продукт поставщика');var cats=mp2.product.categories||[];var e=mp2.product.typicalEarnPerClient||{min:5000,max:15000};
      var rowsF=Object.keys(C).map(function(k){return C[k]}).filter(function(c){return !c.archived&&c.owner!==ME}).map(function(c){var hr=(c.requests||[]).filter(function(r){return r.status==='open'&&cats.indexOf(r.cat)>=0}).sort(function(a,b){return a.at<b.at?1:-1});var hit=hr.length>0;var mult=c.capital==='25–100'||c.capital==='100+'?1.6:c.capital==='10–25'?1.2:c.capital==='3–10'?.9:.6;
        return {cid:c.id,alias:c.alias,age:c.age,capital:c.capital,dossier:DOS[c.id]||((c.interests||[]).length?'Интересы: '+c.interests.join(', ').toLowerCase()+'.':'Сведений пока немного.'),whyFit:hit?'Открытый запрос в направлении партнера':((c.kids>0&&mp2.product.fitSignals.join(' ').match(/дет/i))?'Семья с детьми, это признак клиента продукта':'Капитал и интересы совпадают с признаками продукта'),potential:{min:Math.round(e.min*mult/1000)*1000,max:Math.round(e.max*mult/1000)*1000},hasRequest:hit,reqAt:hit?hr[0].at:'',reqText:hit?hr[0].text:'',reqBrief:hit?BRIEF[hr[0].id]||null:null,leadBy:leadOf(c)}}).filter(function(r){return r.hasRequest}).sort(function(a,b){return a.reqAt<b.reqAt?1:-1});
      var pmin=0,pmax=0;rowsF.forEach(function(r){pmin+=r.potential.min;pmax+=r.potential.max});return {total:rowsF.length,potential:{min:pmin,max:pmax},rows:rowsF}}
    case 'seat/list':{if(q.cat){var tk=Object.keys(P).filter(function(k){return P[k].paid&&(P[k].paid.seats||[]).indexOf(q.cat)>=0});return {cat:q.cat,max:2,seats:tk.map(function(k){return {pid:k}}),waitlist:[]}}needOwner();return Object.keys(CATS).map(function(c){return {cat:c,max:2,seats:Object.keys(P).filter(function(k){return P[k].paid&&(P[k].paid.seats||[]).indexOf(c)>=0}).map(function(k){return {pid:k,name:P[k].name}}),waitlist:c==='watches'?[{name:'Заявка в листе ожидания'}]:[]}})}
    case 'audit':needOwner();return AUD.slice(0,+(q.limit||100));
    case 'invite/create':{var p3=meP();if(isOwner()||!p3||p3.tier!=='paid')fail(403,'Семейные приглашения доступны на платном тарифе');var ci=own(b.cid);ci.invites=(ci.invites||[]).concat([Math.random().toString(16).slice(2)+Math.random().toString(16).slice(2)]);audit('Приглашение семьи',b.cid);return {link:'https://orbiqgroup.com/i/?t='+Math.random().toString(36).slice(2,18),expires:day(14)}}
    case 'tg/link':return {url:'https://t.me/orbiq_bot?start='+Math.random().toString(36).slice(2,12)};
    case 'note/edit':{var k3=ME+'/'+b.cid;var nn=(NOTES[k3]||[]).find(function(n){return n.id===b.id});if(!nn)fail(404,'Заметка не найдена');nn.text=b.text;nn.edited=nowISO();return {ok:true}}
    case 'invite/revoke':{if(INVREV[b.id])fail(409,'Отозвать можно только неактивированное приглашение');INVREV[b.id]=1;audit('Отзыв приглашения семьи',b.id.slice(0,8));return {ok:true}}
    case 'client/link':{needOwner();var A=C[b.cidA],Bc=C[b.cidB];if(!A||!Bc)fail(404,'Карточка не найдена');var lid=A.linkId||Bc.linkId||('l_'+Math.random().toString(36).slice(2,10));A.linkId=lid;Bc.linkId=lid;audit('Связь карточек',A.alias+' + '+Bc.alias);return {ok:true,linkId:lid,cids:[A.id,Bc.id]}}
    case 'client/primary':{needOwner();var ids=b.linkId?Object.keys(C).filter(function(k){return C[k].linkId===b.linkId}):[b.cid];if(!ids.some(function(k){return C[k].owner===b.pid}))fail(400,'Основным может быть только партнер, который ведет карточку этого человека');var pr={pid:b.pid,at:nowISO(),by:'client'};ids.forEach(function(k){C[k].primary=pr});audit('Основной партнер',P[b.pid].name);return {ok:true,primary:pr}}
    case 'catalog':return CAT;
    case 'catalog/upsert':{needOwner();var it=b.item;if(!it||!it.id||!it.title)fail(400,'Нужны ID и название');CAT=CAT.filter(function(x){return x.id!==it.id});CAT.unshift(it);audit('Правка каталога',it.id);return {ok:true}}
    case 'catalog/del':needOwner();CAT=CAT.filter(function(x){return x.id!==b.id});return {ok:true};
    case 'pf/all':needOwner();return Object.keys(PF).map(function(k){var f=PF[k];return {pid:k,name:P[k].name,status:f.status,submittedAt:f.submittedAt,sample:f.sample}});
    case 'pf/extend':needOwner();PF[b.pid].sample.push('c_granit');return {ok:true};
    case 'owner/write':needOwner();audit('Сообщение партнеру',P[b.pid].name);return {ok:true};
    case 'tg/off':if(!isOwner())meP().tg.connected=false;return {ok:true};
    case 'tg/events':if(!isOwner())meP().tg.on=b.on;return {ok:true};
    }
    fail(403,'Нет доступа');
  }
  return {call:call,as:function(){return AS}};
})();

/* ================= Состояние, роли ================= */
var S={me:null,list:{scope:'mine',q:'',cat:'',interest:'',capital:'',investing:''},card:null,selSec:null,viewAs:'own',pending:{},prevPct:{},inbox:{f:'',sel:null},seenInterests:{}};
function isOwner(){return !!(S.me&&S.me.owner)}
function tier(){return S.me&&S.me.partner?S.me.partner.tier:null}
function ptier(){var p=S.me&&S.me.partner||{};return p.kind==='networker'?'networker':normTier(p.tier)}
function hasNet(){if(isOwner())return true;if(S.me&&S.me.access)return !!S.me.access['net.view'];var t=ptier();return (t==='basic'||t==='paid'||t==='networker')&&!S.me.partner.suspended}
function go(h){if(location.hash===h)render();else location.hash=h}

/* ================= Мелкие компоненты ================= */
function toast(t,icon){var el=$('.toast');if(!el){el=document.createElement('div');el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.innerHTML=ic(icon||'check')+'<span>'+E(t)+'</span>';el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove('on')},2600)}
function copy(t){var done=function(){toast('Скопировано','copy')};if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(done,fb);else fb();function fb(){var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');done()}catch(e){toast('Не получилось скопировать. Текст можно выделить вручную','alert')}a.remove()}}
function sheet(html,wide){closeSheet();var el=document.createElement('div');el.className='sheet';el.innerHTML='<div class="sheet-in'+(wide?' wide':'')+'" role="dialog" aria-modal="true"><button type="button" class="btn sm ic soft x" data-a="sclose" aria-label="Закрыть">'+ic('x')+'</button>'+html+'</div>';document.body.appendChild(el);el.addEventListener('mousedown',function(e){if(e.target===el)closeSheet()});requestAnimationFrame(function(){el.classList.add('on');var f=el.querySelector('input:not([type=hidden]),textarea');if(f&&matchMedia('(hover:hover)').matches)f.focus()});segs(el);return el.firstChild}
function closeSheet(){if(S.bulkBusy&&!confirm('Загрузка еще идет. Закрыть окно?'))return;$$('.sheet').forEach(function(s){s.classList.remove('on');setTimeout(function(){s.remove()},350)})}
function segs(root){$$('.seg',root||document).forEach(function(s){var p=s.querySelector('.pill');if(!p){p=document.createElement('i');p.className='pill';s.insertBefore(p,s.firstChild)}var on=s.querySelector('button.on');if(!on){p.style.width='0';return}p.style.width=on.offsetWidth+'px';p.style.transform='translateX('+(on.offsetLeft-4)+'px)'})}
function count(el,from,to,dur){if(!el)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=to;return}var t0=performance.now();dur=dur||1400;(function f(t){var k=Math.min(1,(t-t0)/dur);var e=1-Math.pow(2,-10*k);el.textContent=Math.round(from+(to-from)*(k>=1?1:e));if(k<1)requestAnimationFrame(f)})(t0)}
function catChip(cat){return '<span class="chip" style="color:'+(CATC[cat]||'#555')+'"><i class="dot"></i><span style="color:var(--ink)">'+E(CATS[cat]||cat||'Запрос')+'</span></span>'}
function stChip(s){return '<span class="st '+E(s)+'">'+E(RQST[s]||s)+'</span>'}
function mring(pct){var r=12,c=2*Math.PI*r,o=pct==null?c:c*(1-pct/100);return '<svg class="mring" viewBox="0 0 30 30" aria-label="Заполнено '+(pct==null?0:pct)+'%"><circle class="bg" cx="15" cy="15" r="'+r+'"/><circle class="fg" cx="15" cy="15" r="'+r+'" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+o.toFixed(1)+'"/><text x="15" y="15.5">'+(pct==null?'0':pct)+'</text></svg>'}
function hd(kick,title,acts){return '<div class="hd"><div><div class="kick">'+kick+'</div><h1><span class="mask"><span>'+title+'</span></span></h1></div>'+(acts?'<div class="acts">'+acts+'</div>':'')+'</div>'}
function emptyBox(t,p,b){return '<div class="empty">'+'<h3>'+t+'</h3><p>'+p+'</p>'+(b||'')+'</div>'}
function errBox(e){return '<div class="card"><p class="err">'+ic('alert')+E(e.message||'Ошибка')+'</p></div>'}
function sel(name,opts,val,ph,attrs){return '<select class="sel" name="'+name+'" '+(attrs||'')+'>'+(ph!=null?'<option value="">'+E(ph)+'</option>':'')+opts.map(function(o){return '<option value="'+E(o[0])+'"'+(String(o[0])===String(val)?' selected':'')+'>'+E(o[1])+'</option>'}).join('')+'</select>'}
function catOpts(){return Object.keys(CATS).map(function(k){return [k,CATS[k]]})}
function initials(n){return String(n||'?').trim().slice(0,1).toUpperCase()}

/* ================= Каркас ================= */
function navItems(){
  if(isOwner())return [['partners','Партнеры','handshake'],['inbox','Входящие','inbox'],['mine','Мои клиенты','users'],['clients','Вся сеть','chart'],['catalog','Каталог','spark'],['reviews','Проверки','shield'],['archive','Архив','archive'],['audit','Журнал','list'],['notify','Уведомления','bell']];
  var t=ptier();
  if(t==='networker')return [['clients','Мои клиенты','users'],['help','Помощник','note']];
  return [['fit','Лиды','spark'],['clients','Мои клиенты','users'],['help','Помощник','note']]}
var GATED={requests:1,plans:1};function gated(r){return !isOwner()&&ptier()==='new'&&!!GATED[r]}
function readyN(){var l=(S.me&&S.me.partner&&S.me.partner.limits)||{};return {n:+l.ready||0,need:+l.readyNeeded||50}}
function isOrb(c){return !!c&&(c.byOrbiq===true||c.owner==='orbiq'||c.leadBy==='Orbiq'||c.orbiq===true||(c.partner&&c.partner.id==='orbiq'))}
function rqLimit(){var t=ptier();var p=S.me.partner||{};if(isOwner()||t==='paid'||t==='networker'||p.rqUnl)return {left:Infinity,max:Infinity};if(S.me.access&&S.me.access['rq.create']===false||t!=='basic')return {left:0,max:0};if(p.rqLeft!=null)return {left:+p.rqLeft,max:p.rqMax||1};
  var mk=function(d){var x=new Date(new Date(d).getTime()+3*3600e3);return x.getUTCFullYear()+'-'+x.getUTCMonth()};var now=mk(Date.now());var n=(S.sentRq||[]).filter(function(r){return r.kind!=='refer'&&r.kind!=='own'&&mk(r.created||r.at)===now}).length;return {left:Math.max(0,1-n),max:1}}
function loadSent(){if(isOwner()||ptier()!=='basic'||(S.me.partner||{}).rqLeft!=null)return Promise.resolve();return api('rq/mine').then(function(d){S.sentRq=d.sent||[]}).catch(function(){})}
function limText(){var l=rqLimit();if(l.left===Infinity)return 'Без лимита обращений';return 'Осталось обращений в этом месяце: '+l.left+' из '+l.max}
function limDots(){var l=rqLimit();if(l.left===Infinity)return '';var d='';for(var i=0;i<l.max;i++)d+='<b class="'+(i<l.left?'':'u')+'"></b>';return '<span class="lim"><i>'+d+'</i>'+E(limText())+'</span>'}
function LH(){return S.lastList||(isOwner()?'#/mine':'#/clients')}
function LHN(){return LH()==='#/mine'?'Мои клиенты':isOwner()?'Вся сеть':'Клиенты'}
function shell(active){
  var root=$('#root');
  if(!root.querySelector('.app')){
    var p=S.me.partner||{};var role=isOwner()?'Founder Orbiq':TIER[p.tier]||'';
    var items=navItems();
    var nav=items.map(function(n){return '<a href="#/'+n[0]+'" data-nav="'+n[0]+'" class="'+(gated(n[0])?'lk':'')+'">'+ic(n[2])+'<span>'+n[1]+'</span>'+(n[0]==='inbox'?'<span class="n" id="inN" hidden></span>':'')+(gated(n[0])?ic('lock','lki'):'')+(n[0]==='clients'&&!isOwner()&&ptier()==='new'?'<span class="rdy">'+LL().n+'/'+LL().need+'</span>':'')+'</a>'}).join('');
    if(isOwner())nav='<div class="grp">Orbiq</div>'+items.slice(0,8).map(function(n){return '<a href="#/'+n[0]+'" data-nav="'+n[0]+'">'+ic(n[2])+'<span>'+n[1]+'</span>'+(n[0]==='inbox'?'<span class="n" id="inN" hidden></span>':'')+'</a>'}).join('')+'<div class="grp">Мое</div>'+items.slice(8).map(function(n){return '<a href="#/'+n[0]+'" data-nav="'+n[0]+'">'+ic(n[2])+'<span>'+n[1]+'</span></a>'}).join('');
    var tb=items.slice(0,4).map(function(n){return '<a href="#/'+n[0]+'" data-nav="'+n[0]+'">'+ic(n[2])+'<span>'+n[1]+'</span>'+(n[0]==='inbox'?'<span class="n" id="inN2" hidden></span>':'')+'</a>'}).join('')+'<button type="button" data-a="more">'+ic('more')+'<span>Еще</span></button>';
    root.innerHTML='<div class="app"><aside class="side"><a class="logo" href="#/"><span><b>ORBIQ</b><small>'+(isOwner()?CAB.owner:CAB.partner)+'</small></span></a><nav class="nav">'+nav+'</nav>'+(isOwner()?'':'<button type="button" class="howto" data-a="howto">'+ic('spark')+'<span>Как это работает</span><small>1 мин</small></button>')+'<div class="mebox"><span class="av">'+E(initials(p.name))+'</span><span><b>'+E(p.name||'')+'</b><small>'+E(role)+'</small></span><button type="button" data-a="logout" title="Выйти" aria-label="Выйти">'+ic('out')+'</button></div></aside>'+
      '<div><header class="top"><span><b>ORBIQ</b><br><small>'+E(role)+'</small></span><span class="av" style="width:34px;height:34px;border-radius:50%;background:conic-gradient(from 200deg,#fff3c9,#b5862a,#f6d97c,#8a6416,#fff3c9);display:grid;place-items:center;font-family:var(--s);font-stretch:112%;font-weight:700">'+E(initials(p.name))+'</span></header><main class="main" id="main"></main></div><nav class="tabbar">'+tb+'</nav></div>';
    if(isOwner())api('rq/all').then(function(l){var n=l.filter(function(r){return r.status==='new'}).length;['inN','inN2'].forEach(function(id){var e=$('#'+id);if(e&&n){e.hidden=false;e.textContent=n}})}).catch(function(){});
  }
  if(active==='clients'&&isOwner()&&LH()==='#/mine')active='mine';
  $$('[data-nav]').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-nav')===active)});
  return $('#main');
}
function page(active,html,after){
  var m=shell(active);
  var swap=function(){m.innerHTML=html;segs(m);if(after)after(m);window.scrollTo(0,0)};
  if(document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&m.childElementCount){var vt=document.startViewTransition(swap);['ready','finished','updateCallbackDone'].forEach(function(k){if(vt[k])vt[k].catch(function(){})})}else swap();
}
function loading(active){var m=shell(active);m.innerHTML='<div class="loading"><i></i></div>'}

/* ================= Вход ================= */
function wall(){var cols=[];for(var c=0;c<5;c++){var im=[];for(var i=0;i<8;i++){im.push(IMGS[(c*3+i)%IMGS.length])}cols.push('<div class="lg-c">'+im.concat(im).map(function(x){return '<img src="'+img(x)+'" alt="" loading="lazy">'}).join('')+'</div>')}return '<div class="lg-wall" aria-hidden="true">'+cols.join('')+'</div>'}
var COINB={'first1m-jet-card':'40% 60%','cars-concours-judge':'60% 50%','bonneville-200-club':'60% 55%','garrard-tiara-rental':'50% 45%','lapland-ice-tracks':'50% 65%'};
function coin(key){if(key)return '<span class="coin key"><span class="cw">'+ic('key')+'</span></span>';var b=Object.keys(COINB).sort(function(){return Math.random()-.5})[0],t=IMGS.filter(function(x){return x!==b}).sort(function(){return Math.random()-.5}).slice(0,2),s=[[t[0],''],[b,' style="object-position:'+COINB[b]+'"'],[t[1],'']];return '<span class="coin"><span class="cw">'+s.map(function(x,k){return '<span class="sg s'+k+'"><img src="'+img(x[0])+'" alt=""'+x[1]+'></span>'}).join('')+'</span><svg class="cl" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 50V0M50 50L93.3 75M50 50L6.7 75"/></svg></span>'}
function words(t){return t.split(' ').map(function(w,i){return '<span class="w" style="--i:'+i+'">'+E(w)+'</span>'}).join(' ')}
function vLogin(){
  $('#root').innerHTML='<div class="lgn">'+wall()+'<span class="lg-logo">ORBIQ</span><span class="lg-tag">'+E(CAB.tag)+'</span><div class="lg-card"><img class="lg-coin" src="/crm/coin-login.webp" alt="" width="112" height="112"><h1>ORBIQ ROOM</h1><div class="lst" id="lst"></div><div id="lgm" style="width:100%"><form class="lg-f" id="lgf" novalidate><label class="sr" for="lge">Почта</label><input id="lge" type="email" inputmode="email" autocomplete="email" placeholder="Почта" required><button type="submit" aria-label="Получить ссылку">'+ic('ar')+'</button></form><p class="lg-e" id="lgerr" hidden></p><p class="lg-n">Пароль не нужен: ссылка для входа придет на почту</p></div></div></div>';
  var LM={expired:'Ссылка устарела или уже открыта. Нужна новая ссылка',suspended:'Доступ приостановлен. Связь через Orbiq'},IM={used:'Приглашение уже использовано. Вход по почте',revoked:'Приглашение отозвано',expired:'Срок приглашения истек. Нужна новая ссылка',invalid:'Ссылка приглашения не подошла'};
  var pm=LM[Q.get('login')]||IM[Q.get('invite')];if(pm){var e0=$('#lgerr');e0.hidden=false;e0.textContent=pm}
  loginStats();
  var su=document.createElement('button');su.type='button';su.className='lg-lnk lg-su';su.textContent='Регистрация партнера';var lc=$('.lg-card');if(lc&&!$('.lg-su'))lc.appendChild(su);su.addEventListener('click',signupStage);if(Q.get('signup')==='1')setTimeout(signupStage,0);
  var f=$('#lgf');f.addEventListener('submit',function(e){e.preventDefault();var em=$('#lge').value.trim();var er=$('#lgerr');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){er.hidden=false;er.textContent='Адрес почты с ошибкой';return}
    er.hidden=true;f.classList.add('busy');
    api('auth/request',{email:em}).then(function(r){if(r&&r.password)return pwStage(em);$('#lgm').innerHTML='<div class="lg-ok"><svg class="i" viewBox="0 0 24 24" style="width:44px;height:44px;stroke-width:1.3"><path d="M3 6h18v12H3z"/><path d="m3 7 9 7 9-7"/></svg><p>Если адрес есть в Orbiq, письмо уже в пути на <b>'+E(em)+'</b>. Вход по ссылке из письма.</p>'+(r.test_link?'<a class="lg-l" href="'+E(r.test_link)+'" data-a="demoin">Предпросмотр: войти</a>':'')+'<button type="button" class="lg-l" data-a="relogin">Другая почта</button></div>'})
    .catch(function(e2){f.classList.remove('busy');er.hidden=false;er.textContent=e2.status===429?'Слишком много попыток. Повтор через час':e2.message})});
}
function capSum(x){if(!x||(!x.min&&!x.max))return '';var f=function(v){return v>=1000?(Math.round(v/100)/10).toString().replace('.',','):String(Math.round(v))};var big=(x.max||x.min)>=1000;
  if(big&&x.min<1000)return '$'+Math.round(x.min)+' млн – '+f(x.max)+' млрд';return '$'+f(x.min)+(x.max&&x.max!==x.min?'–'+f(x.max):'')+(big?' млрд':' млн')}
var SAMPLE_STATS={clients:128,byCapital:[{range:'1–3',count:22},{range:'3–10',count:41},{range:'10–25',count:28},{range:'25–100',count:14},{range:'100+',count:4}],capitalSum:{min:1240,max:3410},withRequests:57,
      ticker:[{catTitle:'Гражданство и ВНЖ',capital:'10–25',age:'55–64',ago:'2 дня назад'},{catTitle:'Недвижимость',capital:'25–100',age:'45–54',ago:'3 дня назад'},{catTitle:'Образование детей',capital:'3–10',age:'45–54',ago:'4 дня назад'},{catTitle:'Искусство',capital:'10–25',age:'65+',ago:'5 дней назад'},{catTitle:'Здоровье',capital:'25–100',age:'55–64',ago:'неделю назад'},{catTitle:'Авиация и яхты',capital:'100+',age:'45–54',ago:'неделю назад'}]};
function loginStats(){var box=$('#lst');if(!box)return;
  api('stats/public').then(function(d){if(!$('#lst'))return;d=d||{};var n=+d.clients||0;
    if(!n){if(Q.get('sample')==='1'){d=SAMPLE_STATS;n=d.clients}else{box.innerHTML='';return}}
    var bc=(d.byCapital||[]).filter(function(x){return x.count>0}).sort(function(a,b){return CAPS.indexOf(b.range)-CAPS.indexOf(a.range)}).slice(0,4);var tot=bc.reduce(function(s2,x){return s2+x.count},0)||1;
    box.innerHTML='<div class="ls-row"><span><b id="lsn">0</b> '+plural(n,'семья','семьи','семей')+'</span>'+(capSum(d.capitalSum)?'<span class="ls-d"></span><span><b>'+E(capSum(d.capitalSum))+'</b></span>':'')+(d.withRequests?'<span class="ls-d"></span><span><b id="lsr">0</b> '+plural(d.withRequests,'активный запрос','активных запроса','активных запросов')+'</span>':'')+'</div>'+
     (bc.length?'<div class="ls-bar">'+bc.map(function(x,i){return '<i style="flex:'+x.count+';--i:'+i+'"></i>'}).join('')+'</div><div class="ls-leg">'+bc.map(function(x,i){return '<span style="--i:'+i+'"><i></i>'+E(capL(x.range))+' <b>'+x.count+'</b></span>'}).join('')+'</div>':'');
    count($('#lsn'),0,n,1400);if($('#lsr'))count($('#lsr'),0,+d.withRequests,1400);
    var tk=(d.ticker||[]).map(function(x){return '<span>'+E(x.catTitle||CATS[x.cat]||'Запрос')+'<i>·</i>'+E(capL(x.capital))+'<i>·</i>'+E(ageL(x.age))+'<i>·</i><em>'+E(x.ago||'')+'</em></span>'}).join('');
    if(tk){var t=document.createElement('div');t.className='ltk';t.setAttribute('aria-label','Последние запросы в сети');t.innerHTML='<div class="ltk-in" style="--d:'+Math.max(20,(d.ticker||[]).length*5)+'s">'+tk+tk+'</div>';$('.lgn').appendChild(t)}
  }).catch(function(){box.innerHTML=''})}
function signupStage(){var box=$('#lgm');if(!box)return;var su=$('.lg-su');if(su)su.hidden=true;
  var opts=Object.keys(CATS).map(function(k){return '<option value="'+k+'">'+E(CATS[k])+'</option>'}).join('');
  box.innerHTML='<form id="suf" class="lg-fs" novalidate><p class="lg-p">Кабинет партнера: задачи клиентов сети под свою категорию, загрузка своих клиентов, связь через Orbiq</p>'+
   '<input class="lg-in" id="sun" name="given-name" autocomplete="given-name" placeholder="Имя" required>'+
   '<input class="lg-in" id="sue" type="email" name="email" autocomplete="email" inputmode="email" placeholder="Почта" required>'+
   '<select class="lg-in" id="suc" required><option value="">Категория</option>'+opts+'</select>'+
   '<input class="lg-in" id="sua" placeholder="Чем занимается, одной строкой">'+
   '<div class="lg-err" id="suerr" hidden></div>'+btn('Зарегистрироваться','pri','type="submit"','ar')+'</form>';
  var f=$('#suf');f.addEventListener('submit',function(e){e.preventDefault();var er=$('#suerr');var b={name:$('#sun').value.trim(),email:$('#sue').value.trim(),cat:$('#suc').value,about:$('#sua').value.trim()};
    var bad=!b.name?'Нужно имя':!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)?'Адрес почты с ошибкой':!b.cat?'Нужна категория':'';if(bad){er.hidden=false;er.textContent=bad;return}
    er.hidden=true;f.classList.add('busy');
    api('auth/signup',b).then(function(r){if(DEMO&&r&&r.test_link){location.href='?demo=1&as=new&onb=1'+r.test_link;return}
      box.innerHTML='<div class="lg-ok"><h2>Ссылка для входа отправлена</h2><p class="lg-p">Письмо на '+E(b.email)+'. Ссылка открывает кабинет 30 дней на любом устройстве</p></div>'})
    .catch(function(e2){f.classList.remove('busy');er.hidden=false;er.textContent=e2.status===429?'Слишком много попыток. Повтор позже':e2.message})});
  var n=$('#sun');if(n&&matchMedia('(hover:hover)').matches)n.focus()}
function pwStage(em){var box=$('#lgm');if(!box)return;
  box.innerHTML='<form class="lg-fs" id="opf" method="post" action="#" autocomplete="on"><div class="lg-f lg-ro"><label class="sr" for="opu">Почта</label><input id="opu" name="username" type="email" autocomplete="username" value="'+E(em)+'" readonly tabindex="-1"></div><div class="lg-f"><label class="sr" for="opp">Пароль</label><input id="opp" name="password" type="password" autocomplete="current-password" placeholder="Пароль" required><button type="button" class="lg-eye" id="opeye" aria-label="Показать пароль">'+ic('eye')+'</button><button type="submit" aria-label="Войти">'+ic('ar')+'</button></div></form><p class="lg-e" id="operr" hidden></p><p class="lg-n"><button type="button" class="lg-lnk" id="opfg">Забыли пароль?</button> · <button type="button" class="lg-lnk" data-a="relogin">Другая почта</button></p>';
  var f=$('#opf'),inp=$('#opp'),er=$('#operr');setTimeout(function(){inp.focus()},50);
  $('#opeye').addEventListener('click',function(){inp.type=inp.type==='password'?'text':'password';inp.focus()});
  f.addEventListener('submit',function(e){e.preventDefault();if(!inp.value)return;var fb=f.querySelector('.lg-f:not(.lg-ro)');fb.classList.add('busy');er.hidden=true;
    api('auth/owner-login',{email:em,password:inp.value}).then(function(){return boot('#/partners')}).catch(function(e2){fb.classList.remove('busy');er.hidden=false;er.textContent=e2.status===429?'Слишком много попыток. Повтор через 15 минут':'Почта или пароль не подошли'})});
  $('#opfg').addEventListener('click',function(){var b=this;b.disabled=true;api('auth/owner-reset',{email:em}).then(function(){b.parentNode.textContent='Ссылка для нового пароля отправлена на '+em+'. Она действует 1 час'}).catch(function(){b.disabled=false;er.hidden=false;er.textContent='Письмо не отправлено, повтор позже'})});
}
function vKey(){
  var set=!!(S.me&&S.me.needSet);
  $('#root').innerHTML='<div class="lgn">'+wall()+'<span class="lg-logo">ORBIQ</span><span class="lg-tag">'+E(CAB.tag)+' · второй шаг</span><div class="lg-card"><h1 class="sm">'+(set?'НОВЫЙ ПАРОЛЬ':'ПАРОЛЬ')+'</h1><p class="lg-sub">'+(set?'Почта подтверждена. Нужен новый пароль от 10 символов: дальше вход по почте и паролю':'Почта подтверждена. Нужен пароль Founder')+'</p><form class="lg-fs" id="kf" method="post" action="#" autocomplete="on"><label class="sr" for="ku">Почта</label><div class="lg-f lg-ro"><input id="ku" name="username" type="email" autocomplete="username" value="'+E((S.me&&S.me.email)||'')+'" readonly tabindex="-1"></div><div class="lg-f"><label class="sr" for="kk">Пароль</label><input id="kk" name="password" type="password" autocomplete="'+(set?'new-password':'current-password')+'" placeholder="'+(set?'Новый пароль':'Пароль')+'" minlength="'+(set?10:1)+'" required><button type="button" class="lg-eye" id="keye" aria-label="Показать пароль">'+ic('eye')+'</button><button type="submit" aria-label="'+(set?'Сохранить пароль':'Войти')+'">'+ic('ar')+'</button></div></form><p class="lg-e" id="kerr" hidden></p>'+(set?'<p class="lg-n">Сессия Founder действует 12 часов</p>':'<p class="lg-n"><button type="button" class="lg-lnk" id="kfg">Забыли пароль?</button></p>')+'</div></div>';
  var f=$('#kf'),fb=f.querySelector('.lg-f:not(.lg-ro)'),inp=$('#kk'),er=$('#kerr');
  function err(t){er.hidden=false;er.textContent=t}
  $('#keye').addEventListener('click',function(){inp.type=inp.type==='password'?'text':'password';inp.focus()});
  f.addEventListener('submit',function(e){e.preventDefault();var k=inp.value;if(!k)return;if(set&&k.length<10)return err('Нужно от 10 символов');fb.classList.add('busy');er.hidden=true;
    (set?api('auth/owner-setpw',{password:k}):api('auth/owner-key',{key:k})).then(function(){return boot('#/partners')}).catch(function(e2){fb.classList.remove('busy');
      if(e2.status===409){S.me.needSet=true;return vKey()}
      err(e2.status===429?'Слишком много попыток. Повтор через 15 минут':set?(e2.message||'Пароль не сохранен'):'Пароль не подошел')})});
  var fg=$('#kfg');if(fg)fg.addEventListener('click',function(){fg.disabled=true;
    api('auth/owner-reset',{}).then(function(){fg.parentNode.textContent='Ссылка для нового пароля отправлена на почту. Она действует 1 час'}).catch(function(e2){fg.disabled=false;err(e2.status===429?'Слишком много запросов. Повтор позже':'Письмо не отправлено, повтор позже')})});
}

/* ================= Клиенты ================= */
var INTERESTS_BASE=['Часы','Искусство','Архитектура','Яхтинг','Авиация','Гольф','Вино','Охота','Образование','Здоровье','Технологии'];
function vClients(mode){
  var L=S.list;var om=isOwner()&&mode==='mine';
  if(isOwner())L.scope=om?'mine':'all';else if(!hasNet())L.scope='mine';
  S.lastList=isOwner()?(om?'#/mine':'#/clients'):'#/clients';
  var t=ptier();
  var acts=isOwner()&&!om?'':(isOwner()?'':btn('Загрузить списком','soft','data-a="bulk"','upload'))+btn('Добавить клиента','pri mag','data-a="newc"','plus');
  var anon=isOwner()&&!om?'':'<div class="anon rv"><span class="ico">'+ic('lock')+'</span><ol><li><b>01</b>Имя или псевдоним, без фамилии</li><li><b>02</b>Контакты остаются у партнера</li><li><b>03</b>'+(om?'Сеть видит пометку «Ведет Orbiq»':'Клиенты остаются за партнером. Другие партнеры видят их обезличенно')+'</li></ol><button type="button" class="lk" data-a="howsee">Как видят партнеры</button></div>';
  var scope=isOwner()?'':'<div class="seg" role="tablist"><button type="button" class="'+(L.scope==='mine'?'on':'')+'" data-a="scope" data-v="mine">Мои</button><button type="button" class="'+(L.scope==='all'?'on':'')+'" data-a="scope" data-v="all" '+(hasNet()?'':'disabled title="Откроется со статусом «Базовый партнер»"')+'>Все</button></div>';
  var ints=Object.keys(S.seenInterests).concat(INTERESTS_BASE).filter(function(v,i,a){return a.indexOf(v)===i}).sort();
  var tools='<div class="tools">'+scope+'<label class="search">'+ic('search')+'<input class="in" type="search" id="cq" placeholder="Поиск по имени" value="'+E(L.q)+'" aria-label="Поиск по имени"></label>'+
    '<span class="fsel">'+sel('cat',catOpts(),L.cat,'Тип запроса','data-f="cat" class="sel'+(L.cat?' on':'')+'"')+'</span>'+
    '<span class="fsel">'+sel('interest',ints.map(function(x){return [x,x]}),L.interest,'Интересы','data-f="interest"')+'</span>'+
    '<span class="fsel">'+sel('capital',CAPS.map(function(c){return [c,capL(c)]}),L.capital,'Капитал','data-f="capital"')+'</span>'+
    '<span class="fsel">'+sel('investing',Object.keys(INV).map(function(k){return [k,INV[k]]}),L.investing,'Инвестирует','data-f="investing"')+'</span>'+
    (L.cat||L.interest||L.capital||L.investing||L.q?'<button type="button" class="link mute" data-a="fclear">Сбросить</button>':'')+'</div>';
  var note=!isOwner()&&!hasNet()?'<div class="infob rv" style="margin-bottom:14px">'+ic('info')+'<span>'+LL().need+' клиентов с запросами откроют связь с '+LL().per+' лидами. Сейчас '+LL().n+' из '+LL().need+'. <a class="link" href="#/fit">Открыть лиды</a></span></div>':'';
  page(om?'mine':'clients',hd(om?'Клиенты Orbiq · <span id="ccount">…</span>':isOwner()?'Вся сеть':'CRM · <span id="ccount">…</span>',om?'Мои клиенты':isOwner()?'Клиенты сети':'Клиенты',acts)+anon+note+tools+'<div class="tbl-w rv" style="--i:2" id="ctbl"><div class="skel" style="height:240px"></div></div>',function(m){
    $$('.fsel .sel',m).forEach(function(s){s.classList.toggle('on',!!s.value);s.addEventListener('change',function(){L[s.getAttribute('data-f')]=s.value;s.classList.toggle('on',!!s.value);refreshTable()})});
    var qi=$('#cq',m),tm;qi.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(function(){L.q=qi.value.trim();refreshTable()},220)});
    refreshTable();
  });
}
function refreshTable(){
  var L=S.list,q={scope:L.scope};['q','cat','interest','capital','investing'].forEach(function(k){if(L[k])q[k]=L[k]});
  var box=$('#ctbl');if(!box)return;
  api('clients',null,q).then(function(rows){
    rows.forEach(function(r){(r.interests||[]).forEach(function(i){S.seenInterests[i]=1})});
    var cc=$('#ccount');if(cc)cc.textContent=rows.length+' '+plural(rows.length,'карточка','карточки','карточек');
    if(!rows.length){var filt=L.q||L.cat||L.interest||L.capital||L.investing;
      box.innerHTML=filt?emptyBox('Ничего не нашли','Помогут другие фильтры или поиск','<button type="button" class="btn sec" data-a="fclear">Сбросить фильтры</button>'):L.scope==='mine'?emptyBox('Старт с одного имени','Здесь появятся клиенты партнера. Псевдонима достаточно, остальное можно надиктовать.',btn('Добавить клиента','pri','data-a="newc"','plus')):emptyBox('Пока пусто','Карточки партнеров появятся здесь');return}
    var mine=L.scope==='mine';
    box.innerHTML='<table class="tbl"><thead><tr><th>Имя</th><th>Возраст</th><th>Капитал</th><th>Основные интересы</th><th>Дети</th><th>Инвестирует</th><th>Актуальный запрос</th>'+(mine?'<th>Ближайшее действие</th>':'')+(isOwner()&&!mine?'<th>Партнер</th>':'')+'<th class="sr">Раскрыть</th></tr></thead><tbody>'+rows.map(function(c,i){
      var rq=(c.requests||[]).filter(function(r){return r.status!=='closed'});var r0=rq[0];
      var rqT=r0?(r0.text||(c.publicText&&c.publicText[r0.id])||''):'';if(r0&&!c.mine&&!isOwner())rqT=r0.text||'Только категория';
      if(r0&&(c.mine||isOwner())&&!rqT)rqT=r0.text;
      var pct=c.circle?c.circle.pct:c.cells?circle(c.cells).pct:null;
      var ints=c.interests||[];
      return '<tr data-a="open" data-id="'+E(c.id)+'" class="rv" style="--i:'+Math.min(i,12)+'"><td class="c-nm"><span class="nm">'+(c.mine||c.owner==='orbiq'&&isOwner()?rdots(c):'')+E(c.alias)+(c.mine&&!mine?'<span class="mine">свой</span>':'')+(!c.mine&&!isOwner()&&isOrb(c)?'<span class="chip orb mono" style="font-size:9.5px">Ведет Orbiq</span>':'')+'</span></td>'+
      '<td class="x num" data-l="Возраст">'+E(ageL(c.age))+'</td><td class="x num" data-l="Капитал">'+E(capL(c.capital))+'</td>'+
      '<td class="x" data-l="Интересы">'+(ints.length?E(ints.slice(0,2).join(', '))+(ints.length>2?' <span class="more">+'+(ints.length-2)+'</span>':''):'<span class="mu">—</span>')+'</td>'+
      '<td class="x num" data-l="Дети">'+(c.kids==null||c.kids===''?'<span class="mu">—</span>':E(c.kids))+'</td>'+
      '<td class="x" data-l="Инвестирует">'+(INV[c.investing]?E(INV[c.investing]):'<span class="mu">—</span>')+'</td>'+
      '<td class="c-rq">'+(r0?'<span class="rq"><i class="dot" style="color:'+(CATC[r0.cat]||'#999')+'"></i><span class="t">'+E(rqT||CATS[r0.cat])+'</span>'+(rq.length>1?'<span class="more">еще '+(rq.length-1)+'</span>':'')+'</span>':'<span class="mu">—</span>')+'</td>'+
      (mine?'<td class="x nx" data-l="Действие">'+(c.next?'<b>'+E(c.next.title)+'</b><small class="'+(parseDue(c.next.due)<new Date()?'late':'')+'">'+E(relDay(c.next.due))+'</small>':'<span class="mu">—</span>')+'</td>':'')+
      (isOwner()&&!mine?'<td class="x" data-l="Партнер">'+(isOrb(c)?'<span class="chip orb mono">Orbiq</span>':E(c.ownerName||'—'))+'</td>':'')+
      '<td class="c-exp"><button type="button" class="exp" data-a="exp" aria-label="Подробнее">'+ic('down')+'</button></td></tr>'}).join('')+'</tbody></table>';
  }).catch(function(e){box.innerHTML=errBox(e)});
}

function howSee(){
  sheet('<div class="kick">Обезличенная карточка</div><h2>Что видят другие партнеры</h2>'+
  '<div class="split" style="margin-top:4px"><div class="y"><h3>Видит только партнер</h3><ul><li>'+ic('lock')+'Кто это и как с ним связаться</li><li>'+ic('lock')+'Круг 360° и подробности</li><li>'+ic('lock')+'Заметки, планы, история</li><li>'+ic('lock')+'Импорт и диктовка</li></ul></div><div class="n"><h3>Видит сеть</h3><ul><li>'+ic('check')+'Псевдоним</li><li>'+ic('check')+'Возраст и капитал диапазоном</li><li>'+ic('check')+'Интересы, дети, инвестиции</li><li>'+ic('check')+'Запрос в формулировке партнера</li></ul></div></div>'+
  '<p class="hint">Владелец карточки скрыт. Предложения идут только через Orbiq, партнер решает, передавать ли их клиенту. Полную анонимность обещать нельзя: редкие сочетания деталей лучше не указывать.</p>');
}

/* ================= Новая карточка ================= */
function vNew(){
  page('clients','<a class="back" href="'+LH()+'">'+ic('al')+LHN()+'</a>'+hd('Новая карточка','Добавить клиента')+
  '<div class="newc"><form class="card bigf rv" id="nf" novalidate><label class="lbl" for="na">Имя или псевдоним</label><input class="bigin" id="na" maxlength="40" autocomplete="off" placeholder="Например, Андрей"><p class="err" id="nerr" hidden></p><p class="hint">Контакты остаются у партнера. Другие партнеры видят общую карточку и могут передать предложение через Orbiq.</p><div class="row">'+btn('Создать карточку','pri mag','type="submit"','ar')+'<a class="link mute" href="#/clients">Отмена</a></div></form>'+
  '<div class="split rv" style="--i:2"><div class="y"><span class="kick" style="color:var(--acc)">Остается у партнера</span><h3>Фамилия, контакты, компания</h3><ul><li>'+ic('lock')+'Полное имя</li><li>'+ic('lock')+'Телефон и почта</li><li>'+ic('lock')+'Название бизнеса</li></ul></div><div class="n"><span class="kick">Попадает в CRM</span><h3>Псевдоним и запросы</h3><ul><li>'+ic('check')+'Возраст диапазоном</li><li>'+ic('check')+'Капитал диапазоном</li><li>'+ic('check')+'Интересы и запросы</li></ul></div></div></div>',function(m){
    var f=$('#nf',m),inp=$('#na',m),er=$('#nerr',m);
    f.querySelector('button[type=submit]').setAttribute('type','submit');
    inp.addEventListener('input',function(){er.hidden=true;inp.classList.remove('bad')});
    f.addEventListener('submit',function(e){e.preventDefault();var a=cleanAlias(inp.value);if(!a){er.hidden=false;er.innerHTML=ic('alert')+'Нужно имя или псевдоним';inp.classList.add('bad');return}
      var b=f.querySelector('.btn');b.disabled=true;
      api('client/create',{alias:a}).then(function(c){toast('Карточка «'+c.alias+'» создана');S.selSec=null;go('#/c/'+c.id)}).catch(function(e2){b.disabled=false;er.hidden=false;er.innerHTML=ic('alert')+E(e2.message);inp.classList.remove('bad');void inp.offsetWidth;inp.classList.add('bad');inp.focus()})});
    if(matchMedia('(hover:hover)').matches)inp.focus();
  });
}

/* ================= Кольцо 360 ================= */
function pol(r,a){var t=a*Math.PI/180;return [(100+r*Math.sin(t)).toFixed(2),(100-r*Math.cos(t)).toFixed(2)]}
function arc(r1,r2,a1,a2){var l=(a2-a1)>180?1:0,p1=pol(r2,a1),p2=pol(r2,a2),p3=pol(r1,a2),p4=pol(r1,a1);return 'M'+p1+'A'+r2+' '+r2+' 0 '+l+' 1 '+p2+'L'+p3+'A'+r1+' '+r1+' 0 '+l+' 0 '+p4+'Z'}
function ringSVG(cells,selSec,anim){
  cells=cells||{};var g='',defs='',d=0;
  SECTORS.forEach(function(s,i){
    defs+='<pattern id="h-'+s.id+'" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="'+s.hex+'" fill-opacity=".22"/><rect width="2" height="5" fill="'+s.hex+'"/></pattern>';
    var a1=i*60+1.6,a2=(i+1)*60-1.6;var cls='sg'+(selSec?(selSec===s.id?' sel':' dim'):'');
    g+='<g class="'+cls+'" data-a="sec" data-v="'+s.id+'"><title>'+E(s.name)+'</title>';
    s.q.forEach(function(q,j){var k=s.id+'.'+q[0],c=cells[k];var r1=44+j*17.5,r2=r1+15.2;var kind=c&&c.kind;
      var fill=kind==='fact'?s.hex:kind==='hypothesis'?'url(#h-'+s.id+')':null;
      var ce=fill?' style="--d:'+(d++)+'"':'';
      g+='<path class="cell'+(fill?(anim?' in':''):(kind==='na'?' na':' e'))+'" d="'+arc(r1,r2,a1,a2)+'"'+(fill?' fill="'+fill+'"':'')+ce+'><title>'+E(q[1])+(c&&c.v?' — '+c.v:'')+'</title></path>'});
    var lp=pol(103.5,(a1+a2)/2);
    g+='</g>';
  });
  return '<svg class="ring" viewBox="-6 -6 212 212" role="img" aria-label="Круг 360"><defs>'+defs+'</defs>'+g+'</svg>';
}
function ringPanel(c,anim){
  var ci=circle(c.cells),sel=S.selSec;var prev=S.prevPct[c.id];
  var center=ci.pct==null||ci.filled===0&&ci.applicable===18&&!Object.keys(c.cells||{}).length?'<span class="nd">Пока нет данных</span><span>0 из 18</span>':'<b><span id="rpct">'+(anim&&prev!=null?prev:ci.pct)+'</span><small>%</small></b><span>'+ci.filled+' из '+ci.applicable+'</span>';
  var leg=SECTORS.map(function(s){var f=s.q.filter(function(q){var x=(c.cells||{})[s.id+'.'+q[0]];return x&&x.kind==='fact'}).length;return '<button type="button" class="'+(sel===s.id?'on':'')+'" data-a="sec" data-v="'+s.id+'"><i style="background:'+s.hex+'"></i>'+E(s.name)+'<small>'+f+'/3</small></button>'}).join('');
  var sp='';
  if(sel){var s=SECTORS.find(function(x){return x.id===sel});var nq=null;
    sp='<div class="secp"><h4><i style="width:10px;height:10px;border-radius:3px;background:'+s.hex+'"></i>'+E(s.name)+'</h4><ul>'+s.q.map(function(q){var x=(c.cells||{})[s.id+'.'+q[0]];var k=x&&x.kind;if(!x||!x.v&&k!=='na')nq=nq||q[1];
      return '<li class="'+(k==='fact'?'f':k==='hypothesis'?'h':'')+'"><i style="'+(k==='fact'?'background:'+s.hex:k==='hypothesis'?'border-color:'+s.hex:'')+'"></i><span>'+(x&&x.v?E(x.v)+(k==='hypothesis'?' <small>Догадка, нужна проверка</small>':''):k==='na'?'<small>Не применимо</small>':'<small>Пока пусто</small>')+'<small>'+E(q[1])+'</small></span></li>'}).join('')+'</ul>'+
      (nq&&c.mine?'<div class="nextq"><span class="kick">Следующий вопрос</span>'+E(nq)+'</div><a class="btn sm" style="align-self:flex-start;background:#fff;color:#111" href="#/c/'+E(c.id)+'/add">'+ic('mic')+'Дописать текстом или голосом</a>':'')+'</div>'}
  var qual='';
  return '<div class="ringp spot dk" id="ringp"><div class="row" style="justify-content:space-between"><span class="kick">Круг 360° · детали</span>'+(c.mine?'<span class="kick">'+(ci.applicable<18?'Не применимо: '+(18-ci.applicable):'6 × 3')+'</span>':'')+'</div><div class="ringw">'+ringSVG(c.cells,sel,anim)+'<div class="rc">'+center+'</div></div><div class="legend">'+leg+'</div>'+sp+qual+'</div>';
}
function mountRing(c,anim){var w=$('#ringw-slot');if(!w)return;w.innerHTML=((c.mine||isOwner())&&!S.noReady?readyPanel(c):'')+ringPanel(c,anim);var ci=circle(c.cells);var prev=S.prevPct[c.id];if(anim&&ci.pct!=null)count($('#rpct'),prev!=null?prev:0,ci.pct,1400);S.prevPct[c.id]=ci.pct}

/* ================= Карточка клиента ================= */
function cardTabs(c,tab){var t0=cardTabs0(c,tab);return isOwner()?t0.replace(/<a [^>]*data-tab="plans"[^>]*>Планы<\/a>/,''):t0}
function cardTabs0(c,tab){
  var t=c.mine?[['profile','Профиль'],['match','Подборка'],['notes','Заметки'],['plans','Планы'],['history','История']]:isOwner()?[['profile','Профиль'],['notes','Заметки для себя'],['history','История']]:[['profile','Профиль'],['notes','Заметки для себя']];
  return '<nav class="tabs">'+t.map(function(x){return '<a href="#/c/'+E(c.id)+'/'+x[0]+'" data-tab="'+x[0]+'" class="'+(tab===x[0]?'on':'')+'">'+x[1]+'</a>'}).join('')+'</nav>';
}
function vCard(args){
  var id=args[0],tab=args[1]||'profile';
  if(tab==='dictate'||tab==='add')return vAdd(id);if(tab==='review')return vCheck(id);if(tab==='ai')return vAI(id);if(tab==='offer')return vOffer(id);
  var fresh=!S.card||S.card.id!==id;if(fresh){S.selSec=null;S.viewAs='own'}
  loading('clients');
  return api('client/get',null,{id:id}).then(function(c){S.card=c;
    if(isOwner()&&!S.lastList)S.lastList=isOrb(c)?'#/mine':'#/clients';
    if(!c.mine&&!isOwner())return loadSent().then(function(){vNetCard(c)});
    var ro=!c.mine;
    var acts=ro?(isOwner()?btn('Написать партнеру','pri mag','data-a="owrite"','msg'):''):btn('Дополнить','pri mag','data-a="go" data-h="#/c/'+E(c.id)+'/add"','plus')+btn('Из моей нейросети','sec','data-a="go" data-h="#/c/'+E(c.id)+'/ai"','spark')+(ptier()==='networker'?btn('Передать клиента в сеть','dark','data-a="go" data-h="#/c/'+E(c.id)+'/offer"'+(S.me.access&&S.me.access['rq.refer']===false?' disabled title="После проверки 50 готовых карточек"':''),'send'):'');
    var head='<a class="back" href="'+LH()+'">'+ic('al')+LHN()+'</a><div class="ch"><div><span class="own"><i></i>'+(ro?'Закреплена за: '+E(c.ownerName||'партнер'):isOwner()?'Клиент Orbiq':'Свой клиент')+'</span><h1><span class="mask"><span>'+E(c.alias)+'</span></span></h1><div class="meta">'+(c.mine?'<div class="seg"><button type="button" class="'+(S.viewAs==='own'?'on':'')+'" data-a="viewas" data-v="own">Свой клиент</button><button type="button" class="'+(S.viewAs==='net'?'on':'')+'" data-a="viewas" data-v="net">'+ic('eye')+' Как видят партнеры</button></div>':'<span class="chip mono dark">Только просмотр</span>')+'</div></div><div class="acts">'+acts+'</div></div>';
    var body;
    if(c.mine&&S.viewAs==='net')body=netPreview(c);
    else body='<div class="cgrid"><div class="lft" id="ringw-slot"></div><div>'+cardTabs(c,tab)+'<div id="tabc"></div></div></div>';
    page('clients',head+body,function(){if(!(c.mine&&S.viewAs==='net')){mountRing(c,fresh||S._animNext);S._animNext=false;renderTab(c,tab)}});
  }).catch(function(e){page('clients','<a class="back" href="'+LH()+'">'+ic('al')+LHN()+'</a>'+(e.status===404?emptyBox('Карточка недоступна','Ее убрали в архив или к ней нет доступа','<a class="btn sec" href="#/clients">К списку</a>'):errBox(e)))});
}
function renderTab(c,tab){var b=$('#tabc');if(!b)return;
  if(tab==='match')return tabMatch(c,b);if(tab==='notes')return tabNotes(c,b);if(tab==='plans')return tabPlans(c,b);if(tab==='history'){b.innerHTML='<div class="card rv"><div class="ql">'+((c.history||[]).length?c.history.map(function(h){return '<div><span class="kick" style="min-width:90px">'+E(fmtDate(h.at))+'</span><span>'+E(h.what)+'</span></div>'}).join(''):'<p class="hint">История появится после первых изменений</p>')+'</div></div>';return}
  tabProfile(c,b);
}
function pillGroup(k,opts,val,ro){return '<div class="pills" data-k="'+k+'">'+opts.map(function(o){return '<button type="button" class="'+(String(val)===String(o[0])?'on':'')+'" '+(ro?'disabled':'data-a="setf" data-k="'+k+'" data-v="'+E(o[0])+'"')+'>'+E(o[1])+'</button>'}).join('')+'</div>'}
function ownerLinkBlock(c){var pr=c.primary&&c.primary.pid;
  return '<section class="card rv" style="--i:3"><div class="row" style="justify-content:space-between;margin-bottom:12px"><h2>Один человек у нескольких партнеров</h2><span class="lock-l">'+ic('lock')+'Только Founder Orbiq</span></div>'+
  '<div class="grid2"><div class="stack" style="gap:8px"><span class="lbl">Связь</span><p style="margin:0">'+(c.linkId?'<span class="chip ok">'+ic('check')+'Связана</span> <small class="mu" style="font-family:var(--m)">'+E(c.linkId)+'</small>':'<span class="mu">Не связана с другими карточками</span>')+'</p>'+btn('Связать с другой карточкой','sm dark','data-a="clink"','handshake')+'</div>'+
  '<div class="stack" style="gap:8px"><span class="lbl">Основной партнер семьи</span><p style="margin:0">'+(pr?'<b id="prname">'+E(c.primaryName||pr)+'</b> <span class="hint">с '+E(fmtDate(c.primary.at))+'</span>':'<span class="mu">Не выбран</span>')+'</p>'+btn(pr?'Изменить':'Выбрать','sm sec','data-a="cprim"','star')+'</div></div>'+
  '<p class="hint" style="margin-top:12px">Связать можно после подтверждения клиента или сверки при регистрации. Обе частные карточки, заметки и история сохраняются. Согласованные сделки не меняются.</p></section>'}
function tabProfile(c,b){
  var ro=!c.mine;
  var reqs=(c.requests||[]).map(function(r){return reqBlock(c,r,ro)}).join('')||'<p class="hint">Запросов пока нет. Сюда идет то, с чем клиент обращался или что хочет сделать.</p>';
  var rel=c.relation||{};
  b.innerHTML='<div class="stack lg">'+
  '<section class="card rv"><div class="row" style="justify-content:space-between;margin-bottom:16px"><h2>Основное</h2><span class="saved" id="sv">Сохранено</span></div><div class="kv">'+
    '<span class="lbl">Имя</span><div class="row"><input class="in grow" id="alias" value="'+E(c.alias)+'" maxlength="40" '+(ro?'disabled':'')+' style="max-width:320px"><p class="err" id="aerr" hidden></p></div>'+
    '<span class="lbl">Возраст</span>'+pillGroup('age',AGES.map(function(a){return [a,ageL(a)]}),c.age,ro)+
    '<span class="lbl">Капитал</span>'+pillGroup('capital',CAPS.map(function(a){return [a,capL(a)]}),c.capital,ro)+
    '<span class="lbl">Дети</span><div class="row"><span class="step"><button type="button" '+(ro?'disabled':'data-a="kids" data-v="-1"')+' aria-label="Меньше">−</button><span id="kidsv">'+(c.kids==null||c.kids===''?'—':E(c.kids))+'</span><button type="button" '+(ro?'disabled':'data-a="kids" data-v="1"')+' aria-label="Больше">+</button></span><span class="hint">По желанию</span></div>'+
    '<span class="lbl">Инвестирует</span>'+pillGroup('investing',Object.keys(INV).map(function(k){return [k,INV[k]]}),c.investing,ro)+
    '<span class="lbl">Интересы</span><div class="stack" style="gap:8px"><div class="row" id="ints">'+(c.interests||[]).map(function(x,i){return '<span class="chip">'+E(x)+(ro?'':'<button type="button" data-a="intdel" data-i="'+i+'" aria-label="Убрать">'+ic('x')+'</button>')+'</span>'}).join('')+'</div>'+(ro?'':'<form class="row" id="intf"><input class="in" id="intin" placeholder="Например, часы ручной работы" style="max-width:320px;min-height:40px;padding:8px 14px"><button class="btn sm soft" type="submit">'+ic('plus')+'Добавить</button></form>')+'</div>'+
  '</div></section>'+
  '<section class="card rv" style="--i:1"><div class="row" style="justify-content:space-between;margin-bottom:14px"><h2>Запросы</h2><span class="hint">Партнеры видят только подтвержденную формулировку</span></div><div class="stack" id="reqs">'+reqs+'</div>'+
    (ro?'':'<form class="row" id="rqf" style="margin-top:14px"><span class="fsel" style="flex:0 0 auto">'+sel('cat',catOpts(),'','Категория','id="rqcat" required')+'</span><input class="in grow" id="rqtxt" placeholder="Коротко, без имен и компаний" style="min-width:200px"><button class="btn sm" type="submit">'+ic('plus')+'Добавить запрос</button></form>')+'</section>'+
  '<section class="card rv" style="--i:2"><div class="row" style="justify-content:space-between;margin-bottom:14px"><h2>Отношения и капитал</h2><span class="lock-l">'+ic('lock')+'Сеть не видит</span></div><div class="grid3">'+
    '<div class="fld"><label for="rl1">В какой роли знакомы</label><input class="in" id="rl1" data-rel="role" value="'+E(rel.role||'')+'" placeholder="Клиент по часам" '+(ro?'disabled':'')+'></div>'+
    '<div class="fld"><label for="rl2">Когда общались</label><input class="in" type="month" id="rl2" data-rel="lastContact" value="'+E(rel.lastContact||'')+'" '+(ro?'disabled':'')+'></div>'+
    '<div class="fld"><label for="rl4">Сколько лет знакомы</label><input class="in" type="number" min="0" max="80" id="rl4" data-rel="years" value="'+E(rel.years==null?'':rel.years)+'" placeholder="Например, 8" '+(ro?'disabled':'')+'></div>'+
    '<div class="fld"><label>Платил ли деньги партнеру</label>'+pillGroup('isClient',Object.keys(ISCL).map(function(k){return [k,ISCL[k]]}),rel.isClient||'',ro)+'</div>'+
    '<div class="fld"><label for="rl3">Что обсуждали</label><input class="in" id="rl3" data-rel="topic" value="'+E(rel.topic||'')+'" placeholder="Подарок к юбилею" '+(ro?'disabled':'')+'></div></div>'+
    '<div class="fld" style="margin-top:14px"><label for="cb">Основание оценки капитала</label><textarea class="ta" id="cb" style="min-height:80px" placeholder="Источник, период, чья доля. Должность или покупка часов капитал не подтверждают" '+(ro?'disabled':'')+'>'+E(c.capitalBasis||'')+'</textarea></div></section>'+
  (!ro&&(c.invites||[]).length?'<section class="card rv" style="--i:3"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h2>Приглашения семьи</h2><span class="kick">'+c.invites.length+'</span></div><div class="ql">'+c.invites.map(function(id,i){return '<div><span class="tchk on" style="background:var(--ink);border-color:var(--ink)">'+ic('gift')+'</span><span class="grow">Приглашение '+(i+1)+' <small class="mu" style="font-family:var(--m);font-size:11px">'+E(String(id).slice(0,8))+'</small></span><button type="button" class="link mute" data-a="invrev" data-id="'+E(id)+'">Отозвать</button></div>'}).join('')+'</div><p class="hint" style="margin-top:8px">Отозвать можно, пока ссылку не активировали.</p></section>':'')+
  (ro&&isOwner()?ownerLinkBlock(c):'')+
  (ro?'':'<div class="row" style="justify-content:flex-end"><button type="button" class="link mute" data-a="archive">'+ic('archive')+' Убрать в архив</button></div>')+
  '</div>';
  segs(b);
  if(ro&&isOwner()&&c.primary&&c.primary.pid)api('partners').then(function(ps){var x=ps.find(function(q){return q.id===c.primary.pid});var e=$('#prname');if(x&&e)e.textContent=x.name}).catch(function(){});
  if(ro)return;
  var al=$('#alias');al.addEventListener('change',function(){var v=cleanAlias(al.value);if(!v||v===c.alias){al.value=c.alias;return}patch({alias:v}).then(function(){var h=$('.ch h1 .mask>span');if(h)h.textContent=v}).catch(function(e){var er=$('#aerr');er.hidden=false;er.innerHTML=ic('alert')+E(e.message);al.value=c.alias})});
  $('#intf').addEventListener('submit',function(e){e.preventDefault();var v=$('#intin').value.trim();if(!v)return;var a=(c.interests||[]).slice();if(a.map(norm).indexOf(norm(v))<0)a.push(v);patch({interests:a}).then(function(){renderTab(S.card,'profile')})});
  $('#rqf').addEventListener('submit',function(e){e.preventDefault();var cat=$('#rqcat').value,t=$('#rqtxt').value.trim();if(!cat){toast('Нужна категория','alert');return}if(!t){toast('Нужен короткий запрос','alert');return}var a=(c.requests||[]).slice();a.push({id:uid('r'),cat:cat,text:t,status:'open',at:nowISO(),public:true});patch({requests:a}).then(function(){renderTab(S.card,'profile')})});
  $$('[data-rel]').forEach(function(i){i.addEventListener('change',function(){var r=Object.assign({},S.card.relation||{});var k=i.getAttribute('data-rel');r[k]=k==='years'?(i.value===''?null:+i.value):i.value.trim();patch({relation:r}).then(function(){mountRing(S.card,false)})})});
  $('#cb').addEventListener('change',function(){patch({capitalBasis:$('#cb').value.trim()})});
}
function reqBlock(c,r,ro){
  var pub=(c.publicText||{})[r.id];var closed=r.status==='closed';
  var box='';
  if(!closed){
    if(pub&&!r._edit)box='<div class="pub ok"><span class="lbl ok">'+ic('check')+'Партнеры видят</span><span>«'+E(pub)+'»</span>'+(ro?'':'<button type="button" class="link" style="align-self:flex-start" data-a="pubedit" data-r="'+E(r.id)+'">Изменить формулировку</button>')+'</div>';
    else if(!ro){var f=findIds(r.text||'');var draft=pub||stripIds(r.text||'',f).replace(/[,;]?\s*[^,;.]*\[скрыто\][^,;.]*/g,'').trim();
      box='<div class="pub wait"><span class="lbl" style="color:#8A5A00">'+ic('eye')+'Партнеры пока видят только категорию</span><span class="hint" style="color:var(--ink2)">Формулировка без имен, компаний, адресов и редких деталей</span><div class="row"><input class="in grow" data-pub="'+E(r.id)+'" value="'+E(draft)+'" style="background:#fff"><button type="button" class="btn sm" data-a="pubok" data-r="'+E(r.id)+'">'+ic('check')+'Показать партнерам</button></div></div>'}
    else box='<div class="pub"><span class="hint">Формулировка не подтверждена, сеть видит только категорию</span></div>';
  }
  return '<div class="req'+(closed?' closed':'')+'"><div class="rh">'+catChip(r.cat)+'<div class="row">'+(ro?'<span class="chip line">'+(closed?'Закрыт':'Актуален')+'</span>':'<div class="seg"><button type="button" class="'+(!closed?'on':'')+'" data-a="rqst" data-r="'+E(r.id)+'" data-v="open">Актуален</button><button type="button" class="'+(closed?'on':'')+'" data-a="rqst" data-r="'+E(r.id)+'" data-v="closed">Закрыт</button></div><button type="button" class="ibtn" data-a="rqdel" data-r="'+E(r.id)+'" aria-label="Удалить запрос">'+ic('trash')+'</button>')+'</div></div><div class="rt">'+E(r.text||CATS[r.cat])+'</div>'+box+'</div>';
}
function patch(p){var c=S.card;return api('client/update',{id:c.id,patch:p}).then(function(n){var keepMine=c.mine;S.card=n;n.mine=keepMine;var sv=$('#sv');if(sv){sv.classList.add('on');clearTimeout(sv._t);sv._t=setTimeout(function(){sv.classList.remove('on')},1600)}if(p.cells)mountRing(n,true);return n}).catch(function(e){toast(e.message,'alert');throw e})}
function netPreview(c){
  var reqs=(c.requests||[]).filter(function(r){return r.status!=='closed'});
  return '<div class="netv"><div class="stack"><div class="card rv"><span class="kick">Так карточку видят партнеры сети</span><h2 style="font-family:var(--s);font-stretch:112%;font-size:40px;margin:6px 0 16px">'+E(c.alias)+'</h2>'+netFacts(c)+'<div class="stack" style="margin-top:16px">'+(reqs.length?reqs.map(function(r){var p=(c.publicText||{})[r.id];return '<div class="req"><div class="rh">'+catChip(r.cat)+(p?'<span class="chip ok">Формулировка видна</span>':'<span class="chip warn">Только категория</span>')+'</div>'+(p?'<div class="rt">'+E(p)+'</div>':'')+'</div>'}).join(''):'<p class="hint">Открытых запросов нет</p>')+'</div></div></div>'+
  '<div class="card dk rv" style="--i:2;display:flex;flex-direction:column;gap:14px"><span class="kick" style="color:var(--dmute)">Скрыто от сети</span><h2 style="color:#fff;font-family:var(--s);font-stretch:112%;font-size:30px;font-weight:600">Знает только партнер</h2><div class="hidden-list">'+['Кто партнер','Круг 360°','Отношения','Основание капитала','Заметки','Планы','История','Импорт и диктовка','Неподтвержденные формулировки'].map(function(x){return '<span class="chip">'+ic('lock')+x+'</span>'}).join('')+'</div><p class="hint" style="color:var(--dmute)">Предложения по клиенту приходят только через Orbiq. Передавать ли их клиенту, решает партнер.</p>'+btn('Вернуться к карточке','sm','data-a="viewas" data-v="own" style="background:#fff;color:#111;align-self:flex-start"')+'</div></div>';
}
function netFacts(c){var ints=c.interests||[];return '<div class="facts"><div><span class="lbl">Возраст</span><b>'+E(ageL(c.age))+'</b></div><div><span class="lbl">Капитал</span><b>'+E(capL(c.capital))+'</b></div><div><span class="lbl">Дети</span><b>'+(c.kids==null||c.kids===''?'—':E(c.kids))+'</b></div><div><span class="lbl">Инвестирует</span><b>'+E(INV[c.investing]||'—')+'</b></div><div style="grid-column:span 2"><span class="lbl">Интересы</span><b style="font-size:15px;font-weight:500">'+(ints.length?E(ints.join(', ')):'—')+'</b></div></div>'}
function vNetCard(c){
  var reqs=c.requests||[];
  var head='<a class="back" href="'+LH()+'">'+ic('al')+LHN()+'</a><div class="ch"><div><span class="own" style="color:var(--mute)"><i style="background:'+(isOrb(c)?'var(--ink)':'var(--mute)')+';box-shadow:none"></i>'+(isOrb(c)?'Ведет Orbiq':'Карточка партнера сети'+(c.leadBy?' · партнер по '+E(String(c.leadBy).replace(/^партнер по /,'')):''))+'</span><h1><span class="mask"><span>'+E(c.alias)+'</span></span></h1><div class="meta"><span class="lock-l">'+ic('lock')+(isOrb(c)?'Клиент Orbiq. Связь через Orbiq':'Владелец карточки скрыт. Связь только через Orbiq')+'</span>'+(rqLimit().left!==Infinity?limDots():'')+'</div></div><div class="acts">'+(reqs.length&&ptier()!=='networker'?btn('Предложить через Orbiq','pri mag','data-a="go" data-h="#/c/'+E(c.id)+'/offer"'+(rqLimit().left<1?' disabled title="'+E(limText())+'"':''),'send'):'')+btn('Заметка для себя','sec','data-a="go" data-h="#/c/'+E(c.id)+'/notes"','note')+'</div></div>';
  var tab=(location.hash.split('/')[3]||'profile');
  page('clients',head+'<div class="cgrid" style="grid-template-columns:1fr minmax(300px,420px)"><div>'+cardTabs(c,tab==='notes'?'notes':'profile')+'<div id="tabc"></div></div><div class="card dk spot rv" style="--i:2;display:flex;flex-direction:column;gap:12px"><span class="kick" style="color:var(--acc)">Как это работает</span><h2 style="color:#fff;font-family:var(--s);font-stretch:112%;font-size:28px">Партнер → Orbiq → партнер клиента</h2><ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;color:rgba(244,241,236,.85);font-size:14px"><li>Партнер описывает предложение и условия</li><li>Orbiq проверяет и согласует комиссию</li><li>Партнер клиента решает, передавать ли его клиенту</li></ol><p class="hint" style="color:var(--dmute)">Прямого чата нет. Личность автора второй партнер не видит.</p></div></div>',function(){
    var b=$('#tabc');if(tab==='notes')return tabNotes(c,b);
    b.innerHTML='<div class="stack lg"><div class="card rv">'+netFacts(c)+'</div><div class="card rv" style="--i:1"><h2 style="margin-bottom:14px">Открытые запросы</h2><div class="stack">'+(reqs.length?reqs.map(function(r){return '<div class="req"><div class="rh">'+catChip(r.cat)+(ptier()==='networker'?'':btn('Предложить через Orbiq','sm','data-a="go" data-h="#/c/'+E(c.id)+'/offer?r='+E(r.id)+'"'+(rqLimit().left<1?' disabled':''),'send'))+'</div>'+(r.text?'<div class="rt">'+E(r.text)+'</div>':'<div class="hint">Формулировку видит только партнер клиента</div>')+'</div>'}).join(''):'<p class="hint">Открытых запросов нет</p>')+'</div></div></div>'});
}

/* ---------- Подборка и «К разговору» ---------- */
function itemCard(it,i){var u=it.url||('/journal/a/'+(it.itemId||it.id)+'/');return '<article class="item rv" style="--i:'+i+'"><a class="im" href="'+E(u)+'" target="_blank" rel="noopener" aria-label="Открыть в журнале" style="display:block;background-image:url('+E(it.cover||img(it.itemId))+')"></a><div class="bd"><h3><a href="'+E(u)+'" target="_blank" rel="noopener" style="color:inherit">'+E(it.title)+'</a></h3><p class="why">'+ic('spark')+'<span>'+E(it.why||'')+'</span></p><div class="dl"><span><b>Что получит:</b> '+E(it.deliver||'—')+'</span><span><b>Кто подтверждает:</b> '+E(it.confirmBy||'—')+'</span></div></div></article>'}
function tabMatch(c,b){
  b.innerHTML='<div class="skel" style="height:320px"></div>';
  api('client/match',null,{id:c.id}).then(function(m){
    var items=Array.isArray(m)?m:(m.items||m.matches||[]);var qs=m.questions||[];
    var now=qs.filter(function(q){return q.bucket==='now'}).slice(0,3),later=qs.filter(function(q){return q.bucket==='later'}),done=qs.filter(function(q){return q.bucket==='done'});
    var qcard=function(q,i){return '<div class="qcard rv" style="--i:'+i+'"><span class="qn">0'+(i+1)+'</span><div class="row">'+(q.kind==='clarify'?'<span class="chip warn">Уточнение интереса</span>':'<span class="chip acc">Предложение</span>')+'</div><p class="basis">'+E(q.basis||'')+'</p><textarea class="ta" data-q="'+E(q.id)+'" aria-label="Фраза для разговора">'+E(q.text)+'</textarea><div class="dates"><span>Спросить <b>'+E(fmtDate(q.date))+'</b></span>'+(q.deadline?'<span>Крайний срок <b>'+E(fmtDate(q.deadline))+'</b></span>':'')+'</div><div class="row">'+btn('Скопировать','sm','data-a="qcopy" data-q="'+E(q.id)+'"','copy')+btn('Уже спросил','sm soft','data-a="qasked" data-q="'+E(q.id)+'"','check')+'<button type="button" class="link mute" data-a="qlater" data-q="'+E(q.id)+'">Позже</button></div></div>'};
    var gift='Я стал партнером Orbiq. У меня есть возможность подарить вам три месяца доступа. Я уже собрал для вас первую подборку. Вы сможете менять темы и пригласить еще одного человека из семьи. Годовой доступ стоит $10 000. Прислать вам личную ссылку?';
    var inv=tier()==='paid'?'<div class="card rv" id="invc"><h2>Приглашение семьи</h2><p class="hint" style="margin:4px 0 14px">Кнопка откроется после согласия клиента. Ссылку партнер отправляет сам, своим каналом.</p><div class="grid3"><div class="fld"><label>Дата согласия</label><input class="in" type="date" id="cdate" value="'+new Date().toISOString().slice(0,10)+'"></div><div class="fld"><label>Способ</label>'+sel('ch',[['Лично','Лично'],['Звонок','Звонок'],['Мессенджер','Мессенджер'],['Почта','Почта']],'Звонок',null,'id="cch"')+'</div><div></div></div><div class="stack" style="gap:8px;margin:14px 0"><label class="chk"><input type="checkbox" id="cok1"><span>Клиент согласен получить личную ссылку</span></label><label class="chk"><input type="checkbox" id="cok2"><span>Капитал семьи более $10 млн</span></label></div>'+btn('Создать приглашение','pri','data-a="invite" disabled id="invb"','gift')+'<div id="invr"></div></div>'
      :'<div class="card rv"><div class="row">'+ic('lock')+'<h2>Приглашение семьи</h2></div><p class="hint" style="margin-top:6px">Семейные приглашения доступны со статусом «Партнер Orbiq». <a class="link" href="#/status">Подробнее</a></p></div>';
    b.innerHTML='<div class="stack lg"><div><div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 class="sec-h">К разговору</h2><span class="kick">Спросить сейчас · '+now.length+' из 3</span></div>'+(now.length?'<div class="qnow">'+now.map(qcard).join('')+'</div>':'<div class="card"><p class="hint">С интересами и планами здесь появятся поводы для разговора</p></div>')+'</div>'+
      (later.length?'<details class="fold"><summary>Позже · '+later.length+ic('down')+'</summary><div class="ql">'+later.map(function(q){return '<div><span class="grow">'+E(q.basis||q.text)+'</span><span class="kick">'+E(fmtDate(q.date))+'</span><button type="button" class="link" data-a="qasked" data-q="'+E(q.id)+'">Уже спросил</button></div>'}).join('')+'</div></details>':'')+
      (done.length?'<details class="fold"><summary>Уже обсудили · '+done.length+ic('down')+'</summary><div class="ql">'+done.map(function(q){return '<div><span class="tchk on">'+ic('check')+'</span><span class="grow">'+E(q.basis||q.text)+'</span></div>'}).join('')+'</div></details>':'')+
      '<div><h2 class="sec-h" style="margin-bottom:12px">Подборка</h2>'+(items.length?'<div class="items">'+items.slice(0,6).map(itemCard).join('')+'</div>'+(items.length>6?'<details class="fold" style="margin-top:14px"><summary>Еще '+(items.length-6)+' в подборке'+ic('down')+'</summary><div class="items">'+items.slice(6).map(itemCard).join('')+'</div></details>':''):'<div class="card"><p class="hint">Подборка появится после первых фактов о клиенте. При любом проценте круга ее уже можно смотреть.</p></div>')+'</div>'+'<div class="card dk rv"><span class="kick" style="color:var(--acc)">Если клиенту интересно</span><p style="font-size:17px;line-height:1.55;margin:10px 0 14px;color:#fff">«'+E(gift)+'»</p><div class="row">'+btn('Скопировать фразу','sm','data-a="copytxt" data-t="'+E(gift)+'" style="background:#fff;color:#111"','copy')+'<span class="hint" style="color:var(--dmute)">Кабинет ничего не рассылает от имени партнера</span></div></div>'+inv+'</div>';
    S.match=qs;
    var cb=function(){var b2=$('#invb');if(b2)b2.disabled=!($('#cok1').checked&&$('#cok2').checked)};['#cok1','#cok2'].forEach(function(s){var e=$(s);if(e)e.addEventListener('change',cb)});
  }).catch(function(e){b.innerHTML=errBox(e)});
}

/* ---------- Заметки ---------- */
function tabNotes(c,b){
  b.innerHTML='<div class="skel" style="height:200px"></div>';
  api('note/list',null,{cid:c.id}).then(function(ns){
    b.innerHTML='<div class="stack lg"><form class="card rv stack" id="nfm"><div class="row" style="justify-content:space-between"><h2>Заметка для себя</h2><span class="lock-l">'+ic('lock')+'Видит только партнер. Orbiq тоже не видит</span></div><textarea class="ta" id="ntx" placeholder="Мысль, наблюдение, что не забыть" style="min-height:96px"></textarea><div class="row">'+btn('Сохранить заметку','dark sm','type="submit"','check')+'</div></form>'+
    '<div class="stack">'+(ns.length?ns.map(function(n,i){return '<div class="note rv" style="--i:'+i+'" data-note="'+E(n.id)+'"><div class="nt">'+E(n.text).replace(/\n/g,'<br>')+(n.edited?' <small class="mu" style="font-size:11px">изменено</small>':'')+'</div><div class="nf"><span>'+E(fmtDate(n.at,true))+'</span><span class="row" style="gap:4px">'+(hasNet()&&!isOwner()?'<button type="button" class="btn xs soft" data-a="nfwd" data-n="'+E(n.id)+'">'+ic('send')+'Передать через Orbiq</button>':'')+'<button type="button" class="ibtn" data-a="nedit" data-n="'+E(n.id)+'" aria-label="Изменить" title="Изменить">'+ic('note')+'</button><button type="button" class="ibtn" data-a="ndel" data-n="'+E(n.id)+'" aria-label="Удалить">'+ic('trash')+'</button></span></div></div>'}).join(''):'<p class="hint">Заметок пока нет</p>')+'</div></div>';
    S.notes=ns;
    $('#nfm').addEventListener('submit',function(e){e.preventDefault();var t=$('#ntx').value.trim();if(!t)return;api('note/add',{cid:c.id,text:t}).then(function(){toast('Заметка сохранена');tabNotes(c,b)})});
  }).catch(function(e){b.innerHTML=errBox(e)});
}

/* ---------- Задачи (общий компонент) ---------- */
function taskRow(t,cl){var late=!t.done&&parseDue(t.due)<new Date();var c=t.cid&&cl&&cl[t.cid];return '<div class="task'+(t.done?' done':'')+'"><button type="button" class="tchk'+(t.done?' on':'')+'" data-a="tdone" data-t="'+E(t.id)+'" aria-label="Готово">'+ic('check')+'</button><div><div class="tt">'+E(t.title)+'</div><small class="'+(late?'late':'')+'" style="'+(late?'color:var(--err)':'')+'">'+E(relDay(t.due))+(c?' · <a href="#/c/'+E(t.cid)+'" class="link" style="font-size:11px">'+E(c)+'</a>':'')+(t.remind?' · напомнить за '+(t.remind>=1440?'день':t.remind>=60?'час':t.remind+' мин'):'')+'</small></div><div class="ta-acts">'+(t.done?'':'<button type="button" class="ibtn" data-a="tmove" data-t="'+E(t.id)+'" title="Перенести на завтра" aria-label="Перенести на завтра">'+ic('redo')+'</button>')+'<button type="button" class="ibtn" data-a="tdel" data-t="'+E(t.id)+'" aria-label="Удалить">'+ic('trash')+'</button></div></div>'}
function taskForm(cid,cl){var d=new Date();d.setDate(d.getDate()+1);return '<form class="card rv" id="tf"><h2 style="margin-bottom:12px">Новая задача</h2><div class="row" style="align-items:flex-end"><div class="fld grow" style="min-width:220px"><label for="tt">Задача</label><input class="in" id="tt" placeholder="Позвонить, отправить подборку" required></div><div class="fld"><label for="td">Срок</label><input class="in" type="date" id="td" value="'+d.toISOString().slice(0,10)+'"></div><div class="fld"><label for="th">Время</label><input class="in" type="time" id="th" value="11:00"></div><div class="fld"><label for="tr">Напомнить</label>'+sel('tr',[[0,'Без напоминания'],[15,'За 15 минут'],[60,'За час'],[1440,'За день']],60,null,'id="tr"')+'</div>'+(cid||!cl?'':'<div class="fld"><label for="tc">Клиент</label>'+sel('tc',Object.keys(cl).map(function(k){return [k,cl[k]]}),'','Без клиента','id="tc"')+'</div>')+btn('Добавить','dark','type="submit"','plus')+'</div></form>'}
function bindTaskForm(cid,after){var f=$('#tf');if(!f)return;f.addEventListener('submit',function(e){e.preventDefault();var t=$('#tt').value.trim();if(!t)return;var due=$('#td').value+'T'+($('#th').value||'11:00');
  api('task/upsert',{title:t,due:due,tz:Intl.DateTimeFormat().resolvedOptions().timeZone,remind:+$('#tr').value,cid:cid||($('#tc')&&$('#tc').value)||undefined,done:false}).then(function(){toast('Задача добавлена');after()})})}
function tabPlans(c,b){
  api('task/list').then(function(ts){var l=ts.filter(function(t){return t.cid===c.id});var cl={};cl[c.id]=c.alias;
    b.innerHTML='<div class="stack lg">'+taskForm(c.id)+'<div class="card rv" style="--i:1">'+(l.length?l.sort(function(a,b2){return a.due<b2.due?-1:1}).map(function(t){return taskRow(t,null)}).join(''):'<p class="hint">Задач по клиенту пока нет</p>')+'</div><p class="hint">Все задачи и календарь: <a class="link" href="#/plans">Планы</a></p></div>';
    S.tasksAfter=function(){tabPlans(c,b)};bindTaskForm(c.id,S.tasksAfter)}).catch(function(e){b.innerHTML=errBox(e)});
}

/* ================= Диктовка ================= */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
var REC=null;
function stopRec(){if(REC){try{REC._stop=true;REC.stop()}catch(e){}REC=null}}
function vDictate(id){
  loading('clients');
  api('client/get',null,{id:id}).then(function(c){if(!c.mine){go('#/c/'+id);return}S.card=c;
    var qs=SECTORS.map(function(s){return '<div><h4><i style="background:'+s.hex+'"></i>'+E(s.name)+'</h4><ol>'+s.q.map(function(q){var x=(c.cells||{})[s.id+'.'+q[0]];return '<li class="'+(x&&(x.kind==='fact'||x.kind==='na')?'done':'')+'">'+E(q[1])+'</li>'}).join('')+'</ol></div>'}).join('');
    var ok=localStorage.getItem('oc_sr_ok')==='1';
    var micB=SR?'<div class="warnb">'+ic('alert')+'<div class="stack" style="gap:8px"><span>Встроенная диктовка браузера может отправлять звук на сервер распознавания Google или Apple. Orbiq звук не получает и не хранит.</span><label class="chk"><input type="checkbox" id="srok" '+(ok?'checked':'')+'><span>Понимаю, включить диктовку</span></label></div></div><div class="mic"><button type="button" class="micb" id="micb" '+(ok?'':'disabled')+' aria-label="Диктовать">'+ic('mic')+'</button><div><b id="mst">Диктовать</b><div class="hint" id="msh">Одна запись: пауза, продолжение, завершение</div></div><button type="button" class="btn sm soft" id="mend" hidden>Завершить</button></div>'
      :'<div class="infob">'+ic('mic')+'<span>Голос: микрофон на клавиатуре телефона. Или готовый текст через вставку.</span></div>';
    page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+hd('Диктовка · '+E(c.alias),'Рассказ о клиенте')+
      '<div class="dic"><aside class="card qs rv"><span class="kick">Ответы в любом порядке, неизвестное можно пропустить</span>'+qs+'</aside><div class="stack rv" style="--i:2">'+micB+
      '<textarea class="ta bigta" id="dtx" placeholder="Своими словами. Название компании можно заменить отраслью"></textarea><p class="hint">Аудио не хранится. Перед отправкой текст виден целиком, лишнее можно убрать.</p><div class="row">'+btn('Проверить текст','pri mag','data-a="dcheck"','ar')+'<a class="link mute" href="#/c/'+E(id)+'">Отмена</a></div></div></div>',function(){
      var t=$('#dtx');var saved=sessionStorage.getItem('oc_d_'+id);if(saved)t.value=saved;t.addEventListener('input',function(){sessionStorage.setItem('oc_d_'+id,t.value)});
      if(!SR)return;
      var chk=$('#srok'),mb=$('#micb'),st=$('#mst'),sh=$('#msh'),end=$('#mend');
      chk.addEventListener('change',function(){localStorage.setItem('oc_sr_ok',chk.checked?'1':'0');mb.disabled=!chk.checked});
      var base='';
      mb.addEventListener('click',function(){
        if(REC){stopRec();mb.classList.remove('on');st.textContent='Продолжить';sh.textContent='Пауза. Повторное нажатие продолжит запись';return}
        var r=new SR();r.lang='ru-RU';r.continuous=true;r.interimResults=true;base=t.value?t.value.replace(/\s*$/,' '):'';
        r.onresult=function(ev){var fin='',tmp='';for(var i=0;i<ev.results.length;i++){var x=ev.results[i];if(x.isFinal)fin+=x[0].transcript;else tmp+=x[0].transcript}t.value=base+fin+tmp;sessionStorage.setItem('oc_d_'+id,t.value)};
        r.onerror=function(ev){if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){toast('Микрофон недоступен. Текст можно набрать или вставить','alert')}else if(ev.error!=='no-speech'&&ev.error!=='aborted')toast('Распознавание прервалось. Можно нажать еще раз','alert');mb.classList.remove('on');st.textContent='Диктовать';REC=null};
        r.onend=function(){if(REC===r&&!r._stop){try{r.start()}catch(e){}}};
        try{r.start();REC=r;mb.classList.add('on');st.textContent='Идет запись';sh.textContent='Нажатие ставит паузу';end.hidden=false}catch(e){toast('Не получилось включить микрофон','alert')}
      });
      end.addEventListener('click',function(){stopRec();mb.classList.remove('on');st.textContent='Диктовать';sh.textContent='Запись завершена. Текст готов к проверке';end.hidden=true});
    });
  }).catch(function(e){page('clients',errBox(e))});
}

/* Экран очистки перед отправкой: подсветка почты, телефонов, ссылок, имен */
function scrubStage(cid,text,source,send){
  var finds=findIds(text);var raw=text;
  var draw=function(box){
    var n=finds.filter(function(f){return f.on}).length;
    box.querySelector('#scv').innerHTML=markIds(raw,finds);
    box.querySelector('#scl').innerHTML=finds.length?finds.map(function(f){return '<label><input type="checkbox" data-fi="'+f.i+'" '+(f.on?'checked':'')+' class="chk-in"><span>'+E(f.v)+'</span><span class="ty">'+IDT[f.t]+'</span></label>'}).join(''):'<p class="hint">Похожего на контакты не нашли. Автопроверка пропускает редкие детали, текст стоит перечитать.</p>';
    box.querySelector('#scn').textContent=n?'Скрыть '+n+' и отправить':'Отправить на разбор';
  };
  var el=sheet('<div class="kick">Шаг перед отправкой</div><h2>Проверка текста</h2><p class="hint">Подсвечено то, что похоже на контакты, ссылки, имена и компании. Отмеченное заменим на [скрыто]. Текст уходит на разбор только после подтверждения.</p><div class="grid2" style="grid-template-columns:1.5fr 1fr;align-items:start"><div class="stack" style="gap:8px"><div class="scrub" id="scv"></div><textarea class="ta" id="sce" hidden style="min-height:260px"></textarea><button type="button" class="link" id="sct" style="align-self:flex-start">Изменить текст</button></div><div class="stack" style="gap:8px"><span class="lbl">Найдено</span><div class="finds" id="scl"></div></div></div><div class="row">'+'<button type="button" class="btn pri" id="scg">'+ic('send')+'<span id="scn">Отправить на разбор</span></button><button type="button" class="link mute" data-a="sclose">Вернуться</button></div>',true);
  draw(el);
  el.addEventListener('change',function(e){var i=e.target.getAttribute('data-fi');if(i!=null){finds[+i].on=e.target.checked;draw(el)}});
  var ed=false;$('#sct',el).addEventListener('click',function(){var v=$('#scv',el),ta=$('#sce',el);if(!ed){ta.value=raw;ta.hidden=false;v.hidden=true;this.textContent='Готово'}else{raw=ta.value;finds=findIds(raw);ta.hidden=true;v.hidden=false;this.textContent='Изменить текст';draw(el)}ed=!ed});
  $('#scg',el).addEventListener('click',function(){if(ed){raw=$('#sce',el).value;finds=findIds(raw)}var clean=stripIds(raw,finds).trim();if(!clean){toast('Текст пустой','alert');return}var b=this;b.disabled=true;$('#scn',el).textContent='Разбираем…';
    (send?send(clean):api('client/extract',{id:cid,text:clean,source:source==='dict'?'dict':'md'}).then(function(r){var base=S.pending[cid]&&S.pending[cid].appendMode?S.pending[cid]:null;if(base)base.appendMode=false;setPending(cid,r,source,base);sessionStorage.removeItem('oc_d_'+cid);closeSheet();if(base&&location.hash.indexOf('/review')>0)drawCheck(S.card,base);else go('#/c/'+cid+'/review')}))
    .catch(function(e){b.disabled=false;$('#scn',el).textContent='Отправить на разбор';if(!e.handled)toast(e.status===429?'Слишком много запросов. Повтор через минуту':e.status===409?e.message:'Разбор не удался. Карточка не изменилась','alert')})});
}

/* ================= Проверьте изменения ================= */
function vReview(id){
  var P=S.pending[id];if(!P){go('#/c/'+id);return}
  var c=S.card&&S.card.id===id?S.card:null;
  var draw=function(){
    var props=P.proposals;var ok=props.filter(function(p){return p.st==='ok'}).length;
    var bySec=SECTORS.map(function(s){var l=props.filter(function(p){return p.cell.indexOf(s.id+'.')===0});if(!l.length)return '';
      return '<div class="sh"><i style="background:'+s.hex+'"></i>'+E(s.name)+'</div>'+l.map(function(p){return '<div class="prop rv '+(p.st==='ok'?'ok':p.st==='del'?'del':'')+'" data-k="'+p.k+'"><span class="q">'+E(cellQ(p.cell))+'</span><input class="in" data-pv="'+p.k+'" value="'+E(p.value)+'" '+(p.st==='del'?'disabled':'')+'><div class="ctl"><div class="kind">'+Object.keys(KIND).map(function(k){return '<button type="button" class="'+(p.kind===k?'on':'')+'" data-a="pkind" data-k="'+p.k+'" data-v="'+k+'">'+KIND[k]+'</button>'}).join('')+'</div></div>'+(p.conflict?'<div class="cf">Сейчас в карточке: «'+E(p.conflict)+'». Подтверждение нужно, если новое точнее</div>':'')+'<div class="row" style="grid-column:1/-1">'+(p.st==='del'?'<button type="button" class="link" data-a="pst" data-k="'+p.k+'" data-v="">Вернуть</button>':btn(p.st==='ok'?'Подтверждено':'Подтвердить','sm '+(p.st==='ok'?'':'soft'),'data-a="pst" data-k="'+p.k+'" data-v="'+(p.st==='ok'?'':'ok')+'"','check')+'<button type="button" class="link mute" data-a="pst" data-k="'+p.k+'" data-v="del">Удалить</button>')+'</div></div>'}).join('')}).join('');
    var contra=P.contradictions.length?'<div class="warnb">'+ic('alert')+'<div><b>Противоречия</b><ul style="margin:6px 0 0;padding-left:18px">'+P.contradictions.map(function(x){return '<li>'+E(typeof x==='string'?x:(x.text||x.cell+': '+x.value))+'</li>'}).join('')+'</ul></div></div>':'';
    page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+(c?E(c.alias):'Карточка')+'</a>'+hd('Разбор · '+props.length+' '+plural(props.length,'факт','факта','фактов'),'Проверка изменений',btn('Подтвердить все','sec','data-a="pall"','check'))+
      '<div class="rvw">'+(props.length?'':'<div class="card">'+emptyBox('Фактов не нашли','Поможет рассказ подробнее или ответы на вопросы с экрана диктовки','<a class="btn sec" href="#/c/'+E(id)+'/dictate">К диктовке</a>')+'</div>')+contra+bySec+
      (props.length?'<div class="sbar"><span>Подтверждено <b>'+ok+'</b> из '+props.length+'. Только подтвержденное попадет в карточку</span>'+btn('Сохранить в карточку','pri','data-a="papply" '+(ok?'':'disabled'),'check')+'</div>':'')+'</div>',function(m){
      $$('[data-pv]',m).forEach(function(i){i.addEventListener('input',function(){P.proposals[+i.getAttribute('data-pv')].value=i.value})})});
  };
  S.reviewDraw=draw;draw();
}
function applyReview(id){
  var P=S.pending[id];var items=P.proposals.filter(function(p){return p.st==='ok'}).map(function(p){return {cell:p.cell,value:p.value,kind:p.kind}});
  var before=S.card&&S.card.id===id?circle(S.card.cells).pct:null;
  api('client/apply',{id:id,items:items,source:P.source}).then(function(r){delete S.pending[id];
    return api('client/get',null,{id:id}).then(function(c){S.card=c;S.prevPct[id]=before==null?0:before;
      page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a><div class="cgrid"><div class="lft" id="ringw-slot"></div><div class="stack lg"><div><div class="kick">Сохранено</div><h1 style="font-family:var(--s);font-stretch:112%;font-weight:600;font-size:clamp(36px,4vw,56px);line-height:1;letter-spacing:-.02em;margin-top:8px"><span class="mask"><span>Что изменилось</span></span></h1></div><ul class="chg" style="list-style:none;padding:0;margin:0">'+(r.changed||[]).map(function(x,i){return '<li class="rv row" style="--i:'+(i+2)+'"><span class="tchk on">'+ic('check')+'</span>'+E(x)+'</li>'}).join('')+'</ul><div class="row">'+btn('Посмотреть подборку','pri mag','data-a="go" data-h="#/c/'+E(id)+'/match"','spark')+'<a class="btn sec" href="#/c/'+E(id)+'">К карточке</a></div></div></div>',function(){mountRing(c,true)});
    })}).catch(function(e){toast(e.message||'Не сохранилось. Предыдущая версия карточки на месте','alert')});
}

/* ================= Из моей нейросети ================= */
function vAI(id){
  loading('clients');
  api('client/get',null,{id:id}).then(function(c){if(!c.mine){go('#/c/'+id);return}S.card=c;
    page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+hd('Исследование · '+E(c.alias),'Добавить из моей нейросети')+
    '<div class="ai3"><div class="card spot rv"><span class="no">1</span><h2>Скопировать задание</h2><p class="hint">Готовый запрос на глубокий поиск по открытым источникам. Имя и фамилия вписываются только в своей нейросети.</p><div class="prompt" id="prm">'+E(AI_TASK)+'</div><div class="row">'+btn('Скопировать задание','pri mag','data-a="copytask"','copy')+'<button type="button" class="link" data-a="prmtog">Показать полностью</button></div></div>'+
    '<div class="card spot rv" style="--i:1"><span class="no">2</span><h2>Выполнить в своей нейросети с веб-поиском</h2><p class="hint">ChatGPT, Claude, Perplexity или другая с поиском. Orbiq не получает поисковый запрос.</p><div class="warnb" style="margin-top:auto">'+ic('alert')+'<span>Внешний сервис увидит введенное имя. Стоит проверить его настройки обработки данных. Простое удаление фамилии не гарантирует анонимность.</span></div></div>'+
    '<div class="card dk spot rv" style="--i:2"><span class="no">3</span><h2 style="color:#fff">Выбрать MD-файл</h2><p class="hint" style="color:var(--dmute)">Файл profile.md из ответа нейросети. Он читается на устройстве, до отправки текст виден целиком.</p><label class="drop" id="drop" style="margin-top:auto">'+ic('upload')+'<span><b style="color:#fff">Выбрать файл</b><br>или перетащить сюда</span><input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" id="mdf" hidden></label><button type="button" class="lg-l" data-a="mdpaste" style="align-self:center">Вставить текст вместо файла</button></div></div>',function(){
      var inp=$('#mdf'),dr=$('#drop');
      var read=function(f){if(!f)return;if(f.size>1024*1024){toast('Файл больше 1 МБ','alert');return}var r=new FileReader();r.onload=function(){var t=String(r.result||'');if(!t.trim()){toast('Файл пустой','alert');return}scrubStage(id,t,'md')};r.onerror=function(){toast('Файл не читается','alert')};r.readAsText(f,'utf-8')};
      inp.addEventListener('change',function(){read(inp.files[0]);inp.value=''});
      ['dragenter','dragover'].forEach(function(n){dr.addEventListener(n,function(e){e.preventDefault();dr.classList.add('over')})});
      ['dragleave','drop'].forEach(function(n){dr.addEventListener(n,function(e){e.preventDefault();dr.classList.remove('over')})});
      dr.addEventListener('drop',function(e){read(e.dataTransfer.files[0])});
    })}).catch(function(e){page('clients',errBox(e))});
}

/* ================= Предложить через Orbiq ================= */
function vOffer(id){
  loading('clients');var pre=(location.hash.split('?')[1]||'').replace(/^r=/,'');
  loadSent().then(function(){return api('client/get',null,{id:id})}).then(function(c){
    var reqs=(c.requests||[]).filter(function(r){return r.status!=='closed'});var refer=!!c.mine;
    if(refer?(S.me.access&&S.me.access['rq.refer']===false):!hasNet()){page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+emptyBox('Пока недоступно',refer?'Передавать клиентов в сеть можно после проверки 50 готовых карточек':'Предлагать через Orbiq можно со статуса «Базовый партнер»: 50 готовых карточек','<a class="btn sec" href="#/status">К статусу</a>'));return}
    var lim=rqLimit();if(!refer&&lim.left<1){page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+emptyBox('Лимит месяца исчерпан','Базовый партнер отправляет одно обращение в календарный месяц. Новое станет доступно 1-го числа. Партнер Orbiq пишет без лимита','<a class="btn sec" href="#/status">Статус и условия</a>'));return}
    page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+hd((refer?'Свой клиент · ':'Обращение · ')+E(c.alias),refer?'Передать клиента в сеть':'Предложить через Orbiq')+(refer?'':limDots())+
    '<div class="grid2" style="grid-template-columns:1.4fr 1fr;align-items:start"><form class="card stack rv" id="of"><div class="fld"'+(reqs.length?'':' hidden')+'><label for="oreq">Какой запрос</label>'+sel('req',reqs.map(function(r){return [r.id,(CATS[r.cat]||'')+(r.text?' · '+r.text:'')]}),pre||(reqs[0]&&reqs[0].id),reqs.length?null:'','id="oreq"')+'</div>'+(reqs.length?'':'<p class="hint">Открытых запросов пока не видно. Здесь описание того, что можно предложить этому клиенту</p>')+
      '<div class="fld"><label for="ooff">'+(refer?'Что нужно клиенту и под какой продукт сети':'Что предложить')+'</label><textarea class="ta" id="ooff" placeholder="'+(refer?'Например, ищет виллу в Италии, готов обсудить с партнером по недвижимости':'Что получит клиент, в какие сроки, кто исполняет')+'" required></textarea></div>'+
      '<div class="fld"><label for="oterm">'+(refer?'Вознаграждение партнера':'Условия')+'</label><input class="in" id="oterm" placeholder="'+(refer?'По договоренности с Orbiq':'Например, 10% от сделки')+'"></div>'+
      '<div class="fld"><label>Вложение, по желанию</label><label class="btn sec sm" style="align-self:flex-start">'+ic('clip')+'<span id="oattn">Выбрать файл до 700 КБ</span><input type="file" id="oatt" hidden></label></div>'+
      '<p class="err" id="oerr" hidden></p><div class="row">'+btn('Отправить в Orbiq','pri mag','type="submit"','send')+'</div></form>'+
    '<div class="card dk rv" style="--i:2;display:flex;flex-direction:column;gap:14px"><span class="kick" style="color:var(--acc)">Кто увидит</span><div class="ql" style="color:rgba(244,241,236,.85)"><div style="border-color:var(--dline)"><b style="color:#fff;font-family:var(--m);font-size:11px">01</b>Только Founder Orbiq</div><div style="border-color:var(--dline)"><b style="color:#fff;font-family:var(--m);font-size:11px">02</b>Orbiq согласует условия и комиссию</div><div style="border:0"><b style="color:#fff;font-family:var(--m);font-size:11px">03</b>Партнер клиента решает, передать ли клиенту</div></div><p class="hint" style="color:var(--dmute)">Личность второго партнера скрыта. Прямого чата нет. Статус виден в разделе «Обращения».</p></div></div>',function(){
      var att=null;$('#oatt').addEventListener('change',function(){var f=this.files[0];if(!f)return;if(f.size>700*1024){toast('Файл больше 700 КБ','alert');this.value='';return}var r=new FileReader();r.onload=function(){att={name:f.name,dataUrl:r.result};$('#oattn').textContent=f.name};r.readAsDataURL(f)});
      $('#of').addEventListener('submit',function(e){e.preventDefault();var off=$('#ooff').value.trim(),er=$('#oerr');if(!off){er.hidden=false;er.innerHTML=ic('alert')+'Нужно описание предложения';return}
        var b=this.querySelector('.btn');b.disabled=true;
        api('rq/create',{cid:id,requestId:$('#oreq').value,offer:off,terms:$('#oterm').value.trim(),attachment:att||undefined,kind:refer?'refer':undefined}).then(function(){
          page('clients','<div class="card rv" style="max-width:640px;margin:40px auto;text-align:center;padding:48px 32px;display:flex;flex-direction:column;gap:16px;align-items:center"><span class="tchk on" style="width:56px;height:56px">'+ic('check')+'</span><h1 style="font-family:var(--s);font-stretch:112%;font-weight:600;font-size:44px;line-height:1">Обращение у Orbiq</h1><p class="hint" style="font-size:16px">Статус «Новое». Ответ придет в раздел «Обращения»'+(S.me.partner&&S.me.partner.tg&&S.me.partner.tg.connected?' и в Telegram':'')+'.</p><div class="row" style="justify-content:center"><a class="btn dark" href="#/requests">Мои обращения</a><a class="btn sec" href="#/clients">К клиентам</a></div></div>')})
        .catch(function(e2){b.disabled=false;er.hidden=false;er.innerHTML=ic('alert')+E(e2.message)})});
    })}).catch(function(e){page('clients',errBox(e))});
}

/* ================= Планы ================= */
function vPlans(){
  loading('plans');
  Promise.all([api('task/list'),isOwner()?Promise.resolve([]):api('clients',null,{scope:'mine'}).catch(function(){return []})]).then(function(r){
    var ts=r[0],cl={};r[1].forEach(function(c){cl[c.id]=c.alias});S.clMap=cl;
    var now=new Date(),t0=new Date(now.getFullYear(),now.getMonth(),now.getDate()),t1=new Date(t0.getTime()+864e5);
    var open=ts.filter(function(t){return !t.done}).sort(function(a,b){return a.due<b.due?-1:1});
    var late=open.filter(function(t){return parseDue(t.due)<now}),today=open.filter(function(t){var d=parseDue(t.due);return d>=now&&d<t1}),later=open.filter(function(t){return !t.due||parseDue(t.due)>=t1});
    var done=ts.filter(function(t){return t.done});
    var col=function(n,l,cls,ph){return '<div class="col rv '+(cls||'')+'"><h3>'+n+'<small>'+l.length+'</small></h3>'+(l.length?l.map(function(t){return taskRow(t,cl)}).join(''):'<p class="hint">'+ph+'</p>')+'</div>'};
    page('plans',hd('Задачи и календарь','Планы')+'<div class="stack lg">'+taskForm(null,cl)+'<div class="cols3">'+col('Сегодня',today,'','На сегодня задач нет')+col('Позже',later,'','Следующий шаг еще не запланирован')+col('Просрочено',late,late.length?'late':'','Просроченных нет')+'</div>'+
      (done.length?'<details class="fold"><summary>Завершено · '+done.length+ic('down')+'</summary><div>'+done.map(function(t){return taskRow(t,cl)}).join('')+'</div></details>':'')+
      '<div class="card rv grid2" style="grid-template-columns:1fr 1fr;gap:28px"><div class="stack"><div class="row">'+ic('cal')+'<h2>Календарь</h2></div><p class="hint">Личная ссылка подписки. В календаре задачи называются нейтрально: «Задача Orbiq». Частоту обновления задает приложение календаря, напоминания к точному времени присылает CRM.</p><div id="ical">'+btn('Получить ссылку календаря','dark sm','data-a="ical"','cal')+'</div><p class="hint">Новая ссылка отключает прежнюю.</p></div><div class="stack">'+
      '<details class="fold" style="background:#F7F7F4"><summary>Apple Календарь'+ic('down')+'</summary><div><ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px"><li>На Mac: Файл → Новая подписка на календарь</li><li>На iPhone: Настройки → Календарь → Учетные записи → Добавить → Другое → Подписной календарь</li><li>Вставить ссылку и сохранить</li></ol></div></details>'+
      '<details class="fold" style="background:#F7F7F4"><summary>Google Календарь'+ic('down')+'</summary><div><ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px"><li>Открыть calendar.google.com на компьютере</li><li>Слева «Другие календари» → плюс → «Добавить по URL»</li><li>Вставить ссылку и нажать «Добавить календарь»</li></ol></div></details></div></div></div>',function(){S.tasksAfter=vPlans;bindTaskForm(null,vPlans)});
  }).catch(function(e){page('plans',errBox(e))});
}

/* ================= Обращения партнера ================= */
function vRequests(){
  loading('requests');
  api('rq/mine').then(function(d){var sent=d.sent||[],inb=d.inbox||[];
    var th=function(rid,list,side){return '<div class="thread">'+list.map(function(m){var me=m.from===side;return '<div class="msg'+(me?' me':'')+'">'+E(m.text)+(m.attach?'<span class="att">'+ic('clip')+'Вложение</span>':'')+'<small>'+(me?'Партнер':'Orbiq')+' · '+E(fmtDate(m.at,true))+'</small></div>'}).join('')+'</div><form class="comp" data-rid="'+E(rid)+'" style="margin-top:10px"><textarea class="ta" placeholder="Ответить Orbiq" rows="1"></textarea><button class="btn ic dark" type="submit" aria-label="Отправить">'+ic('send')+'</button></form>'};
    page('requests',hd('Только через Orbiq','Обращения')+'<div class="grid2" style="align-items:start"><div class="stack"><h2 class="sec-h">Мои предложения</h2>'+(sent.length?sent.map(function(r,i){return '<details class="fold rv" style="--i:'+i+'"><summary><span class="stack" style="gap:6px"><span class="row">'+stChip(r.status)+'<span class="kick">'+E(fmtDate(r.at))+'</span></span><span>'+E(r.alias||'Клиент')+' · '+E(CATS[r.request&&r.request.cat]||'Запрос')+'</span><span class="hint" style="font-weight:400">'+E(r.offer)+'</span></span>'+ic('down')+'</summary><div>'+th(r.id,r.thread||[],'initiator')+'</div></details>'}).join(''):'<div class="card">'+emptyBox('Предложений пока нет','Запросы есть во вкладке «Все», там кнопка «Предложить через Orbiq»',hasNet()?'<a class="btn sec" href="#/clients" data-a="scopeall">Открыть все карточки</a>':'')+'</div>')+'</div>'+
      '<div class="stack"><h2 class="sec-h">Orbiq о клиентах партнера</h2>'+(inb.length?inb.map(function(r,i){return '<div class="card rv" style="--i:'+i+'"><div class="row" style="justify-content:space-between;margin-bottom:12px"><b>'+E(r.alias)+'</b>'+stChip(r.status)+'</div>'+th(r.id,r.thread||[],'cardOwner')+'</div>'}).join(''):'<div class="card"><p class="hint">Когда другой партнер предложит услугу клиенту, Orbiq напишет сюда. Решение передавать или нет за партнером.</p></div>')+'</div></div>',function(m){
      $$('form.comp',m).forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var t=f.querySelector('textarea').value.trim();if(!t)return;api('rq/reply',{rid:f.getAttribute('data-rid'),text:t}).then(function(){toast('Отправлено');vRequests()}).catch(function(e2){toast(e2.message,'alert')})})})});
  }).catch(function(e){page('requests',errBox(e))});
}

/* ================= Уведомления ================= */
function vNotify(){
  var p=S.me.partner||{},tg=p.tg||{},on=tg.on||{};var conn=!!tg.connected;
  var ev=isOwner()?[['rq_new','Новое обращение'],['rq_reply','Ответ партнера'],['pf_submit','50 карточек на проверку']]:[['orbiq_msg','Сообщение от Orbiq'],['rq_status','Смена статуса моего обращения'],['reminder','Мои напоминания']];
  page('notify',hd('Telegram','Уведомления')+'<div class="grid2" style="grid-template-columns:1.3fr 1fr;align-items:start"><div class="card rv stack"><div class="row" style="justify-content:space-between"><h2>Подключение</h2>'+(conn?'<span class="chip ok">'+ic('check')+'Подключен</span>':'<span class="chip line">Не подключен</span>')+'</div>'+
    '<ol class="ql" style="list-style:none;padding:0;margin:0">'+['Нажать «Подключить Telegram»','Открыть бота Orbiq','Нажать Start','Получить тестовое сообщение'].map(function(s,i){return '<div><b style="font-family:var(--m);font-size:11px;color:var(--acc)">0'+(i+1)+'</b><span>'+s+'</span></div>'}).join('')+'</ol>'+
    '<div class="row">'+(conn?btn('Отключить','sec','data-a="tgoff"','x'):btn('Подключить Telegram','pri mag','data-a="tglink"','tg'))+'<span id="tgw"></span></div>'+
    '<p class="hint">Текст уведомления нейтральный: «Новое обращение в Orbiq. Открыть». Без Telegram все события остаются в кабинете.</p></div>'+
    '<div class="card rv stack" style="--i:1"><h2>О чем сообщать</h2>'+ev.map(function(e){return '<label class="chk" style="padding:6px 0"><input type="checkbox" data-tgp="'+e[0]+'" '+(on[e[0]]!==false?'checked':'')+' '+(conn?'':'disabled')+'><span>'+e[1]+'</span></label>'}).join('')+(conn?'':'<p class="hint">Переключатели откроются после подключения</p>')+'</div></div>',function(m){
    $$('[data-tgp]',m).forEach(function(c){c.addEventListener('change',function(){var o={};$$('[data-tgp]',m).forEach(function(x){o[x.getAttribute('data-tgp')]=x.checked});api('tg/events',{on:o}).then(function(){toast('Сохранено')}).catch(function(e){toast(e.message,'alert')})})})});
}

/* ================= Владелец: партнеры ================= */
function pStatus(p){if(p.suspended)return '<span class="chip err">Приостановлен</span>';var iv=p.invite||{};
  if(p.activated||iv.status==='used')return '<span class="chip ok">Активен</span>';
  var send=function(t){return '<button type="button" class="btn sm pri pinv-b" data-a="preinv" data-p="'+E(p.id)+'">'+ic('send')+'<span>'+t+'</span></button>'};
  if(iv.status==='created')return '<span class="pst"><span class="chip warn">Приглашение отправлено</span><small class="mu">ссылка до '+E(fmtDate(iv.expires))+'</small></span>';
  if(iv.status==='expired')return '<span class="pst"><span class="chip line">Ссылка истекла</span>'+send('Отправить заново')+'</span>';
  if(iv.status==='revoked')return '<span class="pst"><span class="chip line">Приглашение отозвано</span>'+send('Отправить заново')+'</span>';
  return '<span class="pst"><span class="chip">Не активен</span>'+send('Пригласить')+'</span>'}
function vPartners(){
  loading('partners');
  Promise.all([api('partners'),api('seat/list')]).then(function(r){var ps=r[0],seats=r[1];S.partners=ps;
    page('partners',hd('Только Founder Orbiq','Партнеры',btn('Добавить партнера','pri mag','data-a="pinv"','plus'))+
    '<div class="tbl-w rv" style="margin-bottom:22px"><table class="tbl ptbl"><thead><tr><th>Партнер</th><th>Доступ</th><th>Роль и статус</th><th>Направления</th><th>Клиенты</th><th>Активность</th><th aria-label="Действия"></th></tr></thead><tbody>'+ps.map(function(p,i){
      return '<tr class="rv prow" style="--i:'+i+';cursor:pointer" data-go="#/partner/'+E(p.id)+'"><td class="c-nm"><span class="nm" style="flex-direction:column;align-items:flex-start;gap:2px">'+E(p.name)+'<small class="mu" style="font-weight:400;font-size:12.5px">'+E(p.email)+'</small></span></td>'+
      '<td class="c-rq">'+pStatus(p)+'</td><td class="x" data-l="Роль">'+(p.kind==='networker'||normTier(p.tier)==='networker'?'<span class="chip dark">Нетворкер</span>':'<span class="fsel">'+sel('tier',[['new','Новый'],['basic','Базовый'],['paid','Партнер Orbiq']],normTier(p.tier),null,'data-ptier="'+E(p.id)+'" style="min-height:36px;font-size:13.5px"')+'</span>')+(p.ready!=null?'<small class="mu" style="display:block;margin-top:4px;font-family:var(--m);font-size:11px">Готовых '+p.ready+' из 50</small>':'')+'</td>'+
      '<td class="x" data-l="Направления">'+(p.categories||[]).map(function(c){return '<span class="chip" style="margin:2px">'+E(CATS[c]||c)+'</span>'}).join('')+'</td>'+
      '<td class="x num" data-l="Клиенты">'+(p.clients||0)+'</td><td class="x" data-l="Активность">'+(p.tg&&p.tg.connected?'<span class="chip ok" style="margin-right:6px">TG</span>':'')+(p.lastSeen?E(relDay(p.lastSeen)):'<span class="mu">—</span>')+'</td>'+
      '<td class="c-exp"><span class="menu"><button type="button" class="ibtn" data-a="pmenu" data-p="'+E(p.id)+'" aria-label="Действия">'+ic('more')+'</button></span></td></tr>'}).join('')+'</tbody></table></div>'+
    '<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 class="sec-h">Места по направлениям</h2><span class="kick">Два платных места на направление</span></div><div class="seats">'+seats.map(function(s,i){var sl='';for(var k=0;k<(s.max||2);k++){var x=s.seats[k];sl+='<i class="'+(x?'f':'')+'" title="'+E(x?x.name:'Свободно')+'">'+(x?E(x.name.split(' ')[0]):'Свободно')+'</i>'}return '<div class="seat rv" style="--i:'+i+'">'+catChip(s.cat)+'<div class="sl">'+sl+'</div>'+((s.waitlist||[]).length?'<span class="hint">Лист ожидания: '+s.waitlist.length+'</span>':'')+'</div>'}).join('')+'</div>',function(m){
      $$('[data-ptier]',m).forEach(function(s){s.addEventListener('change',function(){api('partner/tier',{pid:s.getAttribute('data-ptier'),tier:s.value}).then(function(){toast('Тариф изменен')}).catch(function(e){toast(e.message,'alert');vPartners()})})});
    });
  }).catch(function(e){page('partners',errBox(e))});
}
document.addEventListener('click',function(e){var tr=e.target.closest&&e.target.closest('tr.prow[data-go]');if(!tr||e.target.closest('button,select,a,input,label,.menu'))return;location.hash=tr.getAttribute('data-go')});
window.addEventListener('scroll',function(){$$('.menu-p').forEach(function(x){x.remove()})},{passive:true});
function partnerMenu(el){
  $$('.menu-p').forEach(function(x){x.remove()});var pid=el.getAttribute('data-p');var p=(S.partners||[]).find(function(x){return x.id===pid})||{};
  var m=document.createElement('div');m.className='menu-p';m.setAttribute('data-for',pid);
  m.innerHTML=(p.invite&&p.invite.status==='draft'?'<button type="button" data-a="preinv" data-p="'+E(pid)+'">'+ic('send')+'Отправить приглашение</button>':p.invite&&p.invite.status!=='used'?'<button type="button" data-a="preinv" data-p="'+E(pid)+'">'+ic('redo')+'Выдать ссылку заново</button><button type="button" data-a="prevoke" data-p="'+E(pid)+'">'+ic('x')+'Отозвать приглашение</button>':'')+
    (p.kind!=='networker'?'<button type="button" data-a="pprod" data-p="'+E(pid)+'">'+ic('gift')+'Карточка продукта</button>':'')+'<button type="button" data-a="ppay" data-p="'+E(pid)+'" data-w="1">'+ic('check')+'Отметить платеж 1</button><button type="button" data-a="ppay" data-p="'+E(pid)+'" data-w="2">'+ic('check')+'Отметить платеж 2</button>'+
    '<button type="button" class="'+(p.suspended?'':'d')+'" data-a="psusp" data-p="'+E(pid)+'" data-v="'+(p.suspended?'0':'1')+'">'+ic(p.suspended?'check':'pause')+(p.suspended?'Вернуть доступ':'Приостановить доступ')+'</button>';
  document.body.appendChild(m);var rc=el.getBoundingClientRect();m.style.position='fixed';m.style.top=Math.min(rc.bottom+6,innerHeight-m.offsetHeight-12)+'px';m.style.right=Math.max(12,innerWidth-rc.right)+'px';
}
function inviteSheet(){
  var chosen={};
  var el=sheet('<div class="kick">Новый партнер</div><h2>Добавить партнера</h2><form class="stack" id="pif"><div class="grid2"><div class="fld"><label for="pin">Имя</label><input class="in" id="pin" required></div><div class="fld"><label for="pie">Почта для входа</label><input class="in" id="pie" type="email" required></div></div><div class="fld"><label>Направления</label><div class="pills" id="pic">'+Object.keys(CATS).map(function(k){return '<button type="button" data-c="'+k+'">'+E(CATS[k])+'</button>'}).join('')+'</div></div><p class="err" id="pier" hidden></p><div class="row">'+btn('Создать ссылку','pri','type="submit"','send')+'</div><p class="hint">Ссылка одноразовая, действует 7 дней. Роль назначает сервер.</p></form><div id="pires"></div>');
  $('#pic',el).addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(!b)return;var c=b.getAttribute('data-c');chosen[c]=!chosen[c];b.classList.toggle('on',chosen[c])});
  $('#pif',el).addEventListener('submit',function(e){e.preventDefault();var n=$('#pin',el).value.trim(),em=$('#pie',el).value.trim(),er=$('#pier',el);if(!n||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){er.hidden=false;er.innerHTML=ic('alert')+'Нужны имя и корректная почта';return}
    api('partner/invite',{name:n,email:em,categories:Object.keys(chosen).filter(function(k){return chosen[k]})}).then(function(r){$('#pif',el).remove();$('#pires',el).innerHTML=linkBox(r.link,'Ссылка уходит партнеру своим каналом. Действует до '+fmtDate(r.expires));if($('#main'))vPartners()}).catch(function(e2){er.hidden=false;er.innerHTML=ic('alert')+E(e2.message)})});
}
function linkBox(link,hint){return '<div class="stack"><div class="url"><span>'+E(link)+'</span><button type="button" class="btn sm dark" data-a="copytxt" data-t="'+E(link)+'">'+ic('copy')+'Скопировать</button></div><p class="hint">'+E(hint)+'</p></div>'}
function paySheet(pid,w){
  var el=sheet('<div class="kick">Платеж '+w+'</div><h2>Отметить оплату</h2><form class="stack" id="ppf"><div class="grid2"><div class="fld"><label>Дата</label><input class="in" type="date" id="ppd" value="'+new Date().toISOString().slice(0,10)+'"></div><div class="fld"><label>Сумма, $</label><input class="in" id="ppa" inputmode="decimal" value="10000"></div></div><div class="row">'+btn('Сохранить','pri','type="submit"','check')+'</div><p class="hint">Платеж фиксируется вручную после подтверждения. Повторная отметка не создает дубль.</p></form>');
  $('#ppf',el).addEventListener('submit',function(e){e.preventDefault();api('partner/payment',{pid:pid,which:+w,at:new Date($('#ppd',el).value).toISOString(),amount:$('#ppa',el).value}).then(function(){closeSheet();toast('Платеж отмечен');vPartners()}).catch(function(e2){toast(e2.message,'alert')})});
}

/* ================= Владелец: входящие ================= */
function vInbox(args){
  var rid=args[0];loading('inbox');
  api('rq/all').then(function(list){
    var f=S.inbox.f;var L=f?list.filter(function(r){return r.status===f}):list;
    if(!rid&&L.length&&matchMedia('(min-width:1101px)').matches)rid=L[0].id;
    var cnt=function(s){return list.filter(function(r){return !s||r.status===s}).length};
    var lst='<div class="stack"><div class="pills">'+[['','Все'],['new','Новые'],['clarify','Уточнение'],['passed','Передано'],['closed','Закрыто']].map(function(x){return '<button type="button" class="'+(f===x[0]?'on':'')+'" data-a="ifilt" data-v="'+x[0]+'">'+x[1]+' <span style="font-family:var(--m);font-size:10.5px;opacity:.55;margin-left:4px">'+cnt(x[0])+'</span></button>'}).join('')+'</div><div class="ilist">'+(L.length?L.map(function(r,i){return '<a class="irow rv '+(r.id===rid?'on':'')+'" style="--i:'+i+'" href="#/inbox/'+E(r.id)+'"><span class="row" style="justify-content:space-between">'+stChip(r.status)+'<span class="kick">'+E(relDay(r.at))+'</span></span><span class="t">'+E(r.alias||'Сообщение')+' · '+E(CATS[r.request&&r.request.cat]||(r.fromNote?'Из заметки':'Запрос'))+'</span><span class="s">'+E((r.initiator||{}).name)+' '+ic('ar')+' '+E((r.cardOwner||{}).name)+'</span></a>'}).join(''):'<div class="card"><p class="hint">Обращений нет</p></div>')+'</div></div>';
    page('inbox',hd('Очередь решений','Входящие')+'<div class="inbox'+(args[0]?' has-sel':'')+'">'+lst+'<div id="idet" class="'+(rid?'':'nosel')+'">'+(rid?'<div class="skel" style="height:420px"></div>':'<div class="card">'+emptyBox('Обращение не выбрано','Здесь откроются обе переписки и условия сделки')+'</div>')+'</div></div>',function(){if(rid)inboxDetail(rid)});
  }).catch(function(e){page('inbox',errBox(e))});
}
function inboxDetail(rid){
  var box=$('#idet');
  api('rq/get',null,{rid:rid}).then(function(r){S.rq=r;var d=r.deal||{};
    var th=function(side,title,who){var l=(r.threads||{})[side]||[];return '<div class="card stack"><div class="row" style="justify-content:space-between"><h3>'+title+'</h3><span class="kick">'+E(who)+'</span></div><div class="thread">'+(l.length?l.map(function(m){var me=m.from==='orbiq';return '<div class="msg'+(me?' me':'')+'">'+E(m.text)+(m.attach?'<span class="att">'+ic('clip')+E(r.attachment&&r.attachment.id===m.attach?r.attachment.name:'Вложение')+'</span>':'')+'<small>'+(me?'Orbiq':E(who))+' · '+E(fmtDate(m.at,true))+'</small></div>'}).join(''):'<p class="hint">Переписки пока нет</p>')+'</div>'+
      (side==='cardOwner'?'<div class="pick"><span class="lbl">Что переслать владельцу карточки</span><label class="chk"><input type="checkbox" data-pk="offer" checked><span>Предложение</span></label>'+(r.terms?'<label class="chk"><input type="checkbox" data-pk="terms"><span>Условия</span></label>':'')+(r.attachment?'<label class="chk"><input type="checkbox" data-pk="att" data-att="'+E(r.attachment.id)+'"><span>'+ic('clip')+' '+E(r.attachment.name)+'</span></label>':'')+'<button type="button" class="link" data-a="pkfill" style="align-self:flex-start">Собрать текст</button></div>':'')+
      '<form class="comp" data-to="'+side+'"><textarea class="ta" placeholder="Сообщение от Orbiq" rows="1"></textarea><button class="btn ic dark" type="submit" aria-label="Отправить">'+ic('send')+'</button></form><p class="err" data-warn="'+side+'" hidden></p></div>'};
    box.innerHTML='<div class="stack rv"><a class="back mob" href="#/inbox">'+ic('al')+'Все обращения</a><div class="card stack"><div class="row" style="justify-content:space-between"><div><span class="kick">'+(r.kind==='refer'?'Нетворкер передает клиента · ':'Обращение · ')+E(fmtDate(r.at,true))+'</span><h2 style="font-family:var(--s);font-stretch:112%;font-size:34px;margin-top:6px">'+E(r.alias)+'</h2></div><span class="row">'+(r.cid?'<a class="btn sm sec" href="#/c/'+E(r.cid)+'">Карточка</a>':'')+'</span></div>'+
      '<div class="who"><div><span class="lbl">Инициатор</span><b>'+E((r.initiator||{}).name)+'</b></div><div><span class="lbl">Владелец карточки</span><b>'+E((r.cardOwner||{}).name)+'</b></div><div><span class="lbl">Запрос</span><b style="font-size:14px;font-weight:500">'+(r.request?E(CATS[r.request.cat]||'')+(r.request.text?' · '+E(r.request.text):''):(r.fromNote?'Из заметки партнера':'—'))+'</b></div></div>'+
      '<div class="pub"><span class="lbl">Предложение</span><span>'+E(r.offer)+'</span>'+(r.terms?'<span class="lbl" style="margin-top:6px">Условия</span><span>'+E(r.terms)+'</span>':'')+(r.attachment?'<button type="button" class="link" style="margin-top:6px;display:inline-flex;gap:6px;align-self:flex-start" data-a="att" data-r="'+E(r.id)+'" data-id="'+E(r.attachment.id)+'">'+ic('clip')+E(r.attachment.name)+'</button>':'')+'</div></div>'+
      '<div class="two">'+th('initiator','Orbiq ↔ инициатор',(r.initiator||{}).name)+th('cardOwner','Orbiq ↔ владелец карточки',(r.cardOwner||{}).name)+'</div>'+
      '<form class="card stack" id="dealf"><div class="row" style="justify-content:space-between"><h3>Статус и условия сделки</h3><span class="lock-l">'+ic('lock')+'Видит только Orbiq</span></div><div class="seg" id="rqs" style="align-self:flex-start;flex-wrap:wrap">'+Object.keys(RQST).map(function(k){return '<button type="button" class="'+(r.status===k?'on':'')+'" data-v="'+k+'">'+RQST[k]+'</button>'}).join('')+'</div>'+
      '<div class="grid3" style="grid-template-columns:repeat(4,1fr)"><div class="fld"><label>Плательщик</label><input class="in" name="payer" value="'+E(d.payer||'')+'"></div><div class="fld"><label>Сумма, $</label><input class="in" name="amount" value="'+E(d.amount||'')+'"></div><div class="fld"><label>Процент</label><input class="in" name="percent" value="'+E(d.percent||'')+'"></div><div class="fld"><label>База расчета</label><input class="in" name="basis" value="'+E(d.basis||'')+'"></div></div><label class="chk"><input type="checkbox" name="received" '+(d.received?'checked':'')+'><span>Комиссия получена</span></label><div class="row">'+btn('Сохранить','dark sm','type="submit"','check')+'</div></form></div>';
    segs(box);
    var st=r.status;$('#rqs',box).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;st=b.getAttribute('data-v');$$('#rqs button',box).forEach(function(x){x.classList.toggle('on',x===b)});segs(box)});
    $('#dealf',box).addEventListener('submit',function(e){e.preventDefault();var f=e.target;api('rq/status',{rid:rid,status:st,deal:{payer:f.payer.value,amount:f.amount.value,percent:f.percent.value,basis:f.basis.value,received:f.received.checked}}).then(function(){toast('Сохранено');vInbox([rid])}).catch(function(e2){toast(e2.message,'alert')})});
    $$('form.comp',box).forEach(function(f){var ta=f.querySelector('textarea'),side=f.getAttribute('data-to'),w=$('[data-warn="'+side+'"]',box);
      ta.addEventListener('input',function(){var fs=findIds(ta.value).filter(function(x){return x.t!=='name'||x.on});w.hidden=!fs.length;if(fs.length)w.innerHTML=ic('alert')+'Похоже на контакт: '+E(fs.map(function(x){return x.v}).join(', '))+'. Перед отправкой это нужно убрать'});
      f.addEventListener('submit',function(e){e.preventDefault();var t=ta.value.trim();if(!t)return;var at=side==='cardOwner'?$$('[data-pk="att"]:checked',box).map(function(x){return x.getAttribute('data-att')}):[];
        api('rq/send',{rid:rid,to:side,text:t,attachIds:at}).then(function(x){toast(x&&x.warnings&&x.warnings.length?x.warnings.join('. '):'Отправлено',x&&x.warnings&&x.warnings.length?'alert':'send');vInbox([rid])}).catch(function(e2){toast(e2.message,'alert')})})});
  }).catch(function(e){box.innerHTML=errBox(e)});
}

/* ================= Владелец: проверки портфелей ================= */
function vReviews(){
  loading('reviews');
  api('pf/all').then(function(ps){var sub=ps.filter(function(p){return p.status==='submitted'||p.status==='clarify'});
    return Promise.all(sub.map(function(p){return api('pf/status',null,{pid:p.pid}).then(function(s){return {p:{id:p.pid,name:p.name},s:s}})}))}).then(function(rows){
    var D=[['exists','Человек существует'],['relation','Связь подтверждена'],['capital','Капитал выше порога']];
    page('reviews',hd('Выборочная проверка · 50 готовых карточек','Проверки')+'<div class="infob rv" style="margin-bottom:16px">'+ic('shield')+'<span>Сверка идет в отдельной закрытой сессии. Имена, документы и ссылки сюда не записываются: остаются дата, решение по трем пунктам и нейтральная причина.</span></div>'+
    (rows.length?rows.map(function(x,i){var s=x.s;return '<div class="card rv stack" style="--i:'+i+';margin-bottom:16px"><div class="row" style="justify-content:space-between"><div><span class="kick">Отправлено '+E(fmtDate(s.submittedAt))+'</span><h2 style="font-family:var(--s);font-stretch:112%;font-size:30px;margin-top:4px">'+E(x.p.name)+'</h2></div><span class="chip dark">Зачтено '+s.counted+' из '+(s.of||50)+'</span></div>'+
      (s.sample||[]).map(function(c){var dd=(s.decisions||{})[c.cid]||{};return '<form class="pub" data-pfd="'+E(x.p.id)+'" data-cid="'+E(c.cid)+'" style="gap:12px"><div class="row" style="justify-content:space-between"><b style="font-size:16px">'+E(c.alias||c.cid)+'</b>'+(dd.at?'<span class="chip ok">Решение записано</span>':'')+'</div><div class="dec">'+D.map(function(k){return '<div><span>'+k[1]+'</span><div class="seg" data-k="'+k[0]+'">'+[['yes','Да'],['no','Нет'],['insufficient','Мало сведений']].map(function(o){return '<button type="button" class="'+(dd[k[0]]===o[0]?'on':'')+'" data-v="'+o[0]+'">'+o[1]+'</button>'}).join('')+'</div></div>'}).join('')+'</div><div class="row"><input class="in grow" name="reason" placeholder="Нейтральная причина" value="'+E(dd.reason||'')+'" style="background:#fff">'+btn('Записать','sm dark','type="submit"','check')+'</div></form>'}).join('')+
      '<div class="row" style="border-top:1px solid var(--line);padding-top:14px"><input class="in grow" data-fr="'+E(x.p.id)+'" placeholder="Основание решения, его увидит партнер">'+(function(){var ok=(s.sample||[]).length&&(s.sample||[]).every(function(c){var d=(s.decisions||{})[c.cid]||{};return d.exists==='yes'&&d.relation==='yes'&&d.capital==='yes'});return btn('Одобрить','sm pri','data-a="pffin" data-p="'+E(x.p.id)+'" data-v="approve"'+(ok?'':' disabled title="Нужно «Да» по трем пунктам у каждой карточки выборки"'),'check')+(ok?'':'<span class="hint" style="flex-basis:100%">Одобрить можно после «Да» по трем пунктам у каждой карточки выборки</span>')})()+btn('Запросить уточнение','sm sec','data-a="pffin" data-p="'+E(x.p.id)+'" data-v="clarify"')+btn('Отказать','sm danger','data-a="pffin" data-p="'+E(x.p.id)+'" data-v="reject"')+'<button type="button" class="link mute" data-a="pfext" data-p="'+E(x.p.id)+'">Расширить выборку</button>'+'</div></div>'}).join(''):'<div class="card">'+emptyBox('Проверок нет','Здесь появятся портфели кандидатов, отправленные на проверку')+'</div>'),function(m){
      $$('form[data-pfd] .seg',m).forEach(function(sg){sg.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;$$('button',sg).forEach(function(x){x.classList.toggle('on',x===b)});segs(sg.parentNode)})});
      $$('form[data-pfd]',m).forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var o={pid:f.getAttribute('data-pfd'),cid:f.getAttribute('data-cid'),reason:f.reason.value.trim()};$$('.seg',f).forEach(function(sg){var on=sg.querySelector('button.on');o[sg.getAttribute('data-k')]=on?on.getAttribute('data-v'):''});
        api('pf/decide',o).then(function(){toast('Решение записано');vReviews()}).catch(function(e2){toast(e2.message,'alert')})})});
    });
  }).catch(function(e){page('reviews',errBox(e))});
}

/* ================= Владелец: каталог ================= */
var THEMES=Object.keys(CATS).filter(function(k){return k!=='other'});
function vCatalog(){
  loading('catalog');
  api('catalog').then(function(l){S.catalog=l;var f=S.catF||'';var q=norm(S.catQ||'');
    var L=l.filter(function(x){return (!f||x.status===f)&&(!q||norm(x.title+' '+x.id).indexOf(q)>=0)});
    var cnt=function(v){return l.filter(function(x){return !v||x.status===v}).length};
    page('catalog',hd('Предложения для подборок','Каталог',btn('Добавить предложение','pri mag','data-a="catnew"','plus'))+
    '<div class="tools"><div class="pills">'+[['','Все'],['available','Можно сейчас'],['idea','Идея для поиска']].map(function(x){return '<button type="button" class="'+(f===x[0]?'on':'')+'" data-a="catf" data-v="'+x[0]+'">'+x[1]+' <span style="font-family:var(--m);font-size:10.5px;opacity:.55;margin-left:4px">'+cnt(x[0])+'</span></button>'}).join('')+'</div><label class="search">'+ic('search')+'<input class="in" type="search" id="catq" placeholder="Поиск" value="'+E(S.catQ||'')+'"></label></div>'+
    '<div class="tbl-w rv">'+(L.length?'<table class="tbl"><thead><tr><th>Предложение</th><th>Статус</th><th>Темы</th><th>Подготовка</th><th>Регион</th><th>Дедлайн</th><th class="sr">Действия</th></tr></thead><tbody>'+L.slice(0,S.catN||40).map(function(x){var late=x.deadline&&x.deadline<new Date().toISOString().slice(0,10);
      var u=x.url||('/journal/a/'+x.id+'/');return '<tr style="cursor:default"><td class="c-nm"><span class="nm cat-nm" style="white-space:normal;align-items:flex-start"><a class="mring cat-cv" href="'+E(u)+'" target="_blank" rel="noopener" aria-label="Открыть в журнале" style="border-radius:10px;background:#ddd url('+E(x.cover||img(x.id))+') center/cover;width:64px;height:64px;flex:none"></a><span style="display:flex;flex-direction:column;gap:4px"><a class="cat-t" href="'+E(u)+'" target="_blank" rel="noopener">'+E(x.title)+'</a><small class="cat-d">'+E(x.deliver||x.hook||'')+'</small>'+(x.cost||x.guests?'<small class="mu cat-m">'+E([x.guests,x.cost].filter(Boolean).join(' · '))+'</small>':'')+'</span></span></td>'+
      '<td class="c-rq">'+(x.status==='idea'?'<span class="chip warn">Идея</span>':'<span class="chip ok">Можно сейчас</span>')+'</td><td class="x" data-l="Темы">'+(x.themes||[]).slice(0,3).map(function(t){return '<span class="chip" style="margin:2px">'+E(CATS[t]||t)+'</span>'}).join('')+'</td><td class="x" data-l="Подготовка">'+E((x.dates||'').replace(/^оценка Orbiq:\s*/,'')||'—')+(x.online?' · онлайн':'')+'</td><td class="x" data-l="Регион">'+E(x.region||'—')+'</td><td class="x num" data-l="Дедлайн" style="'+(late?'color:var(--err)':'')+'">'+(x.deadline?E(fmtDate(x.deadline)):'—')+'</td>'+
      '<td class="c-exp"><span class="row" style="gap:2px;flex-wrap:nowrap"><button type="button" class="ibtn" data-a="catedit" data-id="'+E(x.id)+'" aria-label="Изменить" title="Изменить">'+ic('note')+'</button><button type="button" class="ibtn" data-a="catdel" data-id="'+E(x.id)+'" aria-label="Удалить">'+ic('trash')+'</button></span></td></tr>'}).join('')+'</tbody></table>'+(L.length>(S.catN||40)?'<div style="padding:14px;text-align:center">'+btn('Показать еще '+Math.min(40,L.length-(S.catN||40)),'sm soft','data-a="catmore"','down')+'</div>':''):emptyBox('Пусто','Первое предложение попадет в подборки партнеров',btn('Добавить предложение','sec','data-a="catnew"','plus')))+'</div>',function(m){
      var qi=$('#catq',m),tm;qi.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(function(){S.catQ=qi.value;vCatalog()},300)})});
  }).catch(function(e){page('catalog',errBox(e))});
}
function catalogSheet(x){x=x||{status:'available',themes:[],prepDays:14};var th={};(x.themes||[]).forEach(function(t){th[t]=1});
  var el=sheet('<div class="kick">'+(x.id?'Правка':'Новое предложение')+'</div><h2>'+(x.id?E(x.title):'Добавить в каталог')+'</h2><form class="stack" id="ctf">'+
  '<div class="grid2"><div class="fld"><label>ID (латиница, без пробелов)</label><input class="in" name="id" value="'+E(x.id||'')+'" '+(x.id?'readonly':'')+' pattern="[A-Za-z0-9_-]+" required></div><div class="fld"><label>Статус</label><div class="seg" id="cts"><button type="button" class="'+(x.status!=='idea'?'on':'')+'" data-v="available">Можно сейчас</button><button type="button" class="'+(x.status==='idea'?'on':'')+'" data-v="idea">Идея для поиска</button></div></div></div>'+
  '<div class="fld"><label>Название</label><input class="in" name="title" value="'+E(x.title||'')+'" required></div>'+
  '<div class="fld"><label>Темы</label><div class="pills" id="ctt">'+THEMES.map(function(k){return '<button type="button" class="'+(th[k]?'on':'')+'" data-c="'+k+'">'+E(CATS[k])+'</button>'}).join('')+'</div></div>'+
  '<div class="grid3"><div class="fld"><label>Формат</label><input class="in" name="format" value="'+E(x.format||'')+'" placeholder="Событие, опыт, услуга"></div><div class="fld"><label>Регион</label><input class="in" name="region" value="'+E(x.region||'')+'"></div><div class="fld"><label>Дедлайн</label><input class="in" type="date" name="deadline" value="'+E(x.deadline||'')+'"></div></div>'+
  '<label class="chk"><input type="checkbox" name="online" '+(x.online?'checked':'')+'><span>Можно онлайн</span></label>'+
  '<div class="grid2"><div class="fld"><label>Условия</label><input class="in" name="terms" value="'+E(x.terms||'')+'"></div><div class="fld"><label>Стоимость</label><input class="in" name="cost" value="'+E(x.cost||'')+'"></div></div>'+
  '<div class="fld"><label>Что получит клиент</label><input class="in" name="deliver" value="'+E(x.deliver||'')+'"></div>'+
  '<div class="grid2"><div class="fld"><label>Следующий шаг для клиента</label><input class="in" name="next" value="'+E(x.next||'')+'" placeholder="Запрос через партнера, запись у организатора"></div><div class="fld"><label>Кто подтверждает</label><input class="in" name="confirmBy" value="'+E(x.confirmBy||'Orbiq')+'"></div></div>'+
  '<div class="grid2"><div class="fld"><label>Обложка: путь /img/... или https://</label><input class="in" name="cover" value="'+E(x.cover||'')+'" placeholder="'+E(x.id?img(x.id):'/img/journal/t/....webp')+'"></div><div class="fld"><label>Проверено</label><input class="in" type="date" name="verifiedAt" value="'+E((x.verifiedAt||'').slice(0,10))+'"></div></div>'+
  '<p class="err" id="cter" hidden></p><div class="row">'+btn('Сохранить','pri','type="submit"','check')+'</div></form>',true);
  var st=x.status==='idea'?'idea':'available';
  $('#cts',el).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;st=b.getAttribute('data-v');$$('#cts button',el).forEach(function(z){z.classList.toggle('on',z===b)});segs(el)});
  $('#ctt',el).addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(!b)return;var k=b.getAttribute('data-c');th[k]=!th[k];b.classList.toggle('on',th[k])});
  $('#ctf',el).addEventListener('submit',function(e){e.preventDefault();var f=e.target,er=$('#cter',el);var id=f.id.value.trim();
    if(!/^[A-Za-z0-9_-]+$/.test(id)||!f.title.value.trim()){er.hidden=false;er.innerHTML=ic('alert')+'Нужны ID латиницей и название';return}
    if(st==='available'&&f.deadline.value&&!f.verifiedAt.value){er.hidden=false;er.innerHTML=ic('alert')+'Для срочного предложения нужна дата проверки';return}
    var item={id:id,title:f.title.value.trim(),themes:Object.keys(th).filter(function(k){return th[k]}),format:f.format.value.trim(),region:f.region.value.trim(),online:f.online.checked,terms:f.terms.value.trim(),cost:f.cost.value.trim(),deadline:f.deadline.value,verifiedAt:f.verifiedAt.value,status:st,deliver:f.deliver.value.trim(),confirmBy:f.confirmBy.value.trim(),cover:f.cover.value.trim(),next:f.next.value.trim(),dates:x.dates||'',prepDays:x.prepDays==null?14:x.prepDays};
    api('catalog/upsert',{item:item}).then(function(){closeSheet();toast('Каталог обновлен');vCatalog()}).catch(function(e2){er.hidden=false;er.innerHTML=ic('alert')+E(e2.message)})});
}

/* ================= Владелец: архив, журнал ================= */
function vArchive(){
  loading('archive');
  api('clients',null,{scope:'archive'}).then(function(l){
    page('archive',hd('Не удаление','Архив')+'<div class="tbl-w rv">'+(l.length?'<table class="tbl"><thead><tr><th>Карточка</th><th>Автор</th><th>В архиве с</th><th>Возраст</th><th>Капитал</th></tr></thead><tbody>'+l.map(function(c){return '<tr style="cursor:default"><td class="c-nm"><span class="nm">'+E(c.alias)+'<span class="chip mono line">Архив</span></span></td><td class="c-rq">'+E(c.ownerName||'—')+'</td><td class="x" data-l="В архиве">'+E(fmtDate(c.archivedAt))+'</td><td class="x" data-l="Возраст">'+E(ageL(c.age))+'</td><td class="x" data-l="Капитал">'+E(capL(c.capital))+'</td></tr>'}).join('')+'</tbody></table>':emptyBox('Архив пуст','Карточки, которые партнеры убрали в архив, остаются здесь с автором и датой'))+'</div>');
  }).catch(function(e){page('archive',errBox(e))});
}
function vAudit(){
  loading('audit');
  Promise.all([api('audit',null,{limit:200}),api('partners').catch(function(){return []})]).then(function(rr){var l=rr[0],nm={};rr[1].forEach(function(p){nm[p.id]=p.name});var sub=function(t){return String(t==null?'':t).replace(/p_[A-Za-z0-9]+/g,function(x){return nm[x]||x})};l.forEach(function(a){a.who=sub(a.who);a.obj=sub(a.obj)});
    page('audit',hd('Без текстов заметок и контактов','Журнал действий')+'<div class="tbl-w rv"><table class="tbl"><thead><tr><th>Когда</th><th>Кто</th><th>Действие</th><th>Объект</th><th>Статус</th></tr></thead><tbody>'+l.map(function(a){return '<tr style="cursor:default"><td class="c-nm"><span class="kick" style="color:var(--ink)">'+E(fmtDate(a.at,true))+'</span></td><td class="x" data-l="Кто">'+E(a.who)+(a.role==='owner'?' <span class="chip mono dark">owner</span>':'')+'</td><td class="c-rq"><b style="font-weight:500">'+E(a.action)+'</b></td><td class="x" data-l="Объект"><span class="mu">'+E(a.obj||'—')+'</span>'+(a.reason?'<br><small class="mu">'+E(a.reason)+'</small>':'')+'</td><td class="x" data-l="Статус">'+(a.status==='ok'?'<span class="chip ok">ok</span>':'<span class="chip err">'+E(a.status)+'</span>')+'</td></tr>'}).join('')+'</tbody></table></div>');
  }).catch(function(e){page('audit',errBox(e))});
}

/* ================= Действия ================= */
var A={
  sclose:closeSheet,
  go:function(el){go(el.getAttribute('data-h'))},
  newc:function(){go('#/new')},
  howsee:howSee,
  relogin:function(){vLogin()},
  demoin:function(el,e){if(DEMO){e.preventDefault();location.search='?demo=1&as=paid'}},
  logout:function(){api('auth/logout',{}).catch(function(){}).then(function(){S.me=null;if(DEMO){location.search='?demo=1&as=login';return}location.hash='#/login';location.reload()})},
  more:function(){var items=isOwner()?navItems().slice(4):(ptier()==='new'?[['product','Мой продукт','gift'],['notify','Уведомления','bell']]:[['product','Мой продукт','gift'],['status','Статус','star'],['requests','Обращения','msg'],['plans','Планы','cal'],['notify','Уведомления','bell']]);sheet('<h2>Еще</h2><nav class="stack" style="gap:6px">'+items.map(function(n){return '<a class="btn sec" style="justify-content:flex-start" href="#/'+n[0]+'" data-a="sclose">'+ic(n[2])+n[1]+'</a>'}).join('')+(isOwner()?'':'<button type="button" class="btn soft" style="justify-content:flex-start" data-a="howto">'+ic('spark')+'Как это работает</button>')+'<button type="button" class="btn soft" style="justify-content:flex-start" data-a="logout">'+ic('out')+'Выйти</button></nav>')},
  scope:function(el){if(el.disabled)return;S.list.scope=el.getAttribute('data-v');$$('.tools .seg button').forEach(function(b){b.classList.toggle('on',b===el)});segs();refreshTable()},
  scopeall:function(){S.list.scope='all'},
  fclear:function(){S.list.q='';S.list.cat='';S.list.interest='';S.list.capital='';S.list.investing='';vClients()},
  open:function(el,e){if(e.target.closest('[data-a="exp"]'))return;go('#/c/'+el.getAttribute('data-id'))},
  exp:function(el,e){e.stopPropagation();el.closest('tr').classList.toggle('open')},
  viewas:function(el){S.viewAs=el.getAttribute('data-v');S._animNext=S.viewAs==='own';render()},
  sec:function(el){var v=el.getAttribute('data-v');S.selSec=S.selSec===v?null:v;if(S.card)mountRing(S.card,false)},
  setf:function(el){var k=el.getAttribute('data-k'),v=el.getAttribute('data-v');var c=S.card;var cur=k==='isClient'?(c.relation||{}).isClient:c[k];if(cur===v)v='';
    if(k==='isClient'){$$('.pills[data-k="isClient"] button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-v')===v&&!!v)});patch({relation:Object.assign({},c.relation||{},{isClient:v})}).then(function(){mountRing(S.card,false)});return}
    $$('.pills[data-k="'+k+'"] button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-v')===v&&!!v)});
    var p={};p[k]=v;if(k==='age'){p.cells={'about.age':v?{v:v,kind:'fact'}:null}}patch(p).then(function(){mountRing(S.card,false)})},
  kids:function(el){var c=S.card;var n=(c.kids==null||c.kids==='')?0:+c.kids;n=Math.max(0,n+(+el.getAttribute('data-v')));if(c.kids==null&&+el.getAttribute('data-v')<0)return;$('#kidsv').textContent=n;patch({kids:n}).then(function(){mountRing(S.card,false)})},
  intdel:function(el){var a=(S.card.interests||[]).slice();a.splice(+el.getAttribute('data-i'),1);patch({interests:a}).then(function(){renderTab(S.card,'profile')})},
  rqst:function(el){var id=el.getAttribute('data-r'),v=el.getAttribute('data-v');var a=S.card.requests.map(function(r){return r.id===id?Object.assign({},r,{status:v}):r});patch({requests:a}).then(function(){renderTab(S.card,'profile')})},
  rqdel:function(el){var id=el.getAttribute('data-r');if(!confirm('Удалить запрос?'))return;var a=S.card.requests.filter(function(r){return r.id!==id});var pt=Object.assign({},S.card.publicText||{});delete pt[id];patch({requests:a,publicText:pt}).then(function(){renderTab(S.card,'profile')})},
  pubedit:function(el){var id=el.getAttribute('data-r');S.card.requests.forEach(function(r){if(r.id===id)r._edit=true});renderTab(S.card,'profile')},
  pubok:function(el){var id=el.getAttribute('data-r');var inp=$('[data-pub="'+id+'"]');var v=inp.value.trim();if(!v){toast('Нужна формулировка','alert');return}if(v.indexOf('[скрыто]')>=0){toast('В формулировке осталось [скрыто]','alert');return}var f=findIds(v).filter(function(x){return x.on});if(f.length){toast('Нужно убрать: '+f.map(function(x){return x.v}).join(', '),'alert');return}
    var pt=Object.assign({},S.card.publicText||{});pt[id]=v;var a=S.card.requests.map(function(r){var o=Object.assign({},r);delete o._edit;return o});patch({publicText:pt,requests:a}).then(function(){toast('Партнеры видят новую формулировку');renderTab(S.card,'profile')})},
  archive:function(){var c=S.card;sheet('<div class="kick">Карточка «'+E(c.alias)+'»</div><h2>Убрать в архив?</h2><p class="hint">Карточка исчезнет из личного списка и из общей выдачи. Orbiq сохранит ее с историей. Имя останется занятым.</p><div class="row">'+btn('Убрать в архив','dark','data-a="archok"','archive')+'<button type="button" class="link mute" data-a="sclose">Отмена</button></div>')},
  archok:function(){api('client/archive',{id:S.card.id}).then(function(){closeSheet();toast('Карточка в архиве','archive');go('#/clients')}).catch(function(e){toast(e.message,'alert')})},
  dcheck:function(){var t=$('#dtx').value.trim();if(t.length<10){toast('Нужна хотя бы пара фактов','alert');return}stopRec();scrubStage(S.card.id,t,'dict')},
  pkind:function(el){var P=S.pending[S.card.id];P.proposals[+el.getAttribute('data-k')].kind=el.getAttribute('data-v');S.reviewDraw()},
  pst:function(el){var P=S.pending[S.card.id];P.proposals[+el.getAttribute('data-k')].st=el.getAttribute('data-v')||null;S.reviewDraw()},
  pall:function(){var P=S.pending[S.card.id];P.proposals.forEach(function(p){if(p.st!=='del')p.st='ok'});S.reviewDraw()},
  papply:function(el){el.disabled=true;applyReview(S.card.id)},
  copytask:function(){copy(AI_TASK)},
  prmtog:function(el){var p=$('#prm');p.classList.toggle('open');el.textContent=p.classList.contains('open')?'Свернуть':'Показать полностью'},
  mdpaste:function(){var el=sheet('<div class="kick">Вместо файла</div><h2>Вставить текст из нейросети</h2><textarea class="ta" id="mdt" style="min-height:260px" placeholder="Содержимое profile.md"></textarea><div class="row">'+btn('Проверить текст','pri','id="mdgo"','ar')+'</div>',true);$('#mdgo',el).addEventListener('click',function(){var t=$('#mdt',el).value.trim();if(!t){toast('Текст пустой','alert');return}scrubStage(S.card.id,t,'md')})},
  copytxt:function(el){copy(el.getAttribute('data-t'))},
  qcopy:function(el){var t=$('textarea[data-q="'+el.getAttribute('data-q')+'"]');copy(t?t.value:'')},
  qlater:function(el){api('question/mark',{cid:S.card.id,qid:el.getAttribute('data-q'),state:'later'}).then(function(){toast('Перенесено в «Позже»','clock');renderTab(S.card,'match')})},
  qnow:function(el){api('question/mark',{cid:S.card.id,qid:el.getAttribute('data-q'),state:'now'}).then(function(){renderTab(S.card,'match')})},
  qasked:function(el){var qid=el.getAttribute('data-q');var s=sheet('<div class="kick">После разговора</div><h2>Что ответил клиент?</h2><div class="pills" id="qa"><button type="button" class="on" data-v="да">Да, интересно</button><button type="button" data-v="нет">Не интересно</button><button type="button" data-v="подумает">Подумает</button></div><div class="fld"><label>Вернуться после, по желанию</label><input class="in" type="date" id="qr"></div><div class="row">'+btn('Сохранить','pri','id="qok"','check')+'</div>');
    var ans='да';$('#qa',s).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;ans=b.getAttribute('data-v');$$('#qa button',s).forEach(function(x){x.classList.toggle('on',x===b)})});
    $('#qok',s).addEventListener('click',function(){var r=$('#qr',s).value;api('question/mark',{cid:S.card.id,qid:qid,state:r?'later':'done',answer:ans,returnAfter:r||undefined}).then(function(x){closeSheet();toast(x&&x.research?'Появилась задача на поиск':'Очередь обновлена');renderTab(S.card,'match')}).catch(function(e){toast(e.message,'alert')})})},
  invite:function(el){var ch=$('#cch').value,dt=$('#cdate').value;el.disabled=true;api('invite/create',{cid:S.card.id,consentAt:new Date(dt).toISOString(),consentChannel:ch,confirm10m:true}).then(function(r){$('#invr').innerHTML='<div style="margin-top:14px">'+linkBox(r.link,'Ссылку клиенту партнер отправляет сам. Ссылку можно отозвать, пока ее не активировали.')+'</div>';toast('Приглашение создано','gift')}).catch(function(e){el.disabled=false;toast(e.message,'alert')})},
  ndel:function(el){if(!confirm('Удалить заметку?'))return;api('note/del',{cid:S.card.id,id:el.getAttribute('data-n')}).then(function(){renderTab(S.card,'notes');if(!S.card.mine)vNetCard(S.card)})},
  nfwd:function(el){var n=(S.notes||[]).find(function(x){return x.id===el.getAttribute('data-n')});if(!n)return;var s=sheet('<div class="kick">Отдельная копия</div><h2>Передать через Orbiq</h2><p class="hint">Отправится этот текст. Правки заметки после отправки в Orbiq не попадут.</p><textarea class="ta" id="nft" style="min-height:140px">'+E(n.text)+'</textarea><p class="err" id="nfw" hidden></p><div class="row">'+btn('Отправить в Orbiq','pri','id="nfgo"','send')+'<button type="button" class="link mute" data-a="sclose">Отмена</button></div>');
    var ta=$('#nft',s),w=$('#nfw',s);var chk=function(){var f=findIds(ta.value).filter(function(x){return x.on&&x.t!=='name'});w.hidden=!f.length;if(f.length)w.innerHTML=ic('alert')+'В тексте есть контакт: '+E(f.map(function(x){return x.v}).join(', '))};ta.addEventListener('input',chk);chk();
    $('#nfgo',s).addEventListener('click',function(){var t=ta.value.trim();if(!t)return;api('note/forward',{cid:S.card.id,noteId:n.id,text:t}).then(function(){closeSheet();toast('Копия отправлена в Orbiq','send')}).catch(function(e){toast(e.message,'alert')})})},
  tdone:function(el){var id=el.getAttribute('data-t');el.classList.toggle('on');api('task/list').then(function(l){var t=l.find(function(x){return x.id===id});return api('task/upsert',Object.assign({},t,{id:id,done:!t.done}))}).then(function(){(S.tasksAfter||vPlans)()})},
  tmove:function(el){var id=el.getAttribute('data-t');api('task/list').then(function(l){var t=l.find(function(x){return x.id===id});var d=new Date(Math.max(Date.now(),parseDue(t.due).getTime()));d.setDate(d.getDate()+1);return api('task/upsert',Object.assign({},t,{id:id,due:localDue(d)}))}).then(function(){toast('Перенесено на завтра','clock');(S.tasksAfter||vPlans)()})},
  tdel:function(el){api('task/del',{id:el.getAttribute('data-t')}).then(function(){(S.tasksAfter||vPlans)()})},
  ical:function(el){el.disabled=true;api('ical/rotate',{}).then(function(r){$('#ical').innerHTML=linkBox(r.url,'Ссылка личная, только для себя.')+'<button type="button" class="link mute" data-a="ical" style="margin-top:8px">Сменить ссылку</button>'}).catch(function(e){el.disabled=false;toast(e.message,'alert')})},
  pfsend:function(el){sheet('<div class="kick">50 готовых карточек</div><h2>Отправить на проверку?</h2><p class="hint">Состав зафиксируется. Orbiq выборочно сверит несколько карточек, выбор не изменится при перезагрузке.</p><div class="row">'+btn('Отправить','pri','data-a="pfok"','send')+'<button type="button" class="link mute" data-a="sclose">Отмена</button></div>')},
  pfok:function(){api('pf/submit',{}).then(function(){closeSheet();toast('Карточки отправлены на проверку');vStatus()}).catch(function(e){toast(e.message,'alert')})},
  tglink:function(el){el.disabled=true;api('tg/link',{}).then(function(r){window.open(r.url,'_blank','noopener');$('#tgw').innerHTML='<span class="hint">Ждем нажатия Start в боте…</span> <button type="button" class="link" data-a="tgcheck">Проверить</button>';el.disabled=false}).catch(function(e){el.disabled=false;toast(e.status===404||e.status===403?'Бот Orbiq пока не подключен. События остаются в кабинете':e.message,'alert')})},
  tgcheck:function(){api('me').then(function(m){S.me=m;if(m.partner&&m.partner.tg&&m.partner.tg.connected){toast('Telegram подключен');vNotify()}else toast('Пока не подключено. Нужен Start в боте','clock')})},
  tgoff:function(){api('tg/off',{}).then(function(){return api('me')}).then(function(m){S.me=m;toast('Telegram отключен');vNotify()})},
  pinv:inviteSheet2,
  pprod:function(el){productSheet(el.getAttribute('data-p'))},
  prodsug:function(){var s2=sheet('<div class="kick">Карточка продукта</div><h2>Предложить правку</h2><p class="hint">Orbiq проверит и обновит карточку. Можно вставить текст с сайта или переписку</p><textarea class="ta" id="psg" style="min-height:160px"></textarea><div class="row">'+btn('Отправить в Orbiq','pri','id="psgo"','send')+'</div>');$('#psgo',s2).addEventListener('click',function(){var t=$('#psg',s2).value.trim();if(t.length<5){toast('Нужно описание правки','alert');return}api('product/suggest',{text:t}).then(function(){closeSheet();toast('Правка отправлена в Orbiq','send')}).catch(function(e){toast(e.message,'alert')})})},
  pmenu:function(el,e){e.stopPropagation();var open=document.querySelector('.menu-p[data-for="'+el.getAttribute('data-p')+'"]');$$('.menu-p').forEach(function(x){x.remove()});if(!open)partnerMenu(el)},
  prest:function(el){if(!confirm('Вернуть эту версию? Текущая версия тоже останется в истории'))return;var pid=el.getAttribute('data-p');api('partner/restore',{pid:pid,i:+el.getAttribute('data-i')}).then(function(){toast('Версия возвращена');vPartner([pid])}).catch(function(e){toast(e.message,'alert')})},
  preinv:function(el){var pid=el.getAttribute('data-p'),p=(S.partners||[]).find(function(x){return x.id===pid})||{},first=(p.invite||{}).status==='draft';api('partner/reinvite',{pid:pid}).then(function(r){sheet('<div class="kick">'+(first?'Приглашение отправлено':'Новая ссылка')+'</div><h2>Ссылка для партнера</h2>'+linkBox(r.link,(first?'Письмо со ссылкой ушло на '+E(p.email||'почту партнера')+'. ':'Прежняя ссылка больше не работает. ')+'Действует до '+fmtDate(r.expires)));if(location.hash.indexOf('#/partner/')===0)vPartner([pid]);else vPartners()}).catch(function(e){toast(e.message,'alert')})},
  prevoke:function(el){api('partner/revoke',{pid:el.getAttribute('data-p')}).then(function(){toast('Приглашение отозвано');vPartners()})},
  psusp:function(el){var on=el.getAttribute('data-v')==='1';if(on&&!confirm('Приостановить доступ? Все сессии партнера завершатся'))return;api('partner/suspend',{pid:el.getAttribute('data-p'),on:on}).then(function(){toast(on?'Доступ приостановлен':'Доступ возвращен');vPartners()})},
  ppay:function(el){paySheet(el.getAttribute('data-p'),el.getAttribute('data-w'))},
  ifilt:function(el){S.inbox.f=el.getAttribute('data-v');vInbox([])},
  att:function(el){if(DEMO){toast('В демо файлы не скачиваются','info');return}api('rq/att',null,{rid:el.getAttribute('data-r'),id:el.getAttribute('data-id')}).then(function(a){var l=document.createElement('a');l.href=a.dataUrl;l.download=a.name||'file';document.body.appendChild(l);l.click();l.remove()}).catch(function(e){toast(e.message,'alert')})},
  owrite:function(){var c=S.card;var s2=sheet('<div class="kick">От имени Orbiq</div><h2>Написать партнеру</h2><p class="hint">Сообщение придет '+E(c.ownerName||'партнеру')+' в раздел «Обращения». Контакты из текста удаляются.</p><textarea class="ta" id="owt" style="min-height:140px" placeholder="Например: по клиенту «'+E(c.alias)+'» есть предложение"></textarea><div class="row">'+btn('Отправить','pri','id="owgo"','send')+'</div>');
    $('#owgo',s2).addEventListener('click',function(){var t=$('#owt',s2).value.trim();if(!t)return;api('owner/write',{pid:c.partner?c.partner.id:c.owner,cid:c.id,text:t}).then(function(){closeSheet();toast('Отправлено','send')}).catch(function(e){toast(e.message,'alert')})})},
  pfext:function(el){api('pf/extend',{pid:el.getAttribute('data-p')}).then(function(){toast('Выборка расширена');vReviews()}).catch(function(e){toast(e.message,'alert')})},
  nedit:function(el){var id=el.getAttribute('data-n');var n=(S.notes||[]).find(function(x){return x.id===id});var box=el.closest('.note');if(!n||!box||box.querySelector('textarea'))return;
    var nt=box.querySelector('.nt');nt.innerHTML='<textarea class="ta" style="min-height:90px;background:#fff">'+E(n.text)+'</textarea><div class="row" style="margin-top:8px">'+btn('Сохранить','xs dark','data-a="nsave" data-n="'+E(id)+'"','check')+'<button type="button" class="link mute" data-a="ncancel">Отмена</button></div>';nt.querySelector('textarea').focus()},
  nsave:function(el){var box=el.closest('.note');var t=box.querySelector('textarea').value.trim();if(!t){toast('Пустая заметка','alert');return}api('note/edit',{cid:S.card.id,id:el.getAttribute('data-n'),text:t}).then(function(){toast('Заметка изменена');renderTab(S.card,'notes')}).catch(function(e){toast(e.message,'alert')})},
  ncancel:function(){renderTab(S.card,'notes')},
  invrev:function(el){if(!confirm('Отозвать приглашение? Ссылка перестанет работать'))return;api('invite/revoke',{id:el.getAttribute('data-id')}).then(function(){toast('Приглашение отозвано');el.replaceWith(Object.assign(document.createElement('span'),{className:'chip line',textContent:'Отозвано'}))}).catch(function(e){toast(e.status===409?'Ссылку уже активировали или отозвали':e.message,'alert')})},
  clink:function(){var c=S.card;var s2=sheet('<div class="kick">Карточка «'+E(c.alias)+'»</div><h2>Связать с другой карточкой</h2><label class="search" style="max-width:none">'+ic('search')+'<input class="in" id="lkq" placeholder="Поиск по имени"></label><div class="finds" id="lkl" style="max-height:300px"><div class="skel" style="height:120px"></div></div><div class="fld"><label>Кто подтвердил</label><div class="pills" id="lkc"><button type="button" class="on" data-v="client">Клиент подтвердил</button><button type="button" data-v="registration">Сверка при регистрации</button></div></div><p class="hint">Совпадение возраста, интересов и капитала само по себе не основание.</p><div class="row">'+btn('Связать','pri','id="lkgo" disabled','handshake')+'</div>',true);
    var rows=[],pick=null,by='client';
    var draw=function(){var q=norm($('#lkq',s2).value);$('#lkl',s2).innerHTML=rows.filter(function(r){return r.id!==c.id&&(!q||norm(r.alias).indexOf(q)>=0)}).map(function(r){return '<label><input type="radio" name="lk" value="'+E(r.id)+'"'+(pick===r.id?' checked':'')+'><span><b>'+E(r.alias)+'</b> <span class="mu">· '+E(ageL(r.age))+' · '+E(capL(r.capital))+'</span></span><span class="ty">'+E(r.ownerName||'')+'</span></label>'}).join('')||'<p class="hint">Ничего не нашли</p>'};
    api('clients',null,{scope:'all'}).then(function(r){rows=r;draw()}).catch(function(e){$('#lkl',s2).innerHTML=errBox(e)});
    $('#lkq',s2).addEventListener('input',draw);
    $('#lkl',s2).addEventListener('change',function(e){pick=e.target.value;$('#lkgo',s2).disabled=false});
    $('#lkc',s2).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;by=b.getAttribute('data-v');$$('#lkc button',s2).forEach(function(x){x.classList.toggle('on',x===b)})});
    $('#lkgo',s2).addEventListener('click',function(){api('client/link',{cidA:c.id,cidB:pick,confirmedBy:by}).then(function(){closeSheet();toast('Карточки связаны');render()}).catch(function(e){toast(e.message,'alert')})})},
  cprim:function(){var c=S.card;var s2=sheet('<div class="kick">По выбору клиента</div><h2>Основной партнер семьи</h2><div class="finds" id="prl"><div class="skel" style="height:120px"></div></div><p class="hint">Основным может быть только партнер, который ведет карточку этого человека.</p><div class="row">'+btn('Сохранить','pri','id="prgo" disabled','check')+'</div>');
    var pick=null;api('partners').then(function(ps){$('#prl',s2).innerHTML=ps.map(function(p){var mine=p.id===(c.partner&&c.partner.id||c.owner);return '<label><input type="radio" name="pr" value="'+E(p.id)+'"><span><b>'+E(p.name)+'</b></span><span class="ty">'+(mine?'ведет эту карточку':'')+'</span></label>'}).join('')}).catch(function(e){$('#prl',s2).innerHTML=errBox(e)});
    $('#prl',s2).addEventListener('change',function(e){pick=e.target.value;$('#prgo',s2).disabled=false});
    $('#prgo',s2).addEventListener('click',function(){var b={pid:pick};if(c.linkId)b.linkId=c.linkId;else b.cid=c.id;api('client/primary',b).then(function(){closeSheet();toast('Основной партнер сохранен');render()}).catch(function(e){toast(e.message,'alert')})})},
  catnew:function(){catalogSheet(null)},
  catedit:function(el){catalogSheet((S.catalog||[]).find(function(x){return x.id===el.getAttribute('data-id')}))},
  catdel:function(el){if(!confirm('Удалить из каталога?'))return;api('catalog/del',{id:el.getAttribute('data-id')}).then(function(){toast('Удалено');vCatalog()}).catch(function(e){toast(e.message,'alert')})},
  catf:function(el){S.catF=el.getAttribute('data-v');S.catN=40;vCatalog()},
  catmore:function(){var y=scrollY;S.catN=(S.catN||40)+40;vCatalog();setTimeout(function(){scrollTo(0,y)},400)},
  ckind:function(el){var P=S.pending[S.card.id];P.cells[+el.getAttribute('data-k')].kind=el.getAttribute('data-v');$$('.kind button',el.parentNode.parentNode).forEach(function(b){b.classList.toggle('on',b===el)});mountRing(previewCells(S.card,P),false)},
  cst:function(el){var P=S.pending[S.card.id];if(P.keep)P.keep();P.cells[+el.getAttribute('data-k')].st=el.getAttribute('data-v');var y=scrollY;drawCheck(S.card,P);setTimeout(function(){scrollTo(0,y)},60)},
  cmore:function(){var t=$('#more').value.trim();if(t.length<5){toast('Нужна еще пара фактов','alert');return}stopRec();var P=S.pending[S.card.id];if(P.keep)P.keep();P.appendMode=true;scrubStage(S.card.id,t,P.source)},
  cconfirm:function(el){confirmCheck(el)},
  leadf:function(el){S.leadF=el.getAttribute('data-v');vFit()},
  getlead:function(el){getLeadSheet(el.getAttribute('data-c'))},
  pick:function(el){var c=el.getAttribute('data-c');var a=picks();var i=a.indexOf(c);var on=i<0;if(!on)a.splice(i,1);else{if(a.length>=3){hintAt(el,'<b>В списке уже 3 лида</b>Для нового лида нужно убрать одного из списка');return}a.push(c)}setPicks(a);
    var art=el.closest('.je');if(art){art.classList.toggle('picked',on);var l=$('.je-l',art);var pkb=$('.je-pk',art);if(on&&!pkb&&l)l.insertAdjacentHTML('beforeend','<span class="je-pk">'+ic('check')+'Выбран</span>');if(!on&&pkb)pkb.remove()}
    el.classList.toggle('on',on);el.innerHTML=ic(on?'check':'plus')+'<span>'+(on?'В списке':'Выбрать лид')+'</span>';
    var jp=$('#jpath');if(jp)jp.outerHTML=pathHtml();
    hintAt(el,on?'<b>Лид в списке: '+a.length+' из 3</b>Следующий шаг: кнопка «Связаться с клиентом». Мы покажем, как открыть связь':'<b>Лид убран из списка</b>Можно выбрать до 3 лидов')},
  ltour:function(){leadTour(true)},
  leaddoc:function(el){var r=(S.leads||[]).find(function(x){return x.cid===el.getAttribute('data-c')})||{};var D=(r.reqBrief||{}).doc;if(!D)return;
    sheet('<div class="kick">Документ от партнера · '+E(r.alias||'')+'</div><h2>'+E(D.name)+'</h2><p class="hint">Партнер обезличил документ: имен, контактов и названий компаний в нем нет</p><div class="jdoc">'+(D.sections||[]).map(function(x){return '<section><h4>'+E(x[0])+'</h4><p>'+E(x[1])+'</p></section>'}).join('')+'</div>',true)},
  'upgrade-info':function(){upgradeSheet()},
  bulk:function(){bulkSheet()},
  leavefocus:function(){leaveFocus();vFit()},
  upgrade:function(el){if(localStorage.getItem('oc_upg')){toast('Заявка уже у Orbiq. Ответим в Telegram в течение дня');return}el.disabled=true;api('product/suggest',{text:'ЗАЯВКА НА СТАТУС «Партнер Orbiq» ($20 000 за 2 года): хочу связаться с лидами сети'}).then(function(){localStorage.setItem('oc_upg','1');closeSheet();toast('Заявка у Orbiq. Ответим в Telegram в течение дня')}).catch(function(e){el.disabled=false;toast(e.message,'alert')})},
  cpy:function(){},
  howto:function(){if((location.hash||'#/fit')==='#/fit'&&$('.je'))leadTour(true);else go('#/help')},
  gate:function(){getLeadSheet('')},
  pkfill:function(){var r=S.rq;var parts=[];if($('[data-pk="offer"]:checked'))parts.push('Для клиента «'+r.alias+'» есть предложение: '+r.offer);if($('[data-pk="terms"]:checked'))parts.push('Условия: '+r.terms);if($('[data-pk="att"]:checked'))parts.push('Во вложении: '+r.attachment.name);parts.push('Есть ли интерес обсудить с клиентом?');var ta=$('form.comp[data-to="cardOwner"] textarea');ta.value=parts.join('\n');ta.style.height='auto';ta.style.height=Math.min(220,ta.scrollHeight+4)+'px';ta.dispatchEvent(new Event('input'));ta.focus()},
  pffin:function(el){var pid=el.getAttribute('data-p'),v=el.getAttribute('data-v');var r=$('[data-fr="'+pid+'"]').value.trim();if(!r){toast('Нужно основание решения','alert');return}api('pf/final',{pid:pid,decision:v,reason:r}).then(function(){toast('Решение отправлено партнеру');vReviews()}).catch(function(e){toast(e.message,'alert')})}
};
document.addEventListener('click',function(e){
  if(!e.target.closest('.menu')&&!e.target.closest('.menu-p'))$$('.menu-p').forEach(function(x){x.remove()});
  var el=e.target.closest('[data-a]');if(!el)return;var f=A[el.getAttribute('data-a')];if(!f)return;
  if(el.tagName==='A'&&el.getAttribute('data-a')==='sclose'){closeSheet();return}
  if(el.tagName==='BUTTON'&&el.type==='submit'&&!f)return;
  f(el,e);
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet()});
/* Магнит и подсветка под курсором */
if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.addEventListener('pointermove',function(e){
    var s=e.target.closest&&e.target.closest('.spot');if(s){var q=s.getBoundingClientRect();s.style.setProperty('--x',(e.clientX-q.left)+'px');s.style.setProperty('--y',(e.clientY-q.top)+'px')}
  },{passive:true});
}
window.addEventListener('resize',function(){segs()});


/* ================= Ввод «все, что знаете»: текст, файл, голос ================= */
var KQ=[
 ['b1','Возраст и семья',/(\d{2}\s*(лет|год)|возраст).*?(жена|супруг|муж|дет|сын|доч|внук)|(жена|супруг|муж|дет|сын|доч|внук).*?(\d{2}\s*(лет|год)|возраст)/is],
 ['b2','Капитал и откуда оценка',/(млн|млрд|капитал|состояни|\$\s*\d)/i],
 ['b3','На чем заработал: отрасль, масштаб, роль',/заработ|бизнес|компани|отрасл|завод|девелоп|строит|логист|торгов|продал|владеет|основал|совладел/i],
 ['b4','Интересы с конкретикой',/увлека|любит|хобби|интерес|коллекц|яхт|гольф|часы|искусств|охот|вино|опер/i],
 ['b5','Запрос или потребность',/хочет|планир|ищет|нужн|просил|собирается|думает/i],
 ['b6','Сколько лет знакомы и был ли он клиентом',/знаком|знаем|работаем с|лет \d|\d+ лет|клиент|покупал у|платил/i]
];
var PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',PDFW='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',MAMMOTH='https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
function loadScript(src){return new Promise(function(res,rej){if(document.querySelector('script[src="'+src+'"]')&&(window.pdfjsLib||window.mammoth))return res();var s=document.createElement('script');s.src=src;s.onload=function(){res()};s.onerror=function(){rej(new Error('Не загрузилась библиотека для чтения файла. Текст можно скопировать вручную'))};document.head.appendChild(s)})}
function readAnyFile(f){
  var n=(f.name||'').toLowerCase();if(f.size>15*1024*1024)return Promise.reject(new Error('Файл больше 15 МБ'));
  if(/\.(txt|md|markdown|csv)$/.test(n)||/^text\//.test(f.type))return f.text();
  if(/\.pdf$/.test(n)||f.type==='application/pdf')return loadScript(PDFJS).then(function(){window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFW;return f.arrayBuffer()}).then(function(buf){return window.pdfjsLib.getDocument({data:buf}).promise}).then(function(doc){var ps=[];for(var i=1;i<=Math.min(doc.numPages,60);i++)ps.push(doc.getPage(i).then(function(p){return p.getTextContent()}).then(function(t){return t.items.map(function(x){return x.str}).join(' ')}));return Promise.all(ps)}).then(function(a){return a.join('\n\n')});
  if(/\.docx$/.test(n))return loadScript(MAMMOTH).then(function(){return f.arrayBuffer()}).then(function(buf){return window.mammoth.extractRawText({arrayBuffer:buf})}).then(function(r){return r.value});
  return Promise.reject(new Error('Подходят .txt, .md, .pdf и .docx'));
}
function composer(o){
  o=o||{};var prompts=o.prompts||KQ.map(function(k){return [k[0],k[1]]});
  return '<div class="cmp" id="cmp"><div class="kq"><span class="lbl">Текст ответит на вопросы</span><ol>'+prompts.map(function(k,i){return '<li data-kq="'+E(k[0])+'"><i>'+ic('check')+'</i>'+E(k[1])+'</li>'}).join('')+'</ol></div>'+
   '<div class="cmp-box"><textarea class="ta bigta" id="ctx" placeholder="'+E(o.ph||'Переписка, заметки по сделкам, что угодно. Фамилию, телефоны и название компании можно не убирать: перед отправкой мы подсветим их и скроем')+'"></textarea>'+
   '<div class="cmp-bar"><label class="btn sm soft">'+ic('upload')+'<span>Загрузить файл</span><input type="file" id="cfile" accept=".txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden></label>'+
   (SR?'<button type="button" class="btn sm soft" id="cmic">'+ic('mic')+'<span id="cmict">Диктовать</span></button>':'<span class="hint" style="display:inline-flex;gap:6px;align-items:center">'+ic('mic')+'Для голоса есть микрофон на клавиатуре</span>')+
   (DEMO?'<button type="button" class="link mute" id="csample">Вставить пример</button>':'')+'<span class="grow"></span><span class="kick" id="clen">0 знаков</span></div></div>'+
   '<p class="hint" style="margin-top:8px">Файл читается на устройстве. На сервер уходит только текст после проверки. Аудио не хранится.</p></div>';
}
var SAMPLES=['Переписка в WhatsApp, октябрь:\n— Добрый вечер! Спасибо за часы, жена в восторге, носит каждый день.\n— Рад! Как съездили в Дубай?\n— Отлично, но жарко. Думаем на лето взять дом в Испании, ближе к хорошей школе для младшего.\n\nМои заметки: Андрей Ковалев, 58 лет, Казань. Заработал на строительстве в 2000-х, сейчас девелопмент жилых кварталов, доля в компании «Камастрой» (по открытой отчетности оценка доли около $15 млн). Двое детей: сыну 14, дочь 19 учится в Лондоне. Жена Ольга. Увлекается яхтингом и независимыми часовщиками, купил у меня два раза. Хочет второе гражданство для семьи до весны. Просил не звать на шумные мероприятия. Удобнее голосом вечером, +7 917 555-12-34. Знакомы с 2019 года, последний раз виделись в октябре на примерке.',
 'Заметки после встречи (ноябрь): Марина, около 46 лет, живет в Москве, летом на Сардинии. Собственный бизнес в фармдистрибуции, продала долю в 2023 году, свободный капитал по ее словам больше $30 млн. Активно инвестирует, интересуется pre-IPO. Трое детей, старшая дочь выбирает университет в Швейцарии. Любит оперу и современное искусство, коллекционирует графику. Ищет виллу на побережье Италии и хочет заказать семейный портрет к юбилею мужа в марте. Познакомились через общих друзей в 2021, общаемся раз в месяц. Почта marina.s@example.com'];
function bindComposer(root,onChange){
  var t=$('#ctx',root),len=$('#clen',root);
  var upd=function(){var v=t.value;len.textContent=v.length.toLocaleString('ru-RU')+' знаков';$$('[data-kq]',root).forEach(function(li){var k=KQ.find(function(x){return x[0]===li.getAttribute('data-kq')});li.classList.toggle('ok',!!(k&&k[2].test(v)))});if(onChange)onChange(v)};
  t.addEventListener('input',upd);
  $('#cfile',root).addEventListener('change',function(){var f=this.files[0];this.value='';if(!f)return;var lb=this.parentNode;lb.classList.add('busy');
    readAnyFile(f).then(function(txt){txt=String(txt||'').trim();if(!txt){toast('В файле нет текста','alert');return}t.value=(t.value.trim()?t.value.trim()+'\n\n':'')+txt;upd();toast('Файл прочитан на устройстве','file')}).catch(function(e){toast(e.message,'alert')}).then(function(){lb.classList.remove('busy')})});
  var sm=$('#csample',root);if(sm)sm.addEventListener('click',function(){t.value=SAMPLES[(S._smp=(S._smp||0)+1)%2];upd()});
  var mic=$('#cmic',root);if(mic)mic.addEventListener('click',function(){micToggle(t,mic,upd)});
  upd();return {get:function(){return t.value},set:function(v){t.value=v;upd()}};
}
function micToggle(t,btnEl,upd){
  var lab=btnEl.querySelector('span');
  if(REC){stopRec();btnEl.classList.remove('rec');lab.textContent='Продолжить';return}
  var go2=function(){var r=new SR();r.lang='ru-RU';r.continuous=true;r.interimResults=true;var base=t.value?t.value.replace(/\s*$/,' '):'';
    r.onresult=function(ev){var fin='',tmp='';for(var i=0;i<ev.results.length;i++){var x=ev.results[i];if(x.isFinal)fin+=x[0].transcript;else tmp+=x[0].transcript}t.value=base+fin+tmp;upd()};
    r.onerror=function(ev){if(ev.error==='not-allowed'||ev.error==='service-not-allowed')toast('Микрофон недоступен. Текст можно набрать или вставить','alert');btnEl.classList.remove('rec');lab.textContent='Диктовать';REC=null};
    r.onend=function(){if(REC===r&&!r._stop){try{r.start()}catch(e){}}};
    try{r.start();REC=r;btnEl.classList.add('rec');lab.textContent='Пауза'}catch(e){toast('Не получилось включить микрофон','alert')}};
  if(localStorage.getItem('oc_sr_ok')==='1')return go2();
  var s=sheet('<div class="kick">Голосовой ввод</div><h2>Включить диктовку?</h2><div class="warnb">'+ic('alert')+'<span>Встроенная диктовка браузера может отправлять звук на сервер распознавания Google или Apple. Orbiq звук не получает и не хранит.</span></div><p class="hint">Своими словами. Название компании можно заменить отраслью.</p><div class="row">'+btn('Включить','pri','id="srgo"','mic')+'<button type="button" class="link mute" data-a="sclose">Не сейчас</button></div>');
  $('#srgo',s).addEventListener('click',function(){localStorage.setItem('oc_sr_ok','1');closeSheet();go2()});
}

/* Разбор ответа сервера в единую форму проверки */
function setPending(cid,r,source,base){
  var pr=r.proposals;var cells=Array.isArray(pr)?pr:((pr||{}).cells||r.cells||[]);
  var fields=r.fields||(pr&&!Array.isArray(pr)?pr.fields:null)||{};var reqs=r.requests||(pr&&!Array.isArray(pr)?pr.requests:null)||[];
  var P=base||{fields:{},requests:[],cells:[],missing:[],contradictions:[],source:source,isNew:false};
  Object.keys(fields).forEach(function(k){var v=fields[k];if(v==null||v===''||(Array.isArray(v)&&!v.length))return;if(k==='interests'){P.fields.interests=(P.fields.interests||[]).concat(v).filter(function(x,i,a){return a.map(norm).indexOf(norm(x))===i})}else if(k==='relation'&&typeof v==='object'){P.fields.relation=Object.assign({},P.fields.relation||{},v)}else P.fields[k]=v});
  reqs.forEach(function(q){if(!q||!q.cat)return;if(P.requests.some(function(x){return x.cat===q.cat&&norm(x.text)===norm(q.text)}))return;P.requests.push({cat:q.cat,text:q.text||'',on:true})});
  cells.forEach(function(c){if(!c||!c.cell)return;var cf=c.conflict&&typeof c.conflict==='object'?c.conflict.current:c.conflict;var ex=P.cells.find(function(x){return x.cell===c.cell});if(ex){ex.value=c.value;ex.kind=c.kind;return}P.cells.push({k:P.cells.length,cell:c.cell,value:c.value,kind:c.kind,conflict:cf,st:'ok'})});
  var nm=(r.missing||[]).map(function(m){return typeof m==='string'?m:(m.q||m.text||m.label||m.key||'')}).filter(Boolean);P.missing=base&&base.missing&&base.missing.length?nm.filter(function(x){return base.missing.indexOf(x)>=0}):nm;
  P.contradictions=(P.contradictions||[]).concat((r.contradictions||[]).map(function(x){return typeof x==='string'?x:(x.q||cellQ(x.cell))+': '+(x.values||[]).join(' / ')+(x.note?' · '+x.note:'')}));
  S.pending[cid]=P;return P;
}

/* ================= Новая карточка: одно поле ================= */
function vNew2(){
  page('clients','<a class="back" href="'+LH()+'">'+ic('al')+LHN()+'</a>'+hd('Новая карточка','Добавить клиента')+
  '<div class="newc"><form class="card bigf rv" id="nf" novalidate style="gap:16px"><div class="row" style="align-items:flex-end;gap:14px"><div class="fld" style="flex:0 1 320px"><label for="na">Имя или псевдоним</label><input class="in" id="na" maxlength="40" autocomplete="off" placeholder="Например, Андрей" style="font-size:18px;font-weight:600"></div><p class="hint" style="flex:1 1 220px;margin:0 0 12px">Без фамилии. Имя должно быть уникальным в CRM</p></div><p class="err" id="nerr" hidden></p>'+
  '<div class="fld"><label for="ctx">Все, что известно о человеке</label>'+composer()+'</div>'+
  '<div class="row">'+btn('Собрать карточку','pri mag','type="submit"','spark')+'<span class="hint" id="nfh">Можно начать и без текста: создадим пустую карточку</span></div></form>'+
  '<div class="split rv" style="--i:2;align-self:start"><div class="y"><span class="kick" style="color:var(--acc)">Остается у партнера</span><h3>Фамилия, контакты, компания</h3><ul><li>'+ic('lock')+'Полное имя</li><li>'+ic('lock')+'Телефон и почта</li><li>'+ic('lock')+'Название бизнеса</li></ul></div><div class="n"><span class="kick">Попадает в CRM</span><h3>Псевдоним и суть</h3><ul><li>'+ic('check')+'Возраст диапазоном</li><li>'+ic('check')+'Капитал диапазоном</li><li>'+ic('check')+'Интересы и запросы</li></ul></div></div></div>',function(m){
    var f=$('#nf',m),inp=$('#na',m),er=$('#nerr',m);
    var cm=bindComposer(m,function(v){$('#nfh',m).textContent=v.trim()?'Перед отправкой покажем текст и скроем контакты':'Можно начать и без текста: создадим пустую карточку'});
    var bad=function(msg){er.hidden=false;er.innerHTML=ic('alert')+E(msg);inp.classList.remove('bad');void inp.offsetWidth;inp.classList.add('bad');inp.focus()};
    inp.addEventListener('input',function(){er.hidden=true;inp.classList.remove('bad')});
    f.addEventListener('submit',function(e){e.preventDefault();stopRec();var a=cleanAlias(inp.value);if(!a)return bad('Нужно имя или псевдоним');var txt=cm.get().trim();var b=f.querySelector('button[type=submit]');
      if(!txt){b.disabled=true;api('client/create',{alias:a}).then(function(c){toast('Карточка «'+c.alias+'» создана');S.selSec=null;go('#/c/'+c.id)}).catch(function(e2){b.disabled=false;bad(e2.message)});return}
      scrubStage(null,txt,'paste',function(clean){return intake(a,clean).catch(function(e2){if(e2.status===409||e2.status===400){closeSheet();bad(e2.message);e2.handled=true}throw e2})});
    });
    if(matchMedia('(hover:hover)').matches)inp.focus();
  });
}
function intake(alias,text){
  return api('client/intake',{alias:alias,text:text}).catch(function(e){
    if(e.status!==403&&e.status!==404||/имя|занят/i.test(e.message))throw e;
    return api('client/create',{alias:alias}).then(function(c){return api('client/extract',{id:c.id,text:text,source:'md'}).then(function(r){r.card=c;return r})});
  }).then(function(r){var c=r.card||{};S.card=c;var P=setPending(c.id,r,'md',{fields:{},requests:[],cells:[],missing:[],contradictions:[],source:'md',isNew:true});closeSheet();go('#/c/'+c.id+'/review');return P});
}

/* ================= Дополнить существующую карточку ================= */
function vAdd(id){
  loading('clients');
  api('client/get',null,{id:id}).then(function(c){if(!c.mine){go('#/c/'+id);return}S.card=c;
    var empty=[];SECTORS.forEach(function(s){s.q.forEach(function(q){var x=(c.cells||{})[s.id+'.'+q[0]];if(!x||(x.kind!=='fact'&&x.kind!=='na'))empty.push([s.id+'.'+q[0],q[1]])})});
    page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+hd('Дополнить · '+E(c.alias),'Что еще известно')+
    '<div class="cgrid"><div class="lft" id="ringw-slot"></div><div class="card rv stack" style="--i:2">'+composer({prompts:empty.slice(0,7),ph:'Переписка, заметки после встречи, ответы на вопросы слева. Контакты скроем перед отправкой'})+
    '<div class="row">'+btn('Разобрать текст','pri mag','id="addgo"','spark')+'<a class="link mute" href="#/c/'+E(id)+'">Отмена</a></div></div></div>',function(m){
      mountRing(c,false);
      var cm=bindComposer(m,function(v){sessionStorage.setItem('oc_d_'+id,v)});var sv=sessionStorage.getItem('oc_d_'+id);if(sv)cm.set(sv);
      $('#addgo',m).addEventListener('click',function(){stopRec();var t=cm.get().trim();if(t.length<10){toast('Нужна хотя бы пара фактов','alert');return}scrubStage(id,t,'dict')});
    });
  }).catch(function(e){page('clients',errBox(e))});
}

/* ================= Проверьте карточку ================= */
function vCheck(id){
  var P=S.pending[id];if(!P){go('#/c/'+id);return}
  loading('clients');
  api('client/get',null,{id:id}).then(function(c){S.card=c;drawCheck(c,P)}).catch(function(e){page('clients',errBox(e))});
}
function previewCells(c,P){var cells=Object.assign({},c.cells||{});P.cells.forEach(function(p){if(p.st==='ok')cells[p.cell]={v:p.value,kind:p.kind}});var a=P.fields.age||c.age;if(a&&!cells['about.age'])cells['about.age']={v:a,kind:'fact'};var F=P.fields,o={cells:cells,_preview:true};
  ['age','capital','capitalBasis','kids','investing'].forEach(function(k){if(F[k]!=null&&F[k]!=='')o[k]=F[k]});if(F.interests&&F.interests.length)o.interests=(c.interests||[]).concat(F.interests);
  o.relation=Object.assign({},c.relation||{},F.relation||{});var nr=P.requests.filter(function(q){return q.on&&q.text});o.requests=(c.requests||[]).concat(nr.map(function(q){return {cat:q.cat,text:q.text,status:'open'}}));return Object.assign({},c,o)}
function drawCheck(c,P){
  var F=P.fields,val=function(k){return F[k]!=null&&F[k]!==''?F[k]:c[k]};
  var mark=function(k){return F[k]!=null&&F[k]!==''&&!(Array.isArray(F[k])&&!F[k].length)?' <i class="fromtxt" title="Из текста"></i>':''};
  var rel=Object.assign({},c.relation||{},F.relation||{});
  var ints=(c.interests||[]).concat(F.interests||[]).filter(function(x,i,a){return a.map(norm).indexOf(norm(x))===i});
  var okN=P.cells.filter(function(p){return p.st==='ok'}).length;
  var cellsHtml=SECTORS.map(function(s){var l=P.cells.filter(function(p){return p.cell.indexOf(s.id+'.')===0});if(!l.length)return '';
    return '<div class="sh"><i style="background:'+s.hex+'"></i>'+E(s.name)+'</div>'+l.map(function(p){return '<div class="prop '+(p.st==='ok'?'ok':p.st==='del'?'del':'')+'" data-k="'+p.k+'"><span class="q">'+E(cellQ(p.cell))+'</span><input class="in" data-pv="'+p.k+'" value="'+E(p.value)+'" '+(p.st==='del'?'disabled':'')+'><div class="ctl"><div class="kind">'+Object.keys(KIND).map(function(k){return '<button type="button" class="'+(p.kind===k?'on':'')+'" data-a="ckind" data-k="'+p.k+'" data-v="'+k+'">'+KIND[k]+'</button>'}).join('')+'</div>'+(p.st==='del'?'<button type="button" class="link" data-a="cst" data-k="'+p.k+'" data-v="ok">Вернуть</button>':'<button type="button" class="ibtn" data-a="cst" data-k="'+p.k+'" data-v="del" aria-label="Убрать">'+ic('x')+'</button>')+'</div>'+(p.conflict?'<div class="cf">Сейчас в карточке: «'+E(p.conflict)+'». Новое останется, если его не убрать</div>':'')+'</div>'}).join('')}).join('');
  var rr=ready6(previewCells(c,P));var miss=P.missing.length?P.missing:BLOCKS.filter(function(b){return !rr.ok[b[0]]}).map(function(b){return b[2]});
  var html='<a class="back" href="#/c/'+E(c.id)+'">'+ic('al')+E(c.alias)+'</a>'+hd((P.isNew?'Новая карточка':'Дополнение')+' · '+E(c.alias),'Проверка карточки')+
  '<div class="cgrid chkg"><div class="lft"><div id="ringw-slot"></div>'+
   '<div class="card dk rv miss" style="--i:2;display:flex;flex-direction:column;gap:12px"><span class="kick" style="color:var(--acc)">Чего не хватает</span>'+(miss.length?'<ul class="missl">'+miss.map(function(m){return '<li>'+ic('info')+E(m)+'</li>'}).join('')+'</ul>':'<p style="margin:0;color:#fff">Основное есть. Можно подтверждать</p>')+
   '<textarea class="ta" id="more" placeholder="Дописать сюда или надиктовать" style="min-height:90px;background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.16);color:#fff"></textarea><div class="row">'+(SR?'<button type="button" class="btn sm" id="moremic" style="background:rgba(255,255,255,.1);color:#fff">'+ic('mic')+'<span>Диктовать</span></button>':'')+btn('Добавить к разбору','sm','data-a="cmore" style="background:#fff;color:#111"','plus')+'</div></div></div>'+
  '<div class="stack lg">'+(P.contradictions.length?'<div class="warnb">'+ic('alert')+'<div><b>Противоречия</b><ul style="margin:6px 0 0;padding-left:18px">'+P.contradictions.map(function(x){return '<li>'+E(x)+'</li>'}).join('')+'</ul></div></div>':'')+
   '<section class="card rv"><div class="row" style="justify-content:space-between;margin-bottom:14px"><h2>Карточка</h2><span class="kick"><i class="fromtxt"></i> из текста</span></div><div class="kv">'+
    '<span class="lbl">Имя</span><input class="in" id="cal" value="'+E(c.alias)+'" maxlength="40" style="max-width:320px">'+
    '<span class="lbl">Возраст'+mark('age')+'</span>'+pillGroup('age',AGES.map(function(a){return [a,ageL(a)]}),val('age'))+
    '<span class="lbl">Капитал'+mark('capital')+'</span>'+pillGroup('capital',CAPS.map(function(a){return [a,capL(a)]}),val('capital'))+
    '<span class="lbl">Откуда оценка'+mark('capitalBasis')+'</span><input class="in" id="ccb" value="'+E(val('capitalBasis')||'')+'" placeholder="Источник, период, чья доля">'+
    '<span class="lbl">Дети'+mark('kids')+'</span><div class="row"><input class="in" id="ckids" type="number" min="0" max="20" value="'+E(val('kids')==null?'':val('kids'))+'" style="max-width:100px"></div>'+
    '<span class="lbl">Инвестирует'+mark('investing')+'</span>'+pillGroup('investing',Object.keys(INV).map(function(k){return [k,INV[k]]}),val('investing'))+
    '<span class="lbl">Интересы'+mark('interests')+'</span><input class="in" id="cints" value="'+E(ints.join(', '))+'" placeholder="Через запятую">'+
    '<span class="lbl">Как знакомы'+(F.relation?' <i class="fromtxt"></i>':'')+'</span><div class="grid3" style="gap:8px"><input class="in" id="cr1" value="'+E(rel.role||'')+'" placeholder="В какой роли"><input class="in" id="cr2" type="month" value="'+E(rel.lastContact||'')+'"><input class="in" id="cr3" value="'+E(rel.topic||'')+'" placeholder="Что обсуждали"></div>'+
    '<span class="lbl">Лет знакомы'+(F.relation&&F.relation.years!=null?' <i class="fromtxt"></i>':'')+'</span><input class="in" id="cr4" type="number" min="0" max="80" value="'+E(rel.years==null?'':rel.years)+'" placeholder="Например, 8" style="max-width:140px">'+
    '<span class="lbl">Платил деньги партнеру'+(F.relation&&F.relation.isClient?' <i class="fromtxt"></i>':'')+'</span>'+pillGroup('isClient',Object.keys(ISCL).map(function(k){return [k,ISCL[k]]}),rel.isClient||'')+
   '</div></section>'+
   '<section class="card rv" style="--i:1"><div class="row" style="justify-content:space-between;margin-bottom:12px"><h2>Запросы</h2><span class="hint">Партнеры увидят их после подтверждения формулировки</span></div><div class="stack" id="creqs">'+
    (P.requests.length?P.requests.map(function(q,i){return '<div class="req'+(q.on?'':' closed')+'"><div class="rh"><label class="chk"><input type="checkbox" data-rq="'+i+'" '+(q.on?'checked':'')+'><span>Добавить</span></label><span class="fsel">'+sel('cat',catOpts(),q.cat,null,'data-rqc="'+i+'"')+'</span></div><input class="in" data-rqt="'+i+'" value="'+E(q.text)+'"></div>'}).join(''):'<p class="hint">В тексте запросов не нашли. Добавить можно в карточке</p>')+'</div></section>'+
   (P.cells.length?'<section class="rvw rv" style="--i:2"><div class="row" style="justify-content:space-between"><h2 class="sec-h">Круг 360°: факты из текста</h2><span class="kick">'+okN+' из '+P.cells.length+'</span></div>'+cellsHtml+'</section>':'')+
   '<div class="sbar"><span>Сохранится только то, что видно на этом экране</span>'+btn('Подтвердить','pri','data-a="cconfirm"','check')+'</div>'+
  '</div></div>';
  page('clients',html,function(m){
    mountRing(previewCells(c,P),true);
    $$('.pills[data-k]',m).forEach(function(g){g.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var k=g.getAttribute('data-k'),v=b.getAttribute('data-v');var on=b.classList.contains('on');$$('button',g).forEach(function(x){x.classList.remove('on')});if(!on)b.classList.add('on');if(k==='isClient'){keep()}else F[k]=on?'':v;mountRing(previewCells(c,P),false)})});
    $$('[data-a="setf"]',m).forEach(function(x){x.removeAttribute('data-a')});
    $$('[data-pv]',m).forEach(function(i){i.addEventListener('input',function(){P.cells[+i.getAttribute('data-pv')].value=i.value})});
    $$('[data-rq]',m).forEach(function(i){i.addEventListener('change',function(){var q=P.requests[+i.getAttribute('data-rq')];q.on=i.checked;i.closest('.req').classList.toggle('closed',!q.on)})});
    $$('[data-rqc]',m).forEach(function(i){i.addEventListener('change',function(){P.requests[+i.getAttribute('data-rqc')].cat=i.value})});
    $$('[data-rqt]',m).forEach(function(i){i.addEventListener('input',function(){P.requests[+i.getAttribute('data-rqt')].text=i.value})});
    var keep=function(){F.capitalBasis=$('#ccb').value.trim();var k=$('#ckids').value;F.kids=k===''?'':+k;F.interests=$('#cints').value.split(',').map(function(x){return x.trim()}).filter(Boolean);var yy=$('#cr4').value;var icl=$('.pills[data-k="isClient"] button.on');F.relation={role:$('#cr1').value.trim(),lastContact:$('#cr2').value,topic:$('#cr3').value.trim(),years:yy===''?null:+yy,isClient:icl?icl.getAttribute('data-v'):''};P.alias=cleanAlias($('#cal').value)};
    $$('#ccb,#ckids,#cints,#cr1,#cr2,#cr3,#cr4,#cal',m).forEach(function(i){i.addEventListener('change',function(){keep();mountRing(previewCells(c,P),false)})});P.keep=keep;
    var mm=$('#moremic',m);if(mm)mm.addEventListener('click',function(){micToggle($('#more',m),mm,function(){})});
  });
}
function confirmCheck(el){
  var c=S.card,P=S.pending[c.id];if(P.keep)P.keep();var F=P.fields;el.disabled=true;
  var patch={};if(P.alias&&P.alias!==c.alias)patch.alias=P.alias;
  ['age','capital','investing','capitalBasis'].forEach(function(k){if(F[k]!=null&&F[k]!==c[k])patch[k]=F[k]});
  if(F.kids!=null&&F.kids!==''&&F.kids!==c.kids)patch.kids=F.kids;
  if(F.interests&&JSON.stringify(F.interests)!==JSON.stringify(c.interests||[]))patch.interests=F.interests;
  if(F.relation&&(F.relation.role||F.relation.lastContact||F.relation.topic||F.relation.years!=null||F.relation.isClient))patch.relation=Object.assign({},c.relation||{},F.relation);
  var nr=P.requests.filter(function(q){return q.on&&q.cat&&q.text.trim()});
  if(nr.length)patch.requests=(c.requests||[]).concat(nr.map(function(q){return {id:uid('r'),cat:q.cat,text:q.text.trim(),status:'open',at:nowISO(),public:true}}));
  if(F.age&&!P.cells.some(function(p){return p.cell==='about.age'}))patch.cells={'about.age':{v:F.age,kind:'fact'}};
  var items=P.cells.filter(function(p){return p.st==='ok'&&String(p.value).trim()}).map(function(p){return {cell:p.cell,value:p.value,kind:p.kind}});
  var before=circle(c.cells).pct;var changed=[];
  var step1=Object.keys(patch).length?api('client/update',{id:c.id,patch:patch}).then(function(){if(patch.requests)changed.push(nr.length===1?'Добавлен запрос':'Добавлено запросов: '+nr.length);if(patch.interests)changed.push('Обновлены интересы');if(patch.age||patch.capital)changed.push('Заполнены возраст и капитал')}):Promise.resolve();
  step1.then(function(){return items.length?api('client/apply',{id:c.id,items:items,source:P.source==='dict'?'dict':'md'}).then(function(r){changed=changed.concat(r.changed||[])}):null})
  .then(function(){delete S.pending[c.id];sessionStorage.removeItem('oc_d_'+c.id);return api('client/get',null,{id:c.id})})
  .then(function(n){S.card=n;S.prevPct[n.id]=before||0;showDone(n,changed.length?changed:['Карточка сохранена'])})
  .catch(function(e){el.disabled=false;toast(e.message||'Не сохранилось. Можно повторить','alert')});
}
function showDone(c,changed){
  page('clients','<a class="back" href="#/c/'+E(c.id)+'">'+ic('al')+E(c.alias)+'</a><div class="cgrid"><div class="lft" id="ringw-slot"></div><div class="stack lg"><div><div class="kick">Сохранено</div><h1 style="font-family:var(--s);font-stretch:112%;font-weight:600;font-size:clamp(36px,4vw,56px);line-height:1;letter-spacing:-.02em;margin-top:8px"><span class="mask"><span>Карточка собрана</span></span></h1></div><ul class="chg" style="list-style:none;padding:0;margin:0">'+changed.filter(function(x,i,a){return a.indexOf(x)===i}).map(function(x,i){return '<li class="rv row" style="--i:'+(i+2)+'"><span class="tchk on">'+ic('check')+'</span>'+E(x)+'</li>'}).join('')+'</ul><div class="row">'+btn('Посмотреть подборку','pri mag','data-a="go" data-h="#/c/'+E(c.id)+'/match"','spark')+'<a class="btn sec" href="#/c/'+E(c.id)+'">К карточке</a><a class="btn soft" href="#/c/'+E(c.id)+'/add">'+ic('plus')+'Дополнить еще</a></div></div></div>',function(){mountRing(c,true)});
}

/* ================= Онбординг: короткий ролик ================= */
var OB_SCENES=[
 {t:6,sub:'Поздравляем с входом в '+CAB.name+'. Это обезличенная CRM, бесплатная в работе'},
 {t:9,sub:'Партнер вставляет все, что знает о клиенте → система сама собирает карточку из 6 блоков'},
 {t:7,sub:'Контакты, фамилия и компания остаются у партнера'},
 {t:9,sub:'Клиенты остаются за партнером. Другие партнеры видят их обезличенно'},
 {t:9,sub:'Продукт партнера в сети и подборка клиентов под него с потенциалом в год'},
 {t:8,sub:'50 готовых карточек → статус «Базовый партнер». Мест «Партнер Orbiq» два на направление'},
 {t:7,sub:'Предложение по клиенту приходит только через Orbiq. Решает партнер'},
 {t:5,sub:'Старт с одного клиента'}
];
function obScenes(){
  var row=function(l,v,cls){return '<div class="ob-r '+(cls||'')+'"><span>'+l+'</span><b>'+v+'</b></div>'};
  return [
  '<div class="ob-s s0"><div class="ob-logo">ORBIQ</div><div class="ob-big"><span>Новый партнер</span><span>в сети Orbiq</span></div><div class="ob-pill">'+E(CAB.name)+'</div></div>',
  '<div class="ob-s s1"><div class="ob-paste"><div class="ob-k">Вставка</div><p class="ob-type">— Спасибо за часы, жена в восторге.<br>— Как съездили в Дубай?<br>Андрей, 58 лет. Строительство, сейчас девелопмент. Двое детей. Яхты, независимые часовщики. Хочет второе гражданство до весны.</p></div><div class="ob-arrow">'+ic('ar')+'</div><div class="ob-card"><div class="ob-k">Карточка «Андрей»</div>'+row('Возраст','55–64','d1')+row('Капитал','$10–25 млн','d2')+row('Интересы','Яхты, часы','d3')+row('Запрос','Второе гражданство','d4')+row('Знакомы','6 лет, клиент','d5')+'<div class="ob-rd"><span>Готовность</span><i></i><i></i><i></i><i></i><i></i><i></i><b>6 из 6</b></div></div></div>',
  '<div class="ob-s s2"><div class="ob-chips"><span class="c1">Ковалев</span><span class="c2">+7 917 555-12-34</span><span class="c3">«Камастрой»</span></div><div class="ob-vault">'+ic('lock')+'<b>Остается у партнера</b><small>В CRM только псевдоним и суть</small></div></div>',
  '<div class="ob-s s3"><div class="ob-two"><div class="ob-card l"><div class="ob-k">Карточка партнера</div>'+row('Имя','Андрей Ковалев','m1')+row('Контакт','+7 917 555-12-34','m2')+row('Возраст','55–64')+row('Капитал','$10–25 млн')+row('Отношения','Клиент с 2019','m3')+row('Заметка','Звонить вечером','m4')+row('Запрос','Второе гражданство')+'</div><div class="ob-card r"><div class="ob-k">Видят другие партнеры</div>'+row('Имя','Андрей','x0')+row('Контакт','скрыто','x1')+row('Возраст','55–64')+row('Капитал','$10–25 млн')+row('Отношения','скрыто','x2')+row('Заметка','скрыто','x3')+row('Запрос','Второе гражданство')+'</div></div></div>',
  '<div class="ob-s s4"><div class="ob-card ob-prod"><div class="ob-k">Продукт партнера в сети</div><p class="ob-ps">Подбор и сопровождение второго гражданства для семьи</p><div class="ob-sig"><span>Капитал от $3 млн</span><span>Дети-школьники</span><span>Бизнес за рубежом</span></div></div><div class="ob-dos"><div class="ob-tot"><b>14</b><span>клиентов под продукт</span><em>$70–210 тыс в год</em></div><div class="ob-dr o1"><b>Андрей · 55–64</b><small>Девелопмент, совладелец. Юг России. Яхты, часы</small><i>$15 тыс</i></div><div class="ob-dr o2"><b>Марина · 45–54</b><small>Фармдистрибуция, продала долю. Опера</small><i>$15 тыс</i></div><div class="ob-dr o3"><b>Виктор · 45–54</b><small>Логистика, основатель. Гольф</small><i>$10 тыс</i></div></div></div>',
  '<div class="ob-s s5"><div class="ob-50"><div class="ob-k">Готовых карточек</div><div class="ob-n"><b class="ob-cnt">0</b><span>из 50</span></div><div class="ob-pb"><i></i></div><div class="ob-st"><span>Новый</span>'+ic('ar')+'<span class="on">Базовый партнер</span>'+ic('ar')+'<span>Партнер Orbiq</span></div></div><div class="ob-seat"><div class="ob-k">Места в направлении</div><div class="ob-sl"><i class="f">Занято</i><i>Свободно</i></div><b>Занято 1 из 2</b></div></div>',
  '<div class="ob-s s6"><div class="ob-flow"><div class="ob-node n1">'+ic('users')+'<b>Другой партнер</b><small>Предлагает услугу</small></div><i class="ob-line l1"></i><div class="ob-node n2 acc">'+ic('shield')+'<b>Orbiq</b><small>Проверяет и согласует</small></div><i class="ob-line l2"></i><div class="ob-node n3">'+ic('check')+'<b>Партнер</b><small>Решает, передать ли клиенту</small></div></div></div>',
  '<div class="ob-s s7"><div class="ob-big"><span>Одно имя.</span><span>Все, что известно.</span></div><div class="row" style="justify-content:center;gap:12px;margin-top:28px"><button type="button" class="btn pri" data-a="obstart">'+ic('plus')+'Добавить первого клиента</button><button type="button" class="btn" data-a="obreplay" style="background:rgba(255,255,255,.1);color:#fff">'+ic('redo')+'Смотреть еще раз</button></div></div>'
  ];
}
function onboarding(){
  closeSheet();var old=$('.ob');if(old)old.remove();
  var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;var total=OB_SCENES.reduce(function(a,s){return a+s.t},0);
  var el=document.createElement('div');el.className='ob'+(rm?' rm':'');el.setAttribute('role','dialog');el.setAttribute('aria-label','Как работает Orbiq');
  el.innerHTML='<div class="ob-stage">'+obScenes().join('')+'</div><div class="ob-sub" aria-live="polite"></div><div class="ob-ctl"><button type="button" class="ob-b" data-ob="play" aria-label="Пауза">'+ic('pause')+'</button><button type="button" class="ob-b" data-ob="prev" aria-label="Назад">'+ic('al')+'</button><div class="ob-prog">'+OB_SCENES.map(function(s){return '<i style="flex:'+s.t+'"><b></b></i>'}).join('')+'</div><button type="button" class="ob-b" data-ob="next" aria-label="Далее">'+ic('ar')+'</button><button type="button" class="ob-b" data-ob="replay" aria-label="Сначала">'+ic('redo')+'</button><button type="button" class="ob-skip" data-ob="skip">Пропустить</button></div>';
  document.body.appendChild(el);requestAnimationFrame(function(){el.classList.add('on')});
  var scenes=$$('.ob-s',el),bars=$$('.ob-prog b',el),sub=$('.ob-sub',el),cur=-1,t=0,last=performance.now(),paused=rm,raf;
  var starts=[];OB_SCENES.reduce(function(a,s,i){starts[i]=a;return a+s.t},0);
  var show=function(i){if(i===cur)return;cur=i;var cn=el.querySelector('.s5 .ob-cnt');if(cn){if(i===5&&!rm)count(cn,0,50,3200);else cn.textContent=i>5||rm?'50':'0'}scenes.forEach(function(s,k){s.classList.toggle('on',k===i);if(k===i){s.classList.remove('run');void s.offsetWidth;s.classList.add('run')}});sub.textContent=OB_SCENES[i].sub};
  var setPlay=function(p){paused=!p;el.classList.toggle('paused',paused);$('[data-ob=play]',el).innerHTML=paused?ic('ar'):ic('pause');$('[data-ob=play]',el).setAttribute('aria-label',paused?'Продолжить':'Пауза')};
  var tick=function(now){var dt=(now-last)/1000;last=now;if(!paused){t+=dt;if(t>=total){t=total-0.001;setPlay(false)}}var i=0;while(i<starts.length-1&&t>=starts[i+1])i++;show(i);bars.forEach(function(b,k){var p=k<i?1:k>i?0:(t-starts[k])/OB_SCENES[k].t;b.style.transform='scaleX('+Math.max(0,Math.min(1,p))+')'});raf=requestAnimationFrame(tick)};
  var jump=function(i){i=Math.max(0,Math.min(OB_SCENES.length-1,i));t=starts[i]+0.001;cur=-1};
  var close=function(){cancelAnimationFrame(raf);localStorage.setItem('oc_onb','1');el.classList.remove('on');setTimeout(function(){el.remove()},400);document.removeEventListener('keydown',kd)};
  var kd=function(e){if(e.key==='Escape')close();if(e.key===' '){e.preventDefault();setPlay(paused)}if(e.key==='ArrowRight')jump(cur+1);if(e.key==='ArrowLeft')jump(cur-1)};
  document.addEventListener('keydown',kd);
  el.addEventListener('click',function(e){var b=e.target.closest('[data-ob],[data-a]');if(!b)return;var a=b.getAttribute('data-ob')||b.getAttribute('data-a');
    if(a==='play')setPlay(paused);else if(a==='next')jump(cur+1);else if(a==='prev')jump(cur-1);else if(a==='replay'||a==='obreplay'){jump(0);setPlay(true)}else if(a==='skip')close();else if(a==='obstart'){e.stopPropagation();close();go('#/new')}});
  if(rm)setPlay(false);else setPlay(true);
  raf=requestAnimationFrame(tick);
}


function vGate(r){var rn=readyN();var name={requests:'Обращения',plans:'Планы'}[r]||'Раздел';
  page(r,hd('Откроется после проверки портфеля',name)+'<div class="card gate-c rv"><span class="kick">Готово '+rn.n+' из '+rn.need+'</span><h2>'+rn.need+' своих клиентов откроют обращения, имена в подборке и планы</h2><i class="gate-p big"><i style="width:'+Math.min(100,Math.round(rn.n/rn.need*100))+'%"></i></i><p class="hint">Без фамилий, почт и телефонов. Текстом, файлом или голосом, система сама разложит по полям</p><div class="row">'+btn('Добавить клиента','pri mag','data-a="go" data-h="#/new"','plus')+'<a class="btn soft" href="#/fit">'+ic('spark')+'Смотреть подборку</a></div></div>')}

/* ================= Помощник партнера: шаги, задание для нейросети, сценарий разговора ================= */
var RESEARCH_PROMPT=['Я готовлю индивидуальную подборку для человека, с которым работаю. Исходные данные для поиска укажу здесь: [имя и фамилия], [ориентир, позволяющий различить однофамильцев]. Найди публично выраженные интересы и планы, которые помогают предложить этому человеку уместную возможность. Работай только с общедоступными источниками. Если веб-поиск недоступен, сообщи об этом.',
'Начни с собственных интервью, публичных выступлений, авторских публикаций и официальных страниц проектов. Ищи также на языках стран, где человек вел публичную деятельность. Проверь архивные интервью, подкасты и доступные видеозаписи. Если доступна расшифровка, изучи ее. Если доступно аудио и ты умеешь его расшифровать, разбери относящиеся к задаче фрагменты, сохрани таймкоды для моей проверки. Если доступно лишь описание, так и укажи. Не выдавай пересказ за слова героя. Для публичных отзывов сначала установи, что авторство подтверждено. При совпадении имен оставляй спорный материал за пределами результата.',
'Ищи конкретику: чем человек занимался сам, какие предметы или места выделял, почему ему понравился определенный опыт, куда он возвращался, какой проект хотел бы продолжить. Различай инвестицию в отрасль, профессиональную обязанность и личное увлечение. Отмечай давность сведений. Не восстанавливай текущее местоположение, частные маршруты, контакты или сведения о несовершеннолетних. Исключи закрытые базы, утечки, обход ограничений и сведения о здоровье, политике или вере.',
'Составь прикладной портрет для общения: какие форматы человек прямо предпочитает, что ценит при выборе, что отклонял. Каждый вывод привяжи к наблюдаемому высказыванию. Отдельно обозначь гипотезы, которые корректно уточнить вопросом. Не ставь диагнозов, не приписывай скрытых мотивов. Если оснований мало, напиши «неизвестно».',
'Верни два отдельных результата. Первый: справка для меня в чате. Дай каждому источнику код S1, S2 и далее. Укажи ссылку, дату, подтверждение личности и при наличии таймкод. Эта справка остается у меня.',
'Второй: отдельный файл profile.md для импорта в Orbiq, либо один блок Markdown, если создание файла недоступно. Разделы: «О человеке», «Дело», «Семья», «Интересы», «Предпочтения», «Планы и запросы», «Портрет общения», «Что уточнить». Одна строка на утверждение: суть своими словами | факт или гипотеза | код источника | год или неизвестно. Исключи имена, фамилии, контакты, ссылки, названия собственных компаний, уникальные должности, дословные цитаты и идентифицирующие сочетания событий. Обобщи их до отрасли, периода или региона. Оставь только детали, необходимые для подбора. Перед выдачей перечитай файл как посторонний и убери признаки, по которым легко найти человека. При нехватке сведений сохрани пробелы.'].join('\n\n');
var DICT_Q=[['О человеке',['Какой примерно возраст?','В каком регионе обычно живет?','Где регулярно бывает?']],['Дело',['В какой сфере заработал основной капитал?','Какими направлениями занимается сейчас?','Какой проект хотел бы развить?']],['Семья',['С кем обычно планирует поездки или досуг?','Есть ли дети или внуки, какого они примерно возраста?','Для кого хотел бы получить или подарить подборку?']],['Интересы',['На что охотно тратит свободное время?','Какой предмет, мастер или направление его увлекает?','Какой опыт запомнился и чем?']],['Предпочтения',['Какие форматы ему нравятся?','Что просил больше не предлагать?','Как предпочитает обсуждать варианты?']],['Планы и запросы',['С чем уже обращался к вам?','Что хочет сделать в ближайшие месяцы?','Какие сроки или обстоятельства важны?']],['Отношения',['Сколько лет вы знакомы?','Он ваш клиент, платил ли вам?','Примерный капитал и на чем основана оценка?']]];
var SCRIPT1='[Имя], вы как-то рассказывали, что [подтвержденный интерес]. Я вспомнил об этом, когда увидел [конкретная возможность]. До [дата] можно [результат], все оформляется [способ]. Вам было бы интересно?';
var SCRIPT0='Добрый день. Я видел в Orbiq запрос на [что ищет клиент] в [регион] с бюджетом [бюджет]. У меня есть [конкретное предложение под его условия]. Готов показать варианты [когда]. Передадите клиенту?';
var SCRIPT3='Я могу организовать это для вас через Orbiq. Хотите, уточню условия?';
var SCRIPT2='Я стал партнером Orbiq, это международный консьерж-сервис для предпринимателей. У меня есть возможность подарить вам три месяца доступа. Я уже собрал для вас первую подборку. Вы сможете менять темы и пригласить еще одного человека из семьи. Годовой доступ стоит $10 000. Прислать вам личную ссылку?';
function vHelp(){var l=LL();var paid=ptier()==='paid';var allQ=DICT_Q.map(function(g){return g[0]+':\n'+g[1].map(function(q){return '— '+q}).join('\n')}).join('\n\n');
  var step=function(n,title,sub,body){return '<section class="hstep rv" style="--i:'+n+'"><div class="hstep-n">'+n+'</div><div class="hstep-b"><h3>'+title+'</h3><p class="hint">'+sub+'</p>'+body+'</div></section>'};
  var scr=function(k,t,x){return '<div class="scr"><span class="kick">'+t+'</span><p>'+E(x)+'</p>'+btn('Скопировать','soft sm','data-a="cpy" data-k="'+k+'"','copy')+'</div>'};
  page('help',hd('Как получить первые сделки','Помощник')+
    step(1,'Выбрать лиды','Раздел «Лиды»: раскрыть запрос и отметить до 3 клиентов для связи. Горячие запросы младше 7 дней, актуальные младше 30 дней',
      '<div class="row"><a class="btn soft" href="#/fit">'+ic('spark')+'Открыть лиды</a></div>')+
    step(2,'Загрузить '+l.need+' своих клиентов с запросами','Сейчас '+l.n+' из '+l.need+'. Быстрее всего списком: одна строка, один клиент. Имя, возраст, сфера и задача клиента. Без фамилий и контактов, клиенты остаются за партнером. Детали можно надиктовать позже по вопросам ниже',
      '<div class="row">'+btn('Загрузить списком','pri','data-a="bulk"','upload')+btn('Скопировать вопросы для диктовки','soft','data-a="cpy" data-k="q"','copy')+'</div><div class="qgrid">'+DICT_Q.map(function(g){return '<div class="qg"><b>'+g[0]+'</b><ul>'+g[1].map(function(q){return '<li>'+E(q)+'</li>'}).join('')+'</ul></div>'}).join('')+'</div>')+
    step(3,'Обогатить профиль через свою нейросеть','Задание копируется в ChatGPT, Claude или Perplexity с веб-поиском, туда же вписывается имя клиента. Нейросеть вернет обезличенный файл profile.md. Orbiq имя не получает',
      '<details class="hpr"><summary>Показать задание целиком</summary><pre>'+E(RESEARCH_PROMPT)+'</pre></details><div class="row">'+btn('Скопировать задание','pri','data-a="cpy" data-k="p"','copy')+'</div><p class="hint">Внешний сервис увидит введенное имя. Перед загрузкой файл стоит просмотреть</p>')+
    step(4,'Связаться с лидом через Orbiq','Кнопка «Связаться с клиентом» у лида, затем короткое описание предложения. Orbiq передаст это партнеру клиента и организует знакомство',
      scr('s0','Что написать в запросе на связь',SCRIPT0))+
    step(5,'Разговор со своими клиентами','Начало: интерес клиента и конкретная возможность. Если клиенту нужна чужая услуга из сети, ее можно предложить через Orbiq',
      scr('s1','Начало разговора',SCRIPT1)+scr('s3','Если нужна услуга другого партнера',SCRIPT3)+(paid?scr('s2','Подарок клиенту',SCRIPT2):'')),
  function(m){m.addEventListener('click',function(e){var b=e.target.closest('[data-a="cpy"]');if(!b)return;e.stopPropagation();var k=b.getAttribute('data-k');copy({p:RESEARCH_PROMPT,q:allQ,s0:SCRIPT0,s1:SCRIPT1,s2:SCRIPT2,s3:SCRIPT3}[k]||'')},true)});
}

/* ================= Первый вход партнера: живой кабинет и подсказки ================= */
function fitTour(tot,pot,t,cnt){cnt=cnt||{};var st=[
  {el:'.fit-top .spot',title:tot?'Под продукт '+tot+' '+plural(tot,'лид','лида','лидов'):'Лиды под продукт',text:tot?'Это клиенты других партнеров сети, которым подходит это предложение. Горячих, с запросом за последнюю неделю: '+(cnt.hot||0):'Как только в сети появятся клиенты под продукт, они встанут сюда'},
  {el:'.lead-f',title:'Горячие и теплые',text:'Горячий лид: запрос на продукт за последние 7 дней. Теплый: за 30 дней. По интересам: запроса нет, но интересы совпадают'}];
  if($('.dos-r'))st.push({el:'.dos-r',title:'Карточка лида',text:t==='new'?'Запрос, возраст и капитал видны сразу. Имя и подробности откроются после проверки клиентов партнера':'Предложение уходит через Orbiq. Клиент остается за партнером, который его привел'});
  st.push({el:'.stg',title:'Текущий этап',text:t==='new'?'Сейчас шаг 1: занести '+readyN().need+' своих клиентов. Без фамилий и контактов. Затем Orbiq проверит портфель и откроет предложения лидам':'Здесь видно текущий шаг и что делать дальше'});
  st.push({el:'[data-nav="help"]',title:'Помощник',text:'Готовые вопросы для диктовки, задание для своей нейросети, которое соберет профиль клиента из открытых источников, и сценарий разговора',go:'#/help',btn:'Открыть помощника'});
  return st}
function tour(steps,key){key=key||'oc_tour';if(!steps||!steps.length)return;var i=0;var old=$('.tour');if(old)old.remove();
  var ov=document.createElement('div');ov.className='tour';ov.innerHTML='<div class="tour-hole"></div><div class="tour-tip" role="dialog" aria-live="polite"></div>';document.body.appendChild(ov);
  var hole=$('.tour-hole',ov),tip=$('.tour-tip',ov);
  var end=function(){localStorage.setItem(key,'1');S.tour=0;ov.classList.remove('on');setTimeout(function(){ov.remove()},300);removeEventListener('resize',place);document.removeEventListener('keydown',kd)};
  var place=function(){var s=steps[i];var el=s.el&&$(s.el);if(!el){tip.style.left='50%';tip.style.top='50%';tip.style.transform='translate(-50%,-50%)';hole.style.opacity=0;return}
    var r=el.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-40){el.scrollIntoView({block:'center',behavior:'smooth'});setTimeout(place,380);return}
    var pad=8;hole.style.opacity=1;hole.style.left=(r.left-pad)+'px';hole.style.top=(r.top-pad)+'px';hole.style.width=(r.width+pad*2)+'px';hole.style.height=(r.height+pad*2)+'px';
    tip.style.transform='';var tw=Math.min(360,innerWidth-32);tip.style.width=tw+'px';var th=tip.offsetHeight;
    var below=r.bottom+pad+14+th<innerHeight;var top=below?r.bottom+pad+14:Math.max(16,r.top-pad-14-th);
    var left=Math.min(Math.max(16,r.left+r.width/2-tw/2),innerWidth-tw-16);if(r.right<innerWidth*0.3&&innerWidth>860){left=r.right+pad+16;top=Math.max(16,r.top+r.height/2-th/2)}
    tip.style.left=left+'px';tip.style.top=top+'px'};
  var show=function(){var s=steps[i];tip.classList.remove('in');void tip.offsetWidth;
    tip.innerHTML='<div class="tour-n">'+(i+1)+' из '+steps.length+'</div><h4>'+E(s.title)+'</h4><p>'+E(s.text)+'</p><div class="tour-b">'+(i<steps.length-1?'<button type="button" class="lnk2" data-t="skip">Пропустить</button><button type="button" class="btn sm pri" data-t="next">Дальше</button>':'<button type="button" class="lnk2" data-t="skip">Позже</button><button type="button" class="btn sm pri" data-t="go">'+E(s.btn||'Понятно')+'</button>')+'</div>';
    tip.classList.add('in');place()};
  var kd=function(e){if(e.key==='Escape')end();if(e.key==='ArrowRight'||e.key==='Enter'){if(i<steps.length-1){i++;show()}}};
  ov.addEventListener('click',function(e){var b=e.target.closest('[data-t]');if(!b)return;var a=b.getAttribute('data-t');if(a==='next'){i++;show()}else if(a==='skip')end();else if(a==='go'){var g=steps[i].go;end();if(typeof g==='function')g();else if(g)location.hash=g}});
  addEventListener('resize',place);document.addEventListener('keydown',kd);requestAnimationFrame(function(){ov.classList.add('on');show()})}

/* ================= v2: продукт, подборка-досье, статус ================= */
function money(n){n=+n||0;if(n>=1e6)return '$'+(Math.round(n/1e5)/10).toString().replace('.',',')+' млн';if(n>=1000)return '$'+Math.round(n/1000)+' тыс';return '$'+n}
function range(p){if(!p||(!p.min&&!p.max))return '—';var a=+p.min||0,b=+p.max||0;if(!b||a===b)return money(a||b);var u=function(n,d){return (Math.round(n/d*10)/10).toString().replace('.',',')};if(a>=1e6)return '$'+u(a,1e6)+'–'+u(b,1e6)+' млн';if(a>=1000&&b<1e6)return '$'+Math.round(a/1000)+'–'+Math.round(b/1000)+' тыс';return money(a)+'–'+money(b).replace('$','')}
function myProduct(){var p=S.me&&S.me.partner||{};if(p.product)return Promise.resolve(p.product);return api('partner/product').then(function(r){return r&&(r.product||r)}).catch(function(){return null})}
function mySeats(){var p=S.me&&S.me.partner||{};var cat=(p.categories||[])[0];if(!cat)return Promise.resolve(null);if(p.seatInfo)return Promise.resolve(p.seatInfo);
  if(S.noSeat)return Promise.resolve(null);
  return api('seat/list',null,{cat:cat}).then(function(x){x=Array.isArray(x)?x[0]:x;if(!x)return null;var taken=x.seats||x.taken||[];return {cat:cat,taken:taken.length,max:x.max||2,waitlist:(x.waitlist||x.wait||[]).length}}).catch(function(e){if(e.status===403)S.noSeat=true;return null})}
function seatCard(st,dark){if(!st)return '';var sl='';for(var i=0;i<st.max;i++)sl+='<i class="'+(i<st.taken?'f':'')+'">'+(i<st.taken?'Занято':'Свободно')+'</i>';
  return '<div class="card '+(dark?'dk ':'')+'rv stack" style="--i:3;gap:12px"><span class="kick"'+(dark?' style="color:var(--dmute)"':'')+'>Места «Партнер Orbiq» · '+E(CATS[st.cat]||st.cat)+'</span><h2'+(dark?' style="color:#fff"':'')+'>Занято '+st.taken+' из '+st.max+'</h2><div class="seatbar">'+sl+'</div><p class="hint"'+(dark?' style="color:var(--dmute)"':'')+'>'+(st.taken>=st.max?'Мест нет. Можно встать в лист ожидания':'Два места на направление. Первым видит новые запросы своей категории')+'</p></div>'}

function leadAge(r){if(!r.reqAt)return null;return Math.max(0,Math.floor((Date.now()-Date.parse(r.reqAt))/864e5))}
function leadKind(r){var d=leadAge(r);if(d==null)return 'int';return d<=7?'hot':d<=30?'warm':'old'}
function LL(){var l=(S.me&&S.me.partner&&S.me.partner.limits&&S.me.partner.limits.leads)||{};return {need:+l.need||30,per:+l.per||3,n:+l.n||0,used:+l.used||0,left:+l.left||0,asked:l.asked||[]}}
function picks(){try{return JSON.parse(localStorage.getItem('oc_pick')||'[]')}catch(e){return []}}
function setPicks(a){try{localStorage.setItem('oc_pick',JSON.stringify(a.slice(0,3)))}catch(e){}}
var LK={hot:['Горячий','запрос за последние 7 дней'],warm:['Теплый','запрос за последние 30 дней'],cold:['Запрос','больше 30 дней назад'],int:['По интересам','запроса нет, совпадают интересы']};
function agoD(d){return d===0?'сегодня':d===1?'вчера':d+' '+plural(d,'день','дня','дней')+' назад'}
function stageHtml(t){var rn=readyN();var st=t==='paid'||t==='basic'?3:(S.me.partner&&S.me.partner.pf==='submitted')?2:1;
  var it=[['Занести своих клиентов',rn.n+' из '+rn.need+' карточек','#/new'],['Проверка Orbiq','2–3 дня после '+rn.need+' карточек',''],['Предлагать лидам','через Orbiq, клиент остается за партнером','']];
  return '<div class="stg rv"><div class="stg-h"><span class="kick">Текущий этап</span><b>'+(st===1?'Шаг 1 из 3. Занести '+rn.need+' своих клиентов, чтобы предлагать лидам':st===2?'Шаг 2 из 3. Orbiq проверяет портфель':'Шаг 3 из 3. Предложения лидам через Orbiq')+'</b></div><ol class="stg-l">'+it.map(function(x,k){var c=k+1<st?'done':k+1===st?'cur':'';return '<li class="'+c+'"><i>'+(k+1<st?ic('check'):k+1)+'</i><span><b>'+x[0]+'</b><small>'+x[1]+'</small></span>'+(k===0&&st===1?'<i class="gate-p"><i style="width:'+Math.min(100,Math.round(rn.n/rn.need*100))+'%"></i></i>':'')+'</li>'}).join('')+'</ol><div class="row">'+(st===1?btn('Добавить клиента','pri','data-a="go" data-h="#/new"','plus')+'<a class="btn soft" href="#/help">'+ic('note')+'Как быстро занести 50</a>':'<a class="btn soft" href="#/help">'+ic('note')+'Сценарий разговора</a>')+'</div></div>'}
function pathHtml(){var l=LL(),pk=picks().length,open=l.n>=l.need;var st=open?3:(pk?2:1);
  if(open)return '<section class="jpath slim" id="jpath"><span class="jpath-ok">'+ic('check')+(l.left<1?'Отправлено '+l.per+' запроса на связь. Orbiq ведет знакомства':'Связь открыта: осталось '+l.left+' из '+l.per+(pk?'. Выбрано '+pk+', дальше кнопка «Связаться с клиентом» у выбранных':''))+'</span><button type="button" class="jh-lnk" data-a="upgrade-info">Без лимита: Партнер Orbiq '+ic('ar')+'</button></section>';
  var it=[['Выбрать лиды',pk?'Выбрано '+pk+' из 3':'До 3 клиентов'],['Загрузить своих клиентов',l.n+' из '+l.need+' с запросами'],['Связаться через Orbiq','Откроется '+l.per+' '+plural(l.per,'лид','лида','лидов')]];
  return '<section class="jpath" id="jpath"><ol>'+it.map(function(x,k){var c=k+1<st?'done':k+1===st?'cur':'';
    return '<li class="'+c+'"><i>'+(k+1<st?ic('check'):(k+1))+'</i><div><b>'+x[0]+'</b><span>'+x[1]+'</span>'+(k===1?'<em class="jpath-bar"><u style="width:'+Math.min(100,Math.round(l.n/l.need*100))+'%"></u></em>':'')+'</div></li>'}).join('')+'</ol>'+
    '<div class="jpath-f"><p>За '+l.need+' своих клиентов с запросами Orbiq открывает связь с '+l.per+' лидами. Только имена, без фамилий и контактов</p><div class="row">'+btn('Загрузить клиентов','sm dark','data-a="bulk"','upload')+'</div></div></section>'}
function hintAt(el,html){var o=$('.hintp');if(o)o.remove();var h=document.createElement('div');h.className='hintp';h.innerHTML=html;document.body.appendChild(h);
  var r=el.getBoundingClientRect();var w=Math.min(300,innerWidth-32);h.style.width=w+'px';var top=r.bottom+10;if(top+h.offsetHeight>innerHeight-16)top=r.top-10-h.offsetHeight;h.style.top=top+'px';h.style.left=Math.min(Math.max(16,r.left+r.width/2-w/2),innerWidth-w-16)+'px';
  requestAnimationFrame(function(){h.classList.add('on')});var kill=function(){h.classList.remove('on');setTimeout(function(){h.remove()},300);removeEventListener('scroll',kill,true)};setTimeout(kill,5200);setTimeout(function(){addEventListener('scroll',kill,true)},700)}
function leadTour(force){if(!force&&localStorage.getItem('oc_ltour')==='1')return;if(!$('.je.open'))return;var st=[
  {el:'.je.open .je-h',title:'Это запрос клиента',text:'Клиента привел партнер сети Orbiq. Сверху видно, что он хочет, где, к какому сроку и с каким бюджетом. Нажатие на карточку раскрывает или сворачивает детали'},
  {el:'.je.open .jp-b',title:'Условия сделки',text:'Бюджет, где лежат деньги и насколько клиент готов к покупке. По этим данным видно, стоит ли предлагать ему продукт'},
  {el:'.je.open [data-a="pick"]',title:'Интересные клиенты',text:'До 3 лидов можно добавить в свой список. Это бесплатно и ни к чему не обязывает'},
  {el:'.je.open [data-a="getlead"]',title:'Связь идет через Orbiq',text:'Контактов клиента в системе нет. Orbiq передает предложение партнеру, который ведет клиента, и организует знакомство'},
  {el:'#jpath',go:function(){bulkSheet()},btn:'Загрузить клиентов',title:'Как открыть связь',text:'Сеть работает на взаимности. Связь с лидами открывается тем, кто тоже приводит клиентов: 30 своих клиентов с запросами открывают связь с 3 лидами. Клиенты остаются за партнером и приносят ему комиссию, когда партнеры сети продают им свои услуги'}];
  tour(st.filter(function(x){return $(x.el)}),'oc_ltour')}
function vFit(){
  var t=ptier();var first=!isOwner()&&localStorage.getItem('oc_tour')!=='1'&&t!=='paid';
  document.body.classList.toggle('focus',first);
  loading('fit');
  Promise.all([api('fit/list'),loadSent()]).then(function(rr){var d=rr[0]||{};var rows=(d.rows||[]).filter(function(r){return r.reqAt||r.hasRequest}).slice().sort(function(a,b){return (leadAge(a)||0)-(leadAge(b)||0)});
    var can=d.canOffer!=null?!!d.canOffer:(t==='basic'||t==='paid');var lim=rqLimit();S.leads=rows;var l=LL();var pk=picks();
    rows.sort(function(a,b){return (pk.indexOf(b.cid)>=0)-(pk.indexOf(a.cid)>=0)});var cnt={all:rows.length,hot:0,warm:0,old:0};rows.forEach(function(r){var k=leadKind(r);if(cnt[k]!=null)cnt[k]++});
    var f=S.leadF||'all';if(f!=='all'&&!cnt[f])f='all';
    var nm=((S.me.partner||{}).name||'').split(' ')[0];
    var tabs=[['all','Все'],['hot','Горячие','запрос за последние 7 дней'],['warm','Актуальные','запрос за последние 30 дней'],['old','Уточнить','запрос старше месяца: требует подтверждения актуальности']].filter(function(x){return x[0]==='all'||cnt[x[0]]});
    var head='<header class="jh rv">'+(first?'<div class="jh-bar"><span class="jh-logo">ORBIQ ROOM</span><button type="button" class="jh-lnk" data-a="leavefocus">Весь кабинет: клиенты и помощник '+ic('ar')+'</button></div>':'')+
      '<div class="jh-row"><button type="button" class="jh-lnk jh-how" data-a="ltour">'+ic('info')+'Как это работает</button><div><h1>Лиды</h1><p>'+(first&&nm?E(nm)+', это задачи':'Задачи')+' клиентов под продукт партнера. Их внесли партнеры, которые ведут этих клиентов. Связь идет через Orbiq</p></div></div>'+
      (can?'':pathHtml())+
      '<nav class="jt" role="tablist">'+tabs.map(function(x){return '<button type="button" role="tab" data-lf="'+x[0]+'" class="'+(f===x[0]?'on':'')+'"'+(x[2]?' title="'+x[2]+'"':'')+'>'+x[1]+'<sup>'+cnt[x[0]]+'</sup></button>'}).join('')+'</nav></header>';
    var item=function(r,i){var k=leadKind(r),dd=leadAge(r),B=r.reqBrief||null;
      var when='запрос '+agoD(dd);var KL={hot:'Горячий',warm:'Актуальный',old:'Требует подтверждения актуальности'}[k]||'';
      var ds=String(r.dossier||'');var title=r.reqText||'';
      var strip=B?[B.deal,B.where,B.when].filter(Boolean):[];
      var asked=l.asked.indexOf(r.cid)>=0,picked=pk.indexOf(r.cid)>=0;
      var act=can?btn('Предложить через Orbiq','pri','data-a="go" data-h="#/c/'+E(r.cid)+'/offer"'+(lim.left<1?' disabled title="'+E(limText())+'"':''),'send'):
        (!asked&&l.n>=l.need&&l.left<1)?btn('Больше лидов: Партнер Orbiq','dark','data-a="upgrade-info"','star'):asked?'<span class="jp-sent">'+ic('check')+'Запрос у Orbiq. Ответ придет в кабинет и в Telegram</span>':btn('Связаться с клиентом','pri','data-a="getlead" data-c="'+E(r.cid)+'"','send');
      var pickB=can||asked?'':'<button type="button" class="jp-pick'+(picked?' on':'')+'" data-a="pick" data-c="'+E(r.cid)+'">'+ic(picked?'check':'plus')+'<span>'+(picked?'В списке':'Выбрать лид')+'</span></button>';
      var st=B&&B.steps||[];var done=st.filter(function(x){return x[1]}).length;
      var n=0;var bl=function(h){return '<div class="jp-s" style="--j:'+(n++)+'">'+h+'</div>'};
      var left=(k==='old'?bl('<p class="jp-old">'+ic('info')+'Запросу '+agoD(dd).replace(' назад','')+'. Партнер, который ведет клиента, подтвердит актуальность за 1–2 дня после запроса на связь</p>'):'')+
        (B?bl('<span class="jp-k">Что хочет</span><p class="jp-what">'+E(B.what)+'</p>')+
          (B.doc?bl('<span class="jp-k">Документ от партнера</span><button type="button" class="jp-doc" data-a="leaddoc" data-c="'+E(r.cid)+'"><span class="jp-doc-i">PDF</span><span><b>'+E(B.doc.name)+'</b><small>'+E(B.doc.meta||'')+'</small></span>'+ic('ar')+'</button>'):'')+
          ((B.details||[]).length?bl('<span class="jp-k">Детали</span><div class="jp-ch">'+B.details.map(function(x){return '<span>'+E(x)+'</span>'}).join('')+'</div>'):'')+
          (B.seen?bl('<span class="jp-k">Что уже сделано</span><p class="jp-seen">'+ic('check')+E(B.seen)+'</p>'):'')+
          ((B.hurdles||[]).length?bl('<span class="jp-k">Сложности</span><ul class="jp-h">'+B.hurdles.map(function(x){return '<li>'+E(x)+'</li>'}).join('')+'</ul>'):'')
        :bl('<span class="jp-k">Запрос</span><p class="jp-what">'+E(title)+'</p><p class="jp-note">Партнер описал запрос коротко. Детали уточняются при знакомстве через Orbiq</p>'))+
        (ds?bl('<span class="jp-k">О клиенте</span><p class="jp-dos">'+E(ds)+'</p>'):'');
      var right=(B?bl('<span class="jp-k">Условия сделки</span><dl class="jp-dl">'+[['Формат',B.deal],['Бюджет',B.budget],['Где',B.where],['Сроки',B.when],['Деньги',B.money]].filter(function(x){return x[1]}).map(function(x){return '<div><dt>'+x[0]+'</dt><dd>'+E(x[1])+'</dd></div>'}).join('')+'</dl>')+
          (st.length?bl('<div class="jp-rh"><span class="jp-k">Готовность сделки</span><b>'+done+' из '+st.length+'</b></div><div class="jp-bar">'+st.map(function(x){return '<i class="'+(x[1]?'f':'')+'"></i>'}).join('')+'</div><ul class="jp-st">'+st.map(function(x){return '<li class="'+(x[1]?'f':'')+'">'+(x[1]?ic('check'):'<i></i>')+E(x[0])+'</li>'}).join('')+'</ul>'):''):'')+
        bl('<dl class="jp-dl sm"><div><dt>Доход партнера</dt><dd>'+E(range(r.potential))+' со сделки</dd></div><div><dt>Ведет</dt><dd>'+E(r.leadBy||'партнер сети')+'</dd></div></dl>')+
        bl('<div class="jp-cta">'+act+pickB+'<small>Связь идет через Orbiq. Клиент остается за партнером, который его привел</small></div>');
      return '<article class="je '+k+(picked?' picked':'')+'" data-k="'+k+'" data-c="'+E(r.cid)+'"'+(f!=='all'&&f!==k?' hidden':'')+' style="--i:'+Math.min(i,10)+'">'+
        '<div class="je-h" role="button" tabindex="0" aria-expanded="false">'+
          '<div class="je-l"><span class="je-w '+k+'"><i></i>'+KL+'</span><span class="je-ago">'+E(when)+'</span>'+(picked?'<span class="je-pk">'+ic('check')+'Выбран</span>':'')+'</div>'+
          '<div class="je-m"><h3 class="je-q">'+E(title)+'</h3>'+(strip.length?'<div class="je-s">'+strip.map(function(x){return '<span>'+E(x)+'</span>'}).join('')+(B&&B.doc?'<span class="d">'+ic('file')+'Документ</span>':'')+'</div>':'')+
            '<div class="je-p"><span class="je-av">'+E((r.alias||'?').charAt(0))+'</span>'+E(r.alias)+', '+E(ageL(r.age))+' · <span class="nw">капитал '+E(capL(r.capital))+'</span></div></div>'+
          '<div class="je-r">'+(B&&B.budget?'<span class="jp-k">Бюджет</span><b>'+E(B.budget)+'</b>':'<span class="jp-k">Доход партнера</span><b>'+E(range(r.potential))+'</b>')+'</div>'+
          '<span class="je-x" aria-hidden="true"></span></div>'+
        '<div class="je-b"><div><div class="jp"><div class="jp-a">'+left+'</div><div class="jp-b">'+right+'</div></div></div></div></article>'};
    page('fit',head+(rows.length?'<div class="jl">'+rows.map(item).join('')+'</div>':'<div class="je-empty"><p>Запросов на продукт пока нет</p><span>Они появятся здесь, как только партнеры сети занесут клиентов с таким запросом</span></div>'),
    function(m){var list=$('.jl',m);if(!list)return;
      var open=function(a,on){var h=$('.je-h',a);a.classList.toggle('open',on);h.setAttribute('aria-expanded',on?'true':'false')};
      list.addEventListener('click',function(e){var h=e.target.closest('.je-h');if(!h)return;var a=h.parentNode;var on=!a.classList.contains('open');if(on)$$('.je.open',list).forEach(function(x){if(x!==a)open(x,false)});open(a,on)});
      var fv=$$('.je',list).filter(function(a){return !a.hidden})[0];if(fv&&!S.leadOpen)setTimeout(function(){open(fv,true)},350);
      if(S.leadOpen){var lo=$('.je[data-c="'+S.leadOpen+'"]',list);if(lo)open(lo,true);S.leadOpen=null}if(S.keepY!=null){var ky=S.keepY;S.keepY=null;requestAnimationFrame(function(){scrollTo(0,ky)})}
      if(!can)setTimeout(function(){if(location.hash==='#/fit'||location.hash===''||location.hash==='#/')leadTour(false)},1300);
      list.addEventListener('keydown',function(e){var h=e.target.closest('.je-h');if(h&&(e.key==='Enter'||e.key===' ')){e.preventDefault();h.click()}});
      $$('.jt button',m).forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-lf');S.leadF=v;$$('.jt button',m).forEach(function(x){x.classList.toggle('on',x===b)});
        $$('.je',list).forEach(function(a){a.hidden=!(v==='all'||a.getAttribute('data-k')===v)})})})});
  }).catch(function(e){page('fit',e.status===403?'<div class="card">'+emptyBox('Лиды недоступны','Они строятся под продукт поставщика')+'</div>':errBox(e))});
}
function leaveFocus(){localStorage.setItem('oc_tour','1');document.body.classList.remove('focus');S.tour=0}
function whyNet(r){var l=LL();return '<div class="why"><div class="why-f"><span><b>Партнер</b>предлагает продукт</span><i>'+ic('ar')+'</i><span><b>Orbiq</b>проверяет и передает</span><i>'+ic('ar')+'</i><span><b>'+(r&&r.leadBy==='Orbiq'?'Менеджер Orbiq':'Партнер клиента')+'</b>знакомит с клиентом</span></div>'+
  '<p>Orbiq — закрытая сеть. Контактов клиентов здесь нет, знакомит тот, кто клиента ведет. Связь с лидами открывается тем, кто тоже приводит клиентов: так сеть растет для всех.</p>'+
  '<p>Клиенты остаются за партнером. Другие партнеры видят их без имен и контактов. Когда партнер сети продает такому клиенту свою услугу, тот, кто привел клиента, получает комиссию, Orbiq согласует ее до знакомства.</p></div>'}
function upgradeSheet(used){closeSheet();sheet('<div class="kick">Партнер Orbiq</div><h2>'+(used?'Все '+LL().per+' запроса на связь отправлены':'Связь с лидами без загрузки клиентов')+'</h2>'+(used?'<p class="hint">Orbiq ведет знакомства по ним. Больше лидов сразу дает статус Партнер Orbiq</p>':'')+'<ul class="dash"><li>Связь с лидами своей категории сразу</li><li>Новые запросы видны на 72 часа раньше остальных</li><li>Два места на категорию, продукт в приоритете у сети</li><li>Можно дарить клиентам 3 месяца Orbiq</li></ul><p class="go2-p" style="color:var(--ink)">$20 000 за 2 года</p><p class="hint">$10 000 сразу и $10 000 через 90 дней. Передачи клиентов Orbiq ведет вручную, продажи не гарантированы</p><div class="row">'+btn('Обсудить с Orbiq','pri','data-a="upgrade"','msg')+'</div>')}
function getLeadSheet(cid){var r=(S.leads||[]).find(function(x){return x.cid===cid})||{};var l=LL();
  if(l.n>=l.need&&l.left>0){var el=sheet('<div class="kick">'+E(r.alias||'Лид')+' · «'+E(r.reqText||'')+'»</div><h2>Запрос на связь через Orbiq</h2><p class="hint">Orbiq передаст запрос партнеру, который ведет клиента. Он '+(leadKind(r)==='old'?'подтвердит актуальность и ':'')+'организует знакомство. Останется лидов: '+(l.left-1)+' из '+l.per+'</p><textarea class="ta" id="lask" placeholder="Коротко: что предложить клиенту. Например: есть 2 off-market виллы в Лигурии под его требования, могу показать в декабре"></textarea><div class="row">'+btn('Отправить запрос','pri','id="laskgo"','send')+'</div>',true);
    $('#laskgo',el).addEventListener('click',function(){var tx=$('#lask',el).value.trim();if(tx.length<10){toast('Нужно коротко описать предложение клиенту','alert');return}this.disabled=true;
      api('lead/ask',{cid:cid,requestId:r.reqId||'',text:tx}).then(function(x){if(x&&x.leads&&S.me.partner){S.me.partner.limits=S.me.partner.limits||{};S.me.partner.limits.leads=x.leads}var a=picks().filter(function(c){return c!==cid});setPicks(a);closeSheet();toast('Запрос у Orbiq. Ответ придет в кабинет и в Telegram');S.leadOpen=cid;S.keepY=scrollY;vFit()}).catch(function(e){toast(e.message||'Не получилось','alert')})});return}
  if(l.n>=l.need&&l.left<1){upgradeSheet(true);return}
  var pct=Math.min(100,Math.round(l.n/l.need*100));
  sheet('<div class="kick">'+E(r.alias||'Лид')+(r.reqText?' · «'+E(r.reqText)+'»':'')+'</div><h2>Как связаться с этим клиентом</h2>'+whyNet(r)+'<p class="hint" style="margin-top:4px">Связь открывается одним из двух способов</p>'+
   '<div class="gopt"><section class="go1"><span class="kick">Бесплатно</span><h3>Загрузить '+l.need+' своих клиентов с запросами</h3><p class="gl-t">За это Orbiq откроет связь с '+l.per+' лидами на выбор</p><div class="gprog-r"><div class="gprog"><u style="width:'+pct+'%"></u></div><small>'+l.n+' из '+l.need+'</small></div><ul class="dash"><li>Только имя, возраст, сфера и запрос. Без фамилий и контактов</li><li>Запрос может быть на любую услугу сети. Клиенты остаются за партнером</li></ul>'+btn('Загрузить клиентов','pri','data-a="bulk"','upload')+'</section>'+
   '</div>',true);
}
function bulkParse(line,i){var parts=line.split(/[,;]/).map(function(x){return x.trim()});var alias=(parts[0]||'').replace(/[^\p{L}\p{N} .'’\-]/gu,'').trim().split(/\s+/)[0].slice(0,30)||('Клиент '+i);
  var am=/(\d{2})\s*(лет|год|г\b|,|$)/.exec(line);var a=am?+am[1]:0;var age=a?(a<35?'<35':a<45?'35–44':a<55?'45–54':a<65?'55–64':'65+'):'';
  var rm=/(ищет|хочет|нужн\S*|планирует|интересует|запрос:?|выбирает|покупает)\s+(.{4,})$/i.exec(line);var rq=rm?(rm[0].charAt(0).toUpperCase()+rm[0].slice(1)).slice(0,200):'';
  var sphere=parts.slice(1).filter(function(x){return x&&!/^\d{2}/.test(x)&&x.indexOf(rm?rm[0].split(' ')[0]:'@@')<0})[0]||'';
  return {alias:alias,age:age,rq:rq,sphere:sphere.slice(0,80)}}
function bulkSheet(){closeSheet();var l=LL();
  var el=sheet('<div class="kick">Мои клиенты</div><h2>Загрузить клиентов списком</h2><p class="hint"><b>Зачем:</b> 30 своих клиентов с запросами открывают связь с 3 лидами. Клиенты остаются за партнером и приносят комиссию, когда партнеры сети продают им свои услуги.</p><p class="hint">Одна строка, один клиент: имя, возраст, сфера и задача клиента. Без фамилий, телефонов и почты. Для связи с лидами считаются клиенты с запросом</p><textarea class="ta" id="blk" style="min-height:240px" placeholder="Андрей, 52, логистика, ищет дом в Испании&#10;Ирина, 45, сеть клиник, хочет ВНЖ в Португалии для детей&#10;Олег, 60, агробизнес, ищет частный самолет на зиму"></textarea><div class="gprog" id="blkp" hidden><u style="width:0"></u></div><div class="row" style="justify-content:space-between"><span class="hint" id="blkn">0 клиентов</span>'+btn('Загрузить','pri','id="blkgo"','upload')+'</div>',true);
  var ta=$('#blk',el),n=$('#blkn',el),bar=$('#blkp',el);var lines=function(){return ta.value.split('\n').map(function(x){return x.trim()}).filter(Boolean).slice(0,300)};
  var cnt=function(){var L=lines();var w=L.filter(function(x){return bulkParse(x,0).rq}).length;var rest=Math.max(0,l.need-l.n-w);n.textContent=L.length+' '+plural(L.length,'клиент','клиента','клиентов')+', с запросом '+w+' · '+(rest?'для связи нужно еще '+rest:'хватит, чтобы открыть связь с '+l.per+' лидами')};
  ta.addEventListener('input',cnt);
  $('#blkgo',el).addEventListener('click',function(){var L=lines();if(!L.length){toast('Нужен список: одна строка, один клиент','alert');ta.focus();return}var b=this;b.disabled=true;$('span',b).textContent='Загружаем…';bar.hidden=false;S.bulkBusy=true;var ok=0,wr=0,done=0,idx=0;
    var one=function(line,i){var P=bulkParse(line,i);var patch={};if(P.age)patch.age=P.age;if(P.sphere)patch.cells={'business.source':{kind:'fact',v:P.sphere}};
      if(P.rq){var rid='r'+Math.random().toString(36).slice(2,10);patch.requests=[{id:rid,cat:guessCat(P.rq),text:P.rq,status:'open',public:true}];patch.publicText={};patch.publicText[rid]=P.rq}
      var tryA=function(nm,k){return api('client/create',{alias:nm}).then(function(c){ok++;var id=c&&(c.id||(c.card&&c.card.id));if(!id||!Object.keys(patch).length)return;
          return api('client/update',{id:id,patch:patch}).catch(function(){var p2=Object.assign({},patch);delete p2.publicText;delete p2.cells;return api('client/update',{id:id,patch:p2})}).then(function(){if(P.rq)wr++}).catch(function(){})})
        .catch(function(e){if(e.status===409&&k<40)return tryA(P.alias+' '+(k+2),k+1)})};
      return tryA(P.alias,0)};
    var worker=function(){if(idx>=L.length)return Promise.resolve();var i=idx++;return one(L[i],i+1).catch(function(){}).then(function(){done++;$('u',bar).style.width=Math.round(done/L.length*100)+'%';n.textContent='Загружено '+done+' из '+L.length;return worker()})};
    Promise.all([worker(),worker(),worker(),worker(),worker()]).then(function(){S.bulkBusy=false;toast('Загружено '+ok+', с запросом '+wr);
      api('me').then(function(m){if(m&&m.partner)S.me.partner.limits=m.partner.limits}).catch(function(){}).then(function(){closeSheet();var l2=LL();$$('.rdy').forEach(function(e){e.textContent=l2.n+'/'+l2.need;e.hidden=l2.n>=l2.need});toast(l2.n>=l2.need?'Связь открыта: до 3 лидов и кнопка «Связаться с клиентом»':'Загружено '+ok+'. Для связи с лидами нужно еще '+Math.max(0,l2.need-l2.n)+' с запросом');var h=location.hash||'#/fit';if(h.indexOf('#/clients')===0)vClients('clients');else if(h==='#/fit'||h==='#/'){S.keepY=scrollY;vFit()}})})});
}
function guessCat(t){var R=[[/гражданств|паспорт|внж|резидентств/i,'citizenship'],[/дом|вилл|квартир|апартамент|участок|недвиж/i,'realty'],[/час(ы|ов)\b|часовщ/i,'watches'],[/счет|платеж|перевод|валют|банк/i,'finance'],[/pre-?ipo|инвест|доля|акци/i,'preipo'],[/охран|безопасн/i,'security'],[/чекап|клиник|лечени|здоров/i,'health'],[/школ|университет|лагер|пансион|обучен/i,'education'],[/картин|портрет|искусств|коллекц/i,'art'],[/джет|перелет|самолет|вертолет/i,'aviation']];
  for(var k=0;k<R.length;k++)if(R[k][0].test(t)&&CATS[R[k][1]])return R[k][1];return CATS.travel?'travel':Object.keys(CATS)[0]}

function productView(pr,opt){opt=opt||{};pr=pr||{};var e=pr.typicalEarnPerClient||{};
  return '<div class="prod"><div class="card rv stack" style="gap:16px"><span class="kick">'+(opt.kick||'Продукт в сети')+'</span><p class="sum">'+E(pr.summary||'Описание появится после проверки Orbiq')+'</p>'+
  (pr.whoNeeds?'<div class="stack" style="gap:6px"><span class="lbl">Кому нужен</span><p style="margin:0;font-size:15.5px;line-height:1.55">'+E(pr.whoNeeds)+'</p></div>':'')+
  ((pr.fitSignals||[]).length?'<div class="stack" style="gap:8px"><span class="lbl">По каким признакам подбираем клиентов</span><div class="sig">'+pr.fitSignals.map(function(x){return '<span>'+E(x)+'</span>'}).join('')+'</div></div>':'')+
  ((pr.categories||[]).length?'<div class="row">'+pr.categories.map(catChip).join('')+'</div>':'')+(opt.foot||'')+'</div>'+
  '<div class="stack"><div class="card dk spot rv" style="--i:1;display:flex;flex-direction:column;gap:10px"><span class="kick" style="color:var(--dmute)">Типичный доход с одного клиента</span><div class="earn">'+E(range(e))+'</div><p class="hint" style="color:var(--dmute)">Используется для расчета потенциала в подборке</p></div>'+(opt.side||'')+'</div></div>'}
function vProduct(){
  loading('product');
  Promise.all([myProduct(),mySeats()]).then(function(r){var pr=r[0];var st=r[1];
    page('product',hd('Так сеть видит предложение','Мой продукт',btn('Предложить правку','sec','data-a="prodsug"','note'))+
      (pr?productView(pr,{side:seatCard(st,false)}):'<div class="card">'+emptyBox('Карточку продукта готовит Orbiq','Она появится здесь после проверки. Можно сразу прислать описание','<button type="button" class="btn sec" data-a="prodsug">Прислать описание</button>')+'</div>'));
  }).catch(function(e){page('product',errBox(e))});
}

function vStatus(){
  loading('status');var t=ptier();var p=S.me.partner||{};
  Promise.all([S.me.access&&S.me.access['pf.submit']===false?null:api('pf/status').catch(function(){return null}),mySeats(),loadSent()]).then(function(r){var pf=r[0]||{counted:0,of:50,rows:[]};var st=r[1];var of=pf.of||50;var n=pf.counted||0;var sub=pf.status==='submitted'||pf.status==='clarify';
    var L=[['new','Новый партнер','Своя CRM, карточка продукта и подборка клиентов под него'],['basic','Базовый партнер','50 готовых карточек. Сеть открыта, одно обращение в месяц'],['paid','Партнер Orbiq','$20 000 в год. Обращения без лимита, новые запросы первым, 20 семейных приглашений']];
    var idx=t==='networker'?-1:['new','basic','paid'].indexOf(t);
    var ladder=t==='networker'?'<div class="card dk rv stack" style="gap:10px;margin-bottom:16px"><span class="kick" style="color:var(--acc)">Роль</span><h2 style="color:#fff;font-family:var(--s);font-stretch:112%;font-size:34px">Нетворкер</h2><p style="margin:0;color:rgba(244,241,236,.85);max-width:62ch">Нетворкер заносит свою базу, видит сеть и запросы. Своих клиентов передает под продукты сети кнопкой «Передать клиента в сеть», без лимита. Вознаграждение за приведенного клиента по договоренности с Orbiq.</p></div>'
      :'<div class="ladder rv" style="margin-bottom:16px">'+L.map(function(x,i){return '<div class="'+(i===idx?'on':i<idx?'done':'card')+'"><span class="kick">'+(i===idx?'Сейчас':i<idx?'Пройдено':'Шаг '+(i+1))+'</span><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div>'}).join('')+'</div>';
    var prog=t==='new'||t==='networker'?'<div class="card dk spot rv prog50"><span class="kick" style="color:var(--dmute)">Готовых карточек'+(t==='new'?' → «Базовый партнер»':'')+'</span><div class="big"><span id="p50">0</span><small style="color:var(--dmute)">из '+of+'</small></div><div class="bar"><i style="width:'+Math.min(100,Math.round(n/of*100))+'%"></i></div>'+
      (t==='new'?(sub?'<p style="margin:0;color:rgba(244,241,236,.85)">Отправлено на проверку '+E(fmtDate(pf.submittedAt))+'. Orbiq выборочно сверит карточки</p>':'<div class="row">'+btn(n>=of?'Отправить на проверку':'Нужно еще '+(of-n),'pri mag','data-a="pfsend"'+(n>=of?'':' disabled'),'send')+'<a class="link" style="color:var(--dmute)" href="#/new">Добавить клиента</a></div>'):'')+
      '<p class="hint" style="color:var(--dmute)">Готовая карточка: есть капитал с основанием, на чем заработал, запрос, сколько лет знакомы и был ли он клиентом, всего 5 блоков из 6 или больше</p></div>':'';
    var limc=t==='basic'?'<div class="card rv stack" style="--i:2;gap:10px"><span class="kick">Обращения</span><h2>'+E(limText())+'</h2>'+limDots()+'<p class="hint">Предложения сети для клиентов партнера приходят без лимита. Без лимита обращений — статус «Партнер Orbiq»</p></div>':'';
    var paidc=t==='paid'?'<div class="card rv stack" style="--i:2;gap:8px"><span class="kick">Партнер Orbiq</span><div class="ql">'+[['Обращения','Без лимита'],['Новые запросы категории','Первым, остальные через 72 часа'],['Семейные приглашения','20'],['Первый платеж',p.paid&&p.paid.pay1?fmtDate(p.paid.pay1):'—'],['Второй платеж',p.paid&&p.paid.pay2?fmtDate(p.paid.pay2):p.paid&&p.paid.pay2Due?'до '+fmtDate(p.paid.pay2Due):'—']].map(function(x){return '<div><span class="grow">'+x[0]+'</span><b>'+E(x[1])+'</b></div>'}).join('')+'</div></div>':'';
    var rows=(pf.rows||[]).filter(function(x){return !x.ok});
    var list=(pf.rows||[]).length&&(t==='new'||t==='networker')?'<details class="fold rv" style="--i:4;margin-top:16px"><summary>Карточки: готовы '+n+', не готовы '+rows.length+ic('down')+'</summary><div class="pfrows">'+(pf.rows||[]).slice().sort(function(a,b){return a.ok-b.ok}).map(function(r){return '<div class="pfrow"><span class="ic '+(r.ok?'y':'n')+'">'+ic(r.ok?'check':'x')+'</span><b>'+E(r.alias)+'</b><span class="why">'+(r.ok?'Готова':E((r.reasons||[]).join(' · ')))+'</span>'+(String(r.cid).indexOf('d')===0&&DEMO?'<span></span>':'<a class="link" href="#/c/'+E(r.cid)+(r.ok?'':'/add')+'">'+(r.ok?'Открыть':'Дописать')+'</a>')+'</div>'}).join('')+'</div></details>':'';
    var dec=pf.decision?'<div class="card rv" style="margin-bottom:16px;background:'+(pf.decision==='approve'?'rgba(0,135,95,.08)':pf.decision==='reject'?'rgba(194,54,27,.07)':'rgba(245,180,0,.12)')+'"><span class="kick">Решение Orbiq</span><h2 style="margin-top:6px">'+({approve:'Карточки приняты. Статус: базовый партнер',clarify:'Нужно уточнение по выбранной карточке',reject:'Карточки не приняты'}[pf.decision]||'')+'</h2>'+(pf.reason?'<p class="hint">'+E(pf.reason)+'</p>':'')+'</div>':'';
    page('status',hd('Поздравляем с входом в '+E(CAB.name),E(TIER[t]||'Статус'))+ladder+dec+'<div class="grid2" style="align-items:start">'+(prog||'')+(limc||paidc||'')+(t!=='networker'?seatCard(st,false):'')+'</div>'+list,function(){count($('#p50'),0,n,1300)});
  }).catch(function(e){page('status',errBox(e))});
}

/* ---------- владелец: приглашение партнера с карточкой продукта ---------- */
function productEditor(pr,cats){pr=pr||{};var e=pr.typicalEarnPerClient||{};var th={};(pr.categories||cats||[]).forEach(function(x){th[x]=1});
  return '<div class="stack" id="pe"><div class="fld"><label>Суть продукта</label><textarea class="ta" name="summary" style="min-height:80px">'+E(pr.summary||'')+'</textarea></div>'+
  '<div class="fld"><label>Кому нужен</label><textarea class="ta" name="whoNeeds" style="min-height:70px">'+E(pr.whoNeeds||'')+'</textarea></div>'+
  '<div class="fld"><label>Признаки подходящего клиента, через запятую</label><input class="in" name="fitSignals" value="'+E((pr.fitSignals||[]).join(', '))+'"></div>'+
  '<div class="fld"><label>Категории</label><div class="pills" id="pec">'+Object.keys(CATS).map(function(k){return '<button type="button" class="'+(th[k]?'on':'')+'" data-c="'+k+'">'+E(CATS[k])+'</button>'}).join('')+'</div></div>'+
  '<div class="grid2"><div class="fld"><label>Доход с клиента от, $</label><input class="in" name="emin" inputmode="numeric" value="'+E(e.min||'')+'"></div><div class="fld"><label>до, $</label><input class="in" name="emax" inputmode="numeric" value="'+E(e.max||'')+'"></div></div></div>'}
function readEditor(root){var g=function(n){return $('[name="'+n+'"]',root).value.trim()};var th=$$('#pec button.on',root).map(function(b){return b.getAttribute('data-c')});
  return {summary:g('summary'),whoNeeds:g('whoNeeds'),fitSignals:g('fitSignals').split(',').map(function(x){return x.trim()}).filter(Boolean),categories:th,typicalEarnPerClient:{min:+g('emin').replace(/\D/g,'')||0,max:+g('emax').replace(/\D/g,'')||0,currency:'USD'}}}
function bindEditor(root){$('#pec',root).addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(b)b.classList.toggle('on')})}
function inviteSheet2(){
  var kind='supplier',chosen={};
  var el=sheet('<div class="kick">Новый партнер</div><h2>Пригласить партнера</h2><form class="stack" id="pif">'+
   '<div class="grid2"><div class="fld"><label for="pin">Имя</label><input class="in" id="pin" required autocomplete="off"></div><div class="fld"><label for="pie">Почта для входа</label><input class="in" id="pie" type="email" required autocomplete="off"></div></div>'+
   '<div class="fld"><label>Роль</label><div class="roleseg" id="pik"><button type="button" class="on" data-k="supplier"><b>Поставщик</b><small>Свой продукт в сети, подборка клиентов под него</small></button><button type="button" data-k="networker"><b>Нетворкер</b><small>Заносит базу и передает клиентов под продукты сети</small></button></div></div>'+
   '<div class="fld" id="pcats"><label>Направление</label><div class="pills" id="pic">'+Object.keys(CATS).map(function(k){return '<button type="button" data-c="'+k+'">'+E(CATS[k])+'</button>'}).join('')+'</div></div>'+
   '<div class="fld" id="pprod"><label for="pit">Чем занимается партнер</label><div class="cmp-box"><textarea class="ta" id="pit" style="border:0;min-height:150px;border-radius:0" placeholder="Сайт, переписка, заметки: что продает, кому, сколько стоит. Из этого соберем карточку продукта"></textarea><div class="cmp-bar"><label class="btn sm soft">'+ic('upload')+'<span>Загрузить файл</span><input type="file" id="pif2" accept=".txt,.md,.pdf,.docx" hidden></label>'+(SR?'<button type="button" class="btn sm soft" id="pimic">'+ic('mic')+'<span>Диктовать</span></button>':'')+'</div></div></div>'+
   '<p class="err" id="pier" hidden></p><div class="row">'+btn('Собрать карточку продукта','pri','type="submit" id="pigo"','spark')+'</div><p class="hint">Письмо партнеру уходит только после кнопки «Отправить приглашение». Сначала проверка и сохранение карточки продукта</p></form><div id="pires"></div>',true);
  $('#pik',el).addEventListener('click',function(e){var b=e.target.closest('[data-k]');if(!b)return;kind=b.getAttribute('data-k');$$('#pik button',el).forEach(function(x){x.classList.toggle('on',x===b)});$('#pprod',el).hidden=kind!=='supplier';$('#pigo .r span',el)&&($('#pigo',el).innerHTML=ic(kind==='supplier'?'spark':'send')+'<span class="r"><span>'+(kind==='supplier'?'Собрать карточку продукта':'Создать приглашение')+'</span></span>')});
  $('#pic',el).addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(!b)return;var c=b.getAttribute('data-c');chosen[c]=!chosen[c];b.classList.toggle('on',chosen[c])});
  $('#pif2',el).addEventListener('change',function(){var f=this.files[0];this.value='';if(!f)return;readAnyFile(f).then(function(t){var ta=$('#pit',el);ta.value=(ta.value.trim()?ta.value.trim()+'\n\n':'')+String(t).trim();toast('Файл прочитан на устройстве','file')}).catch(function(e){toast(e.message,'alert')})});
  var mic=$('#pimic',el);if(mic)mic.addEventListener('click',function(){micToggle($('#pit',el),mic,function(){})});
  $('#pif',el).addEventListener('submit',function(e){e.preventDefault();stopRec();var n=$('#pin',el).value.trim(),em=$('#pie',el).value.trim(),er=$('#pier',el);var txt=$('#pit',el).value.trim();
    if(!n||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){er.hidden=false;er.innerHTML=ic('alert')+'Нужны имя и корректная почта';return}
    if(kind==='supplier'&&txt.length<20){er.hidden=false;er.innerHTML=ic('alert')+'Нужно описание, чем занимается партнер: хватит пары предложений или файла';return}
    var b=$('#pigo',el);b.disabled=true;
    api('partner/invite',{name:n,email:em,kind:kind,categories:Object.keys(chosen).filter(function(k){return chosen[k]}),productText:kind==='supplier'?txt:undefined,send:false}).then(function(r){
      $('#pif',el).hidden=true;var box=$('#pires',el);
      var sent=function(){box.innerHTML='<div class="stack"><div class="row"><span class="tchk on">'+ic('check')+'</span><b>Приглашение отправлено</b></div>'+linkBox(r.link,'Письмо со ссылкой ушло на '+em+'. Ссылку можно отправить и своим каналом. Действует до '+fmtDate(r.expires))+'</div>';if($('#main')&&location.hash.indexOf('partners')>0)vPartners()};
      var fin=function(){box.innerHTML='<div class="stack"><div class="row"><span class="tchk on">'+ic('check')+'</span><b>'+(kind==='supplier'?'Карточка продукта сохранена':'Нетворкер добавлен')+'</b></div><p class="hint">Письмо партнеру еще не отправлено. Отправить можно сейчас или позже из раздела «Партнеры», меню «…» у партнера</p><div class="row">'+btn('Отправить приглашение','pri mag','id="pisend"','send')+btn('Позже','soft','id="pilater"')+'</div></div>';if($('#main')&&location.hash.indexOf('partners')>0)vPartners();
        $('#pilater',box).addEventListener('click',function(){closeSheet()});
        $('#pisend',box).addEventListener('click',function(){var bt=this;bt.disabled=true;api('partner/reinvite',{pid:r.pid}).then(function(x){r.link=x.link;r.expires=x.expires;sent()}).catch(function(e2){bt.disabled=false;toast(e2.message,'alert')})})};
      if(kind!=='supplier'){fin();return}
      box.innerHTML='<div class="stack"><div class="kick">Шаг 2 из 2 · проверка</div><h3 style="font-family:var(--s);font-stretch:112%;font-size:26px;font-weight:600;margin:0">Карточка продукта «'+E(n)+'»</h3>'+productEditor(r.product,Object.keys(chosen).filter(function(k){return chosen[k]}))+'<div class="row">'+btn('Сохранить карточку продукта','pri','id="pesave"','check')+'<span class="hint">Партнер увидит ее при первом входе</span>'+'</div></div>';
      bindEditor(box);
      $('#pesave',box).addEventListener('click',function(){var pr=readEditor(box);if(!pr.summary){toast('Нужна суть продукта','alert');return}this.disabled=true;api('partner/product',{pid:r.pid,product:pr}).then(function(){fin()}).catch(function(e2){this.disabled=false;toast(e2.message,'alert')}.bind(this))});
    }).catch(function(e2){b.disabled=false;er.hidden=false;er.innerHTML=ic('alert')+E(e2.message)})});
}
function productSheet(pid){var p=(S.partners||[]).find(function(x){return x.id===pid})||{};
  var el=sheet('<div class="kick">'+E(p.name||'Партнер')+'</div><h2>Карточка продукта</h2>'+productEditor(p.product,p.categories)+'<div class="row">'+btn('Сохранить','pri','id="pesave"','check')+'</div>',true);bindEditor(el);
  $('#pesave',el).addEventListener('click',function(){var pr=readEditor(el);api('partner/product',{pid:pid,product:pr}).then(function(){closeSheet();toast('Карточка продукта сохранена');vPartners()}).catch(function(e){toast(e.message,'alert')})})}

/* ================= Founder: страница партнера ================= */
var HKIND={product:'Карточка продукта',profile:'Имя и направления'};
function histSum(h){var a=h.after||{},b=h.before||{};if(h.kind==='product'){var t=(a.summary||'').slice(0,140);return t?E(t)+(a.summary&&a.summary.length>140?'…':''):'Пустая карточка'}
  var ch=[];if(a.name!==b.name)ch.push('Имя: '+E(b.name||'—')+' → '+E(a.name||'—'));if(JSON.stringify(a.categories)!==JSON.stringify(b.categories))ch.push('Направления: '+E((a.categories||[]).map(function(c){return CATS[c]||c}).join(', ')||'—'));return ch.join('<br>')||'Без изменений'}
function vPartner(args){var pid=(args||[])[0];loading('partners');
  return api('partner/get',null,{pid:pid}).then(function(d){var p=d.partner,H=d.history||[];var th={};(p.categories||[]).forEach(function(c){th[c]=1});
    var iv=p.invite||{};var invTxt=iv.status==='draft'?'Приглашение не отправлено':iv.status==='created'?'Ссылка действует до '+fmtDate(iv.expires):iv.status==='expired'?'Ссылка истекла':iv.status==='used'||p.activated?'Партнер вошел в кабинет':'—';
    page('partners','<a class="back" href="#/partners">'+ic('al')+'Партнеры</a>'+hd(E(p.email),E(p.name),(iv.status==='draft'?btn('Отправить приглашение','pri mag','data-a="preinv" data-p="'+E(p.id)+'"','send'):iv.status!=='used'&&!p.activated?btn('Выдать ссылку заново','soft','data-a="preinv" data-p="'+E(p.id)+'"','redo'):''))+
      '<div class="pg2"><div class="stack">'+
      '<section class="panel"><div class="kick">Профиль</div><div class="stack" id="ppf"><div class="grid2"><div class="fld"><label>Имя</label><input class="in" name="pname" value="'+E(p.name)+'"></div><div class="fld"><label>Почта для входа</label><input class="in" value="'+E(p.email)+'" readonly></div></div>'+
      '<div class="fld"><label>Направления</label><div class="pills" id="ppc">'+Object.keys(CATS).map(function(k){return '<button type="button" class="'+(th[k]?'on':'')+'" data-c="'+k+'">'+E(CATS[k])+'</button>'}).join('')+'</div></div>'+
      '<div class="row">'+btn('Сохранить профиль','soft','id="ppsave"','check')+'<span class="hint">'+E(invTxt)+' · клиентов: '+(p.clients||0)+'</span></div></div></section>'+
      (p.kind==='networker'?'':'<section class="panel"><div class="kick">Карточка продукта</div><div id="ppe">'+productEditor(p.product,p.categories)+'</div><div class="row" style="margin-top:14px">'+btn('Сохранить карточку','pri','id="pesave2"','check')+'<span class="hint">Прежняя версия сохранится в истории</span></div></section>')+
      '</div><aside class="panel"><div class="kick">История версий · '+H.length+'</div>'+(H.length?'<ol class="hist">'+H.map(function(h){return '<li><div class="row" style="justify-content:space-between;gap:8px"><b>'+E(HKIND[h.kind]||h.kind)+'</b><span class="mu" style="font-family:var(--m);font-size:11px">'+E(fmtDate(h.at))+' '+E(String(h.at).slice(11,16))+'</span></div><p class="hint" style="margin:4px 0 6px">'+histSum(h)+(h.note?'<br><i>'+E(h.note)+'</i>':'')+'</p>'+(h.before?'<button type="button" class="lnk" data-a="prest" data-p="'+E(p.id)+'" data-i="'+h.i+'">Вернуть версию до этой правки</button>':'')+'</li>'}).join('')+'</ol>':'<p class="hint">Правок пока не было. Каждое сохранение появится здесь, любую версию можно вернуть</p>')+'</aside></div>',
    function(m){
      $('#ppc',m).addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(b)b.classList.toggle('on')});
      $('#ppsave',m).addEventListener('click',function(){var bt=this;bt.disabled=true;api('partner/update',{pid:p.id,name:$('[name="pname"]',m).value,categories:$$('#ppc button.on',m).map(function(b){return b.getAttribute('data-c')})}).then(function(){toast('Профиль сохранен');vPartner([p.id])}).catch(function(e){bt.disabled=false;toast(e.message,'alert')})});
      var pe=$('#ppe',m);if(pe){bindEditor(pe);$('#pesave2',m).addEventListener('click',function(){var bt=this;var pr=readEditor(pe);if(!pr.summary){toast('Нужна суть продукта','alert');return}bt.disabled=true;api('partner/product',{pid:p.id,product:pr}).then(function(){toast('Карточка сохранена');vPartner([p.id])}).catch(function(e){bt.disabled=false;toast(e.message,'alert')})})}
    });
  });
}

/* ================= Маршруты и запуск ================= */
var ROUTES={mine:function(){return vClients('mine')},fit:vFit,product:vProduct,status:vStatus,clients:function(){return vClients('clients')},'new':vNew2,c:vCard,plans:vPlans,requests:vRequests,notify:vNotify,
  partners:vPartners,partner:vPartner,help:vHelp,inbox:vInbox,catalog:vCatalog,reviews:vReviews,archive:vArchive,audit:vAudit};
var OWNER_ONLY={partner:1,partners:1,inbox:1,reviews:1,archive:1,audit:1,catalog:1,mine:1};
function render(){
  stopRec();closeSheet();
  if(S.me&&S.me.needKey)return vKey();if(!S.me||!S.me.role)return vLogin();
  var h=location.hash.replace(/^#\/?/,'').split('?')[0];var parts=h.split('/').filter(Boolean);
  var r=parts[0];if(!r||r==='login'){location.replace('#/'+(isOwner()?'partners':ptier()==='networker'?'clients':'fit'));return}
  if(gated(r))return vGate(r);
  if(OWNER_ONLY[r]&&!isOwner())r='clients';if(r==='plans'&&isOwner())r='mine';
  if(r==='demand'||r==='portfolio'||r==='tariff')r=isOwner()?'mine':(r==='demand'?'fit':'status');
  if((r==='fit'||r==='product')&&ptier()==='networker')r='clients';
  if(r!=='fit'&&document.body.classList.contains('focus'))leaveFocus();
  var fn=ROUTES[r]||vClients;
  try{var p=fn(parts.slice(1));if(p&&p.catch)p.catch(function(e){page(r,errBox(e))})}catch(e){console.error(e);page(r,errBox(e))}
}
function boot(to){
  return api('me').then(function(m){S.me=m;
    if(m&&m.role&&!m.needKey){if(!$('#root .app'))$('#root').innerHTML='';if(to)location.hash=to;else if(!location.hash||location.hash==='#/login')location.hash='#/'+(m.owner?'partners':(m.partner&&m.partner.kind==='networker'?'clients':'fit'))}
    render();
    if(m.role==='partner'&&!m.needKey&&(Q.get('onb')==='1'||Q.get('welcome')==='1'||(!DEMO&&localStorage.getItem('oc_tour')!=='1'))){if(Q.get('onb')==='1'){try{localStorage.removeItem('oc_ltour')}catch(e){}}if(Q.get('onb')==='1')localStorage.removeItem('oc_tour');var tg=ptier()==='networker'?'#/clients':'#/fit';if(location.hash!==tg)location.hash=tg;else render()}
  }).catch(function(){S.me={role:null};render()});
}
window.addEventListener('hashchange',function(){S.viewAs='own';render()});
// вкладки карточки переключаются на месте: без перерисовки страницы и без прыжка наверх
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('nav.tabs a[data-tab]');if(!a||!S.card||!$('#tabc'))return;e.preventDefault();
  history.replaceState(null,'',a.getAttribute('href'));[].forEach.call(a.parentNode.children,function(x){x.classList.toggle('on',x===a)});renderTab(S.card,a.getAttribute('data-tab'))},true);
if(DEMO){var dm=document.createElement('div');dm.className='demo';dm.innerHTML='Демо <select aria-label="Роль">'+[['owner','Founder'],['new','Новый партнер'],['basic','Базовый партнер'],['paid','Партнер Orbiq'],['networker','Нетворкер'],['login','Вход'],['key','Пароль Founder']].map(function(o){return '<option value="'+o[0]+'"'+(Demo.as()===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>';document.body.appendChild(dm);dm.querySelector('select').addEventListener('change',function(){var u=new URL(location.href);u.searchParams.set('as',this.value);u.hash='';location.href=u.toString()})}
boot();
})();

