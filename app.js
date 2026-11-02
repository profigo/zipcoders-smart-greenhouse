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
let simulation=true,masterOn=true,historyTemp=[],historyHumidity=[],historySoil=[],historyLux=[],tickCount=0;
 const statsHistory=[],importedStatsRows=[];let statsHasImported=false;const statFields={temperature:"Air temperature",humidity:"Air humidity",soil_moisture:"Soil moisture",light_lux:"Light intensity"};
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
function enterGreenhouse(){$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");setupCommandCentre();pinAlert("Simulation workspace opened","Greenhouse command centre is ready. All process values are simulated.");setupRwandaMap();updateAll();startSimulation();}
$("loginForm").addEventListener("submit",e=>{e.preventDefault();if($("username").value.trim()===DEMO_USER&&$("password").value===DEMO_PASS){$("loginError").textContent="";enterGreenhouse();}else $("loginError").textContent="Incorrect demo username or password.";});
$("logout").addEventListener("click",()=>{$("app").classList.add("hidden");$("loginScreen").classList.remove("hidden");$("password").value="";});
function logActivity(title,detail){pinAlert(title,detail,/high|low|critical|failed|error/i.test(title+" "+detail)?"warning":"info");const feed=$("activityFeed"),item=document.createElement("div");item.className="activity-item";const dot=document.createElement("i"),wrap=document.createElement("div"),b=document.createElement("b"),s=document.createElement("small");b.textContent=title;s.textContent=detail;wrap.append(b,s);item.append(dot,wrap);feed.prepend(item);while(feed.children.length>5)feed.lastChild.remove();}
function setDevice(id,on,reason="manual demo control"){const changed=device[id]!==on;device[id]=on;$(id).checked=on;const labels={pump:"pumpState",fan:"fanState",growlight:"lampState"};const names={pump:"Irrigation pump",fan:"Ventilation fan",growlight:"Grow lamp"};$(labels[id]).textContent=(on?"ON":"OFF")+" · "+reason;const visual={pump:"waterVisual",fan:"fanVisual",growlight:"lampVisual"}[id];$(visual).classList.toggle("on",on);if(changed)logActivity(names[id]+" "+(on?"turned ON":"turned OFF"),reason);}
function applyAutomation(){if(!masterOn){["pump","fan","growlight"].forEach(id=>setDevice(id,false,"master system OFF"));return;}if(!$("auto").checked)return;setDevice("fan",data.temp>=30,data.temp>=30?"temperature ≥ 30°C":"temperature below 30°C");setDevice("pump",data.soil<35,data.soil<35?"soil moisture below 35%":"soil moisture adequate");setDevice("growlight",data.lux<4500,data.lux<4500?"low light detected":"natural light sufficient");}
function updateMetrics(){const t=data.temp,h=data.humidity,s=data.soil,l=data.lux;$("tempValue").textContent=t.toFixed(1);$("humidityValue").textContent=Math.round(h);$("soilValue").textContent=Math.round(s);$("luxValue").textContent=Math.round(l).toLocaleString();$("tempOut").textContent=t.toFixed(1)+"°C";$("humidityOut").textContent=Math.round(h)+"%";$("soilOut").textContent=Math.round(s)+"%";$("luxOut").textContent=Math.round(l).toLocaleString()+" lux";$("tempTest").value=t;$("humidityTest").value=h;$("soilTest").value=s;$("luxTest").value=l;
const status=(id,ok,good,bad)=>{const el=$(id);el.textContent=(ok?"● ":"● ")+(ok?good:bad);el.className=ok?"good":"bad";};status("tempStatus",t<30,"Optimal range","High · fan needed");status("humidityStatus",h>=50&&h<=85,"Optimal range","Check humidity");status("soilStatus",s>=35,"Adequate","Dry · irrigation needed");status("luxStatus",l>=4500,"Sufficient","Low light · lamp needed");$("tempBar").style.width=Math.min(100,t/42*100)+"%";$("humidityBar").style.width=h+"%";$("soilBar").style.width=s+"%";$("luxBar").style.width=Math.min(100,l/16000*100)+"%";}
function updateHealth(){let score=100-(data.temp>=30?20:0)-(data.soil<35?20:0)-(data.humidity>85||data.humidity<40?10:0)-(data.lux<3000?8:0);const label=score>=85?"Good conditions":score>=65?"Needs attention":"Critical conditions";$("healthScore").textContent=score;$("healthLabel").textContent=label;$("systemSummary").textContent=masterOn?"Virtual system powered ON":"Master system OFF";$("referenceCropScore").textContent=score+"%";$("referenceCropLabel").textContent=label.toUpperCase();$("referenceCropBar").style.width=score+"%";$("refHealthMetric").textContent=score;$("refHealthStatus").textContent="● "+label;$("refHealthBar").style.width=score+"%";$("referenceCropEnvironment").textContent=data.temp>=30||data.soil<35?"Needs attention":"Stable";let recs=[["💧","Maintain root-zone moisture",data.soil<35?"Soil moisture is below 35%. The virtual irrigation pump should activate.":"Soil moisture is currently adequate in this simulation."],["❄","Keep airflow available",data.temp>=30?"Temperature is at or above 30°C. Ventilation should activate.":"Monitor temperature; the demo fan trigger is 30°C."],["☼","Monitor canopy light",data.lux<4500?"Light is below 4,500 lux. The virtual grow lamp should activate.":"Light is currently above the demo grow-light trigger."]];["referenceRecOne","referenceRecTwo","referenceRecThree"].forEach((id,i)=>{const el=$(id);el.querySelector("i").textContent=recs[i][0];el.querySelector("b").textContent=recs[i][1];el.querySelector("p").textContent=recs[i][2];});}
function updateStatistics(){const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,n=historyTemp.length,o=Number(device.pump)+Number(device.fan)+Number(device.growlight);$("statSamples").textContent=tickCount;$("statAvgTemp").textContent=(n?avg(historyTemp):data.temp).toFixed(1)+"°C";$("statAvgHumidity").textContent=Math.round(n?avg(historyHumidity):data.humidity)+"%";$("statAvgSoil").textContent=Math.round(n?avg(historySoil):data.soil)+"%";$("statAvgLux").textContent=Math.round(n?avg(historyLux):data.lux).toLocaleString();$("statOutputs").textContent=o+" / 3";$("refActiveOutputs").textContent=o;$("refActiveBar").style.width=(o/3*100)+"%";$("statTempText").textContent=data.temp.toFixed(1)+"°C";$("statHumidityText").textContent=Math.round(data.humidity)+"%";$("statSoilText").textContent=Math.round(data.soil)+"%";$("statLuxText").textContent=Math.round(data.lux).toLocaleString()+" lux";$("statTempBar").style.width=Math.min(100,data.temp/42*100)+"%";$("statHumidityBar").style.width=data.humidity+"%";$("statSoilBar").style.width=data.soil+"%";$("statLuxBar").style.width=Math.min(100,data.lux/16000*100)+"%";let title="Conditions within example ranges",detail="Try heat, dry-soil and low-sunlight scenarios to see indicators and virtual equipment respond.";if(data.temp>=30){title="Heat stress detected";detail="Sample temperature is above the example 30°C ventilation trigger.";}else if(data.soil<35){title="Root-zone moisture is low";detail="Sample soil moisture is below the example 35% irrigation trigger.";}else if(data.humidity>85||data.humidity<40){title="Humidity outside example range";detail="Review airflow and irrigation; crop-specific limits need agronomic validation.";}else if(data.lux<4500){title="Low light condition";detail="Sample light is below the example 4,500 lux grow-light trigger.";}$("statInsightTitle").textContent=title;$("statInsightText").textContent=detail;}
function updateChart(){historyTemp.push(data.temp);historyHumidity.push(data.humidity);historySoil.push(data.soil);historyLux.push(data.lux);if(historyTemp.length>24){historyTemp.shift();historyHumidity.shift();historySoil.shift();historyLux.shift();}statsHistory.push({timestamp:new Date().toLocaleTimeString(),temperature:data.temp,humidity:data.humidity,soil_moisture:data.soil,light_lux:data.lux,source:"SIMULATION"});if(statsHistory.length>120)statsHistory.shift();const make=(arr,min,max)=>arr.map((v,i)=>{const x=45+i*(635/Math.max(1,arr.length-1)),y=190-(v-min)/(max-min)*155;return(i?"L":"M")+x.toFixed(1)+" "+y.toFixed(1)}).join(" ");$("tempPath").setAttribute("d",make(historyTemp,15,42));$("humidityPath").setAttribute("d",make(historyHumidity,20,100));updateStatistics();renderStatsChart();}
function statsRows(){return statsHasImported?importedStatsRows:statsHistory;}
function renderStatsChart(){
 const host=$("statsPlot");if(!host)return;
 const type=$("statsChartType").value,field=$("statsVariable").value,yField=$("statsYVariable").value,rows=statsRows(),values=rows.map(r=>Number(r[field])).filter(Number.isFinite),label=statFields[field],unit=field==="temperature"?"°C":field==="light_lux"?" lux":"%",fmt=v=>field==="light_lux"?Math.round(v).toLocaleString():v.toFixed(1);
 $("statsYWrap").hidden=type!=="scatter";$("statsPlotTitle").textContent=({line:label+" over time",bar:label+" by reading",histogram:label+" distribution",pie:"Reading proportions · "+label,scatter:statFields[yField]+" vs "+label,box:label+" spread and quartiles"})[type];
 $("statsPlotSubtitle").textContent=statsHasImported?"Imported CSV dataset · chronological order where available":"Live demo session · simulated readings";$("statsPointCount").textContent=values.length+" RECORDS";$("statsDataSource").textContent=statsHasImported?"CSV IMPORT · EXTERNAL DATA":"SIMULATION SAMPLE DATA";
 if(!values.length){host.innerHTML='<svg viewBox="0 0 900 330"><text x="450" y="165" text-anchor="middle" fill="#a9bfdc">No valid readings for this chart yet.</text></svg>';return;}
 const min=Math.min.apply(null,values),max=Math.max.apply(null,values),range=max-min||1,X=i=>100+i*(740/Math.max(1,values.length-1)),Y=v=>275-(v-min)/range*230;
 const axis='<g fill="#8fa9c8" font-size="12"><text x="45" y="22">'+fmt(max)+unit+'</text><text x="45" y="292">'+fmt(min)+unit+'</text></g><g stroke="#294766"><path d="M85 35H865M85 95H865M85 155H865M85 215H865M85 275H865"/></g>';
 let body="",legend="";
 if(type==="line"){
  body='<polyline fill="none" stroke="#35c879" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="'+values.map((v,i)=>X(i)+","+Y(v)).join(" ")+'"/>'+values.map((v,i)=>'<circle cx="'+X(i)+'" cy="'+Y(v)+'" r="3.5" fill="#facc15"><title>'+fmt(v)+unit+'</title></circle>').join("");legend="Trend of selected sensor readings";
 }else if(type==="bar"){
  const list=values.slice(-14),bw=Math.min(38,620/list.length);body=list.map((v,i)=>{const x=110+i*(700/list.length),h=(v-min)/range*220+8;return '<rect x="'+x+'" y="'+(275-h)+'" width="'+bw+'" height="'+h+'" rx="5" fill="#2688e8"><title>Reading '+(i+1)+': '+fmt(v)+unit+'</title></rect><text x="'+(x+bw/2)+'" y="300" text-anchor="middle" fill="#9bb7d8" font-size="10">'+(i+1)+'</text>';}).join("");legend="Each column represents one of the latest 14 records";
 }else if(type==="histogram"){
  const bins=8,counts=Array(bins).fill(0);values.forEach(v=>counts[Math.min(bins-1,Math.floor((v-min)/(range+1e-9)*bins))]++);const peak=Math.max.apply(null,counts.concat([1]));body=counts.map((n,i)=>{const w=760/bins-2,x=90+i*760/bins,h=n/peak*220;return '<rect x="'+x+'" y="'+(275-h)+'" width="'+w+'" height="'+h+'" fill="#35b779"><title>'+n+' readings</title></rect><text x="'+(x+w/2)+'" y="300" text-anchor="middle" fill="#9bb7d8" font-size="10">'+fmt(min+i*range/bins)+'</text>';}).join("");legend="Continuous values grouped into eight adjacent class intervals";
 }else if(type==="pie"){
  const bands=[values.filter(v=>v<min+range/3).length,values.filter(v=>v>=min+range/3&&v<min+2*range/3).length,values.filter(v=>v>=min+2*range/3).length],names=["Lower third","Middle third","Upper third"],colors=["#2688e8","#35b779","#facc15"];let angle=-Math.PI/2;body=bands.map((n,i)=>{const next=angle+n/values.length*Math.PI*2,x1=450+110*Math.cos(angle),y1=155+110*Math.sin(angle),x2=450+110*Math.cos(next),y2=155+110*Math.sin(next),large=next-angle>Math.PI?1:0,path=n===values.length?'<circle cx="450" cy="155" r="110" fill="'+colors[i]+'"/>':'<path d="M450 155 L'+x1+' '+y1+' A110 110 0 '+large+' 1 '+x2+' '+y2+' Z" fill="'+colors[i]+'"/>';angle=next;return path+'<text x="610" y="'+(105+i*45)+'" fill="#eaf3ff" font-size="15">'+names[i]+' · '+n+' ('+Math.round(n/values.length*100)+'%)</text>';}).join("");legend="Share of readings in lower, middle and upper thirds of this dataset";
 }else if(type==="scatter"){
  const points=rows.map(r=>({x:Number(r[field]),y:Number(r[yField])})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));if(points.length){const xmin=Math.min.apply(null,points.map(p=>p.x)),xmax=Math.max.apply(null,points.map(p=>p.x)),ymin=Math.min.apply(null,points.map(p=>p.y)),ymax=Math.max.apply(null,points.map(p=>p.y)),xr=xmax-xmin||1,yr=ymax-ymin||1;body=points.map(p=>'<circle cx="'+(100+(p.x-xmin)/xr*730)+'" cy="'+(275-(p.y-ymin)/yr*230)+'" r="5" fill="#facc15" opacity=".85"><title>'+statFields[field]+': '+p.x+' · '+statFields[yField]+': '+p.y+'</title></circle>').join("");}legend="Each dot is one record; correlation does not prove causation.";
 }else if(type==="box"){
  const sorted=values.slice().sort((a,b)=>a-b),q=p=>sorted[Math.floor((sorted.length-1)*p)],q1=q(.25),med=q(.5),q3=q(.75),lo=sorted[0],hi=sorted[sorted.length-1],sx=v=>100+(v-min)/range*730;body='<path d="M'+sx(lo)+' 155H'+sx(q1)+' M'+sx(q3)+' 155H'+sx(hi)+' M'+sx(lo)+' 125V185 M'+sx(hi)+' 125V185" stroke="#8fa9c8" stroke-width="3"/><rect x="'+sx(q1)+'" y="105" width="'+Math.max(2,sx(q3)-sx(q1))+'" height="100" fill="#176fc1" stroke="#65c5ff" stroke-width="2" rx="5"/><path d="M'+sx(med)+' 105V205" stroke="#facc15" stroke-width="4"/><g fill="#eaf3ff" font-size="12"><text x="'+sx(lo)+'" y="235" text-anchor="middle">Min</text><text x="'+sx(q1)+'" y="90" text-anchor="middle">Q1</text><text x="'+sx(med)+'" y="225" text-anchor="middle">Median</text><text x="'+sx(q3)+'" y="90" text-anchor="middle">Q3</text><text x="'+sx(hi)+'" y="235" text-anchor="middle">Max</text></g>';legend="Minimum, first quartile, median, third quartile and maximum";
 }
 host.innerHTML='<svg viewBox="0 0 900 330" role="img" aria-label="'+type+' chart for '+label+'">'+(type==="pie"?"":axis)+body+'</svg>';$("statsChartLegend").textContent=legend;
}
["statsChartType","statsVariable","statsYVariable"].forEach(id=>$(id).addEventListener("change",renderStatsChart));
window.addEventListener("zipcoders:csv-import",e=>{const list=e.detail||[];importedStatsRows.splice(0,importedStatsRows.length,...list.map(r=>({timestamp:r.timestamp,temperature:Number(r.temperature),humidity:Number(r.humidity),soil_moisture:Number(r.soil_moisture),light_lux:Number(r.light_lux),source:"CSV IMPORT"})));statsHasImported=importedStatsRows.length>0;renderStatsChart();});
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
$("resetTest").addEventListener("click",()=>{Object.assign(data,{temp:27,humidity:67,soil:54,lux:8200});historyTemp=[];historyHumidity=[];historySoil=[];historyLux=[];tickCount=0;if(!$("auto").checked){$("auto").checked=true;$("autoState").textContent="Automatic mode · threshold rules active";}if(!masterOn){masterOn=true;$("masterToggle").textContent="⏻ Turn system OFF";$("masterToggle").classList.remove("off");$("masterText").textContent="System enabled · virtual equipment can operate";$("auto").disabled=false;}updateAll();logActivity("Sensor test reset","Sample values restored");});
$("refreshAdvice").addEventListener("click",()=>{updateAdvice();logActivity("Farm adviser refreshed","Recommendations recalculated from current simulation");});
$("cropSelect").addEventListener("change",()=>{const crops={tomato:["🍅","Tomato · fruiting stage","Warm conditions, steady moisture and good airflow support healthy fruit development.","2.0–3.0 L/plant/day*","21–29°C*"],lettuce:["🥬","Lettuce · leafy growth","Cooler conditions and consistent moisture support leafy growth.","0.5–1.0 L/plant/day*","15–22°C*"],pepper:["🫑","Sweet pepper · flowering","Needs warmth, even watering and airflow for flowering and fruit set.","1.5–2.5 L/plant/day*","20–28°C*"],cucumber:["🥒","Cucumber · fruit development","Warm-season vine crop; benefits from even moisture, support and airflow.","1.5–2.5 L/plant/day*","22–28°C*"],spinach:["🥬","Spinach · leafy growth","Cool-season leafy crop; avoid excessive heat and keep moisture steady.","0.5–1.0 L/plant/day*","15–20°C*"],kale:["🥬","Kale · leaf production","Hardy leafy crop preferring moderate temperatures and regular watering.","0.7–1.2 L/plant/day*","15–24°C*"],cabbage:["🥬","Cabbage · head formation","Requires steady moisture and suitable spacing as the head develops.","1.0–2.0 L/plant/day*","15–20°C*"],eggplant:["🍆","Eggplant · fruiting stage","Warm-season crop needing warmth, consistent irrigation and drainage.","1.5–2.5 L/plant/day*","22–30°C*"],strawberry:["🍓","Strawberry · flowering and fruit","Benefits from careful irrigation, good drainage and moderate temperatures.","0.5–1.0 L/plant/day*","18–24°C*"],greenbean:["🫘","Green bean · pod development","Needs regular moisture during flowering and pod filling; avoid waterlogging.","1.0–1.8 L/plant/day*","18–27°C*"],carrot:["🥕","Carrot · root development","Loose soil and even moisture help roots develop uniformly.","0.5–1.0 L/plant/day*","16–22°C*"]};const c=crops[$("cropSelect").value];$("cropEmoji").textContent=c[0];$("cropName").textContent=c[1];$("cropDesc").textContent=c[2];$("cropWater").textContent=c[3];$("cropTemp").textContent=c[4];$("referenceCropName").textContent=c[1].split(" · ")[0];});
document.querySelectorAll(".nav").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));a.classList.add("active");}));
updateAll();