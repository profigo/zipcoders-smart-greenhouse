const $=id=>document.getElementById(id);
// Full-screen command centre and persistent action alerts.
let alertAudioContext=null,alertSoundEnabled=false;
function playAlertTone(severity="warning"){
 if(!alertSoundEnabled||!alertAudioContext)return;
 try{
  const now=alertAudioContext.currentTime;
  const count=severity==="critical"?3:2;
  for(let i=0;i<count;i++){
   const osc=alertAudioContext.createOscillator(),gain=alertAudioContext.createGain();
   osc.type="sine";osc.frequency.value=severity==="critical"?880:660;
   gain.gain.setValueAtTime(.0001,now+i*.22);
   gain.gain.exponentialRampToValueAtTime(.16,now+i*.22+.025);
   gain.gain.exponentialRampToValueAtTime(.0001,now+i*.22+.16);
   osc.connect(gain);gain.connect(alertAudioContext.destination);
   osc.start(now+i*.22);osc.stop(now+i*.22+.18);
  }
 }catch(e){console.warn("Alert sound unavailable",e);}
}
function setupCommandCentre(){
 const appRoot=$("app");
 if(!appRoot)return;
 const actions=document.querySelector(".top-actions");
 if(actions&&!$("fullScreenToggle")){
  const full=document.createElement("button");
  full.id="fullScreenToggle";full.className="fullscreen-toggle";full.type="button";
  full.innerHTML='<span>⛶</span> WORKSPACE FULL SCREEN';
  full.addEventListener("click",async()=>{
   try{if(document.fullscreenElement){await document.exitFullscreen();}else{await appRoot.requestFullscreen({navigationUI:"hide"});}}
   catch(err){pinAlert("Fullscreen unavailable",err.message,"warning");}
  });
  actions.prepend(full);
 }
 const viewToolbar=document.querySelector("#digitalTwin .industrial-heading");
 if(viewToolbar&&!$("viewOnlyFullScreenToggle")){
  const viewFull=document.createElement("button");
  viewFull.id="viewOnlyFullScreenToggle";viewFull.className="twin-tool view-fullscreen-tool";viewFull.type="button";
  viewFull.textContent="⛶ FULLSCREEN 3D VIEW";
  viewFull.addEventListener("click",async()=>{
   const view=document.querySelector("#digitalTwin .industrial-view");
   try{
    if(document.fullscreenElement===view){await document.exitFullscreen();}
    else{if(document.fullscreenElement)await document.exitFullscreen();await view.requestFullscreen({navigationUI:"hide"});}
   }catch(err){pinAlert("3D view fullscreen unavailable",err.message,"warning");}
  });
  viewToolbar.append(viewFull);
 }
 const toolbar=document.querySelector("#digitalTwin .toolbar-right");
 if(toolbar&&!$("sceneFullScreenToggle")){
  const sceneFull=document.createElement("button");
  sceneFull.id="sceneFullScreenToggle";sceneFull.className="twin-tool";sceneFull.type="button";
  sceneFull.textContent="⛶ FULLSCREEN GREENHOUSE";
  sceneFull.addEventListener("click",async()=>{
   const scene=$("digitalTwin");
   try{
    if(document.fullscreenElement===scene){await document.exitFullscreen();}
    else{if(document.fullscreenElement)await document.exitFullscreen();await scene.requestFullscreen({navigationUI:"hide"});}
   }catch(err){pinAlert("Greenhouse fullscreen unavailable",err.message,"warning");}
  });
  toolbar.append(sceneFull);
 }
 if(!$("pinnedAlerts")){
  const stack=document.createElement("section");
  stack.id="pinnedAlerts";stack.className="pinned-alerts";
  stack.setAttribute("aria-live","assertive");stack.setAttribute("aria-label","Pinned system alerts");
  stack.innerHTML='<div class="pinned-alerts-head"><b>LIVE ALERTS</b><div class="alert-head-actions"><button type="button" id="alertSoundToggle" aria-pressed="false">🔇 SOUND OFF</button><button type="button" id="clearPinnedAlerts">CLEAR ALL</button></div></div><div id="pinnedAlertList"></div>';
  ($('digitalTwin')||appRoot).append(stack);
  $("clearPinnedAlerts").addEventListener("click",()=>{$("pinnedAlertList").replaceChildren();});
  $("alertSoundToggle").addEventListener("click",async()=>{
   try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx){pinAlert("Audio not supported","This browser does not support alert audio.","warning");return;}
    if(!alertAudioContext)alertAudioContext=new AudioCtx();
    if(alertAudioContext.state==="suspended")await alertAudioContext.resume();
    alertSoundEnabled=!alertSoundEnabled;
    $("alertSoundToggle").textContent=alertSoundEnabled?"🔊 SOUND ON":"🔇 SOUND OFF";
    $("alertSoundToggle").setAttribute("aria-pressed",String(alertSoundEnabled));
    if(alertSoundEnabled)playAlertTone("info");
   }catch(err){pinAlert("Audio permission needed",err.message,"warning");}
  });
 }
 document.addEventListener("fullscreenchange",()=>{
  const active=!!document.fullscreenElement;
  const sceneActive=document.fullscreenElement===$("digitalTwin");
  const viewActive=document.fullscreenElement===document.querySelector("#digitalTwin .industrial-view");
  const viewFull=$("viewOnlyFullScreenToggle");
  if(viewFull)viewFull.textContent=viewActive?"⛶ EXIT 3D VIEW":"⛶ FULLSCREEN 3D VIEW";
  const full=$("fullScreenToggle"),sceneFull=$("sceneFullScreenToggle");
  if(full)full.innerHTML=active&&!sceneActive?'<span>⛶</span> EXIT WORKSPACE FULL SCREEN':'<span>⛶</span> WORKSPACE FULL SCREEN';
  if(sceneFull)sceneFull.textContent=sceneActive?"⛶ EXIT GREENHOUSE FULLSCREEN":"⛶ FULLSCREEN GREENHOUSE";
  appRoot.classList.toggle("is-fullscreen",active&&!sceneActive);
 });
}
function pinAlert(title,detail,severity="info"){
 setupCommandCentre();
 const list=$("pinnedAlertList");if(!list)return;
 const item=document.createElement("article");
 item.className="pinned-alert "+(severity==="critical"?"is-critical":severity==="warning"?"is-warning":"is-info");
 const head=document.createElement("div");head.className="pinned-alert-title";
 const dot=document.createElement("i"),label=document.createElement("b");label.textContent=title;
 const close=document.createElement("button");close.type="button";close.textContent="×";close.setAttribute("aria-label","Close alert");
 close.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();item.remove();});
 head.append(dot,label,close);
 const message=document.createElement("p");message.textContent=detail;
 const meta=document.createElement("small");meta.textContent=new Date().toLocaleTimeString()+" · "+severity.toUpperCase();
 item.append(head,message,meta);list.prepend(item);
 while(list.children.length>6)list.lastElementChild.remove();
 if(severity==="warning"||severity==="critical")playAlertTone(severity);
}
window.zipcodersPinnedAlert=(title,detail,critical=false)=>pinAlert(title,detail,critical?"critical":"warning");

const DEMO_USER="admin",DEMO_PASS="green2026";
let simulation=true,masterOn=true,historyTemp=[],historyHumidity=[],tickCount=0;
const data={temp:27,humidity:67,soil:54,lux:8200};
const device={pump:false,fan:false,growlight:false};
let rwandaMap=null;
function setupRwandaMap(){
 const host=$("rwandaLiveMap");
 if(!host||rwandaMap||!window.L)return;
 rwandaMap=L.map(host,{scrollWheelZoom:false}).setView([-1.94,29.87],8);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(rwandaMap);
 const sites=[
  {name:"Nyagatare",province:"Eastern Province",lat:-1.297,lon:30.328,kind:"Priority for climate-resilience assessment",note:"Eastern Rwanda is highlighted in climate-vulnerability reporting; assess water harvesting and efficient irrigation needs."},
  {name:"Gatsibo",province:"Eastern Province",lat:-1.565,lon:30.435,kind:"Priority for climate-resilience assessment",note:"Eastern Province is exposed to dry spells; consider irrigation access and water-smart growing systems."},
  {name:"Kayonza",province:"Eastern Province",lat:-1.879,lon:30.657,kind:"Irrigation and watershed focus",note:"Kayonza has established irrigation and watershed initiatives; assess opportunities for efficient protected horticulture."},
  {name:"Kirehe",province:"Eastern Province",lat:-2.263,lon:30.653,kind:"Priority for irrigation assessment",note:"A documented focus area for drought resilience and irrigation development."},
  {name:"Gisagara",province:"Southern Province",lat:-2.58,lon:29.76,kind:"Priority for climate-resilience assessment",note:"Southern Province is included in recent reporting on climate vulnerability and agricultural adaptation needs."},
  {name:"Bugesera",province:"Eastern Province",lat:-2.22,lon:30.10,kind:"Priority for irrigation assessment",note:"An eastern agricultural district where water-smart farming and irrigation suitability merit field assessment."},
  {name:"Musanze",province:"Northern Province",lat:-1.50,lon:29.63,kind:"Additional horticulture location",note:"A northern highland agriculture location; assess local crop, elevation and protected-cultivation suitability."}
 ];
 const high=L.divIcon({className:"map-marker-wrap",html:'<span class="map-marker map-marker-high"></span>',iconSize:[20,20],iconAnchor:[10,10]});
 const support=L.divIcon({className:"map-marker-wrap",html:'<span class="map-marker map-marker-support"></span>',iconSize:[18,18],iconAnchor:[9,9]});
 sites.forEach(site=>{
  const marker=L.marker([site.lat,site.lon],{icon:site.kind.includes("Additional")?support:high}).addTo(rwandaMap);
  marker.bindPopup('<div class="rwanda-popup"><b>'+site.name+'</b><small>'+site.province+'</small><strong>'+site.kind+'</strong><p>'+site.note+'</p></div>');
  site.marker=marker;
 });
 const list=$("mapLocationList");
 if(list)list.addEventListener("click",e=>{
  const btn=e.target.closest("[data-map]");if(!btn)return;
  const site=sites.find(x=>x.name===btn.dataset.map);if(site){rwandaMap.setView([site.lat,site.lon],11,{animate:true});site.marker.openPopup();}
 });
 window.addEventListener("resize",()=>{if(rwandaMap)rwandaMap.invalidateSize();});
 setTimeout(()=>rwandaMap&&rwandaMap.invalidateSize(),250);
}
let introScene=0,introTimer=null;
const introSlides=[
 ["THE FUTURE OF FARMING","Grow smarter. Waste less.","Discover how ZIPCODERS brings connected monitoring, intelligent control and practical digital tools into greenhouse farming."],
 ["01 · MONITOR THE ENVIRONMENT","See what your crops need.","Explore a digital greenhouse concept with temperature, humidity, soil-moisture and light monitoring in one workspace."],
 ["02 · RESPOND WITH CONTROL","From insight to action.","Demonstrate how rule-based automation can model irrigation, ventilation and grow-light responses to changing conditions."],
 ["03 · BUILT FOR A SMARTER FUTURE","Technology for resilient growing.","Our project demonstrates a practical direction for data-informed greenhouse management and more deliberate use of farm resources."]
];
function renderIntro(){const s=introSlides[introScene];$("introKicker").textContent=s[0];$("introTitle").textContent=s[1];$("introText").textContent=s[2];$("introCounter").textContent=String(introScene+1).padStart(2,"0")+" / 04";$("introProgress").style.width=((introScene+1)*25)+"%";document.querySelectorAll(".intro-chapters span").forEach((el,i)=>el.classList.toggle("active",i===introScene));}
function stopIntro(){if(introTimer){clearInterval(introTimer);introTimer=null;}}
function enterGreenhouse(){stopIntro();$("projectIntro").classList.add("hidden");$("app").classList.remove("hidden");setupCommandCentre();pinAlert("Simulation workspace opened","Greenhouse command centre is ready. All process values are simulated.");setupRwandaMap();updateAll();startSimulation();}
function showProjectIntro(){$("loginScreen").classList.add("hidden");$("projectIntro").classList.remove("hidden");introScene=0;renderIntro();stopIntro();introTimer=setInterval(()=>{if(introScene<3){introScene++;renderIntro();}else stopIntro();},6500);}
$("loginForm").addEventListener("submit",e=>{e.preventDefault();if($("username").value.trim()===DEMO_USER&&$("password").value===DEMO_PASS){$("loginError").textContent="";showProjectIntro();}else $("loginError").textContent="Incorrect demo username or password.";});
$("introContinue").addEventListener("click",enterGreenhouse);
$("introSkip").addEventListener("click",enterGreenhouse);
$("logout").addEventListener("click",()=>{stopIntro();$("app").classList.add("hidden");$("projectIntro").classList.add("hidden");$("loginScreen").classList.remove("hidden");$("password").value="";});
function logActivity(title,detail){pinAlert(title,detail,/high|low|critical|failed|error/i.test(title+" "+detail)?"warning":"info");const feed=$("activityFeed"),item=document.createElement("div");item.className="activity-item";const dot=document.createElement("i"),wrap=document.createElement("div"),b=document.createElement("b"),s=document.createElement("small");b.textContent=title;s.textContent=detail;wrap.append(b,s);item.append(dot,wrap);feed.prepend(item);while(feed.children.length>5)feed.lastChild.remove();}
function setDevice(id,on,reason="manual demo control"){const changed=device[id]!==on;device[id]=on;$(id).checked=on;const labels={pump:"pumpState",fan:"fanState",growlight:"lampState"};const names={pump:"Irrigation pump",fan:"Ventilation fan",growlight:"Grow lamp"};$(labels[id]).textContent=(on?"ON":"OFF")+" · "+reason;const visual={pump:"waterVisual",fan:"fanVisual",growlight:"lampVisual"}[id];$(visual).classList.toggle("on",on);if(changed)logActivity(names[id]+" "+(on?"turned ON":"turned OFF"),reason);}
function applyAutomation(){if(!masterOn){["pump","fan","growlight"].forEach(id=>setDevice(id,false,"master system OFF"));return;}if(!$("auto").checked)return;setDevice("fan",data.temp>=30,data.temp>=30?"temperature ≥ 30°C":"temperature below 30°C");setDevice("pump",data.soil<35,data.soil<35?"soil moisture below 35%":"soil moisture adequate");setDevice("growlight",data.lux<4500,data.lux<4500?"low light detected":"natural light sufficient");}
function updateMetrics(){const t=data.temp,h=data.humidity,s=data.soil,l=data.lux;$("tempValue").textContent=t.toFixed(1);$("humidityValue").textContent=Math.round(h);$("soilValue").textContent=Math.round(s);$("luxValue").textContent=Math.round(l).toLocaleString();$("tempOut").textContent=t.toFixed(1)+"°C";$("humidityOut").textContent=Math.round(h)+"%";$("soilOut").textContent=Math.round(s)+"%";$("luxOut").textContent=Math.round(l).toLocaleString()+" lux";$("tempTest").value=t;$("humidityTest").value=h;$("soilTest").value=s;$("luxTest").value=l;
const status=(id,ok,good,bad)=>{const el=$(id);el.textContent=(ok?"● ":"● ")+(ok?good:bad);el.className=ok?"good":"bad";};status("tempStatus",t<30,"Optimal range","High · fan needed");status("humidityStatus",h>=50&&h<=85,"Optimal range","Check humidity");status("soilStatus",s>=35,"Adequate","Dry · irrigation needed");status("luxStatus",l>=4500,"Sufficient","Low light · lamp needed");$("tempBar").style.width=Math.min(100,t/42*100)+"%";$("humidityBar").style.width=h+"%";$("soilBar").style.width=s+"%";$("luxBar").style.width=Math.min(100,l/16000*100)+"%";}
function updateHealth(){let score=100-(data.temp>=30?20:0)-(data.soil<35?20:0)-(data.humidity>85||data.humidity<40?10:0)-(data.lux<3000?8:0);$("healthScore").textContent=score;$("healthLabel").textContent=score>=85?"Good conditions":score>=65?"Needs attention":"Critical conditions";$("systemSummary").textContent=masterOn?"Virtual system powered ON":"Master system OFF";}
function updateChart(){historyTemp.push(data.temp);historyHumidity.push(data.humidity);if(historyTemp.length>12){historyTemp.shift();historyHumidity.shift();}const make=(arr,min,max)=>arr.map((v,i)=>{const x=45+i*(635/Math.max(1,arr.length-1)),y=190-(v-min)/(max-min)*155;return(i?"L":"M")+x.toFixed(1)+" "+y.toFixed(1)}).join(" ");$("tempPath").setAttribute("d",make(historyTemp,15,42));$("humidityPath").setAttribute("d",make(historyHumidity,20,100));}
function updateAdvice(){let title="Conditions are within the example comfort range.",body="Keep observing the greenhouse. Automatic mode can respond to changing temperature, soil moisture and light.";if(data.temp>=30){title="Temperature is high — ventilation recommended.";body="The simulated temperature is "+data.temp.toFixed(1)+"°C. The automatic controller starts the fan at 30°C to model heat management.";}else if(data.soil<35){title="Soil moisture is low — irrigation recommended.";body="Soil moisture is "+Math.round(data.soil)+"%. The demo pump starts below 35% to represent demand-based watering.";}else if(data.lux<4500){title="Light level is low — grow lamp recommended.";body="The sample light reading is "+Math.round(data.lux)+" lux. The automatic controller switches on the grow lamp below 4,500 lux.";}else if(data.humidity>85){title="Humidity is elevated — inspect airflow.";body="High humidity can increase disease pressure in some crops. Check ventilation and avoid overwatering.";}$("adviceTitle").textContent=title;$("adviceText").textContent=body;$("adviceTime").textContent="Updated from current demo values";}
const alarmState={};
function checkThresholdAlerts(){
 const checks=[
  ["temperature",data.temp>=30,"High greenhouse temperature",()=>data.temp.toFixed(1)+"°C detected. Ventilation is recommended."],
  ["soil",data.soil<35,"Low root-zone moisture",()=>Math.round(data.soil)+"% soil moisture. Irrigation is recommended."],
  ["humidity",data.humidity>85||data.humidity<40,"Humidity outside target range",()=>Math.round(data.humidity)+"% relative humidity. Check airflow and crop conditions."],
  ["light",data.lux<4500,"Low greenhouse light",()=>Math.round(data.lux)+" lux detected. Supplemental lighting may be needed."]
 ];
 checks.forEach(([key,active,title,detail])=>{
  if(active&&!alarmState[key]){alarmState[key]=true;pinAlert(title,detail(),"warning");}
  else if(!active&&alarmState[key]){alarmState[key]=false;pinAlert(title+" · condition cleared","The simulated "+key+" reading has returned to its configured range.","info");}
 });
}
function updateAll(){updateMetrics();updateHealth();applyAutomation();updateChart();updateAdvice();checkThresholdAlerts();}
function randomTick(){if(!simulation||!masterOn&&false)return;data.temp=Math.max(18,Math.min(39,data.temp+(Math.random()-.48)*1.2));data.humidity=Math.max(35,Math.min(95,data.humidity+(Math.random()-.5)*4));data.soil=Math.max(15,Math.min(85,data.soil-(device.pump?-.8:.18)+ (Math.random()-.5)*.7));data.lux=Math.max(1000,Math.min(15000,data.lux+(Math.random()-.5)*600));tickCount++;updateAll();$("snapshot").textContent="● SIMULATION ACTIVE · SAMPLE "+tickCount;}
let timer=null;function startSimulation(){if(timer)clearInterval(timer);timer=setInterval(randomTick,3500);}
["temp","humidity","soil","lux"].forEach(key=>{const id={temp:"tempTest",humidity:"humidityTest",soil:"soilTest",lux:"luxTest"}[key];$(id).addEventListener("input",()=>{data[key]=Number($(id).value);updateAll();logActivity("Sensor test adjusted",key+" set to "+$(id).value);});});
["pump","fan","growlight"].forEach(id=>$(id).addEventListener("change",()=>{if(!masterOn){$(id).checked=false;return;}if($("auto").checked){$("auto").checked=false;$("autoState").textContent="Manual mode · operator controls equipment";}setDevice(id,$(id).checked,"manual operator command");updateHealth();}));
$("auto").addEventListener("change",()=>{$("autoState").textContent=$("auto").checked?"Automatic mode · threshold rules active":"Manual mode · operator controls equipment";if($("auto").checked){logActivity("Automatic mode enabled","Threshold rules are now controlling virtual equipment");updateAll();}else logActivity("Manual mode enabled","Use individual equipment switches");});
$("masterToggle").addEventListener("click",()=>{masterOn=!masterOn;$("masterToggle").textContent=masterOn?"⏻ Turn system OFF":"⏻ Turn system ON";$("masterToggle").classList.toggle("off",!masterOn);$("masterText").textContent=masterOn?"System enabled · virtual equipment can operate":"System disabled · all virtual equipment switched OFF";$("auto").disabled=!masterOn;applyAutomation();updateHealth();logActivity("Master system "+(masterOn?"ON":"OFF"),masterOn?"Virtual controls enabled":"All virtual accessories turned off");});
$("simulationToggle").addEventListener("click",()=>{simulation=!simulation;$("simulationToggle").textContent=simulation?"Ⅱ Pause changing data":"▶ Resume changing data";$("simulationState").textContent=simulation?"Changing demo data ON":"Changing demo data PAUSED";$("snapshot").textContent=simulation?"● SIMULATION ACTIVE":"Ⅱ SIMULATION PAUSED";});
$("resetTest").addEventListener("click",()=>{Object.assign(data,{temp:27,humidity:67,soil:54,lux:8200});historyTemp=[];historyHumidity=[];if(!$("auto").checked){$("auto").checked=true;$("autoState").textContent="Automatic mode · threshold rules active";}if(!masterOn){masterOn=true;$("masterToggle").textContent="⏻ Turn system OFF";$("masterToggle").classList.remove("off");$("masterText").textContent="System enabled · virtual equipment can operate";$("auto").disabled=false;}updateAll();logActivity("Sensor test reset","Sample values restored");});
$("refreshAdvice").addEventListener("click",()=>{updateAdvice();logActivity("Farm adviser refreshed","Recommendations recalculated from current simulation");});
$("cropSelect").addEventListener("change",()=>{const crops={tomato:{emoji:"🍅",name:"Tomato · fruiting stage",desc:"Warm conditions, steady moisture and good airflow support healthy fruit development.",water:"2.0–3.0 L/plant/day*",temp:"21–29°C*"},lettuce:{emoji:"🥬",name:"Lettuce · leafy growth",desc:"Prefers cooler conditions, consistent moisture and protection from excessive heat.",water:"0.5–1.0 L/plant/day*",temp:"15–22°C*"},pepper:{emoji:"🫑",name:"Sweet pepper · flowering",desc:"Needs warmth, even watering and airflow to support flowering and fruit set.",water:"1.5–2.5 L/plant/day*",temp:"20–28°C*"}};const c=crops[$("cropSelect").value];$("cropEmoji").textContent=c.emoji;$("cropName").textContent=c.name;$("cropDesc").textContent=c.desc;$("cropWater").textContent=c.water;$("cropTemp").textContent=c.temp;});
document.querySelectorAll(".nav").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));a.classList.add("active");}));
updateAll();