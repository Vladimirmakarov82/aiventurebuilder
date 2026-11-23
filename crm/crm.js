/* Orbiq CRM · кабинет партнера и владельца. Чистый JS, без сборщика.
   Контракт: /crm/CONTRACT.md. Демо без сервера: /crm/?demo=1&as=paid|trial|candidate|owner|login|key */
(function(){
'use strict';

/* ================= Утилиты ================= */
var Q=new URLSearchParams(location.search);
var DEMO=Q.get('demo')==='1';
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
var TIER={candidate:'Кандидат',trial:'Пробный',paid:'Платный'};
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
function btn(label,cls,attrs,icon){return '<button '+(/type=/.test(attrs||'')?'':'type="button" ')+'class="btn '+(cls||'')+'" '+(attrs||'')+'>'+(icon?ic(icon):'')+'<span class="r"><span>'+label+'</span><span aria-hidden="true">'+label+'</span></span></button>'}

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
      if(!res.ok){var e=new Error(data.error||'Сервер не ответил. Попробуйте еще раз');e.status=res.status;e.data=data;
        if(res.status===401&&r!=='me'&&r.indexOf('auth/')!==0){S.me=null;location.hash='#/login'}
        throw e}
      return adapt(r,data)})});
}
/* Приведение ответов сервера к форме, с которой работает интерфейс */
var AUDL={owner_login:'Вход владельца',partner_invite:'Приглашение партнера',partner_reinvite:'Новая ссылка партнеру',partner_revoke:'Отзыв приглашения',partner_activated:'Партнер вошел впервые',partner_suspend:'Приостановка партнера',partner_tier:'Смена тарифа',payment:'Платеж',rq_create:'Отправка обращения',note_forward:'Заметка передана в Orbiq',rq_send:'Пересылка обращения',rq_status:'Статус обращения',intro_use:'Знакомство засчитано',pf_submit:'Портфель на проверку',pf_decide:'Решение по карточке',pf_extend:'Расширение выборки',pf_final:'Решение по портфелю',client_archive:'Архивирование',client_link:'Связь карточек',client_primary:'Основной партнер',family_invite_create:'Приглашение семьи',family_invite_revoke:'Отзыв приглашения семьи',family_invite_activate:'Активация приглашения семьи',catalog_upsert:'Правка каталога'};
function at0(x){return x&&typeof x==='object'?x.at:x}
function msgs(l){return (l||[]).map(function(m){return Object.assign({},m,{attach:m.attach||(m.attachIds||[])[0]})})}
function adapt(r,d){
  if(!d||typeof d!=='object')return d;
  switch(r){
  case 'me':if(d.role==='owner'){d.partner={id:'owner',name:'Владелец',tier:'paid',suspended:false,tg:d.tg||{connected:false}}}
    else if(d.partner&&d.partner.paid){var pd=d.partner.paid;pd.pay1=at0(pd.pay1);pd.pay2=at0(pd.pay2)}return d;
  case 'clients':return (d.rows||[]).map(function(x){if(x.partner)x.ownerName=x.partner.name;if(!x.archivedAt&&x.archived)x.archivedAt=x.updated;return x});
  case 'client/get':if(d.partner)d.ownerName=d.partner.name;return d;
  case 'client/extract':(d.proposals||[]).forEach(function(p){if(p.conflict&&typeof p.conflict==='object')p.conflict=p.conflict.current});
    d.contradictions=(d.contradictions||[]).map(function(x){return typeof x==='string'?x:(x.q||cellQ(x.cell))+': '+(x.values||[]).join(' / ')+(x.note?' · '+x.note:'')});return d;
  case 'note/list':return d.notes||[];
  case 'task/list':return d.tasks||[];
  case 'demand':return d.demand||[];
  case 'audit':return (d.audit||[]).map(function(a){return Object.assign({},a,{who:a.who==='owner'?'Владелец':a.who,action:AUDL[a.action]||a.action,obj:a.obj&&typeof a.obj==='object'?Object.keys(a.obj).map(function(k){return k+': '+a.obj[k]}).join(' · '):a.obj})});
  case 'partners':return (d.partners||[]).map(function(p){if(p.paid){p.paid.pay1=at0(p.paid.pay1);p.paid.pay2=at0(p.paid.pay2)}return p});
  case 'seat/list':if(d.seats&&!Array.isArray(d.seats))return Object.keys(d.seats).map(function(k){var x=d.seats[k];return {cat:k,max:2,seats:x.taken||[],waitlist:x.wait||[]}});return d;
  case 'rq/mine':(d.sent||[]).concat(d.inbox||[]).forEach(function(x){x.at=x.at||x.created;x.thread=msgs(x.thread)});return d;
  case 'rq/all':return (d.rqs||[]).map(function(x){x.at=x.at||x.created;x.cardOwner=x.cardOwner&&typeof x.cardOwner==='object'?x.cardOwner:(x.owner||{});return x});
  case 'rq/get':case 'rq/send':if(r==='rq/send')return d;var q=d.rq||d;q.at=q.at||q.created;q.cardOwner=q.owner||{};q.initiator=q.initiator||{name:'Orbiq'};
    q.attachment=(q.attachments||[]).find(function(a){return a.from==='initiator'})||null;q.threads={initiator:msgs((q.threads||{}).initiator),cardOwner:msgs((q.threads||{}).cardOwner)};return q;
  case 'pf/all':return d.portfolios||[];
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
  var AS=Q.get('as')||'paid';
  var d0=new Date();function day(n,h,m){var d=new Date();d.setDate(d.getDate()+n);d.setHours(h==null?12:h,m||0,0,0);return d.toISOString()}
  var P={
    p_irina:{id:'p_irina',name:'Ирина Лебедева',email:'irina@example.com',tier:'paid',suspended:false,categories:['watches'],tg:{connected:true,on:{msg:true,status:true,remind:true}},trial:{start:day(-120),end:day(-30),quota:3,used:2},paid:{seats:['watches'],pay1:day(-28),pay2Due:day(62)},clients:4,lastSeen:day(0,9),invite:{status:'used'}},
    p_mark:{id:'p_mark',name:'Марк Орлов',email:'mark@example.com',tier:'trial',suspended:false,categories:['citizenship'],tg:{connected:false,on:{}},trial:{start:day(-20),end:day(70),quota:3,used:1},paid:null,clients:3,lastSeen:day(-1,18),invite:{status:'used'}},
    p_oleg:{id:'p_oleg',name:'Олег Смирнов',email:'oleg@example.com',tier:'candidate',suspended:false,categories:['realty'],tg:{connected:false,on:{}},trial:null,paid:null,clients:2,lastSeen:day(-2,11),invite:{status:'used'}},
    p_vera:{id:'p_vera',name:'Вера Ким',email:'vera@example.com',tier:'paid',suspended:false,categories:['art'],tg:{connected:true,on:{msg:true}},trial:null,paid:{seats:['art'],pay1:day(-60),pay2Due:day(30),pay2:null},clients:2,lastSeen:day(-3,10),invite:{status:'used'}},
    p_sasha:{id:'p_sasha',name:'Александр Белов',email:'alex@example.com',tier:'candidate',suspended:false,categories:['aviation'],tg:{connected:false,on:{}},clients:0,lastSeen:null,invite:{status:'created',expires:day(5)}}
  };
  var ME={owner:'own',paid:'p_irina',trial:'p_mark',candidate:'p_oleg'}[AS];
  function cl(o){return Object.assign({created:day(-40),updated:day(-2),archived:false,cells:{},relation:{},capitalBasis:'',plan:[],history:[],publicText:{},interests:[],requests:[],kids:null,investing:''},o)}
  function cells(m){var r={};Object.keys(m).forEach(function(k){var v=m[k];r[k]={v:v[0],kind:v[1]||'fact',src:'manual',at:day(-10)}});return r}
  var C={
    c_atlas:cl({id:'c_atlas',owner:'p_irina',alias:'Атлас',age:'55–64',capital:'10–25',kids:2,investing:'active',interests:['Часы','Архитектура','Яхтинг'],
      requests:[{id:'r1',cat:'citizenship',text:'Второе гражданство в Европе для всей семьи, сроки важны',status:'open',at:day(-12),public:true},{id:'r2',cat:'realty',text:'Дом у моря в Испании, рядом с хорошей школой',status:'open',at:day(-6),public:true}],
      publicText:{r1:'Второе гражданство в Европе для семьи'},
      cells:cells({'about.age':['55–64'],'about.region':['Поволжье, большой город'],'about.places':['Дубай зимой, Альпы на Рождество'],'business.source':['Строительство, 2000-е'],'business.now':['Девелопмент жилых кварталов'],'family.circle':['Отдыхает с супругой и младшим сыном'],'family.kids':['Двое детей, 14 и 19 лет'],'interests.time':['Яхтинг в Средиземном море'],'interests.subject':['Независимые часовщики, ручная отделка'],'prefs.style':['Голосовые сообщения вечером','hypothesis'],'plans.asked':['Гражданство для семьи'],'plans.next':['Купить дом в Испании до лета'],'prefs.no':['Без шумных мероприятий'],'family.gift':['','na']}),
      relation:{role:'Клиент по часам',lastContact:'2026-10',topic:'Часы к юбилею'},capitalBasis:'Доля в девелоперской компании, оценка по открытой отчетности',
      history:[{at:day(-40),what:'Карточка создана'},{at:day(-12),what:'Добавлен запрос: гражданство'},{at:day(-3),what:'Добавлены два интереса'}]}),
    c_sokol:cl({id:'c_sokol',owner:'p_irina',alias:'Сокол',age:'45–54',capital:'3–10',kids:1,investing:'sometimes',interests:['Авиация','Гольф'],
      requests:[{id:'r3',cat:'aviation',text:'Джет-карта на зимний сезон',status:'open',at:day(-4),public:true}],
      cells:cells({'about.age':['45–54'],'business.source':['Логистика'],'interests.time':['Гольф по выходным'],'plans.asked':['Перелеты частным бортом']}),relation:{role:'Друг семьи',lastContact:'2026-11',topic:'Перелеты'}}),
    c_lira:cl({id:'c_lira',owner:'p_irina',alias:'Лира',age:'65+',capital:'25–100',kids:3,investing:'no',interests:['Искусство','Опера','Сады'],
      requests:[{id:'r4',cat:'art',text:'Семейный портрет у современного художника',status:'open',at:day(-9),public:true},{id:'r5',cat:'health',text:'Комплексный чекап в Европе',status:'open',at:day(-2),public:true}],
      publicText:{r4:'Семейный портрет у современного художника'},
      cells:cells({'about.age':['65+'],'about.region':['Москва и Подмосковье'],'about.places':['Флоренция каждую весну'],'business.source':['Фармдистрибуция'],'family.circle':['С дочерью'],'family.kids':['Трое взрослых детей, пятеро внуков'],'interests.time':['Опера, сады'],'interests.subject':['Итальянская живопись'],'interests.memory':['Закрытая экскурсия по Уффици'],'prefs.formats':['Камерные события'],'plans.asked':['Портрет'],'plans.timing':['К юбилею в марте']}),relation:{role:'Давняя клиентка',lastContact:'2026-09',topic:'Подарок внучке'}}),
    c_borey:cl({id:'c_borey',owner:'p_irina',alias:'Борей',age:'35–44',capital:'1–3',kids:0,investing:'active',interests:['Технологии'],requests:[{id:'r6',cat:'finance',text:'Счет в швейцарском банке',status:'closed',at:day(-30),public:true}]}),
    c_granit:cl({id:'c_granit',owner:'p_mark',alias:'Гранит',age:'55–64',capital:'10–25',kids:2,investing:'active',interests:['Часы','Охота'],requests:[{id:'r7',cat:'watches',text:'Редкие независимые часы к 60-летию',status:'open',at:day(-5),public:true}],publicText:{r7:'Редкие независимые часы к юбилею'},cells:cells({'about.age':['55–64'],'interests.subject':['Часы ручной сборки']}),relation:{role:'Клиент по ВНЖ',lastContact:'2026-11',topic:'Португалия'}}),
    c_kedr:cl({id:'c_kedr',owner:'p_mark',alias:'Кедр',age:'45–54',capital:'3–10',kids:1,investing:'sometimes',interests:['Горы','Образование'],requests:[{id:'r8',cat:'education',text:'Летний лагерь в Швейцарии для дочери 12 лет',status:'open',at:day(-3),public:true}],publicText:{r8:'Летний лагерь в Швейцарии для ребенка'}}),
    c_neptun:cl({id:'c_neptun',owner:'p_vera',alias:'Нептун',age:'45–54',capital:'25–100',kids:2,investing:'active',interests:['Яхты','Вино'],requests:[{id:'r9',cat:'realty',text:'Вилла на Сардинии',status:'open',at:day(-8),public:true},{id:'r10',cat:'watches',text:'Часы к рождению внука',status:'open',at:day(-1),public:true}],publicText:{r9:'Вилла на побережье Италии',r10:'Часы к рождению внука'}}),
    c_orion:cl({id:'c_orion',owner:'p_oleg',alias:'Орион',age:'55–64',capital:'3–10',kids:2,investing:'no',interests:['Рыбалка'],requests:[{id:'r11',cat:'security',text:'Охрана для поездок',status:'open',at:day(-2),public:true}]}),
    c_tigr:cl({id:'c_tigr',owner:'p_oleg',alias:'Тигр',age:'45–54',capital:'10–25',kids:3,investing:'active',interests:['Охота','Авто'],requests:[{id:'r12',cat:'aviation',text:'Вертолет для охоты',status:'open',at:day(-2),public:true}],publicText:{r12:'Вертолет на сезон'}}),
    c_vega:cl({id:'c_vega',owner:'p_oleg',alias:'Вега',archived:true,archivedAt:day(-6),age:'45–54',capital:'1–3',kids:1,investing:'no',interests:['Йога'],requests:[]})
  };
  var NOTES={'p_irina/c_atlas':[{id:'n1',text:'Удобно звонить после 19:00. Про гражданство говорит охотно, про бизнес коротко.',at:day(-5)}],'p_irina/c_granit':[{id:'n2',text:'Возможно, знаком с Атласом по яхт-клубу. Уточнить осторожно.',at:day(-2)}]};
  var TASKS={p_irina:[{id:'t1',cid:'c_atlas',title:'Позвонить Атласу про гражданство',due:day(0,18),tz:'Europe/Moscow',remind:30,done:false},{id:'t2',cid:'c_lira',title:'Отправить Лире подборку к юбилею',due:day(2,11),tz:'Europe/Moscow',remind:60,done:false},{id:'t3',cid:'c_sokol',title:'Уточнить даты перелетов у Сокола',due:day(-3,12),tz:'Europe/Moscow',remind:0,done:false},{id:'t4',title:'Разобрать подборку недели',due:day(5,10),tz:'Europe/Moscow',remind:0,done:false}]};
  var RQ={
    rq1:{id:'rq1',status:'clarify',at:day(-2,14),initiator:'p_irina',cid:'c_granit',requestId:'r7',offer:'Подбор независимого часовщика: два варианта с ручной отделкой до Нового года',terms:'10% от сделки',attachment:null,threads:{initiator:[{id:'m1',from:'initiator',text:'Предлагаю подобрать часы у независимого мастера. Есть два варианта.',at:day(-2,14)},{id:'m2',from:'orbiq',text:'Уточните, есть ли у вас прямой доступ к мастерским в Женеве?',at:day(-1,10)}],cardOwner:[]},deal:null},
    rq2:{id:'rq2',status:'new',at:day(0,9,40),initiator:'p_mark',cid:'c_atlas',requestId:'r1',offer:'Гражданство Мальты под ключ: сопровождение семьи, банк, школа',terms:'$5 000 комиссия партнеру после одобрения',attachment:{id:'a1',name:'malta-program.pdf',size:'1,2 МБ'},threads:{initiator:[{id:'m3',from:'initiator',text:'Готов взять семью на сопровождение. Сроки от 6 месяцев.',at:day(0,9,40),attach:'a1'}],cardOwner:[]},deal:null},
    rq3:{id:'rq3',status:'passed',at:day(-6,12),initiator:'p_vera',cid:'c_sokol',requestId:'r3',offer:'Джет-карта у брокера с фиксированной ценой часа',terms:'5% от суммы карты',attachment:null,threads:{initiator:[{id:'m4',from:'initiator',text:'Есть брокер с фиксированной ценой часа на зиму.',at:day(-6,12)},{id:'m5',from:'orbiq',text:'Передали владельцу клиента. Ждем ответа.',at:day(-5,10)}],cardOwner:[{id:'m6',from:'orbiq',text:'Для вашего клиента «Сокол» есть предложение по джет-карте. Фиксированная цена часа на зиму. Обсудите с клиентом?',at:day(-5,10)},{id:'m7',from:'cardOwner',text:'Да, клиент готов посмотреть условия.',at:day(-4,16)}]},deal:{payer:'Брокер',amount:'',percent:'5',basis:'Сумма джет-карты',received:false}},
    rq4:{id:'rq4',status:'closed',at:day(-20,12),initiator:'p_irina',cid:'c_neptun',requestId:'r10',offer:'Часы к рождению внука: гравировка даты',terms:'8%',attachment:null,threads:{initiator:[{id:'m8',from:'orbiq',text:'Клиент выбрал другой вариант. Спасибо за предложение.',at:day(-14,10)}],cardOwner:[]},deal:null}
  };
  var PF={
    p_oleg:{status:'draft',submittedAt:null,sample:[],decision:null},
    p_mark:{status:'submitted',submittedAt:day(-1,12),sample:['c_granit','c_kedr'],decisions:{c_granit:{exists:'yes',relation:'yes',capital:'',reason:'Публичная биография и переписка'}},decision:null}
  };
  var AUD=[
    {who:'Владимир',role:'owner',action:'Вход владельца',obj:'—',at:day(0,9,12),status:'ok'},
    {who:'Марк Орлов',role:'partner',action:'Отправка обращения',obj:'rq2',at:day(0,9,40),status:'ok'},
    {who:'Владимир',role:'owner',action:'Пересылка обращения',obj:'rq3 → владельцу карточки',at:day(-5,10),status:'ok'},
    {who:'Владимир',role:'owner',action:'Платеж 1',obj:'Ирина Лебедева · $10 000',at:day(-28,15),status:'ok'},
    {who:'Владимир',role:'owner',action:'Смена тарифа',obj:'Ирина Лебедева → Платный',at:day(-28,15),status:'ok'},
    {who:'Олег Смирнов',role:'partner',action:'Архивирование',obj:'c_vega',at:day(-6,11),status:'ok'},
    {who:'Владимир',role:'owner',action:'Приглашение партнера',obj:'Александр Белов',at:day(-2,17),status:'ok'}
  ];
  var MATCH={
    c_atlas:{items:[
      {itemId:'roger-w-smith-isle-of-man',title:'Мастерская Роджера Смита на острове Мэн',why:'Связано с фактом: «Независимые часовщики, ручная отделка»',deliver:'Частный визит в мастерскую и очередь на заказ',confirmBy:'Orbiq, до 15 декабря'},
      {itemId:'mille-miglia-centenary',title:'Столетие гонки Mille Miglia',why:'Связано с интересом: яхтинг и техника',deliver:'Место в команде сопровождения на маршруте',confirmBy:'Организатор, заявки до 20 января'},
      {itemId:'japan-akiya-bank',title:'Дом с историей у моря',why:'Связано с запросом: «Дом у моря в Испании»',deliver:'Подборка из трех домов с проверкой юристом',confirmBy:'Партнер по недвижимости'}],
     questions:[
      {id:'q1',text:'Атлас, вы как-то рассказывали, что любите независимых часовщиков. Я вспомнил об этом, когда увидел, что мастерская на острове Мэн открывает очередь. До 15 декабря можно записаться на частный визит, все оформляется через Orbiq. Вам было бы интересно?',basis:'Факт: «Независимые часовщики, ручная отделка»',itemId:'roger-w-smith-isle-of-man',date:day(1),deadline:day(22),bucket:'now',kind:'offer'},
      {id:'q2',text:'Атлас, вы говорили, что хотите дом у моря в Испании до лета. Я увидел подборку домов рядом с хорошими школами. До конца января можно посмотреть три варианта, юрист проверит документы. Вам было бы интересно?',basis:'План: «Купить дом в Испании до лета»',itemId:'japan-akiya-bank',date:day(3),deadline:day(60),bucket:'now',kind:'offer'},
      {id:'q3',text:'Атлас, вы упоминали девелопмент. Вам сейчас интересна эта отрасль как личный проект или только как бизнес?',basis:'Уточнение: «Девелопмент жилых кварталов»',date:day(6),deadline:day(30),bucket:'now',kind:'clarify'},
      {id:'q4',text:'Атлас, как вам удобнее обсуждать варианты: голосом вечером или короткой подборкой в мессенджере?',basis:'Догадка: «Голосовые сообщения вечером»',date:day(14),deadline:day(45),bucket:'later',kind:'clarify'},
      {id:'q5',text:'Обсудили гражданство для семьи',basis:'Запрос: гражданство',date:day(-8),deadline:day(-1),bucket:'done',kind:'offer'}]}
  };
  var DEMAND={realty:{count:7,examples:[{text:'Дом у моря в Испании, рядом со школой',age:'55–64',capital:'10–25',when:'до лета'},{text:'Вилла на побережье Италии',age:'45–54',capital:'25–100',when:'в течение года'},{text:'Квартира в Дубае для сдачи',age:'35–44',capital:'3–10',when:'1–3 месяца'}]},
    aviation:{count:3,examples:[{text:'Джет-карта на зимний сезон',age:'45–54',capital:'3–10',when:'до декабря'}]}};
  var ICAL=null;

  function meP(){return P[ME]}
  function isOwner(){return AS==='owner'}
  function net(){if(isOwner())return true;var p=meP();return p&&!p.suspended&&(p.tier==='trial'||p.tier==='paid')}
  function view(c){return {id:c.id,alias:c.alias,age:c.age,capital:c.capital,kids:c.kids,investing:c.investing,interests:c.interests.slice(),requests:c.requests.filter(function(r){return r.status==='open'&&r.public}).map(function(r){return {id:r.id,cat:r.cat,text:c.publicText[r.id]||''}}),mine:false}}
  function full(c){var o=clone(c);o.mine=c.owner===ME;if(isOwner()){o.ownerName=(P[c.owner]||{}).name}return o}
  function nextTask(cid){var t=(TASKS[ME]||[]).filter(function(t){return t.cid===cid&&!t.done}).sort(function(a,b){return a.due<b.due?-1:1})[0];return t?{title:t.title,due:t.due}:null}
  function filt(list,q){return list.filter(function(c){
    if(q.q&&norm(c.alias).indexOf(norm(q.q))<0)return false;
    if(q.cat&&!c.requests.some(function(r){return r.cat===q.cat&&r.status==='open'}))return false;
    if(q.interest&&c.interests.indexOf(q.interest)<0)return false;
    if(q.capital&&c.capital!==q.capital)return false;
    if(q.investing&&c.investing!==q.investing)return false;return true})}
  var FREE=['Атлас','Сириус','Полярис','Вектор','Мистраль','Кассиопея','Аврора','Зенит'];
  function aliasTaken(a,except){var n=norm(a);return Object.keys(C).some(function(k){return k!==except&&norm(C[k].alias)===n})}
  function freeName(){return FREE.find(function(f){return !aliasTaken(f)})||'Сириус'}
  function own(id){var c=C[id];if(!c||c.archived||c.owner!==ME)fail(404,'Карточка не найдена');return c}
  function needOwner(){if(!isOwner())fail(403,'Нет доступа')}
  function audit(a,o){AUD.unshift({who:isOwner()?'Владимир':meP().name,role:isOwner()?'owner':'partner',action:a,obj:o,at:nowISO(),status:'ok'})}
  function rqView(r,forOwner){var c=C[r.cid]||{};var req=(c.requests||[]).find(function(x){return x.id===r.requestId})||{};
    var o={id:r.id,status:r.status,at:r.at,cid:r.cid,alias:c.alias,request:{cat:req.cat,text:(c.publicText||{})[req.id]||req.text},offer:r.offer,terms:r.terms,attachment:r.attachment};
    if(forOwner){o.initiator={id:r.initiator,name:(P[r.initiator]||{}).name};o.cardOwner={id:c.owner,name:(P[c.owner]||{}).name};o.threads=r.threads;o.deal=r.deal}
    return o}

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
    if(AS==='key'&&r==='me')return {role:null,needKey:true};
    switch(r){
    case 'me':if(isOwner())return {role:'owner',owner:true,partner:{id:'own',name:'Владимир',tier:'paid',suspended:false,tg:{connected:true}}};
      var p=meP();return {role:'partner',owner:false,partner:{id:p.id,name:p.name,tier:p.tier,suspended:p.suspended,trial:p.trial,paid:p.paid,categories:p.categories,tg:{connected:p.tg.connected,on:p.tg.on}}};
    case 'auth/request':return {ok:true,test_link:'#/clients'};
    case 'auth/owner-key':if(String(b.key||'').length<4)fail(401,'Ключ не подошел');AS='owner';ME='own';return {ok:true};
    case 'auth/logout':return {ok:true};
    case 'clients':{
      var sc=q.scope||'mine';
      if(sc==='archive'){needOwner();return Object.keys(C).map(function(k){return C[k]}).filter(function(c){return c.archived}).map(function(c){return {id:c.id,alias:c.alias,ownerName:P[c.owner].name,archivedAt:c.archivedAt,age:c.age,capital:c.capital}})}
      var all=Object.keys(C).map(function(k){return C[k]}).filter(function(c){return !c.archived});
      if(sc==='all'){if(!net())fail(403,'Общий каталог откроется после проверки портфеля');
        return filt(all,q).map(function(c){if(isOwner()){var o=full(c);o.mine=false;o.ownerName=P[c.owner].name;return o}if(c.owner===ME){var f=full(c);f.next=nextTask(c.id);return f}return view(c)})}
      return filt(all.filter(function(c){return c.owner===ME}),q).map(function(c){var f=full(c);f.next=nextTask(c.id);return f})}
    case 'client/create':{var a=cleanAlias(b.alias);if(!a)fail(400,'Впишите имя или псевдоним');if(a.length>40)fail(400,'Имя длиннее 40 символов');
      if(aliasTaken(a))fail(409,'Это имя уже занято. Придумайте другое, например «'+freeName()+'»');
      var id='c_'+Math.random().toString(36).slice(2,7);C[id]=cl({id:id,owner:ME,alias:a,created:nowISO(),history:[{at:nowISO(),what:'Карточка создана'}]});return full(C[id])}
    case 'client/get':{var c=C[q.id];if(!c||c.archived)fail(404,'Карточка не найдена');if(c.owner===ME||isOwner())return full(c);if(!net())fail(404,'Карточка не найдена');return view(c)}
    case 'client/update':{var c2=own(b.id);var pt=b.patch||{};
      if(pt.alias!=null){var na=cleanAlias(pt.alias);if(aliasTaken(na,c2.id))fail(409,'Это имя уже занято. Придумайте другое, например «'+freeName()+'»');pt.alias=na}
      ['alias','age','capital','kids','investing','interests','requests','relation','capitalBasis','publicText'].forEach(function(k){if(k in pt)c2[k]=pt[k]});if(pt.cells){Object.keys(pt.cells).forEach(function(k){if(pt.cells[k]==null)delete c2.cells[k];else c2.cells[k]=Object.assign({src:'manual',at:nowISO()},pt.cells[k])})}c2.updated=nowISO();return full(c2)}
    case 'client/archive':{var c3=own(b.id);c3.archived=true;c3.archivedAt=nowISO();audit('Архивирование',c3.id);return {ok:true}}
    case 'client/extract':{var c4=own(b.id);var h=heur(String(b.text||''));h.props.forEach(function(p){var ex=c4.cells[p.cell];if(ex&&ex.v&&ex.kind!=='na'&&norm(ex.v)!==norm(p.value))p.conflict=ex.v});
      if(/двое детей|два ребенка/i.test(b.text)&&c4.kids&&c4.kids!==2)h.contra.push('В тексте двое детей, в карточке '+c4.kids);
      return {proposals:h.props,contradictions:h.contra}}
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
    case 'note/forward':{if(!net())fail(403,'Передача через Orbiq откроется после проверки портфеля');var id2=uid('rq');RQ[id2]={id:id2,status:'new',at:nowISO(),initiator:ME,cid:b.cid,requestId:'',offer:b.text,terms:'',fromNote:true,threads:{initiator:[{id:uid('m'),from:'initiator',text:b.text,at:nowISO()}],cardOwner:[]}};audit('Отправка обращения',id2);return {id:id2}}
    case 'task/list':return (TASKS[ME]||[]);
    case 'task/upsert':{var L=TASKS[ME]=TASKS[ME]||[];var t=b.id&&L.find(function(x){return x.id===b.id});if(t)Object.assign(t,b);else L.push(Object.assign({id:uid('t'),done:false},b));return L}
    case 'task/del':{TASKS[ME]=(TASKS[ME]||[]).filter(function(x){return x.id!==b.id});return TASKS[ME]}
    case 'ical/rotate':ICAL='https://orbiqgroup.com/api/crm?r=ical&k='+Math.random().toString(36).slice(2,14)+Math.random().toString(36).slice(2,14);return {url:ICAL};
    case 'ical/get':return {url:ICAL};
    case 'rq/create':{if(!net())fail(403,'Предложения откроются после проверки портфеля');var c7=C[b.cid];if(!c7||c7.archived)fail(404,'Карточка не найдена');if(!b.offer)fail(400,'Опишите предложение');
      var id3=uid('rq');RQ[id3]={id:id3,status:'new',at:nowISO(),initiator:ME,cid:b.cid,requestId:b.requestId,offer:b.offer,terms:b.terms||'',attachment:b.attachment?{id:uid('a'),name:b.attachment.name,size:''}:null,threads:{initiator:[{id:uid('m'),from:'initiator',text:b.offer,at:nowISO()}],cardOwner:[]}};audit('Отправка обращения',id3);return {id:id3,status:'new'}}
    case 'rq/mine':{var sent=Object.keys(RQ).map(function(k){return RQ[k]}).filter(function(r){return r.initiator===ME}).map(function(r){var v=rqView(r);v.thread=r.threads.initiator;return v});
      var inb=Object.keys(RQ).map(function(k){return RQ[k]}).filter(function(r){return C[r.cid]&&C[r.cid].owner===ME&&r.threads.cardOwner.length}).map(function(r){return {id:r.id,alias:C[r.cid].alias,status:r.status,thread:r.threads.cardOwner}});
      return {sent:sent,inbox:inb}}
    case 'rq/reply':{var r1=RQ[b.rid];if(!r1)fail(404,'Не найдено');var side=r1.initiator===ME?'initiator':(C[r1.cid].owner===ME?'cardOwner':null);if(!side)fail(404,'Не найдено');r1.threads[side].push({id:uid('m'),from:side,text:b.text,at:nowISO()});return {ok:true}}
    case 'rq/all':needOwner();return Object.keys(RQ).map(function(k){return rqView(RQ[k],true)}).sort(function(a,b){return a.at<b.at?1:-1});
    case 'rq/get':needOwner();if(!RQ[q.rid])fail(404,'Не найдено');return rqView(RQ[q.rid],true);
    case 'rq/send':{needOwner();var r2=RQ[b.rid];var msg={id:uid('m'),from:'orbiq',text:b.text,at:nowISO()};if(b.attachIds&&b.attachIds.length)msg.attach=b.attachIds[0];r2.threads[b.to].push(msg);if(b.to==='cardOwner'&&r2.status==='new')r2.status='passed';audit('Пересылка обращения',r2.id+' → '+(b.to==='initiator'?'инициатору':'владельцу карточки'));return rqView(r2,true)}
    case 'rq/status':{needOwner();var r3=RQ[b.rid];r3.status=b.status;if(b.deal)r3.deal=b.deal;audit('Статус обращения',r3.id+' → '+RQST[b.status]);return rqView(r3,true)}
    case 'pf/status':{var pid=q.pid&&isOwner()?q.pid:ME;var mine=Object.keys(C).map(function(k){return C[k]}).filter(function(c){return c.owner===pid&&!c.archived});var pp=P[pid];
      var rows=mine.map(function(c){var rs=[];var ci=circle(c.cells);if(ci.qual<15)rs.push('Заполнено '+ci.qual+' из 18, нужно 15');if(['<1'].indexOf(c.capital)>=0||!c.capital)rs.push('Капитал ниже $1 млн или не указан');if(!c.capitalBasis)rs.push('Нет основания оценки капитала');if(!c.relation||!c.relation.role||!c.relation.lastContact||!c.relation.topic)rs.push('Не описаны отношения');if(!c.requests.some(function(r){return r.status==='open'&&pp.categories.indexOf(r.cat)<0}))rs.push('Нет запроса в другой категории');return {cid:c.id,alias:c.alias,ok:!rs.length,reasons:rs}});
      var demo=[];for(var i=0;i<16;i++)demo.push({cid:'d'+i,alias:['Алмаз','Багира','Байкал','Вереск','Гелиос','Дельта','Ирис','Каспий','Кварц','Лотос','Мирра','Нева','Оникс','Пион','Рубин','Сапфир'][i],ok:true,reasons:[]});
      if(pid==='p_oleg'||pid==='p_mark')rows=demo.concat(rows);
      var f=PF[pid]||{status:'draft'};
      return {counted:rows.filter(function(r){return r.ok}).length,of:30,rows:rows,sample:(f.sample||[]).map(function(id){return {cid:id,alias:(C[id]||{}).alias}}),status:f.status,submittedAt:f.submittedAt,decision:f.decision,decisions:f.decisions||{},reason:f.reason}}
    case 'pf/submit':{var f2=PF[ME]=PF[ME]||{};if(f2.status==='submitted')return f2;f2.status='submitted';f2.submittedAt=nowISO();f2.sample=['c_orion','c_tigr'];audit('Отправка портфеля','pf/'+ME);return {ok:true}}
    case 'pf/decide':{needOwner();var f3=PF[b.pid];f3.decisions=f3.decisions||{};f3.decisions[b.cid]={exists:b.exists,relation:b.relation,capital:b.capital,reason:b.reason,at:nowISO()};audit('Решение по карточке',b.cid);return {ok:true}}
    case 'pf/final':{needOwner();var f4=PF[b.pid];f4.status='decided';f4.decision=b.decision;f4.reason=b.reason;if(b.decision==='approve'){P[b.pid].tier='trial';P[b.pid].trial={start:nowISO(),end:day(90),quota:3,used:0}}audit('Решение по портфелю',P[b.pid].name+' · '+b.decision);return {ok:true}}
    case 'demand':{var p2=meP();return p2.categories.map(function(c){var d=DEMAND[c]||{count:0,examples:[]};return {cat:c,count:d.count,examples:d.examples}})}
    case 'partners':needOwner();return Object.keys(P).map(function(k){var p=clone(P[k]);p.clients=Object.keys(C).filter(function(c){return C[c].owner===k&&!C[c].archived}).length;p.pf=PF[k]?{status:PF[k].status}:null;return p});
    case 'partner/invite':{needOwner();if(!b.name||!b.email)fail(400,'Нужны имя и почта');var id4='p_'+Math.random().toString(36).slice(2,7);P[id4]={id:id4,name:b.name,email:b.email,tier:'candidate',suspended:false,categories:b.categories||[],tg:{connected:false,on:{}},clients:0,invite:{status:'created',expires:day(7)}};audit('Приглашение партнера',b.name);return {pid:id4,link:'https://orbiqgroup.com/api/crm?r=pinv/accept&t='+Math.random().toString(36).slice(2,18),expires:day(7)}}
    case 'partner/reinvite':needOwner();P[b.pid].invite={status:'created',expires:day(7)};return {link:'https://orbiqgroup.com/api/crm?r=pinv/accept&t='+Math.random().toString(36).slice(2,18),expires:day(7)};
    case 'partner/revoke':needOwner();P[b.pid].invite.status='revoked';audit('Отзыв приглашения',P[b.pid].name);return {ok:true};
    case 'partner/suspend':needOwner();P[b.pid].suspended=!!b.on;audit(b.on?'Приостановка партнера':'Возврат доступа',P[b.pid].name);return {ok:true};
    case 'partner/tier':needOwner();P[b.pid].tier=b.tier;audit('Смена тарифа',P[b.pid].name+' → '+TIER[b.tier]);return {ok:true};
    case 'partner/payment':{needOwner();var pp2=P[b.pid];pp2.paid=pp2.paid||{seats:[]};pp2.paid['pay'+b.which]=b.at;if(b.which===1){var d=new Date(b.at);d.setDate(d.getDate()+90);pp2.paid.pay2Due=d.toISOString()}audit('Платеж '+b.which,pp2.name+' · $'+b.amount);return {ok:true}}
    case 'seat/list':{needOwner();return Object.keys(CATS).map(function(c){return {cat:c,max:2,seats:Object.keys(P).filter(function(k){return P[k].paid&&(P[k].paid.seats||[]).indexOf(c)>=0}).map(function(k){return {pid:k,name:P[k].name}}),waitlist:c==='watches'?[{name:'Заявка в листе ожидания'}]:[]}})}
    case 'audit':needOwner();return AUD.slice(0,+(q.limit||100));
    case 'invite/create':{var p3=meP();if(isOwner()||!p3||p3.tier!=='paid')fail(403,'Семейные приглашения доступны на платном тарифе');own(b.cid);audit('Приглашение семьи',b.cid);return {link:'https://orbiqgroup.com/i/?t='+Math.random().toString(36).slice(2,18),expires:day(14)}}
    case 'tg/link':return {url:'https://t.me/orbiq_bot?start='+Math.random().toString(36).slice(2,12)};
    case 'pf/all':needOwner();return Object.keys(PF).map(function(k){var f=PF[k];return {pid:k,name:P[k].name,status:f.status,submittedAt:f.submittedAt,sample:f.sample}});
    case 'pf/extend':needOwner();PF[b.pid].sample.push('c_granit');return {ok:true};
    case 'intro/use':{needOwner();var pi=P[b.pid];if(pi.tier==='paid')return {ok:true,paid:true};if(pi.tier!=='trial')fail(409,'Пробная квота доступна только после допуска к пробе');if(pi.trial.used>=pi.trial.quota)fail(409,'Пробные знакомства исчерпаны');pi.trial.used++;audit('Знакомство засчитано',pi.name);return {ok:true,counted:true,used:pi.trial.used,quota:pi.trial.quota}}
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
function hasNet(){if(isOwner())return true;if(S.me&&S.me.access)return !!S.me.access['net.view'];return (tier()==='trial'||tier()==='paid')&&!S.me.partner.suspended}
function go(h){if(location.hash===h)render();else location.hash=h}

/* ================= Мелкие компоненты ================= */
function toast(t,icon){var el=$('.toast');if(!el){el=document.createElement('div');el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.innerHTML=ic(icon||'check')+'<span>'+E(t)+'</span>';el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove('on')},2600)}
function copy(t){var done=function(){toast('Скопировано','copy')};if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(done,fb);else fb();function fb(){var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');done()}catch(e){toast('Не получилось скопировать. Выделите текст вручную','alert')}a.remove()}}
function sheet(html,wide){closeSheet();var el=document.createElement('div');el.className='sheet';el.innerHTML='<div class="sheet-in'+(wide?' wide':'')+'" role="dialog" aria-modal="true"><button type="button" class="btn sm ic soft x" data-a="sclose" aria-label="Закрыть">'+ic('x')+'</button>'+html+'</div>';document.body.appendChild(el);el.addEventListener('mousedown',function(e){if(e.target===el)closeSheet()});requestAnimationFrame(function(){el.classList.add('on');var f=el.querySelector('input:not([type=hidden]),textarea');if(f&&matchMedia('(hover:hover)').matches)f.focus()});segs(el);return el.firstChild}
function closeSheet(){$$('.sheet').forEach(function(s){s.classList.remove('on');setTimeout(function(){s.remove()},350)})}
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
  if(isOwner())return [['inbox','Входящие','inbox'],['clients','Клиенты','users'],['partners','Партнеры','handshake'],['reviews','Проверки','shield'],['archive','Архив','archive'],['audit','Журнал','list'],['notify','Уведомления','bell']];
  var t=tier(),a=[['clients','Клиенты','users']];
  if(t==='candidate')a.push(['demand','Спрос','chart']);
  a.push(['plans','Планы','cal'],['requests','Обращения','msg']);
  if(t!=='paid')a.push(['portfolio','Портфель','pie']);
  a.push(['tariff','Тариф','star'],['notify','Уведомления','bell']);return a}
function shell(active){
  var root=$('#root');
  if(!root.querySelector('.app')){
    var p=S.me.partner||{};var role=isOwner()?'Владелец Orbiq':TIER[p.tier]||'';
    var items=navItems();
    var nav=items.map(function(n){return '<a href="#/'+n[0]+'" data-nav="'+n[0]+'">'+ic(n[2])+'<span>'+n[1]+'</span>'+(n[0]==='inbox'?'<span class="n" id="inN" hidden></span>':'')+'</a>'}).join('');
    if(isOwner())nav='<div class="grp">Orbiq</div>'+items.slice(0,6).map(function(n){return '<a href="#/'+n[0]+'" data-nav="'+n[0]+'">'+ic(n[2])+'<span>'+n[1]+'</span>'+(n[0]==='inbox'?'<span class="n" id="inN" hidden></span>':'')+'</a>'}).join('')+'<div class="grp">Мое</div>'+items.slice(6).map(function(n){return '<a href="#/'+n[0]+'" data-nav="'+n[0]+'">'+ic(n[2])+'<span>'+n[1]+'</span></a>'}).join('');
    var tb=items.slice(0,4).map(function(n){return '<a href="#/'+n[0]+'" data-nav="'+n[0]+'">'+ic(n[2])+'<span>'+n[1]+'</span>'+(n[0]==='inbox'?'<span class="n" id="inN2" hidden></span>':'')+'</a>'}).join('')+'<button type="button" data-a="more">'+ic('more')+'<span>Еще</span></button>';
    root.innerHTML='<div class="app"><aside class="side"><a class="logo" href="#/"><span><b>ORBIQ</b><small>'+(isOwner()?'Кабинет владельца':'Кабинет партнера')+'</small></span></a><nav class="nav">'+nav+'</nav><div class="mebox"><span class="av">'+E(initials(p.name))+'</span><span><b>'+E(p.name||'')+'</b><small>'+E(role)+'</small></span><button type="button" data-a="logout" title="Выйти" aria-label="Выйти">'+ic('out')+'</button></div></aside>'+
      '<div><header class="top"><span><b>ORBIQ</b><br><small>'+E(role)+'</small></span><span class="av" style="width:34px;height:34px;border-radius:50%;background:conic-gradient(from 200deg,#fff3c9,#b5862a,#f6d97c,#8a6416,#fff3c9);display:grid;place-items:center;font-family:var(--s);font-weight:700">'+E(initials(p.name))+'</span></header><main class="main" id="main"></main></div><nav class="tabbar">'+tb+'</nav></div>';
    if(isOwner())api('rq/all').then(function(l){var n=l.filter(function(r){return r.status==='new'}).length;['inN','inN2'].forEach(function(id){var e=$('#'+id);if(e&&n){e.hidden=false;e.textContent=n}})}).catch(function(){});
  }
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
function coin(key){if(key)return '<span class="coin key"><span class="cw">'+ic('key')+'</span></span>';var s=IMGS.slice(0).sort(function(){return Math.random()-.5}).slice(0,3);return '<span class="coin"><span class="cw">'+s.map(function(x,k){return '<img class="s'+k+'" src="'+img(x)+'" alt="">'}).join('')+'</span><svg class="cl" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 50V0M50 50L93.3 75M50 50L6.7 75"/></svg></span>'}
function words(t){return t.split(' ').map(function(w,i){return '<span class="w" style="--i:'+i+'">'+E(w)+'</span>'}).join(' ')}
function vLogin(){
  $('#root').innerHTML='<div class="lgn">'+wall()+'<span class="lg-logo">ORBIQ</span><span class="lg-tag">CRM партнеров</span><div class="lg-card">'+coin()+'<h1>'+words('Кабинет партнера')+'</h1><p class="lg-sub">Клиенты, подборки и обращения в одном месте</p><div id="lgm" style="width:100%"><form class="lg-f" id="lgf" novalidate><label class="sr" for="lge">Почта</label><input id="lge" type="email" inputmode="email" autocomplete="email" placeholder="Почта" required><button type="submit" aria-label="Получить ссылку">'+ic('ar')+'</button></form><p class="lg-e" id="lgerr" hidden></p><p class="lg-n">Пароль не нужен: ссылка для входа придет на почту</p></div></div></div>';
  var LM={expired:'Ссылка устарела или уже открыта. Запросите новую',suspended:'Доступ приостановлен. Напишите Orbiq'},IM={used:'Приглашение уже использовано. Войдите по почте',revoked:'Приглашение отозвано',expired:'Срок приглашения истек. Попросите новую ссылку',invalid:'Ссылка приглашения не подошла'};
  var pm=LM[Q.get('login')]||IM[Q.get('invite')];if(pm){var e0=$('#lgerr');e0.hidden=false;e0.textContent=pm}
  var f=$('#lgf');f.addEventListener('submit',function(e){e.preventDefault();var em=$('#lge').value.trim();var er=$('#lgerr');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){er.hidden=false;er.textContent='Проверьте адрес почты';return}
    er.hidden=true;f.classList.add('busy');
    api('auth/request',{email:em}).then(function(r){$('#lgm').innerHTML='<div class="lg-ok"><svg class="i" viewBox="0 0 24 24" style="width:44px;height:44px;stroke-width:1.3"><path d="M3 6h18v12H3z"/><path d="m3 7 9 7 9-7"/></svg><p>Если адрес есть в Orbiq, письмо уже в пути на <b>'+E(em)+'</b>. Откройте его и нажмите ссылку для входа.</p>'+(r.test_link?'<a class="lg-l" href="'+E(r.test_link)+'" data-a="demoin">Предпросмотр: войти</a>':'')+'<button type="button" class="lg-l" data-a="relogin">Другая почта</button></div>'})
    .catch(function(e2){f.classList.remove('busy');er.hidden=false;er.textContent=e2.status===429?'Слишком много попыток. Попробуйте через час':e2.message})});
}
function vKey(){
  $('#root').innerHTML='<div class="lgn">'+wall()+'<span class="lg-logo">ORBIQ</span><span class="lg-tag">Второй шаг</span><div class="lg-card">'+coin(true)+'<h1>'+words('Ключ владельца')+'</h1><p class="lg-sub">Почта подтверждена. Введите ключ, чтобы открыть кабинет владельца</p><form class="lg-f" id="kf"><label class="sr" for="kk">Ключ</label><input id="kk" type="password" autocomplete="current-password" placeholder="Ключ" required><button type="submit" aria-label="Войти">'+ic('ar')+'</button></form><p class="lg-e" id="kerr" hidden></p><p class="lg-n">Сессия владельца действует 12 часов</p></div></div>';
  var f=$('#kf');f.addEventListener('submit',function(e){e.preventDefault();var k=$('#kk').value;if(!k)return;f.classList.add('busy');
    api('auth/owner-key',{key:k}).then(function(){return boot('#/inbox')}).catch(function(e2){f.classList.remove('busy');var er=$('#kerr');er.hidden=false;er.textContent=e2.status===429?'Слишком много попыток. Попробуйте позже':'Ключ не подошел'})});
}

/* ================= Клиенты ================= */
var INTERESTS_BASE=['Часы','Искусство','Архитектура','Яхтинг','Авиация','Гольф','Вино','Охота','Образование','Здоровье','Технологии'];
function vClients(){
  var L=S.list;if(isOwner())L.scope='all';else if(!hasNet())L.scope='mine';
  var t=tier();
  var acts=isOwner()?'':btn('Добавить клиента','pri mag','data-a="newc"','plus');
  var anon=isOwner()?'':'<div class="anon rv"><span class="ico">'+ic('lock')+'</span><ol><li><b>01</b>Имя или псевдоним, без фамилии</li><li><b>02</b>Контакты остаются у вас</li><li><b>03</b>Клиент закреплен за вами</li></ol><button type="button" class="lk" data-a="howsee">Как видят партнеры</button></div>';
  var scope=isOwner()?'':'<div class="seg" role="tablist"><button type="button" class="'+(L.scope==='mine'?'on':'')+'" data-a="scope" data-v="mine">Мои</button><button type="button" class="'+(L.scope==='all'?'on':'')+'" data-a="scope" data-v="all" '+(hasNet()?'':'disabled title="Откроется после проверки портфеля"')+'>Все</button></div>';
  var ints=Object.keys(S.seenInterests).concat(INTERESTS_BASE).filter(function(v,i,a){return a.indexOf(v)===i}).sort();
  var tools='<div class="tools">'+scope+'<label class="search">'+ic('search')+'<input class="in" type="search" id="cq" placeholder="Поиск по имени" value="'+E(L.q)+'" aria-label="Поиск по имени"></label>'+
    '<span class="fsel">'+sel('cat',catOpts(),L.cat,'Тип запроса','data-f="cat" class="sel'+(L.cat?' on':'')+'"')+'</span>'+
    '<span class="fsel">'+sel('interest',ints.map(function(x){return [x,x]}),L.interest,'Интересы','data-f="interest"')+'</span>'+
    '<span class="fsel">'+sel('capital',CAPS.map(function(c){return [c,capL(c)]}),L.capital,'Капитал','data-f="capital"')+'</span>'+
    '<span class="fsel">'+sel('investing',Object.keys(INV).map(function(k){return [k,INV[k]]}),L.investing,'Инвестирует','data-f="investing"')+'</span>'+
    (L.cat||L.interest||L.capital||L.investing||L.q?'<button type="button" class="link mute" data-a="fclear">Сбросить</button>':'')+'</div>';
  var note=t==='candidate'?'<div class="infob rv" style="margin-bottom:14px">'+ic('info')+'<span>Общий каталог откроется после проверки портфеля. Сейчас видна ваша CRM и <a class="link" href="#/demand">спрос в вашем направлении</a>.</span></div>':'';
  page('clients',hd(isOwner()?'Вся сеть':'CRM · <span id="ccount">…</span>',isOwner()?'Клиенты сети':'Клиенты',acts)+anon+note+tools+'<div class="tbl-w rv" style="--i:2" id="ctbl"><div class="skel" style="height:240px"></div></div>',function(m){
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
      box.innerHTML=filt?emptyBox('Ничего не нашли','Измените фильтры или поиск','<button type="button" class="btn sec" data-a="fclear">Сбросить фильтры</button>'):L.scope==='mine'&&!isOwner()?emptyBox('Начните с одного имени','Здесь появятся ваши клиенты. Псевдонима достаточно, остальное можно надиктовать.',btn('Добавить клиента','pri','data-a="newc"','plus')):emptyBox('Пока пусто','Карточки партнеров появятся здесь');return}
    var mine=L.scope==='mine';
    box.innerHTML='<table class="tbl"><thead><tr><th>Имя</th><th>Возраст</th><th>Капитал</th><th>Основные интересы</th><th>Дети</th><th>Инвестирует</th><th>Актуальный запрос</th>'+(mine?'<th>Ближайшее действие</th>':'')+(isOwner()?'<th>Партнер</th>':'')+'<th class="sr">Раскрыть</th></tr></thead><tbody>'+rows.map(function(c,i){
      var rq=(c.requests||[]).filter(function(r){return r.status!=='closed'});var r0=rq[0];
      var rqT=r0?(r0.text||(c.publicText&&c.publicText[r0.id])||''):'';if(r0&&!c.mine&&!isOwner())rqT=r0.text||'Только категория';
      if(r0&&(c.mine||isOwner())&&!rqT)rqT=r0.text;
      var pct=c.circle?c.circle.pct:c.cells?circle(c.cells).pct:null;
      var ints=c.interests||[];
      return '<tr data-a="open" data-id="'+E(c.id)+'" class="rv" style="--i:'+Math.min(i,12)+'"><td class="c-nm"><span class="nm">'+(c.mine?mring(pct):'')+E(c.alias)+(c.mine&&!mine?'<span class="mine">ваш</span>':'')+'</span></td>'+
      '<td class="x num" data-l="Возраст">'+E(ageL(c.age))+'</td><td class="x num" data-l="Капитал">'+E(capL(c.capital))+'</td>'+
      '<td class="x" data-l="Интересы">'+(ints.length?E(ints.slice(0,2).join(', '))+(ints.length>2?' <span class="more">+'+(ints.length-2)+'</span>':''):'<span class="mu">—</span>')+'</td>'+
      '<td class="x num" data-l="Дети">'+(c.kids==null||c.kids===''?'<span class="mu">—</span>':E(c.kids))+'</td>'+
      '<td class="x" data-l="Инвестирует">'+(INV[c.investing]?E(INV[c.investing]):'<span class="mu">—</span>')+'</td>'+
      '<td class="c-rq">'+(r0?'<span class="rq"><i class="dot" style="color:'+(CATC[r0.cat]||'#999')+'"></i><span class="t">'+E(rqT||CATS[r0.cat])+'</span>'+(rq.length>1?'<span class="more">еще '+(rq.length-1)+'</span>':'')+'</span>':'<span class="mu">—</span>')+'</td>'+
      (mine?'<td class="x nx" data-l="Действие">'+(c.next?'<b>'+E(c.next.title)+'</b><small class="'+(parseDue(c.next.due)<new Date()?'late':'')+'">'+E(relDay(c.next.due))+'</small>':'<span class="mu">—</span>')+'</td>':'')+
      (isOwner()?'<td class="x" data-l="Партнер">'+E(c.ownerName||'—')+'</td>':'')+
      '<td class="c-exp"><button type="button" class="exp" data-a="exp" aria-label="Подробнее">'+ic('down')+'</button></td></tr>'}).join('')+'</tbody></table>';
  }).catch(function(e){box.innerHTML=errBox(e)});
}

function howSee(){
  sheet('<div class="kick">Обезличенная карточка</div><h2>Что видят другие партнеры</h2>'+
  '<div class="split" style="margin-top:4px"><div class="y"><h3>Видите только вы</h3><ul><li>'+ic('lock')+'Кто это и как с ним связаться</li><li>'+ic('lock')+'Круг 360° и подробности</li><li>'+ic('lock')+'Заметки, планы, история</li><li>'+ic('lock')+'Импорт и диктовка</li></ul></div><div class="n"><h3>Видит сеть</h3><ul><li>'+ic('check')+'Псевдоним</li><li>'+ic('check')+'Возраст и капитал диапазоном</li><li>'+ic('check')+'Интересы, дети, инвестиции</li><li>'+ic('check')+'Запрос в вашей формулировке</li></ul></div></div>'+
  '<p class="hint">Владелец карточки скрыт. Предложения идут только через Orbiq, вы решаете, передавать ли их клиенту. Полную анонимность обещать нельзя: редкие сочетания деталей лучше не указывать.</p>');
}

/* ================= Новая карточка ================= */
function vNew(){
  page('clients','<a class="back" href="#/clients">'+ic('al')+'Клиенты</a>'+hd('Новая карточка','Добавить клиента')+
  '<div class="newc"><form class="card bigf rv" id="nf" novalidate><label class="lbl" for="na">Имя или псевдоним</label><input class="bigin" id="na" maxlength="40" autocomplete="off" placeholder="Например, Атлас"><p class="err" id="nerr" hidden></p><p class="hint">Контакты остаются у вас. Другие партнеры видят общую карточку и могут передать предложение через Orbiq.</p><div class="row">'+btn('Создать карточку','pri mag','type="submit"','ar')+'<a class="link mute" href="#/clients">Отмена</a></div></form>'+
  '<div class="split rv" style="--i:2"><div class="y"><span class="kick" style="color:var(--acc)">Остается у вас</span><h3>Фамилия, контакты, компания</h3><ul><li>'+ic('lock')+'Полное имя</li><li>'+ic('lock')+'Телефон и почта</li><li>'+ic('lock')+'Название бизнеса</li></ul></div><div class="n"><span class="kick">Попадает в CRM</span><h3>Псевдоним и запросы</h3><ul><li>'+ic('check')+'Возраст диапазоном</li><li>'+ic('check')+'Капитал диапазоном</li><li>'+ic('check')+'Интересы и запросы</li></ul></div></div></div>',function(m){
    var f=$('#nf',m),inp=$('#na',m),er=$('#nerr',m);
    f.querySelector('button[type=submit]').setAttribute('type','submit');
    inp.addEventListener('input',function(){er.hidden=true;inp.classList.remove('bad')});
    f.addEventListener('submit',function(e){e.preventDefault();var a=cleanAlias(inp.value);if(!a){er.hidden=false;er.innerHTML=ic('alert')+'Впишите имя или псевдоним';inp.classList.add('bad');return}
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
      return '<li class="'+(k==='fact'?'f':k==='hypothesis'?'h':'')+'"><i style="'+(k==='fact'?'background:'+s.hex:k==='hypothesis'?'border-color:'+s.hex:'')+'"></i><span>'+(x&&x.v?E(x.v)+(k==='hypothesis'?' <small>Догадка, уточните</small>':''):k==='na'?'<small>Не применимо</small>':'<small>Пока пусто</small>')+'<small>'+E(q[1])+'</small></span></li>'}).join('')+'</ul>'+
      (nq&&c.mine?'<div class="nextq"><span class="kick">Следующий вопрос</span>'+E(nq)+'</div><a class="btn sm" style="align-self:flex-start;background:#fff;color:#111" href="#/c/'+E(c.id)+'/dictate">'+ic('mic')+'Ответить голосом</a>':'')+'</div>'}
  var qual=c.mine&&!isOwner()?'<div class="qual"><span>Зачет для портфеля</span><b>'+ci.qual+' из 15</b></div><div class="bar"><i style="width:'+Math.min(100,Math.round(ci.qual/15*100))+'%"></i></div>':'';
  return '<div class="ringp spot dk" id="ringp"><div class="row" style="justify-content:space-between"><span class="kick">Круг 360°</span>'+(c.mine?'<span class="kick">'+(ci.applicable<18?'Не применимо: '+(18-ci.applicable):'6 × 3')+'</span>':'')+'</div><div class="ringw">'+ringSVG(c.cells,sel,anim)+'<div class="rc">'+center+'</div></div><div class="legend">'+leg+'</div>'+sp+qual+'</div>';
}
function mountRing(c,anim){var w=$('#ringw-slot');if(!w)return;w.innerHTML=ringPanel(c,anim);var ci=circle(c.cells);var prev=S.prevPct[c.id];if(anim&&ci.pct!=null)count($('#rpct'),prev!=null?prev:0,ci.pct,1400);S.prevPct[c.id]=ci.pct}

/* ================= Карточка клиента ================= */
function cardTabs(c,tab){
  var t=c.mine?[['profile','Профиль'],['match','Подборка'],['notes','Заметки'],['plans','Планы'],['history','История']]:isOwner()?[['profile','Профиль'],['notes','Заметки для себя'],['history','История']]:[['profile','Профиль'],['notes','Заметки для себя']];
  return '<nav class="tabs">'+t.map(function(x){return '<a href="#/c/'+E(c.id)+'/'+x[0]+'" class="'+(tab===x[0]?'on':'')+'">'+x[1]+'</a>'}).join('')+'</nav>';
}
function vCard(args){
  var id=args[0],tab=args[1]||'profile';
  if(tab==='dictate')return vDictate(id);if(tab==='review')return vReview(id);if(tab==='ai')return vAI(id);if(tab==='offer')return vOffer(id);
  var fresh=!S.card||S.card.id!==id;if(fresh){S.selSec=null;S.viewAs='own'}
  loading('clients');
  return api('client/get',null,{id:id}).then(function(c){S.card=c;
    if(!c.mine&&!isOwner())return vNetCard(c);
    var ro=!c.mine;
    var acts=ro?(isOwner()?btn('Написать партнеру','pri mag','data-a="owrite"','msg'):''):btn('Диктовать','pri mag','data-a="go" data-h="#/c/'+E(c.id)+'/dictate"','mic')+btn('Из моей нейросети','sec','data-a="go" data-h="#/c/'+E(c.id)+'/ai"','spark');
    var head='<a class="back" href="#/clients">'+ic('al')+'Клиенты</a><div class="ch"><div><span class="own"><i></i>'+(ro?'Закреплена за: '+E(c.ownerName||'партнер'):'Ваш клиент')+'</span><h1><span class="mask"><span>'+E(c.alias)+'</span></span></h1><div class="meta">'+(c.mine?'<div class="seg"><button type="button" class="'+(S.viewAs==='own'?'on':'')+'" data-a="viewas" data-v="own">Ваш клиент</button><button type="button" class="'+(S.viewAs==='net'?'on':'')+'" data-a="viewas" data-v="net">'+ic('eye')+' Как видят партнеры</button></div>':'<span class="chip mono dark">Только просмотр</span>')+'</div></div><div class="acts">'+acts+'</div></div>';
    var body;
    if(c.mine&&S.viewAs==='net')body=netPreview(c);
    else body='<div class="cgrid"><div class="lft" id="ringw-slot"></div><div>'+cardTabs(c,tab)+'<div id="tabc"></div></div></div>';
    page('clients',head+body,function(){if(!(c.mine&&S.viewAs==='net')){mountRing(c,fresh||S._animNext);S._animNext=false;renderTab(c,tab)}});
  }).catch(function(e){page('clients','<a class="back" href="#/clients">'+ic('al')+'Клиенты</a>'+(e.status===404?emptyBox('Карточка недоступна','Ее убрали в архив или у вас нет к ней доступа','<a class="btn sec" href="#/clients">К списку</a>'):errBox(e)))});
}
function renderTab(c,tab){var b=$('#tabc');if(!b)return;
  if(tab==='match')return tabMatch(c,b);if(tab==='notes')return tabNotes(c,b);if(tab==='plans')return tabPlans(c,b);if(tab==='history'){b.innerHTML='<div class="card rv"><div class="ql">'+((c.history||[]).length?c.history.map(function(h){return '<div><span class="kick" style="min-width:90px">'+E(fmtDate(h.at))+'</span><span>'+E(h.what)+'</span></div>'}).join(''):'<p class="hint">История появится после первых изменений</p>')+'</div></div>';return}
  tabProfile(c,b);
}
function pillGroup(k,opts,val,ro){return '<div class="pills" data-k="'+k+'">'+opts.map(function(o){return '<button type="button" class="'+(String(val)===String(o[0])?'on':'')+'" '+(ro?'disabled':'data-a="setf" data-k="'+k+'" data-v="'+E(o[0])+'"')+'>'+E(o[1])+'</button>'}).join('')+'</div>'}
function tabProfile(c,b){
  var ro=!c.mine;
  var reqs=(c.requests||[]).map(function(r){return reqBlock(c,r,ro)}).join('')||'<p class="hint">Запросов пока нет. Добавьте то, с чем клиент обращался или что хочет сделать.</p>';
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
    '<div class="fld"><label for="rl3">Что обсуждали</label><input class="in" id="rl3" data-rel="topic" value="'+E(rel.topic||'')+'" placeholder="Подарок к юбилею" '+(ro?'disabled':'')+'></div></div>'+
    '<div class="fld" style="margin-top:14px"><label for="cb">Основание оценки капитала</label><textarea class="ta" id="cb" style="min-height:80px" placeholder="Источник, период, чья доля. Должность или покупка часов капитал не подтверждают" '+(ro?'disabled':'')+'>'+E(c.capitalBasis||'')+'</textarea></div></section>'+
  (ro?'':'<div class="row" style="justify-content:flex-end"><button type="button" class="link mute" data-a="archive">'+ic('archive')+' Убрать в архив</button></div>')+
  '</div>';
  segs(b);
  if(ro)return;
  var al=$('#alias');al.addEventListener('change',function(){var v=cleanAlias(al.value);if(!v||v===c.alias){al.value=c.alias;return}patch({alias:v}).then(function(){var h=$('.ch h1 .mask>span');if(h)h.textContent=v}).catch(function(e){var er=$('#aerr');er.hidden=false;er.innerHTML=ic('alert')+E(e.message);al.value=c.alias})});
  $('#intf').addEventListener('submit',function(e){e.preventDefault();var v=$('#intin').value.trim();if(!v)return;var a=(c.interests||[]).slice();if(a.map(norm).indexOf(norm(v))<0)a.push(v);patch({interests:a}).then(function(){renderTab(S.card,'profile')})});
  $('#rqf').addEventListener('submit',function(e){e.preventDefault();var cat=$('#rqcat').value,t=$('#rqtxt').value.trim();if(!cat){toast('Выберите категорию','alert');return}if(!t){toast('Впишите запрос коротко','alert');return}var a=(c.requests||[]).slice();a.push({id:uid('r'),cat:cat,text:t,status:'open',at:nowISO(),public:true});patch({requests:a}).then(function(){renderTab(S.card,'profile')})});
  $$('[data-rel]').forEach(function(i){i.addEventListener('change',function(){var r=Object.assign({},S.card.relation||{});r[i.getAttribute('data-rel')]=i.value.trim();patch({relation:r})})});
  $('#cb').addEventListener('change',function(){patch({capitalBasis:$('#cb').value.trim()})});
}
function reqBlock(c,r,ro){
  var pub=(c.publicText||{})[r.id];var closed=r.status==='closed';
  var box='';
  if(!closed){
    if(pub&&!r._edit)box='<div class="pub ok"><span class="lbl ok">'+ic('check')+'Партнеры видят</span><span>«'+E(pub)+'»</span>'+(ro?'':'<button type="button" class="link" style="align-self:flex-start" data-a="pubedit" data-r="'+E(r.id)+'">Изменить формулировку</button>')+'</div>';
    else if(!ro){var f=findIds(r.text||'');var draft=pub||stripIds(r.text||'',f).replace(/[,;]?\s*[^,;.]*\[скрыто\][^,;.]*/g,'').trim();
      box='<div class="pub wait"><span class="lbl" style="color:#8A5A00">'+ic('eye')+'Партнеры пока видят только категорию</span><span class="hint" style="color:var(--ink2)">Проверьте формулировку: без имен, компаний, адресов и редких деталей</span><div class="row"><input class="in grow" data-pub="'+E(r.id)+'" value="'+E(draft)+'" style="background:#fff"><button type="button" class="btn sm" data-a="pubok" data-r="'+E(r.id)+'">'+ic('check')+'Показать партнерам</button></div></div>'}
    else box='<div class="pub"><span class="hint">Формулировка не подтверждена, сеть видит только категорию</span></div>';
  }
  return '<div class="req'+(closed?' closed':'')+'"><div class="rh">'+catChip(r.cat)+'<div class="row">'+(ro?'<span class="chip line">'+(closed?'Закрыт':'Актуален')+'</span>':'<div class="seg"><button type="button" class="'+(!closed?'on':'')+'" data-a="rqst" data-r="'+E(r.id)+'" data-v="open">Актуален</button><button type="button" class="'+(closed?'on':'')+'" data-a="rqst" data-r="'+E(r.id)+'" data-v="closed">Закрыт</button></div><button type="button" class="ibtn" data-a="rqdel" data-r="'+E(r.id)+'" aria-label="Удалить запрос">'+ic('trash')+'</button>')+'</div></div><div class="rt">'+E(r.text||CATS[r.cat])+'</div>'+box+'</div>';
}
function patch(p){var c=S.card;return api('client/update',{id:c.id,patch:p}).then(function(n){var keepMine=c.mine;S.card=n;n.mine=keepMine;var sv=$('#sv');if(sv){sv.classList.add('on');clearTimeout(sv._t);sv._t=setTimeout(function(){sv.classList.remove('on')},1600)}if(p.cells)mountRing(n,true);return n}).catch(function(e){toast(e.message,'alert');throw e})}
function netPreview(c){
  var reqs=(c.requests||[]).filter(function(r){return r.status!=='closed'});
  return '<div class="netv"><div class="stack"><div class="card rv"><span class="kick">Так карточку видят партнеры сети</span><h2 style="font-family:var(--s);font-size:40px;margin:6px 0 16px">'+E(c.alias)+'</h2>'+netFacts(c)+'<div class="stack" style="margin-top:16px">'+(reqs.length?reqs.map(function(r){var p=(c.publicText||{})[r.id];return '<div class="req"><div class="rh">'+catChip(r.cat)+(p?'<span class="chip ok">Формулировка видна</span>':'<span class="chip warn">Только категория</span>')+'</div>'+(p?'<div class="rt">'+E(p)+'</div>':'')+'</div>'}).join(''):'<p class="hint">Открытых запросов нет</p>')+'</div></div></div>'+
  '<div class="card dk rv" style="--i:2;display:flex;flex-direction:column;gap:14px"><span class="kick" style="color:var(--dmute)">Скрыто от сети</span><h2 style="color:#fff;font-family:var(--s);font-size:30px;font-weight:600">Знаете только вы</h2><div class="hidden-list">'+['Кто вы','Круг 360°','Отношения','Основание капитала','Заметки','Планы','История','Импорт и диктовка','Неподтвержденные формулировки'].map(function(x){return '<span class="chip">'+ic('lock')+x+'</span>'}).join('')+'</div><p class="hint" style="color:var(--dmute)">Предложения по вашему клиенту приходят только через Orbiq. Передавать ли их клиенту, решаете вы.</p>'+btn('Вернуться к карточке','sm','data-a="viewas" data-v="own" style="background:#fff;color:#111;align-self:flex-start"')+'</div></div>';
}
function netFacts(c){var ints=c.interests||[];return '<div class="facts"><div><span class="lbl">Возраст</span><b>'+E(ageL(c.age))+'</b></div><div><span class="lbl">Капитал</span><b>'+E(capL(c.capital))+'</b></div><div><span class="lbl">Дети</span><b>'+(c.kids==null||c.kids===''?'—':E(c.kids))+'</b></div><div><span class="lbl">Инвестирует</span><b>'+E(INV[c.investing]||'—')+'</b></div><div style="grid-column:span 2"><span class="lbl">Интересы</span><b style="font-size:15px;font-weight:500">'+(ints.length?E(ints.join(', ')):'—')+'</b></div></div>'}
function vNetCard(c){
  var reqs=c.requests||[];
  var head='<a class="back" href="#/clients">'+ic('al')+'Клиенты</a><div class="ch"><div><span class="own" style="color:var(--mute)"><i style="background:var(--mute);box-shadow:none"></i>Карточка партнера сети</span><h1><span class="mask"><span>'+E(c.alias)+'</span></span></h1><div class="meta"><span class="lock-l">'+ic('lock')+'Владелец карточки скрыт. Связь только через Orbiq</span></div></div><div class="acts">'+(reqs.length?btn('Предложить через Orbiq','pri mag','data-a="go" data-h="#/c/'+E(c.id)+'/offer"','send'):'')+btn('Заметка для себя','sec','data-a="go" data-h="#/c/'+E(c.id)+'/notes"','note')+'</div></div>';
  var tab=(location.hash.split('/')[3]||'profile');
  page('clients',head+'<div class="cgrid" style="grid-template-columns:1fr minmax(300px,420px)"><div>'+cardTabs(c,tab==='notes'?'notes':'profile')+'<div id="tabc"></div></div><div class="card dk spot rv" style="--i:2;display:flex;flex-direction:column;gap:12px"><span class="kick" style="color:var(--acc)">Как это работает</span><h2 style="color:#fff;font-family:var(--s);font-size:28px">Вы → Orbiq → партнер клиента</h2><ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;color:rgba(244,241,236,.85);font-size:14px"><li>Вы описываете предложение и условия</li><li>Orbiq проверяет и согласует комиссию</li><li>Партнер клиента решает, передавать ли его клиенту</li></ol><p class="hint" style="color:var(--dmute)">Прямого чата нет. Вашу личность второй партнер не видит.</p></div></div>',function(){
    var b=$('#tabc');if(tab==='notes')return tabNotes(c,b);
    b.innerHTML='<div class="stack lg"><div class="card rv">'+netFacts(c)+'</div><div class="card rv" style="--i:1"><h2 style="margin-bottom:14px">Открытые запросы</h2><div class="stack">'+(reqs.length?reqs.map(function(r){return '<div class="req"><div class="rh">'+catChip(r.cat)+btn('Предложить через Orbiq','sm','data-a="go" data-h="#/c/'+E(c.id)+'/offer?r='+E(r.id)+'"','send')+'</div>'+(r.text?'<div class="rt">'+E(r.text)+'</div>':'<div class="hint">Формулировку видит только партнер клиента</div>')+'</div>'}).join(''):'<p class="hint">Открытых запросов нет</p>')+'</div></div></div>'});
}

/* ---------- Подборка и «К разговору» ---------- */
function itemCard(it,i){return '<article class="item rv" style="--i:'+i+'"><div class="im" style="background-image:url('+img(it.itemId)+')"></div><div class="bd"><h3>'+E(it.title)+'</h3><p class="why">'+ic('spark')+'<span>'+E(it.why||'')+'</span></p><div class="dl"><span><b>Что получит:</b> '+E(it.deliver||'—')+'</span><span><b>Кто подтверждает:</b> '+E(it.confirmBy||'—')+'</span></div></div></article>'}
function tabMatch(c,b){
  b.innerHTML='<div class="skel" style="height:320px"></div>';
  api('client/match',null,{id:c.id}).then(function(m){
    var items=Array.isArray(m)?m:(m.items||m.matches||[]);var qs=m.questions||[];
    var now=qs.filter(function(q){return q.bucket==='now'}).slice(0,3),later=qs.filter(function(q){return q.bucket==='later'}),done=qs.filter(function(q){return q.bucket==='done'});
    var qcard=function(q,i){return '<div class="qcard rv" style="--i:'+i+'"><span class="qn">0'+(i+1)+'</span><div class="row">'+(q.kind==='clarify'?'<span class="chip warn">Уточнение интереса</span>':'<span class="chip acc">Предложение</span>')+'</div><p class="basis">'+E(q.basis||'')+'</p><textarea class="ta" data-q="'+E(q.id)+'" aria-label="Фраза для разговора">'+E(q.text)+'</textarea><div class="dates"><span>Спросить <b>'+E(fmtDate(q.date))+'</b></span>'+(q.deadline?'<span>Крайний срок <b>'+E(fmtDate(q.deadline))+'</b></span>':'')+'</div><div class="row">'+btn('Скопировать','sm','data-a="qcopy" data-q="'+E(q.id)+'"','copy')+btn('Уже спросил','sm soft','data-a="qasked" data-q="'+E(q.id)+'"','check')+'<button type="button" class="link mute" data-a="qlater" data-q="'+E(q.id)+'">Позже</button></div></div>'};
    var gift='Я стал партнером Orbiq. У меня есть возможность подарить вам три месяца доступа. Я уже собрал для вас первую подборку. Вы сможете менять темы и пригласить еще одного человека из семьи. Годовой доступ стоит $10 000. Прислать вам личную ссылку?';
    var inv=tier()==='paid'?'<div class="card rv" id="invc"><h2>Приглашение семьи</h2><p class="hint" style="margin:4px 0 14px">Кнопка откроется после согласия клиента. Ссылку отправляете вы, своим каналом.</p><div class="grid3"><div class="fld"><label>Дата согласия</label><input class="in" type="date" id="cdate" value="'+new Date().toISOString().slice(0,10)+'"></div><div class="fld"><label>Способ</label>'+sel('ch',[['Лично','Лично'],['Звонок','Звонок'],['Мессенджер','Мессенджер'],['Почта','Почта']],'Звонок',null,'id="cch"')+'</div><div></div></div><div class="stack" style="gap:8px;margin:14px 0"><label class="chk"><input type="checkbox" id="cok1"><span>Клиент согласен получить личную ссылку</span></label><label class="chk"><input type="checkbox" id="cok2"><span>Капитал семьи более $10 млн</span></label></div>'+btn('Создать приглашение','pri','data-a="invite" disabled id="invb"','gift')+'<div id="invr"></div></div>'
      :'<div class="card rv"><div class="row">'+ic('lock')+'<h2>Приглашение семьи</h2></div><p class="hint" style="margin-top:6px">Семейные приглашения доступны на платном тарифе. <a class="link" href="#/tariff">Подробнее о тарифе</a></p></div>';
    b.innerHTML='<div class="stack lg"><div><div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 class="sec-h">К разговору</h2><span class="kick">Спросить сейчас · '+now.length+' из 3</span></div>'+(now.length?'<div class="qnow">'+now.map(qcard).join('')+'</div>':'<div class="card"><p class="hint">Добавьте интересы и планы, и здесь появятся поводы для разговора</p></div>')+'</div>'+
      (later.length?'<details class="fold"><summary>Позже · '+later.length+ic('down')+'</summary><div class="ql">'+later.map(function(q){return '<div><span class="grow">'+E(q.basis||q.text)+'</span><span class="kick">'+E(fmtDate(q.date))+'</span><button type="button" class="link" data-a="qasked" data-q="'+E(q.id)+'">Уже спросил</button></div>'}).join('')+'</div></details>':'')+
      (done.length?'<details class="fold"><summary>Уже обсудили · '+done.length+ic('down')+'</summary><div class="ql">'+done.map(function(q){return '<div><span class="tchk on">'+ic('check')+'</span><span class="grow">'+E(q.basis||q.text)+'</span></div>'}).join('')+'</div></details>':'')+
      '<div><h2 class="sec-h" style="margin-bottom:12px">Подборка</h2>'+(items.length?'<div class="items">'+items.slice(0,6).map(itemCard).join('')+'</div>'+(items.length>6?'<details class="fold" style="margin-top:14px"><summary>Еще '+(items.length-6)+' в подборке'+ic('down')+'</summary><div class="items">'+items.slice(6).map(itemCard).join('')+'</div></details>':''):'<div class="card"><p class="hint">Подборка появится после первых фактов о клиенте. При любом проценте круга ее уже можно смотреть.</p></div>')+'</div>'+'<div class="card dk rv"><span class="kick" style="color:var(--acc)">Если клиенту интересно</span><p style="font-size:17px;line-height:1.55;margin:10px 0 14px;color:#fff">«'+E(gift)+'»</p><div class="row">'+btn('Скопировать фразу','sm','data-a="copytxt" data-t="'+E(gift)+'" style="background:#fff;color:#111"','copy')+'<span class="hint" style="color:var(--dmute)">Кабинет ничего не рассылает от вашего имени</span></div></div>'+inv+'</div>';
    S.match=qs;
    var cb=function(){var b2=$('#invb');if(b2)b2.disabled=!($('#cok1').checked&&$('#cok2').checked)};['#cok1','#cok2'].forEach(function(s){var e=$(s);if(e)e.addEventListener('change',cb)});
  }).catch(function(e){b.innerHTML=errBox(e)});
}

/* ---------- Заметки ---------- */
function tabNotes(c,b){
  b.innerHTML='<div class="skel" style="height:200px"></div>';
  api('note/list',null,{cid:c.id}).then(function(ns){
    b.innerHTML='<div class="stack lg"><form class="card rv stack" id="nfm"><div class="row" style="justify-content:space-between"><h2>Заметка для себя</h2><span class="lock-l">'+ic('lock')+'Видите только вы. Orbiq тоже не видит</span></div><textarea class="ta" id="ntx" placeholder="Мысль, наблюдение, что не забыть" style="min-height:96px"></textarea><div class="row">'+btn('Сохранить заметку','dark sm','type="submit"','check')+'</div></form>'+
    '<div class="stack">'+(ns.length?ns.map(function(n,i){return '<div class="note rv" style="--i:'+i+'"><div>'+E(n.text).replace(/\n/g,'<br>')+'</div><div class="nf"><span>'+E(fmtDate(n.at,true))+'</span><span class="row" style="gap:4px">'+(hasNet()&&!isOwner()?'<button type="button" class="btn xs soft" data-a="nfwd" data-n="'+E(n.id)+'">'+ic('send')+'Передать через Orbiq</button>':'')+'<button type="button" class="ibtn" data-a="ndel" data-n="'+E(n.id)+'" aria-label="Удалить">'+ic('trash')+'</button></span></div></div>'}).join(''):'<p class="hint">Заметок пока нет</p>')+'</div></div>';
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
      :'<div class="infob">'+ic('mic')+'<span>Нажмите микрофон на клавиатуре телефона и говорите. Или вставьте готовый текст.</span></div>';
    page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+hd('Диктовка · '+E(c.alias),'Расскажите о клиенте')+
      '<div class="dic"><aside class="card qs rv"><span class="kick">Отвечайте в любом порядке, неизвестное пропускайте</span>'+qs+'</aside><div class="stack rv" style="--i:2">'+micB+
      '<textarea class="ta bigta" id="dtx" placeholder="Говорите своими словами. Название компании можно заменить отраслью"></textarea><p class="hint">Аудио не хранится. Перед отправкой вы увидите текст и уберете лишнее.</p><div class="row">'+btn('Проверить текст','pri mag','data-a="dcheck"','ar')+'<a class="link mute" href="#/c/'+E(id)+'">Отмена</a></div></div></div>',function(){
      var t=$('#dtx');var saved=sessionStorage.getItem('oc_d_'+id);if(saved)t.value=saved;t.addEventListener('input',function(){sessionStorage.setItem('oc_d_'+id,t.value)});
      if(!SR)return;
      var chk=$('#srok'),mb=$('#micb'),st=$('#mst'),sh=$('#msh'),end=$('#mend');
      chk.addEventListener('change',function(){localStorage.setItem('oc_sr_ok',chk.checked?'1':'0');mb.disabled=!chk.checked});
      var base='';
      mb.addEventListener('click',function(){
        if(REC){stopRec();mb.classList.remove('on');st.textContent='Продолжить';sh.textContent='Пауза. Нажмите, чтобы продолжить';return}
        var r=new SR();r.lang='ru-RU';r.continuous=true;r.interimResults=true;base=t.value?t.value.replace(/\s*$/,' '):'';
        r.onresult=function(ev){var fin='',tmp='';for(var i=0;i<ev.results.length;i++){var x=ev.results[i];if(x.isFinal)fin+=x[0].transcript;else tmp+=x[0].transcript}t.value=base+fin+tmp;sessionStorage.setItem('oc_d_'+id,t.value)};
        r.onerror=function(ev){if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){toast('Микрофон недоступен. Наберите или вставьте текст','alert')}else if(ev.error!=='no-speech'&&ev.error!=='aborted')toast('Распознавание прервалось. Нажмите еще раз','alert');mb.classList.remove('on');st.textContent='Диктовать';REC=null};
        r.onend=function(){if(REC===r&&!r._stop){try{r.start()}catch(e){}}};
        try{r.start();REC=r;mb.classList.add('on');st.textContent='Идет запись';sh.textContent='Нажмите, чтобы поставить паузу';end.hidden=false}catch(e){toast('Не получилось включить микрофон','alert')}
      });
      end.addEventListener('click',function(){stopRec();mb.classList.remove('on');st.textContent='Диктовать';sh.textContent='Запись завершена. Проверьте текст';end.hidden=true});
    });
  }).catch(function(e){page('clients',errBox(e))});
}

/* Экран очистки перед отправкой: подсветка почты, телефонов, ссылок, имен */
function scrubStage(cid,text,source){
  var finds=findIds(text);var raw=text;
  var draw=function(box){
    var n=finds.filter(function(f){return f.on}).length;
    box.querySelector('#scv').innerHTML=markIds(raw,finds);
    box.querySelector('#scl').innerHTML=finds.length?finds.map(function(f){return '<label><input type="checkbox" data-fi="'+f.i+'" '+(f.on?'checked':'')+' class="chk-in"><span>'+E(f.v)+'</span><span class="ty">'+IDT[f.t]+'</span></label>'}).join(''):'<p class="hint">Похожего на контакты не нашли. Автопроверка пропускает редкие детали, перечитайте текст сами.</p>';
    box.querySelector('#scn').textContent=n?'Скрыть '+n+' и отправить':'Отправить на разбор';
  };
  var el=sheet('<div class="kick">Шаг перед отправкой</div><h2>Проверьте текст</h2><p class="hint">Подсвечено то, что похоже на контакты, ссылки, имена и компании. Отмеченное заменим на [скрыто]. Текст уходит на разбор только после вашего подтверждения.</p><div class="grid2" style="grid-template-columns:1.5fr 1fr;align-items:start"><div class="stack" style="gap:8px"><div class="scrub" id="scv"></div><textarea class="ta" id="sce" hidden style="min-height:260px"></textarea><button type="button" class="link" id="sct" style="align-self:flex-start">Изменить текст</button></div><div class="stack" style="gap:8px"><span class="lbl">Найдено</span><div class="finds" id="scl"></div></div></div><div class="row">'+'<button type="button" class="btn pri" id="scg">'+ic('send')+'<span id="scn">Отправить на разбор</span></button><button type="button" class="link mute" data-a="sclose">Вернуться</button></div>',true);
  draw(el);
  el.addEventListener('change',function(e){var i=e.target.getAttribute('data-fi');if(i!=null){finds[+i].on=e.target.checked;draw(el)}});
  var ed=false;$('#sct',el).addEventListener('click',function(){var v=$('#scv',el),ta=$('#sce',el);if(!ed){ta.value=raw;ta.hidden=false;v.hidden=true;this.textContent='Готово'}else{raw=ta.value;finds=findIds(raw);ta.hidden=true;v.hidden=false;this.textContent='Изменить текст';draw(el)}ed=!ed});
  $('#scg',el).addEventListener('click',function(){if(ed){raw=$('#sce',el).value;finds=findIds(raw)}var clean=stripIds(raw,finds).trim();if(!clean){toast('Текст пустой','alert');return}var b=this;b.disabled=true;$('#scn',el).textContent='Разбираем…';
    api('client/extract',{id:cid,text:clean,source:source}).then(function(r){S.pending[cid]={proposals:(r.proposals||[]).map(function(p,i){return Object.assign({k:i,st:null},p)}),contradictions:r.contradictions||[],source:source};sessionStorage.removeItem('oc_d_'+cid);closeSheet();go('#/c/'+cid+'/review')})
    .catch(function(e){b.disabled=false;$('#scn',el).textContent='Отправить на разбор';toast(e.status===429?'Слишком много запросов. Попробуйте через минуту':'Разбор не удался. Карточка не изменилась','alert')})});
}

/* ================= Проверьте изменения ================= */
function vReview(id){
  var P=S.pending[id];if(!P){go('#/c/'+id);return}
  var c=S.card&&S.card.id===id?S.card:null;
  var draw=function(){
    var props=P.proposals;var ok=props.filter(function(p){return p.st==='ok'}).length;
    var bySec=SECTORS.map(function(s){var l=props.filter(function(p){return p.cell.indexOf(s.id+'.')===0});if(!l.length)return '';
      return '<div class="sh"><i style="background:'+s.hex+'"></i>'+E(s.name)+'</div>'+l.map(function(p){return '<div class="prop rv '+(p.st==='ok'?'ok':p.st==='del'?'del':'')+'" data-k="'+p.k+'"><span class="q">'+E(cellQ(p.cell))+'</span><input class="in" data-pv="'+p.k+'" value="'+E(p.value)+'" '+(p.st==='del'?'disabled':'')+'><div class="ctl"><div class="kind">'+Object.keys(KIND).map(function(k){return '<button type="button" class="'+(p.kind===k?'on':'')+'" data-a="pkind" data-k="'+p.k+'" data-v="'+k+'">'+KIND[k]+'</button>'}).join('')+'</div></div>'+(p.conflict?'<div class="cf">Сейчас в карточке: «'+E(p.conflict)+'». Подтвердите, если новое точнее</div>':'')+'<div class="row" style="grid-column:1/-1">'+(p.st==='del'?'<button type="button" class="link" data-a="pst" data-k="'+p.k+'" data-v="">Вернуть</button>':btn(p.st==='ok'?'Подтверждено':'Подтвердить','sm '+(p.st==='ok'?'':'soft'),'data-a="pst" data-k="'+p.k+'" data-v="'+(p.st==='ok'?'':'ok')+'"','check')+'<button type="button" class="link mute" data-a="pst" data-k="'+p.k+'" data-v="del">Удалить</button>')+'</div></div>'}).join('')}).join('');
    var contra=P.contradictions.length?'<div class="warnb">'+ic('alert')+'<div><b>Противоречия</b><ul style="margin:6px 0 0;padding-left:18px">'+P.contradictions.map(function(x){return '<li>'+E(typeof x==='string'?x:(x.text||x.cell+': '+x.value))+'</li>'}).join('')+'</ul></div></div>':'';
    page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+(c?E(c.alias):'Карточка')+'</a>'+hd('Разбор · '+props.length+' '+plural(props.length,'факт','факта','фактов'),'Проверьте изменения',btn('Подтвердить все','sec','data-a="pall"','check'))+
      '<div class="rvw">'+(props.length?'':'<div class="card">'+emptyBox('Фактов не нашли','Попробуйте рассказать подробнее или ответить на вопросы с экрана диктовки','<a class="btn sec" href="#/c/'+E(id)+'/dictate">К диктовке</a>')+'</div>')+contra+bySec+
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
      page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a><div class="cgrid"><div class="lft" id="ringw-slot"></div><div class="stack lg"><div><div class="kick">Сохранено</div><h1 style="font-family:var(--s);font-weight:600;font-size:clamp(36px,4vw,56px);line-height:1;letter-spacing:-.02em;margin-top:8px"><span class="mask"><span>Что изменилось</span></span></h1></div><ul class="chg" style="list-style:none;padding:0;margin:0">'+(r.changed||[]).map(function(x,i){return '<li class="rv row" style="--i:'+(i+2)+'"><span class="tchk on">'+ic('check')+'</span>'+E(x)+'</li>'}).join('')+'</ul><div class="row">'+btn('Посмотреть подборку','pri mag','data-a="go" data-h="#/c/'+E(id)+'/match"','spark')+'<a class="btn sec" href="#/c/'+E(id)+'">К карточке</a></div></div></div>',function(){mountRing(c,true)});
    })}).catch(function(e){toast(e.message||'Не сохранилось. Предыдущая версия карточки на месте','alert')});
}

/* ================= Из моей нейросети ================= */
function vAI(id){
  loading('clients');
  api('client/get',null,{id:id}).then(function(c){if(!c.mine){go('#/c/'+id);return}S.card=c;
    page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+hd('Исследование · '+E(c.alias),'Добавить из моей нейросети')+
    '<div class="ai3"><div class="card spot rv"><span class="no">1</span><h2>Скопируйте задание</h2><p class="hint">Готовый запрос на глубокий поиск по открытым источникам. Имя и фамилию вы впишете только в своей нейросети.</p><div class="prompt" id="prm">'+E(AI_TASK)+'</div><div class="row">'+btn('Скопировать задание','pri mag','data-a="copytask"','copy')+'<button type="button" class="link" data-a="prmtog">Показать полностью</button></div></div>'+
    '<div class="card spot rv" style="--i:1"><span class="no">2</span><h2>Выполните в своей нейросети с веб-поиском</h2><p class="hint">ChatGPT, Claude, Perplexity или другая с поиском. Orbiq не получает ваш поисковый запрос.</p><div class="warnb" style="margin-top:auto">'+ic('alert')+'<span>Внешний сервис увидит введенное вами имя. Проверьте его настройки обработки данных. Простое удаление фамилии не гарантирует анонимность.</span></div></div>'+
    '<div class="card dk spot rv" style="--i:2"><span class="no">3</span><h2 style="color:#fff">Выберите MD-файл</h2><p class="hint" style="color:var(--dmute)">Файл profile.md из ответа нейросети. Он читается на устройстве, до отправки вы увидите текст.</p><label class="drop" id="drop" style="margin-top:auto">'+ic('upload')+'<span><b style="color:#fff">Выбрать файл</b><br>или перетащите сюда</span><input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" id="mdf" hidden></label><button type="button" class="lg-l" data-a="mdpaste" style="align-self:center">Вставить текст вместо файла</button></div></div>',function(){
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
  api('client/get',null,{id:id}).then(function(c){
    var reqs=(c.requests||[]).filter(function(r){return r.status!=='closed'});
    if(!hasNet()){page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+emptyBox('Пока недоступно','Предлагать услуги через Orbiq можно после проверки портфеля','<a class="btn sec" href="#/portfolio">К портфелю</a>'));return}
    page('clients','<a class="back" href="#/c/'+E(id)+'">'+ic('al')+E(c.alias)+'</a>'+hd('Обращение · '+E(c.alias),'Предложить через Orbiq')+
    '<div class="grid2" style="grid-template-columns:1.4fr 1fr;align-items:start"><form class="card stack rv" id="of"><div class="fld"><label for="oreq">Какой запрос</label>'+sel('req',reqs.map(function(r){return [r.id,(CATS[r.cat]||'')+(r.text?' · '+r.text:'')]}),pre||(reqs[0]&&reqs[0].id),null,'id="oreq"')+'</div>'+
      '<div class="fld"><label for="ooff">Что предлагаете</label><textarea class="ta" id="ooff" placeholder="Что получит клиент, в какие сроки, кто исполняет" required></textarea></div>'+
      '<div class="fld"><label for="oterm">Условия</label><input class="in" id="oterm" placeholder="Например, 10% от сделки"></div>'+
      '<div class="fld"><label>Вложение, по желанию</label><label class="btn sec sm" style="align-self:flex-start">'+ic('clip')+'<span id="oattn">Выбрать файл до 700 КБ</span><input type="file" id="oatt" hidden></label></div>'+
      '<p class="err" id="oerr" hidden></p><div class="row">'+btn('Отправить в Orbiq','pri mag','type="submit"','send')+'</div></form>'+
    '<div class="card dk rv" style="--i:2;display:flex;flex-direction:column;gap:14px"><span class="kick" style="color:var(--acc)">Кто увидит</span><div class="ql" style="color:rgba(244,241,236,.85)"><div style="border-color:var(--dline)"><b style="color:#fff;font-family:var(--m);font-size:11px">01</b>Только владелец Orbiq</div><div style="border-color:var(--dline)"><b style="color:#fff;font-family:var(--m);font-size:11px">02</b>Orbiq согласует условия и комиссию</div><div style="border:0"><b style="color:#fff;font-family:var(--m);font-size:11px">03</b>Партнер клиента решает, передать ли клиенту</div></div><p class="hint" style="color:var(--dmute)">Личность второго партнера скрыта. Прямого чата нет. Статус увидите в разделе «Обращения».</p></div></div>',function(){
      var att=null;$('#oatt').addEventListener('change',function(){var f=this.files[0];if(!f)return;if(f.size>700*1024){toast('Файл больше 700 КБ','alert');this.value='';return}var r=new FileReader();r.onload=function(){att={name:f.name,dataUrl:r.result};$('#oattn').textContent=f.name};r.readAsDataURL(f)});
      $('#of').addEventListener('submit',function(e){e.preventDefault();var off=$('#ooff').value.trim(),er=$('#oerr');if(!off){er.hidden=false;er.innerHTML=ic('alert')+'Опишите предложение';return}
        var b=this.querySelector('.btn');b.disabled=true;
        api('rq/create',{cid:id,requestId:$('#oreq').value,offer:off,terms:$('#oterm').value.trim(),attachment:att||undefined}).then(function(){
          page('clients','<div class="card rv" style="max-width:640px;margin:40px auto;text-align:center;padding:48px 32px;display:flex;flex-direction:column;gap:16px;align-items:center"><span class="tchk on" style="width:56px;height:56px">'+ic('check')+'</span><h1 style="font-family:var(--s);font-weight:600;font-size:44px;line-height:1">Обращение у Orbiq</h1><p class="hint" style="font-size:16px">Статус «Новое». Ответ придет в раздел «Обращения»'+(S.me.partner&&S.me.partner.tg&&S.me.partner.tg.connected?' и в Telegram':'')+'.</p><div class="row" style="justify-content:center"><a class="btn dark" href="#/requests">Мои обращения</a><a class="btn sec" href="#/clients">К клиентам</a></div></div>')})
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
    page('plans',hd('Задачи и календарь','Планы')+'<div class="stack lg">'+taskForm(null,cl)+'<div class="cols3">'+col('Сегодня',today,'','На сегодня задач нет')+col('Позже',later,'','Запланируйте следующий шаг')+col('Просрочено',late,late.length?'late':'','Просроченных нет')+'</div>'+
      (done.length?'<details class="fold"><summary>Завершено · '+done.length+ic('down')+'</summary><div>'+done.map(function(t){return taskRow(t,cl)}).join('')+'</div></details>':'')+
      '<div class="card rv grid2" style="grid-template-columns:1fr 1fr;gap:28px"><div class="stack"><div class="row">'+ic('cal')+'<h2>Календарь</h2></div><p class="hint">Личная ссылка подписки. В календаре задачи называются нейтрально: «Задача Orbiq». Частоту обновления задает приложение календаря, напоминания к точному времени присылает CRM.</p><div id="ical">'+btn('Получить ссылку календаря','dark sm','data-a="ical"','cal')+'</div><p class="hint">Новая ссылка отключает прежнюю.</p></div><div class="stack">'+
      '<details class="fold" style="background:#F7F7F4"><summary>Apple Календарь'+ic('down')+'</summary><div><ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px"><li>На Mac: Файл → Новая подписка на календарь</li><li>На iPhone: Настройки → Календарь → Учетные записи → Добавить → Другое → Подписной календарь</li><li>Вставьте ссылку и сохраните</li></ol></div></details>'+
      '<details class="fold" style="background:#F7F7F4"><summary>Google Календарь'+ic('down')+'</summary><div><ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px"><li>Откройте calendar.google.com на компьютере</li><li>Слева «Другие календари» → плюс → «Добавить по URL»</li><li>Вставьте ссылку и нажмите «Добавить календарь»</li></ol></div></details></div></div></div>',function(){S.tasksAfter=vPlans;bindTaskForm(null,vPlans)});
  }).catch(function(e){page('plans',errBox(e))});
}

/* ================= Обращения партнера ================= */
function vRequests(){
  loading('requests');
  api('rq/mine').then(function(d){var sent=d.sent||[],inb=d.inbox||[];
    var th=function(rid,list,side){return '<div class="thread">'+list.map(function(m){var me=m.from===side;return '<div class="msg'+(me?' me':'')+'">'+E(m.text)+(m.attach?'<span class="att">'+ic('clip')+'Вложение</span>':'')+'<small>'+(me?'Вы':'Orbiq')+' · '+E(fmtDate(m.at,true))+'</small></div>'}).join('')+'</div><form class="comp" data-rid="'+E(rid)+'" style="margin-top:10px"><textarea class="ta" placeholder="Ответить Orbiq" rows="1"></textarea><button class="btn ic dark" type="submit" aria-label="Отправить">'+ic('send')+'</button></form>'};
    page('requests',hd('Только через Orbiq','Обращения')+'<div class="grid2" style="align-items:start"><div class="stack"><h2 class="sec-h">Мои предложения</h2>'+(sent.length?sent.map(function(r,i){return '<details class="fold rv" style="--i:'+i+'"><summary><span class="stack" style="gap:6px"><span class="row">'+stChip(r.status)+'<span class="kick">'+E(fmtDate(r.at))+'</span></span><span>'+E(r.alias||'Клиент')+' · '+E(CATS[r.request&&r.request.cat]||'Запрос')+'</span><span class="hint" style="font-weight:400">'+E(r.offer)+'</span></span>'+ic('down')+'</summary><div>'+th(r.id,r.thread||[],'initiator')+'</div></details>'}).join(''):'<div class="card">'+emptyBox('Предложений пока нет','Найдите запрос во вкладке «Все» и нажмите «Предложить через Orbiq»',hasNet()?'<a class="btn sec" href="#/clients" data-a="scopeall">Открыть все карточки</a>':'')+'</div>')+'</div>'+
      '<div class="stack"><h2 class="sec-h">Orbiq о ваших клиентах</h2>'+(inb.length?inb.map(function(r,i){return '<div class="card rv" style="--i:'+i+'"><div class="row" style="justify-content:space-between;margin-bottom:12px"><b>'+E(r.alias)+'</b>'+stChip(r.status)+'</div>'+th(r.id,r.thread||[],'cardOwner')+'</div>'}).join(''):'<div class="card"><p class="hint">Когда другой партнер предложит услугу вашему клиенту, Orbiq напишет сюда. Решение передавать или нет за вами.</p></div>')+'</div></div>',function(m){
      $$('form.comp',m).forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var t=f.querySelector('textarea').value.trim();if(!t)return;api('rq/reply',{rid:f.getAttribute('data-rid'),text:t}).then(function(){toast('Отправлено');vRequests()}).catch(function(e2){toast(e2.message,'alert')})})})});
  }).catch(function(e){page('requests',errBox(e))});
}

/* ================= Портфель ================= */
function vPortfolio(){
  loading('portfolio');
  api('pf/status').then(function(p){var need=Math.max(0,(p.of||30)-p.counted);var sub=p.status==='submitted'||p.status==='decided';
    var dec=p.decision?'<div class="card rv" style="--i:1;background:'+(p.decision==='approve'?'rgba(0,135,95,.08)':p.decision==='reject'?'rgba(194,54,27,.07)':'rgba(245,180,0,.12)')+'"><span class="kick">Решение Orbiq</span><h2 style="margin-top:6px">'+({approve:'Портфель принят. Пробный доступ открыт',clarify:'Нужно уточнение по выбранной карточке',reject:'Портфель не принят'}[p.decision]||'')+'</h2>'+(p.reason?'<p class="hint">'+E(p.reason)+'</p>':'')+'</div>':'';
    page('portfolio',hd('Проверка для пробного доступа','Портфель')+'<div class="grid2" style="grid-template-columns:1.1fr 1fr;align-items:stretch;margin-bottom:16px"><div class="card dk spot rv" style="display:flex;flex-direction:column;gap:16px"><span class="kick" style="color:var(--dmute)">Зачтено</span><div class="big" style="color:#fff"><span id="pfc">0</span><small style="color:var(--dmute)">из '+(p.of||30)+'</small></div><div class="bar"><i style="width:'+Math.min(100,Math.round(p.counted/(p.of||30)*100))+'%"></i></div>'+
      (sub?'<p style="margin:0;color:rgba(244,241,236,.85)">Отправлено '+E(fmtDate(p.submittedAt))+'. '+(p.sample&&p.sample.length?'Для сверки выбраны: <b style="color:#fff">'+p.sample.map(function(s){return E(s.alias||s.cid)}).join(', ')+'</b>. Orbiq назначит закрытую сессию.':'')+'</p>':
       '<div class="row">'+btn(need?'Нужно еще '+need:'Отправить на проверку','pri mag','data-a="pfsend" '+(need?'disabled':''),'send')+'</div>')+'</div>'+
      '<div class="card rv" style="--i:1"><h2>Что засчитываем</h2><ul style="margin:12px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:8px;font-size:14.5px"><li>Не меньше 15 из 18 ячеек круга с фактами</li><li>Капитал от $1 млн и основание оценки</li><li>Роль знакомства, когда общались, тема</li><li>Запрос в другой категории, чем ваша</li><li>Без повторов и одинаковых описаний</li></ul><p class="hint" style="margin-top:12px">Выборочная проверка: из каждой полной двадцатки одна карточка и одна из остатка.</p></div></div>'+dec+
      '<div class="card rv" style="--i:2"><h2 style="margin-bottom:10px">Карточки</h2><div class="pfrows">'+(p.rows||[]).map(function(r){return '<div class="pfrow"><span class="ic '+(r.ok?'y':'n')+'">'+ic(r.ok?'check':'x')+'</span><b>'+E(r.alias)+'</b><span class="why">'+(r.ok?'Зачтена':E((r.reasons||[]).join(' · ')))+'</span>'+(String(r.cid).indexOf('c_')===0||!DEMO?'<a class="link" href="#/c/'+E(r.cid)+'">Открыть</a>':'<span></span>')+'</div>'}).join('')+'</div></div>',function(){count($('#pfc'),0,p.counted,1200)});
  }).catch(function(e){page('portfolio',errBox(e))});
}

/* ================= Тариф ================= */
function vTariff(){
  var p=S.me.partner||{},t=p.tier;var steps=['candidate','trial','paid'];var idx=steps.indexOf(t);
  var tr=p.trial||{},pd=p.paid||{};
  var quota='';if(t==='trial'||tr.quota){var used=tr.used||0,q=tr.quota||3;var dots='';for(var i=0;i<q;i++)dots+='<i class="'+(i<used?'u':'')+'" style="animation-delay:'+(i*120)+'ms">'+(i<used?ic('check'):'')+'</i>';
    quota='<div class="card rv" style="--i:2;display:flex;flex-direction:column;gap:14px"><span class="kick">Пробные знакомства</span><div class="row" style="gap:20px"><div class="quota">'+dots+'</div><div><b style="font-size:22px">'+used+' из '+q+'</b><div class="hint">'+(t==='trial'?'Проба до '+E(fmtDate(tr.end)):'Проба завершена')+'</div></div></div><p class="hint">Знакомство засчитывается, когда клиент согласился обсудить предложение и Orbiq вас представил. Отказ и молчание квоту не расходуют.</p></div>'}
  var pay=t==='paid'?'<div class="card rv" style="--i:3;display:flex;flex-direction:column;gap:10px"><span class="kick">Платное направление</span><div class="row">'+(pd.seats||[]).map(function(s){return catChip(s)}).join('')+'</div><div class="ql"><div><span class="grow">Первый платеж</span><b>'+E(pd.pay1?fmtDate(pd.pay1):'—')+'</b></div><div><span class="grow">Второй платеж</span><b>'+E(pd.pay2?fmtDate(pd.pay2):pd.pay2Due?'до '+fmtDate(pd.pay2Due):'—')+'</b></div></div></div>':'';
  var L=[['candidate','Кандидат','Ведете свою CRM, видите спрос в своем направлении, подаете портфель из 30 карточек'],['trial','Пробный','Предлагаете услуги через Orbiq, продаете продукты сети, до трех знакомств для своего продукта'],['paid','Платный','Постоянные представления в вашем направлении и семейные приглашения. Два места на направление']];
  page('tariff',hd('Ваш статус','Тариф')+'<div class="ladder rv" style="margin-bottom:16px">'+L.map(function(x,i){return '<div class="'+(i===idx?'on':i<idx?'done':'card')+'"><span class="kick">'+(i===idx?'Сейчас':i<idx?'Пройдено':'Шаг '+(i+1))+'</span><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div>'}).join('')+'</div><div class="grid2" style="align-items:start">'+(quota||'')+(pay||'')+
    (t==='candidate'?'<div class="card rv" style="--i:2;display:flex;flex-direction:column;gap:12px"><span class="kick">Следующий шаг</span><h2>Соберите портфель</h2><p class="hint">30 карточек с реальными запросами на другие услуги. После проверки откроются три месяца пробы.</p><a class="btn dark sm" href="#/portfolio" style="align-self:flex-start">К портфелю</a></div>':'')+
    (t!=='paid'?'<div class="card rv" style="--i:3;display:flex;flex-direction:column;gap:12px"><span class="kick">Условия пилота</span><h2>Платное направление</h2><p class="hint">$20 000 за 24 месяца для одного направления, два платежа. Можно оплатить сразу, без портфеля. Подключение обсуждается с Orbiq лично.</p></div>':'')+
    (p.suspended?'<div class="card rv"><h2>Доступ приостановлен</h2><p class="hint">Согласованные выплаты и обязательства сохраняются.</p></div>':'')+'</div>');
}

/* ================= Уведомления ================= */
function vNotify(){
  var p=S.me.partner||{},tg=p.tg||{},on=tg.on||{};var conn=!!tg.connected;
  var ev=isOwner()?[['rq_new','Новое обращение'],['rq_reply','Ответ партнера'],['pf_submit','Портфель на проверку']]:[['orbiq_msg','Сообщение от Orbiq'],['rq_status','Смена статуса моего обращения'],['reminder','Мои напоминания']];
  page('notify',hd('Telegram','Уведомления')+'<div class="grid2" style="grid-template-columns:1.3fr 1fr;align-items:start"><div class="card rv stack"><div class="row" style="justify-content:space-between"><h2>Подключение</h2>'+(conn?'<span class="chip ok">'+ic('check')+'Подключен</span>':'<span class="chip line">Не подключен</span>')+'</div>'+
    '<ol class="ql" style="list-style:none;padding:0;margin:0">'+['Нажмите «Подключить Telegram»','Откройте бота Orbiq','Нажмите Start','Получите тестовое сообщение'].map(function(s,i){return '<div><b style="font-family:var(--m);font-size:11px;color:var(--acc)">0'+(i+1)+'</b><span>'+s+'</span></div>'}).join('')+'</ol>'+
    '<div class="row">'+(conn?btn('Отключить','sec','data-a="tgoff"','x'):btn('Подключить Telegram','pri mag','data-a="tglink"','tg'))+'<span id="tgw"></span></div>'+
    '<p class="hint">Текст уведомления нейтральный: «Новое обращение в Orbiq. Открыть». Без Telegram все события остаются в кабинете.</p></div>'+
    '<div class="card rv stack" style="--i:1"><h2>О чем сообщать</h2>'+ev.map(function(e){return '<label class="chk" style="padding:6px 0"><input type="checkbox" data-tgp="'+e[0]+'" '+(on[e[0]]!==false?'checked':'')+' '+(conn?'':'disabled')+'><span>'+e[1]+'</span></label>'}).join('')+(conn?'':'<p class="hint">Переключатели откроются после подключения</p>')+'</div></div>',function(m){
    $$('[data-tgp]',m).forEach(function(c){c.addEventListener('change',function(){var o={};$$('[data-tgp]',m).forEach(function(x){o[x.getAttribute('data-tgp')]=x.checked});api('tg/events',{on:o}).then(function(){toast('Сохранено')}).catch(function(e){toast(e.message,'alert')})})})});
}

/* ================= Спрос для кандидата ================= */
function vDemand(){
  loading('demand');
  api('demand').then(function(list){
    var tot=list.reduce(function(a,b){return a+(b.count||0)},0);
    page('demand',hd('Обезличенно · без имен','Спрос в вашем направлении')+'<div class="dem">'+
      '<div class="card dk spot rv" style="grid-column:span 5;justify-content:space-between"><span class="kick" style="color:var(--dmute)">Открытых запросов</span><div class="k" style="color:#fff" id="dtot">0</div><p class="hint" style="color:var(--dmute)">Счетчик без дублей. Контакты клиентов остаются у партнеров, которые их привели.</p></div>'+
      list.map(function(d,i){return '<div class="card rv" style="--i:'+(i+1)+';grid-column:span 7"><div class="row" style="justify-content:space-between">'+catChip(d.cat)+'<b style="font-size:28px;font-family:var(--s)">'+d.count+'</b></div><div class="ex">'+(d.examples||[]).map(function(x){return '<div><span>'+E(x.text)+'</span><span class="chip line">'+E(ageL(x.age))+'</span><span class="chip line">'+E(capL(x.capital))+'</span></div>'}).join('')+'</div></div>'}).join('')+
      '<div class="card rv" style="grid-column:span 12;display:flex;flex-direction:row;gap:20px;align-items:center;flex-wrap:wrap;justify-content:space-between"><div><span class="kick">Как получить доступ к запросам</span><h2 style="margin-top:6px">30 карточек → проверка → три месяца пробы</h2></div><a class="btn pri mag" href="#/portfolio">'+ic('pie')+'<span class="r"><span>К портфелю</span><span aria-hidden="true">К портфелю</span></span></a></div></div>',function(){count($('#dtot'),0,tot,1400)});
  }).catch(function(e){page('demand',errBox(e))});
}

/* ================= Владелец: партнеры ================= */
function pStatus(p){if(p.suspended)return '<span class="chip err">Приостановлен</span>';var iv=p.invite||{};if(iv.status==='created')return '<span class="chip warn">Ссылка до '+E(fmtDate(iv.expires))+'</span>';if(iv.status==='revoked')return '<span class="chip line">Приглашение отозвано</span>';return '<span class="chip ok">Активен</span>'}
function vPartners(){
  loading('partners');
  Promise.all([api('partners'),api('seat/list')]).then(function(r){var ps=r[0],seats=r[1];S.partners=ps;
    page('partners',hd('Только владелец Orbiq','Партнеры',btn('Добавить партнера','pri mag','data-a="pinv"','plus'))+
    '<div class="tbl-w rv" style="margin-bottom:22px"><table class="tbl"><thead><tr><th>Партнер</th><th>Статус</th><th>Тариф</th><th>Направления</th><th>Клиенты</th><th>Telegram</th><th>Активность</th><th class="sr">Действия</th></tr></thead><tbody>'+ps.map(function(p,i){
      return '<tr class="rv" style="--i:'+i+';cursor:default"><td class="c-nm"><span class="nm" style="flex-direction:column;align-items:flex-start;gap:2px">'+E(p.name)+'<small class="mu" style="font-weight:400;font-size:12.5px">'+E(p.email)+'</small></span></td>'+
      '<td class="c-rq">'+pStatus(p)+'</td><td class="x" data-l="Тариф"><span class="fsel">'+sel('tier',[['candidate','Кандидат'],['trial','Пробный'],['paid','Платный']],p.tier,null,'data-ptier="'+E(p.id)+'" style="min-height:36px;font-size:13.5px"')+'</span></td>'+
      '<td class="x" data-l="Направления">'+(p.categories||[]).map(function(c){return '<span class="chip" style="margin:2px">'+E(CATS[c]||c)+'</span>'}).join('')+'</td>'+
      '<td class="x num" data-l="Клиенты">'+(p.clients||0)+'</td><td class="x" data-l="Telegram">'+(p.tg&&p.tg.connected?'<span class="chip ok">Подключен</span>':'<span class="mu">—</span>')+'</td><td class="x" data-l="Активность">'+(p.lastSeen?E(relDay(p.lastSeen)):'<span class="mu">—</span>')+'</td>'+
      '<td class="c-exp"><span class="menu"><button type="button" class="ibtn" data-a="pmenu" data-p="'+E(p.id)+'" aria-label="Действия">'+ic('more')+'</button></span></td></tr>'}).join('')+'</tbody></table></div>'+
    '<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 class="sec-h">Места по направлениям</h2><span class="kick">Два платных места на направление</span></div><div class="seats">'+seats.map(function(s,i){var sl='';for(var k=0;k<(s.max||2);k++){var x=s.seats[k];sl+='<i class="'+(x?'f':'')+'" title="'+E(x?x.name:'Свободно')+'">'+(x?E(x.name.split(' ')[0]):'Свободно')+'</i>'}return '<div class="seat rv" style="--i:'+i+'">'+catChip(s.cat)+'<div class="sl">'+sl+'</div>'+((s.waitlist||[]).length?'<span class="hint">Лист ожидания: '+s.waitlist.length+'</span>':'')+'</div>'}).join('')+'</div>',function(m){
      $$('[data-ptier]',m).forEach(function(s){s.addEventListener('change',function(){api('partner/tier',{pid:s.getAttribute('data-ptier'),tier:s.value}).then(function(){toast('Тариф изменен')}).catch(function(e){toast(e.message,'alert');vPartners()})})});
    });
  }).catch(function(e){page('partners',errBox(e))});
}
function partnerMenu(el){
  $$('.menu-p').forEach(function(x){x.remove()});var pid=el.getAttribute('data-p');var p=(S.partners||[]).find(function(x){return x.id===pid})||{};
  var m=document.createElement('div');m.className='menu-p';
  m.innerHTML=(p.invite&&p.invite.status!=='used'?'<button type="button" data-a="preinv" data-p="'+E(pid)+'">'+ic('redo')+'Выдать ссылку заново</button><button type="button" data-a="prevoke" data-p="'+E(pid)+'">'+ic('x')+'Отозвать приглашение</button>':'')+
    '<button type="button" data-a="ppay" data-p="'+E(pid)+'" data-w="1">'+ic('check')+'Отметить платеж 1</button><button type="button" data-a="ppay" data-p="'+E(pid)+'" data-w="2">'+ic('check')+'Отметить платеж 2</button>'+
    '<button type="button" class="'+(p.suspended?'':'d')+'" data-a="psusp" data-p="'+E(pid)+'" data-v="'+(p.suspended?'0':'1')+'">'+ic(p.suspended?'check':'pause')+(p.suspended?'Вернуть доступ':'Приостановить доступ')+'</button>';
  el.parentNode.appendChild(m);
}
function inviteSheet(){
  var chosen={};
  var el=sheet('<div class="kick">Новый партнер</div><h2>Добавить партнера</h2><form class="stack" id="pif"><div class="grid2"><div class="fld"><label for="pin">Имя</label><input class="in" id="pin" required></div><div class="fld"><label for="pie">Почта для входа</label><input class="in" id="pie" type="email" required></div></div><div class="fld"><label>Направления</label><div class="pills" id="pic">'+Object.keys(CATS).map(function(k){return '<button type="button" data-c="'+k+'">'+E(CATS[k])+'</button>'}).join('')+'</div></div><p class="err" id="pier" hidden></p><div class="row">'+btn('Создать ссылку','pri','type="submit"','send')+'</div><p class="hint">Ссылка одноразовая, действует 7 дней. Роль назначает сервер.</p></form><div id="pires"></div>');
  $('#pic',el).addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(!b)return;var c=b.getAttribute('data-c');chosen[c]=!chosen[c];b.classList.toggle('on',chosen[c])});
  $('#pif',el).addEventListener('submit',function(e){e.preventDefault();var n=$('#pin',el).value.trim(),em=$('#pie',el).value.trim(),er=$('#pier',el);if(!n||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){er.hidden=false;er.innerHTML=ic('alert')+'Нужны имя и корректная почта';return}
    api('partner/invite',{name:n,email:em,categories:Object.keys(chosen).filter(function(k){return chosen[k]})}).then(function(r){$('#pif',el).remove();$('#pires',el).innerHTML=linkBox(r.link,'Отправьте ссылку партнеру своим каналом. Действует до '+fmtDate(r.expires));if($('#main'))vPartners()}).catch(function(e2){er.hidden=false;er.innerHTML=ic('alert')+E(e2.message)})});
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
    page('inbox',hd('Очередь решений','Входящие')+'<div class="inbox'+(args[0]?' has-sel':'')+'">'+lst+'<div id="idet" class="'+(rid?'':'nosel')+'">'+(rid?'<div class="skel" style="height:420px"></div>':'<div class="card">'+emptyBox('Выберите обращение','Здесь откроются обе переписки и условия сделки')+'</div>')+'</div></div>',function(){if(rid)inboxDetail(rid)});
  }).catch(function(e){page('inbox',errBox(e))});
}
function inboxDetail(rid){
  var box=$('#idet');
  api('rq/get',null,{rid:rid}).then(function(r){S.rq=r;var d=r.deal||{};
    var th=function(side,title,who){var l=(r.threads||{})[side]||[];return '<div class="card stack"><div class="row" style="justify-content:space-between"><h3>'+title+'</h3><span class="kick">'+E(who)+'</span></div><div class="thread">'+(l.length?l.map(function(m){var me=m.from==='orbiq';return '<div class="msg'+(me?' me':'')+'">'+E(m.text)+(m.attach?'<span class="att">'+ic('clip')+E(r.attachment&&r.attachment.id===m.attach?r.attachment.name:'Вложение')+'</span>':'')+'<small>'+(me?'Orbiq':E(who))+' · '+E(fmtDate(m.at,true))+'</small></div>'}).join(''):'<p class="hint">Переписки пока нет</p>')+'</div>'+
      (side==='cardOwner'?'<div class="pick"><span class="lbl">Что переслать владельцу карточки</span><label class="chk"><input type="checkbox" data-pk="offer" checked><span>Предложение</span></label>'+(r.terms?'<label class="chk"><input type="checkbox" data-pk="terms"><span>Условия</span></label>':'')+(r.attachment?'<label class="chk"><input type="checkbox" data-pk="att" data-att="'+E(r.attachment.id)+'"><span>'+ic('clip')+' '+E(r.attachment.name)+'</span></label>':'')+'<button type="button" class="link" data-a="pkfill" style="align-self:flex-start">Собрать текст</button></div>':'')+
      '<form class="comp" data-to="'+side+'"><textarea class="ta" placeholder="Сообщение от Orbiq" rows="1"></textarea><button class="btn ic dark" type="submit" aria-label="Отправить">'+ic('send')+'</button></form><p class="err" data-warn="'+side+'" hidden></p></div>'};
    box.innerHTML='<div class="stack rv"><a class="back mob" href="#/inbox">'+ic('al')+'Все обращения</a><div class="card stack"><div class="row" style="justify-content:space-between"><div><span class="kick">Обращение · '+E(fmtDate(r.at,true))+'</span><h2 style="font-family:var(--s);font-size:34px;margin-top:6px">'+E(r.alias)+'</h2></div><span class="row">'+(r.initiator&&r.initiator.id&&r.request?btn('Засчитать знакомство','sm soft','data-a="intro" data-p="'+E(r.initiator.id)+'" data-r="'+E(r.id)+'"','handshake'):'')+(r.cid?'<a class="btn sm sec" href="#/c/'+E(r.cid)+'">Карточка</a>':'')+'</span></div>'+
      '<div class="who"><div><span class="lbl">Инициатор</span><b>'+E((r.initiator||{}).name)+'</b></div><div><span class="lbl">Владелец карточки</span><b>'+E((r.cardOwner||{}).name)+'</b></div><div><span class="lbl">Запрос</span><b style="font-size:14px;font-weight:500">'+(r.request?E(CATS[r.request.cat]||'')+(r.request.text?' · '+E(r.request.text):''):(r.fromNote?'Из заметки партнера':'—'))+'</b></div></div>'+
      '<div class="pub"><span class="lbl">Предложение</span><span>'+E(r.offer)+'</span>'+(r.terms?'<span class="lbl" style="margin-top:6px">Условия</span><span>'+E(r.terms)+'</span>':'')+(r.attachment?'<button type="button" class="link" style="margin-top:6px;display:inline-flex;gap:6px;align-self:flex-start" data-a="att" data-r="'+E(r.id)+'" data-id="'+E(r.attachment.id)+'">'+ic('clip')+E(r.attachment.name)+'</button>':'')+'</div></div>'+
      '<div class="two">'+th('initiator','Orbiq ↔ инициатор',(r.initiator||{}).name)+th('cardOwner','Orbiq ↔ владелец карточки',(r.cardOwner||{}).name)+'</div>'+
      '<form class="card stack" id="dealf"><div class="row" style="justify-content:space-between"><h3>Статус и условия сделки</h3><span class="lock-l">'+ic('lock')+'Видит только Orbiq</span></div><div class="seg" id="rqs" style="align-self:flex-start;flex-wrap:wrap">'+Object.keys(RQST).map(function(k){return '<button type="button" class="'+(r.status===k?'on':'')+'" data-v="'+k+'">'+RQST[k]+'</button>'}).join('')+'</div>'+
      '<div class="grid3" style="grid-template-columns:repeat(4,1fr)"><div class="fld"><label>Плательщик</label><input class="in" name="payer" value="'+E(d.payer||'')+'"></div><div class="fld"><label>Сумма, $</label><input class="in" name="amount" value="'+E(d.amount||'')+'"></div><div class="fld"><label>Процент</label><input class="in" name="percent" value="'+E(d.percent||'')+'"></div><div class="fld"><label>База расчета</label><input class="in" name="basis" value="'+E(d.basis||'')+'"></div></div><label class="chk"><input type="checkbox" name="received" '+(d.received?'checked':'')+'><span>Комиссия получена</span></label><div class="row">'+btn('Сохранить','dark sm','type="submit"','check')+'</div></form></div>';
    segs(box);
    var st=r.status;$('#rqs',box).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;st=b.getAttribute('data-v');$$('#rqs button',box).forEach(function(x){x.classList.toggle('on',x===b)});segs(box)});
    $('#dealf',box).addEventListener('submit',function(e){e.preventDefault();var f=e.target;api('rq/status',{rid:rid,status:st,deal:{payer:f.payer.value,amount:f.amount.value,percent:f.percent.value,basis:f.basis.value,received:f.received.checked}}).then(function(){toast('Сохранено');vInbox([rid])}).catch(function(e2){toast(e2.message,'alert')})});
    $$('form.comp',box).forEach(function(f){var ta=f.querySelector('textarea'),side=f.getAttribute('data-to'),w=$('[data-warn="'+side+'"]',box);
      ta.addEventListener('input',function(){var fs=findIds(ta.value).filter(function(x){return x.t!=='name'||x.on});w.hidden=!fs.length;if(fs.length)w.innerHTML=ic('alert')+'Похоже на контакт: '+E(fs.map(function(x){return x.v}).join(', '))+'. Уберите перед отправкой'});
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
    page('reviews',hd('Выборочная проверка','Проверки портфелей')+'<div class="infob rv" style="margin-bottom:16px">'+ic('shield')+'<span>Сверка идет в отдельной закрытой сессии. Имена, документы и ссылки сюда не записываются: остаются дата, решение по трем пунктам и нейтральная причина.</span></div>'+
    (rows.length?rows.map(function(x,i){var s=x.s;return '<div class="card rv stack" style="--i:'+i+';margin-bottom:16px"><div class="row" style="justify-content:space-between"><div><span class="kick">Отправлено '+E(fmtDate(s.submittedAt))+'</span><h2 style="font-family:var(--s);font-size:30px;margin-top:4px">'+E(x.p.name)+'</h2></div><span class="chip dark">Зачтено '+s.counted+' из '+(s.of||30)+'</span></div>'+
      (s.sample||[]).map(function(c){var dd=(s.decisions||{})[c.cid]||{};return '<form class="pub" data-pfd="'+E(x.p.id)+'" data-cid="'+E(c.cid)+'" style="gap:12px"><div class="row" style="justify-content:space-between"><b style="font-size:16px">'+E(c.alias||c.cid)+'</b>'+(dd.at?'<span class="chip ok">Решение записано</span>':'')+'</div><div class="dec">'+D.map(function(k){return '<div><span>'+k[1]+'</span><div class="seg" data-k="'+k[0]+'">'+[['yes','Да'],['no','Нет'],['insufficient','Мало сведений']].map(function(o){return '<button type="button" class="'+(dd[k[0]]===o[0]?'on':'')+'" data-v="'+o[0]+'">'+o[1]+'</button>'}).join('')+'</div></div>'}).join('')+'</div><div class="row"><input class="in grow" name="reason" placeholder="Нейтральная причина" value="'+E(dd.reason||'')+'" style="background:#fff">'+btn('Записать','sm dark','type="submit"','check')+'</div></form>'}).join('')+
      '<div class="row" style="border-top:1px solid var(--line);padding-top:14px"><input class="in grow" data-fr="'+E(x.p.id)+'" placeholder="Основание решения, его увидит партнер">'+btn('Одобрить','sm pri','data-a="pffin" data-p="'+E(x.p.id)+'" data-v="approve"','check')+btn('Запросить уточнение','sm sec','data-a="pffin" data-p="'+E(x.p.id)+'" data-v="clarify"')+btn('Отказать','sm danger','data-a="pffin" data-p="'+E(x.p.id)+'" data-v="reject"')+'<button type="button" class="link mute" data-a="pfext" data-p="'+E(x.p.id)+'">Расширить выборку</button>'+'</div></div>'}).join(''):'<div class="card">'+emptyBox('Проверок нет','Здесь появятся портфели кандидатов, отправленные на проверку')+'</div>'),function(m){
      $$('form[data-pfd] .seg',m).forEach(function(sg){sg.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;$$('button',sg).forEach(function(x){x.classList.toggle('on',x===b)});segs(sg.parentNode)})});
      $$('form[data-pfd]',m).forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var o={pid:f.getAttribute('data-pfd'),cid:f.getAttribute('data-cid'),reason:f.reason.value.trim()};$$('.seg',f).forEach(function(sg){var on=sg.querySelector('button.on');o[sg.getAttribute('data-k')]=on?on.getAttribute('data-v'):''});
        api('pf/decide',o).then(function(){toast('Решение записано');vReviews()}).catch(function(e2){toast(e2.message,'alert')})})});
    });
  }).catch(function(e){page('reviews',errBox(e))});
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
  more:function(){var items=navItems().slice(4);sheet('<h2>Еще</h2><nav class="stack" style="gap:6px">'+items.map(function(n){return '<a class="btn sec" style="justify-content:flex-start" href="#/'+n[0]+'" data-a="sclose">'+ic(n[2])+n[1]+'</a>'}).join('')+'<button type="button" class="btn soft" style="justify-content:flex-start" data-a="logout">'+ic('out')+'Выйти</button></nav>')},
  scope:function(el){if(el.disabled)return;S.list.scope=el.getAttribute('data-v');$$('.tools .seg button').forEach(function(b){b.classList.toggle('on',b===el)});segs();refreshTable()},
  scopeall:function(){S.list.scope='all'},
  fclear:function(){S.list.q='';S.list.cat='';S.list.interest='';S.list.capital='';S.list.investing='';vClients()},
  open:function(el,e){if(e.target.closest('[data-a="exp"]'))return;go('#/c/'+el.getAttribute('data-id'))},
  exp:function(el,e){e.stopPropagation();el.closest('tr').classList.toggle('open')},
  viewas:function(el){S.viewAs=el.getAttribute('data-v');S._animNext=S.viewAs==='own';render()},
  sec:function(el){var v=el.getAttribute('data-v');S.selSec=S.selSec===v?null:v;if(S.card)mountRing(S.card,false)},
  setf:function(el){var k=el.getAttribute('data-k'),v=el.getAttribute('data-v');var c=S.card;var cur=c[k];if(cur===v)v='';
    $$('.pills[data-k="'+k+'"] button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-v')===v&&!!v)});
    var p={};p[k]=v;if(k==='age'){p.cells={'about.age':v?{v:v,kind:'fact'}:null}}patch(p)},
  kids:function(el){var c=S.card;var n=(c.kids==null||c.kids==='')?0:+c.kids;n=Math.max(0,n+(+el.getAttribute('data-v')));if(c.kids==null&&+el.getAttribute('data-v')<0)return;$('#kidsv').textContent=n;patch({kids:n})},
  intdel:function(el){var a=(S.card.interests||[]).slice();a.splice(+el.getAttribute('data-i'),1);patch({interests:a}).then(function(){renderTab(S.card,'profile')})},
  rqst:function(el){var id=el.getAttribute('data-r'),v=el.getAttribute('data-v');var a=S.card.requests.map(function(r){return r.id===id?Object.assign({},r,{status:v}):r});patch({requests:a}).then(function(){renderTab(S.card,'profile')})},
  rqdel:function(el){var id=el.getAttribute('data-r');if(!confirm('Удалить запрос?'))return;var a=S.card.requests.filter(function(r){return r.id!==id});var pt=Object.assign({},S.card.publicText||{});delete pt[id];patch({requests:a,publicText:pt}).then(function(){renderTab(S.card,'profile')})},
  pubedit:function(el){var id=el.getAttribute('data-r');S.card.requests.forEach(function(r){if(r.id===id)r._edit=true});renderTab(S.card,'profile')},
  pubok:function(el){var id=el.getAttribute('data-r');var inp=$('[data-pub="'+id+'"]');var v=inp.value.trim();if(!v){toast('Впишите формулировку','alert');return}if(v.indexOf('[скрыто]')>=0){toast('Уберите [скрыто] из формулировки','alert');return}var f=findIds(v).filter(function(x){return x.on});if(f.length){toast('Уберите: '+f.map(function(x){return x.v}).join(', '),'alert');return}
    var pt=Object.assign({},S.card.publicText||{});pt[id]=v;var a=S.card.requests.map(function(r){var o=Object.assign({},r);delete o._edit;return o});patch({publicText:pt,requests:a}).then(function(){toast('Партнеры видят новую формулировку');renderTab(S.card,'profile')})},
  archive:function(){var c=S.card;sheet('<div class="kick">Карточка «'+E(c.alias)+'»</div><h2>Убрать в архив?</h2><p class="hint">Карточка исчезнет из вашего списка и из общей выдачи. Orbiq сохранит ее с историей. Имя останется занятым.</p><div class="row">'+btn('Убрать в архив','dark','data-a="archok"','archive')+'<button type="button" class="link mute" data-a="sclose">Отмена</button></div>')},
  archok:function(){api('client/archive',{id:S.card.id}).then(function(){closeSheet();toast('Карточка в архиве','archive');go('#/clients')}).catch(function(e){toast(e.message,'alert')})},
  dcheck:function(){var t=$('#dtx').value.trim();if(t.length<10){toast('Расскажите хотя бы пару фактов','alert');return}stopRec();scrubStage(S.card.id,t,'dict')},
  pkind:function(el){var P=S.pending[S.card.id];P.proposals[+el.getAttribute('data-k')].kind=el.getAttribute('data-v');S.reviewDraw()},
  pst:function(el){var P=S.pending[S.card.id];P.proposals[+el.getAttribute('data-k')].st=el.getAttribute('data-v')||null;S.reviewDraw()},
  pall:function(){var P=S.pending[S.card.id];P.proposals.forEach(function(p){if(p.st!=='del')p.st='ok'});S.reviewDraw()},
  papply:function(el){el.disabled=true;applyReview(S.card.id)},
  copytask:function(){copy(AI_TASK)},
  prmtog:function(el){var p=$('#prm');p.classList.toggle('open');el.textContent=p.classList.contains('open')?'Свернуть':'Показать полностью'},
  mdpaste:function(){var el=sheet('<div class="kick">Вместо файла</div><h2>Вставьте текст из нейросети</h2><textarea class="ta" id="mdt" style="min-height:260px" placeholder="Содержимое profile.md"></textarea><div class="row">'+btn('Проверить текст','pri','id="mdgo"','ar')+'</div>',true);$('#mdgo',el).addEventListener('click',function(){var t=$('#mdt',el).value.trim();if(!t){toast('Текст пустой','alert');return}scrubStage(S.card.id,t,'md')})},
  copytxt:function(el){copy(el.getAttribute('data-t'))},
  qcopy:function(el){var t=$('textarea[data-q="'+el.getAttribute('data-q')+'"]');copy(t?t.value:'')},
  qlater:function(el){api('question/mark',{cid:S.card.id,qid:el.getAttribute('data-q'),state:'later'}).then(function(){toast('Перенесено в «Позже»','clock');renderTab(S.card,'match')})},
  qnow:function(el){api('question/mark',{cid:S.card.id,qid:el.getAttribute('data-q'),state:'now'}).then(function(){renderTab(S.card,'match')})},
  qasked:function(el){var qid=el.getAttribute('data-q');var s=sheet('<div class="kick">После разговора</div><h2>Что ответил клиент?</h2><div class="pills" id="qa"><button type="button" class="on" data-v="да">Да, интересно</button><button type="button" data-v="нет">Не интересно</button><button type="button" data-v="подумает">Подумает</button></div><div class="fld"><label>Вернуться после, по желанию</label><input class="in" type="date" id="qr"></div><div class="row">'+btn('Сохранить','pri','id="qok"','check')+'</div>');
    var ans='да';$('#qa',s).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;ans=b.getAttribute('data-v');$$('#qa button',s).forEach(function(x){x.classList.toggle('on',x===b)})});
    $('#qok',s).addEventListener('click',function(){var r=$('#qr',s).value;api('question/mark',{cid:S.card.id,qid:qid,state:r?'later':'done',answer:ans,returnAfter:r||undefined}).then(function(x){closeSheet();toast(x&&x.research?'Появилась задача на поиск':'Очередь обновлена');renderTab(S.card,'match')}).catch(function(e){toast(e.message,'alert')})})},
  invite:function(el){var ch=$('#cch').value,dt=$('#cdate').value;el.disabled=true;api('invite/create',{cid:S.card.id,consentAt:new Date(dt).toISOString(),consentChannel:ch,confirm10m:true}).then(function(r){$('#invr').innerHTML='<div style="margin-top:14px">'+linkBox(r.link,'Отправьте ссылку клиенту сами. Ссылку можно отозвать, пока ее не активировали.')+'</div>';toast('Приглашение создано','gift')}).catch(function(e){el.disabled=false;toast(e.message,'alert')})},
  ndel:function(el){if(!confirm('Удалить заметку?'))return;api('note/del',{cid:S.card.id,id:el.getAttribute('data-n')}).then(function(){renderTab(S.card,'notes');if(!S.card.mine)vNetCard(S.card)})},
  nfwd:function(el){var n=(S.notes||[]).find(function(x){return x.id===el.getAttribute('data-n')});if(!n)return;var s=sheet('<div class="kick">Отдельная копия</div><h2>Передать через Orbiq</h2><p class="hint">Отправится этот текст. Правки заметки после отправки в Orbiq не попадут.</p><textarea class="ta" id="nft" style="min-height:140px">'+E(n.text)+'</textarea><p class="err" id="nfw" hidden></p><div class="row">'+btn('Отправить в Orbiq','pri','id="nfgo"','send')+'<button type="button" class="link mute" data-a="sclose">Отмена</button></div>');
    var ta=$('#nft',s),w=$('#nfw',s);var chk=function(){var f=findIds(ta.value).filter(function(x){return x.on&&x.t!=='name'});w.hidden=!f.length;if(f.length)w.innerHTML=ic('alert')+'В тексте есть контакт: '+E(f.map(function(x){return x.v}).join(', '))};ta.addEventListener('input',chk);chk();
    $('#nfgo',s).addEventListener('click',function(){var t=ta.value.trim();if(!t)return;api('note/forward',{cid:S.card.id,noteId:n.id,text:t}).then(function(){closeSheet();toast('Копия отправлена в Orbiq','send')}).catch(function(e){toast(e.message,'alert')})})},
  tdone:function(el){var id=el.getAttribute('data-t');el.classList.toggle('on');api('task/list').then(function(l){var t=l.find(function(x){return x.id===id});return api('task/upsert',Object.assign({},t,{id:id,done:!t.done}))}).then(function(){(S.tasksAfter||vPlans)()})},
  tmove:function(el){var id=el.getAttribute('data-t');api('task/list').then(function(l){var t=l.find(function(x){return x.id===id});var d=new Date(Math.max(Date.now(),parseDue(t.due).getTime()));d.setDate(d.getDate()+1);return api('task/upsert',Object.assign({},t,{id:id,due:localDue(d)}))}).then(function(){toast('Перенесено на завтра','clock');(S.tasksAfter||vPlans)()})},
  tdel:function(el){api('task/del',{id:el.getAttribute('data-t')}).then(function(){(S.tasksAfter||vPlans)()})},
  ical:function(el){el.disabled=true;api('ical/rotate',{}).then(function(r){$('#ical').innerHTML=linkBox(r.url,'Ссылка личная. Не пересылайте ее.')+'<button type="button" class="link mute" data-a="ical" style="margin-top:8px">Сменить ссылку</button>'}).catch(function(e){el.disabled=false;toast(e.message,'alert')})},
  pfsend:function(el){sheet('<div class="kick">Портфель</div><h2>Отправить на проверку?</h2><p class="hint">Состав зафиксируется. Сервер случайно выберет карточки для закрытой сверки, выбор не изменится при перезагрузке.</p><div class="row">'+btn('Отправить','pri','data-a="pfok"','send')+'<button type="button" class="link mute" data-a="sclose">Отмена</button></div>')},
  pfok:function(){api('pf/submit',{}).then(function(){closeSheet();toast('Портфель отправлен');vPortfolio()}).catch(function(e){toast(e.message,'alert')})},
  tglink:function(el){el.disabled=true;api('tg/link',{}).then(function(r){window.open(r.url,'_blank','noopener');$('#tgw').innerHTML='<span class="hint">Ждем нажатия Start в боте…</span> <button type="button" class="link" data-a="tgcheck">Проверить</button>';el.disabled=false}).catch(function(e){el.disabled=false;toast(e.status===404||e.status===403?'Бот Orbiq пока не подключен. События остаются в кабинете':e.message,'alert')})},
  tgcheck:function(){api('me').then(function(m){S.me=m;if(m.partner&&m.partner.tg&&m.partner.tg.connected){toast('Telegram подключен');vNotify()}else toast('Пока не подключено. Нажмите Start в боте','clock')})},
  tgoff:function(){api('tg/off',{}).then(function(){return api('me')}).then(function(m){S.me=m;toast('Telegram отключен');vNotify()})},
  pinv:inviteSheet,
  pmenu:function(el,e){e.stopPropagation();var open=el.parentNode.querySelector('.menu-p');$$('.menu-p').forEach(function(x){x.remove()});if(!open)partnerMenu(el)},
  preinv:function(el){api('partner/reinvite',{pid:el.getAttribute('data-p')}).then(function(r){sheet('<div class="kick">Новая ссылка</div><h2>Ссылка для партнера</h2>'+linkBox(r.link,'Прежняя ссылка больше не работает. Действует до '+fmtDate(r.expires)));vPartners()})},
  prevoke:function(el){api('partner/revoke',{pid:el.getAttribute('data-p')}).then(function(){toast('Приглашение отозвано');vPartners()})},
  psusp:function(el){var on=el.getAttribute('data-v')==='1';if(on&&!confirm('Приостановить доступ? Все сессии партнера завершатся'))return;api('partner/suspend',{pid:el.getAttribute('data-p'),on:on}).then(function(){toast(on?'Доступ приостановлен':'Доступ возвращен');vPartners()})},
  ppay:function(el){paySheet(el.getAttribute('data-p'),el.getAttribute('data-w'))},
  ifilt:function(el){S.inbox.f=el.getAttribute('data-v');vInbox([])},
  intro:function(el){sheet('<div class="kick">Пробная квота</div><h2>Засчитать знакомство?</h2><p class="hint">Только если клиент согласился обсудить предложение и Orbiq представил стороны. Отказ и молчание квоту не расходуют.</p><div class="row">'+btn('Засчитать','pri','data-a="introok" data-p="'+E(el.getAttribute('data-p'))+'" data-r="'+E(el.getAttribute('data-r'))+'"','check')+'<button type="button" class="link mute" data-a="sclose">Отмена</button></div>')},
  introok:function(el){api('intro/use',{pid:el.getAttribute('data-p'),rid:el.getAttribute('data-r')}).then(function(x){closeSheet();toast(x.paid?'Платный партнер: квота не нужна':x.already?'Уже засчитано':'Засчитано: '+x.used+' из '+x.quota)}).catch(function(e){closeSheet();toast(e.message,'alert')})},
  att:function(el){if(DEMO){toast('В демо файлы не скачиваются','info');return}api('rq/att',null,{rid:el.getAttribute('data-r'),id:el.getAttribute('data-id')}).then(function(a){var l=document.createElement('a');l.href=a.dataUrl;l.download=a.name||'file';document.body.appendChild(l);l.click();l.remove()}).catch(function(e){toast(e.message,'alert')})},
  owrite:function(){var c=S.card;var s2=sheet('<div class="kick">От имени Orbiq</div><h2>Написать партнеру</h2><p class="hint">Сообщение придет '+E(c.ownerName||'партнеру')+' в раздел «Обращения». Контакты из текста удаляются.</p><textarea class="ta" id="owt" style="min-height:140px" placeholder="Например: по клиенту «'+E(c.alias)+'» есть предложение"></textarea><div class="row">'+btn('Отправить','pri','id="owgo"','send')+'</div>');
    $('#owgo',s2).addEventListener('click',function(){var t=$('#owt',s2).value.trim();if(!t)return;api('owner/write',{pid:c.partner?c.partner.id:c.owner,cid:c.id,text:t}).then(function(){closeSheet();toast('Отправлено','send')}).catch(function(e){toast(e.message,'alert')})})},
  pfext:function(el){api('pf/extend',{pid:el.getAttribute('data-p')}).then(function(){toast('Выборка расширена');vReviews()}).catch(function(e){toast(e.message,'alert')})},
  pkfill:function(){var r=S.rq;var parts=[];if($('[data-pk="offer"]:checked'))parts.push('Для вашего клиента «'+r.alias+'» есть предложение: '+r.offer);if($('[data-pk="terms"]:checked'))parts.push('Условия: '+r.terms);if($('[data-pk="att"]:checked'))parts.push('Во вложении: '+r.attachment.name);parts.push('Обсудите с клиентом?');var ta=$('form.comp[data-to="cardOwner"] textarea');ta.value=parts.join('\n');ta.style.height='auto';ta.style.height=Math.min(220,ta.scrollHeight+4)+'px';ta.dispatchEvent(new Event('input'));ta.focus()},
  pffin:function(el){var pid=el.getAttribute('data-p'),v=el.getAttribute('data-v');var r=$('[data-fr="'+pid+'"]').value.trim();if(!r){toast('Впишите основание решения','alert');return}api('pf/final',{pid:pid,decision:v,reason:r}).then(function(){toast('Решение отправлено партнеру');vReviews()}).catch(function(e){toast(e.message,'alert')})}
};
document.addEventListener('click',function(e){
  if(!e.target.closest('.menu'))$$('.menu-p').forEach(function(x){x.remove()});
  var el=e.target.closest('[data-a]');if(!el)return;var f=A[el.getAttribute('data-a')];if(!f)return;
  if(el.tagName==='A'&&el.getAttribute('data-a')==='sclose'){closeSheet();return}
  if(el.tagName==='BUTTON'&&el.type==='submit'&&!f)return;
  f(el,e);
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet()});
/* Магнит и подсветка под курсором */
if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.addEventListener('pointermove',function(e){
    var b=e.target.closest&&e.target.closest('.mag');
    $$('.mag.act').forEach(function(x){if(x!==b){x.classList.remove('act');x.classList.add('back');x.style.transform=''}});
    if(b&&!b.disabled){var r=b.getBoundingClientRect();var dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);b.classList.add('act');b.classList.remove('back');b.style.transform='translate('+(dx*.22).toFixed(1)+'px,'+(dy*.32).toFixed(1)+'px)'}
    var s=e.target.closest&&e.target.closest('.spot');if(s){var q=s.getBoundingClientRect();s.style.setProperty('--x',(e.clientX-q.left)+'px');s.style.setProperty('--y',(e.clientY-q.top)+'px')}
  },{passive:true});
}
window.addEventListener('resize',function(){segs()});

/* ================= Маршруты и запуск ================= */
var ROUTES={clients:vClients,'new':vNew,c:vCard,plans:vPlans,requests:vRequests,portfolio:vPortfolio,tariff:vTariff,notify:vNotify,demand:vDemand,
  partners:vPartners,inbox:vInbox,reviews:vReviews,archive:vArchive,audit:vAudit};
var OWNER_ONLY={partners:1,inbox:1,reviews:1,archive:1,audit:1};
function render(){
  stopRec();closeSheet();
  if(S.me&&S.me.needKey)return vKey();if(!S.me||!S.me.role)return vLogin();
  var h=location.hash.replace(/^#\/?/,'').split('?')[0];var parts=h.split('/').filter(Boolean);
  var r=parts[0];if(!r||r==='login'){location.replace('#/'+(isOwner()?'inbox':'clients'));return}
  if(OWNER_ONLY[r]&&!isOwner())r='clients';if(r==='plans'&&isOwner())r='inbox';
  if(r==='demand'&&tier()!=='candidate')r='clients';
  if(r==='new'&&isOwner())r='clients';
  var fn=ROUTES[r]||vClients;
  try{var p=fn(parts.slice(1));if(p&&p.catch)p.catch(function(e){page(r,errBox(e))})}catch(e){console.error(e);page(r,errBox(e))}
}
function boot(to){
  return api('me').then(function(m){S.me=m;
    if(m&&m.role&&!m.needKey){if(!$('#root .app'))$('#root').innerHTML='';if(to)location.hash=to;else if(!location.hash||location.hash==='#/login')location.hash='#/'+(m.owner?'inbox':'clients')}
    render();
    if(Q.get('welcome')==='1'&&m.role)toast('Добро пожаловать в Orbiq');
  }).catch(function(){S.me={role:null};render()});
}
window.addEventListener('hashchange',function(){S.viewAs='own';render()});
if(DEMO){var dm=document.createElement('div');dm.className='demo';dm.innerHTML='Демо <select aria-label="Роль">'+[['paid','Платный партнер'],['trial','Пробный партнер'],['candidate','Кандидат'],['owner','Владелец'],['login','Вход'],['key','Ключ владельца']].map(function(o){return '<option value="'+o[0]+'"'+(Demo.as()===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>';document.body.appendChild(dm);dm.querySelector('select').addEventListener('change',function(){var u=new URL(location.href);u.searchParams.set('as',this.value);u.hash='';location.href=u.toString()})}
boot();
})();
