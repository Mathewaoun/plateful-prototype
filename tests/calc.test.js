// Unit tests for the measurement pipeline. Run with: npm test   (Node 18+, no dependencies)
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");

// Load the browser scripts into a sandbox exactly as the page does.
const src=["data.js","calc.js"].map(f=>fs.readFileSync(path.join(__dirname,"..","js",f),"utf8")).join("\n");
const {TABLE,S,computeMeal,lookupFood}=vm.runInNewContext(src+";({TABLE,S,computeMeal,lookupFood})",{});
const meal=(item,width=10)=>({image_width_cm:width,items:[{bbox:[0,0,.5,.5],coverage:1,thickness_cm:2,confidence:.9,...item}]});

test("lookup picks the most specific food row",()=>{
  assert.equal(lookupFood("Cherry Tomato")[0],"cherry tomato");
  assert.equal(lookupFood("kidney beans")[0],"kidney bean");
  assert.equal(lookupFood("white rice")[0],"white rice");
  assert.equal(lookupFood("dragon fruit"),undefined);
});

test("area -> volume -> weight -> kcal follows the RFB formula",()=>{
  // 10 x 10 cm photo, box covers a quarter = 25 cm², 2 cm deep = 50 cm³, rice 0.8 g/cm³ = 40 g, 130 kcal/100 g = 52 kcal
  const m=computeMeal(meal({name:"white rice"}),1);
  const it=m.items[0];
  assert.equal(it.area,25);assert.equal(it.vol,50);
  assert.ok(Math.abs(it.g-40)<1e-9);assert.ok(Math.abs(it.kcal-52)<1e-9);
  assert.equal(it.src,"table");
});

test("aspect ratio sets the real photo height",()=>{
  const square=computeMeal(meal({name:"rice"}),1).items[0].area;
  const wide=computeMeal(meal({name:"rice"}),2).items[0].area;  // twice as wide as tall -> half the height
  assert.ok(Math.abs(wide-square/2)<1e-9);
});

test("uniform distribution: twice the depth gives twice the weight (FR4)",()=>{
  const a=computeMeal(meal({name:"kidney beans",thickness_cm:2}),1).items[0].g;
  const b=computeMeal(meal({name:"kidney beans",thickness_cm:4}),1).items[0].g;
  assert.ok(Math.abs(b-2*a)<1e-9);
});

test("a user correction overrides the estimated weight (FR6)",()=>{
  const it=computeMeal(meal({name:"broccoli",manual:true,g:200}),1).items[0];
  assert.equal(it.g,200);assert.equal(it.src,"you");assert.ok(Math.abs(it.kcal-68)<1e-9);
});

test("unknown foods fall back to the AI's own estimates",()=>{
  const it=computeMeal(meal({name:"dragon fruit",density_g_cm3:.9,kcal_per_100g:60,protein_g:1.2}),1).items[0];
  assert.equal(it.src,"aiest");assert.equal(it.rho,.9);assert.equal(it.k100,60);
  assert.ok(Math.abs(it.p-it.g*1.2/100)<1e-9);
});

test("meal totals are the sum of the ingredients",()=>{
  for(const s of S){
    const m=computeMeal({image_width_cm:s.w,items:s.items.map(i=>({...i}))},4/3);
    const sum=k=>m.items.reduce((a,i)=>a+i[k],0);
    assert.ok(Math.abs(m.total-sum("kcal"))<1e-9);
    assert.ok(Math.abs(m.grams-sum("g"))<1e-9);
    assert.ok(m.total>0&&m.total<2000,`${s.dish[0]} has a plausible total`);
  }
});

test("every sample ingredient is in the reference table",()=>{
  for(const s of S)for(const i of s.items)assert.ok(lookupFood(i.name),i.name);
});

test("table rows are well-formed",()=>{
  for(const r of TABLE){
    assert.equal(r.length,6,r[0]);
    const[,rho,kcal,p,c,f]=r;
    assert.ok(rho>0&&rho<2,r[0]);assert.ok(kcal>=0&&kcal<900,r[0]);
    assert.ok(p+c+f<=100,`${r[0]} macros under 100 g`);
  }
});
