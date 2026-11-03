(function(){
  var d=document,b=d.body,hd=d.querySelector('.hd');
  function sc(){hd&&hd.classList.toggle('on',window.scrollY>12)}sc();addEventListener('scroll',sc,{passive:true});
  var bt=d.querySelector('.bg-btn');
  function setMenu(o){b.classList.toggle('menu-on',o);d.documentElement.classList.toggle('lock',o);if(bt){bt.setAttribute('aria-expanded',o);bt.setAttribute('aria-label',o?'Fechar menu':'Abrir menu')}}
  if(bt){bt.addEventListener('click',function(){setMenu(!b.classList.contains('menu-on'))});
    d.querySelectorAll('.mm a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
    addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)})}
  var rv=d.querySelectorAll('.rv');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});rv.forEach(function(el){io.observe(el)})}
  else rv.forEach(function(el){el.classList.add('in')});
  /* FAQ em acordeão, abre e fecha devagar */
  var ds=[].slice.call(d.querySelectorAll('details'));
  ds.forEach(function(el){var s=el.querySelector('summary'),c=el.querySelector('.fa');if(!s||!c)return;
    s.addEventListener('click',function(e){e.preventDefault();
      var open=el.hasAttribute('open');
      if(!open){ds.forEach(function(o){if(o!==el&&o.hasAttribute('open'))cl(o)});el.setAttribute('open','');c.style.height='0px';requestAnimationFrame(function(){c.style.transition='height .8s cubic-bezier(.19,1,.22,1)';c.style.height=c.scrollHeight+'px'})}
      else cl(el)});
    function cl(o){var f=o.querySelector('.fa');f.style.transition='height .7s cubic-bezier(.19,1,.22,1)';f.style.height=f.scrollHeight+'px';requestAnimationFrame(function(){f.style.height='0px'});setTimeout(function(){o.removeAttribute('open')},700)}
  });
})();

/* carrossel contínuo, infinito, arrastável (mouse e dedo) com inércia */
(function(){
  var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function marquee(root){
    var track=root.querySelector('.marquee__track');if(!track)return;
    var originals=[].slice.call(track.children);
    var speed=(reduced?0:Number(root.dataset.speed||34))*Number(root.dataset.direction||1);
    var setW=0,x=0,v=0,dragging=false,hovering=false,visible=true,startX=0,startPos=0,moved=0,lastX=0,lastT=0,pid=null,last=performance.now();
    function clone(n,hide){var c=n.cloneNode(true);c.setAttribute('data-clone','');if(hide){c.setAttribute('aria-hidden','true');c.querySelectorAll('a,button').forEach(function(f){f.tabIndex=-1})}return c}
    function measure(){var gap=parseFloat(getComputedStyle(track).columnGap)||0;return [].slice.call(track.children).reduce(function(w,n){return w+n.getBoundingClientRect().width+gap},0)}
    function build(){
      track.querySelectorAll('[data-clone]').forEach(function(n){n.remove()});
      var reps=0;while(measure()<root.clientWidth&&reps++<10)originals.forEach(function(n){track.appendChild(clone(n))});
      setW=measure();[].slice.call(track.children).forEach(function(n){track.appendChild(clone(n,true))});
    }
    function wrap(val){return ((val%setW)+setW)%setW}
    function frame(now){
      var dt=Math.min(.05,(now-last)/1000);last=now;
      if(!dragging&&visible){
        if(Math.abs(v)>4){x+=v*dt;v*=Math.pow(.04,dt)}
        else{v=0;if(!hovering)x+=speed*dt}
      }
      if(setW)track.style.transform='translate3d('+(-wrap(x))+'px,0,0)';
      requestAnimationFrame(frame);
    }
    root.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      dragging=true;moved=0;v=0;pid=e.pointerId;startX=lastX=e.clientX;startPos=x;lastT=performance.now();root.classList.add('is-dragging');
    });
    root.addEventListener('pointermove',function(e){
      if(!dragging||e.pointerId!==pid)return;
      var dx=e.clientX-startX;moved=Math.max(moved,Math.abs(dx));
      if(moved>4&&!root.hasPointerCapture(pid))try{root.setPointerCapture(pid)}catch(_){}
      x=startPos-dx;var t=performance.now(),d=(t-lastT)/1000;
      if(d>0)v=.8*(-(e.clientX-lastX)/d)+.2*v;lastX=e.clientX;lastT=t;
    });
    function end(e){
      if(!dragging||(e&&e.pointerId!==pid))return;
      dragging=false;root.classList.remove('is-dragging');
      if(performance.now()-lastT>80)v=0;v=Math.max(-2600,Math.min(2600,v));
    }
    root.addEventListener('pointerup',end);root.addEventListener('pointercancel',end);root.addEventListener('lostpointercapture',end);
    root.addEventListener('click',function(e){if(moved>6){e.preventDefault();e.stopPropagation()}},true);
    root.addEventListener('dragstart',function(e){e.preventDefault()});
    root.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')hovering=true});
    root.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')hovering=false});
    root.addEventListener('focusin',function(){hovering=true});root.addEventListener('focusout',function(){hovering=false});
    if('IntersectionObserver' in window)new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(root);
    build();
    var rw=root.clientWidth;
    if('ResizeObserver' in window)new ResizeObserver(function(){if(Math.abs(root.clientWidth-rw)>2){rw=root.clientWidth;var p=x/(setW||1);build();x=p*setW}}).observe(root);
    requestAnimationFrame(frame);
  }
  function start(){document.querySelectorAll('[data-marquee]').forEach(marquee)}
  (document.fonts&&document.fonts.ready)?document.fonts.ready.then(start):addEventListener('load',start);
})();

/* rolagem suave da roda do mouse, sem biblioteca. Solta o controle na hora se a pessoa
   pegar a barra lateral, clicar, usar o teclado ou o navegador mover a página por outro motivo. */
(function () {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement, alvoY = 0, posY = 0, escrito = 0, anima = false, antes = 0;
  function parar() { anima = false; }
  function temRolagemPropria(el) {
    for (; el && el !== document.body && el !== root && el.nodeType === 1; el = el.parentElement) {
      var o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return true;
    }
    return false;
  }
  function passo(t) {
    if (!anima) return;
    if (Math.abs(scrollY - escrito) > 3) { parar(); return; } /* outra coisa moveu a página */
    var dt = Math.min(t - antes, 50); antes = t;
    posY += (alvoY - posY) * (1 - Math.exp(-dt * .0062));
    if (Math.abs(alvoY - posY) < .6) posY = alvoY;
    scrollTo({ top: posY, behavior: 'instant' }); escrito = scrollY;
    if (posY === alvoY) { parar(); return; }
    requestAnimationFrame(passo);
  }
  addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || root.classList.contains('lock') || temRolagemPropria(e.target)) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
    e.preventDefault();
    if (!anima) { posY = alvoY = escrito = scrollY; antes = performance.now(); anima = true; requestAnimationFrame(passo); }
    alvoY = Math.max(0, Math.min(root.scrollHeight - innerHeight, alvoY + dy));
  }, { passive: false });
  ['mousedown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, parar, { passive: true }); });
})();
