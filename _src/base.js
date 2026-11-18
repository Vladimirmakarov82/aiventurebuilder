<script>
(function(){
  var NS='http://www.w3.org/2000/svg',R=document.documentElement;
  var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  var G=window.gsap,ST=window.ScrollTrigger,SPL=window.SplitText,still=reduce;if(still)R.classList.add('still');
  function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e}
  function $(id){return document.getElementById(id)}
  var vis={},io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){vis[e.target.id]=e.isIntersecting})},{rootMargin:'200px'}):null;
  function on(id){return vis[id]!==false}

  
  (function(){var s=document.querySelector('.bx-stage');function f(){if(s)s.style.setProperty('--w',(s.clientWidth+20)+'px')}f();addEventListener('resize',f)})();
  /* TRAJECTORY */
  var tL=$('tLine'),tLen=tL?tL.getTotalLength():0,comet=$('tComet');
  if(tL)for(var gv=0;gv<=500;gv+=125){var gyy=440-gv/550*390;el('line',{x1:40,y1:gyy,x2:620,y2:gyy,stroke:'var(--line)'},$('tgrid'))}
  function traj(t){if(!tL)return;var k=(t%4200)/4200,e=1-Math.pow(1-k,3),pt=tL.getPointAtLength(e*tLen);comet.setAttribute('cx',pt.x);comet.setAttribute('cy',pt.y);comet.setAttribute('opacity',k<.9?1:(1-k)*10)}
  traj(0);

  /* TAIL: pareto explainer */
  var TB=$('tbars'),NB=48,BARS=[],BX0=34,BW=(688-34)/NB;
  for(var bi=0;bi<NB;bi++){var vv=1/Math.pow(bi+1,.85),hh=Math.max(7,vv*290);BARS.push({h:hh,r:el('rect',{x:(BX0+(NB-1-bi)*BW).toFixed(1),width:(BW-3).toFixed(1),rx:2.5,y:340,height:0},TB),core:bi<10})}
  var TX={visa:{core:'Corporate clients, agencies',tail:'Individual travelers',ex:'<b>Visas.</b> Corporate clients and agencies are the core, large visa centers serve them. An individual traveler with one visa is the tail: a manual consultation eats the whole ticket. An AI agent serves such a client almost for free.'},
          mast:{core:'Large publishers',tail:'Thousands of small websites',ex:'<b>MAST.</b> Large publishers are the core, they have their own managers in ad networks. Thousands of small websites are the tail: a manager for each site does not pay off. AI agents connect and set up monetization with no people.'}};
  var tex='visa';
  function setTX(x){tex=x;$('tcoreN').textContent=TX[x].core;$('ttailN').textContent=TX[x].tail;$('tlex').innerHTML=TX[x].ex;
    document.querySelectorAll('.tl-seg button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.x===x))})}
  setTX('visa');
  document.querySelectorAll('.tl-seg button').forEach(function(b){b.addEventListener('click',function(){setTX(b.dataset.x)})});
  var steps=[].slice.call(document.querySelectorAll('.tl-steps li')),tcost=$('tcost'),tcostT=$('tcostT'),tcore=$('tcore'),ttail=$('ttail'),tsum=$('tsum');
  function sm(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)}
  function tail(t,full){var T=full?11:(t%12000)/1000;
    var grow=sm(0,1.4,T),costIn=sm(3.6,4.2,T),drop=sm(6.4,7.6,T),light=sm(7.4,9.4,T),outF=full?1:1-sm(11.4,12,T);
    var costH=60-50*drop,costY=340-costH;
    BARS.forEach(function(b,i){var h=b.h*sm(i*.02,i*.02+.9,grow*1.9),y=340-h;b.r.setAttribute('y',y.toFixed(1));b.r.setAttribute('height',h.toFixed(1));
      var col,op=1;if(b.core){col='#F3F4F2'}else{var below=b.h<60;var li=sm(i/NB-.2,i/NB+.05,light);
        if(li>0){col='#FF4D00';op=.35+.65*li}else{col='#F3F4F2';op=(costIn>0&&below)?.18+.27*(1-costIn):.45}}
      b.r.setAttribute('fill',col);b.r.setAttribute('fill-opacity',(op*outF).toFixed(2))});
    tcost.setAttribute('y1',costY);tcost.setAttribute('y2',costY);tcost.style.opacity=costIn*outF;
    tcostT.setAttribute('y',costY-8);tcostT.textContent=drop>.5?'COST OF SERVICE · AI AGENTS':'COST OF SERVICE · PEOPLE';tcostT.style.opacity=costIn*outF;tcostT.setAttribute('fill',drop>.5?'#FF4D00':'#F3F4F2');
    tcore.setAttribute('transform','translate(0 '+(340-290-14)+')');tcore.style.opacity=sm(1.4,2,T)*outF;
    ttail.setAttribute('transform','translate(0 '+(340-120)+')');ttail.style.opacity=sm(3.4,4,T)*outF;
    tsum.style.opacity=sm(8.6,9.4,T)*outF;tsum.setAttribute('y',300-10*sm(8.6,9.4,T));
    var s=T<3.4?1:T<6.4?2:3;if(full)s=3;steps.forEach(function(li){li.classList.toggle('on',+li.dataset.s===s)})}
  tail(0,true);

  /* FOCUS: wall + pulse */
  for(var r=0;r<5;r++)for(var c=0;c<3;c++)el('rect',{x:220+c*38,y:20+r*26,width:34,height:22,rx:4},$('bricks'));
  var runner=$('runner');
  function wall(t){var k=(t%3600)/3600,x,y;if(k<=.55){var a=k/.55;x=20+a*178;y=120-Math.sin(a*Math.PI)*28}else{var b=(k-.55)/.45;x=198-b*40;y=120-Math.sin(b*Math.PI)*16}runner.setAttribute('cx',x);runner.setAttribute('cy',y)}
  wall(1800);
  var pulse=$('pulse'),pdot=$('pdot');
  function pul(t){var d='',w=260,off=t*.08,ly=0;for(var x=0;x<=w;x+=4){var u=(x+off)%130,v=60;
      if(u>50&&u<58)v=60-(u-50)*6;else if(u>=58&&u<66)v=12+(u-58)*11;else if(u>=66&&u<72)v=100-(u-66)*7;
      v=v*.7-x*.1+30;d+=(x?'L':'M')+x+' '+v.toFixed(1);ly=v}
    pulse.setAttribute('d',d);pdot.setAttribute('cy',ly)}
  pul(0);

  /* BEFORE/AFTER */
  var X0=50,X1=670,Y0=300,H=250;
  function px(m){return X0+(X1-X0)*m/24}function py(v){return Y0-v*H}
  function revB(m){return .08+.011*m}function riskB(m){return .035*Math.exp(m/8)}
  function revA(m){return m<4?.08+.011*m:.124+Math.pow(m-4,1.62)*.0058}function riskA(m){return .035+.0055*m}
  var ax=$('axes');el('line',{x1:X0,y1:Y0,x2:X1,y2:Y0,stroke:'var(--ink)','stroke-opacity':.4},ax);
  [0,6,12,18,24].forEach(function(m){el('line',{x1:px(m),y1:30,x2:px(m),y2:Y0,stroke:'var(--line)'},ax);el('text',{x:px(m),y:Y0+26,'text-anchor':'middle',class:'svgl',fill:'var(--mute)'},ax).textContent=m?m+' MO':'START'});
  var K={k:0};
  function draw(){var k=K.k,rv='',rk='';
    for(var m=0;m<=24;m+=.5){var a=revB(m)*(1-k)+revA(m)*k,b=Math.min(.98,riskB(m)*(1-k)+riskA(m)*k);
      rv+=(m?'L':'M')+px(m).toFixed(1)+' '+py(a).toFixed(1);rk+=(m?'L':'M')+px(m).toFixed(1)+' '+py(b).toFixed(1)}
    $('revL').setAttribute('d',rv);$('riskL').setAttribute('d',rk);$('riskA').setAttribute('d',rk+'L'+px(24)+' '+Y0+'L'+px(0)+' '+Y0+'Z');
    var re=revB(24)*(1-k)+revA(24)*k,ri=Math.min(.98,riskB(24)*(1-k)+riskA(24)*k);
    $('revT').setAttribute('x',X1);$('revT').setAttribute('y',py(re)+(k>.5?-14:22));$('riskT').setAttribute('x',X1);$('riskT').setAttribute('y',py(ri)+(k>.5?22:-12));
    var cm=15.4;$('crossPt').setAttribute('transform','translate('+px(cm)+' '+py(revB(cm))+')');$('crossPt').style.opacity=Math.max(0,1-k*2.2);
    $('round').setAttribute('transform','translate('+px(4)+' '+py(revA(4))+')');$('round').style.opacity=Math.max(0,k*2-1)}
  draw();
  var SIDE=[
    {t:'Project before a venture builder',h:'Grows until competitors catch up',l:['Grows linearly, like a business in one location','Keeps a temporary lead over competitors','Zero chance in 2 years to sell a stake for $5M+ or to be bought by a market leader for tens of millions of dollars','Covers a small share of the market','Works without venture capital']},
    {t:'Project with a venture builder',h:'Gets a partner and AI-native processes',l:['100% focus on raising venture capital',{s:'AI-native investor processes:',u:['automatic traction updates to investors','the project in AngelList, PitchBook and dozens of other databases','auto-posting, video presentations, animations']}],g:true}];
  var side=$('side'),ba=$('ba'),cur=0,touched=false;
  function li(x){return typeof x==='string'?'<li>'+x+'</li>':'<li><span>'+x.s+'<ul>'+x.u.map(function(y){return '<li>'+y+'</li>'}).join('')+'</ul></span></li>'}
  function renderSide(v){var s=SIDE[v];side.innerHTML='<span class="t">'+s.t+'</span><h3>'+s.h+'</h3><ul>'+s.l.map(li).join('')+'</ul>'+(s.g?'<div class="goal"><span>Goal</span><b class="num">$300k+</b><span>round in 3–5 months</span></div>':'');
    ba.classList.toggle('on',v===1);document.querySelectorAll('#ba .seg button').forEach(function(b){b.setAttribute('aria-pressed',String(+b.dataset.v===v))})}
  function setV(v,user){if(user)touched=true;if(v===cur)return;cur=v;
    var go=function(){renderSide(v)};if(document.startViewTransition&&!still)document.startViewTransition(go);else go();
    if(G&&!still)G.to(K,{k:v,duration:1.3,ease:'expo.inOut',onUpdate:draw});else{K.k=v;draw()}}
  renderSide(0);
  document.querySelectorAll('#ba .seg button').forEach(function(b){b.addEventListener('click',function(){setV(+b.dataset.v,true)})});

  /* DEFENSE */
  var climb=$('climb'),sts=[].slice.call(document.querySelectorAll('.st')),path=[[30,160],[200,160],[230,110],[400,110],[430,50],[600,50]];
  function stairs(t){var k=(t%6000)/6000,seg=Math.min(5,k*6),i=Math.min(4,Math.floor(seg)),f=Math.min(1,seg-i),a=path[i],b=path[i+1];
    climb.setAttribute('cx',a[0]+(b[0]-a[0])*f);climb.setAttribute('cy',a[1]+(b[1]-a[1])*f);sts.forEach(function(r,j){r.setAttribute('fill-opacity',seg>j*2?1:.28)})}
  stairs(5999);

  if($('v2grid')){
  /* V2 VISA */
  var C={x:320,y:250},CT=[['JP',150,90],['GB',90,230],['US',130,390],['AE',300,430],['AU',500,400],['DE',550,240],['FR',480,90],['KR',320,60]];
  for(var gx=16;gx<640;gx+=32)for(var gy=20;gy<480;gy+=32){var dd=Math.hypot(gx-C.x,gy-C.y);if(dd<240&&dd>70)el('circle',{cx:gx,cy:gy,r:1.4,fill:'#fff','fill-opacity':.22},$('v2grid'))}
  var A2=[],c2=0,v2c=$('v2c');
  CT.forEach(function(c,i){var mx=(C.x+c[1])/2,my=(C.y+c[2])/2,nx=-(c[2]-C.y),ny=c[1]-C.x,qx=mx+nx*.22,qy=my+ny*.22;
    var pa=el('path',{d:'M'+C.x+' '+C.y+' Q'+qx.toFixed(1)+' '+qy.toFixed(1)+' '+c[1]+' '+c[2],fill:'none',stroke:'#fff','stroke-opacity':.35,'stroke-width':1.5,'stroke-dasharray':'3 6'},$('v2arcs'));
    var g=el('g',{transform:'translate('+c[1]+' '+c[2]+')'},$('v2nodes'));var bg=el('circle',{r:24,fill:'#fff','fill-opacity':.16,stroke:'#fff','stroke-opacity':.55},g);
    var t=el('text',{class:'svgl','text-anchor':'middle',dy:4,fill:'#fff'},g);t.textContent=c[0];
    A2.push({p:pa,L:pa.getTotalLength(),pl:el('circle',{r:5},$('v2planes')),k:i/8,bg:bg,t:t})});
  function v2(dt,t){A2.forEach(function(a){a.k+=dt*.00022;if(a.k>1){a.k-=1;c2++;v2c.textContent=c2;a.bg.setAttribute('fill-opacity',1);a.t.setAttribute('fill','#00A676');
        (function(a){setTimeout(function(){a.bg.setAttribute('fill-opacity',.16);a.t.setAttribute('fill','#fff')},800)})(a)}
      var pt=a.p.getPointAtLength(a.k*a.L);a.pl.setAttribute('cx',pt.x);a.pl.setAttribute('cy',pt.y);a.pl.setAttribute('opacity',Math.sin(Math.PI*a.k))});
    $('v2halo').setAttribute('r',56+8*Math.sin(t*.003))}
  v2(0,0);

  /* V3 MAST */
  var M3={x:330,y:200},TL=[],m3t=$('m3t'),m3p=$('m3p'),m3d=$('m3d'),m3c=$('m3c'),c3=0;
  for(var ty=0;ty<6;ty++)for(var tx2=0;tx2<5;tx2++){var x0=20+tx2*38,y0=82+ty*48;var r=el('rect',{x:x0,y:y0,width:30,height:36,rx:6,fill:'#0B0B0D','fill-opacity':.12},m3t);
    el('rect',{x:x0+5,y:y0+6,width:20,height:4,rx:2,fill:'#FFB800','fill-opacity':.0,class:'tb'},m3t);
    var pth=el('path',{d:'M'+(x0+30)+' '+(y0+18)+' C'+(x0+130)+' '+(y0+18)+','+(M3.x-110)+' '+M3.y+','+(M3.x-58)+' '+M3.y},m3p);TL.push({r:r,p:pth,L:pth.getTotalLength(),on:0})}
  var SSP=[['GOOGLE ADX',90],['AMAZON APS',150],['MICROSOFT ADS',210],['MAGNITE',270],['TABOOLA',330]],SP=[];
  SSP.forEach(function(s){var g=el('g',{transform:'translate(480 '+(s[1]-17)+')'},$('m3s'));var bg=el('rect',{width:140,height:34,rx:17,fill:'#0B0B0D'},g);el('text',{x:16,y:22,class:'svgl',fill:'#FFB800'},g).textContent=s[0];
    var pth=el('path',{d:'M'+(M3.x+58)+' '+M3.y+' C'+(M3.x+100)+' '+M3.y+',420 '+s[1]+',480 '+s[1]},m3p);SP.push({p:pth,L:pth.getTotalLength(),bg:bg})});
  var BR=[];for(var bi2=0;bi2<16;bi2++)BR.push(el('rect',{x:20+bi2*22,y:430,width:16,height:0,rx:3,fill:'#0B0B0D'},$('m3b')));
  var MD=[],mAcc=0,mHold=0;
  function v3(dt,t){mAcc+=dt;
    if(c3<TL.length&&mAcc>380){mAcc=0;var free=TL.filter(function(x){return !x.on});var tt=free[Math.floor(Math.random()*free.length)];tt.on=1;tt.r.setAttribute('fill-opacity',1);c3++;m3c.textContent=c3;
      MD.push({c:el('circle',{r:4},m3d),p:tt.p,L:tt.L,k:0,ph:0})}
    if(c3>=TL.length){mHold+=dt;if(mHold>2200){mHold=0;c3=0;TL.forEach(function(x){x.on=0;x.r.setAttribute('fill-opacity',.12)});m3c.textContent=0}}
    MD=MD.filter(function(o){o.k+=dt*(o.ph?.0016:.0012);if(o.k>=1){if(o.ph){o.c.remove();return false}var s=SP[Math.floor(Math.random()*SP.length)];o.ph=1;o.k=0;o.p=s.p;o.L=s.L;s.bg.setAttribute('fill','#E8222B');setTimeout(function(){s.bg.setAttribute('fill','#0B0B0D')},260)}
      var pt=o.p.getPointAtLength(o.k*o.L);o.c.setAttribute('cx',pt.x);o.c.setAttribute('cy',pt.y);return true});
    BR.forEach(function(b,i){var h=8+(c3/TL.length)*(18+i*5.2)*(0.85+0.15*Math.sin(t*.004+i));b.setAttribute('y',430-h);b.setAttribute('height',h)});
    $('m3halo').setAttribute('r',72+8*Math.sin(t*.003))}
  v3(0,0);


  }
  /* TICKER */
  var tr=$('tr'),tx=0,boost=0,lastY=scrollY;
  function tick(dt){var y=scrollY;boost+=(Math.min(40,Math.abs(y-lastY))*.08-boost)*.08;lastY=y;tx-=(.6+boost)*dt*.06;var w=tr.scrollWidth/2;if(w&&-tx>w)tx+=w;tr.style.transform='translateX('+tx+'px)'}

  ['traj','tailsvg','wallsvg','pulsesvg','chart','stsvg','v2','v3'].forEach(function(id){var e=$(id);if(e&&io)io.observe(e)});
  var last=0;
  function loop(t){var dt=Math.min(50,t-(last||t));last=t;
    if(!still){if(on('traj'))traj(t);if(on('tailsvg'))tail(t);if(on('wallsvg'))wall(t);if(on('pulsesvg'))pul(t);if(on('stsvg'))stairs(t);if(typeof v2=='function'&&on('v2'))v2(dt,t);if(typeof v3=='function'&&on('v3'))v3(dt,t);tick(dt)}
    requestAnimationFrame(loop)}
  requestAnimationFrame(loop);

  /* COUNTERS */
  function fmt(v,e){var dec=+(e.dataset.dec||0),n=v.toFixed(dec);n=n.replace(/^(\d+)/,function(m){return m.replace(/\B(?=(\d{3})+(?!\d))/g,',')});return (e.dataset.pre||'')+n+(e.dataset.suf||'')}
  function count(e){if(still||!G)return;var o={v:0},to=+e.dataset.to;G.to(o,{v:to,duration:1.4,ease:'expo.out',onUpdate:function(){e.textContent=fmt(o.v,e)},onComplete:function(){e.textContent=fmt(to,e)}})}

  /* GSAP */
  var lenis=null;
  if(G&&!reduce){
    try{G.registerPlugin(ST,SPL)}catch(e){}
    if(window.Lenis){try{lenis=new Lenis({lerp:.1});G.ticker.add(function(t){lenis.raf(t*1000)});G.ticker.lagSmoothing(0);ST&&lenis.on('scroll',ST.update)}catch(e){lenis=null}}
    var done=false;
    function heroIn(){if(done)return;done=true;
      try{var sp=new SPL($('h1'),{type:'words,chars'});G.from(sp.chars,{filter:'blur(12px)',autoAlpha:0,duration:.8,ease:'power2.out',stagger:{each:.04,from:'random'}})}catch(e){}
      G.from('.kick,.lead,.kpis',{y:18,autoAlpha:0,duration:.9,ease:'expo.out',stagger:.08,delay:.3});
      G.from('.bx',{y:30,autoAlpha:0,duration:1.1,ease:'expo.out',delay:.1});if(tL)G.fromTo(tL,{strokeDasharray:tLen,strokeDashoffset:tLen},{strokeDashoffset:0,duration:1.8,ease:'expo.inOut',delay:.4,onComplete:function(){tL.style.strokeDasharray='none'}});G.from('#tArea',{autoAlpha:0,duration:1.2,delay:1});G.from('.tc',{scale:.85,autoAlpha:0,duration:.8,ease:'back.out(1.6)',stagger:.35,delay:.9,transformOrigin:'50% 50%'});
      setTimeout(function(){document.querySelectorAll('.kpis .cu').forEach(count)},450)}
    if(document.fonts&&document.fonts.ready){document.fonts.ready.then(heroIn);setTimeout(heroIn,1200)}else heroIn();
    if(ST){
      if(SPL)document.querySelectorAll('.mask').forEach(function(e){ST.create({trigger:e,start:'top 115%',once:true,onEnter:function(){try{var s=SPL.create(e,{type:'lines',mask:'lines'});G.from(s.lines,{yPercent:110,duration:.8,ease:'expo.out',stagger:.08})}catch(x){}}})});
      document.querySelectorAll('.fc,.ba-chart,.ba-side,.def-viz').forEach(function(c,i){ST.create({trigger:c,start:'top 112%',once:true,onEnter:function(){G.from(c,{y:28,duration:1,ease:'expo.out',delay:(i%3)*.06,clearProps:'transform'})}})});
      document.querySelectorAll('.pj').forEach(function(c){ST.create({trigger:c,start:'top 110%',once:true,onEnter:function(){G.from(c,{clipPath:'inset(6% 3% 0% 3% round 36px)',duration:1.2,ease:'power3.inOut',clearProps:'clipPath'});G.from(c.querySelectorAll('.pj-l > *'),{y:24,duration:.9,ease:'expo.out',stagger:.07,delay:.2,clearProps:'transform'})}})});
      document.querySelectorAll('.pj .cu').forEach(function(e){ST.create({trigger:e,start:'top 95%',once:true,onEnter:function(){count(e)}})});
      
      ST.create({trigger:'#chart',start:'top 70%',once:true,onEnter:function(){var l=$('revL'),n=l.getTotalLength();G.fromTo(l,{strokeDasharray:n,strokeDashoffset:n},{strokeDashoffset:0,duration:1.4,ease:'expo.out',onComplete:function(){l.style.strokeDasharray='none'}});
        setTimeout(function(){if(!touched&&!still)setV(1)},2800)}});
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=document.querySelector(a.getAttribute('href'));if(!t)return;e.preventDefault();if(lenis&&!still)lenis.scrollTo(t,{offset:-70,duration:1.3});else t.scrollIntoView()})});

  var mb=$('motion');
  function setMotion(v){still=!v;R.classList.toggle('still',still);mb.setAttribute('aria-pressed',String(v));mb.lastChild.nodeValue='Motion: '+(v?'on':'off');
    if(G){v?G.globalTimeline.resume():G.globalTimeline.pause()}if(lenis){v?lenis.start():lenis.stop()}if(still){stairs(5999);tail(0,true)}}
  mb.addEventListener('click',function(){setMotion(still)});if(reduce)setMotion(false);

  var tg=$('tg'),tgc=$('tgc');
  tg.addEventListener('click',function(){var ok=function(){tgc.textContent='Copied';setTimeout(function(){tgc.textContent='Copy'},1600)};
    var sel=function(){var r=document.createRange();r.selectNodeContents(tg.querySelector('.h'));var s=getSelection();s.removeAllRanges();s.addRange(r);tgc.textContent='Selected'};
    try{navigator.clipboard.writeText('@vladimir82makarov').then(ok,sel)}catch(e){sel()}});
})();
</script>
