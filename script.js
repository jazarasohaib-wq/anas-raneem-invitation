(()=>{
const shell=document.getElementById('shell'),canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
const bar=document.getElementById('bar'),label=document.getElementById('holdLabel'),tap=document.getElementById('tapzone'),holdBtn=document.getElementById('holdButton'),audioBtn=document.getElementById('audio');
const details=document.getElementById('details'),mapWrap=document.getElementById('mapWrap');
let W=0,H=0,DPR=1,t=0,last=0,raf=0,holding=false,completed=false,px=.5,py=.58,muted=false,audioCtx=null,master=null,osc=[];
const TOTAL=39000,particles=[];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=x=>1-Math.pow(1-clamp(x),3);
const smooth=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
const lerp=(a,b,x)=>a+(b-a)*x;
const rgba=(hex,a)=>{const h=hex.replace('#','');const n=parseInt(h,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`};

function resize(){
  const r=shell.getBoundingClientRect();
  DPR=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;
  canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
  buildParticles();
}
function buildParticles(){
  particles.length=0;
  for(let i=0;i<95;i++)particles.push({x:Math.random(),y:Math.random(),r:.5+Math.random()*1.5,a:.08+Math.random()*.24,s:.2+Math.random()*.8});
}
function bg(){
  const g=ctx.createRadialGradient(W*(.25+.5*px),H*(.18+.38*py),10,W*.5,H*.5,Math.max(W,H)*.75);
  g.addColorStop(0,'#18272d');g.addColorStop(.35,'#0c1317');g.addColorStop(1,'#050607');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  particles.forEach((p,i)=>{const drift=Math.sin(t*.0004*p.s+i)*4;ctx.globalAlpha=p.a;ctx.fillStyle='#ead8ae';ctx.beginPath();ctx.arc(p.x*W+drift,p.y*H,p.r,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
}
function glow(x,y,r,a,color='#d7b777'){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,a));g.addColorStop(1,rgba(color,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function line(points,color,width=2,alpha=1){if(points.length<2)return;ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.stroke();ctx.globalAlpha=1}
function partial(points,p){const n=Math.max(2,Math.floor(points.length*clamp(p)));return points.slice(0,n)}

function thread(progress){
  const pts=[];const sx=W*.5,sy=H*.78,ex=lerp(W*.5,W*px,progress),ey=lerp(H*.7,H*py,progress);
  for(let i=0;i<=32;i++){const q=i/32;const wave=Math.sin(q*Math.PI*2+t*.0012)*8*(1-q);pts.push([lerp(sx,ex,q)+wave,lerp(sy,ey,q)-Math.sin(q*Math.PI)*80*progress])}
  glow(ex,ey,42,.18,'#d7b777');line(pts,'#e7c98f',2.1,.95);line(pts.map(p=>[p[0]+3,p[1]+1]),'#a96237',1,.55);
}
function door(p){
  const cx=W*.5,top=H*.18,ww=W*.56,hh=H*.47,r=ww*.5;ctx.save();ctx.translate(cx,0);ctx.strokeStyle='rgba(215,183,119,.24)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-ww/2,top+hh);ctx.lineTo(-ww/2,top+r);ctx.arc(0,top+r,r,Math.PI,0);ctx.lineTo(ww/2,top+hh);ctx.stroke();
  glow(0,top+hh*.62,ww*.75,.22*p,'#e6bc71');const open=105*ease(p);
  for(const side of[-1,1]){ctx.save();ctx.translate(side*ww/2,top+r);ctx.rotate(side*open*Math.PI/180);ctx.fillStyle='#132229';ctx.strokeStyle='rgba(215,183,119,.2)';ctx.beginPath();ctx.roundRect(side<0?0:-ww/2,-r,ww/2,hh,8);ctx.fill();ctx.stroke();ctx.restore();}
  ctx.restore();
}
function heart(p){
  const cx=W*.5,cy=H*.47,scale=Math.min(W,H)*.0135;
  const leftIn=[]; const rightIn=[];
  for(let i=0;i<=40;i++){
    const q=i/40;
    leftIn.push([lerp(W*.18,cx-18,q), lerp(H*.72,cy+42,q)-Math.sin(q*Math.PI)*40]);
    rightIn.push([lerp(W*.82,cx+18,q), lerp(H*.30,cy+42,q)+Math.sin(q*Math.PI)*32]);
  }
  const incoming=smooth(0,.45,p);
  line(partial(leftIn,incoming),'#aa6237',2.6,.96);
  line(partial(rightIn,incoming),'#efd7a5',2.1,.96);

  const pts=[];
  for(let i=0;i<=220;i++){
    const tt=(i/220)*Math.PI*2;
    const x=16*Math.pow(Math.sin(tt),3);
    const y=13*Math.cos(tt)-5*Math.cos(2*tt)-2*Math.cos(3*tt)-Math.cos(4*tt);
    pts.push([cx+x*scale, cy-y*scale]);
  }
  const heartP=smooth(.28,1,p);
  glow(cx,cy,90,.12*heartP,'#d7b777');
  line(partial(pts,heartP),'#f1d9a7',2.2,.95);
  line(partial(pts,heartP).map(p=>[p[0]+2,p[1]+1]),'#aa6237',1.1,.55);
}
function majlis(p){
  const cx=W*.5,cy=H*.58,r=Math.min(W,H)*.17;
  ctx.globalAlpha=p;ctx.strokeStyle='rgba(215,183,119,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<6;i++){const ang=-Math.PI*.2+i*Math.PI*.28;const q=clamp(p*1.6-i*.09);const x=cx+Math.cos(ang)*r*1.45,y=cy+Math.sin(ang)*r*1.45;ctx.globalAlpha=q;ctx.fillStyle='#1e2c31';ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.05)';ctx.stroke();}
  ctx.globalAlpha=p;ctx.strokeStyle='#caa76d';ctx.beginPath();ctx.roundRect(cx-17,cy-12,34,28,5);ctx.stroke();ctx.beginPath();ctx.arc(cx+21,cy,6,-Math.PI/2,Math.PI/2);ctx.stroke();
  for(let s=0;s<3;s++){ctx.globalAlpha=p*(1-s*.25);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.moveTo(cx-4+s*4,cy-18);ctx.bezierCurveTo(cx+8+s*4,cy-35,cx-10+s*4,cy-45,cx+2+s*4,cy-58);ctx.stroke();}
  ctx.globalAlpha=1;
}
function contract(p){
  const ww=W*.74,hh=H*.57,x=(W-ww)/2,y=H*.21;
  ctx.save();ctx.translate(W/2,H/2);ctx.rotate((1-p)*.16);ctx.scale(.78+.22*ease(p),.78+.22*ease(p));ctx.translate(-W/2,-H/2);
  ctx.globalAlpha=p;ctx.fillStyle='#eee2cb';ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=50;ctx.fillRect(x,y,ww,hh);ctx.shadowBlur=0;ctx.strokeStyle='rgba(80,55,30,.18)';ctx.strokeRect(x+10,y+10,ww-20,hh-20);ctx.globalAlpha=1;ctx.restore();
  const sp=smooth(.35,1,p);ctx.strokeStyle='#293630';ctx.lineWidth=2;ctx.lineCap='round';
  for(let k=0;k<2;k++){const bx=x+ww*(k?0.55:.12),by=y+hh*.78;ctx.beginPath();for(let i=0;i<35;i++){const q=i/34;if(q>sp)break;const xx=bx+q*ww*.27;const yy=by+Math.sin(q*16+k)*10*(1-q);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke();}
}
function fireworkBurst(cx,cy,p,delay=0,colorA='#efd7a5',colorB='#aa6237'){
  const q=clamp((p-delay)/(1-delay));
  if(q<=0)return;
  const trail=smooth(0,.35,q),burst=smooth(.18,1,q);
  const trailPts=[];
  for(let i=0;i<=28;i++){
    const u=i/28;
    trailPts.push([lerp(W*.5,cx,u)+Math.sin(u*Math.PI+t*.001+i)*6*(1-u), lerp(H*.84,cy,u)-Math.sin(u*Math.PI)*28]);
  }
  line(partial(trailPts,trail),colorB,2.2,.85);
  if(trail>.7) glow(cx,cy,34,.16*burst,colorA);
  const rays=16;
  for(let i=0;i<rays;i++){
    const ang=(Math.PI*2/rays)*i + delay*3;
    const len=(26+(i%3)*10)*(0.35+0.65*burst);
    const ex=cx+Math.cos(ang)*len, ey=cy+Math.sin(ang)*len;
    line([[cx,cy],[lerp(cx,ex,.58),lerp(cy,ey,.58)],[ex,ey]], i%2?colorA:colorB, i%2?1.8:1.4, .88*burst);
    ctx.globalAlpha=.65*burst; ctx.fillStyle=i%2?colorA:colorB; ctx.beginPath(); ctx.arc(ex,ey,1.8+(i%2)*.7,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
  }
}
function fireworks(p){
  fireworkBurst(W*.28,H*.34,p,.0,'#f1d9a7','#aa6237');
  fireworkBurst(W*.72,H*.27,p,.18,'#ffe7bc','#c78352');
  fireworkBurst(W*.52,H*.18,p,.34,'#f1d9a7','#aa6237');
  if(p>.45){
    for(let i=0;i<26;i++){
      const q=clamp((p-.45)/.55); const x=W*(.2+((i*37)%60)/100); const y=H*(.14+((i*29)%52)/100); const yy=y + Math.sin(t*.002+i)*3;
      ctx.globalAlpha=.12*q; ctx.fillStyle=i%2?'#efd7a5':'#aa6237'; ctx.beginPath(); ctx.arc(x,yy,1.4+(i%3)*.4,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    }
  }
}

function render(){
  ctx.clearRect(0,0,W,H);bg();
  const P=t/TOTAL;
  const th=smooth(.03,.18,P)*(1-smooth(.22,.29,P));
  const d=smooth(.14,.30,P)*(1-smooth(.34,.38,P));
  const h=smooth(.29,.45,P)*(1-smooth(.49,.53,P));
  const m=smooth(.47,.62,P)*(1-smooth(.67,.70,P));
  const c=smooth(.64,.79,P)*(1-smooth(.83,.86,P));
  const f=smooth(.80,1,P);
  if(th>0)thread(th); if(d>0)door(d); if(h>0)heart(h); if(m>0)majlis(m); if(c>0)contract(c); if(f>0)fireworks(f);
  bar.style.width=(P*100)+'%';
  document.getElementById('c0').classList.toggle('on',P<.12);
  document.getElementById('c1').classList.toggle('on',P<.12);
  document.getElementById('c2').classList.toggle('on',P<.12);
  document.getElementById('c3').classList.toggle('on',P>.32&&P<.50);
  document.getElementById('c4').classList.toggle('on',P>.48&&P<.67);
  document.getElementById('c5').classList.toggle('on',P>.66&&P<.84);
  document.getElementById('c6').classList.toggle('on',P>.86);
  details.classList.toggle('on',P>.92); mapWrap.classList.toggle('on',P>.94);
}
function startAudio(){
  if(audioCtx)return;
  try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();master=audioCtx.createGain();master.gain.value=.11;master.connect(audioCtx.destination);[[55,'sine',.035],[82.41,'sine',.018],[110,'triangle',.006]].forEach(([f,type,gain])=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=f;g.gain.value=gain;o.connect(g);g.connect(master);o.start();osc.push(o)})}catch(e){}
}
function setAudio(active){if(!master)return;master.gain.setTargetAtTime((active&&!muted)?.11:0,audioCtx.currentTime,.08)}
function updatePointer(e){
  if(!e||typeof e.clientX!=='number') return;
  const rect=shell.getBoundingClientRect();
  px=clamp((e.clientX-rect.left)/rect.width); py=clamp((e.clientY-rect.top)/rect.height);
}
function loop(now){
  if(!holding)return; if(!last)last=now; t+=now-last; last=now; if(t>TOTAL)t=TOTAL; render();
  if(t>=TOTAL){holding=false; completed=true; shell.classList.remove('holding'); shell.classList.add('completed'); label.textContent='اكتملت الحكاية'; holdBtn.disabled=true; tap.style.pointerEvents='none'; setAudio(false); render(); return;}
  raf=requestAnimationFrame(loop);
}
function down(e){
  e.preventDefault();
  if(completed||t>=TOTAL) return;
  updatePointer(e);
  if(e.currentTarget&&e.currentTarget.setPointerCapture&&e.pointerId!==undefined){try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}}
  startAudio(); holding=true; last=0; shell.classList.add('holding'); shell.classList.remove('paused-progress'); label.textContent='أنت تمسك خيط الحكاية…'; setAudio(true); if(navigator.vibrate)navigator.vibrate(12); raf=requestAnimationFrame(loop);
}
function up(){ if(!holding)return; holding=false; cancelAnimationFrame(raf); last=0; shell.classList.remove('holding'); shell.classList.add('paused-progress'); label.textContent='توقف الزمن — اضغط باستمرار لتكمل'; setAudio(false); render(); }
function bindHold(el){ el.addEventListener('pointerdown',down,{passive:false}); el.addEventListener('pointerup',up,{passive:false}); el.addEventListener('pointercancel',up,{passive:false}); el.addEventListener('lostpointercapture',up); }
bindHold(tap); bindHold(holdBtn);
holdBtn.addEventListener('contextmenu',e=>e.preventDefault());
tap.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')up()});
tap.addEventListener('pointermove',e=>updatePointer(e));
holdBtn.addEventListener('pointermove',e=>updatePointer(e));
audioBtn.addEventListener('click',e=>{e.stopPropagation();muted=!muted;audioBtn.textContent=muted?'×':'♪';setAudio(holding)});
const mapBtn=document.querySelector('.map-btn');
if(mapBtn){['pointerdown','pointerup','click'].forEach(type=>mapBtn.addEventListener(type,e=>e.stopPropagation()))}
window.addEventListener('resize',resize);resize();render();
})();
