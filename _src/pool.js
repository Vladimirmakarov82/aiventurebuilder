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
</script>
