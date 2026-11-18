<script>
/* Форма задачи: 3 шага, ничего не хранит, отправка готовым текстом в Telegram или почту */
(function(){try{
var F=document.getElementById('tform'),D=window.__TF;if(!F||!D)return;
var st=1,cat='',S=[].slice.call(F.querySelectorAll('.tf-s')),bar=document.getElementById('tfbar'),lab=document.getElementById('tfstep'),tx=document.getElementById('tftext'),nm=document.getElementById('tfname'),nx=document.getElementById('tfnext');
function go(n){st=n;S.forEach(function(e){e.classList.toggle('on',+e.dataset.s===n)});bar.style.width=(n/3*100)+'%';lab.textContent=n+' / 3';if(n===2)setTimeout(function(){tx.focus()},250);if(n===3)setTimeout(function(){nm.focus()},250)}
F.querySelectorAll('.tf-chips button').forEach(function(b){b.addEventListener('click',function(){F.querySelectorAll('.tf-chips button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');cat=b.textContent;setTimeout(function(){go(2)},220)})});
function chk(){nx.disabled=tx.value.trim().length<3}tx.addEventListener('input',chk);chk();
nx.addEventListener('click',function(){if(!nx.disabled)go(3)});
F.querySelectorAll('.tf-back').forEach(function(b){b.addEventListener('click',function(){go(Math.max(1,st-1))})});
function msg(){var m=D.title+'\n'+D.cat+': '+(cat||'—')+'\n\n'+tx.value.trim();if(nm.value.trim())m+='\n\n'+D.name+': '+nm.value.trim();return m}
F.querySelectorAll('.tf-go').forEach(function(b){b.addEventListener('click',function(){var m=msg();
  if(b.dataset.ch==='tg')window.open('https://t.me/vladimir82makarov?text='+encodeURIComponent(m),'_blank');
  else location.href='mailto:private@orbiqgroup.com?subject='+encodeURIComponent(D.title)+'&body='+encodeURIComponent(m)})});
/* голосовой ввод: встроенное распознавание браузера, бесплатно, без нашего сервера */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition,mic=document.getElementById('tfmic'),ml=document.getElementById('tfmicl');
if(SR&&mic){mic.hidden=false;var r=null,base='';
 mic.addEventListener('click',function(){if(r){r.stop();return}
  r=new SR();r.lang=D.lang;r.continuous=true;r.interimResults=true;base=tx.value?tx.value.replace(/\s*$/,' '):'';
  r.onresult=function(e){var t='';for(var i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;tx.value=base+t;chk()};
  r.onend=function(){r=null;mic.classList.remove('rec');ml.textContent=D.mic};r.onerror=r.onend;
  try{r.start();mic.classList.add('rec');ml.textContent=D.micStop}catch(e){r=null}})}
}catch(e){}})();
</script>
(function(){var r=document.getElementById('strow');if(!r)return;var bs=document.querySelectorAll('.st-btn');
function st(){var m=r.scrollWidth-r.clientWidth-2;bs[0].disabled=r.scrollLeft<2;bs[1].disabled=r.scrollLeft>=m}
bs.forEach(function(b){b.addEventListener('click',function(){var c=r.querySelector('.st');r.scrollBy({left:(c.offsetWidth+16)*+b.dataset.d,behavior:'smooth'})})});
r.addEventListener('scroll',st,{passive:true});window.addEventListener('resize',st);st()})();
