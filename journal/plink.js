/* Журнал Orbiq с контактом партнера.
   Режимы: user — клиент вошел по личному приглашению; p — сайт партнера /journal/?p=…; k — старая личная ссылка.
   Кнопки «Хочу такую историю» становятся кнопкой партнера, заявка уходит в его кабинет и в Orbiq.
   Без режима журнал работает как раньше. */
;(function(){
  if(!window.fetch)return;
  var q=new URLSearchParams(location.search),LS={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
  var RK=/^[A-Za-z0-9_-]{12}$/,RP=/^[a-z0-9]{8}$/;
  var k=q.get('k'),p=q.get('p');
  if(k==='off'||p==='off'){LS.s('oj_k',null);LS.s('oj_p',null);return}
  if(k&&RK.test(k))LS.s('oj_k',k);else k=LS.g('oj_k');
  if(p&&RP.test(p=String(p).toLowerCase()))LS.s('oj_p',p);else p=LS.g('oj_p');
  if(q.get('k')||q.get('p')){q.delete('k');q.delete('p');var qs=q.toString();try{history.replaceState(history.state,'',location.pathname+(qs?'?'+qs:'')+location.hash)}catch(e){}}
  var once=false;try{once=!sessionStorage.getItem('oj_ko');sessionStorage.setItem('oj_ko','1')}catch(e){}
  var MODE='',INFO=null;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function api(r,b,qx){var o={method:b?'POST':'GET',credentials:'same-origin',headers:{}};if(b){o.headers['Content-Type']='application/json';o.body=JSON.stringify(b)}
    return fetch('/api/crm/?r='+r+(qx||''),o).then(function(x){return x.json().catch(function(){return{}}).then(function(j){j._s=x.status;return j})}).catch(function(){return{_s:0}})}
  var css='.plk-cta{cursor:pointer}'+
    '.plk-rib{position:fixed;left:16px;bottom:16px;z-index:60;display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:#0B0B0D;color:#F3F4F2;font-size:13px;line-height:1.2;box-shadow:0 12px 30px -12px rgba(0,0,0,.5);max-width:calc(100vw - 32px);border:0;font-family:inherit;cursor:pointer}'+
    '.plk-rib i{width:7px;height:7px;border-radius:50%;background:#FF4D00;flex:none}'+
    '.plk-m{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:20px;background:rgba(11,11,13,.55);opacity:0;transition:opacity .3s}'+
    '.plk-m.on{opacity:1}.plk-m>div{background:#F3F4F2;color:#0B0B0D;border-radius:24px;padding:26px 24px 22px;max-width:440px;width:100%;box-sizing:border-box;display:grid;gap:10px;transform:translateY(14px);transition:transform .5s cubic-bezier(.16,1,.3,1);max-height:calc(100vh - 40px);overflow:auto}'+
    '.plk-m.on>div{transform:none}.plk-m small{font-family:"Geist Mono",ui-monospace,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#FF4D00}'+
    '.plk-m h3{margin:0;font-size:22px;line-height:1.2;letter-spacing:-.02em}.plk-m p{margin:0;font-size:15px;line-height:1.5;color:#55565A}'+
    '.plk-m input,.plk-m textarea{width:100%;box-sizing:border-box;border-radius:14px;border:1px solid rgba(11,11,13,.14);padding:12px 14px;font:inherit;font-size:16px;background:#fff;color:#0B0B0D}'+
    '.plk-m textarea{min-height:70px;resize:vertical}.plk-m .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}'+
    '.plk-m .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}.plk-m button,.plk-m a.b{border:0;border-radius:999px;padding:13px 20px;font:inherit;font-weight:600;font-size:15px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px}'+
    '.plk-m .go{background:#FF4D00;color:#fff}.plk-m .no{background:rgba(11,11,13,.07);color:#0B0B0D}.plk-m a.tg{background:#229ED9;color:#fff}.plk-m a.wa{background:#25D366;color:#fff}.plk-m .err{color:#C62828;font-size:14px}';
  function label(a){return a.hasAttribute('data-arch')?'Уведомлять о подобных предложениях':INFO.label}
  function fix(a){if(a.getAttribute('data-plk'))return;a.setAttribute('data-plk','1');a.classList.add('plk-cta');a.innerHTML=esc(label(a))+' <span aria-hidden="true">→</span>';a.setAttribute('href','#');a.removeAttribute('target');a.removeAttribute('rel')}
  function fixAll(){var t=document.querySelectorAll('template');for(var i=0;i<t.length;i++){var L=t[i].content.querySelectorAll('a.cta');for(var j=0;j<L.length;j++)fix(L[j])}
    var D=document.querySelectorAll('a.cta');for(var n=0;n<D.length;n++)fix(D[n])}
  function modal(html,onGo){var m=document.createElement('div');m.className='plk-m';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.innerHTML='<div>'+html+'</div>';document.body.appendChild(m);
    requestAnimationFrame(function(){m.classList.add('on')});var kill=function(){m.classList.remove('on');setTimeout(function(){m.remove()},300)};
    m.addEventListener('click',function(e){if(e.target===m||e.target.closest('.no')){kill();return}var g=e.target.closest('.go');if(g&&onGo)onGo(m,g,kill)});
    var f=m.querySelector('input:not(.hp),textarea,.go');if(f&&matchMedia('(hover:hover)').matches)setTimeout(function(){f.focus()},60);return m}
  function titleOf(a){if(a.getAttribute('data-gen'))return 'Общий вопрос';var box=a.closest('.ov,.ov-in,.ov-body,.dl-b,article,section')||document;var h=box.querySelector('h2,h1')||document.querySelector('h1');return h?h.textContent.trim():document.title}
  function msgr(){var ph=String(INFO.phone||'').replace(/\D/g,'');var h='';
    if(INFO.tg)h+='<a class="b tg" target="_blank" rel="noopener" href="https://t.me/'+esc(INFO.tg)+'">Telegram</a>';else if(ph)h+='<a class="b tg" target="_blank" rel="noopener" href="https://t.me/+'+ph+'">Telegram</a>';
    if(ph)h+='<a class="b wa" target="_blank" rel="noopener" href="https://wa.me/'+ph+'">WhatsApp</a>';return h}
  function ask(a){var notify=a.hasAttribute('data-arch');var title=titleOf(a);var item=a.getAttribute('data-gen')?'general':((location.hash||'').slice(1)||'general');var nm=esc(INFO.name);var site=MODE==='p';
    var form=site?'<input name="name" autocomplete="given-name" placeholder="Как к вам обращаться" maxlength="60"><input name="email" type="email" autocomplete="email" inputmode="email" placeholder="Почта"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">':'';
    modal('<small>'+(notify?'Уведомления':'Запрос')+'</small><h3>'+esc(title)+'</h3><p>'+(notify?nm+' сообщит, когда появится похожее предложение.':site?nm+', партнер Orbiq, уточнит детали сам или познакомит вас с партнером сети, который это организует.':'Запрос получит ваш партнер '+nm+' лично и свяжется с вами.')+'</p>'+form+'<textarea placeholder="Комментарий, если нужно: сроки, для кого, пожелания"></textarea><p class="err" hidden></p><div class="row"><button type="button" class="go">'+(notify?'Уведомлять':'Отправить запрос')+'</button><button type="button" class="no">Отмена</button></div>',
      function(m,g){if(g.disabled)return;var er=m.querySelector('.err');var v=function(n){var x=m.querySelector('[name='+n+']');return x?x.value.trim():''};var nt=(m.querySelector('textarea')||{}).value||'';
        if(site){if(!v('name')){er.hidden=false;er.textContent='Как к вам обращаться?';return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))){er.hidden=false;er.textContent='Проверьте адрес почты';return}}
        er.hidden=true;g.disabled=true;g.textContent='Отправляем…';
        var call=MODE==='user'?api('client/interest',{action:'want',itemId:item,title:title,note:(notify?'Уведомлять о подобных предложениях. ':'')+nt})
          :site?api('site/lead',{p:p,name:v('name'),email:v('email'),website:v('website'),item:item,title:title,note:nt,kind:notify?'notify':'want'})
          :api('plink/ask',{k:k,kind:notify?'notify':'want',item:item,title:title,note:nt,page:location.pathname});
        call.then(function(r){
          if(r._s===200){var mm=site?msgr():'';m.firstChild.innerHTML='<small>Готово</small><h3>'+(notify?'Уведомления включены':'Запрос отправлен')+'</h3><p>'+(notify?nm+' напишет, когда появится похожее предложение.':nm+' свяжется с вами лично.'+(mm?' Написать сразу:':''))+'</p><div class="row">'+mm+'<button type="button" class="no">Хорошо</button></div>'}
          else{g.disabled=false;g.textContent='Повторить';er.hidden=false;er.textContent=r._s===429?'Слишком много запросов. Можно повторить завтра.':(r.error||'Запрос не отправился. Можно повторить.')}})})}
  function start(d){
    INFO=d;var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var go=function(){fixAll();var r=document.createElement('button');r.type='button';r.className='plk-rib';r.innerHTML='<i></i><span>'+(MODE==='user'?'Ваш партнер в Orbiq: ':MODE==='p'?'Ваш эксперт Orbiq: ':'Личная подборка · ваш партнер ')+esc(d.name)+'</span>';document.body.appendChild(r);
      r.addEventListener('click',function(){var x=document.createElement('a');x.setAttribute('data-gen','1');ask(x)});
      var prev=window.OJ_after;window.OJ_after=function(id,el){if(prev)prev(id,el);fixAll()};
      document.addEventListener('click',function(e){var a=e.target.closest('a.cta');if(!a||!INFO)return;e.preventDefault();e.stopPropagation();ask(a)},true)};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()}
  api('client/who').then(function(w){
    if(w._s===200&&w.linked){MODE='user';return start({name:w.partner,label:w.label})}
    if(p&&RP.test(p)){return api('site/info',null,'&p='+p+(once?'&open=1':'')).then(function(d){if(d._s!==200||!d.label){if(d._s===404)LS.s('oj_p',null);return}MODE='p';start(d)})}
    if(k&&RK.test(k)){return api('plink/info',null,'&k='+encodeURIComponent(k)+(once?'&open=1':'')).then(function(d){if(d._s!==200||!d.label){if(d._s===404)LS.s('oj_k',null);return}MODE='k';start(d)})}
  });
})();
