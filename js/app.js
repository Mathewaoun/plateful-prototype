// Plateful prototype – app shell: onboarding, Today, Scan, Week, Profile.
// Depends on data.js (strings, tables, samples) and calc.js (measurement pipeline), loaded first.
{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const r0=n=>Math.round(n),r1=n=>Math.round(n*10)/10,fmt=n=>r0(n).toLocaleString(lang=="fr"?"fr-CA":"en-CA");
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- State (kept in this browser; production: DynamoDB) ----------
let lang=store.get("pf-lang","en"),goal=store.get("pf-goal",2200),log=store.get("pf-log2",[]),fb=store.get("pf-fb",[]),consent=store.get("pf-consent",false);
const BURN=2340;                                   // calories burned, sample value from the Digital Health tracker
let cur=null,imgAR=4/3,sample=null,pending=null,curThumb=null,curSample=-1,view="today";
const t=(k,...a)=>{const v=T[lang][k];return typeof v=="function"?v(...a):v};
const nm=d=>Array.isArray(d)?d[lang=="fr"?1:0]:d;   // sample/demo names are [en, fr]
const dayKey=d=>{d=new Date(d);return`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
const slotOf=d=>{const h=new Date(d).getHours();return h<11?0:h<15?1:h<18?2:3};
const pipe=n=>$$("#pipe li").forEach(li=>li.classList.toggle("on",+li.dataset.p<=n));   // only on details.html
function toast(msg){const e=$("#toast");e.textContent=msg;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("on"),2200)}
function countUp(el,to){if(reduce){el.textContent=fmt(to);return}const from=+(el.dataset.v||0),t0=performance.now();el.dataset.v=to;
  const step=n=>{const p=Math.min(1,(n-t0)/650),e=1-(1-p)**3;el.textContent=fmt(from+(to-from)*e);if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step)}

// ---------- Sample drawings ----------
function rng(s){return()=>(s=(s*16807)%2147483647)/2147483647}
function drawSample(m){
  const W=400,H=300,R=rng(7);let g="";
  for(const it of m.items){const x=it.bbox[0]*W,y=it.bbox[1]*H,w=it.bbox[2]*W,h=it.bbox[3]*H,cx=x+w/2,cy=y+h/2,c=it.col,pt=(a,b)=>[x+w*(a+R()*b),y+h*(a+R()*b)];
    if(it.draw=="mound"){g+=`<ellipse cx="${cx}" cy="${cy}" rx="${w/2}" ry="${h/2}" fill="${c}" stroke="#e2dccb"/>`;for(let i=0;i<70;i++){const a=R()*6.28,d=Math.sqrt(R())*.9,px=cx+Math.cos(a)*d*w/2,py=cy+Math.sin(a)*d*h/2;g+=`<ellipse cx="${px}" cy="${py}" rx="3.2" ry="1.4" transform="rotate(${R()*180} ${px} ${py})" fill="#e8e1cc"/>`}}
    if(it.draw=="slab")g+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${c}"/>`+[.25,.5,.75].map(f=>`<path d="M${x+w*f-14} ${y+6}l28 ${h-12}" stroke="#8a5424" stroke-width="5" opacity=".55"/>`).join("");
    if(it.draw=="florets")for(let i=0;i<9;i++){const[px,py]=pt(.18,.64);g+=`<circle cx="${px}" cy="${py}" r="${15+R()*7}" fill="${i%2?c:"#2f7a2c"}"/>`}
    if(it.draw=="leaves")for(let i=0;i<16;i++){const[px,py]=pt(.12,.76);g+=`<ellipse cx="${px}" cy="${py}" rx="${30+R()*16}" ry="${16+R()*8}" transform="rotate(${R()*180} ${px} ${py})" fill="${i%3?c:"#5ea83a"}"/>`}
    if(it.draw=="dots")for(let i=0;i<6;i++){const[px,py]=pt(.1,.8);g+=`<circle cx="${px}" cy="${py}" r="12" fill="${c}"/><circle cx="${px-4}" cy="${py-4}" r="3" fill="#fff" opacity=".6"/>`}
    if(it.draw=="shreds")for(let i=0;i<22;i++){const[px,py]=pt(0,1);g+=`<path d="M${px} ${py}l${12+R()*14} ${R()*10-5}" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`}
    if(it.draw=="slices")for(let i=0;i<4;i++){const[px,py]=pt(.2,.6);g+=`<circle cx="${px}" cy="${py}" r="15" fill="#4f8a2a"/><circle cx="${px}" cy="${py}" r="12" fill="${c}"/>`}
    if(it.draw=="liquid")g+=`<ellipse cx="${cx}" cy="${cy}" rx="${w/2}" ry="${h/2}" fill="${c}"/>`;
    if(it.draw=="beans")for(let i=0;i<16;i++){const[px,py]=pt(.1,.8);g+=`<ellipse cx="${px}" cy="${py}" rx="11" ry="6.5" transform="rotate(${R()*180} ${px} ${py})" fill="${c}"/>`}
    if(it.draw=="cubes")for(let i=0;i<7;i++){const[px,py]=pt(.1,.8);g+=`<rect x="${px}" y="${py}" width="11" height="11" rx="2" fill="${c}" transform="rotate(${R()*90} ${px} ${py})"/>`}
  }
  const base=m.plate=="plate"?`<ellipse cx="200" cy="158" rx="160" ry="134" fill="#00000018"/><ellipse cx="200" cy="150" rx="160" ry="134" fill="#fff"/><ellipse cx="200" cy="150" rx="128" ry="106" fill="none" stroke="#eceae4" stroke-width="3"/>`
   :`<ellipse cx="200" cy="160" rx="150" ry="136" fill="#00000020"/><ellipse cx="200" cy="150" rx="150" ry="136" fill="#2b5d7c"/><ellipse cx="200" cy="150" rx="132" ry="118" fill="#e9eef0"/>`;
  return "data:image/svg+xml,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#c99b6d"/><path d="M0 60H400M0 140H400M0 220H400" stroke="#b88a5c" stroke-width="2"/>${base}${g}</svg>`);
}

const drawn={};const sampleImg=i=>drawn[i]??=drawSample(S[i]);
const dn=it=>{const n=lang=="fr"&&it.sample?(FRN[it.name]||it.name):it.name;return n.charAt(0).toUpperCase()+n.slice(1)};

// ---------- Navigation ----------
function go(v){view=v;["today","scan","week","profile"].forEach(x=>$("#v-"+x).hidden=x!=v);
  $$(".tab").forEach(b=>b.dataset.v==v?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current"));
  $("#screens").scrollTop=0;
  if(v=="today")renderToday();if(v=="week")renderWeek();if(v=="profile")renderProfile()}
$$(".tab").forEach(b=>b.onclick=()=>go(b.dataset.v));
$("#toProfile").onclick=()=>go("profile");$("#scanCta").onclick=()=>go("scan");

// ---------- Today: ring, macros, meals ----------
function todays(){const k=dayKey(Date.now());return log.filter(m=>dayKey(m.iso)==k)}
function renderToday(newId){
  const h=new Date().getHours(),ms=todays(),eat=ms.reduce((s,m)=>s+m.kcal,0),left=goal-eat;
  $("#hello").textContent=t("greet",h);
  $("#dateH").textContent=new Date().toLocaleDateString(lang=="fr"?"fr-CA":"en-CA",{weekday:"long",month:"long",day:"numeric"});
  const f=$("#rFill"),p=Math.min(1,eat/goal);f.style.strokeDashoffset=327*(1-p);f.classList.toggle("over",left<0);
  countUp($("#leftK"),Math.abs(left));$("#leftL").textContent=left<0?t("overL"):t("left");
  $("#kGoal").textContent=fmt(goal);$("#kEaten").textContent=fmt(eat);$("#kBurn").textContent=fmt(BURN);
  const sum=k=>ms.reduce((s,m)=>s+(m[k]||0),0),tg={P:goal*.25/4,C:goal*.5/4,F:goal*.25/9},col={P:"var(--g)",C:"var(--s)",F:"var(--t)"};
  $("#macros").innerHTML=["P","C","F"].map(k=>`<div class="macro"><b>${t(k)}</b><div class="bar"><i style="width:${Math.min(100,sum(k)/tg[k]*100)}%;background:${col[k]}"></i></div><span>${r0(sum(k))} / ${r0(tg[k])} g</span></div>`).join("");
  $("#meals").innerHTML=ms.length?ms.slice().reverse().map(m=>mealRow(m,m.id==newId)).join(""):`<li class="emptym">${t("noMealsToday")}</li>`;
}
const thumbOf=m=>m.thumb?`<img class="thumb" src="${esc(m.thumb)}" alt="">`:m.si>=0?`<img class="thumb" src="${sampleImg(m.si)}" alt="">`:`<span class="thumb">${esc(nm(m.dish).charAt(0))}</span>`;
const mealRow=(m,isNew)=>`<li class="${isNew?"new":""}">${thumbOf(m)}<div><div class="slotl">${t("slot")[m.slot]} · ${esc(new Date(m.iso).toLocaleTimeString(lang=="fr"?"fr-CA":"en-CA",{hour:"2-digit",minute:"2-digit"}))}</div><div class="dn">${esc(nm(m.dish))}</div><div class="mm">P ${r0(m.P||0)} · C ${r0(m.C||0)} · F ${r0(m.F||0)} g</div></div><span class="k">${fmt(m.kcal)} kcal</span></li>`;

// ---------- Week ----------
let chartGoal=()=>{};addEventListener("resize",()=>chartGoal());
function renderWeek(){
  const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-6+i);const k=dayKey(d),ms=log.filter(m=>dayKey(m.iso)==k);return{d,ms,kcal:ms.reduce((s,m)=>s+m.kcal,0)}});
  const logged=days.filter(x=>x.ms.length),avg=logged.length?logged.reduce((s,x)=>s+x.kcal,0)/logged.length:0,
    on=logged.filter(x=>Math.abs(x.kcal-goal)<=goal*.1).length;let streak=0;for(let i=6;i>=0&&days[i].ms.length;i--)streak++;
  $("#stats").innerHTML=[[fmt(avg),"kcal · "+t("avg")],[`${on}/7`,t("onTarget")],[`${streak}`,t("daysU")+" · "+t("streak")]].map(([b,s])=>`<div class="stat"><b>${b}</b><span>${esc(s)}</span></div>`).join("");
  const max=Math.max(goal*1.3,...days.map(x=>x.kcal)),loc=lang=="fr"?"fr-CA":"en-CA";
  $("#chart").setAttribute("aria-label",days.map(x=>`${x.d.toLocaleDateString(loc,{weekday:"short"})} ${r0(x.kcal)} kcal`).join(", "));
  $("#chart").innerHTML=days.map((x,i)=>{const c=!x.kcal?"":x.kcal>goal*1.1?"over":x.kcal<goal*.9?"under":"";
    return`<div class="col${i==6?" today":""}"><em>${x.kcal?fmt(x.kcal):""}</em><div class="bw"><i class="${c}" style="height:0" data-h="${x.kcal/max*100}"></i></div><span>${esc(x.d.toLocaleDateString(loc,{weekday:"short"}))}</span></div>`}).join("")
    +`<div class="gline" id="gline"><span>${t("goalLine")} ${fmt(goal)}</span></div>`;
  const placeGoal=()=>{const bw=$("#chart .bw"),c=$("#chart");if(!bw)return;const r=bw.getBoundingClientRect(),cr=c.getBoundingClientRect();
    $("#gline").style.top=(r.top-cr.top+r.height*(1-goal/max))+"px"};placeGoal();chartGoal=placeGoal;
  requestAnimationFrame(()=>requestAnimationFrame(()=>$$("#chart i").forEach(i=>i.style.height=i.dataset.h+"%")));
  $("#days").innerHTML=days.slice().reverse().filter(x=>x.ms.length).map(x=>`<li><span>${esc(x.d.toLocaleDateString(loc,{weekday:"long",day:"numeric",month:"short"}))} · ${x.ms.length} ${lang=="fr"?"repas":x.ms.length==1?"meal":"meals"}</span><b>${fmt(x.kcal)} kcal</b></li>`).join("");
}

// ---------- Profile: goal, consent (privacy NFR), training queue (FR5), API payload (H15) ----------
function apiPayload(){const ms=todays();return{userId:"demo-user",date:new Date().toISOString().slice(0,10),source:"plateful-food-journal",intakeKcal:r0(ms.reduce((s,m)=>s+m.kcal,0)),
  meals:ms.map(m=>({time:m.iso,slot:T.en.slot[m.slot].toLowerCase(),dish:nm(m.dish),kcal:r0(m.kcal),protein_g:r0(m.P||0),carbs_g:r0(m.C||0),fat_g:r0(m.F||0),grams:r0(m.g||0)}))}}
function renderProfile(){$("#goalIn").value=goal;$("#consent").checked=consent;
  $("#fb").textContent=t("fb",consent?fb.length:fb.filter(x=>x.consent).length,consent);$("#apiOut").textContent=JSON.stringify(apiPayload(),null,2)}
$("#goalIn").onchange=e=>{const v=Math.min(5000,Math.max(1000,+e.target.value||2200));goal=v;store.set("pf-goal",v);e.target.value=v;toast(t("saved"))};
$("#consent").onchange=e=>{consent=e.target.checked;store.set("pf-consent",consent);renderProfile()};
$("#copy").onclick=async()=>{try{await navigator.clipboard.writeText($("#apiOut").textContent);toast(t("copied"))}catch{}};
$("#replay").onclick=()=>openOnb();
$("#reset").onclick=()=>{log=[];fb=[];store.set("pf-log2",log);store.set("pf-fb",fb);store.set("pf-seeded",false);seedDemo();toast(t("resetDone"));go("today")};
function queueFb(before,after){fb.push({at:new Date().toISOString(),before,after,consent});store.set("pf-fb",fb);pipe(5)}

// ---------- Scan ----------
function render(animate){
  const m=cur;computeMeal(m,imgAR);
  const shot=$("#shot");shot.querySelectorAll(".box,.scan").forEach(e=>e.remove());
  m.items.forEach((it,i)=>{const[x,y,w,h]=it.bbox,b=document.createElement("div");b.className="box";b.dataset.i=i;
    b.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%;--d:${animate?i*.18:0}s`;const s=document.createElement("span");s.textContent=dn(it);b.append(s);shot.append(b)});
  placeLabels(shot);
  const dish=nm(m.dish);
  $("#result").innerHTML=`<div class="total"><div><div class="meta">${esc(dish)}</div><b id="mealK">0</b> <span class="meta">kcal</span></div><div class="meta" style="text-align:right">${r0(m.grams)} ${t("total")}<br>${t("wide",r0(m.image_width_cm))}</div></div>${macros(m)}
  <ul class="items">${m.items.map((it,i)=>`<li data-i="${i}" tabindex="0"><span class="nm">${esc(dn(it))}<span class="tag ${it.src=="aiest"?"ai":""}">${t(it.src)}</span></span><span class="kc">${r0(it.kcal)} kcal</span>
   ${it.confidence<.75&&!it.manual?`<span class="calc err">${t("low")}</span>`:""}<span class="calc">${it.manual?`${r0(it.g)} g (${t("corr")})`:`${r0(it.area)} cm² × ${it.thickness_cm} cm = ${r0(it.vol)} cm³ × ${it.rho} g/cm³ = ${r0(it.g)} g`} · ${it.k100} kcal/100 g · P ${r1(it.p)} / C ${r1(it.c)} / F ${r1(it.f)} g · ${r0(it.confidence*100)} % ${t("sure")}</span></li>`).join("")}</ul>
  <div class="note">${m.ms?t("time",(m.ms/1000).toFixed(1)):""}${t("tap")} ${esc(m.not_visible_note||t("hidden"))}. ${t("calib",r0((m.calibration_confidence||.8)*100))}</div>`;
  countUp($("#mealK"),m.total);
  const add=$("#add");add.hidden=false;add.disabled=false;add.textContent=t("logBtn",t("slot")[slotOf(Date.now())]);
  pipe(4);
}
const macros=m=>`<div class="mac"><span>${t("P")} ${r0(m.P)} g</span><span>${t("C")} ${r0(m.C)} g</span><span>${t("F")} ${r0(m.F)} g</span></div>`;
// Move a label below its box, then inside it, if it would overlap a label already placed.
function placeLabels(shot){
  const placed=[],hit=(r,q)=>r.left<q.right&&q.left<r.right&&r.top<q.bottom&&q.top<r.bottom;
  shot.querySelectorAll(".box").forEach(b=>{
    for(const cls of ["","lo","in"]){
      b.classList.remove("lo","in");if(cls)b.classList.add(cls);
      const r=b.querySelector("span").getBoundingClientRect();
      if(!placed.some(q=>hit(r,q))||cls=="in"){placed.push(r);break}
    }
  });
}
addEventListener("resize",()=>{const s=$("#shot");if(s.querySelector(".box"))placeLabels(s)});
addEventListener("resize",()=>{const s=$("#shot");if(s.querySelector(".box"))placeLabels(s)});
function edit(i){
  const li=$(`#result li[data-i="${i}"]`);if(!li||li.querySelector(".edit"))return;
  const it=cur.items[i],d=document.createElement("div");d.className="edit";
  d.innerHTML=`<input aria-label="${t("name")}" value="${esc(it.name)}"><input aria-label="${t("grams")}" type="number" min="0" inputmode="numeric" value="${r0(it.g)}"><button class="btn pri">${t("save")}</button><button class="btn">${t("remove")}</button>`;
  d.addEventListener("click",e=>e.stopPropagation());d.addEventListener("keydown",e=>e.stopPropagation());
  const[n,g,sv,rm]=d.children;
  sv.onclick=()=>{const old={name:it.name,g:r0(it.g)},nn=n.value.trim();if(nn&&nn!==it.name){it.name=nn;it.sample=false}if(+g.value!==r0(it.g)){it.g=Math.max(0,+g.value);it.manual=true}queueFb(old,{name:it.name,g:r0(it.g)});render()};
  rm.onclick=()=>{queueFb({name:it.name},{removed:true});cur.items.splice(i,1);render()};
  li.append(d);n.focus();
}
$("#result").addEventListener("click",e=>{const li=e.target.closest("li[data-i]");if(li)edit(+li.dataset.i)});
$("#result").addEventListener("keydown",e=>{if(e.key=="Enter"&&e.target.matches("li[data-i]"))edit(+e.target.dataset.i)});
$("#shot").addEventListener("mouseover",e=>{const b=e.target.closest(".box");document.querySelectorAll(".box").forEach(x=>x.classList.toggle("hl",x===b))});

function show(src,ar){imgAR=ar;$("#empty")?.remove();let im=$("#shot img");if(!im){im=document.createElement("img");im.alt="Meal photo";$("#shot").prepend(im)}im.src=src;$("#shot").style.aspectRatio=ar}
function status(x,err){const s=$("#status");s.textContent=x;s.classList.toggle("err",!!err)}
function status(x,err){const s=$("#status");s.textContent=x;s.classList.toggle("err",!!err)}
function resetScan(){cur=null;$("#result").innerHTML="";$("#add").hidden=true;$("#shot").querySelectorAll(".box,.scan").forEach(x=>x.remove())}
$$("[data-s]").forEach(b=>b.onclick=()=>{
  const i=+b.dataset.s,s=S[i];resetScan();curThumb=null;curSample=i;show(sampleImg(i),4/3);pipe(0);
  const sc=document.createElement("div");sc.className="scan";$("#shot").append(sc);status(t("scanning"));
  setTimeout(()=>{cur={dish:s.dish,image_width_cm:s.w,calibration_confidence:s.cc,items:s.items.map(it=>({...it,bbox:[...it.bbox],sample:true}))};status(t("sampleNote"));render(true)},reduce?0:900);
});

// Live AI detection (FR1, FR2): the image goes to a vision model; the measurement maths stays in calc.js.
const PROMPT=()=>`You are the food-recognition module of a vision-based dietary assessment app. Analyse the meal photo and return ONLY JSON, no prose:
{"dish":string,"image_width_cm":number,"calibration_confidence":number,"not_visible_note":string,"items":[{"name":string,"bbox":[x,y,w,h],"coverage":number,"thickness_cm":number,"confidence":number,"density_g_cm3":number,"kcal_per_100g":number,"protein_g":number,"carbs_g":number,"fat_g":number}]}
Rules:
- List EVERY visually distinct ingredient separately (a salad becomes lettuce, tomato, carrot...). Max 12 items.
- "name": short common ENGLISH food name, e.g. "white rice", "cherry tomato", "kidney beans". "dish" and "not_visible_note" in ${lang=="fr"?"French":"English"}.
- bbox is normalised 0-1 relative to the full image (x,y = top-left).
- coverage = fraction (0-1) of the bbox area actually occupied by that food as seen from above.
- thickness_cm = average depth of that food. Assume what is visible on the surface continues uniformly to the bottom (for solids in soup, use the liquid depth).
- protein_g, carbs_g, fat_g are per 100 g.
- image_width_cm = real-world width the photo covers, auto-calibrated from scene geometry (plate/bowl/table proportions, perspective, typical phone distance). Never rely on coins, hands or cards.
- not_visible_note = short list of likely hidden items (oil, salt, butter, sauce) you cannot measure.
- If the image is not food, return {"dish":"not food","items":[]}.`;
async function prep(file){
  const bm=await createImageBitmap(file),k=Math.min(1,1024/Math.max(bm.width,bm.height)),c=document.createElement("canvas");
  c.width=r0(bm.width*k);c.height=r0(bm.height*k);c.getContext("2d").drawImage(bm,0,0,c.width,c.height);
  const tc=document.createElement("canvas"),ts=Math.min(bm.width,bm.height);tc.width=tc.height=112;           // square thumbnail for the meal log
  tc.getContext("2d").drawImage(bm,(bm.width-ts)/2,(bm.height-ts)/2,ts,ts,0,0,112,112);
  return{blob:await new Promise(r=>c.toBlob(r,"image/jpeg",.85)),url:c.toDataURL("image/jpeg",.85),ar:c.width/c.height,thumb:tc.toDataURL("image/jpeg",.7)};
}
async function analyse(p){
  if(!sample){status(t("noAI"),1);return}
  const sc=document.createElement("div");sc.className="scan";$("#shot").append(sc);status(t("detecting"));pipe(1);
  try{
    const t0=performance.now(),out=await sample.json(PROMPT(),{images:[p.blob],modelTier:"default"}),ms=performance.now()-t0;sc.remove();
    if(!out||!Array.isArray(out.items)||!out.items.length){status(out?.dish=="not food"?t("notFood"):t("none"),1);return}
    const cl=(v,a,b,d)=>{v=+v;return isFinite(v)?Math.min(b,Math.max(a,v)):d};
    cur={ms,dish:String(out.dish||t("meal")),image_width_cm:cl(out.image_width_cm,8,120,35),calibration_confidence:cl(out.calibration_confidence,0,1,.6),not_visible_note:String(out.not_visible_note||""),
      items:out.items.slice(0,12).map(i=>({name:String(i.name||"food").toLowerCase(),bbox:(Array.isArray(i.bbox)?i.bbox:[0,0,1,1]).concat([0,0,1,1]).slice(0,4).map(v=>cl(v,0,1,0)),coverage:cl(i.coverage,.02,1,.7),thickness_cm:cl(i.thickness_cm,.1,15,2),confidence:cl(i.confidence,0,1,.7),density_g_cm3:cl(i.density_g_cm3,.05,2,1),kcal_per_100g:cl(i.kcal_per_100g,0,900,100),protein_g:cl(i.protein_g,0,100,0),carbs_g:cl(i.carbs_g,0,100,0),fat_g:cl(i.fat_g,0,100,0)}))};
    status(t("found",cur.items.length));pipe(2);setTimeout(()=>render(true),200);
  }catch(err){sc.remove();status(err?.code=="rate_limited"?t("rate"):err?.code=="not_granted"?t("declined"):t("fail"),1)}
}
$("#file").onchange=async e=>{
  const f=e.target.files[0];e.target.value="";if(!f)return;
  try{const p=await prep(f);resetScan();curThumb=p.thumb;curSample=-1;show(p.url,p.ar);pipe(0);
    if(!navigator.onLine){pending=p;status(t("offline"));return}
    analyse(p)}catch{status(t("fail"),1)}
};
addEventListener("online",()=>{if(pending){const p=pending;pending=null;status(t("back"));analyse(p)}});

// Log the meal (O5: photo -> log = 2 taps), then show it on Today.
$("#add").onclick=()=>{if(!cur)return;const now=new Date(),slot=slotOf(now),id=now.getTime();
  log.push({id,iso:now.toISOString(),slot,dish:cur.dish,kcal:cur.total,P:cur.P,C:cur.C,F:cur.F,g:cur.grams,thumb:curThumb,si:curSample});
  store.set("pf-log2",log);toast(t("logged",t("slot")[slot]));resetScan();$("#shot img")?.remove();
  if(!$("#empty")){const e=document.createElement("div");e.className="empty";e.id="empty";e.dataset.k="empty";e.textContent=t("empty");$("#shot").append(e)}
  status(t("start"));go("today");renderToday(id)};

// ---------- Sample history so the Week view has data (clearly labelled as sample data) ----------
function seedDemo(){if(store.get("pf-seeded",false))return;const R=rng(42),out=[],pick=()=>DEMO_MEALS[Math.floor(R()*DEMO_MEALS.length)];
  for(let d=6;d>=1;d--){const day=new Date();day.setDate(day.getDate()-d);
    const slots=[[8,0],[12,1],[15,2],[19,3]].filter(([,sl])=>sl!=2||R()<.6),meals=slots.map(pick),
      target=goal*(.82+R()*.34),base=meals.reduce((a,m)=>a+m[2],0),k=target/base;          // portion sizes vary so days land around the goal
    slots.forEach(([h,slot],j)=>{const m=meals[j],at=new Date(day);at.setHours(h,Math.floor(R()*50),0,0);
      out.push({id:at.getTime(),iso:at.toISOString(),slot,dish:[m[0],m[1]],kcal:r0(m[2]*k),P:m[3]*k,C:m[4]*k,F:m[5]*k,g:0,si:m[6],demo:true})})}
  log=out.concat(log.filter(m=>!m.demo));store.set("pf-log2",log);store.set("pf-seeded",true)}

// ---------- Onboarding (first visit) ----------
let slide=0;
function openOnb(){$("#onb").hidden=false;slide=0;$("#onbGoal").value=goal;
  $("#art0").innerHTML=`<img src="${sampleImg(1)}" alt="">`;$("#art1").innerHTML=`<img src="${sampleImg(0)}" alt="">`;setSlide(0)}
function setSlide(i){slide=i;$("#slides").scrollTo({left:$("#slides").clientWidth*i,behavior:reduce?"auto":"smooth"});
  $$("#dots i").forEach((d,j)=>d.classList.toggle("on",j==i));$("#next").textContent=i==2?t("start"):t("next")}
function closeOnb(){const v=Math.min(5000,Math.max(1000,+$("#onbGoal").value||2200));goal=v;store.set("pf-goal",v);store.set("pf-onb",true);$("#onb").hidden=true;go("today")}
$("#next").onclick=()=>slide<2?setSlide(slide+1):closeOnb();$("#skip").onclick=closeOnb;
$("#slides").addEventListener("scroll",()=>{const i=Math.round($("#slides").scrollLeft/$("#slides").clientWidth);if(i!=slide){slide=i;$$("#dots i").forEach((d,j)=>d.classList.toggle("on",j==i));$("#next").textContent=i==2?t("start"):t("next")}},{passive:true});
$("#onb").addEventListener("keydown",e=>{if(e.key=="ArrowRight"&&slide<2)setSlide(slide+1);if(e.key=="ArrowLeft"&&slide>0)setSlide(slide-1)});

// ---------- Language (H14) ----------
function applyLang(){document.documentElement.lang=lang;$$("[data-k]").forEach(e=>{const v=t(e.dataset.k);if(typeof v=="string")e.textContent=v});$("#lang").textContent=lang=="en"?"FR":"EN";
  if(cur)render(false);else status(t("start"));if(!$("#onb").hidden)setSlide(slide);go(view)}
$("#lang").onclick=()=>{lang=lang=="en"?"fr":"en";store.set("pf-lang",lang);applyLang()};

// ---------- Start ----------
seedDemo();applyLang();if(!store.get("pf-onb",false))openOnb();
(async()=>{try{sample=await window.claude?.use?.("sample");if(sample){const l=await sample.limits?.();if(l&&!l.images)sample=null}}catch{sample=null}})();
}
