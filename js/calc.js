// Plateful prototype – measurement pipeline (charter FR2–FR4).
// Pure functions: area -> volume -> weight -> kcal and macros. Runs in the browser and in Node (tests).

/** Find the reference row for a food name (substring match, most specific rows listed first). */
function lookupFood(name){
  const n=String(name).toLowerCase();
  return TABLE.find(row=>n.includes(row[0]));
}

/**
 * Compute weight, calories and macros for every item of a meal, in place.
 * @param {object} m      meal: {image_width_cm, items:[{name,bbox,coverage,thickness_cm,manual?,g?,...}]}
 * @param {number} imgAR  photo aspect ratio (width / height), used to get the real height from the calibrated width
 * Volume assumes the visible surface continues uniformly to the bottom (FR4).
 */
function computeMeal(m,imgAR){
  const Wcm=m.image_width_cm,A=Wcm*(Wcm/imgAR);           // real-world area covered by the photo, cm²
  m.items.forEach(it=>{
    const r=lookupFood(it.name);
    it.src=it.manual?"you":r?"table":"aiest";
    [it.rho,it.k100,it.p100,it.c100,it.f100]=r?r.slice(1):[it.density_g_cm3||1,it.kcal_per_100g||100,it.protein_g||0,it.carbs_g||0,it.fat_g||0];
    const[,,w,h]=it.bbox;
    it.area=w*h*it.coverage*A;                              // visible area, cm²
    it.vol=it.area*it.thickness_cm;                          // volume, cm³
    if(!it.manual)it.g=it.vol*it.rho;                        // weight, g (user correction wins)
    const f=it.g/100;
    it.kcal=f*it.k100;it.p=f*it.p100;it.c=f*it.c100;it.f=f*it.f100;
  });
  const sum=k=>m.items.reduce((s,i)=>s+i[k],0);
  m.total=sum("kcal");m.grams=sum("g");m.P=sum("p");m.C=sum("c");m.F=sum("f");
  return m;
}

if(typeof module!=="undefined")module.exports={lookupFood,computeMeal};
