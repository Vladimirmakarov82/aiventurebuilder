/* Orbiq partners: motion layer. Content is always visible without this script. */
(function(){
var RU=(document.documentElement.lang||'ru').indexOf('ru')===0;
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var FINE=window.matchMedia&&matchMedia('(pointer:fine)').matches;
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var aud=$('#v-aud');if(!aud)return;
var G=window.gsap;

/* --- helpers --- */
function onView(el,fn,margin){if(!el)return;if(!('IntersectionObserver' in window)){fn();return}
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.disconnect();fn()}})},{rootMargin:margin||'0px 0px -12% 0px'});io.observe(el)}
function numParts(t){var m=/(\d[\d   ]*(?:[.,]\d+)?)/.exec(t);if(!m)return null;
 var raw=m[1],dec=/[.,](\d+)$/.exec(raw),sep=/\d([   ,])\d{3}/.exec(raw);
 var clean=raw.replace(/[   ]/g,''),d=0,v;
 if(dec&&!(sep&&sep[1]===','&&dec[1].length===3)){d=dec[1].length;v=parseFloat(clean.replace(',','.'))}else v=parseFloat(clean.replace(/,/g,''));
 return {pre:t.slice(0,m.index),post:t.slice(m.index+raw.length),v:v,d:d,sep:sep?sep[1]:' ',dc:dec&&d?raw.charAt(raw.length-d-1):','}}
function fmt(p,x){var s=x.toFixed(p.d),parts=s.split('.');parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,p.sep);return p.pre+parts.join(p.dc)+p.post}
function count(el,dur,delay){var t=el.textContent,p=numParts(t);if(!p||RM)return;var o={x:0};el.textContent=fmt(p,0);
 if(G)G.to(o,{x:p.v,duration:dur||1.4,delay:delay||0,ease:'expo.out',onUpdate:function(){el.textContent=fmt(p,o.x)},onComplete:function(){el.textContent=t}});else el.textContent=t}
var GLY='0123456789$€%—·+×';
function scramble(el,dur){if(RM)return;var t=el.textContent,n=t.length,st=performance.now(),L=(dur||450);
 (function f(now){var k=Math.min(1,(now-st)/L),fix=Math.floor(k*n),s='';for(var i=0;i<n;i++)s+=(i<fix||t[i]===' '||t[i]===' ')?t[i]:GLY[(Math.random()*GLY.length)|0];el.textContent=s;if(k<1)requestAnimationFrame(f);else el.textContent=t})(st)}
function spot(el){if(!FINE||!el)return;el.classList.add('w-spot');el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.setProperty('--x',e.clientX-r.left+'px');el.style.setProperty('--y',e.clientY-r.top+'px')})}
function magnet(el,k){if(!FINE||!G||!el||el._mg)return;el._mg=1;k=k||.3;
 el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();G.to(el,{x:(e.clientX-r.left-r.width/2)*k,y:(e.clientY-r.top-r.height/2)*k,duration:.6,ease:'power4.out'})});
 el.addEventListener('pointerleave',function(){G.to(el,{x:0,y:0,duration:1.1,ease:'elastic.out(1,0.35)'})})}
function lines(el,delay){if(RM||!G||!el)return;
 if(window.SplitText){try{var sp=new SplitText(el,{type:'lines',mask:'lines'});G.from(sp.lines,{yPercent:110,duration:.9,stagger:.08,ease:'expo.out',delay:delay||0});return}catch(e){}}
 G.from(el,{y:24,opacity:0,duration:.9,ease:'expo.out',delay:delay||0})}

/* --- hero --- */
function hero(){var h=$('h1',aud);
 if(G&&!RM&&window.SplitText&&h){try{var sp=new SplitText(h,{type:'words,chars'});G.from(sp.chars,{filter:'blur(12px)',opacity:0,yPercent:30,duration:.9,ease:'power2.out',stagger:{each:.018,from:'random'}})}catch(e){}}
 if(G&&!RM){G.from($$('.sub,.hnum>div,.hpot,.row .btn',aud).slice(0,5),{y:26,opacity:0,duration:1,ease:'expo.out',stagger:.08,delay:.25})}
 $$('.hnum b',aud).forEach(function(b,i){count(b,1.6,.35+i*.1)});
 $$('.hnum>div',aud).forEach(spot);
 $$('.btn',aud).forEach(function(b){magnet(b,.28)})}

/* --- income example --- */
function income(){var hp=$('.hpot',aud);if(!hp)return;spot(hp);
 var tot=$('.tot',hp);if(tot&&!$('.w-bar',hp)){var bar=document.createElement('div');bar.className='w-bar';bar.innerHTML='<i></i><i></i>';hp.insertBefore(bar,tot)}
 onView(hp,function(){var rows=$$('div:not(.w-bar)',hp);
  if(G&&!RM){G.from(rows,{clipPath:'inset(0 100% 0 0)',x:-12,duration:.9,ease:'expo.out',stagger:.14});
   G.from($$('.w-bar i',hp),{scaleX:0,duration:1.2,ease:'expo.inOut',stagger:.25,delay:.3})}
  $$('b',hp).forEach(function(b,i){count(b,1.5,.15+i*.15)})})}

/* --- leads --- */
var seen={};
function leadsIn(){var box=$('#pleads');if(!box)return;
 var fresh=$$('.pld',box).filter(function(a){var k=a.textContent.slice(0,60);var n=!seen[k];seen[k]=1;return n});
 fresh.forEach(function(a){spot(a);rot(a);var x=$('.pld-x',a);if(x&&!$('.w-ring',x)){var r=document.createElement('span');r.className='w-ring';x.appendChild(r)}});
 if(!G||RM||!fresh.length)return;
 G.from(fresh,{y:30,opacity:0,clipPath:'inset(0 0 100% 0 round 18px)',duration:1,ease:'expo.out',stagger:.07,clearProps:'clipPath,transform,opacity'});
 var op=fresh.filter(function(a){return a.classList.contains('is-open')})[0];if(op)setTimeout(function(){reveal(op)},550)}
function reveal(a){if(!G||RM)return;var inn=$('.pld-in',a);if(!inn)return;var ps=$$('p',inn);
 G.fromTo(inn,{'--ln':0},{'--ln':1,duration:.9,ease:'expo.inOut'});
 G.fromTo(ps,{'--sy':0},{'--sy':1,duration:.7,ease:'expo.out',stagger:.09,delay:.15});
 G.fromTo(ps,{opacity:0,y:14,filter:'blur(6px)',clipPath:'inset(0 100% 0 0)'},{opacity:1,y:0,filter:'blur(0px)',clipPath:'inset(0 0% 0 0)',duration:.85,ease:'expo.out',stagger:.09,delay:.1,clearProps:'filter,clipPath'});
 ps.forEach(function(p,i){var s=$('small',p);if(s)setTimeout(function(){scramble(s,420)},120+i*90)});
 var b=$('.pld-r b',a);if(b)scramble(b,520)}
function burst(a,e){if(!G||RM)return;var x=$('.pld-x',a);if(x){
  G.fromTo(x,{'--a':'0deg'},{'--a':'360deg',duration:.6,ease:'power2.out',onComplete:function(){x.style.setProperty('--a','0deg')}});
  for(var i=0;i<8;i++){var s=document.createElement('span');s.className='w-spark';x.appendChild(s);var ang=i/8*Math.PI*2;
   G.fromTo(s,{x:0,y:0,scale:1,opacity:1},{x:Math.cos(ang)*28,y:Math.sin(ang)*28,scale:0,opacity:0,duration:.7,ease:'expo.out',onComplete:(function(n){return function(){n.remove()}})(s)})}}
 var r=a.getBoundingClientRect(),rp=document.createElement('span');rp.className='w-rip';rp.style.left=(e.clientX-r.left)+'px';rp.style.top=(e.clientY-r.top)+'px';a.appendChild(rp);
 G.fromTo(rp,{scale:0,opacity:.16},{scale:Math.max(r.width,r.height)/9,opacity:0,duration:1.1,ease:'expo.out',onComplete:function(){rp.remove()}})}
function rot(a){var x=$('.pld-x',a);if(!x||!G)return;var o=a.classList.contains('is-open');if(!!x._o===o)return;x._o=o;G.to(x,{rotation:o?135:0,duration:o?.9:.6,ease:o?'elastic.out(1,0.45)':'expo.out'})}
function leads(){var box=$('#pleads');if(!box)return;leadsIn();document.documentElement.classList.add('w-on');
 new MutationObserver(function(){leadsIn()}).observe(box,{childList:true});
 document.addEventListener('pld-all',function(){$$('.pld',box).forEach(function(x,i){rot(x);if(x.classList.contains('is-open'))setTimeout(function(){reveal(x)},i*60)})});
 box.addEventListener('click',function(e){var h=e.target.closest('.pld-h');if(!h)return;var a=h.parentNode;
  setTimeout(function(){$$('.pld',box).forEach(rot);if(a.classList.contains('is-open')){burst(a,e);reveal(a)}},0)},true);
 if(FINE&&G)box.addEventListener('pointermove',function(e){var h=e.target.closest('.pld-h');if(!h)return;var x=$('.pld-x',h),r=x.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),d=Math.hypot(dx,dy);
  G.to(x,{x:d<140?dx*.18:0,y:d<140?dy*.18:0,duration:.6,ease:'power4.out'})});
 if(FINE&&G)box.addEventListener('pointerout',function(e){var h=e.target.closest&&e.target.closest('.pld-h');if(h&&!h.contains(e.relatedTarget))G.to($('.pld-x',h),{x:0,y:0,duration:1,ease:'elastic.out(1,0.35)'})})}

/* --- asymmetry example: live widgets --- */
function example(){var ex=$('.asym-ex',aud);if(!ex||$('.w-ex',ex))return;
 var w=document.createElement('div');w.className='w-ex';
 w.innerHTML='<div><small>'+(RU?'Скидка':'Discount')+'</small><b>−<em class="wd">0</em>%</b><div class="w-price"><i></i><s></s></div></div>'+
  '<div><small>'+(RU?'Квартир в продаже':'Flats on sale')+'</small><b class="wf">0</b><div class="w-flats">'+new Array(71).join('<i></i>')+'</div></div>'+
  '<div><small>'+(RU?'Срок':'Window')+'</small><div class="w-ring2"><svg viewBox="0 0 46 46"><circle class="bg" cx="23" cy="23" r="19"/><circle class="fg" cx="23" cy="23" r="19" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/></svg><b class="wr">'+(RU?'7 дней':'7 days')+'</b></div></div>';
 ex.appendChild(w);if(!G||RM){$('.wd',w).textContent='45';$('.wf',w).textContent='70';$$('.w-flats i',w).forEach(function(i){i.classList.add('on')});return}
 var fl=$$('.w-flats i',w),o={d:0,f:0,r:7},fg=$('.fg',w);
 var tl=G.timeline({repeat:-1,repeatDelay:1.4,paused:true});
 tl.set(o,{d:0,f:0,r:7}).set($('.wr',w),{textContent:RU?'7 дней':'7 days'}).set($('.w-price i',w),{scaleX:1,transformOrigin:'left'}).set(fg,{attr:{'stroke-dashoffset':0}})
  .to(o,{d:45,duration:1.6,ease:'expo.out',onUpdate:function(){$('.wd',w).textContent=Math.round(o.d)}},0)
  .to($('.w-price i',w),{scaleX:.55,duration:1.6,ease:'expo.out'},0)
  .to(o,{f:70,duration:1.8,ease:'power2.inOut',onUpdate:function(){var n=Math.round(o.f);$('.wf',w).textContent=n<10?10:n;fl.forEach(function(i,k){i.classList.toggle('on',k<n)})}},.2)
  .to(o,{r:2,duration:3.2,ease:'none',onUpdate:function(){var n=Math.max(2,Math.ceil(o.r));$('.wr',w).textContent=n+(RU?(n<5?' дня':' дней'):' days')}},.4)
  .to(fg,{attr:{'stroke-dashoffset':5/7},duration:3.2,ease:'none'},.4)
  .to(fl,{opacity:.25,duration:.4,stagger:{each:.004,from:'random'}},3.6).set(fl,{opacity:1},4.4);
 onView(ex,function(){tl.play()})}

/* --- asymmetry timeline: playhead --- */
function timeline(){var v=$('.asym-v',aud);if(!v||!G||RM)return;v.classList.add('w-tl');
 var rows=$$('.asym-r',v).map(function(r){var d=$('.asym-d',r),ph=document.createElement('span');ph.className='w-ph';d.appendChild(ph);
  var c=document.createElement('div');c.className='w-cnt';c.textContent='0';$('.asym-t',r).appendChild(c);
  return {d:d,ph:ph,c:c,cells:$$('i',d).filter(function(i){return i.offsetParent!==null})}});
 var st={p:0};
 function upd(){rows.forEach(function(R){var W=R.d.clientWidth;R.ph.style.transform='translateX('+(st.p*W)+'px)';var n=0;
  R.cells.forEach(function(c){var mid=(c.offsetLeft+c.offsetWidth/2)/W,on=c.classList.contains('on');if(!on)return;
   if(mid<=st.p){n++;if(!c.classList.contains('hit')){c.classList.add('hit','flash');setTimeout(function(){c.classList.remove('flash')},450)}}else c.classList.remove('hit')});
  R.c.textContent=n})}
 var tl=G.timeline({repeat:-1,repeatDelay:2.2,paused:true});
 tl.fromTo(st,{p:0},{p:1,duration:6,ease:'none',onUpdate:upd}).to(rows.map(function(r){return r.ph}),{opacity:0,duration:.3},'>').set(rows.map(function(r){return r.ph}),{opacity:1},'>2');
 onView(v,function(){tl.play()});
 window.addEventListener('resize',function(){rows.forEach(function(R){R.cells=$$('i',R.d).filter(function(i){return i.offsetParent!==null})})})}

/* --- architecture: network --- */
function network(){var ar=$('.arch',aud);if(!ar||$('.w-net',ar))return;var h2=$('h2',ar);
 var CAT=RU?['Финансы','Недвижимость','Право','Авиация','Образование','Искусство и\nколлекционирование','Медицина']:['Finance','Real estate','Law','Aviation','Education','Art and\ncollectibles','Medicine'];
 var net=document.createElement('div');net.className='w-net';
 var MOB=innerWidth<720,VW=MOB?600:1000,VH=MOB?850:440;net.innerHTML='<svg viewBox="0 0 '+VW+' '+VH+'" preserveAspectRatio="xMidYMid meet"></svg><div class="cap"><span><i style="background:#FF4D00"></i>'+(RU?'Запросы и асимметрии':'Requests and asymmetries')+'</span><span><i style="background:#fff"></i>'+(RU?'Партнеры':'Partners')+'</span><span><i style="background:transparent;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.5)"></i>'+(RU?'Клиенты остаются у партнера':'Clients stay with the partner')+'</span></div>';
 h2.parentNode.insertBefore(net,h2.nextSibling);net.style.aspectRatio=VW+'/'+VH;net.style.minHeight='0';
 var svg=$('svg',net),NS='http://www.w3.org/2000/svg',cx=VW/2,cy=MOB?350:210,RX=MOB?205:232,RY=MOB?255:150,FS=MOB?22:13,P=[];
 function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e}
 var gl=el('g',{}),gc=el('g',{}),gp=el('g',{}),gn=el('g',{});
 el('ellipse',{cx:cx,cy:cy,rx:RX*.65,ry:RY*.65,fill:'none',stroke:'rgba(255,255,255,.08)','stroke-dasharray':'2 6'},gl);
 CAT.forEach(function(c,i){var a=i/CAT.length*Math.PI*2-Math.PI/2,x=cx+Math.cos(a)*RX,y=cy+Math.sin(a)*RY,p={x:x,y:y,a:a};
  p.line=el('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'rgba(255,255,255,.22)','stroke-width':1,pathLength:1,'stroke-dasharray':1,'stroke-dashoffset':1},gl);
  for(var j=0;j<3;j++){var b=a+(j-1)*.32,ox=x+Math.cos(b)*54*(x>cx?1:-1)*Math.sign(Math.cos(a)||1)*(x>cx?1:1),oy=y+Math.sin(b)*38;
   ox=x+Math.cos(a+(j-1)*.55)*(MOB?62:58);oy=y+Math.sin(a+(j-1)*.55)*(MOB?52:40);
   el('line',{x1:x,y1:y,x2:ox,y2:oy,stroke:'rgba(255,255,255,.14)','stroke-width':1},gc);
   el('circle',{cx:ox,cy:oy,r:MOB?7:4.5,fill:'none',stroke:'rgba(255,255,255,.5)','stroke-width':1.4},gc)}
  p.dot=el('circle',{cx:x,cy:y,r:MOB?11:7,fill:'#fff'},gn);p.r=MOB?11:7;
  var ca=Math.cos(a),sa=Math.sin(a),side=Math.abs(ca)>.75;var vert=Math.abs(sa)>.5,two=c.indexOf('\n')>0,lx=x,ly=vert?y-sa*(FS*(two?3.1:2.4)):(two&&MOB?y+FS*2.7:y-FS*(two?2.6:1.9)),lb=document.createElement('span');lb.className='w-lab';lb.textContent=c;
  lb.style.left=(lx/VW*100)+'%';lb.style.top=(ly/VH*100)+'%';lb.style.transform='translate(-50%,-50%)';net.appendChild(lb);
  P.push(p)});
 function fit(){var n=net.getBoundingClientRect();$$('.w-lab',net).forEach(function(lb){if(lb.classList.contains('w-core'))return;lb.style.marginLeft='0';var r=lb.getBoundingClientRect(),d=0;if(r.left<n.left+8)d=n.left+8-r.left;else if(r.right>n.right-8)d=n.right-8-r.right;lb.style.marginLeft=d+'px'})}
 setTimeout(fit,50);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);window.addEventListener('resize',fit);
 var CR=MOB?52:34;el('circle',{cx:cx,cy:cy,r:CR,fill:'#FF4D00'},gn);
 var halo=el('circle',{cx:cx,cy:cy,r:CR,fill:'none',stroke:'#FF4D00','stroke-width':1.5},gn);
 var tl0=document.createElement('span');tl0.className='w-lab w-core';tl0.textContent='Orbiq';tl0.style.left=(cx/VW*100)+'%';tl0.style.top=(cy/VH*100)+'%';net.appendChild(tl0);
 var packets=[];
 function spawn(){var a=P[(Math.random()*P.length)|0],b=P[(Math.random()*P.length)|0];if(a===b)return;
  packets.push({a:a,b:b,t:0,s:.006+Math.random()*.004,e:el('circle',{r:MOB?6:4,fill:'#FF4D00'},gp),tr:el('circle',{r:MOB?14:9,fill:'rgba(255,77,0,.18)'},gp)})}
 var run=false,last=0;
 function tick(now){if(!run)return;if(now-last>380){spawn();last=now}
  packets=packets.filter(function(k){k.t+=k.s;var x,y;if(k.t<.5){var u=k.t*2;x=k.a.x+(cx-k.a.x)*u;y=k.a.y+(cy-k.a.y)*u}else{var u2=(k.t-.5)*2;x=cx+(k.b.x-cx)*u2;y=cy+(k.b.y-cy)*u2}
   k.e.setAttribute('cx',x);k.e.setAttribute('cy',y);k.tr.setAttribute('cx',x);k.tr.setAttribute('cy',y);
   if(k.t>=1){k.e.remove();k.tr.remove();if(G)G.fromTo(k.b.dot,{attr:{r:k.b.r*1.6}},{attr:{r:k.b.r},duration:.6,ease:'expo.out'});return false}return true});
  requestAnimationFrame(tick)}
 onView(net,function(){
  if(G&&!RM){G.to(P.map(function(p){return p.line}),{attr:{'stroke-dashoffset':0},duration:1.2,ease:'expo.inOut',stagger:.06});
   G.from([].slice.call(gn.childNodes).concat($$('.w-lab',net)),{opacity:0,duration:.8,stagger:.03,ease:'power2.out'});
   G.from(gc,{opacity:0,duration:1,delay:.8});
   G.fromTo(halo,{attr:{r:CR},opacity:.8},{attr:{r:CR*2},opacity:0,duration:2.2,ease:'expo.out',repeat:-1});
   run=true;requestAnimationFrame(tick);
   if('IntersectionObserver' in window)new IntersectionObserver(function(es){var v=es[0].isIntersecting;if(v&&!run){run=true;requestAnimationFrame(tick)}if(!v)run=false}).observe(net)}
  else P.forEach(function(p){p.line.setAttribute('stroke-dashoffset',0)})});
 var lis=$$('.arch-g li',ar);onView($('.arch-g',ar),function(){if(!G||RM)return;
  G.from(lis,{opacity:0,x:-14,duration:.8,ease:'expo.out',stagger:.06});G.fromTo(lis,{'--dx':0},{'--dx':1,duration:.6,ease:'expo.out',stagger:.06,delay:.1})});
 $$('.arch-g section',ar).forEach(spot)}

/* --- headings --- */
function heads(){$$('.asym h2,.arch h2',aud).forEach(function(h){onView(h,function(){lines(h)})});
 var ex=$('.asym-ex',aud);if(ex)spot(ex)}


/* --- client value bars --- */
function value(){var v=$('.aval',aud);if(!v||RM)return;v.classList.add('pre');onView(v,function(){setTimeout(function(){v.classList.remove('pre')},120);$$('.aval-r b',v).forEach(function(b,i){count(b,1.4,.1+i*.2)})})}
/* --- "the call clients wait for": inbox -> chat --- */
function callAnim(){var box=$('.indp .indp-v');if(!box||!G||RM)return;var sec=box.closest('.indp');
 var M=RU?[['Банк','Облигации: 18% годовых до конца года'],['Застройщик','Новый ЖК бизнес-класса, старт продаж'],['Брокер','Страхование жизни для семьи'],['Банк','Персональный банкир: встреча на неделе?'],['Агентство','Апартаменты в Дубае с рассрочкой'],['Фонд','Фонд недвижимости, вход от $100 тыс.']]
   :[['Bank','Bonds: 18% a year until year end'],['Developer','New business-class project, sales open'],['Broker','Life insurance for the family'],['Bank','Personal banker: meet this week?'],['Agency','Dubai apartments with instalments'],['Fund','Real estate fund, from $100k']];
 var T=RU?{inbox:'Входящие клиента',chat:'Партнер Orbiq',q1:'Что нового появилось в сети?',q2:'Есть интересные сделки?',a:'Три новые асимметрии на этой неделе',as:'Скидка 40–45% · срок 2–7 дней'}
   :{inbox:'Client inbox',chat:'Orbiq partner',q1:'What’s new in the network?',q2:'Any interesting deals?',a:'Three new asymmetries this week',as:'40–45% off · 2–7 days'};
 box.style.display='none';sec.classList.add('has-call');
 var c=document.createElement('div');c.className='call';
 c.innerHTML='<div class="call-top"><span class="t1">'+T.inbox+'</span><em>0</em></div><ul class="call-in">'+M.map(function(m,i){return '<li><i>'+m[0].charAt(0)+'</i><b>'+m[0]+'</b><span>'+m[1]+'</span><small>'+(9+i)+':'+(10+i*7)+'</small></li>'}).join('')+'</ul><div class="call-chat"></div>';
 box.parentNode.insertBefore(c,box);
 var top=$('.call-top',c),cnt=$('em',top),t1=$('.t1',top),list=$('.call-in',c),lis=$$('li',list),chat=$('.call-chat',c),o={n:0};
 var bub=function(cls,html){var b=document.createElement('div');b.className='bub '+cls;b.innerHTML=html;chat.appendChild(b);return b};
 var typing=function(cls){return bub(cls+' ty','<i></i><i></i><i></i>')};
 var tl=G.timeline({repeat:-1,repeatDelay:.8,paused:true,onRepeat:function(){}});
 tl.call(function(){chat.innerHTML='';t1.textContent=T.inbox;t1.className='t1';cnt.style.display='';o.n=0;cnt.textContent='0'})
  .set(lis,{y:-30,opacity:0,filter:'blur(0px)'}).set(list,{opacity:1,scale:1,filter:'blur(0px)'})
  .to(lis,{y:0,opacity:1,duration:.5,ease:'expo.out',stagger:.32})
  .to(lis,{opacity:.38,duration:.6,stagger:.32},.5)
  .to(o,{n:37,duration:2.2,ease:'power2.out',onUpdate:function(){cnt.textContent=Math.round(o.n)}},0)
  .to(list,{opacity:.12,scale:.94,filter:'blur(3px)',duration:.7,ease:'expo.inOut'},'+=.5')
  .call(function(){t1.textContent=T.chat;t1.className='t1 on';cnt.style.display='none'},null,'<.3')
  .call(function(){window.__ty=typing('cl')},null,'+=.2')
  .to({},{duration:.9})
  .call(function(){window.__ty.remove();G.from(bub('cl',T.q1),{y:14,opacity:0,duration:.45,ease:'expo.out'})})
  .to({},{duration:.7})
  .call(function(){G.from(bub('cl',T.q2),{y:14,opacity:0,duration:.45,ease:'expo.out'})})
  .to({},{duration:.6})
  .call(function(){window.__ty=typing('pt')})
  .to({},{duration:1.1})
  .call(function(){window.__ty.remove();G.from(bub('pt',T.a+'<small>'+T.as+'</small>'),{y:14,opacity:0,scale:.96,duration:.5,ease:'back.out(1.6)'})})
  .to({},{duration:3});
 onView(c,function(){tl.play()})}
function boot(){try{hero();income();leads();example();timeline();network();heads();value();callAnim()}catch(e){if(window.console)console.warn('wow',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
