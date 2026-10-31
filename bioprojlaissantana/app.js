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

  /* rolagem suave (Lenis) só no desktop com mouse; no celular fica a rolagem nativa */
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches,lenis=null;
  function lenisInit(){
    if(lenis||!fine||reduced||!window.Lenis)return;
    lenis=new Lenis({lerp:.085,wheelMultiplier:.95,smoothWheel:true});
    function raf(t){lenis.raf(t);requestAnimationFrame(raf)}requestAnimationFrame(raf);
    window.__lenis=lenis;
    var obs=new MutationObserver(function(){document.body.classList.contains('menu-on')?lenis.stop():lenis.start()});
    obs.observe(document.body,{attributes:true,attributeFilter:['class']});
  }
  if(window.Lenis)lenisInit();else addEventListener('load',lenisInit);
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href*="#"]');if(!a||!lenis)return;
    var u=new URL(a.href,location.href);if(u.pathname!==location.pathname||!u.hash||u.hash.length<2)return;
    var t=document.querySelector(u.hash);if(!t)return;e.preventDefault();
    var h=(document.querySelector('.hd')||{}).offsetHeight||0;lenis.scrollTo(t,{offset:-(h+8)});
  });
})();
