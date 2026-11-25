/* Личная подборка: партнер Orbiq отправляет клиенту ссылку /journal/?k=…
   Кнопки «Хочу такую историю» меняются на кнопку партнера, запрос уходит в его CRM и в Orbiq.
   Без ссылки журнал работает как раньше. */
;(function(){
  if(!window.fetch)return;
  var RE=/^[A-Za-z0-9_-]{12}$/,KEY='oj_k',q=new URLSearchParams(location.search),k=q.get('k'),fresh=false;
  try{
    if(k==='off'){localStorage.removeItem(KEY);return}
    if(k&&RE.test(k)){if(localStorage.getItem(KEY)!==k)fresh=true;localStorage.setItem(KEY,k)}
    else k=localStorage.getItem(KEY);
  }catch(e){}
  if(!k||!RE.test(k))return;
  if(q.get('k')){q.delete('k');var qs=q.toString();try{history.replaceState(history.state,'',location.pathname+(qs?'?'+qs:'')+location.hash)}catch(e){}}
  var once=false;try{once=!sessionStorage.getItem('oj_ko');sessionStorage.setItem('oj_ko','1')}catch(e){}
  var INFO=null;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function api(r,b,qx){var o={method:b?'POST':'GET',credentials:'same-origin',headers:{}};if(b){o.headers['Content-Type']='application/json';o.body=JSON.stringify(b)}
    return fetch('/api/crm/?r='+r+(qx||''),o).then(function(x){return x.json().catch(function(){return{}}).then(function(j){j._s=x.status;return j})}).catch(function(){return{_s:0}})}
  var css='.plk-cta{cursor:pointer}'+
    '.plk-rib{position:fixed;left:16px;bottom:16px;z-index:60;display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:#0B0B0D;color:#F3F4F2;font-size:13px;line-height:1.2;box-shadow:0 12px 30px -12px rgba(0,0,0,.5);max-width:calc(100vw - 32px)}'+
    '.plk-rib i{width:7px;height:7px;border-radius:50%;background:#FF4D00;flex:none}'+
    '.plk-m{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:20px;background:rgba(11,11,13,.55);opacity:0;transition:opacity .3s}'+
    '.plk-m.on{opacity:1}.plk-m>div{background:#F3F4F2;color:#0B0B0D;border-radius:24px;padding:26px 24px 22px;max-width:420px;width:100%;display:grid;gap:10px;transform:translateY(14px);transition:transform .5s cubic-bezier(.16,1,.3,1)}'+
    '.plk-m.on>div{transform:none}.plk-m small{font-family:"Geist Mono",ui-monospace,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#FF4D00}'+
    '.plk-m h3{margin:0;font-size:22px;line-height:1.2;letter-spacing:-.02em}.plk-m p{margin:0;font-size:15px;line-height:1.5;color:#55565A}'+
    '.plk-m textarea{width:100%;min-height:76px;border-radius:14px;border:1px solid rgba(11,11,13,.14);padding:10px 12px;font:inherit;font-size:15px;resize:vertical;background:#fff}'+
    '.plk-m .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}.plk-m button{border:0;border-radius:999px;padding:13px 20px;font:inherit;font-weight:600;font-size:15px;cursor:pointer}'+
    '.plk-m .go{background:#FF4D00;color:#fff}.plk-m .no{background:rgba(11,11,13,.07);color:#0B0B0D}';
  function label(a){return a.hasAttribute('data-arch')?'Уведомлять о подобных предложениях':INFO.label}
  function fix(a){if(a.getAttribute('data-plk'))return;a.setAttribute('data-plk','1');a.classList.add('plk-cta');a.innerHTML=esc(label(a))+' <span aria-hidden="true">→</span>';a.setAttribute('href','#');a.removeAttribute('target');a.removeAttribute('rel')}
  function fixAll(){var t=document.querySelectorAll('template');for(var i=0;i<t.length;i++){var L=t[i].content.querySelectorAll('a.cta');for(var j=0;j<L.length;j++)fix(L[j])}
    var D=document.querySelectorAll('a.cta');for(var n=0;n<D.length;n++)fix(D[n])}
  function modal(html,onGo){var m=document.createElement('div');m.className='plk-m';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.innerHTML='<div>'+html+'</div>';document.body.appendChild(m);
    requestAnimationFrame(function(){m.classList.add('on')});var kill=function(){m.classList.remove('on');setTimeout(function(){m.remove()},300)};
    m.addEventListener('click',function(e){if(e.target===m||e.target.closest('.no'))kill();var g=e.target.closest('.go');if(g&&onGo)onGo(m,g,kill)});
    var f=m.querySelector('textarea,.go');if(f)setTimeout(function(){f.focus()},60);return m}
  function titleOf(a){var box=a.closest('.ov,.ov-in,article,section')||document;var h=box.querySelector('h2,h1')||document.querySelector('h1');return h?h.textContent.trim():document.title}
  function ask(a){var notify=a.hasAttribute('data-arch');var title=titleOf(a);var item=(location.hash||'').slice(1);var nm=esc(INFO.name);
    modal('<small>'+(notify?'Уведомления':'Запрос')+'</small><h3>'+esc(title)+'</h3><p>'+(notify?nm+' сообщит, когда появится похожее предложение.':'Запрос получит ваш партнер '+nm+' лично и свяжется с вами.')+'</p><textarea placeholder="Комментарий, если нужно: сроки, для кого, пожелания"></textarea><div class="row"><button type="button" class="go">'+(notify?'Уведомлять':'Отправить запрос')+'</button><button type="button" class="no">Отмена</button></div>',
      function(m,g,kill){g.disabled=true;g.textContent='Отправляем…';
        api('plink/ask',{k:k,kind:notify?'notify':'want',item:item,title:title,note:(m.querySelector('textarea')||{}).value||'',page:location.pathname}).then(function(r){
          if(r._s===200){m.firstChild.innerHTML='<small>Готово</small><h3>'+(notify?'Уведомления включены':'Запрос отправлен')+'</h3><p>'+(notify?nm+' напишет, когда появится похожее предложение.':nm+' свяжется с вами лично.')+'</p><div class="row"><button type="button" class="no">Хорошо</button></div>'}
          else{g.disabled=false;g.textContent='Повторить';var p=m.querySelector('p');if(p)p.textContent=r._s===429?'Слишком много запросов. Можно повторить завтра.':'Запрос не отправился. Можно повторить.'}})})}
  api('plink/info',null,'&k='+encodeURIComponent(k)+(once||fresh?'&open=1':'')).then(function(d){
    if(d._s!==200||!d.label){if(d._s===404){try{localStorage.removeItem(KEY)}catch(e){}}return}
    INFO=d;var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var go=function(){fixAll();var r=document.createElement('div');r.className='plk-rib';r.innerHTML='<i></i><span>Личная подборка · запросы уходят '+esc(d.name)+'</span>';document.body.appendChild(r);
      var prev=window.OJ_after;window.OJ_after=function(id,el){if(prev)prev(id,el);fixAll()};
      document.addEventListener('click',function(e){var a=e.target.closest('a.cta');if(!a||!INFO)return;e.preventDefault();e.stopPropagation();ask(a)},true)};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()})
})();
