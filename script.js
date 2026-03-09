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
   NAV SCROLL
   ═══════════════════════════════════════════ */
var navEl=document.getElementById('nav');
addEventListener('scroll',function(){
  navEl.classList.toggle('scrolled',scrollY>60);
});

/* ═══════════════════════════════════════════
   BACKGROUND MUSIC — muted autoplay then unmute on first gesture
   ═══════════════════════════════════════════ */
(function(){
  var music=document.getElementById('bgMusic');
  var btn=document.getElementById('soundBtn');
  if(!music||!btn)return;
  music.volume=0.35;
  /* Start muted — browsers allow muted autoplay */
  music.muted=true;
  music.play().catch(function(){});
  /* Unmute on first user gesture (scroll/click/touch) */
  function unmute(){
    music.muted=false;
    if(music.paused)music.play().catch(function(){});
    window.removeEventListener('scroll',unmute);
    window.removeEventListener('click',unmute);
    window.removeEventListener('touchstart',unmute);
  }
  window.addEventListener('scroll',unmute,{passive:true});
  window.addEventListener('click',unmute);
  window.addEventListener('touchstart',unmute);
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    if(music.muted||music.paused){music.muted=false;music.play();btn.classList.remove('muted')}
    else{music.pause();btn.classList.add('muted')}
  });
})();

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
   MOON SECTION — THREE.JS SCENE
   ═══════════════════════════════════════════ */
(function(){
  var moonSection=document.querySelector('.moon-section');
  var wrap=document.getElementById('moon-canvas-wrap');
  if(!moonSection||!wrap||typeof THREE==='undefined')return;

  var W=320,H=320;
  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(40,1,.1,100);
  camera.position.z=3.2;

  var renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setSize(W,H);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);
  wrap.appendChild(renderer.domElement);

  /* LIGHTING */
  var ambient=new THREE.AmbientLight(0x222233,.3);
  scene.add(ambient);
  var dirLight=new THREE.DirectionalLight(0xfff8e8,.9);
  dirLight.position.set(-3,2,4);
  scene.add(dirLight);
  var rimLight=new THREE.DirectionalLight(0xc8d0e0,.25);
  rimLight.position.set(3,-1,-2);
  scene.add(rimLight);

  /* MOON SPHERE */
  var moonGeo=new THREE.SphereGeometry(1,64,64);
  var loader=new THREE.TextureLoader();
  var moonMat=new THREE.MeshStandardMaterial({
    color:0xdddde0,roughness:.85,metalness:.05,
    bumpScale:.015
  });
  var moon=new THREE.Mesh(moonGeo,moonMat);
  scene.add(moon);

  loader.load('assets/moon.jpg',function(tex){
    tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
    moonMat.map=tex;
    moonMat.bumpMap=tex;
    moonMat.needsUpdate=true;
  });

  /* GLOW SPHERE — additive */
  var glowGeo=new THREE.SphereGeometry(1.18,32,32);
  var glowMat=new THREE.ShaderMaterial({
    uniforms:{
      coeff:{value:0.12},
      power:{value:3.5},
      glowColor:{value:new THREE.Color(0xc8d0e8)},
      viewVector:{value:camera.position}
    },
    vertexShader:[
      'uniform float coeff;',
      'uniform float power;',
      'uniform vec3 viewVector;',
      'varying float intensity;',
      'void main(){',
      '  vec3 vNormal=normalize(normalMatrix*normal);',
      '  vec3 vNormel=normalize(normalMatrix*viewVector);',
      '  intensity=pow(coeff-dot(vNormal,vNormel),power);',
      '  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);',
      '}'
    ].join('\n'),
    fragmentShader:[
      'uniform vec3 glowColor;',
      'varying float intensity;',
      'void main(){',
      '  vec3 glow=glowColor*intensity;',
      '  gl_FragColor=vec4(glow,intensity*0.5);',
      '}'
    ].join('\n'),
    side:THREE.BackSide,
    blending:THREE.AdditiveBlending,
    transparent:true,
    depthWrite:false
  });
  var glow=new THREE.Mesh(glowGeo,glowMat);
  scene.add(glow);
  /* Second glow layer */
  var glow2Geo=new THREE.SphereGeometry(1.35,24,24);
  var glow2=new THREE.Mesh(glow2Geo,new THREE.MeshBasicMaterial({
    color:0xb0b8d0,transparent:true,opacity:.02,side:THREE.BackSide
  }));
  scene.add(glow2);

  /* ORBITING PARTICLES */
  var pCount=80;
  var pGeo=new THREE.BufferGeometry();
  var pPos=new Float32Array(pCount*3);
  var pVel=[];
  for(var i=0;i<pCount;i++){
    var theta=Math.random()*Math.PI*2;
    var phi=Math.acos(2*Math.random()-1);
    var r=1.3+Math.random()*.8;
    pPos[i*3]=r*Math.sin(phi)*Math.cos(theta);
    pPos[i*3+1]=r*Math.sin(phi)*Math.sin(theta);
    pPos[i*3+2]=r*Math.cos(phi);
    pVel.push({
      speed:.001+Math.random()*.003,
      axis:Math.random()>.5?'y':'x',
      offset:Math.random()*Math.PI*2
    });
  }
  pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
  var pMat=new THREE.PointsMaterial({
    color:0xe8e0d0,size:.018,transparent:true,
    opacity:.5,blending:THREE.AdditiveBlending,
    depthWrite:false
  });
  var points=new THREE.Points(pGeo,pMat);
  scene.add(points);

  /* MOUSE PARALLAX */
  var mouseX=0,mouseY=0;
  document.addEventListener('mousemove',function(e){
    mouseX=(e.clientX/innerWidth-.5)*.3;
    mouseY=(e.clientY/innerHeight-.5)*.3;
  });

  /* ANIMATION */
  var clock=new THREE.Clock();
  var isVisible=false;
  var opacity=0;

  function animate(){
    requestAnimationFrame(animate);
    var t=clock.getElapsedTime();

    /* Fade in */
    if(isVisible&&opacity<1)opacity=Math.min(1,opacity+.015);
    wrap.style.opacity=opacity;

    /* Moon rotation */
    moon.rotation.y=t*.03;
    moon.rotation.x=Math.sin(t*.01)*.05;

    /* Glow pulse */
    var pulse=1+Math.sin(t*.5)*.08;
    glow.scale.set(pulse,pulse,pulse);
    glow2.scale.set(pulse*.95,pulse*.95,pulse*.95);

    /* Light shift */
    dirLight.position.x=-3+Math.sin(t*.15)*.5;
    dirLight.position.y=2+Math.cos(t*.12)*.3;

    /* Particles orbit */
    var posArr=pGeo.attributes.position.array;
    for(var i=0;i<pCount;i++){
      var v=pVel[i];
      var angle=t*v.speed+v.offset;
      var x=posArr[i*3],y=posArr[i*3+1],z=posArr[i*3+2];
      if(v.axis==='y'){
        var cosA=Math.cos(v.speed);var sinA=Math.sin(v.speed);
        posArr[i*3]=x*cosA-z*sinA;
        posArr[i*3+2]=x*sinA+z*cosA;
      }else{
        var cosA=Math.cos(v.speed);var sinA=Math.sin(v.speed);
        posArr[i*3+1]=y*cosA-z*sinA;
        posArr[i*3+2]=y*sinA+z*cosA;
      }
    }
    pGeo.attributes.position.needsUpdate=true;
    pMat.opacity=.3+Math.sin(t*.7)*.15;

    /* Mouse parallax */
    camera.position.x+=(mouseX-camera.position.x)*.02;
    camera.position.y+=(-mouseY-camera.position.y)*.02;
    camera.lookAt(0,0,0);

    renderer.render(scene,camera);
  }
  animate();
  wrap.style.opacity=0;

  /* Scroll trigger */
  new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('moon-visible');
        isVisible=true;
      }
    });
  },{threshold:.2}).observe(moonSection);
})();

/* ═══════════════════════════════════════════
   VIDEO INTRO — SCROLL-DRIVEN CONVERGENCE
   ═══════════════════════════════════════════ */
(function(){
  var left=document.getElementById('introLeft');
  var right=document.getElementById('introRight');
  var spacer=document.getElementById('introSpacer');
  var flash=document.getElementById('introFlash');
  var sparksC=document.getElementById('sparks');
  var videoSection=document.querySelector('.video-intro');
  if(!left||!right||!spacer||!sparksC)return;
  var sCtx=sparksC.getContext('2d');
  var vw=window.innerWidth,vh=window.innerHeight;
  sparksC.width=vw;sparksC.height=vh;
  window.addEventListener('resize',function(){
    vw=window.innerWidth;vh=window.innerHeight;
    sparksC.width=vw;sparksC.height=vh;
  });

  /* Anvil SFX from file — 2 hits at ~0s and ~1s */
  var anvilSfx=document.getElementById('anvilSfx');
  var clangPlayed=false;
  function playAnvilHit(){
    if(clangPlayed||!anvilSfx)return;clangPlayed=true;
    anvilSfx.currentTime=0;
    anvilSfx.volume=0.6;
    anvilSfx.play().catch(function(){});
  }

  /* Incandescent spark particles */
  var sparks=[],sparkActive=false;
  function spawnSparks(cx,cy){
    sparkActive=true;
    for(var i=0;i<60;i++){
      var angle=Math.random()*Math.PI*2;
      var speed=1.5+Math.random()*8;
      var isEmber=Math.random()>.4;
      sparks.push({
        x:cx+Math.random()*40-20,y:cy+Math.random()*10-5,
        vx:Math.cos(angle)*speed*(isEmber?.6:1),
        vy:Math.sin(angle)*speed*(isEmber?.6:1)-1.5,
        life:isEmber?60+Math.random()*80:20+Math.random()*25,
        age:0,size:isEmber?1+Math.random()*2.5:2+Math.random()*3,
        r:isEmber?255:255,
        g:isEmber?140+Math.random()*80:220+Math.random()*35,
        b:isEmber?20+Math.random()*40:180+Math.random()*60,
        isEmber:isEmber
      });
    }
  }
  function drawSparks(){
    sCtx.clearRect(0,0,vw,vh);
    if(sparks.length===0){sparkActive=false;return}
    for(var i=sparks.length-1;i>=0;i--){
      var s=sparks[i];
      s.x+=s.vx;s.y+=s.vy;
      s.vy+=s.isEmber?0.04:0.12;
      s.vx*=s.isEmber?0.995:0.98;
      s.age++;
      if(s.age>=s.life){sparks.splice(i,1);continue}
      var a=1-s.age/s.life;
      var sz=s.size*(s.isEmber?a:a*a);
      /* Glow */
      sCtx.shadowBlur=s.isEmber?6:12;
      sCtx.shadowColor='rgba('+s.r+','+s.g+','+s.b+','+(a*.5)+')';
      sCtx.fillStyle='rgba('+s.r+','+s.g+','+s.b+','+a+')';
      sCtx.beginPath();
      sCtx.arc(s.x,s.y,sz,0,Math.PI*2);
      sCtx.fill();
    }
    sCtx.shadowBlur=0;
    if(sparks.length>0)requestAnimationFrame(drawSparks);
    else{sparkActive=false;sCtx.clearRect(0,0,vw,vh)}
  }

  /* Scroll-driven convergence */
  var converged=false;
  var convergeThr=0.50;
  var fadeThr=0.62;
  function onScroll(){
    var spacerRect=spacer.getBoundingClientRect();
    var spacerH=spacer.offsetHeight;
    var progress=Math.max(0,Math.min(1,-spacerRect.top/spacerH));
    var t=Math.min(1,progress/convergeThr);
    var ease=t<0.5?2*t*t:(1-Math.pow(-2*t+2,2)/2);
    /* Target: convergence at 60% viewport width to avoid video text overlap */
    var meetX=vw*0.6;
    var leftW=left.offsetWidth;
    var rightW=right.offsetWidth;
    var targetLeftX=meetX-leftW;
    var targetRightX=meetX;
    /* Horizontal animation */
    var lx=-leftW-50+(targetLeftX+leftW+50)*ease;
    var rx=vw+(targetRightX-vw)*ease;
    /* Vertical: left sits ABOVE line (-100%), right sits BELOW line (0%) */
    left.style.transform='translate('+lx+'px,-100%)';
    right.style.left=rx+'px';
    right.style.right='auto';
    right.style.transform='translate(0,0%)';

    /* Convergence trigger — double strike synced with anvil sound */
    if(ease>=0.98&&!converged){
      converged=true;
      left.classList.add('converged');
      right.classList.add('converged');
      playAnvilHit();
      var sparkY=vh*0.72;
      /* Hit — flash + sparks in same render frame */
      function strike(x,y){
        var wasActive=sparkActive;
        spawnSparks(x,y);
        requestAnimationFrame(function(){
          flash.style.opacity='1';
          if(!wasActive)drawSparks();
          setTimeout(function(){flash.style.opacity='0'},120);
        });
      }
      strike(meetX,sparkY);
      /* Hit 2 — 500ms later (synced with 2nd anvil hit) */
      setTimeout(function(){
        strike(meetX+Math.random()*30-15,sparkY+Math.random()*16-8);
      },600);
    }
    if(ease<0.85&&converged){
      converged=false;clangPlayed=false;
      left.classList.remove('converged');
      right.classList.remove('converged');
    }

    /* Video fade — darken overlay to full black, then hide */
    var introOv=document.querySelector('.intro-overlay');
    if(progress>fadeThr&&videoSection&&introOv){
      var fadeP=Math.min(1,(progress-fadeThr)/0.28);
      var fadeEase=fadeP<0.5?2*fadeP*fadeP:(1-Math.pow(-2*fadeP+2,2)/2);
      introOv.style.background='rgba(10,10,15,'+(0.3+fadeEase*0.7)+')';
      left.style.opacity=Math.max(0,1-fadeEase*1.5);
      right.style.opacity=Math.max(0,1-fadeEase*1.5);
      if(fadeEase>0.95){videoSection.classList.add('faded');videoSection.style.opacity=0}
      else{videoSection.classList.remove('faded');videoSection.style.opacity=1}
    }else if(videoSection){
      videoSection.style.opacity=1;videoSection.classList.remove('faded');
      if(document.querySelector('.intro-overlay'))document.querySelector('.intro-overlay').style.background='';
      left.style.opacity=1;right.style.opacity=1;
    }

    /* Hide scroll hint early */
    var hint=document.querySelector('.intro-scroll-hint');
    if(hint)hint.style.opacity=Math.max(0,1-progress*5);
  }
  window.addEventListener('scroll',function(){
    requestAnimationFrame(onScroll);
  },{passive:true});
  onScroll();
})();
