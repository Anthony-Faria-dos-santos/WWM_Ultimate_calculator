/* ═══════════════════════════════════════════
   PARTICLE SYSTEM — Qi Energy + Ink Dust
   ═══════════════════════════════════════════ */
(function(){
  var c=document.getElementById('particles'),ctx=c.getContext('2d');
  var w,h,particles=[];
  function resize(){w=c.width=innerWidth;h=c.height=innerHeight}
  resize();addEventListener('resize',resize);
  function P(){this.reset()}
  P.prototype.reset=function(){
    this.x=Math.random()*w;this.y=Math.random()*h+h*.15;
    this.size=Math.random()*2.2+.4;
    this.vy=-(Math.random()*.18+.04);
    this.vx=(Math.random()-.5)*.25;
    this.life=Math.random()*220+80;this.age=0;
    this.wobble=Math.random()*Math.PI*2;
    this.wobbleSpd=Math.random()*.012+.002;
    var r=Math.random();
    this.hue=r>.82?'gold':r>.55?'dust':'jade';
  };
  P.prototype.update=function(){
    this.wobble+=this.wobbleSpd;
    this.x+=this.vx+Math.sin(this.wobble)*.15;
    this.y+=this.vy;
    this.age++;
    if(this.age>this.life||this.y<-10)this.reset();
  };
  P.prototype.draw=function(){
    var a=Math.sin(this.age/this.life*Math.PI)*.5;
    if(this.hue==='gold')ctx.fillStyle='rgba(212,165,84,'+a+')';
    else if(this.hue==='dust')ctx.fillStyle='rgba(200,195,185,'+(a*.25)+')';
    else ctx.fillStyle='rgba(78,205,196,'+(a*.15)+')';
    ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();
  };
  for(var i=0;i<70;i++)particles.push(new P());
  (function loop(){
    ctx.clearRect(0,0,w,h);
    for(var i=0;i<particles.length;i++){particles[i].update();particles[i].draw()}
    requestAnimationFrame(loop);
  })();
})();

/* ═══════════════════════════════════════════
   HERO PARALLAX + NAV
   ═══════════════════════════════════════════ */
var heroImg=document.getElementById('heroImg');
var navEl=document.getElementById('nav');
var ticking=false;
addEventListener('scroll',function(){
  if(!ticking){requestAnimationFrame(function(){
    var s=scrollY;
    if(heroImg)heroImg.style.transform='scale(1.05) translateY('+s*.12+'px)';
    navEl.classList.toggle('scrolled',s>50);
    ticking=false;
  });ticking=true}
});

/* ═══════════════════════════════════════════
   REVEAL ON SCROLL
   ═══════════════════════════════════════════ */
var revealObs=new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){
      e.target.classList.add('visible');
      var counters=e.target.querySelectorAll('[data-target]');
      for(var i=0;i<counters.length;i++){
        (function(el){
          var target=+el.dataset.target,suffix=el.dataset.suffix||'',cur=0;
          var step=Math.max(1,Math.ceil(target/45));
          var t=setInterval(function(){
            cur+=step;if(cur>=target){cur=target;clearInterval(t)}
            el.textContent=cur+suffix;
          },22);
        })(counters[i]);
      }
    }
  });
},{threshold:.1});
var reveals=document.querySelectorAll('.reveal');
for(var i=0;i<reveals.length;i++)revealObs.observe(reveals[i]);

/* ═══════════════════════════════════════════
   DPS RING ANIMATION
   ═══════════════════════════════════════════ */
var showcaseEl=document.querySelector('.showcase-frame');
if(showcaseEl){
  new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){var p=e.target.querySelector('.progress');if(p)p.style.strokeDashoffset='100'}
    });
  },{threshold:.25}).observe(showcaseEl);
}

/* ═══════════════════════════════════════════
   DUPLICATE MYSTIC TRACK FOR SEAMLESS LOOP
   ═══════════════════════════════════════════ */
var track=document.querySelector('.mystic-track');
if(track){track.innerHTML+=track.innerHTML}


/* ═══════════════════════════════════════════
   MOON SECTION — REVEAL ON SCROLL
   ═══════════════════════════════════════════ */
var moonSection=document.querySelector('.moon-section');
if(moonSection){
  new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting)e.target.classList.add('moon-visible');
    });
  },{threshold:.25}).observe(moonSection);
}
