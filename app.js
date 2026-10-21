const $=id=>document.getElementById(id);
const db=window.supabase.createClient(RP_CONFIG.url,RP_CONFIG.key);
const defaults={gold:0,rc:0,gt:0,gd:0,items:0,rcGP:70000,gtGP:0,gdGP:0,reais25:'',bosses:[],hunts:[]};
const labels={gold:'Gold em GP',rc:'Rubini Coins',gt:'Gold Tokens',gd:'Silver Tokens (GD)',items:'Equipamentos em GP',rcGP:'GP/RC (base histórica)',gtGP:'GP por Gold Token',gdGP:'GP por Silver GD',reais25:'Dracoins R$ / 25 RC'};
let d={...defaults},user=null,dirty=false,timer=null;
const num=x=>Number(x||0),fmt=x=>num(x).toLocaleString('pt-BR');
const safe=x=>String(x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function auth(mode){$('notice').textContent='Verificando...';const email=$('email').value,password=$('password').value;
const {data,error}=mode==='login'?await db.auth.signInWithPassword({email,password}):await db.auth.signUp({email,password});
$('password').value='';if(error){$('notice').textContent=error.message;return}
if(mode==='signup'&&!data.session){$('notice').textContent='Verifique seu e-mail para confirmar a conta.';return}
await enter();}
async function enter(){const {data:{user:u}}=await db.auth.getUser();if(!u)return;user=u;
const {data:rows,error}=await db.from('rubinot_rp766_data').select('payload').eq('user_id',u.id).maybeSingle();
if(error){$('notice').textContent='Erro no banco: '+error.message;return}
d={...structuredClone(defaults),...(rows?.payload||{})};$('auth').style.display='none';$('panel').style.display='block';render();$('status').textContent='✓ Conectado ao banco';}
function change(){dirty=true;$('status').textContent='Alterações pendentes';clearTimeout(timer);timer=setTimeout(save,900);}
async function save(){if(!user)return;const snap=JSON.stringify(d);$('status').textContent='Salvando...';
const {error}=await db.from('rubinot_rp766_data').upsert({user_id:user.id,payload:JSON.parse(snap),updated_at:new Date().toISOString()},{onConflict:'user_id'});
if(error){$('status').textContent='⚠️ Erro: '+error.message;return}
dirty=JSON.stringify(d)!==snap;$('status').textContent=dirty?'Alterações pendentes':'✓ Salvo na nuvem às '+new Date().toLocaleTimeString('pt-BR');
if(dirty)change();}
function render(){ $('fields').innerHTML=Object.keys(labels).map(k=>'<label>'+labels[k]+'<input type="number" step="any" id="v_'+k+'"></label>').join('');
for(const k in labels){const e=$('v_'+k);e.value=d[k];e.oninput=()=>{d[k]=e.value;change();draw();};}draw();}
function draw(){const a=[['Gold',num(d.gold),'#5ab4f0'],['Rubini Coins',num(d.rc)*num(d.rcGP),'#ffc770'],['Gold Tokens',num(d.gt)*num(d.gtGP),'#77d8b1'],['Silver GD',num(d.gd)*num(d.gdGP),'#bfa4f7'],['Itens',num(d.items),'#f09091']];
const total=a.reduce((s,v)=>s+v[1],0);let p=0;
$('pie').style.background=total?'conic-gradient('+a.filter(v=>v[1]>0).map(v=>{const start=p;p+=v[1]/total*100;return v[2]+' '+start+'% '+p+'%';}).join(',')+')':'#52657d';
$('legend').textContent=a.map(v=>v[0]+': '+fmt(v[1])+' GP').join(' • ');
$('multiples').innerHTML=Array.from({length:40},(_,i)=>{const n=(i+1)*25;return '<p>'+n+' RC = '+fmt(n*num(d.rcGP))+' GP | '+(d.reais25===''?'Sem cotação em R$':'R$ '+((i+1)*num(d.reais25)).toFixed(2))+'</p>';}).join('');
$('bosses').innerHTML=d.bosses.map(x=>'<p>'+safe(x.date)+' · '+safe(x.name)+' · GT '+fmt(x.gt)+' · GD '+fmt(x.gd)+'</p>').join('');
$('hunts').innerHTML=d.hunts.map(x=>'<p>'+safe(x.date)+' · '+safe(x.name)+' · lucro '+fmt(x.loot-x.supplies)+' GP</p>').join('');}
function addBoss(){d.bosses.push({date:new Date().toLocaleDateString('pt-BR'),name:$('boss').value,gt:num($('goldtoken').value),gd:num($('silver').value)});change();render();}
function addHunt(){d.hunts.push({date:new Date().toLocaleDateString('pt-BR'),name:$('hunt').value,loot:num($('loot').value),supplies:num($('supplies').value)});change();render();}
function backup(){const u=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='RubinOT_RP766_backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('login').onclick=()=>auth('login');$('register').onclick=()=>auth('signup');$('save').onclick=save;$('addboss').onclick=addBoss;$('addhunt').onclick=addHunt;$('backup').onclick=backup;
$('logout').onclick=async()=>{await db.auth.signOut();user=null;$('panel').style.display='none';$('auth').style.display='block';};
db.auth.getSession().then(({data})=>{if(data.session)enter();});