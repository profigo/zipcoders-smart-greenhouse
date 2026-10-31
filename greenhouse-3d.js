import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const $=id=>document.getElementById(id);
const host=$('greenhouse3dCanvas');
const status={pump:false,fan:false,growlight:false,paused:false,selected:'overview'};
let renderer,scene,camera,controls,clock=new THREE.Clock(),elapsed=0,fanBlades=[],waterDrops=[],dripDrops=[],growLights=[],plantLeaves=[],deviceMeshes={},raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),frame=0;
const mat=(color,roughness=.65,metalness=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
const steel=mat('#607c80',.32,.75),frameMat=mat('#314f55',.38,.7),glass=mat('#8bc9c1',.22,.1,{transparent:true,opacity:.19,side:THREE.DoubleSide}),soil=mat('#684a32'),bedMat=mat('#b18b5c'),leafMat=mat('#299657'),leafLight=mat('#58bd67'),pipeMat=mat('#268fb5',.35,.35),dark=mat('#172a30',.55,.4),white=mat('#d9e8e4',.3,.25),sensorBlue=mat('#19a9d1',.28,.3,{emissive:'#07516a',emissiveIntensity:.35}),greenGlow=mat('#36d99a',.28,.1,{emissive:'#16b978',emissiveIntensity:1.5}),amberGlow=mat('#f5b83d',.25,.2,{emissive:'#9b5e0c',emissiveIntensity:1.3});
function box(parent,x,y,z,w,h,d,material,rx=0,ry=0,rz=0){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);parent.add(m);return m;}
function cylinder(parent,x,y,z,r1,r2,h,material,segments=24){let m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y,z);parent.add(m);return m;}
function beam(parent,a,b,r,material){let A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),8),material);m.position.copy(A.add(B).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());parent.add(m);return m;}
function labelSprite(text,color='#d9f8ee'){let c=document.createElement('canvas');c.width=512;c.height=128;let ctx=c.getContext('2d');ctx.fillStyle='#081a20dd';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#5dd8b1';ctx.lineWidth=5;ctx.strokeRect(3,3,506,122);ctx.fillStyle=color;ctx.font='bold 42px Arial';ctx.textAlign='center';ctx.fillText(text,256,82);let tex=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));sp.scale.set(2.2,.55,1);return sp;}
function makePlant(parent,x,z,index){let g=new THREE.Group();g.position.set(x,.48,z);parent.add(g);let stem=cylinder(g,0,.24,0,.025,.035,.48,mat('#4c8e4b'),8);for(let k=0;k<7;k++){let a=k*2.4+index,leaf=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),k%2?leafMat:leafLight);leaf.scale.set(1,.25,2.0);leaf.position.set(Math.cos(a)*.16,.15+k*.055,Math.sin(a)*.14);leaf.rotation.y=a;leaf.rotation.z=(k%2?-.45:.45);g.add(leaf);plantLeaves.push({leaf,phase:index+k});}let fruit=cylinder(g,0,.25,0,.001,.001,.001,leafMat,6);return g;}
function buildBed(x,z,id){let g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(g,0,.18,0,3.6,.35,7.5,bedMat);box(g,0,.39,0,3.35,.12,7.2,soil);for(let row=0;row<3;row++)for(let col=0;col<4;col++)makePlant(g,-1.2+col*.8,-2.7+row*2.6,id*20+row*4+col);let tag=labelSprite('CROP BED 0'+id,'#e5d7b8');tag.position.set(0,1.05,4.0);tag.scale.set(1.8,.45,1);g.add(tag);return g;}
function makeSensor(id,name,description,x,y,z,code){let g=new THREE.Group();g.position.set(x,y,z);scene.add(g);let body=box(g,0,0,0,.38,.45,.25,sensorBlue);let cap=cylinder(g,0,.28,0,.12,.12,.08,white,16);let antenna=beam(g,[0,.22,0],[0,.62,0],.018,steel);let led=new THREE.Mesh(new THREE.SphereGeometry(.07,12,10),greenGlow);led.position.set(.23,.1,0);g.add(led);let tag=labelSprite(code,'#8ce9ff');tag.position.set(0,.9,0);tag.scale.set(1.15,.29,1);g.add(tag);g.userData={id,name,description,code,type:'sensor'};deviceMeshes[id]=g;return g;}
function makeActuator(id,name,description,x,y,z,code){let g=new THREE.Group();g.position.set(x,y,z);scene.add(g);let base=box(g,0,0,0,.8,.55,.65,dark);let top=box(g,0,.3,0,.72,.1,.58,steel);let lamp=new THREE.Mesh(new THREE.SphereGeometry(.09,12,10),greenGlow);lamp.position.set(.34,.39,.22);g.add(lamp);let tag=labelSprite(code,'#a7f4cb');tag.position.set(0,.9,0);tag.scale.set(1.2,.3,1);g.add(tag);g.userData={id,name,description,code,type:'actuator',lamp};deviceMeshes[id]=g;return g;}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color('#13252c');scene.fog=new THREE.Fog('#13252c',28,65);
 camera=new THREE.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,150);camera.position.set(19,16,21);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.replaceChildren(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.2,0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=12;controls.maxDistance=42;
 scene.add(new THREE.HemisphereLight('#d8f7ed','#25352d',2.0));let sun=new THREE.DirectionalLight('#fff0d2',3.2);sun.position.set(-10,20,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);let fill=new THREE.PointLight('#58bce0',35,32);fill.position.set(7,8,-4);scene.add(fill);
 const floor=box(scene,0,-.42,0,31,.7,23,mat('#263a36'));floor.receiveShadow=true;let grid=new THREE.GridHelper(31,31,'#42645d','#304b47');grid.position.y=-.05;scene.add(grid);
 // Concrete perimeter and greenhouse steel structure
 for(let x of [-9,9])for(let z of [-5.5,5.5])box(scene,x,.15,z,.45,.4,.45,mat('#71817a'));
 for(let x of [-8,-4,0,4,8]){beam(scene,[x,0,-5.4],[x,6.2,-5.4],.09,frameMat);beam(scene,[x,0,5.4],[x,6.2,5.4],.09,frameMat);beam(scene,[x,6.2,-5.4],[x,6.2,5.4],.07,frameMat);}
 for(let z of [-5.4,5.4]){beam(scene,[-9,0,z],[9,0,z],.08,frameMat);beam(scene,[-9,6.2,z],[9,6.2,z],.09,frameMat);}
 for(let x of [-9,9]){beam(scene,[x,6.2,-5.4],[x,8,0],.09,frameMat);beam(scene,[x,8,0],[x,6.2,5.4],.09,frameMat);}
 beam(scene,[-9,8,0],[9,8,0],.1,frameMat);
 // translucent glass roof and side glazing
 for(let x=-8;x<9;x+=4){let panel=box(scene,x,7.03,0,3.85,.035,10.6,glass,0,0,-.22);panel.rotation.z=0;}
 for(let z of [-5.37,5.37])box(scene,0,3.0,z,17.8,5.8,.035,glass);
 // Crop production bays
 buildBed(-5.5,-1.5,1);buildBed(0,-1.5,2);buildBed(5.5,-1.5,3);
 // Service aisle markings
 for(let x of [-3.5,2.0])box(scene,x,.015,-1.4,.045,.02,8,mat('#e4c77a'));
 // Water storage tank, pump skid, valves
 let tank=new THREE.Group();tank.position.set(-11,0,-3.4);scene.add(tank);cylinder(tank,0,1.35,0,1.05,1.05,2.7,mat('#3c8798',.35,.25));cylinder(tank,0,2.73,0,1.06,1.06,.12,steel);cylinder(tank,0,.12,0,1.08,1.08,.22,steel);cylinder(tank,0,1.0,0,1.055,1.055,.015,mat('#46c5dc',.2,.1,{transparent:true,opacity:.75}));let tankTag=labelSprite('RAW WATER TANK',' #d9f8ee');tankTag.position.set(0,3.5,0);tank.add(tankTag);
 let pump=makeActuator('pump','Irrigation transfer pump','Transfers water from the storage tank into the main irrigation header. Virtual output drives the animated water-flow indicator.',-8.5,.7,-3.4,'P-101');box(scene,-8.5,.22,-3.4,1.6,.35,1.1,steel);
 // Main pipe header and laterals
 beam(scene,[-8.5,1,-3.4],[8,1,-3.4],.11,pipeMat);beam(scene,[-8.5,1,-3.4],[-11,1,-3.4],.11,pipeMat);
 for(let x of [-5.5,0,5.5]){beam(scene,[x,1,-3.4],[x,1,.5],.055,pipeMat);for(let z=-2;z<5;z+=1.6){cylinder(scene,x,.97,z,.035,.035,.08,mat('#65cbe1'),8);}}
 for(let x of [-6.5,-3.5,1.5,4.5]){let valve=cylinder(scene,x,1.2,-3.4,.18,.18,.12,amberGlow,12);valve.rotation.x=Math.PI/2;}
 // Sensors, control cabinet and actuators
 makeSensor('temperature','Air temperature transmitter','PT-101 · Air temperature transmitter mounted at canopy height.',-7,3.3,3.7,'TT-101');
 makeSensor('humidity','Relative humidity transmitter','HT-102 · Relative humidity transmitter in the crop canopy.',0,3.1,3.7,'HT-102');
 makeSensor('soil','Capacitive soil moisture probe','SM-103 · Root-zone moisture probe installed in crop bed 02.',0,.9,-1.4,'SM-103');
 makeSensor('light','Photosynthetically active light sensor','LT-104 · Light sensor mounted above the crop canopy.',7,4.8,2.8,'LT-104');
 let fan=makeActuator('fan','Exhaust ventilation fan','EF-201 · Roof-end extraction fan. The thermal control loop starts ventilation when temperature reaches 30 °C.',8,4.5,-4.8,'EF-201');let ring=new THREE.Mesh(new THREE.TorusGeometry(.85,.1,12,32),steel);ring.position.set(8,4.5,-4.25);fan.add(ring);let hub=cylinder(fan,0,0,.35,.16,.16,.3,white,20);hub.rotation.x=Math.PI/2;let blades=new THREE.Group();blades.position.set(0,0,.52);fan.add(blades);for(let i=0;i<4;i++){let b=box(blades,0,.48,0,.17,.9,.09,mat('#c6d7d3',.3,.4),0,0,i*Math.PI/2);b.rotation.z=i*Math.PI/2;}fanBlades.push(blades);
 let lamp=makeActuator('growlight','Supplemental LED grow-light bank','GL-301 · Dimmable horticultural LED array. Activated by the low-light control rule in this demo.',0,5.55,0,'GL-301');for(let x=-5;x<=5;x+=2.5){let l=box(scene,x,5.65,0,1.8,.12,.38,mat('#e7c76b',.25,.1,{emissive:'#e0a52d',emissiveIntensity:.2}));l.userData.glow=true;let glow=new THREE.PointLight('#f6d78b',0,5);glow.position.set(x,5.2,0);scene.add(glow);growLights.push({bar:l,light:glow});}
 // PLC cabinet / HMI enclosure
 let cabinet=box(scene,10.5,1.65,4.1,1.6,3.2,.8,mat('#7c9291',.35,.5));box(scene,10.5,2.1,3.66,1.05,1.0,.08,mat('#102a30',.2,.2,{emissive:'#0b5a58',emissiveIntensity:.3}));for(let i=0;i<3;i++){let led=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),i===0?greenGlow:amberGlow);led.position.set(10.15+i*.3,1.35,3.62);scene.add(led);}
 let cabinetTag=labelSprite('CONTROL PANEL',' #e1f6ef');cabinetTag.position.set(10.5,3.7,4.1);scene.add(cabinetTag);
 // Flow particles
 for(let i=0;i<24;i++){let d=new THREE.Mesh(new THREE.SphereGeometry(.075,8,8),mat('#64ddf2',.25,.1,{emissive:'#147f9b',emissiveIntensity:1.2}));d.position.set(-8.2+(i%12)*1.25,1.1,-3.4+Math.floor(i/12)*.12);scene.add(d);waterDrops.push(d);}for(let bedX of [-5.5,0,5.5])for(let k=0;k<5;k++){let drop=new THREE.Mesh(new THREE.SphereGeometry(.045,7,7),mat('#79e8ff',.2,.1,{emissive:'#32b8e2',emissiveIntensity:1.5}));drop.position.set(bedX,1.02,-2.9+k*1.5);scene.add(drop);dripDrops.push({mesh:drop,phase:k/5+bedX*.03});}
 // Grounded equipment nameplates
 let title=labelSprite('SMART GREENHOUSE · GH-01','#a6e8d4');title.position.set(0,8.9,0);title.scale.set(3.6,.65,1);scene.add(title);
 renderer.domElement.addEventListener('pointerdown',onPointer);$('twinResetView').addEventListener('click',()=>{camera.position.set(19,16,21);controls.target.set(0,1.2,0);controls.update();});$('twinPause').addEventListener('click',()=>{status.paused=!status.paused;$('twinPause').textContent=status.paused?'▶ RESUME MODEL':'Ⅱ PAUSE MODEL';});
 window.addEventListener('resize',resize);updateTwin();select('overview');animate();
}
function resize(){if(!renderer)return;let w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
function onPointer(e){let r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);let roots=Object.values(deviceMeshes),hits=raycaster.intersectObjects(roots.flatMap(o=>o.children.concat(o)),true);if(!hits.length)return;let obj=hits[0].object;while(obj&&!obj.userData.id)obj=obj.parent;if(!obj)return;let id=obj.userData.id;select(id);if(obj.userData.type==='actuator'){let input=$(id);if(input){input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));}}}
function val(id){return Number($(id)?.textContent?.replace(/,/g,'')||0);}
function updateTwin(){let t=val('tempValue'),h=val('humidityValue'),s=val('soilValue'),l=val('luxValue');for(let [id,on] of [['pump',$('pump')?.checked],['fan',$('fan')?.checked],['growlight',$('growlight')?.checked]])status[id]=!!on;$('twinTemp').innerHTML=t.toFixed(1)+' <i>°C</i>';$('twinHumidity').innerHTML=Math.round(h)+' <i>%RH</i>';$('twinSoil').innerHTML=Math.round(s)+' <i>%</i>';$('twinLux').innerHTML=Math.round(l).toLocaleString()+' <i>lux</i>';let n=Number(status.pump)+Number(status.fan)+Number(status.growlight);$('twinOutputs').innerHTML=String(n).padStart(2,'0')+' <i>/ 03</i>';$('twinMode').textContent=$('auto')?.checked?'AUTO':'MANUAL';if(deviceMeshes.pump)for(let id of ['pump','fan','growlight']){let led=deviceMeshes[id]?.userData.lamp;if(led)led.material=status[id]?greenGlow:amberGlow;}if(status.selected)select(status.selected);}
function select(id){status.selected=id;let data={overview:{name:'Greenhouse process overview',desc:'Three production beds, centralized irrigation, ventilation and supplemental lighting. Orbit the model to inspect the facility.',tag:'FACILITY OVERVIEW',value:'RUNNING',unit:'MODEL STATE',code:'GH-01',source:'SIMULATION ENGINE'},temperature:{name:'Air temperature transmitter',desc:'PT-101 · Mounted above the crop canopy. High temperature activates exhaust ventilation at 30 °C.',tag:'SENSOR · TEMPERATURE',value:val('tempValue').toFixed(1),unit:'DEG C',code:'TT-101',source:'SIMULATED PROCESS'},humidity:{name:'Relative humidity transmitter',desc:'HT-102 · Monitors relative humidity around the crop canopy. Used to identify humidity conditions.',tag:'SENSOR · HUMIDITY',value:Math.round(val('humidityValue')),unit:'% RH',code:'HT-102',source:'SIMULATED PROCESS'},soil:{name:'Capacitive soil moisture probe',desc:'SM-103 · Measures root-zone moisture in production bed 02. Irrigation demand occurs below 35%.',tag:'SENSOR · ROOT ZONE',value:Math.round(val('soilValue')),unit:'% VOLUMETRIC (DEMO)',code:'SM-103',source:'SIMULATED PROCESS'},light:{name:'Canopy light sensor',desc:'LT-104 · Measures light intensity at crop height. Supplemental LEDs switch on below 4,500 lux.',tag:'SENSOR · LIGHT',value:Math.round(val('luxValue')).toLocaleString(),unit:'LUX',code:'LT-104',source:'SIMULATED PROCESS'},pump:{name:'Irrigation transfer pump',desc:'P-101 · Transfers water to the drip irrigation header. Click the pump to toggle its virtual output.',tag:'ACTUATOR · WATER',value:status.pump?'RUNNING':'STOPPED',unit:'VIRTUAL OUTPUT',code:'P-101',source:$('auto')?.checked?'AUTO CONTROL':'OPERATOR COMMAND'},fan:{name:'Exhaust ventilation fan',desc:'EF-201 · Extracts warm air from the greenhouse. Click the fan to toggle its virtual output.',tag:'ACTUATOR · CLIMATE',value:status.fan?'RUNNING':'STOPPED',unit:'VIRTUAL OUTPUT',code:'EF-201',source:$('auto')?.checked?'AUTO CONTROL':'OPERATOR COMMAND'},growlight:{name:'LED grow-light bank',desc:'GL-301 · Supplemental horticultural lighting. Click the light bank to toggle its virtual output.',tag:'ACTUATOR · LIGHTING',value:status.growlight?'ENERGIZED':'OFF',unit:'VIRTUAL OUTPUT',code:'GL-301',source:$('auto')?.checked?'AUTO CONTROL':'OPERATOR COMMAND'}}[id];$('instrumentTag').textContent=data.tag;$('instrumentName').textContent=data.name;$('instrumentDescription').textContent=data.desc;$('instrumentValue').textContent=data.value;$('instrumentUnit').textContent=data.unit;$('instrumentId').textContent=data.code;$('instrumentSource').textContent=data.source;$('instrumentStatus').textContent='● '+(id==='overview'?'MODEL ONLINE':(['temperature','humidity','soil','light'].includes(id)?'SIGNAL SIMULATED':'OUTPUT '+(data.value==='RUNNING'||data.value==='ENERGIZED'?'ACTIVE':'INACTIVE')));$('instrumentStatus').className='instrument-ok';}
function animate(){requestAnimationFrame(animate);let dt=clock.getDelta();if(!status.paused)elapsed+=dt;if(fanBlades[0])fanBlades[0].rotation.z+=status.fan?dt*11:dt*.12;plantLeaves.forEach(p=>{p.leaf.rotation.z=Math.sin(elapsed*1.1+p.phase)*.06+(p.phase%2?.25:-.25);});waterDrops.forEach((d,i)=>{d.visible=status.pump;if(status.pump){let p=(elapsed*1.8+i/24)%1;d.position.x=-8.1+p*16;d.position.y=1.1+Math.sin(p*18+i)*.025;}});dripDrops.forEach(d=>{d.mesh.visible=status.pump;if(status.pump){let p=(elapsed*1.2+d.phase)%1;d.mesh.position.y=1.0-p*.68;}});growLights.forEach(g=>{g.light.intensity=status.growlight?2.6:0;g.bar.material.emissiveIntensity=status.growlight?1.8:.2;});if(frame++%12===0){let sec=Math.floor(elapsed),hh=String(Math.floor(sec/3600)).padStart(2,'0'),mm=String(Math.floor(sec%3600/60)).padStart(2,'0'),ss=String(sec%60).padStart(2,'0');$('modelClock').textContent=hh+':'+mm+':'+ss;}controls.update();renderer.render(scene,camera);}
let initialized=false;
let appVisibilityObserver=null;
let hostResizeObserver=null;
function startWhenVisible(){
 if(initialized)return;
 const width=host.clientWidth,height=host.clientHeight;
 if(width<2||height<2)return;
 initialized=true;
 try{
  init();
  const ids=['tempValue','humidityValue','soilValue','luxValue','pump','fan','growlight','auto'];
  ids.forEach(id=>{let e=$(id);if(e){new MutationObserver(updateTwin).observe(e,{childList:true,characterData:true,attributes:true,subtree:true});e.addEventListener('change',updateTwin);}});
  setInterval(updateTwin,900);
  $('threeFallback')?.remove();
  appVisibilityObserver?.disconnect();
 }catch(e){
  initialized=false;
  host.innerHTML='<div class="three-loading"><b>3D ENGINE UNAVAILABLE</b><small>The 3D facility could not start. Check the browser console and internet connection; the monitoring dashboard is still available.</small></div>';
  console.error('Greenhouse 3D initialization failed:',e);
 }
}
function boot(){
 const app=$('app');
 appVisibilityObserver=new MutationObserver(startWhenVisible);
 if(app)appVisibilityObserver.observe(app,{attributes:true,attributeFilter:['class','style']});
 if(typeof ResizeObserver!=='undefined'){
  hostResizeObserver=new ResizeObserver(()=>{
   if(!initialized)startWhenVisible();
   else resize();
  });
  hostResizeObserver.observe(host);
 }
 startWhenVisible();
}
boot();