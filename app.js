(function(){
const HOSPITALS=["Civil Hospital, Surat","SMIMER Hospital, Surat","Kiran Hospital, Surat"];
const GROUPS=["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const SAMPLE=[
 {name:"Rahul S.",km:1.2,eta:8,v:true,last:"5 months ago",n:6,ph:"98XXXXXX21"},
 {name:"Priya M.",km:2.1,eta:12,v:true,last:"4 months ago",n:3,ph:"97XXXXXX84"},
 {name:"Kunal D.",km:2.8,eta:15,v:false,last:"Not shared",n:0,ph:"99XXXXXX07"},
 {name:"Neha P.",km:3.4,eta:18,v:true,last:"8 months ago",n:9,ph:"90XXXXXX63"},
 {name:"Amit V.",km:4.6,eta:24,v:false,last:"Not shared",n:0,ph:"88XXXXXX15"},
 {name:"Sana K.",km:6.3,eta:28,v:true,last:"6 months ago",n:2,ph:"96XXXXXX40"},
 {name:"Dev J.",km:8.1,eta:35,v:true,last:"1 year ago",n:5,ph:"93XXXXXX72"}
];
let S,timers=[];
function fresh(){S={mode:S?S.mode:"req",screen:"home",group:null,units:1,taps:0,h:0,radius:5,donors:[],sel:null,d:"incoming"};}
const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shield='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>';
const info='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>';
const badge=d=>d.v?`<span class="vb y">${shield}Verified</span>`:`<span class="vb n">${info}Not verified yet</span>`;

function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2200);}
function tap(){S.taps++;$("#taps").textContent=S.taps;}
function clearT(){timers.forEach(clearTimeout);timers=[];}

/* ---------- requester screens ---------- */
function home(){
  return `<header class="bar"><h2>Need blood</h2><a class="amb" href="tel:108">Call ambulance 108</a></header>
  <div class="body">
    <div class="where"><span class="lbl">At</span><strong>${esc(HOSPITALS[S.h])}</strong><button class="link" data-act="where">Change</button></div>
    <h3 id="gl">Which blood group?</h3>
    <div class="grid" role="group" aria-labelledby="gl">
      ${GROUPS.map(g=>`<button class="bg" data-act="group" data-g="${g}" aria-pressed="${S.group===g}">${g}</button>`).join("")}
    </div>
    <h3>Units needed</h3>
    <div class="units"><span>Blood units</span><div class="step">
      <button data-act="unit" data-d="-1" aria-label="Fewer units">-</button><span aria-live="polite">${S.units}</span><button data-act="unit" data-d="1" aria-label="More units">+</button></div></div>
  </div>
  <div class="foot">
    <button class="btn red" data-act="send" ${S.group?"":"disabled"}>${S.group?`Send request for ${S.group}`:"Pick a blood group first"}</button>
    <p class="note">Donors within 5 km are alerted at once. Your number stays hidden until a donor accepts.</p>
  </div>`;
}
function acceptedList(){return S.donors.filter(d=>d.st==="accepted");}
function waiting(){
  const acc=acceptedList(),seen=S.donors.length;
  const order=[...S.donors].sort((a,b)=>(b.st==="accepted")-(a.st==="accepted")||a.km-b.km);
  const first=acc[0];
  return `<header class="bar"><h2>Request sent</h2><span class="chip">${S.group}</span></header>
  <div class="body">
    <p class="sum">${S.units} unit${S.units>1?"s":""} at ${esc(HOSPITALS[S.h])}</p>
    <div class="status" aria-live="polite"><b>${acc.length} accepted, ${seen} alerted</b><span>${acc.length?"Call the nearest donor now.":"Searching within "+S.radius+" km. Replies show here."}</span>
      <div class="bar-prog" aria-hidden="true"><i style="width:${Math.min(100,acc.length*50)}%"></i></div></div>
    ${order.map(d=>`<button class="card ${d.st==="accepted"?"acc":""}" data-act="open" data-i="${d.i}">
      <div class="top"><span class="name">${esc(d.name)}</span>${pill(d)}</div>
      <div class="meta">${d.km} km away${d.st==="accepted"?", about "+d.eta+" min":""} | Last gave blood: ${esc(d.last)}</div>${badge(d)}</button>`).join("")}
  </div>
  <div class="foot">
    ${first?`<button class="btn red" data-act="call" data-i="${first.i}">Call ${esc(first.name)}</button>
    <button class="btn line" data-act="received">Blood received, close request</button>`
    :`<button class="btn line" data-act="widen" ${S.radius>5?"disabled":""}>${S.radius>5?"Searching 10 km":"Widen search to 10 km"}</button>
    <button class="btn plain" data-act="cancel">Cancel request</button>`}
  </div>`;
}
function pill(d){
  if(d.st==="accepted")return '<span class="pill ok">Accepted</span>';
  if(d.st==="declined")return '<span class="pill no">Can\'t come</span>';
  if(d.st==="seen")return '<span class="pill wait">Seen</span>';
  return '<span class="pill wait">Alerted</span>';
}
function detail(){
  const d=S.donors[S.sel],ok=d.st==="accepted";
  return `<header class="bar"><h2>Donor</h2></header>
  <div class="body sheet">
    <h2>${esc(d.name)}</h2>${badge(d)}
    <div class="box"><b>${d.km} km away</b>${ok?`, about ${d.eta} min`:""}<br>Blood group ${S.group}<br>Last gave blood: ${esc(d.last)}${d.n?"<br>Donations on record: "+d.n:""}</div>
    ${d.v?`<div class="box"><b>Why Verified</b><ul><li>Phone number confirmed by OTP</li><li>ID checked</li><li>Past donation logged by a blood bank</li></ul></div>`
      :`<div class="box warn"><b>Not verified yet</b><br>Call and confirm blood group before they travel.</div>`}
    <div class="box"><b>Phone</b><br>${ok?`<span>${esc(d.ph.replace("XXXXXX","5550"))}</span>`:`<span class="mask">${esc(d.ph)}</span><br><small>Shown after the donor accepts.</small>`}</div>
  </div>
  <div class="foot">${ok?`<button class="btn red" data-act="call" data-i="${d.i}">Call ${esc(d.name)}</button>`:""}
    <button class="btn line" data-act="back">Back to donors</button></div>`;
}
function closed(){
  return `<header class="bar"><h2>Request closed</h2></header>
  <div class="body center"><p class="big" style="margin-top:40px;color:var(--green)">Done</p>
    <p style="margin-top:16px">Glad you got the blood.</p>
    <p class="note" style="margin-top:8px">A quick thanks tells donors their effort mattered.</p></div>
  <div class="foot"><button class="btn green" data-act="thanks">Send thanks to donors</button>
    <button class="btn line" data-act="restart">Start a new request</button></div>`;
}

/* ---------- donor screens ---------- */
function donorView(){
  if(S.d==="incoming")return `<header class="bar"><h2>Blood needed near you</h2></header>
  <div class="body center">
    <p class="big" style="margin-top:20px">B+</p>
    <p style="font-size:22px;font-weight:700;margin-top:8px">1 unit at Civil Hospital, Surat</p>
    <p class="note" style="margin-top:6px">3.2 km from you | asked 6 min ago</p>
    <div class="box" style="text-align:left"><span class="vb y">${shield}You can donate</span><br>Your last donation was 4 months ago.</div>
  </div>
  <div class="foot"><div class="row"><button class="btn red" data-act="dyes">I can donate</button><button class="btn line" data-act="dno">Not now</button></div>
    <p class="note">Saying no is fine. You will not be asked why.</p></div>`;
  if(S.d==="yes")return `<header class="bar"><h2>Thank you</h2></header>
  <div class="body"><div class="box"><b>Kavita R.</b> is waiting at Civil Hospital, Surat.<br>Ask for the blood bank desk, ground floor.</div>
    <div class="box"><b>Phone</b><br>98765 55501</div>
    <p class="note">Sample data. Your number is shared with the requester now.</p></div>
  <div class="foot"><button class="btn red" data-act="toast" data-m="Directions would open here">Open directions</button>
    <button class="btn line" data-act="toast" data-m="Calling Kavita R. (sample)">Call Kavita R.</button>
    <button class="btn plain" data-act="dundo">Change my answer</button></div>`;
  return `<header class="bar"><h2>Okay</h2></header>
  <div class="body center"><p style="margin-top:50px;font-size:22px">We will ask someone else.</p>
    <p class="note" style="margin-top:8px">You can still help later from the home screen.</p></div>
  <div class="foot"><button class="btn line" data-act="dundo">Undo, I can donate</button></div>`;
}

function render(){
  const el=$("#screen");let h;
  if(S.mode==="donor")h=donorView();
  else h={home,waiting,detail,closed}[S.screen]();
  el.innerHTML=h;
  const b=el.querySelector(".body");if(b&&S.screen==="waiting")b.scrollTop=0;
  document.querySelectorAll(".seg button").forEach(x=>x.classList.toggle("on",x.dataset.v===S.mode));
}

/* ---------- simulation ---------- */
function startSim(){
  clearT();
  const n=S.radius>5?7:5;
  S.donors=SAMPLE.filter(d=>d.km<=S.radius).slice(0,n).map((d,i)=>({...d,i,st:"alerted"}));
  const plan=[[1200,0,"seen"],[2600,0,"accepted"],[3200,1,"seen"],[4300,2,"declined"],[5200,1,"accepted"],[6200,3,"seen"]];
  plan.forEach(([t,i,st])=>timers.push(setTimeout(()=>{
    if(S.donors[i]&&S.mode==="req"&&S.screen!=="home"){S.donors[i].st=st;if(S.screen==="waiting"||S.screen==="detail"&&S.sel!==i){render();} else render();
      if(st==="accepted")toast(S.donors[i].name+" is coming");}
  },t)));
}
function widen(){
  S.radius=10;
  SAMPLE.filter(d=>d.km>5&&d.km<=10).forEach(d=>S.donors.push({...d,i:S.donors.length,st:"alerted"}));
  timers.push(setTimeout(()=>{const x=S.donors.find(d=>d.km>5&&d.st==="alerted");if(x){x.st="accepted";render();toast(x.name+" is coming");}},2500));
}

/* ---------- events ---------- */
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b)return;
  const a=b.dataset.act;
  if(a==="mode"){S.mode=b.dataset.v;S.d="incoming";render();return;}
  if(a==="restart"){clearT();S=null;fresh();$("#taps").textContent=0;render();return;}
  if(a==="group"){tap();S.group=b.dataset.g;render();return;}
  if(a==="unit"){S.units=Math.max(1,Math.min(6,S.units+ +b.dataset.d));render();return;}
  if(a==="where"){S.h=(S.h+1)%HOSPITALS.length;render();return;}
  if(a==="send"){tap();S.screen="waiting";render();startSim();return;}
  if(a==="open"){S.sel=+b.dataset.i;S.screen="detail";render();return;}
  if(a==="back"){S.screen="waiting";render();return;}
  if(a==="call"){toast("Calling "+S.donors[+b.dataset.i].name+" (sample)");return;}
  if(a==="widen"){widen();render();toast("Searching up to 10 km");return;}
  if(a==="cancel"){clearT();S.screen="home";render();toast("Request cancelled");return;}
  if(a==="received"){clearT();S.screen="closed";render();return;}
  if(a==="thanks"){toast("Thanks sent to all donors");return;}
  if(a==="dyes"){S.d="yes";render();return;}
  if(a==="dno"){S.d="no";render();return;}
  if(a==="dundo"){S.d=a==="dundo"&&S.d==="yes"?"incoming":"yes";render();return;}
  if(a==="toast"){toast(b.dataset.m);return;}
});

fresh();render();
})();
