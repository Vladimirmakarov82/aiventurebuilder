<script>
/* Лента первого экрана: плашки-услуги (могут повторяться) и плашки-вещи (без повторов, пока не пройдут все) */
(function(){try{
var T=(window.__POOL||[]).slice(),S=(window.__SVC||[]).slice(),R=window.__SROLE||[],its=[].slice.call(document.querySelectorAll('.bx-it'));if(!T.length||!its.length)return;
function sh(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
var IM=window.__IMG||{},tq=sh(T.slice());
function put(el,sp,x){sp.textContent=x;var u=IM[x],ph=el.querySelector('.ph');if(u){if(!ph){ph=document.createElement('i');ph.className='ph';el.appendChild(ph)}ph.style.backgroundImage='url('+u+')';el.classList.add('img')}else el.classList.remove('img')}
function vis(){return its.map(function(e){return e.querySelector('span').textContent})}
function nextThing(){if(!tq.length){var v=vis();tq=sh(T.filter(function(x){return v.indexOf(x)<0}))}return tq.shift()}
function nextSvc(){var v=vis(),c=S.filter(function(x){return v.indexOf(x)<0});if(!c.length)c=S;return c[Math.floor(Math.random()*c.length)]}
its.forEach(function(el,i){var sp=el.querySelector('span'),isS=S.length&&R.indexOf(i%12)>=0;
  put(el,sp,isS?nextSvc():nextThing());
  el.addEventListener('animationiteration',function(e){if(e.target!==el)return;put(el,sp,isS?nextSvc():nextThing())})});
}catch(e){}})();
(function(){var c=document.getElementById('cat');if(!c)return;var T=c.querySelectorAll('.cat-t'),P=c.querySelectorAll('.cat-p'),cur=0,tm=null,user=false,vis=false,D=7000;
function show(i){cur=i;T.forEach(function(t,k){var on=k===i;t.classList.toggle('on',on);t.setAttribute('aria-selected',on?'true':'false');var b=t.querySelector('i');if(b){b.style.width='';b.style.animation='none';b.offsetWidth;b.style.animation=''}});P.forEach(function(p,k){var on=k===i;p.hidden=!on;p.classList.toggle('on',on);if(on)p.scrollLeft=0});var a=T[i];if(a&&a.parentNode.scrollWidth>a.parentNode.clientWidth){a.parentNode.scrollTo({left:a.offsetLeft-16,behavior:'smooth'})}}
function loop(){clearTimeout(tm);if(user||!vis||c.classList.contains('paused'))return;tm=setTimeout(function(){show((cur+1)%T.length);loop()},D)}
T.forEach(function(t,k){t.addEventListener('click',function(){user=true;c.classList.add('paused');clearTimeout(tm);show(k);var b=t.querySelector('i');if(b)b.style.width='100%'})});
c.addEventListener('mouseenter',function(){if(!user){c.classList.add('paused');clearTimeout(tm)}});c.addEventListener('mouseleave',function(){if(!user){c.classList.remove('paused');show(cur);loop()}});
c.addEventListener('touchstart',function(){user=true;c.classList.add('paused');clearTimeout(tm)},{passive:true});
if('IntersectionObserver'in window){new IntersectionObserver(function(e){vis=e[0].isIntersecting;if(vis){show(cur);loop()}else clearTimeout(tm)},{threshold:.35}).observe(c)}else{vis=true;loop()}
if(matchMedia('(prefers-reduced-motion: reduce)').matches)user=true;})();
</script>
