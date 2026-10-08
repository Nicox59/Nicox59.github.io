import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const journey = document.querySelector('.sword-journey');
const stage = document.querySelector('.sword-stage');
const canvas = document.querySelector('#sword-canvas');
const status = document.querySelector('.journey-status');
const auraButton = document.querySelector('.aura-toggle');
const liteButton = document.querySelector('.lite-toggle');
const progressBar = document.querySelector('.journey-progress span');
const chapterNav = [...document.querySelectorAll('.journey-nav a')];
const chapterSections = [...document.querySelectorAll('.journey-content [data-chapter]')];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)');
const assetRoot = new URL(/* @vite-ignore */ '../sword/', import.meta.url);
// Rune centers measured in the user's strip, mapped to the blade's inlay.
const runeY = [2.154,1.487,.791,.106,-.733,-1.438,-2.209,-2.941,-3.863];
// Icon regions include the outer glow, VR earpieces, fingertips and cube edges
// in the supplied 69 x 587 strip, while excluding the outer circuit rails.
const iconBounds = [
  [14,18,59,70], [10,72,63,126], [10,127,62,178],
  [10,179,60,239], [9,240,63,301], [11,304,66,350],
  [11,351,60,417], [10,419,64,484], [10,485,61,555],
].map(([x0,y0,x1,y1])=>new THREE.Vector4(x0/69,y0/587,x1/69,y1/587));
const runeUniforms = {inlayReference:{value:null},runeProgress:{value:0},runeCenters:{value:new Float32Array(runeY)},runeIconBounds:{value:iconBounds}};
let renderer, scene, camera, sword, flames, sparks, environment;
let animationID = 0, loading, running = true, paused = false, lite = motion.matches;
let visible = true, failed = false, smoothProgress = 0, targetProgress = 0, lastTime = 0, effectTime = 0, currentChapter = -1;
let viewportWidth = 0, viewportHeight = 0;
const textureLoader = new THREE.TextureLoader();
const lookTarget = new THREE.Vector3();

function readProgress() {
  // Follow the real chapter positions, including wrapped text on short screens.
  const position = -chapterSections[0].getBoundingClientRect().top;
  let chapter = 0;
  while(chapter < chapterSections.length-1 && position >= chapterSections[chapter+1].offsetTop)chapter++;
  const start = chapterSections[chapter].offsetTop;
  const end = chapterSections[chapter+1]?.offsetTop ?? start+viewportHeight;
  targetProgress = Math.min(10,chapter+THREE.MathUtils.clamp((position-start)/Math.max(1,end-start),0,1));
  const progress = targetProgress/10;
  progressBar.style.width = `${progress*100}%`;
  const active = Math.min(9, Math.max(0, Math.round(targetProgress)));
  if (currentChapter !== active) {
    currentChapter = active;
    chapterNav.forEach((a,i) => {
      if (i === active) a.setAttribute('aria-current','true');
      else a.removeAttribute('aria-current');
    });
  }
}

function resize() {
  viewportWidth = stage.clientWidth;
  viewportHeight = stage.clientHeight;
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile.matches ? 1.35 : 1.75));
    renderer.setSize(viewportWidth, viewportHeight, false);
    camera.aspect = viewportWidth / viewportHeight;
    camera.updateProjectionMatrix();
  }
  readProgress();
}

function makeBlade(model, texture) {
  // Project the original reference strip into the EXISTING blade material. No covering
  // planes: the sword's surface, bevels, ornaments and pointed tip define the shape.
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  runeUniforms.inlayReference.value=texture;
  model.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.material.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,runeUniforms);
      shader.vertexShader=shader.vertexShader
        .replace('#include <common>','#include <common>\nvarying vec3 vRunePosition;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvRunePosition=position;');
      shader.fragmentShader=shader.fragmentShader
        .replace('#include <common>',`#include <common>
          varying vec3 vRunePosition;
          uniform sampler2D inlayReference;
          uniform float runeProgress;
          uniform float runeCenters[9];
          uniform vec4 runeIconBounds[9];
        `)
        .replace('#include <map_fragment>',`#include <map_fragment>
          // Raw GLB coordinates: X spans the blade, -Z runs toward the handle.
          float bladeY=-vRunePosition.z*10.-6.;
          float bladeX=vRunePosition.x*10.;
          float front=smoothstep(0.,.004,vRunePosition.y);
          // Feather into the original dark inlay, retaining its golden side details.
          // The lower end narrows and fades before the original tip jewel.
          float panelWidth=.43;
          panelWidth*=smoothstep(-4.75,-4.08,bladeY);
          panelWidth*=1.-.48*smoothstep(2.24,2.65,bladeY);
          float panel=(1.-smoothstep(max(0.,panelWidth-.055),panelWidth,abs(bladeX)));
          panel*=smoothstep(-4.75,-4.55,bladeY)*(1.-smoothstep(2.55,2.70,bladeY))*front;
          // Match the supplied crop to its higher-resolution region in reference.png.
          // Sample the original pixels directly; the uploaded strip stays unmodified.
          float stripU=clamp(bladeX/max(.002,2.*panelWidth)+.5,0.,1.);
          float stripV=clamp((2.70-bladeY)/7.45,0.,1.);
          vec2 imageUV=vec2((404.+stripU*125.)/941.,1.-(434.+stripV*1063.)/1672.);
          vec3 inlayColor=texture2D(inlayReference,imageUV).rgb;
          int runeSlot=0;
          float nearest=abs(bladeY-runeCenters[0]);
          for(int j=1;j<9;j++){
            float distanceToRune=abs(bladeY-runeCenters[j]);
            if(distanceToRune<nearest){nearest=distanceToRune;runeSlot=j;}
          }
          float slot=float(runeSlot);
          float runeHighlight=max(0.,1.-abs(runeProgress-(slot+1.)));
          vec4 iconBox=runeIconBounds[runeSlot];
          float iconRegion=smoothstep(iconBox.x,iconBox.x+.014,stripU)*(1.-smoothstep(iconBox.z-.014,iconBox.z,stripU));
          iconRegion*=smoothstep(iconBox.y,iconBox.y+.002,stripV)*(1.-smoothstep(iconBox.w-.002,iconBox.w,stripV));
          float cyanInk=smoothstep(.025,.10,inlayColor.b-max(inlayColor.r,inlayColor.g*.65));
          cyanInk*=smoothstep(.16,.42,inlayColor.b);
          float iconLightMask=iconRegion*cyanInk;
          // The overview shows every rune; each chapter then reveals its rune
          // cumulatively. Using scroll progress also reverses this on the way up.
          float overviewVisible=1.-smoothstep(.35,.90,runeProgress);
          float chapterVisible=smoothstep(slot+.65,slot+1.,runeProgress);
          float runeVisible=max(overviewVisible,chapterVisible);
          // Clear the stroke cores AND their dark halo inside the icon region.
          // Preserve any warm gold pixels; the side rails are outside the box.
          float goldInk=smoothstep(.04,.12,inlayColor.r-inlayColor.b)*smoothstep(.08,.20,inlayColor.r);
          float hiddenIcon=iconRegion*(1.-goldInk)*(1.-runeVisible);
          vec3 visibleInlay=mix(inlayColor,vec3(.001,.005,.012),hiddenIcon);
          diffuseColor.rgb=mix(diffuseColor.rgb,visibleInlay*.65,panel);
          diffuseColor.rgb=mix(diffuseColor.rgb,visibleInlay*(.20+runeHighlight*.40),panel*iconLightMask*runeVisible);
        `)
        .replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
          metalnessFactor=mix(metalnessFactor,0.,panel);
        `)
        .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
          roughnessFactor=mix(roughnessFactor,.9,panel);
        `)
        .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
          normal=normalize(mix(normal,nonPerturbedNormal,panel*hiddenIcon));
        `)
        .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
          // Decoration stays constant while revealed icons light up in turn.
          totalEmissiveRadiance+=visibleInlay*panel*(.90-iconLightMask*.60*runeVisible);
          totalEmissiveRadiance+=inlayColor*panel*iconLightMask*runeVisible*runeHighlight*1.4;
        `);
    };
    obj.material.customProgramCacheKey=()=> 'niar-surface-runes-v3-cumulative';
    obj.material.needsUpdate=true;
  });
}

function makeFlames() {
  const uniforms = {time:{value:0},strength:{value:1}};
  const material = new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform float strength;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      void main(){
        float y=vUv.y;
        float turbulence=noise(vec2(y*29.0-time*1.65,vUv.x*5.0-time*.4));
        turbulence+=.45*noise(vec2(y*63.0-time*3.2,vUv.x*9.));
        float tongue=.12+.45*pow(turbulence*.7,2.0);
        float flame=1.-smoothstep(tongue*.18,tongue,vUv.x);
        flame*=smoothstep(0.,.035,y)*smoothstep(1.,.91,y);
        float core=1.-smoothstep(.015,.12,vUv.x);
        vec3 color=mix(vec3(.02,.18,.9),vec3(.12,.74,1.),flame);
        color=mix(color,vec3(.60,.94,1.),core);
        gl_FragColor=vec4(color,flame*(.50+.18*sin(y*44.-time*5.))*strength);
      }
    `,
  });
  flames = new THREE.Group();
  flames.userData.uniforms = uniforms;
  const height=8.50, bottom=-5.7;
  // Two overlapping ribbons create flame tongues along each cutting edge, tapering at the tip.
  for (const side of [-1,1]) {
    const geometry = new THREE.PlaneGeometry(.96,height,1,90);
    const positions=geometry.attributes.position, uvs=geometry.attributes.uv;
    for (let i=0;i<positions.count;i++) {
      const y=positions.getY(i)+bottom+height/2;
      const edgeWidth=y<-4.10 ? Math.max(.025,.65*((y-bottom)/1.6)) : .65;
      const outward=uvs.getX(i)*.96;
      positions.setXYZ(i, side*(edgeWidth+outward), y, .07);
    }
    geometry.computeVertexNormals();
    flames.add(new THREE.Mesh(geometry,material));
  }
  sword.add(flames);
  const count=mobile.matches?55:100;
  const points=new Float32Array(count*3);
  for (let i=0;i<count;i++) {
    points[i*3]=(Math.random()<.5?-1:1)*(.65+Math.random()*1.1);
    points[i*3+1]=-5.5+Math.random()*8.5;
    points[i*3+2]=.08+Math.random()*.55;
  }
  const particleGeometry=new THREE.BufferGeometry();
  particleGeometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  sparks=new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0x6bdfff,size:.023,
    transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));
  sword.add(sparks);
}

async function initialize() {
  if (renderer || loading || failed) return loading;
  status.textContent='Cargando espada 3D…';
  loading=(async () => {
    try {
      renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
      renderer.setClearColor(0x000000,0);
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=.95;
      scene=new THREE.Scene();
      camera=new THREE.PerspectiveCamera(38,1,.05,100);
      scene.add(new THREE.HemisphereLight(0xb4dbff,0x182130,.8));
      const pmrem=new THREE.PMREMGenerator(renderer);
      const room=new RoomEnvironment();
      environment=pmrem.fromScene(room,.04);
      scene.environment=environment.texture;
      room.dispose();pmrem.dispose();
      for(const [color,intensity,x,y,z] of [[0xdaf3ff,1.5,4,7,7],[0x32bfff,1.8,-4,0,4],[0xffb86a,1,2,5,-3]]){
        const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);
      }
      resize();
      const gltf=await new GLTFLoader().loadAsync(new URL('sword.glb',assetRoot).href);
      sword=new THREE.Group();
      gltf.scene.scale.setScalar(10);
      gltf.scene.position.y=-6;
      gltf.scene.traverse(obj=>{
        if(obj.isMesh){
          obj.material.envMapIntensity=.55;
          obj.material.roughness=.52;
          obj.material.metalness=.68;
          obj.material.normalScale?.set(.4,.4);
          obj.material.specularColor?.set(0xffffff);
          if('specularIntensity' in obj.material)obj.material.specularIntensity=.4;
        }
      });
      sword.add(gltf.scene);scene.add(sword);
      const inlayTexture=await textureLoader.loadAsync(new URL('reference.png',assetRoot).href);
      makeBlade(gltf.scene,inlayTexture);makeFlames();
      smoothProgress=targetProgress;
      renderFrame(0);
      stage.classList.add('is-ready');
      canvas.dataset.ready='true';
      updateMode();schedule();
    } catch(error) {
      console.error('No se pudo iniciar el recorrido 3D:',error);
      failed=true;lite=true;
      releaseScene();
      stage.classList.remove('is-ready','is-loading');
      stage.classList.add('is-lite');
      status.textContent='Vista ligera · 3D no disponible';
      liteButton.textContent='Vista ligera';liteButton.setAttribute('aria-pressed','true');
      liteButton.disabled=true;auraButton.disabled=true;
    }
  })();
  return loading;
}

function renderFrame(dt) {
  if(!renderer || !sword || !flames || failed) return;
  const k=1-Math.exp(-dt*6);
  smoothProgress=dt ? THREE.MathUtils.lerp(smoothProgress,targetProgress,k) : targetProgress;
  const p=THREE.MathUtils.clamp(smoothProgress,0,10);
  const zoom=THREE.MathUtils.smoothstep(p,0,1)*(1-THREE.MathUtils.smoothstep(p,9,10));
  const position=THREE.MathUtils.clamp(p-1,0,8);
  const floor=Math.min(8,Math.floor(position));
  const focusY=THREE.MathUtils.lerp(runeY[floor],runeY[Math.min(8,floor+1)],position-floor);
  const compact=viewportWidth<=950 && viewportWidth>viewportHeight && viewportHeight<600;
  const isMobile=mobile.matches && !compact;
  // Fit the complete sword into the space above the copy in portrait layouts.
  const overviewCopy=document.querySelector(p<5?'.intro-copy':'.journey-outro .chapter-copy');
  const overviewSpace=Math.max(120,overviewCopy.offsetTop-82);
  const overviewDistance=isMobile?12.4*viewportHeight/(2*Math.tan(THREE.MathUtils.degToRad(19))*overviewSpace):21;
  const overviewY=isMobile?.15+(72+overviewSpace/2-viewportHeight/2)*12.4/overviewSpace:0;
  const distance=THREE.MathUtils.lerp(overviewDistance,isMobile?9.5:8.2,zoom);
  const x=THREE.MathUtils.lerp(isMobile?-.9:-3.45,isMobile?-.45:compact?-1.5:-2.6,zoom);
  const y=THREE.MathUtils.lerp(overviewY,focusY-(isMobile?1.9:0),zoom);
  const angle=THREE.MathUtils.lerp(-.26,Math.sin(p*.68)*.095,zoom);
  sword.rotation.set(0,angle,THREE.MathUtils.lerp(-.055,0,zoom));
  camera.position.set(x,y,distance);
  lookTarget.set(x,y,0);camera.lookAt(lookTarget);
  runeUniforms.runeProgress.value=p;
  flames.userData.uniforms.time.value=effectTime;
  flames.userData.uniforms.strength.value=.9+.1*Math.sin(effectTime*.9);
  if(!paused && dt){
    const pos=sparks.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){
      let y=pos.getY(i)+dt*(.18+(i%7)*.04);
      if(y>2.9)y=-5.5;
      pos.setY(i,y);
    }
    pos.needsUpdate=true;
  }
  renderer.render(scene,camera);
}

function tick(time){
  animationID=0;
  if(!running || !visible || document.hidden || lite || failed)return;
  const dt=lastTime?Math.min((time-lastTime)/1000,.05):.016;
  lastTime=time;
  if(!paused)effectTime+=dt;
  renderFrame(dt);
  if(!paused || Math.abs(smoothProgress-targetProgress)>.0005)schedule();
}
function schedule(){
  if(!animationID && renderer && sword && flames && running && visible && !document.hidden && !lite && !failed)
    animationID=requestAnimationFrame(tick);
}
function stop(){cancelAnimationFrame(animationID);animationID=0;lastTime=0;}
function updateMode(){
  stage.classList.toggle('is-lite',lite);
  stage.classList.toggle('is-loading',!lite && !stage.classList.contains('is-ready') && !failed);
  liteButton.setAttribute('aria-pressed',String(lite));
  liteButton.textContent=lite?'Activar 3D':'Vista ligera';
  auraButton.disabled=lite || failed;
  if(lite){stop();status.textContent=motion.matches?'Vista ligera · movimiento reducido':'Vista ligera';}
  else if(!failed){status.textContent=stage.classList.contains('is-ready')?'Recorrido 3D':'Cargando espada 3D…';initialize();schedule();}
}
function releaseScene(){
  stop();
  const textures=new Set(),geometries=new Set(),materials=new Set();
  if(runeUniforms.inlayReference.value)textures.add(runeUniforms.inlayReference.value);
  scene?.traverse(obj=>{
    if(obj.geometry)geometries.add(obj.geometry);
    for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material]).filter(Boolean)){
      materials.add(mat);
      for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);
      for(const uniform of Object.values(mat.uniforms || {}))if(uniform.value?.isTexture)textures.add(uniform.value);
    }
  });
  textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  environment?.dispose();renderer?.dispose();renderer=undefined;sword=undefined;scene=undefined;
  runeUniforms.inlayReference.value=null;
}

if(journey){
  resize();updateMode();
  addEventListener('scroll',()=>{readProgress();schedule();},{passive:true});
  new ResizeObserver(()=>{resize();schedule();}).observe(stage);
  new ResizeObserver(()=>{readProgress();schedule();}).observe(document.querySelector('.journey-content'));
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?schedule():stop();},{threshold:0}).observe(journey);
  document.addEventListener('visibilitychange',()=>{document.hidden?stop():schedule();});
  motion.addEventListener('change',()=>{lite=motion.matches;updateMode();});
  mobile.addEventListener('change',()=>{resize();schedule();});
  auraButton.addEventListener('click',()=>{
    paused=!paused;auraButton.setAttribute('aria-pressed',String(paused));
    auraButton.textContent=paused?'Activar aura':'Pausar aura';schedule();
  });
  liteButton.addEventListener('click',()=>{lite=!lite;updateMode();});
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();failed=true;lite=true;stop();stage.classList.remove('is-ready','is-loading');stage.classList.add('is-lite');
    status.textContent='Vista ligera · conexión 3D interrumpida';
    liteButton.textContent='Vista ligera';liteButton.setAttribute('aria-pressed','true');
    liteButton.disabled=true;auraButton.disabled=true;
  });
  addEventListener('pagehide',()=>{running=false;stop();});
  addEventListener('pageshow',()=>{running=true;schedule();});
}
