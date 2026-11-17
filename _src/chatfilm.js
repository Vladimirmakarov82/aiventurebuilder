<script>
/* Мини-фильм «Одна семья»: чат и доска задач, запуск в зоне видимости, пауза при выключенном движении */
(function(){try{
var D=window.__CF,R=document.documentElement,card=document.getElementById('chatfilm');if(!D||!card)return;
var box=document.getElementById('cfmsgs'),tasks=document.getElementById('cftasks'),bar=document.getElementById('cfbar'),bp=document.getElementById('cfp'),br=document.getElementById('cfr');
var LEN=30000,t=0,last=0,inView=false,user=null,fired={},TK=[];
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var EV=[];
D.msgs.forEach(function(m,i){EV.push({at:m.at-1100,f:function(){typing(m.who)}});EV.push({at:m.at,f:function(){msg(m)}})});
D.tasks.forEach(function(k,i){EV.push({at:D.tasksAt+i*350,f:function(){addTask(i)}});k.steps.forEach(function(s,j){EV.push({at:s.at,f:function(){step(i,j)}})})});
EV.sort(function(a,b){return a.at-b.at});
function typing(w){clearTy();var e=document.createElement('div');e.className='msg ty '+w;e.innerHTML='<i></i><i></i><i></i>';box.appendChild(e);requestAnimationFrame(function(){e.classList.add('in')});trim()}
function clearTy(){box.querySelectorAll('.ty').forEach(function(e){e.remove()})}
function msg(m){clearTy();var e=document.createElement('div');e.className='msg '+m.who;e.innerHTML='<span class="mono">'+m.meta+'</span>'+m.text;box.appendChild(e);requestAnimationFrame(function(){requestAnimationFrame(function(){e.classList.add('in')})});trim()}
function trim(){while(box.scrollHeight>box.clientHeight+2&&box.children.length>1)box.removeChild(box.firstChild)}
function addTask(i){var k=D.tasks[i],e=document.createElement('div');e.className='tk';
  e.innerHTML='<div class="tk-h"><b>'+k.name+'</b><span class="mono">'+D.started+'</span></div><div class="tk-s">'+k.steps.map(function(s){return '<span>'+s.label+'</span>'}).join('')+'</div>';
  tasks.appendChild(e);TK[i]=e;requestAnimationFrame(function(){requestAnimationFrame(function(){e.classList.add('in')})})}
function step(i,j){var e=TK[i];if(!e)return;var s=e.querySelectorAll('.tk-s span');s[j].classList.add('on');var k=D.tasks[i];
  e.querySelector('.tk-h .mono').textContent=j===k.steps.length-1?D.done:k.steps[j].label;if(j===k.steps.length-1)e.classList.add('done')}
function reset(){t=0;fired={};TK=[];box.innerHTML='';tasks.innerHTML=''}
function full(){reset();EV.forEach(function(ev,i){if(ev.f.toString().indexOf('typing')<0)ev.f()});clearTy();bar.style.width='100%'}
function run(){var r=user!==null?user:(!R.classList.contains('still')&&!reduce);return r&&inView&&!document.hidden}
function ui(){var p=run()||(user===true);bp.setAttribute('aria-pressed',String(p));bp.lastChild.nodeValue=p?D.playing:D.paused}
function loop(now){var dt=Math.min(60,now-(last||now));last=now;
  if(run()){t+=dt;EV.forEach(function(ev,i){if(!fired[i]&&t>=ev.at){fired[i]=1;ev.f()}});bar.style.width=Math.min(100,t/LEN*100)+'%';if(t>LEN){reset()}}
  requestAnimationFrame(loop)}
if(reduce)full();
if('IntersectionObserver' in window)new IntersectionObserver(function(es){es.forEach(function(e){inView=e.isIntersecting&&e.intersectionRatio>=.35;ui()})},{threshold:[0,.35,.6]}).observe(card);else inView=true;
new MutationObserver(ui).observe(R,{attributes:true,attributeFilter:['class']});
bp.addEventListener('click',function(){user=!(run());if(user&&reduce&&t===0)reset();ui()});
br.addEventListener('click',function(){reset();user=true;ui()});
requestAnimationFrame(loop);ui();
}catch(e){}})();
</script>
