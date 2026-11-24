// Plateful prototype – data layer.
// Uses Supabase (Postgres + Auth) when js/config.js has the project URL and key; otherwise falls back to this browser only.
// Production equivalent: API Gateway + Cognito + DynamoDB on the client's AWS account (charter H8).
const DB=(()=>{
  const cfg=window.PLATEFUL_CONFIG||{};
  const remote=!!(cfg.supabaseUrl&&cfg.supabaseKey&&!/YOUR-|PASTE/i.test(cfg.supabaseUrl+cfg.supabaseKey)&&window.supabase);
  const sb=remote?window.supabase.createClient(cfg.supabaseUrl.trim(),cfg.supabaseKey.trim(),{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
  const ls={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
  const r1=n=>Math.round((+n||0)*10)/10;
  let user=null;

  // App meal object <-> database row
  const toRow=m=>({eaten_at:m.iso,slot:m.slot,dish:m.dish,kcal:r1(m.kcal),protein_g:r1(m.P),carbs_g:r1(m.C),fat_g:r1(m.F),grams:r1(m.g),
    items:m.items||[],thumb:m.thumb||null,sample_index:m.si>=0?m.si:null,is_demo:!!m.demo});
  const fromRow=r=>({id:r.id,iso:r.eaten_at,slot:r.slot,dish:r.dish,kcal:+r.kcal,P:+r.protein_g,C:+r.carbs_g,F:+r.fat_g,g:+r.grams,
    thumb:r.thumb,si:r.sample_index??-1,demo:r.is_demo,items:r.items||[]});
  const isNetErr=e=>!navigator.onLine||/fetch|network|load failed/i.test(e?.message||"");
  const fail=e=>{throw new Error(e?.message||String(e))};

  // Local fallback storage, keyed per local account
  const lkey=k=>`pf-l-${user?.id||"anon"}-${k}`;

  // Offline outbox (charter H13): writes made offline are sent when the connection returns
  const outbox={get:()=>ls.get("pf-outbox",[]),set:v=>ls.set("pf-outbox",v)};
  async function flush(){
    if(!remote||!user||!navigator.onLine)return 0;
    const q=outbox.get().filter(x=>x.uid==user.id),rest=outbox.get().filter(x=>x.uid!=user.id);let sent=0;
    for(const x of q){
      const {error}=await sb.from(x.table).insert(x.row);
      if(error){rest.push(x);if(isNetErr(error))break}else sent++;
    }
    outbox.set(rest.concat(q.slice(sent+rest.filter(x=>x.uid==user.id).length)));
    return sent;
  }

  return {
    remote,
    get user(){return user},
    async session(){
      if(!remote){user=ls.get("pf-local-user",null);return user}
      const {data}=await sb.auth.getSession();user=data.session?.user||null;return user;
    },
    onAuth(cb){if(remote)sb.auth.onAuthStateChange((event,s)=>{user=s?.user||null;cb(event,user)})},

    async signUp(name,email,password,lang){
      if(!remote){user={id:"local-"+email.toLowerCase(),email,user_metadata:{name}};ls.set("pf-local-user",user);
        if(!ls.get(lkey("profile"),null))ls.set(lkey("profile"),{name,daily_goal:2200,lang,consent:false,onboarded:false});return{needsConfirm:false}}
      const {data,error}=await sb.auth.signUp({email,password,options:{data:{name,lang},emailRedirectTo:location.href.split("#")[0]}});
      if(error)fail(error);
      if(data.user&&!data.user.identities?.length)fail({message:"already registered"});
      user=data.session?.user||null;return{needsConfirm:!data.session};
    },
    async signIn(email,password){
      if(!remote){user={id:"local-"+email.toLowerCase(),email,user_metadata:{name:email.split("@")[0]}};ls.set("pf-local-user",user);
        if(!ls.get(lkey("profile"),null))ls.set(lkey("profile"),{name:user.user_metadata.name,daily_goal:2200,lang:"en",consent:false,onboarded:false});return}
      const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)fail(error);user=data.user;await flush();
    },
    async signOut(){if(remote)await sb.auth.signOut();else ls.set("pf-local-user",null);user=null},
    async resetPassword(email){if(!remote)return;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.href.split("#")[0]});if(error)fail(error)},
    async setPassword(password){const {error}=await sb.auth.updateUser({password});if(error)fail(error)},

    async getProfile(){
      if(!remote)return ls.get(lkey("profile"),{name:"",daily_goal:2200,lang:"en",consent:false,onboarded:false});
      let {data,error}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();
      if(error)fail(error);
      if(!data){const meta=user.user_metadata||{};const row={id:user.id,name:meta.name||"",lang:meta.lang||"en"};
        const r=await sb.from("profiles").upsert(row).select().single();if(r.error)fail(r.error);data=r.data}
      return data;
    },
    async saveProfile(patch){
      if(!remote){ls.set(lkey("profile"),{...ls.get(lkey("profile"),{}),...patch});return}
      const {error}=await sb.from("profiles").update(patch).eq("id",user.id);if(error)fail(error);
    },

    async listMeals(sinceIso){
      if(!remote)return ls.get(lkey("meals"),[]).filter(m=>m.iso>=sinceIso).sort((a,b)=>a.iso<b.iso?-1:1);
      const {data,error}=await sb.from("meals").select("*").gte("eaten_at",sinceIso).order("eaten_at",{ascending:true});
      if(error)fail(error);
      const pending=outbox.get().filter(x=>x.uid==user.id&&x.table=="meals").map(x=>({...fromRow(x.row),id:"q"+x.row.eaten_at,queued:true}));
      return data.map(fromRow).concat(pending);
    },
    async addMeal(m){
      if(!remote){const saved={...m,id:Date.now()+Math.random()};ls.set(lkey("meals"),ls.get(lkey("meals"),[]).concat(saved));return saved}
      const row=toRow(m);
      try{const {data,error}=await sb.from("meals").insert(row).select().single();if(error)throw error;return fromRow(data)}
      catch(e){if(!isNetErr(e))fail(e);outbox.set(outbox.get().concat({uid:user.id,table:"meals",row}));return{...m,id:"q"+m.iso,queued:true}}
    },
    async addMany(meals){
      if(!remote){ls.set(lkey("meals"),ls.get(lkey("meals"),[]).concat(meals.map((m,i)=>({...m,id:Date.now()+i}))));return}
      const {error}=await sb.from("meals").insert(meals.map(toRow));if(error)fail(error);
    },
    async addCorrection(c){
      const row={dish:c.dish??null,before:c.before,after:c.after,consent:!!c.consent};
      if(!remote){ls.set(lkey("corr"),ls.get(lkey("corr"),[]).concat({...row,created_at:new Date().toISOString()}));return}
      try{const {error}=await sb.from("corrections").insert(row);if(error)throw error}
      catch(e){if(!isNetErr(e))fail(e);outbox.set(outbox.get().concat({uid:user.id,table:"corrections",row}))}
    },
    async countCorrections(){
      if(!remote){const c=ls.get(lkey("corr"),[]);return{all:c.length,consented:c.filter(x=>x.consent).length}}
      const a=await sb.from("corrections").select("id",{count:"exact",head:true});
      const b=await sb.from("corrections").select("id",{count:"exact",head:true}).eq("consent",true);
      return{all:a.count||0,consented:b.count||0};
    },
    async resetData(){
      if(!remote){ls.set(lkey("meals"),[]);ls.set(lkey("corr"),[]);return}
      const a=await sb.from("meals").delete().eq("user_id",user.id);if(a.error)fail(a.error);
      const b=await sb.from("corrections").delete().eq("user_id",user.id);if(b.error)fail(b.error);
      outbox.set(outbox.get().filter(x=>x.uid!=user.id));
    },
    flush,
    pending:()=>user?outbox.get().filter(x=>x.uid==user.id).length:0
  };
})();
