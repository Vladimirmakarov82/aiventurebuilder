<script>
/* Живая фавиконка: хаб агентов крутится во вкладке браузера */
(function(){try{
var S=64,c=document.createElement('canvas');c.width=c.height=S;var x=c.getContext('2d');if(!x)return;
var l=document.querySelector('link[rel="icon"]');if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l)}
var still=matchMedia('(prefers-reduced-motion: reduce)').matches,a=0,k=S/120;
function rr(){var r=28*k;x.beginPath();x.moveTo(r,0);x.arcTo(S,0,S,S,r);x.arcTo(S,S,0,S,r);x.arcTo(0,S,0,0,r);x.arcTo(0,0,S,0,r);x.closePath()}
function draw(){x.clearRect(0,0,S,S);rr();x.fillStyle='#FF4D00';x.fill();x.fillStyle='#fff';
 for(var i=0;i<6;i++){var t=a+i*Math.PI/3;x.beginPath();x.arc(S/2+38*k*Math.sin(t),S/2-38*k*Math.cos(t),7.5*k,0,7);x.fill()}
 var p=1+0.08*Math.sin(a*3);x.beginPath();x.arc(S/2,S/2,16*k*p,0,7);x.fill();
 l.type='image/png';l.href=c.toDataURL('image/png')}
draw();if(still)return;
setInterval(function(){a+=document.hidden?0.35:0.09;draw()},80);
document.addEventListener('visibilitychange',function(){draw()});
}catch(e){}})();
</script>
