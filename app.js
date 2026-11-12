/*
 * CONVOLUCIÓN CONTINUA — PRESENTACIÓN INTERACTIVA
 * JavaScript puro. Sin dependencias externas, sin solicitudes a Internet.
 * Fórmulas y gráficos calculados en tiempo real.
 */
'use strict';

const $ = (id) => document.getElementById(id);
const slides = Array.from(document.querySelectorAll('.slide'));
const colors = {cyan:'#57d9f5',pink:'#fa77bc',amber:'#ffcd7a',green:'#65d6af',grid:'#263952',label:'#8da3bf'};
const state = {
  slide:0, rectT:1.5, rectPlaying:false,
  exA:2, exB:1, exT:1.5,
  rcTau:1.4, rcT:2.2, rcPlaying:false,
  chD:2, chTau:0.7, quizIndex:0, quizSelected:null, quizScore:0,
  heroTime:0, lastFrame:0
};
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
const fixed = (n,d=2)=>Number(n).toFixed(d);
const step = t => t>=0?1:0;
const pulse = (t,width) => t>=0 && t<width?1:0;
const overlap = (t,a,b) => Math.max(0,Math.min(a,t)-Math.max(0,t-b));
const rcValue = (t,tau) => t>=0?1-Math.exp(-t/tau):0;
function channelValue(t,d,tau){return rcValue(t,tau)-rcValue(t-d,tau)}
function interval(t,a,b){
  const lo=Math.max(0,t-b),hi=Math.min(a,t);
  return hi>lo?[lo,hi]:null;
}

/* Canvas 2D: escalado para pantallas de alta densidad, ejes, muestreo y marcas. */
function getCanvas(id){
  const canvas=$(id);
  if(!canvas) return null;
  const rect=canvas.getBoundingClientRect();
  const w=rect.width,h=rect.height;
  if(w<30||h<30)return null;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const rw=Math.round(w*dpr),rh=Math.round(h*dpr);
  if(canvas.width!==rw||canvas.height!==rh){canvas.width=rw;canvas.height=rh}
  const ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  return {canvas,ctx,w,h};
}
function plot(id,{xMin=-1,xMax=4,yMin=-0.1,yMax=1.35,series=[],filled=[],band=[],marker=null,xLabel='t',yLabel='',regions=[]}={}){
  const target=getCanvas(id);if(!target)return;
  const {ctx,w,h}=target;
  const margin={left:w<370?38:43,right:12,top:17,bottom:34};
  const PW=w-margin.left-margin.right,PH=h-margin.top-margin.bottom;
  const xp=x=>margin.left+(x-xMin)/(xMax-xMin)*PW;
  const yp=y=>margin.top+(yMax-y)/(yMax-yMin)*PH;
  const originY=yp(0);
  ctx.save();ctx.beginPath();ctx.rect(margin.left,margin.top,PW,PH);ctx.clip();
  for(const r of regions){ctx.fillStyle=r.color;ctx.fillRect(xp(r.from),margin.top,xp(r.to)-xp(r.from),PH)}
  const xrange=xMax-xMin;
  const xStep=xrange>8?2:xrange>5?1:0.5;
  const yRange=yMax-yMin;
  const yStep=yRange>2.6?1:yRange>1.5?0.5:0.25;
  ctx.strokeStyle=colors.grid;ctx.lineWidth=1;ctx.setLineDash([3,5]);
  for(let x=Math.ceil(xMin/xStep)*xStep;x<=xMax+1e-6;x+=xStep){ctx.beginPath();ctx.moveTo(xp(x),margin.top);ctx.lineTo(xp(x),margin.top+PH);ctx.stroke()}
  for(let y=Math.ceil(yMin/yStep)*yStep;y<=yMax+1e-6;y+=yStep){ctx.beginPath();ctx.moveTo(margin.left,yp(y));ctx.lineTo(margin.left+PW,yp(y));ctx.stroke()}
  ctx.setLineDash([]);
  if(0>=yMin&&0<=yMax){ctx.strokeStyle='#708099';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(margin.left,originY);ctx.lineTo(margin.left+PW,originY);ctx.stroke()}
  if(0>=xMin&&0<=xMax){ctx.strokeStyle='#5b6d86';ctx.beginPath();ctx.moveTo(xp(0),margin.top);ctx.lineTo(xp(0),margin.top+PH);ctx.stroke()}
  for(const area of filled){
    const start=clamp(area.from,xMin,xMax),end=clamp(area.to,xMin,xMax);
    if(end<=start)continue;
    ctx.beginPath();ctx.moveTo(xp(start),originY);
    const n=Math.max(2,Math.ceil(PW*(end-start)/xrange/3));
    for(let k=0;k<=n;k++){
      const x=start+(end-start)*k/n;
      ctx.lineTo(xp(x),yp(area.fn(x)));
    }
    ctx.lineTo(xp(end),originY);ctx.closePath();ctx.fillStyle=area.color||'#65d6af44';ctx.fill();
  }
  for(const s of series){
    const fn=s.fn, count=Math.max(350,Math.floor(PW*1.7));
    ctx.beginPath();
    for(let i=0;i<=count;i++){
      const x=xMin+(xMax-xMin)*i/count,y=clamp(fn(x),yMin-1,yMax+1);
      if(i===0)ctx.moveTo(xp(x),yp(y));else ctx.lineTo(xp(x),yp(y));
    }
    ctx.strokeStyle=s.color||colors.cyan;ctx.lineWidth=s.lineWidth||2.8;
    ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
  }
  if(marker){
    const x=clamp(marker.x,xMin,xMax),y=clamp(marker.y,yMin,yMax);
    ctx.setLineDash([5,5]);ctx.strokeStyle=marker.color||'#b6d5f5';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(xp(x),margin.top);ctx.lineTo(xp(x),margin.top+PH);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(xp(x),yp(y),5.4,0,2*Math.PI);ctx.fillStyle=marker.color||colors.amber;ctx.fill();ctx.strokeStyle='#eafaff';ctx.lineWidth=2;ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle=colors.label;ctx.font='10px system-ui,sans-serif';ctx.textAlign='center';
  for(let x=Math.ceil(xMin/xStep)*xStep;x<=xMax+1e-6;x+=xStep){
    if(xp(x)<margin.left+6||xp(x)>w-margin.right-5)continue;
    const val=Math.abs(x)<1e-7?'0':Number(x.toFixed(2)).toString();
    ctx.fillText(val,xp(x),h-17);
  }
  ctx.textAlign='right';
  for(let y=Math.ceil(yMin/yStep)*yStep;y<=yMax+1e-6;y+=yStep){
    if(yp(y)<margin.top+8||yp(y)>h-margin.bottom-6)continue;
    ctx.fillText(Math.abs(y)<1e-7?'0':Number(y.toFixed(2)).toString(),margin.left-9,yp(y)+3);
  }
  ctx.textAlign='right';ctx.fillStyle='#b6c6da';ctx.font='italic 12px Georgia,serif';ctx.fillText(xLabel,w-5,h-5);
  if(yLabel){ctx.textAlign='left';ctx.fillText(yLabel,5,12)}
}

function renderHero(){
  const cv=getCanvas('heroCanvas');if(!cv)return;
  const {ctx,w,h}=cv;
  const t=state.heroTime;
  const base=14,rows=3,rowH=(h-18)/3;
  const width=w-53;
  function curve(fn,row,color,name){
    const top=base+row*rowH,zero=top+rowH*.74;
    ctx.strokeStyle='#344862';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(35,zero);ctx.lineTo(w-8,zero);ctx.stroke();
    ctx.font='bold 13px Georgia,serif';ctx.fillStyle=color;ctx.fillText(name,5,top+17);
    ctx.beginPath();
    for(let i=0;i<=240;i++){
      const u=-0.7+4.5*i/240;
      const x=35+width*i/240,y=zero-fn(u)*rowH*.51;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
  }
  const shift=1.6+1.3*Math.sin(t*.7);
  curve(u=>pulse(u,2),0,colors.cyan,'x');
  curve(u=>pulse(shift-u,1),1,colors.pink,'h');
  curve(u=>overlap(u,2,1),2,colors.amber,'y');
  ctx.font='11px system-ui,sans-serif';ctx.fillStyle='#869db9';ctx.fillText('τ →',w-42,h-4);
  const xMarker=35+width*clamp((shift+.7)/4.5,0,1);
  const zero=base+2*rowH+rowH*.74;
  ctx.setLineDash([4,5]);ctx.strokeStyle='#ffcd7a77';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(xMarker,base+2*rowH-4);ctx.lineTo(xMarker,zero);ctx.stroke();ctx.setLineDash([]);
}
function renderRect(){
  const t=state.rectT;
  $('rectTimeText').textContent=fixed(t);
  $('rectTime').value=t;
  const r=interval(t,2,1);
  $('rectValue').textContent=fixed(overlap(t,2,1));
  $('rectInterval').textContent=r?`[${fixed(r[0])}, ${fixed(r[1])}]`:'∅ (no hay solapamiento)';
  let message;
  if(t<=0)message='Todavía no hay intersección: el área y la salida son cero.';
  else if(t<1)message='La región común aumenta. El área es igual al tiempo t.';
  else if(t<=2)message='El pulso más corto está totalmente cubierto. El área vale 1.';
  else if(t<3)message='La región común disminuye. El área es 3 − t.';
  else message='Los pulsos ya no se tocan. La salida vuelve a cero.';
  $('rectExplanation').textContent=message;
  plot('rectOverlap',{xMin:-1,xMax:4,yMin:-0.12,yMax:1.32,xLabel:'τ',series:[
    {fn:u=>pulse(u,2),color:colors.cyan},
    {fn:u=>pulse(t-u,1),color:colors.pink}],
    filled:r?[{from:r[0],to:r[1],fn:()=>1,color:'#6bdfb94d'}]:[]});
  plot('rectProduct',{xMin:-1,xMax:4,yMin:-0.12,yMax:1.32,xLabel:'τ',
    filled:r?[{from:r[0],to:r[1],fn:()=>1,color:'#65d6af77'}]:[],series:[{fn:u=>pulse(u,2)*pulse(t-u,1),color:colors.green}]});
  plot('rectOutput',{xMin:-1,xMax:4,yMin:-0.1,yMax:1.32,series:[{fn:u=>overlap(u,2,1),color:colors.amber}],marker:{x:t,y:overlap(t,2,1),color:colors.amber}});
  $('rectPlay').textContent=state.rectPlaying?'❚❚ Pausar':'▶ Reproducir';
  $('rectPlay').setAttribute('aria-pressed',String(state.rectPlaying));
}
function renderAnalytic(){
  plot('analyticCanvas',{xMin:-.6,xMax:3.65,yMin:-.12,yMax:1.35,series:[{fn:u=>overlap(u,2,1),color:colors.amber,lineWidth:4}],
    regions:[{from:0,to:1,color:'#57d9f50b'},{from:1,to:2,color:'#65d6af12'},{from:2,to:3,color:'#ffcd7a0b'}],
    filled:[{from:0,to:3,fn:u=>overlap(u,2,1),color:'#ffcd7a23'}]});
}
function renderExplore(){
  const {exA:a,exB:b,exT:t}=state;
  $('widthAText').textContent=fixed(a,1);$('widthBText').textContent=fixed(b,1);
  $('exploreTimeText').textContent=fixed(t);
  $('exploreY').textContent=fixed(overlap(t,a,b));
  $('exploreMax').textContent=fixed(Math.min(a,b));
  $('exploreSupport').textContent=`${fixed(a+b)} s`;
  $('widthA').value=a;$('widthB').value=b;
  const tInput=$('exploreTime');tInput.max=fixed(a+b+.5);tInput.value=t;
  const xMax=Math.max(4,a+b+.6),xMin=-.6;
  const r=interval(t,a,b);
  plot('exploreOverlap',{xMin,xMax,yMin:-.12,yMax:1.32,xLabel:'τ',series:[{fn:u=>pulse(u,a),color:colors.cyan},{fn:u=>pulse(t-u,b),color:colors.pink}],filled:r?[{from:r[0],to:r[1],fn:()=>1,color:'#65d6af65'}]:[]});
  const maxY=Math.max(1,Math.min(a,b))*1.13+.12;
  plot('exploreOutput',{xMin,xMax,yMin:-.1,yMax:maxY,series:[{fn:u=>overlap(u,a,b),color:colors.amber,lineWidth:3.3}],filled:[{from:0,to:a+b,fn:u=>overlap(u,a,b),color:'#ffcd7a24'}],marker:{x:t,y:overlap(t,a,b),color:colors.amber}});
}
function renderRC(){
  const {rcT:t,rcTau:tau}=state;
  $('rcTauText').textContent=fixed(tau);$('rcTimeText').textContent=fixed(t);
  $('rcValue').textContent=fixed(rcValue(t,tau));
  $('rcTau').value=tau;$('rcTime').value=t;
  const h=u=>(t-u)>=0?Math.exp(-(t-u)/tau)/tau:0;
  const product=u=>step(u)*h(u);
  plot('rcProduct',{xMin:-.5,xMax:8.5,yMin:-.08,yMax:Math.max(1.2,1/tau+.17),xLabel:'τ',
    filled:[{from:0,to:t,fn:product,color:'#ffcd7a43'}],series:[
      {fn:step,color:colors.cyan,lineWidth:2.2},
      {fn:h,color:colors.pink,lineWidth:2.5},
      {fn:product,color:colors.amber,lineWidth:3.2}]});
  plot('rcOutput',{xMin:-.5,xMax:8.5,yMin:-.07,yMax:1.18,
    filled:[{from:0,to:8.5,fn:u=>rcValue(u,tau),color:'#ffcd7a18'}],
    series:[{fn:u=>rcValue(u,tau),color:colors.amber,lineWidth:3.2}],
    marker:{x:t,y:rcValue(t,tau),color:colors.amber}});
  $('rcPlay').textContent=state.rcPlaying?'❚❚ Pausar':'▶ Reproducir';
  $('rcPlay').setAttribute('aria-pressed',String(state.rcPlaying));
}
function renderChannel(){
  const {chD:d,chTau:tau}=state;
  $('chWidthText').textContent=fixed(d);$('chTauText').textContent=fixed(tau);
  $('channelPeak').textContent=fixed(channelValue(d,d,tau));
  $('chWidth').value=d;$('chTau').value=tau;
  plot('channelCanvas',{xMin:-.5,xMax:8,yMin:-.1,yMax:1.16,xLabel:'t (s)',
    filled:[{from:0,to:8,fn:u=>channelValue(u,d,tau),color:'#ffcd7a18'}],
    series:[{fn:u=>pulse(u,d),color:colors.cyan,lineWidth:2.8},{fn:u=>channelValue(u,d,tau),color:colors.amber,lineWidth:3.4}],
    marker:{x:d,y:channelValue(d,d,tau),color:colors.amber}});
}

const quizQuestions=[
  {t:.5,question:'¿Cuál es el valor de la convolución en t = 0,5 s?',options:['0','0,5','1'],answer:1,why:'El tramo común va de τ = 0 a τ = 0,5: su área es 0,5.'},
  {t:1.5,question:'¿Cuánto vale y(t) cuando t = 1,5 s?',options:['0,5','1','1,5'],answer:1,why:'El pulso de ancho 1 está totalmente dentro del de ancho 2; el área es 1.'},
  {t:2.5,question:'Al desplazarse a t = 2,5 s, ¿qué área queda?',options:['0','0,5','1'],answer:1,why:'La intersección abarca de τ = 1,5 a τ = 2: longitud 0,5.'}
];
function renderQuiz(){
  const q=quizQuestions[state.quizIndex];
  if(q){
    $('quizGraphTime').textContent=`t = ${fixed(q.t)} s`;
    $('quizProgress').textContent=`PREGUNTA ${state.quizIndex+1} DE ${quizQuestions.length}`;
    $('quizScore').textContent=`${state.quizScore} ${state.quizScore===1?'punto':'puntos'}`;
    $('quizQuestion').textContent=q.question;
    const container=$('quizOptions');container.innerHTML='';
    q.options.forEach((answer,i)=>{
      const btn=document.createElement('button');btn.type='button';btn.className='option-button';btn.textContent=answer;
      if(state.quizSelected!==null){
        btn.disabled=true;
        if(i===q.answer)btn.classList.add('correct');
        if(i===state.quizSelected&&i!==q.answer)btn.classList.add('incorrect');
      }
      btn.addEventListener('click',()=>chooseQuiz(i));container.appendChild(btn);
    });
    $('quizFeedback').textContent=state.quizSelected===null?'Selecciona una respuesta para comprobarla.':`${state.quizSelected===q.answer?'✓ ¡Correcto!':'↳ Respuesta correcta: '+q.options[q.answer]+'.'} ${q.why}`;
    $('quizNext').disabled=state.quizSelected===null;
    $('quizNext').textContent=state.quizIndex===quizQuestions.length-1?'Ver mi resultado →':'Siguiente pregunta →';
    plot('quizCanvas',{xMin:-.5,xMax:3.5,yMin:-.1,yMax:1.3,
      series:[{fn:t=>overlap(t,2,1),color:colors.amber,lineWidth:3.4}],
      marker:{x:q.t,y:overlap(q.t,2,1),color:colors.cyan}});
  }else{
    $('quizGraphTime').textContent='Reto completado';
    $('quizBox').innerHTML=`<div class="quiz-complete"><span class="panel-label">RESULTADO FINAL</span><div class="big-result">${state.quizScore} / 3</div><h3>${state.quizScore===3?'¡Dominas la intuición!':'Buen ejercicio de interpretación'}</h3><p>La clave es encontrar el intervalo donde coinciden ambos pulsos. El área de ese intervalo es y(t).</p><button id="quizRestart" type="button" class="btn btn-primary">Repetir preguntas ↻</button></div>`;
    $('quizRestart').addEventListener('click',()=>{state.quizIndex=0;state.quizScore=0;state.quizSelected=null;restoreQuizDOM();renderQuiz()});
    plot('quizCanvas',{xMin:-.5,xMax:3.5,yMin:-.1,yMax:1.3,series:[{fn:t=>overlap(t,2,1),color:colors.amber,lineWidth:3.4}]});
  }
}
function restoreQuizDOM(){
  $('quizBox').innerHTML='<div class="quiz-top"><span class="panel-label" id="quizProgress">PREGUNTA 1 DE 3</span><span class="quiz-score" id="quizScore">0 puntos</span></div><h3 id="quizQuestion"></h3><div id="quizOptions" class="quiz-options"></div><div id="quizFeedback" class="quiz-feedback" aria-live="polite"></div><button type="button" id="quizNext" class="btn btn-primary" disabled>Siguiente pregunta →</button>';
  $('quizNext').addEventListener('click',nextQuiz);
}
function chooseQuiz(i){
  if(state.quizSelected!==null)return;
  state.quizSelected=i;
  if(i===quizQuestions[state.quizIndex].answer)state.quizScore++;
  renderQuiz();
}
function nextQuiz(){if(state.quizSelected===null)return;state.quizIndex++;state.quizSelected=null;renderQuiz()}

const renderers={0:renderHero,3:renderRect,4:renderAnalytic,5:renderExplore,6:renderRC,7:renderChannel,9:renderQuiz};
function renderActive(){if(renderers[state.slide])renderers[state.slide]()}
function goto(index){
  const n=clamp(index,0,slides.length-1);
  if(state.slide===3&&n!==3)state.rectPlaying=false;
  if(state.slide===6&&n!==6)state.rcPlaying=false;
  state.slide=n;
  slides.forEach((s,i)=>{const active=i===n;s.classList.toggle('is-active',active);s.setAttribute('aria-hidden',String(!active))});
  $('currentSlide').textContent=String(n+1).padStart(2,'0');
  $('progressBar').style.width=`${(n+1)/slides.length*100}%`;
  $('prevBtn').disabled=n===0;$('nextBtn').disabled=n===slides.length-1;
  document.querySelectorAll('.step-dot').forEach((dot,i)=>{if(i===n)dot.setAttribute('aria-current','step');else dot.removeAttribute('aria-current')});
  if(n===0)history.replaceState(null,'','#inicio');else history.replaceState(null,'',`#diapositiva-${n+1}`);
  window.scrollTo({top:0,behavior:'instant'});
  window.requestAnimationFrame(renderActive);
}
function initNavigation(){
  $('totalSlides').textContent=String(slides.length).padStart(2,'0');
  for(let i=0;i<slides.length;i++){
    const dot=document.createElement('button');dot.className='step-dot';dot.type='button';
    dot.setAttribute('aria-label',`Ir a diapositiva ${i+1}: ${slides[i].dataset.title}`);
    dot.title=`${i+1}. ${slides[i].dataset.title}`;dot.addEventListener('click',()=>goto(i));$('stepDots').appendChild(dot);
  }
  $('prevBtn').addEventListener('click',()=>goto(state.slide-1));
  $('nextBtn').addEventListener('click',()=>goto(state.slide+1));
  document.querySelectorAll('[data-goto]').forEach(btn=>btn.addEventListener('click',()=>goto(Number(btn.dataset.goto))));
  $('homeLink').addEventListener('click',e=>{e.preventDefault();goto(0)});
  $('helpBtn').addEventListener('click',()=>$('helpDialog').showModal());
  $('closeHelp').addEventListener('click',()=>$('helpDialog').close());
  $('okHelp').addEventListener('click',()=>$('helpDialog').close());
  $('helpDialog').addEventListener('click',e=>{if(e.target===$('helpDialog'))$('helpDialog').close()});
  document.addEventListener('keydown',e=>{
    if($('helpDialog').open)return;
    const tag=e.target.tagName;
    if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(tag) || e.target.isContentEditable)return;
    if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();goto(state.slide+1)}
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();goto(state.slide-1)}
    else if(e.code==='Space'){
      e.preventDefault();
      if(state.slide===3){state.rectPlaying=!state.rectPlaying;renderRect()}
      else if(state.slide===6){state.rcPlaying=!state.rcPlaying;renderRC()}
      else goto(state.slide+1);
    }else if(e.key.toLowerCase()==='f'){
      if(!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});
      else if(document.exitFullscreen)document.exitFullscreen().catch(()=>{});
    }
  });
  let initial=0;
  const match=location.hash.match(/^#diapositiva-(\d+)$/);
  if(match)initial=Number(match[1])-1;
  goto(initial);
}
function bindControls(){
  $('rectTime').addEventListener('input',e=>{state.rectT=Number(e.target.value);renderRect()});
  $('rectPlay').addEventListener('click',()=>{state.rectPlaying=!state.rectPlaying;if(state.rectPlaying&&state.rectT>=3.95)state.rectT=-.9;renderRect()});
  $('rectReset').addEventListener('click',()=>{state.rectPlaying=false;state.rectT=1.5;renderRect()});
  function bindExplore(id,key){$(id).addEventListener('input',e=>{
    state[key]=Number(e.target.value);
    if(id==='widthA'||id==='widthB')state.exT=Math.min(state.exT,state.exA+state.exB+.5);
    renderExplore();
  })}
  bindExplore('widthA','exA');bindExplore('widthB','exB');bindExplore('exploreTime','exT');
  $('exploreReset').addEventListener('click',()=>{state.exA=2;state.exB=1;state.exT=1.5;renderExplore()});
  $('rcTau').addEventListener('input',e=>{state.rcTau=Number(e.target.value);renderRC()});
  $('rcTime').addEventListener('input',e=>{state.rcT=Number(e.target.value);renderRC()});
  $('rcPlay').addEventListener('click',()=>{state.rcPlaying=!state.rcPlaying;if(state.rcPlaying&&state.rcT>=7.95)state.rcT=0;renderRC()});
  $('rcReset').addEventListener('click',()=>{state.rcPlaying=false;state.rcT=2.2;state.rcTau=1.4;renderRC()});
  $('chWidth').addEventListener('input',e=>{state.chD=Number(e.target.value);renderChannel()});
  $('chTau').addEventListener('input',e=>{state.chTau=Number(e.target.value);renderChannel()});
  $('chReset').addEventListener('click',()=>{state.chD=2;state.chTau=.7;renderChannel()});
  $('quizNext').addEventListener('click',nextQuiz);
}
function animate(timestamp){
  const dt=state.lastFrame?Math.min((timestamp-state.lastFrame)/1000,.09):0;
  state.lastFrame=timestamp;
  if(state.slide===0){state.heroTime+=dt;renderHero()}
  if(state.slide===3&&state.rectPlaying){state.rectT+=dt*.85;if(state.rectT>4)state.rectT=-1;renderRect()}
  if(state.slide===6&&state.rcPlaying){state.rcT+=dt*1.25;if(state.rcT>8)state.rcT=0;renderRC()}
  requestAnimationFrame(animate);
}
function init(){
  bindControls();initNavigation();
  let resizeHandle=0;
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeHandle);resizeHandle=requestAnimationFrame(renderActive)});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){state.rectPlaying=false;state.rcPlaying=false}});
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){state.heroTime=1;}
  requestAnimationFrame(animate);
}
document.addEventListener('DOMContentLoaded',init);
