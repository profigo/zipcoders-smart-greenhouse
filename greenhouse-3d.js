import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const $=id=>document.getElementById(id);
const host=$('greenhouse3dCanvas');
const status={pump:false,fan:false,growlight:false,paused:false,selected:'overview'};
let renderer,scene,camera,controls,clock=new THREE.Clock(),elapsed=0,fanBlades=[],waterDrops=[],dripDrops=[],growLights=[],plantLeaves=[],deviceMeshes={},raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),frame=0,gateGroup=null,gateOpen=false,gateUnlocked=false;
const mat=(color,roughness=.65,metalness=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
const steel=mat('#607c80',.32,.75),frameMat=mat('#314f55',.38,.7),glass=mat('#8bc9c1',.22,.1,{transparent:true,opacity:.19,side:THREE.DoubleSide}),soil=mat('#684a32'),bedMat=mat('#b18b5c'),leafMat=mat('#299657'),leafLight=mat('#58bd67'),pipeMat=mat('#268fb5',.35,.35),dark=mat('#172a30',.55,.4),white=mat('#d9e8e4',.3,.25),sensorBlue=mat('#19a9d1',.28,.3,{emissive:'#07516a',emissiveIntensity:.35}),greenGlow=mat('#36d99a',.28,.1,{emissive:'#16b978',emissiveIntensity:1.5}),amberGlow=mat('#f5b83d',.25,.2,{emissive:'#9b5e0c',emissiveIntensity:1.3});
function box(parent,x,y,z,w,h,d,material,rx=0,ry=0,rz=0){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);parent.add(m);return m;}
function cylinder(parent,x,y,z,r1,r2,h,material,segments=24){let m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y,z);parent.add(m);return m;}
function beam(parent,a,b,r,material){let A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),8),material);m.position.copy(A.add(B).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());parent.add(m);return m;}
function labelSprite(text,color='#d9f8ee'){let c=document.createElement('canvas');c.width=512;c.height=128;let ctx=c.getContext('2d');ctx.fillStyle='#081a20dd';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#5dd8b1';ctx.lineWidth=5;ctx.strokeRect(3,3,506,122);ctx.fillStyle=color;ctx.font='bold 42px Arial';ctx.textAlign='center';ctx.fillText(text,256,82);let tex=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));sp.scale.set(2.2,.55,1);return sp;}
const cropLooks=[
 {name:'TOMATO',leaf:'#329b54',fruit:'#e84c3d',shape:'round'},
 {name:'LETTUCE',leaf:'#79bd62',fruit:null,shape:'rosette'},
 {name:'SWEET PEPPER',leaf:'#3d9b55',fruit:'#e7bd38',shape:'pepper'},
 {name:'CUCUMBER',leaf:'#2c8c4d',fruit:'#3eaa59',shape:'long'},
 {name:'SPINACH',leaf:'#287d43',fruit:null,shape:'broad'},
 {name:'KALE',leaf:'#318a4c',fruit:null,shape:'ruffled'},
 {name:'CABBAGE',leaf:'#72b85c',fruit:'#9bc96c',shape:'head'},
 {name:'EGGPLANT',leaf:'#347f4b',fruit:'#7442a4',shape:'eggplant'},
 {name:'STRAWBERRY',leaf:'#3d9c50',fruit:'#e94b55',shape:'berry'},
 {name:'GREEN BEAN',leaf:'#348f4b',fruit:'#4da95b',shape:'pod'}
];
const cropLeafMaterials=cropLooks.map(c=>mat(c.leaf,.82,0));
const cropFruitMaterials=cropLooks.map(c=>c.fruit?mat(c.fruit,.42,.02):null);
const fruitGeometry=new THREE.SphereGeometry(1,10,8);
function makePlant(parent,x,z,index,cropIndex){
 const look=cropLooks[cropIndex],g=new THREE.Group();g.position.set(x,.48,z);parent.add(g);
 const leafMaterial=cropLeafMaterials[cropIndex],fruitMaterial=cropFruitMaterials[cropIndex];
 const low=['LETTUCE','SPINACH','KALE','STRAWBERRY'].includes(look.name);
 const height=low ? .42 : .72;
 cylinder(g,0,height*.42,0,.025,.035,height,mat('#4c8e4b'),7);
 const count=look.shape==='rosette'?9:look.shape==='ruffled'?10:7;
 for(let k=0;k<count;k++){
  const a=k*Math.PI*2/count+index*.13;
  const leaf=new THREE.Mesh(new THREE.SphereGeometry((look.shape==='broad'||look.shape==='head') ? .19 : .16,9,7),leafMaterial);
  const spread=(look.shape==='rosette'||look.shape==='head') ? .29 : .22;
  leaf.scale.set(look.shape==='ruffled' ? .9 : 1.15,.22,look.shape==='broad' ? .42 : .72);
  leaf.position.set(Math.cos(a)*spread,.12+(k%3)*.055,Math.sin(a)*spread);
  leaf.rotation.y=a;leaf.rotation.z=Math.cos(a)*.42;g.add(leaf);
  plantLeaves.push({leaf,phase:index+k});
 }
 if(look.shape==='head'){
  const head=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),fruitMaterial);head.scale.set(1,.85,1);head.position.y=.42;g.add(head);
 }
 if(fruitMaterial&&look.shape!=='head'){
  const countFruit=look.shape==='berry'?4:look.shape==='tomato'?3:look.shape==='pepper'?2:look.shape==='long'?2:look.shape==='eggplant'?2:3;
  for(let k=0;k<countFruit;k++){
   const fruit=new THREE.Mesh(fruitGeometry,fruitMaterial);
   if(look.shape==='long'||look.shape==='pod'||look.shape==='eggplant'){fruit.scale.set(.11,.36,.12);fruit.rotation.z=(k%2?-.35:.35);}
   else if(look.shape==='pepper'){fruit.scale.set(.16,.27,.16);}
   else if(look.shape==='berry'){fruit.scale.set(.13,.15,.13);}
   else fruit.scale.set(.16,.18,.16);
   const a=k*2.4+index;fruit.position.set(Math.cos(a)*.2,.18+(k%2)*.16,Math.sin(a)*.2);g.add(fruit);
  }
 }
 if(look.name==='CUCUMBER'||look.name==='GREEN BEAN'){
  const stake=mat('#a88b55');cylinder(g,0,.55,0,.018,.018,1.1,stake,6);
 }
 return g;
}
function buildBed(x,z,id,cropIndex){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 box(g,0,.18,0,2.85,.35,3.25,bedMat);box(g,0,.39,0,2.62,.12,3.02,soil);
 for(let row=0;row<3;row++)for(let col=0;col<2;col++)makePlant(g,-.67+col*1.34,-1+row*1.0,id*20+row*2+col,cropIndex);
 const look=cropLooks[cropIndex],tag=labelSprite(String(id).padStart(2,'0')+' · '+look.name,'#e5f5df');
 tag.position.set(0,1.28,1.45);tag.scale.set(1.75,.38,1);g.add(tag);
 return g;
}
function makeSensor(id,name,description,x,y,z,code){let g=new THREE.Group();g.position.set(x,y,z);scene.add(g);let body=box(g,0,0,0,.38,.45,.25,sensorBlue);let cap=cylinder(g,0,.28,0,.12,.12,.08,white,16);let antenna=beam(g,[0,.22,0],[0,.62,0],.018,steel);let led=new THREE.Mesh(new THREE.SphereGeometry(.07,12,10),greenGlow);led.position.set(.23,.1,0);g.add(led);let tag=labelSprite(code,'#8ce9ff');tag.position.set(0,.9,0);tag.scale.set(1.15,.29,1);g.add(tag);g.userData={id,name,description,code,type:'sensor'};deviceMeshes[id]=g;return g;}
function makeActuator(id,name,description,x,y,z,code){let g=new THREE.Group();g.position.set(x,y,z);scene.add(g);let base=box(g,0,0,0,.8,.55,.65,dark);let top=box(g,0,.3,0,.72,.1,.58,steel);let lamp=new THREE.Mesh(new THREE.SphereGeometry(.09,12,10),greenGlow);lamp.position.set(.34,.39,.22);g.add(lamp);let tag=labelSprite(code,'#a7f4cb');tag.position.set(0,.9,0);tag.scale.set(1.2,.3,1);g.add(tag);g.userData={id,name,description,code,type:'actuator',lamp};deviceMeshes[id]=g;return g;}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color('#13252c');scene.fog=new THREE.Fog('#13252c',28,65);
 camera=new THREE.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,150);camera.position.set(12.8,10.2,15.2);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.replaceChildren(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.45,0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=9;controls.maxDistance=36;
 scene.add(new THREE.HemisphereLight('#d8f7ed','#25352d',2.0));let sun=new THREE.DirectionalLight('#fff0d2',3.2);sun.position.set(-10,20,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);let fill=new THREE.PointLight('#58bce0',35,32);fill.position.set(7,8,-4);scene.add(fill);
 const floor=box(scene,0,-.42,0,42,.7,34,mat('#263a36'));floor.receiveShadow=true;let grid=new THREE.GridHelper(42,42,'#42645d','#304b47');grid.position.y=-.05;scene.add(grid);
 // Secure site perimeter: fenced boundary, controlled entrance and landscaped trees.
 const fenceMat=mat('#87949b',.48,.62),fenceDark=mat('#34495e',.42,.65),treeTrunk=mat('#765036'),treeLeaf=mat('#267a43'),treeLeaf2=mat('#3c9954');
 const post=(x,z)=>box(scene,x,1.25,z,.22,2.5,.22,fenceDark);
 for(let x=-16;x<=16;x+=2){post(x,-12.5);if(x<-2||x>2)post(x,12.5);}
 for(let z=-10.5;z<=10.5;z+=2){post(-16,z);post(16,z);}
 // Back and side fence rails.
 for(const z of [-12.5]){beam(scene,[-16,.35,z],[16,.35,z],.055,fenceMat);beam(scene,[-16,2.25,z],[16,2.25,z],.07,fenceMat);}
 for(const x of [-16,16]){beam(scene,[x,.35,-12.5],[x,.35,12.5],.055,fenceMat);beam(scene,[x,2.25,-12.5],[x,2.25,12.5],.07,fenceMat);}
 // Front fence leaves a four-metre vehicle/personnel entrance.
 for(const side of [[-16,-2],[2,16]]){beam(scene,[side[0],.35,12.5],[side[1],.35,12.5],.055,fenceMat);beam(scene,[side[0],2.25,12.5],[side[1],2.25,12.5],.07,fenceMat);}
 post(-2,12.5);post(2,12.5);
 gateGroup=new THREE.Group();gateGroup.position.set(-2,0,12.5);gateGroup.userData={id:'gate',name:'Main security gate',description:'Click the visible gate lock to open the PIN keypad. Enter 1-2-3-4 to unlock this simulated entrance.',type:'access'};scene.add(gateGroup);deviceMeshes.gate=gateGroup;
 beam(gateGroup,[0,.3,0],[4,.3,0],.07,fenceMat);beam(gateGroup,[0,2.2,0],[4,2.2,0],.07,fenceMat);
 for(let x=.12;x<4;x+=.42)beam(gateGroup,[x,.35,0],[x,2.18,0],.035,fenceMat);
 beam(gateGroup,[0,.45,0],[4,2.05,0],.045,fenceDark);
 // Visible padlock mounted on the moving gate leaf.
 const lockBody=box(gateGroup,2,1.05,-.12,.42,.48,.2,mat('#facc15',.3,.55));
 const lockShackle=new THREE.Mesh(new THREE.TorusGeometry(.16,.045,8,18),mat('#dbeafe',.28,.7));lockShackle.position.set(2,1.34,-.13);gateGroup.add(lockShackle);
 // Trees around the fenced compound, with low-polygon canopies for browser performance.
 function makeTree(x,z,scale=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);cylinder(g,0,1.15,0,.22,.32,2.3,treeTrunk,8);for(const [ox,oy,oz,r] of [[0,2.55,0,1.05],[-.55,2.2,.12,.72],[.55,2.2,-.1,.72],[0,3.15,.1,.72]]){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),Math.random()>.5?treeLeaf:treeLeaf2);crown.position.set(ox,oy,oz);g.add(crown);}return g;}
 [[-18,-10],[-18,-5],[-18,1],[-18,7],[-18,12],[18,-10],[18,-5],[18,1],[18,7],[18,12],[-12,-15],[-6,-15],[0,-15],[6,-15],[12,-15],[-12,15],[6,15],[12,15]].forEach((p,i)=>makeTree(p[0],p[1],i%3===0?1.12:.9));

 // Concrete perimeter and greenhouse steel structure
 for(let x of [-9,9])for(let z of [-5.5,5.5])box(scene,x,.15,z,.45,.4,.45,mat('#71817a'));
 for(let x of [-8,-4,0,4,8]){beam(scene,[x,0,-5.4],[x,6.2,-5.4],.09,frameMat);beam(scene,[x,0,5.4],[x,6.2,5.4],.09,frameMat);beam(scene,[x,6.2,-5.4],[x,6.2,5.4],.07,frameMat);}
 for(let z of [-5.4,5.4]){beam(scene,[-9,0,z],[9,0,z],.08,frameMat);beam(scene,[-9,6.2,z],[9,6.2,z],.09,frameMat);}
 for(let x of [-9,9]){beam(scene,[x,6.2,-5.4],[x,8,0],.09,frameMat);beam(scene,[x,8,0],[x,6.2,5.4],.09,frameMat);}
 beam(scene,[-9,8,0],[9,8,0],.1,frameMat);
 // translucent glass roof and side glazing
 for(let x=-8;x<9;x+=4){let panel=box(scene,x,7.03,0,3.85,.035,10.6,glass,0,0,-.22);panel.rotation.z=0;}
 for(let z of [-5.37,5.37])box(scene,0,3.0,z,17.8,5.8,.035,glass);
 // Ten distinct production zones: two growing rows with a central service aisle.
 const cropBeds=[[-7,-2.45],[-3.5,-2.45],[0,-2.45],[3.5,-2.45],[7,-2.45],[-7,2.45],[-3.5,2.45],[0,2.45],[3.5,2.45],[7,2.45]];
 cropBeds.forEach(([x,z],i)=>buildBed(x,z,i+1,i));
 // Clear walking aisles between crop rows and around the growing beds.
 box(scene,0,.025,0,17.4,.035,.82,mat('#b7a47c'));
 for(let x of [-5.25,-1.75,1.75,5.25])box(scene,x,.02,0,.055,.025,9.8,mat('#d5bd83'));
 // Water storage tank, pump skid, valves
 let tank=new THREE.Group();tank.position.set(-11,0,-3.4);scene.add(tank);cylinder(tank,0,1.35,0,1.05,1.05,2.7,mat('#3c8798',.35,.25));cylinder(tank,0,2.73,0,1.06,1.06,.12,steel);cylinder(tank,0,.12,0,1.08,1.08,.22,steel);cylinder(tank,0,1.0,0,1.055,1.055,.015,mat('#46c5dc',.2,.1,{transparent:true,opacity:.75}));let tankTag=labelSprite('RAW WATER TANK',' #d9f8ee');tankTag.position.set(0,3.5,0);tank.add(tankTag);
 let pump=makeActuator('pump','Irrigation transfer pump','Transfers water from the storage tank into the main irrigation header. Virtual output drives the animated water-flow indicator.',-8.5,.7,-3.4,'P-101');box(scene,-8.5,.22,-3.4,1.6,.35,1.1,steel);
 // Main pipe header and laterals
 beam(scene,[-8.5,1,-3.4],[8,1,-3.4],.11,pipeMat);beam(scene,[-8.5,1,-3.4],[-11,1,-3.4],.11,pipeMat);
 for(let x of [-7,-3.5,0,3.5,7]){beam(scene,[x,1,-3.4],[x,1,4.8],.055,pipeMat);for(let z=-2.8;z<4.8;z+=1.5){cylinder(scene,x,.97,z,.035,.035,.08,mat('#65cbe1'),8);}}
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
 for(let i=0;i<24;i++){let d=new THREE.Mesh(new THREE.SphereGeometry(.075,8,8),mat('#64ddf2',.25,.1,{emissive:'#147f9b',emissiveIntensity:1.2}));d.position.set(-8.2+(i%12)*1.25,1.1,-3.4+Math.floor(i/12)*.12);scene.add(d);waterDrops.push(d);}for(let bedX of [-7,-3.5,0,3.5,7])for(let k=0;k<5;k++){let drop=new THREE.Mesh(new THREE.SphereGeometry(.045,7,7),mat('#79e8ff',.2,.1,{emissive:'#32b8e2',emissiveIntensity:1.5}));drop.position.set(bedX,1.02,-2.9+k*1.5);scene.add(drop);dripDrops.push({mesh:drop,phase:k/5+bedX*.03});}
 // Grounded equipment nameplates
 let title=labelSprite('SMART GREENHOUSE · GH-01','#a6e8d4');title.position.set(0,8.9,0);title.scale.set(3.6,.65,1);scene.add(title);
 renderer.domElement.addEventListener('pointerdown',onPointer);$('twinResetView').addEventListener('click',()=>{camera.position.set(15,12,18);controls.target.set(0,1.45,0);controls.update();});$('twinPause').addEventListener('click',()=>{status.paused=!status.paused;$('twinPause').textContent=status.paused?'▶ RESUME MODEL':'Ⅱ PAUSE MODEL';});
 let gatePin='';
 const keypad=$('gateKeypad'),pinDisplay=$('gatePinDisplay'),gateStatus=$('gateAccessStatus');
 const renderPin=()=>{if(pinDisplay)pinDisplay.textContent=gatePin.padEnd(4,'_').split('').join(' ');};
 const closeKeypad=()=>{if(keypad)keypad.hidden=true;gatePin='';renderPin();};
 const showKeypad=()=>{if(keypad)keypad.hidden=false;gatePin='';renderPin();if(gateStatus){gateStatus.textContent=gateUnlocked?'UNLOCKED · GATE OPEN':'LOCKED · ENTER PIN';gateStatus.className=gateUnlocked?'gate-status gate-ok':'gate-status';}};
 document.querySelectorAll('[data-gate-digit]').forEach(button=>button.addEventListener('click',()=>{if(gatePin.length<4){gatePin+=button.dataset.gateDigit;renderPin();if(gatePin.length===4)enterGatePin();}}));
 $('gatePinClear')?.addEventListener('click',()=>{gatePin='';renderPin();});
 const enterGatePin=()=>{
  if(gatePin==='1234'){
   gateUnlocked=true;gateOpen=true;if(gateStatus){gateStatus.textContent='ACCESS GRANTED · GATE OPEN';gateStatus.className='gate-status gate-ok';}
   gatePin='';renderPin();window.zipcodersPinnedAlert?.('Gate unlocked','Correct demo PIN entered. The simulated greenhouse gate is opening.',false);select('gate');
  }else{
   gatePin='';renderPin();if(gateStatus){gateStatus.textContent='ACCESS DENIED · TRY AGAIN';gateStatus.className='gate-status gate-denied';}
   window.zipcodersPinnedAlert?.('Gate access denied','Incorrect PIN. The simulated gate remains locked.',true);
  }
 };
 $('gatePinEnter')?.addEventListener('click',enterGatePin);
 document.querySelectorAll('[data-gate-digit]').forEach(button=>button.addEventListener('dblclick',e=>e.preventDefault()));
 $('gateKeypadClose')?.addEventListener('click',closeKeypad);
 $('gateLockButton')?.addEventListener('click',()=>{
  gateUnlocked=false;gateOpen=false;gatePin='';renderPin();if(gateStatus){gateStatus.textContent='LOCKED · ACCESS CONTROL ACTIVE';gateStatus.className='gate-status';}
  window.zipcodersPinnedAlert?.('Gate secured','The simulated entrance gate is closing and locked.',false);select('gate');
 });
 window.addEventListener('keydown',e=>{if(e.key==='Enter'&&keypad&&!keypad.hidden)enterGatePin();if(e.key==='Escape'&&keypad&&!keypad.hidden)closeKeypad();});
 window.addEventListener('resize',resize);updateTwin();select('overview');animate();
}
function resize(){if(!renderer)return;let w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
function onPointer(e){let r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);let roots=Object.values(deviceMeshes),hits=raycaster.intersectObjects(roots.flatMap(o=>o.children.concat(o)),true);if(!hits.length)return;let obj=hits[0].object;while(obj&&!obj.userData.id)obj=obj.parent;if(!obj)return;let id=obj.userData.id;select(id);if(id==='gate'){let panel=$('gateKeypad');if(panel)panel.hidden=!panel.hidden;let s=$('gateAccessStatus');if(s){s.textContent=gateUnlocked?'UNLOCKED · GATE OPEN':'LOCKED · ENTER PIN';s.className=gateUnlocked?'gate-status gate-ok':'gate-status';}return;}if(obj.userData.type==='actuator'){let input=$(id);if(input){input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));}}}
function val(id){return Number($(id)?.textContent?.replace(/,/g,'')||0);}
function updateTwin(){let t=val('tempValue'),h=val('humidityValue'),s=val('soilValue'),l=val('luxValue');for(let [id,on] of [['pump',$('pump')?.checked],['fan',$('fan')?.checked],['growlight',$('growlight')?.checked]])status[id]=!!on;$('twinTemp').innerHTML=t.toFixed(1)+' <i>°C</i>';$('twinHumidity').innerHTML=Math.round(h)+' <i>%RH</i>';$('twinSoil').innerHTML=Math.round(s)+' <i>%</i>';$('twinLux').innerHTML=Math.round(l).toLocaleString()+' <i>lux</i>';let n=Number(status.pump)+Number(status.fan)+Number(status.growlight);$('twinOutputs').innerHTML=String(n).padStart(2,'0')+' <i>/ 03</i>';$('twinMode').textContent=$('auto')?.checked?'AUTO':'MANUAL';if(deviceMeshes.pump)for(let id of ['pump','fan','growlight']){let led=deviceMeshes[id]?.userData.lamp;if(led)led.material=status[id]?greenGlow:amberGlow;}if(status.selected)select(status.selected);}
function select(id){status.selected=id;let data={overview:{name:'Greenhouse process overview',desc:'Ten distinct crop zones across two growing rows, centralized irrigation, ventilation and supplemental lighting. Orbit and zoom to inspect each production bay.',tag:'FACILITY OVERVIEW',value:'RUNNING',unit:'MODEL STATE',code:'GH-01',source:'SIMULATION ENGINE'},temperature:{name:'Air temperature transmitter',desc:'PT-101 · Mounted above the crop canopy. High temperature activates exhaust ventilation at 30 °C.',tag:'SENSOR · TEMPERATURE',value:val('tempValue').toFixed(1),unit:'DEG C',code:'TT-101',source:'SIMULATED PROCESS'},humidity:{name:'Relative humidity transmitter',desc:'HT-102 · Monitors relative humidity around the crop canopy. Used to identify humidity conditions.',tag:'SENSOR · HUMIDITY',value:Math.round(val('humidityValue')),unit:'% RH',code:'HT-102',source:'SIMULATED PROCESS'},soil:{name:'Capacitive soil moisture probe',desc:'SM-103 · Measures root-zone moisture in production bed 02. Irrigation demand occurs below 35%.',tag:'SENSOR · ROOT ZONE',value:Math.round(val('soilValue')),unit:'% VOLUMETRIC (DEMO)',code:'SM-103',source:'SIMULATED PROCESS'},light:{name:'Canopy light sensor',desc:'LT-104 · Measures light intensity at crop height. Supplemental LEDs switch on below 4,500 lux.',tag:'SENSOR · LIGHT',value:Math.round(val('luxValue')).toLocaleString(),unit:'LUX',code:'LT-104',source:'SIMULATED PROCESS'},pump:{name:'Irrigation transfer pump',desc:'P-101 · Transfers water to the drip irrigation header. Click the pump to toggle its virtual output.',tag:'ACTUATOR · WATER',value:status.pump?'RUNNING':'STOPPED',unit:'VIRTUAL OUTPUT',code:'P-101',source:$('auto')?.checked?'AUTO CONTROL':'OPERATOR COMMAND'},fan:{name:'Exhaust ventilation fan',desc:'EF-201 · Extracts warm air from the greenhouse. Click the fan to toggle its virtual output.',tag:'ACTUATOR · CLIMATE',value:status.fan?'RUNNING':'STOPPED',unit:'VIRTUAL OUTPUT',code:'EF-201',source:$('auto')?.checked?'AUTO CONTROL':'OPERATOR COMMAND'},growlight:{name:'LED grow-light bank',desc:'GL-301 · Supplemental horticultural lighting. Click the light bank to toggle its virtual output.',tag:'ACTUATOR · LIGHTING',value:status.growlight?'ENERGIZED':'OFF',unit:'VIRTUAL OUTPUT',code:'GL-301',source:$('auto')?.checked?'AUTO CONTROL':'OPERATOR COMMAND'},gate:{name:'Main security gate',desc:'Controlled entrance to the fenced greenhouse site. Use the access panel and demo credentials to open or lock the gate.',tag:'SITE SECURITY · ACCESS CONTROL',value:gateUnlocked?'UNLOCKED':'LOCKED',unit:'SIMULATED GATE STATE',code:'GATE-001',source:'DEMO ACCESS CONTROL'}}[id];$('instrumentTag').textContent=data.tag;$('instrumentName').textContent=data.name;$('instrumentDescription').textContent=data.desc;$('instrumentValue').textContent=data.value;$('instrumentUnit').textContent=data.unit;$('instrumentId').textContent=data.code;$('instrumentSource').textContent=data.source;$('instrumentStatus').textContent='● '+(id==='overview'?'MODEL ONLINE':(['temperature','humidity','soil','light'].includes(id)?'SIGNAL SIMULATED':'OUTPUT '+(data.value==='RUNNING'||data.value==='ENERGIZED'?'ACTIVE':'INACTIVE')));$('instrumentStatus').className='instrument-ok';}
function animate(){requestAnimationFrame(animate);let dt=clock.getDelta();if(!status.paused)elapsed+=dt;if(gateGroup)gateGroup.rotation.y=THREE.MathUtils.damp(gateGroup.rotation.y,gateOpen?-1.28:0,3.2,dt);if(fanBlades[0])fanBlades[0].rotation.z+=status.fan?dt*11:dt*.12;plantLeaves.forEach(p=>{p.leaf.rotation.z=Math.sin(elapsed*1.1+p.phase)*.06+(p.phase%2?.25:-.25);});waterDrops.forEach((d,i)=>{d.visible=status.pump;if(status.pump){let p=(elapsed*1.8+i/24)%1;d.position.x=-8.1+p*16;d.position.y=1.1+Math.sin(p*18+i)*.025;}});dripDrops.forEach(d=>{d.mesh.visible=status.pump;if(status.pump){let p=(elapsed*1.2+d.phase)%1;d.mesh.position.y=1.0-p*.68;}});growLights.forEach(g=>{g.light.intensity=status.growlight?2.6:0;g.bar.material.emissiveIntensity=status.growlight?1.8:.2;});if(frame++%12===0){let sec=Math.floor(elapsed),hh=String(Math.floor(sec/3600)).padStart(2,'0'),mm=String(Math.floor(sec%3600/60)).padStart(2,'0'),ss=String(sec%60).padStart(2,'0');$('modelClock').textContent=hh+':'+mm+':'+ss;}controls.update();renderer.render(scene,camera);}
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