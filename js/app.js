// Plateful prototype – UI, live AI detection, journal, consent and API payload.
// Depends on data.js and calc.js (loaded first).
{
const $=s=>document.querySelector(s);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const r0=n=>Math.round(n),r1=n=>Math.round(n*10)/10;
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};

// ---------- i18n (H14: French and English) ----------
let lang=store.get("pf-lang","en");const t=(k,...a)=>{const v=T[lang][k];return typeof v=="function"?v(...a):v};
function applyLang(){document.documentElement.lang=lang;document.querySelectorAll("[data-k]").forEach(e=>e.textContent=t(e.dataset.k));$("#lang").textContent=lang=="en"?"FR":"EN";
  $("#date").textContent=new Date().toLocaleDateString(lang=="fr"?"fr-CA":"en-CA",{weekday:"short",month:"short",day:"numeric"});if(cur)render();else status(t("start"));today()}

// ---------- Reference table: [name, density g/cm3, kcal, protein, carbs, fat per 100 g] (typical values; production: Canadian Nutrient File, H4) ----------


// ---------- Sample meals (drawn from the same boxes the detector returns) ----------
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

// ---------- Core calculation (FR2-FR4): area -> volume -> weight -> kcal + macros ----------
let cur=null,imgAR=4/3,sample=null,pending=null;
const pipe=n=>document.querySelectorAll("#pipe li").forEach(li=>li.classList.toggle("on",+li.dataset.p<=n));
const dn=it=>{const n=lang=="fr"&&it.sample?(FRN[it.name]||it.name):it.name;return n.charAt(0).toUpperCase()+n.slice(1)};
const macros=m=>`<div class="mac"><span>${t("P")} ${r0(m.P)} g</span><span>${t("C")} ${r0(m.C)} g</span><span>${t("F")} ${r0(m.F)} g</span></div>`;
function render(){
  const m=cur;computeMeal(m,imgAR);
  const shot=$("#shot");shot.querySelectorAll(".box,.scan").forEach(e=>e.remove());
  m.items.forEach((it,i)=>{const[x,y,w,h]=it.bbox,b=document.createElement("div");b.className="box";b.dataset.i=i;
    b.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%`;const s=document.createElement("span");s.textContent=dn(it);b.append(s);shot.append(b)});
  placeLabels(shot);
  const dish=Array.isArray(m.dish)?m.dish[lang=="fr"?1:0]:m.dish;
  $("#result").innerHTML=`<div class="total"><div><div class="meta">${esc(dish)}</div><b>${r0(m.total)}</b> <span class="meta">kcal</span></div><div class="meta" style="text-align:right">${r0(m.grams)} ${t("total")}<br>${t("wide",r0(m.image_width_cm))}</div></div>${macros(m)}
  <ul class="items">${m.items.map((it,i)=>`<li data-i="${i}" tabindex="0"><span class="nm">${esc(dn(it))}<span class="tag ${it.src=="aiest"?"ai":""}">${t(it.src)}</span></span><span class="kc">${r0(it.kcal)} kcal</span>
   ${it.confidence<.75&&!it.manual?`<span class="calc err">${t("low")}</span>`:""}<span class="calc">${it.manual?`${r0(it.g)} g (${t("corr")})`:`${r0(it.area)} cm² × ${it.thickness_cm} cm = ${r0(it.vol)} cm³ × ${it.rho} g/cm³ = ${r0(it.g)} g`} · ${it.k100} kcal/100 g · P ${r1(it.p)} / C ${r1(it.c)} / F ${r1(it.f)} g · ${r0(it.confidence*100)} % ${t("sure")}</span></li>`).join("")}</ul>
  <div class="note">${m.ms?t("time",(m.ms/1000).toFixed(1)):""}${t("tap")} ${esc(m.not_visible_note||t("hidden"))}. ${t("calib",r0((m.calibration_confidence||.8)*100))}</div>`;
  pipe(4);
}
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
document.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{
  const s=S[+b.dataset.s];cur={dish:s.dish,image_width_cm:s.w,calibration_confidence:s.cc,items:s.items.map(i=>({...i,bbox:[...i.bbox],sample:true}))};
  show(drawSample(s),4/3);status(t("sampleNote"));render();$("#add").disabled=false;
});

// ---------- Live AI detection (FR1, FR2) ----------
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
  return{blob:await new Promise(r=>c.toBlob(r,"image/jpeg",.85)),url:c.toDataURL("image/jpeg",.85),ar:c.width/c.height};
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
    status(t("found",cur.items.length));pipe(2);setTimeout(()=>{render();$("#add").disabled=false},250);
  }catch(err){sc.remove();status(err?.code=="rate_limited"?t("rate"):err?.code=="not_granted"?t("declined"):t("fail"),1)}
}
$("#file").onchange=async e=>{
  const f=e.target.files[0];e.target.value="";if(!f)return;
  try{const p=await prep(f);show(p.url,p.ar);cur=null;$("#result").innerHTML="";$("#add").disabled=true;$("#shot").querySelectorAll(".box").forEach(x=>x.remove());pipe(0);
    if(!navigator.onLine){pending=p;status(t("offline"));return}
    analyse(p)}catch{status(t("fail"),1)}
};
addEventListener("online",()=>{if(pending){const p=pending;pending=null;status(t("back"));analyse(p)}});

// ---------- Today, consent, training queue (FR5, FR6) and API payload (H15) ----------
let log=store.get("pf-log",[]),fb=store.get("pf-fb",[]),consent=store.get("pf-consent",false);const OUT=2340;
function queueFb(before,after){fb.push({at:new Date().toISOString(),before,after,consent});store.set("pf-fb",fb);pipe(5);today()}
function apiPayload(){return{userId:"demo-user",date:new Date().toISOString().slice(0,10),source:"plateful-food-journal",intakeKcal:r0(log.reduce((s,m)=>s+m.kcal,0)),
  meals:log.map(m=>({time:m.iso,dish:m.dish,kcal:r0(m.kcal),protein_g:r0(m.P||0),carbs_g:r0(m.C||0),fat_g:r0(m.F||0),grams:r0(m.g||0)}))}}
function today(){
  const tot=log.reduce((s,m)=>s+m.kcal,0),mx=Math.max(tot,OUT,1),sm=k=>r0(log.reduce((s,m)=>s+(m[k]||0),0));
  $("#inK").textContent=r0(tot);$("#macT").textContent=`P ${sm("P")} g · C ${sm("C")} g · F ${sm("F")} g`;
  $("#barIn").style.width=tot/mx*100+"%";$("#barOut").style.width=OUT/mx*100+"%";
  const d=OUT-tot;$("#balTxt").textContent=d>=0?t("under",r0(d),OUT):t("over",r0(-d),OUT);
  $("#log").innerHTML=log.length?log.map(m=>`<li><span>${esc(new Date(m.iso||Date.now()).toLocaleTimeString(lang=="fr"?"fr-CA":"en-CA",{hour:"2-digit",minute:"2-digit"}))} · ${esc(m.dish)}</span><b>${r0(m.kcal)} kcal</b></li>`).join(""):`<li class="meta">${t("noMeals")}</li>`;
  $("#fb").textContent=t("fb",consent?fb.length:fb.filter(x=>x.consent).length,consent);
  $("#consent").checked=consent;$("#apiOut").textContent=JSON.stringify(apiPayload(),null,2);
}
$("#consent").onchange=e=>{consent=e.target.checked;store.set("pf-consent",consent);today()};
$("#add").onclick=()=>{if(!cur)return;const dish=Array.isArray(cur.dish)?cur.dish[lang=="fr"?1:0]:cur.dish;
  log.push({iso:new Date().toISOString(),dish,kcal:cur.total,P:cur.P,C:cur.C,F:cur.F,g:cur.grams});store.set("pf-log",log);$("#add").disabled=true;status(t("added"));today()};
$("#clear").onclick=()=>{log=[];store.set("pf-log",log);today()};
$("#copy").onclick=async()=>{try{await navigator.clipboard.writeText($("#apiOut").textContent);$("#copy").textContent=t("copied");setTimeout(()=>$("#copy").textContent=t("copy"),1500)}catch{}};
$("#lang").onclick=()=>{lang=lang=="en"?"fr":"en";store.set("pf-lang",lang);applyLang()};
document.querySelectorAll("[role=tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[role=tab]").forEach(x=>x.setAttribute("aria-selected",x===b));$("#v-scan").hidden=b.dataset.v!="scan";$("#v-today").hidden=b.dataset.v!="today";today()});
applyLang();
(async()=>{try{sample=await window.claude?.use?.("sample");if(sample){const l=await sample.limits?.();if(l&&!l.images)sample=null}}catch{sample=null}})();
}
