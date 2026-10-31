(function(){
  var d=document,b=d.body,hd=d.querySelector('.hd');
  function sc(){hd&&hd.classList.toggle('on',window.scrollY>12)}sc();addEventListener('scroll',sc,{passive:true});
  var bt=d.querySelector('.bg-btn');
  function setMenu(o){b.classList.toggle('menu-on',o);if(bt){bt.setAttribute('aria-expanded',o);bt.setAttribute('aria-label',o?'Fechar menu':'Abrir menu')}}
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
