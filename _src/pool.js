<script>
/* Бесконечная лента запросов на первом экране: каждая плашка после круга получает новый запрос из большого пула, без повторов подряд */
(function(){try{
var P=(window.__POOL||[]).slice(),its=[].slice.call(document.querySelectorAll('.bx-it'));if(!P.length||!its.length)return;
function sh(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
var q=sh(P.slice()),shown=[];
function next(){if(!q.length){q=sh(P.slice()).filter(function(x){return shown.indexOf(x)<0});if(!q.length)q=sh(P.slice())}var x=q.shift();shown.push(x);if(shown.length>its.length)shown.shift();return x}
its.forEach(function(el){var sp=el.querySelector('span');sp.textContent=next();
  el.addEventListener('animationiteration',function(e){if(e.target!==el)return;sp.textContent=next()})});
}catch(e){}})();
</script>
