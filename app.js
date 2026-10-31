const $=id=>document.getElementById(id);
const DEMO_USER="admin",DEMO_PASS="green2026";
function showApp(){ $("loginScreen").classList.add("hidden");$("app").classList.remove("hidden"); }
$("loginForm").addEventListener("submit",e=>{e.preventDefault();const u=$("username").value.trim(),p=$("password").value;if(u===DEMO_USER&&p===DEMO_PASS){$("loginError").textContent="";showApp();}else{$("loginError").textContent="Incorrect demo username or password. Please try again."; }});
$("logout").addEventListener("click",()=>{$("app").classList.add("hidden");$("loginScreen").classList.remove("hidden");$("password").value="";});
const devices=[["pump","pumpState","Irrigation pump"],["fan","fanState","Ventilation fan"],["growlight","lightState","Grow lights"]];
devices.forEach(([id,state,name])=>{$(id).addEventListener("change",()=>{$(state).textContent="Currently "+($(id).checked?"ON":"OFF")+" · demo switch";});});
$("auto").addEventListener("change",()=>{$("autoState").textContent=$("auto").checked?"Rule suggestions enabled in demo":"Manual demonstration mode";});
document.querySelectorAll(".nav").forEach(link=>link.addEventListener("click",()=>{document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));link.classList.add("active");}));
/* All dashboard readings and chart values are intentionally fixed sample data.
   Login and device switches are front-end demonstration interactions only.
   This is not production authentication and does not control physical hardware. */