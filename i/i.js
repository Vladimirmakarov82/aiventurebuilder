/* Orbiq · приглашение семьи. Маршруты: /api/crm?r=invite/info|invite/start|invite/activate|invite/seat2|invite/seat2/revoke|client/feed */
(function(){
'use strict';
var API='/api/crm?r=';
var $=function(s,r){return (r||document).querySelector(s)};
var book=$('#book'),cover=$('#cover'),front=$('#front'),back=$('#back'),page=$('#page'),body=document.body;
var qs=new URLSearchParams(location.search),T=qs.get('t')||'',C=(qs.get('c')||'').replace(/\D/g,'').slice(0,6);
var MQ_SPLIT=matchMedia('(min-width:900px) and (min-aspect-ratio:3/2)'),MQ_RM=matchMedia('(prefers-reduced-motion:reduce)');
var S={mode:'invite',step:'form',info:null,sentTo:'',name:'',email:'',until:'',seat:1,rec:null,why:'',seat2:null};
var IDX=null;
var COVER_IMG='/img/journal/ninnaji-temple-night.webp',COVER_LINE='Ночь в императорском храме Киото';
var ARROW='<svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function split(){return MQ_SPLIT.matches&&!MQ_RM.matches}
function reduced(){return MQ_RM.matches}
function api(r,o){o=o||{};var init={method:o.body?'POST':'GET',credentials:'same-origin',headers:{}};
  if(o.body){init.headers['Content-Type']='application/json';init.body=JSON.stringify(o.body)}
  return fetch(API+r,init).then(function(res){return res.json().catch(function(){return{}}).then(function(j){j._s=res.status;return j})})
    .catch(function(){return{_s:0,error:'Нет соединения. Проверьте интернет и попробуйте еще раз'}})}
function ruDate(iso){if(!iso)return'';var d=new Date(iso);if(isNaN(d))return'';return d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}).replace(/\s*г\.?$/,'').replace(/ /g,'\u00a0')}
function monthYear(d){return d.toLocaleDateString('ru-RU',{month:'long',year:'numeric'}).replace(/\s*г\.?$/,'')}
function nb(s){return String(s).replace(/ (в|и|к|с|у|о|а|на|по|до|за|от|не|из|для|что|это) /gi,' $1 ')}
function btn(label,attrs,cls){return '<button type="button" class="btn '+(cls||'')+'" '+(attrs||'')+'><span class="r"><i>'+label+'</i><i aria-hidden="true">'+label+'</i></span>'+ARROW+'</button>'}
function letters(s,cls){return '<span class="'+cls+'" aria-label="'+esc(s)+'">'+Array.from(s).map(function(ch,i){return '<span aria-hidden="true" style="--i:'+i+'">'+(ch===' '?'&nbsp;':esc(ch))+'</span>'}).join('')+'</span>'}
function items(){if(IDX)return Promise.resolve(IDX);return fetch('/i/items.json').then(function(r){return r.json()}).then(function(j){IDX=j||{};return IDX}).catch(function(){IDX={};return IDX})}

/* ---------- обложка ---------- */
function renderFront(kind){
  var img=COVER_IMG,line=COVER_LINE,top='<span class="kick">Персональный выпуск</span><span class="kick">Для двоих</span>',bot='';
  if(kind==='invite'){
    bot='<p class="kick cv-k">Приглашение</p>'+
      '<h1 class="cv-h">'+nb('Для вас и того, кого вы захотите пригласить')+'</h1>'+
      '<p class="cv-sub">'+nb('Три месяца персонального доступа в Orbiq')+'</p>'+
      '<div class="cv-row">'+btn('Открыть приглашение','data-open id="openBtn"','mag')+(S.info&&S.info.expires?'<span class="cv-note">До '+esc(ruDate(S.info.expires))+'</span>':'')+'</div>';
  }else if(kind==='personal'){
    if(S.rec){img=S.rec.img||img;line=S.rec.title}
    top='<span class="kick">Персональный выпуск</span><span class="kick">'+esc(monthYear(new Date()))+'</span>';
    bot='<p class="kick cv-k">Только для вас</p>'+
      '<h1 class="cv-h">'+(S.name?letters(S.name+',','nm'):'')+'ваш выпуск готов</h1>'+
      '<p class="cv-sub">'+(S.rec?'Первая рекомендация: '+esc(S.rec.title):'Подборка собрана по вашим интересам')+'</p>'+
      '<div class="cv-row">'+btn('Открыть выпуск','data-open id="openBtn"','mag')+(S.until?'<span class="cv-note">Доступ до '+esc(ruDate(S.until))+'</span>':'')+'</div>';
  }else{
    bot='<p class="kick cv-k">Приглашение</p><h1 class="cv-h">'+nb(S.err||'Это приглашение больше не действует')+'</h1>'+
      '<p class="cv-sub">'+nb('Попросите отправителя прислать новую ссылку. Журнал Orbiq можно читать и без приглашения')+'</p>'+
      '<div class="cv-row"><a class="btn mag" href="/journal/"><span class="r"><i>Открыть журнал</i><i aria-hidden="true">Открыть журнал</i></span>'+ARROW+'</a></div>';
  }
  front.className='face front'+(kind==='invalid'?' cv-x':'');
  front.innerHTML='<img class="cv-img" src="'+esc(img)+'" alt="" fetchpriority="high"><div class="cv-shade"></div>'+
    '<div class="cv-top">'+top+'</div>'+
    '<p class="mast" aria-label="Orbiq">'+'ORBIQ'.split('').map(function(c,i){return '<span aria-hidden="true" style="--i:'+i+'">'+c+'</span>'}).join('')+'</p>'+
    '<p class="cv-line" aria-hidden="true">'+esc(line)+'</p>'+
    '<div class="cv-bot">'+bot+'</div>';
  var ob=$('[data-open]',front);if(ob)ob.onclick=function(e){e.stopPropagation();openBook()};
  front.onclick=(kind==='invalid')?null:function(e){if(!e.target.closest('a,button'))openBook()};front.style.cursor=kind==='invalid'?'':'pointer';
}

/* ---------- страницы ---------- */
function pgTop(n,label){if(!split())n=0;return '<div class="pg-top" data-rv><b>ORBIQ</b><span class="kick">'+esc(label||'')+(n?' · стр. '+n:'')+'</span></div>'}
function termsHtml(){
  return '<dl class="terms">'+
    '<div data-rv><dt><span data-count="3">3</span><small>месяца</small></dt><dd><b>Персональный доступ.</b> '+nb('Журнал, личная подборка по вашим интересам и помощь команды Orbiq')+'</dd></div>'+
    '<div data-rv><dt><span data-count="2">2</span><small>места</small></dt><dd><b>Для вас и близкого человека.</b> '+nb('Второго участника можно выбрать сразу или позже')+'</dd></div>'+
    '<div data-rv class="hot"><dt>$<span data-count="10000">10 000</span><small>в год</small></dt><dd><b>Годовой доступ после трех месяцев,</b> '+nb('если решите продолжить. Автосписания нет: продление только по вашему решению')+'</dd></div>'+
  '</dl>'}
function leftInvite(){
  return pgTop(1,'От редакции')+
    '<h2 data-rv>'+nb('Журнал открытий, которые можно пережить самому')+'</h2>'+
    '<p class="lead" data-rv>'+nb('Редакция находит редкие возможности: ночь в закрытом храме, место в мастерской, приглашение, которого нет в продаже. Команда Orbiq помогает ими воспользоваться.')+'</p>'+
    termsHtml()+
    (S.info&&S.info.expires?'<p class="note" data-rv>Приглашение действует до '+esc(ruDate(S.info.expires))+'</p>':'');
}
function rightForm(){
  return pgTop(2,'Шаг 1 из 2')+
    '<h2 data-rv>Откройте приглашение</h2>'+
    '<p data-rv>'+nb('Пришлем код на почту. Почта нужна только для входа в журнал.')+'</p>'+
    '<form class="form" id="fStart" novalidate>'+
      '<label class="fld" data-rv><span>Как к вам обращаться</span><input name="name" autocomplete="given-name" maxlength="60" required placeholder="Имя" value="'+esc(S.name)+'"></label>'+
      '<label class="fld" data-rv><span>Почта</span><input name="email" type="email" inputmode="email" autocomplete="email" required placeholder="name@mail.com" value="'+esc(S.email)+'"></label>'+
      '<div data-rv>'+btn('Получить код','type="submit" data-sub','wide mag').replace('type="button" ','')+'</div>'+
      '<p class="note" id="nStart" role="status"></p>'+
    '</form>';
}
function rightCode(){
  return pgTop(2,'Шаг 2 из 2')+
    '<h2 data-rv>Введите код из письма</h2>'+
    '<p data-rv>'+(S.sentTo?nb('Код отправлен на '+esc(S.sentTo)+'. Он действует 30 минут.'):nb('Код из письма действует 30 минут.'))+'</p>'+
    '<form class="form" id="fCode" novalidate>'+
      '<div class="code" id="code" data-rv><input class="cell-in" id="codeIn" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" aria-label="Код из письма, 6 цифр" value="'+esc(C)+'"><div class="cells" aria-hidden="true">'+'<i></i><i></i><i></i><i></i><i></i><i></i>'+'</div></div>'+
      '<div data-rv>'+btn('Подтвердить','type="submit" data-sub','wide mag').replace('type="button" ','')+'</div>'+
      '<p class="note" id="nCode" role="status"></p>'+
      '<div class="row" data-rv style="display:flex;gap:20px;flex-wrap:wrap">'+(S.email?'<button type="button" class="lnk" id="resend">Отправить код еще раз</button>':'')+'<button type="button" class="lnk" id="chg">Изменить почту</button></div>'+
    '</form>';
}
function leftIssue(){
  var r=S.rec;
  if(!r)return pgTop(1,'Ваш выпуск')+'<h2 data-rv>'+nb('Подборка собирается по вашим интересам')+'</h2><p data-rv>'+nb('Откройте журнал: первыми в нем стоят материалы, которые подходят вам больше всего.')+'</p><div data-rv>'+linkBtn('Открыть журнал','/journal/')+'</div>';
  return pgTop(1,'Первая рекомендация')+
    '<div class="rec">'+
      '<div class="rec-img" data-rv><img src="'+esc(r.img||r.th||'')+'" alt=""><span class="kick">'+esc([r.dn,r.geo].filter(Boolean).join(' · '))+'</span></div>'+
      '<h2 class="rec-t" data-rv>'+nb(esc(r.title))+'</h2>'+
      (r.hook?'<p data-rv>'+nb(esc(r.hook))+'</p>':'')+
      '<div class="why" data-rv><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3l2.6 5.6L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.4-.7z"/></svg><p><b>Почему первой</b>'+nb(esc(S.why))+'</p></div>'+
      '<div data-rv>'+linkBtn('Читать в журнале',r.href||'/journal/')+'</div>'+
    '</div>';
}
function linkBtn(label,href,cls){return '<a class="btn '+(cls||'mag')+'" href="'+esc(href)+'"><span class="r"><i>'+label+'</i><i aria-hidden="true">'+label+'</i></span>'+ARROW+'</a>'}
function accessHtml(){
  return '<div class="acc">'+
    '<div class="big" data-rv><div><span class="v">'+(S.until?esc(ruDate(S.until)):'Три месяца')+'</span><span class="l">Персональный доступ до</span></div></div>'+
    '<div data-rv><span class="v">$<span data-count="10000">10 000</span></span><span class="l">Год доступа</span><p class="t">'+nb('Если решите продолжить после трех месяцев')+'</p></div>'+
    '<div data-rv><span class="v" data-count="0">0</span><span class="l">Автосписаний</span><p class="t">'+nb('Продление только по вашему решению')+'</p></div>'+
  '</div>'}
var REL=[['wife','Супруга'],['husband','Супруг'],['daughter','Дочь'],['son','Сын']];
var REL_TO={'Супруга':'для супруги','Супруг':'для супруга','Дочь':'для дочери','Сын':'для сына'};
function seatHtml(){
  if(S.seat===2)return '<div class="seat" data-rv><h3>'+nb('Вас пригласили вместе с близким человеком')+'</h3><p>'+nb('Доступ общий на двоих, подборка у каждого своя.')+'</p></div>';
  var s=S.seat2;
  if(s&&s.link){var who=REL_TO[s.label]||'';
    return '<div class="seat" id="seat"><p class="kick" data-rv>Второе место</p><h3 data-rv>Ссылка '+esc(who)+' готова</h3>'+
      '<p data-rv>'+nb('Отправьте ее удобным способом. Ссылка открывает такую же обложку и действует, пока место свободно.')+'</p>'+
      '<div class="share" data-rv>'+btn('Telegram','data-sh="tg"','ink')+btn('WhatsApp','data-sh="wa"','ink')+btn('Скопировать','data-sh="copy"','soft')+(navigator.share?btn('Другое','data-sh="native"','soft'):btn('Почта','data-sh="mail"','soft'))+'</div>'+
      '<p class="linkbox" data-rv>'+esc(s.link)+'</p><p class="note" id="nSeat" role="status"></p>'+
      '<div data-rv style="display:flex;gap:20px;flex-wrap:wrap"><button type="button" class="lnk" id="seatChange">Выбрать другого участника</button><button type="button" class="lnk" id="seatRevoke">Отозвать ссылку</button></div></div>';
  }
  if(s&&s.later)return '<div class="seat" id="seat"><p class="kick" data-rv>Второе место</p><h3 data-rv>Место сохранено за вами</h3><p data-rv>'+nb('Вернуться к выбору можно в любой момент: откройте эту страницу снова.')+'</p><div data-rv><button type="button" class="lnk" id="seatChange">Выбрать сейчас</button></div></div>';
  return '<div class="seat" id="seat"><p class="kick" data-rv>Второе место</p><h3 data-rv>Кого хотите пригласить вместе с собой?</h3>'+
    '<div class="chips" data-rv role="group" aria-label="Второй участник">'+REL.map(function(r){return '<button type="button" class="chip" data-rel="'+r[0]+'" data-label="'+r[1]+'" aria-pressed="false">'+r[1]+'</button>'}).join('')+'</div>'+
    '<div data-rv><button type="button" class="lnk" data-later>Выберу позже</button></div><p class="note" id="nSeat" role="status"></p></div>';
}
function rightIssue(){
  return pgTop(2,(S.name?S.name+', ваш доступ':'Ваш доступ'))+
    accessHtml()+'<hr class="rule" data-rv>'+seatHtml()+
    '<div data-rv>'+linkBtn('Открыть журнал','/journal/','ink wide')+'</div>';
}

function compose(){
  var strip=function(h){return h.replace(/<div class="pg-top"[\s\S]*?<\/div>/,'')};
  var L='',R='',one='';
  if(S.mode==='invite'){L=leftInvite();R=S.step==='code'?rightCode():rightForm();
    one=S.step==='code'?R:pgTop(0,'Приглашение')+strip(R)+'<hr class="rule" data-rv><p class="kick" data-rv style="color:var(--mute)">Условия</p>'+termsHtml()+(S.info&&S.info.expires?'<p class="note" data-rv>Приглашение действует до '+esc(ruDate(S.info.expires))+'</p>':'')}
  else if(S.mode==='personal'){L=leftIssue();R=rightIssue();one=pgTop(0,'Персональный выпуск')+strip(L)+'<hr class="rule" data-rv>'+strip(R)}
  if(split()){back.innerHTML='<div class="pg">'+L+'</div>';page.innerHTML='<div class="pg">'+R+'</div>'}
  else{back.innerHTML='';page.innerHTML='<div class="pg">'+one+'</div>'}
  stagger(back);stagger(page);bind();counters(page);counters(back);
}
function stagger(root,base){var n=0;root.querySelectorAll('[data-rv]').forEach(function(el){el.style.setProperty('--d',n++);if(base!=null)el.style.setProperty('--d0',base+'ms')})}
function counters(root){root.querySelectorAll('[data-count]').forEach(function(el){var to=+el.getAttribute('data-count');if(reduced()||!to){el.textContent=to.toLocaleString('ru-RU');return}
  var t0=null,dur=1400,delay=book.classList.contains('open')?300:900;setTimeout(function(){requestAnimationFrame(function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(2,-10*k);el.textContent=Math.round(to*(k>=1?1:e)).toLocaleString('ru-RU').replace(/ | /g,' ');if(k<1)requestAnimationFrame(step)})},delay)})}

function swap(fn){ // переход состояния внутри страницы
  if(document.startViewTransition&&!reduced())document.startViewTransition(fn);else fn()}

/* ---------- раскрытие ---------- */
function openBook(){
  compose();
  var base=reduced()?0:(split()?650:420);stagger(back,base);stagger(page,base);
  book.classList.add('opening');
  requestAnimationFrame(function(){requestAnimationFrame(function(){book.classList.add('open');body.classList.add('is-open');body.classList.remove('is-cover')})});
  setTimeout(function(){book.classList.remove('opening');page.scrollTop=0;var f=$('input',page);if(f&&split()&&!f.value)f.focus({preventScroll:true})},reduced()?50:1300);
}
function closeBook(){if(book.classList.contains('open')){book.classList.add('closing');setTimeout(function(){book.classList.remove('closing')},reduced()?50:1350)}book.classList.remove('open');body.classList.remove('is-open');body.classList.add('is-cover')}

/* ---------- формы ---------- */
function setBusy(form,on){var b=form&&form.querySelector('[data-sub]');if(b)b.disabled=!!on}
function bind(){
  var fs=$('#fStart',page);
  if(fs)fs.onsubmit=function(e){e.preventDefault();var n=$('#nStart',page),name=fs.name.value.trim(),email=fs.email.value.trim();
    if(!name){n.className='note err';n.textContent='Как к вам обращаться?';fs.name.focus();return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){n.className='note err';n.textContent='Проверьте адрес почты';fs.email.focus();return}
    setBusy(fs,1);n.className='note';n.textContent='Отправляем код…';
    api('invite/start',{body:{t:T,name:name,email:email}}).then(function(r){setBusy(fs,0);
      if(!r.ok){n.className='note err';n.textContent=r.error||'Не получилось, попробуйте еще раз';if(r._s===410||r._s===404)invalid(r.error);return}
      S.name=name;S.email=email;S.sentTo=r.sentTo||email;if(r.test_code)C=r.test_code;
      swap(function(){S.step='code';composeRight()})})};
  var fc=$('#fCode',page);
  if(fc){var inp=$('#codeIn',page),cells=[].slice.call(page.querySelectorAll('.cells i'));
    var paint=function(){var v=inp.value.replace(/\D/g,'').slice(0,6);if(v!==inp.value)inp.value=v;cells.forEach(function(c,i){c.textContent=v[i]||'';c.classList.toggle('f',!!v[i]);c.classList.toggle('c',document.activeElement===inp&&i===Math.min(v.length,5))})};
    inp.addEventListener('input',function(){paint();if(inp.value.length===6)fc.requestSubmit?fc.requestSubmit():fc.onsubmit(new Event('submit'))});
    inp.addEventListener('focus',paint);inp.addEventListener('blur',paint);paint();
    fc.onsubmit=function(e){e&&e.preventDefault&&e.preventDefault();var n=$('#nCode',page),code=inp.value;
      if(code.length!==6){n.className='note err';n.textContent='Введите 6 цифр из письма';inp.focus();return}
      if(fc._busy)return;fc._busy=1;setBusy(fc,1);n.className='note';n.textContent='Проверяем…';
      api('invite/activate',{body:{t:T,code:code}}).then(function(r){fc._busy=0;setBusy(fc,0);
        if(!r.ok){n.className='note err';n.textContent=r.error||'Не получилось';var cd=$('#code',page);cd.classList.remove('bad');void cd.offsetWidth;cd.classList.add('bad');inp.value='';paint();if(r._s===409&&/активир/.test(r.error||''))loadPersonal(true);return}
        n.className='note ok';n.textContent='Готово';
        if(r.name)S.name=r.name;if(r.until)S.until=r.until;S.seat=r.seat||1;
        try{history.replaceState({},'',location.pathname+'?t='+encodeURIComponent(T))}catch(_){}
        loadPersonal(true)})};
    var rs=$('#resend',page);if(rs)rs.onclick=function(){var n=$('#nCode',page);n.className='note';n.textContent='Отправляем…';api('invite/start',{body:{t:T,name:S.name,email:S.email}}).then(function(r){n.className=r.ok?'note ok':'note err';n.textContent=r.ok?'Новый код отправлен':(r.error||'Не получилось')})};
    var ch=$('#chg',page);if(ch)ch.onclick=function(){swap(function(){S.step='form';composeRight()})};
    if(C&&C.length===6&&!fc._auto){fc._auto=1;setTimeout(function(){fc.onsubmit()},reduced()?100:1500)}
  }
  var seat=$('#seat',page);
  if(seat)seat.onclick=function(e){var n=$('#nSeat',page),c=e.target.closest('[data-rel]');
    if(c){if(seat._busy)return;seat._busy=1;seat.querySelectorAll('.chip').forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});if(n){n.className='note';n.textContent='Готовим ссылку…'}
      api('invite/seat2',{body:{relation:c.getAttribute('data-rel')}}).then(function(r){seat._busy=0;
        if(!r.ok){if(n){n.className='note err';n.textContent=r.error||'Не получилось'}return}
        S.seat2={link:r.link,label:c.getAttribute('data-label')};swap(composeRight)});return}
    if(e.target.closest('[data-later]')){api('invite/seat2',{body:{later:true}}).then(function(r){if(!r.ok){if(n){n.className='note err';n.textContent=r.error||'Не получилось'}return}S.seat2={later:true};swap(composeRight)});return}
    if(e.target.closest('#seatChange')){S.seat2=null;swap(composeRight);return}
    if(e.target.closest('#seatRevoke')){api('invite/seat2/revoke',{body:{}}).then(function(r){if(!r.ok){n.className='note err';n.textContent=r.error||'Не получилось';return}S.seat2=null;swap(composeRight)});return}
    var sh=e.target.closest('[data-sh]');if(!sh||!S.seat2||!S.seat2.link)return;var ch=sh.getAttribute('data-sh'),link=S.seat2.link,txt='Приглашаю тебя в Orbiq. Это журнал открытий и три месяца персонального доступа для нас двоих.';
    if(ch==='tg')window.open('https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent(txt),'_blank','noopener');
    if(ch==='wa')window.open('https://wa.me/?text='+encodeURIComponent(txt+'\n'+link),'_blank','noopener');
    if(ch==='mail')location.href='mailto:?subject='+encodeURIComponent('Приглашение в Orbiq')+'&body='+encodeURIComponent(txt+'\n\n'+link);
    if(ch==='native'&&navigator.share)navigator.share({title:'Orbiq',text:txt,url:link}).catch(function(){});
    if(ch==='copy')(navigator.clipboard?navigator.clipboard.writeText(link):Promise.reject()).then(function(){n.className='note ok';n.textContent='Ссылка скопирована'}).catch(function(){window.prompt('Ссылка',link)})};
}
function composeRight(){ // перерисовать без повторной анимации левой страницы
  var keep=split()?back.innerHTML:null;compose();if(keep!=null){back.innerHTML=keep;back.querySelectorAll('[data-rv]').forEach(function(x){x.style.animation='none'})}
  stagger(page,0);var f=$('input:not([type=hidden])',page);if(f&&!('ontouchstart'in window))f.focus({preventScroll:true});page.scrollTop=0}

/* ---------- персональный выпуск ---------- */
function loadPersonal(afterActivate){
  return Promise.all([api('client/feed'),items()]).then(function(a){var f=a[0],idx=a[1];
    if(f._s!==200||!f.personal){if(afterActivate){S.mode='personal';S.rec=null;S.why='';return show()}return false}
    S.name=S.name||f.name||'';S.until=S.until||f.until||'';
    var id=(f.items||[]).filter(function(x){return idx[x]})[0];S.rec=id?Object.assign({id:id},idx[id]):null;
    S.why=(f.why&&id&&f.why[id])||(S.rec&&S.rec.dn?'Ближе всего к вашим интересам в разделе «'+S.rec.dn+'». Подборка обновляется, когда вы отмечаете, что интересно':'Подобрано по вашим интересам. Подборка обновляется, когда вы отмечаете, что интересно');
    S.mode='personal';return show();
    function show(){
      if(afterActivate&&book.classList.contains('open')){
        compose();renderFront('personal');front.style.setProperty('--nd','1100ms');
        setTimeout(closeBook,reduced()?0:450);
      }else{renderFront('personal');compose()}
      return true}
  })}
function invalid(msg){S.mode='invalid';S.err=msg&&/недейств|не найден/i.test(msg)?null:msg;closeBook();renderFront('invalid')}

/* ---------- магнит и наклон ---------- */
var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
if(fine){
  document.addEventListener('pointermove',function(e){var b=e.target.closest&&e.target.closest('.mag');
    document.querySelectorAll('.mag.mg').forEach(function(x){if(x!==b){x.classList.remove('mg');x.style.transition='transform 1s cubic-bezier(.34,1.56,.64,1)';x.style.transform=''}});
    if(!b||reduced())return;var r=b.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    b.classList.add('mg');b.style.transition='transform 1.2s cubic-bezier(.22,1,.36,1)';b.style.transform='translate('+(dx*.22)+'px,'+(dy*.32)+'px)'});
  var tx=0,ty=0,cx=0,cy=0,raf=0,stk=document.querySelector('.stack');
  window.addEventListener('pointermove',function(e){if(!split()||book.classList.contains('open')){tx=ty=0}else{tx=(e.clientX/innerWidth-.5);ty=(e.clientY/innerHeight-.5)}if(!raf)raf=requestAnimationFrame(loop)});
  var loop=function(){raf=0;cx+=(tx-cx)*.07;cy+=(ty-cy)*.07;var on=!reduced();
    book.style.transform=on?'translate3d('+(cx*14).toFixed(2)+'px,'+(cy*10).toFixed(2)+'px,0)':'';
    if(stk)stk.style.marginLeft=on?(cx*-26).toFixed(2)+'px':'';
    if(Math.abs(tx-cx)>.001||Math.abs(ty-cy)>.001)raf=requestAnimationFrame(loop)};
}
function relayout(){if(S.mode!=='invalid')compose()}
MQ_SPLIT.addEventListener&&MQ_SPLIT.addEventListener('change',relayout);
MQ_RM.addEventListener&&MQ_RM.addEventListener('change',relayout);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&book.classList.contains('open')&&S.mode!=='personal'&&S.step==='form')closeBook()});

/* ---------- старт ---------- */
var cd=$('#capDate');if(cd)cd.textContent=monthYear(new Date());
renderFront('invite');
if(!T){loadPersonal(false).then(function(ok){if(!ok){S.err='Ссылка приглашения неполная';invalid(S.err)}})}
else api('invite/info?t='+encodeURIComponent(T)).then(function(r){
  if(r._s===200){S.info=r;S.seat=r.seat||1;var cr=$('#capR');if(cr&&r.expires)cr.innerHTML='<span>Приглашение</span><span>до '+esc(ruDate(r.expires))+'</span>';
    var nt=$('.cv-row',front);if(nt&&r.expires&&!$('.cv-note',nt))nt.insertAdjacentHTML('beforeend','<span class="cv-note">До '+esc(ruDate(r.expires))+'</span>');
    if(C.length===6){S.step='code'}
    return}
  if(r._s===410||r._s===404){return loadPersonal(false).then(function(ok){if(!ok)invalid(r._s===404?'Приглашение не найдено':null)})}
  if(r._s===429){S.err='Слишком много попыток. Откройте ссылку через минуту';invalid(S.err);return}
  if(r._s===0){S.err='Нет соединения. Проверьте интернет и обновите страницу';invalid(S.err)}
});
items();
})();
