'use strict';
// Sistemas de progresión y combate ampliado; sin dependencias ni audio.
const META_KEY='chispa-meta-v1';
const DIFFICULTIES=[{name:'Normal',hp:1,speed:1,spawn:1,reward:1},{name:'Veterano',hp:1.35,speed:1.1,spawn:1.15,reward:1.3},{name:'Pesadilla',hp:1.75,speed:1.2,spawn:1.3,reward:1.6}];
let meta={wins:[0,0,0],difficulty:0,mastery:{},skins:{},day:'',daily:{kills:0,time:0,ability:0,claimed:[]},week:'',weekly:{kills:0,time:0,bosses:0,wins:0,claimed:[]},tickets:{legendary:0,ultra:0}},runStats,enemyShots=[],attackWarnings=[],phaseBoss=null,bossCleared=false;
const PRESTIGE_UPGRADES=[
 {id:'health',name:'Vitalidad superior',icon:'♥',max:10,desc:'+10 PV iniciales por nivel.'},
 {id:'speed',name:'Reflejos superiores',icon:'➚',max:10,desc:'+2 % de velocidad por nivel.'},
 {id:'pickup',name:'Atracción superior',icon:'∩',max:10,desc:'+10 px de recogida de XP por nivel.'},
 {id:'reward',name:'Recompensa superior',icon:'◇',max:10,desc:'+5 % de KC de recompensa final por nivel.'}
];
const safeCount=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1e9):0;
function cleanMeta(raw){
 const v=raw&&typeof raw==='object'?raw:{},wins=[0,1,2].map(i=>safeCount(v.wins&&v.wins[i])),mastery={},skins={};
 for(const h of AGENTS){mastery[h.id]=safeCount(v.mastery&&v.mastery[h.id]);const skin=safeCount(v.skins&&v.skins[h.id]);skins[h.id]=skin<=2&&Math.floor(mastery[h.id]/250)>=(skin===2?4:skin===1?2:0)?skin:0;}
 const w=v.weekly||{},tickets=v.tickets||{};const weekly={kills:safeCount(w.kills),time:Math.max(0,Math.min(1e9,Number(w.time)||0)),bosses:safeCount(w.bosses),wins:safeCount(w.wins),claimed:Array.isArray(w.claimed)?[...new Set(w.claimed.filter(x=>['kills','time','bosses','wins'].includes(x)))]:[]};
 const pr=v.prestige||{},pu=Object.fromEntries(PRESTIGE_UPGRADES.map(u=>[u.id,Math.min(u.max,safeCount(pr.upgrades&&pr.upgrades[u.id]))])),invested=Object.values(pu).reduce((a,b)=>a+b,0),prestigeLevel=Math.max(invested,Math.min(40,safeCount(pr.level)));
 const prestige={level:prestigeLevel,points:prestigeLevel-invested,winsSpent:safeCount(pr.winsSpent),upgrades:pu};
 const d=v.daily||{};return {prestige,week:typeof v.week==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.week)?v.week:'',weekly,tickets:{legendary:safeCount(tickets.legendary),ultra:safeCount(tickets.ultra)},wins,difficulty:Math.min(safeCount(v.difficulty),wins[1]?2:wins[0]?1:0),mastery,skins,day:typeof v.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.day)?v.day:'',daily:{kills:safeCount(d.kills),time:Math.max(0,Math.min(1e9,Number(d.time)||0)),ability:safeCount(d.ability),claimed:Array.isArray(d.claimed)?[...new Set(d.claimed.filter(x=>['kills','time','ability'].includes(x)))]:[]}};
}
meta=cleanMeta(meta);try{meta=cleanMeta(JSON.parse(localStorage.getItem(META_KEY)));}catch{}
function weeklyKey(date=new Date()){
 const civil=new Date(shopDay(date)+'T12:00:00Z');civil.setUTCDate(civil.getUTCDate()-(civil.getUTCDay()+6)%7);return civil.toISOString().slice(0,10);
}
function refreshDaily(date=new Date()){const day=shopDay(date);if(meta.day!==day){meta.day=day;meta.daily={kills:0,time:0,ability:0,claimed:[]};}const week=weeklyKey(date);if(meta.week!==week){meta.week=week;meta.weekly={kills:0,time:0,bosses:0,wins:0,claimed:[]};}}
let missionSaveClock=0;
window.addEventListener('pagehide',()=>saveMeta());

function saveMeta(){try{localStorage.setItem(META_KEY,JSON.stringify(meta));}catch{skillHint('No se pudo guardar la progresión');}}
function difficulty(){return DIFFICULTIES[runStats?runStats.difficulty:meta.difficulty];}
function resetExpansion(){refreshDaily();enemyShots=[];attackWarnings=[];phaseBoss=null;bossCleared=false;runStats={time:0,damage:0,taken:0,shots:0,hits:0,abilityKills:0,bosses:0,rerolls:3,upgrades:{},evolutions:[],paid:false,difficulty:meta.difficulty,agent:activeHero().id};}
function masteryLevel(id){return Math.min(5,Math.floor((meta.mastery[id]||0)/250));}
function masteryFilter(id){return meta.skins[id]===1?'sepia(.3) saturate(1.8) hue-rotate(310deg)':meta.skins[id]===2?'saturate(.7) hue-rotate(150deg) brightness(1.15)':'none';}
function recordKill(enemy,source){if(!runStats)return;refreshDaily();meta.daily.kills++;meta.weekly.kills++;if(source!=='weapon'&&source!=='contact'){runStats.abilityKills++;meta.daily.ability++;}if(enemy.boss){runStats.bosses++;meta.weekly.bosses++;bossCleared=true;phaseBoss=null;} }
function settleExpansion(won,manual){if(!runStats||runStats.paid)return;runStats.paid=true;const xp=Math.floor(kills+runStats.time/10+runStats.bosses*50)*(manual?.5:1);meta.mastery[runStats.agent]=Math.min(1e9,(meta.mastery[runStats.agent]||0)+Math.floor(xp));refreshDaily();if(won){meta.wins[runStats.difficulty]++;meta.weekly.wins++;}saveMeta();}
function takeArenaDamage(amount){if(state!=='playing'||player.inv>0)return;if(player.shieldHits>0){player.shieldHits=0;player.shieldTime=0;agentShieldBreak();}else{const d=Math.max(1,amount-player.armor);player.hp=Math.max(0,player.hp-d);runStats.taken+=d;}player.inv=1.1;shake=7;if(player.hp<=0){updateHUD();die();}}
function makeEnemy(kind,x,y){const hp=(kind==='shield'?10:kind==='healer'?6:kind==='charger'?5:4)+wave*.5;return {kind,x,y,r:kind==='shield'?17:12,strong:kind==='shield',hp:hp*difficulty().hp,max:hp*difficulty().hp,speed:(kind==='shield'?42:kind==='shooter'?50:65)*difficulty().speed,color:kind==='shooter'?'#f0c565':kind==='healer'?'#77d9ad':kind==='shield'?'#80b3df':'#ed8b72',attack:1+Math.random(),face:0};}
function chooseEnemy(enemy){const options=elapsed<45?['grunt']:elapsed<100?['grunt','charger','shooter']:['grunt','charger','shooter','shield','healer'];const kind=options[Math.floor(Math.random()*options.length)];if(kind!=='grunt')Object.assign(enemy,makeEnemy(kind,enemy.x,enemy.y));else{enemy.kind='grunt';enemy.hp*=difficulty().hp;enemy.max=enemy.hp;enemy.speed*=difficulty().speed;}return enemy;}
function warnAttack(e,type,options={}){if(attackWarnings.length>=32)return;attackWarnings.push({owner:e,type,x:e.x,y:e.y,tx:player.x,ty:player.y,age:0,delay:.9,...options});}
function updateAdvancedEnemy(e,dt){
 if(e.hp<=0||e.stun>0||e.root>0)return false;
 e.face=Math.atan2(player.y-e.y,player.x-e.x);e.attack=(e.attack||0)-dt;
 if(e.charging>0){e.charging-=dt;moveOnTerrain(e,Math.cos(e.chargeAngle)*340*dt,Math.sin(e.chargeAngle)*340*dt);return true;}
 if(e.windup)return true;
 if(e.kind==='shooter'&&e.attack<=0&&clearTerrainLine(e.x,e.y,player.x,player.y,3)){warnAttack(e,'shot');e.attack=3;}
 if(e.kind==='charger'&&e.attack<=0&&distance(e,player)<360){warnAttack(e,'charge',{delay:.8});e.windup=true;e.attack=4;}
 if(e.kind==='healer'&&e.attack<=0){for(const ally of enemies)if(ally!==e&&ally.hp>0&&distance(ally,e)<150)ally.hp=Math.min(ally.max||ally.hp,ally.hp+3);addSkillEffect('aura',e.x,e.y,{r:150,life:.4,color:'#77d9ad'});e.attack=3;}
 if(e.boss&&e.attack<=0){warnAttack(e,'blast',{x:player.x,y:player.y,r:90+e.phase*15,delay:1.3});if(e.phase>=2)warnAttack(e,'shot',{delay:.8,fan:5});if(e.phase===3)warnAttack(e,'charge',{delay:1});e.attack=3.5;}
 return e.kind==='shooter'&&distance(e,player)<260&&clearTerrainLine(e.x,e.y,player.x,player.y,3);
}
function updateExpansion(dt){
 runStats.time+=dt;refreshDaily();meta.daily.time+=dt;meta.weekly.time+=dt;missionSaveClock+=dt;if(missionSaveClock>=15){missionSaveClock=0;saveMeta();}
 for(const w of attackWarnings){w.age+=dt;if(w.owner.hp<=0){w.age=w.delay;continue;}if(w.age>=w.delay){const e=w.owner;e.windup=false;if(e.stun>0||e.root>0)continue;const a=Math.atan2(w.ty-w.y,w.tx-w.x);
 if(w.type==='charge'){e.chargeAngle=a;e.charging=.65;}
 if(w.type==='blast'&&distance(player,w)<w.r+player.r)takeArenaDamage(30);
 if(w.type==='shot')for(let i=0;i<(w.fan||1)&&enemyShots.length<80;i++){const angle=a+(i-((w.fan||1)-1)/2)*.17;enemyShots.push({x:e.x,y:e.y,vx:Math.cos(angle)*210,vy:Math.sin(angle)*210,life:4});}
 }}attackWarnings=attackWarnings.filter(w=>w.age<w.delay&&w.owner.hp>0);
 for(const b of enemyShots){const x=b.x+b.vx*dt,y=b.y+b.vy*dt;if(!clearTerrainLine(b.x,b.y,x,y,3))b.life=0;b.x=x;b.y=y;b.life-=dt;if(b.life>0&&distance(b,player)<player.r+5){takeArenaDamage(15);b.life=0;}}
 enemyShots=enemyShots.filter(b=>b.life>0&&b.x>0&&b.x<W&&b.y>0&&b.y<H);
}
function phaseGate(){if(elapsed<(completedPhases+1)*300)return false;if(bossCleared){bossCleared=false;phaseComplete();return true;}if(!phaseBoss){const phase=completedPhases+1,pos={x:W*.5,y:Math.max(140,H*.18),r:30};freeTerrainPosition(pos);phaseBoss={...makeEnemy('boss',pos.x,pos.y),r:30,strong:true,boss:true,phase,hp:(140+phase*100)*difficulty().hp,max:(140+phase*100)*difficulty().hp,speed:38+phase*6,attack:1.5,name:['Centinela','Demoledor','Núcleo'][phase-1]};enemies.push(phaseBoss);skillHint('JEFE · '+phaseBoss.name);}return false;}
function updateBossHUD(){
 const status=document.getElementById('boss-status');status.hidden=!phaseBoss;
 if(!phaseBoss)return;
 document.getElementById('boss-name').textContent=phaseBoss.name+' · FASE '+phaseBoss.phase;
 document.getElementById('boss-fill').style.width=Math.max(0,phaseBoss.hp/phaseBoss.max)*100+'%';
 const health=document.getElementById('boss-health');health.setAttribute('aria-valuemax',phaseBoss.max);health.setAttribute('aria-valuenow',Math.max(0,phaseBoss.hp));
}
function drawExpansion(front=false){
 ctx.save();if(!front){for(const w of attackWarnings){ctx.strokeStyle='#ff8b68';ctx.fillStyle='#ff586522';ctx.lineWidth=2;ctx.setLineDash([6,4]);if(w.type==='blast'){ctx.beginPath();ctx.arc(w.x,w.y,w.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(w.x,w.y,w.r*Math.max(.1,1-w.age/w.delay),0,Math.PI*2);ctx.stroke();ctx.setLineDash([6,4]);ctx.fillStyle='#ffb99c';ctx.fillRect(w.x-2,w.y-10,4,14);}else{const a=Math.atan2(w.ty-w.y,w.tx-w.x),len=w.type==='charge'?220:distance(w,{x:w.tx,y:w.ty});ctx.beginPath();ctx.moveTo(w.x,w.y);ctx.lineTo(w.x+Math.cos(a)*len,w.y+Math.sin(a)*len);ctx.stroke();}}
 ctx.setLineDash([]);ctx.restore();return;}for(const b of enemyShots){ctx.fillStyle='#ff8b68';ctx.fillRect(b.x-4,b.y-4,8,8);}
 for(const e of enemies)if(e.kind==='shield'&&!e.boss){ctx.strokeStyle='#b6cdda';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.r+4,e.face-.9,e.face+.9);ctx.stroke();}


 ctx.restore();
}
const EVOLUTIONS=[{id:'rail',name:'Perforador',needs:{'Núcleo ardiente':2,'Golpe crítico':2},desc:'Los proyectiles atraviesan enemigos.'},{id:'storm',name:'Tormenta',needs:{'Gatillo veloz':2,'Cargador ampliado':2},desc:'+1 proyectil y recarga un 20 % más rápida.'},{id:'nova',name:'Nova',needs:{'Abanico de fuego':2,'Largo alcance':1},desc:'Los impactos explotan en un radio de 55 px.'}];
function choseUpgrade(u){runStats.upgrades[u.name]=(runStats.upgrades[u.name]||0)+1;for(const recipe of EVOLUTIONS)if(!runStats.evolutions.includes(recipe.id)&&Object.entries(recipe.needs).every(([name,n])=>(runStats.upgrades[name]||0)>=n)){runStats.evolutions.push(recipe.id);if(recipe.id==='rail'&&!player.artifacts.includes('piercing'))player.artifacts.push('piercing');if(recipe.id==='storm'){player.shots++;player.reloadScale*=.8;}skillHint('EVOLUCIÓN · '+recipe.name);}}
function rerollUpgrades(){if(state!=='upgrade'||runStats.rerolls<=0)return;runStats.rerolls--;choices=rollUpgradeChoices(choices);renderUpgrade();}
function bulletImpact(b,e){
 if(b.playerWeapon&&!b.recorded){runStats.hits++;b.recorded=true;}
 if(runStats.evolutions.includes('nova')&&!b.exploded){b.exploded=true;skillBurst(e.x,e.y,55,b.damage*.4,0,undefined,'weapon');}
 if(b.critical&&player.crit>=.3&&(runStats.upgrades['Gatillo veloz']||0)>0&&!b.arc){b.arc=true;for(const target of enemies.filter(t=>t!==e&&t.hp>0&&distance(t,e)<140).slice(0,2)){damageEnemy(target,b.damage*.5,'weapon');addSkillEffect('beam',e.x,e.y,{angle:Math.atan2(target.y-e.y,target.x-e.x),length:distance(e,target),width:4,life:.2});}}
 if(player.artifacts.includes('piercing')&&(runStats.upgrades['Núcleo ardiente']||0)>=2){b.pierceHits=(b.pierceHits||0)+1;if(b.pierceHits%3===0)skillBurst(e.x,e.y,70,b.damage*.5,0,undefined,'weapon');}
}
function statisticsHTML(){if(!runStats)return '';return `<details class="expanded-stats"><summary>Ver estadísticas de combate <span aria-hidden="true">＋</span></summary><div class="report-detail-content"><p>Tiempo real de combate: ${Math.floor(runStats.time/60)}:${String(Math.floor(runStats.time%60)).padStart(2,'0')} · incluye los jefes.</p><div><span>Daño causado <b>${Math.round(runStats.damage)}</b></span><span>Daño recibido <b>${Math.round(runStats.taken)}</b></span><span>Precisión de proyectiles <b>${runStats.shots?Math.round(runStats.hits/runStats.shots*100):0} %</b></span><span>Bajas con poderes <b>${runStats.abilityKills}</b></span><span>Jefes <b>${runStats.bosses} / 3</b></span><span>Dificultad <b>${DIFFICULTIES[runStats.difficulty].name}</b></span></div><p>Mejoras: ${Object.entries(runStats.upgrades).map(([name,n])=>name+' ×'+n).join(' · ')||'Ninguna'}</p><p>Evoluciones: ${runStats.evolutions.map(id=>EVOLUTIONS.find(r=>r.id===id).name).join(', ')||'Ninguna'}</p><p>Maestría de ${heroes.find(h=>h.id===runStats.agent).name}: nivel ${masteryLevel(runStats.agent)} / 5</p></div></details>`;}
const MISSIONS=[{id:'kills',name:'Elimina 150 enemigos',target:150,reward:80},{id:'time',name:'Sobrevive 5 minutos en total',target:300,reward:100},{id:'ability',name:'Derrota 30 enemigos con poderes u objetos',target:30,reward:120}];
const WEEKLY_MISSIONS=[
 {id:'kills',name:'Elimina 3000 enemigos',target:3000,ticket:'legendary'},
 {id:'time',name:'Sobrevive 120 minutos en total',target:7200,ticket:'legendary'},
 {id:'bosses',name:'Derrota 15 jefes',target:15,ticket:'legendary'},
 {id:'wins',name:'Completa 5 partidas de 15 minutos',target:5,ticket:'ultra'}
];
function claimWeekly(id){refreshDaily();const m=WEEKLY_MISSIONS.find(m=>m.id===id);if(!m||meta.weekly.claimed.includes(id)||meta.weekly[id]<m.target)return false;meta.weekly.claimed.push(id);meta.tickets[m.ticket]++;saveMeta();return true;}
function missionContent(weekly=false){
 const list=weekly?WEEKLY_MISSIONS:MISSIONS,stats=weekly?meta.weekly:meta.daily;
 return `<header class="progress-section-heading"><h2>${weekly?'Misiones semanales':'Misiones del día'}</h2><span>${weekly?'Renovación · lunes 00:00 Madrid':'Renovación · 00:00 Madrid'}</span></header><div class="mission-cards">${list.map(m=>`<div class="mission${weekly?' weekly-mission':''}"><strong>${m.name}</strong><b class="mission-reward">${weekly?(m.ticket==='ultra'?'1 gacha ultralegendario':'1 gacha legendario+'):`${m.reward} KC`}</b><progress max="${m.target}" value="${stats[m.id]}" aria-label="${m.name}"></progress><span>${m.id==='time'?Math.floor(Math.min(m.target,stats[m.id])/60)+' / '+Math.floor(m.target/60)+' min':Math.min(m.target,Math.floor(stats[m.id]))+' / '+m.target}</span><button ${weekly?'data-claim-weekly':'data-claim'}="${m.id}" ${stats.claimed.includes(m.id)||stats[m.id]<m.target?'disabled':''}>${stats.claimed.includes(m.id)?'Cobrado':'Cobrar'}</button></div>`).join('')}</div>`;
}
function ticketControls(){return `<div class="gacha-tickets"><button data-ticket="legendary" title="80 % legendario · 20 % ultralegendario" ${!meta.tickets.legendary?'disabled':''}>Legendario+ · ${meta.tickets.legendary}</button><button data-ticket="ultra" title="Ultralegendario garantizado" ${!meta.tickets.ultra?'disabled':''}>Ultralegendario · ${meta.tickets.ultra}</button></div>`;}
let progressionTab='misiones';
function progressionTabs(){return `<nav class="progression-tabs" role="tablist" aria-label="Secciones de progreso">${[['misiones','Misiones'],['agente','Agente'],['arsenal','Arsenal'],['guardado','Guardado']].map(([id,name])=>`<button role="tab" id="progression-tab-${id}" aria-controls="progression-panel-${id}" aria-selected="${id===progressionTab}" tabindex="${id===progressionTab?0:-1}" data-progression-tab="${id}">${name}</button>`).join('')}</nav>`;}
function progressionPanel(id){return `id="progression-panel-${id}" role="tabpanel" aria-labelledby="progression-tab-${id}" ${progressionTab===id?'':'hidden'}`;}
function progressEmblem(kind){
 const paths={download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',upload:'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',reset:'M4 11a8 8 0 1 1 2 7M4 4v7h7',rail:'M4 18 18 4m-8 0h8v8M5 10l-2 3 8 8 3-2',storm:'m14 2-9 12h7l-2 8 9-12h-7Z',nova:'m12 2 2 6 6-2-3 6 5 3-7 1-1 6-4-5-6 2 3-6-5-3 7-1Z'};
 return `<span class="progress-emblem" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" stroke-linejoin="bevel"><path d="${paths[kind]||paths.nova}"/></svg></span>`;
}
function arsenalIngredient(name,count){const u=upgrades.find(u=>u.name===name);return `<span class="arsenal-ingredient">${u?upgradeIcon(u):''}<span>${name}<b>×${count}</b></span></span>`;}
function prestigeReady(){return meta.prestige.level<40&&meta.wins.reduce((a,b)=>a+b,0)>meta.prestige.winsSpent;}
function buyPrestigeUpgrade(id){
 if(state!=='menu')return false;const u=PRESTIGE_UPGRADES.find(u=>u.id===id);if(!u||meta.prestige.points<1||meta.prestige.upgrades[id]>=u.max)return false;
 const next=cleanMeta(meta);next.prestige.upgrades[id]++;next.prestige.points--;try{localStorage.setItem(META_KEY,JSON.stringify(next));meta=next;return true;}catch{return false;}
}
function prestigeWorkshop(){return `<section class="prestige-workshop"><div class="prestige-workshop-heading"><h3>Mejoras de prestigio</h3><span>${meta.prestige.points} puntos disponibles · Prestigio ${meta.prestige.level}</span></div><div class="prestige-upgrades">${PRESTIGE_UPGRADES.map(u=>`<article>${upgradeIcon(u)}<h4>${u.name}</h4><p>${u.desc}</p><div><span>Nivel ${meta.prestige.upgrades[u.id]} / ${u.max}</span><button data-prestige-upgrade="${u.id}" ${meta.prestige.points<1||meta.prestige.upgrades[u.id]>=u.max?'disabled':''}>${meta.prestige.upgrades[u.id]>=u.max?'Al máximo':'Mejorar · 1 punto'}</button></div></article>`).join('')}</div></section>`;}
function saveIllustration(kind){
 const drawings={
 download:'<path d="M65 45h47l19 19v59H65zM111 45v20h20"/><path class="save-art-bright" d="M98 75v29m-12-12 12 12 12-12M82 114h32"/><path d="M44 139h108l9 13H35zM58 132v-16m79 16v-16"/>',
 upload:'<path d="M63 47h50l19 19v58H63zM112 47v20h20"/><path class="save-art-bright" d="M98 110V80m-12 12 12-12 12 12"/><path d="M39 137h117M47 137v-25h16m69 0h16v25M55 150h86"/>',
 reset:'<path d="M63 55h61l15 16v62H63zM123 55v17h16"/><path class="save-art-bright" d="M78 104a23 23 0 1 0 6-18M77 76v17h17"/><path d="M47 54v-14h20m65 0h20v20M47 132v20h20m65 0h20v-20"/>'};
 return `<div class="save-art" aria-hidden="true"><svg viewBox="0 0 196 180" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="bevel"><path class="save-art-orbit" d="M20 56 53 23h90l33 33v70l-33 31H53l-33-31Z"/><path class="save-art-grid" d="M28 90h140M98 20v142M40 40l116 116M40 150 156 34"/>${drawings[kind]}<path class="save-art-bright" d="M29 70v18m0 9v5m138 5v18m0-32v5"/></svg></div>`;
}
function progressionScreen(){
 refreshDaily();const hero=activeHero(),level=masteryLevel(hero.id);
 return `<h1>Progreso</h1>${progressionTabs()}<div class="progression-grid">
 <article ${progressionPanel('misiones')}><section class="mission-group">${missionContent()}</section><section class="mission-group">${missionContent(true)}</section></article>
 <article ${progressionPanel('agente')}><div class="agent-dashboard">
 <section class="agent-mastery-banner" style="--agent-color:${hero.color}">
 <div class="agent-mastery-portrait">${heroPortrait(hero,true)}</div>
 <div class="agent-mastery-summary"><span class="agent-section-label">MAESTRÍA DE AGENTE</span><h2>${hero.name}</h2><div class="agent-xp-heading"><strong>Nivel ${level}<span> / 5</span></strong><span>${meta.mastery[hero.id]||0} XP</span></div><progress class="mastery-progress" max="1250" value="${Math.min(1250,meta.mastery[hero.id]||0)}" aria-label="Experiencia de maestría"></progress><p class="agent-next-level">${level<5?Math.max(0,(level+1)*250-(meta.mastery[hero.id]||0))+' XP para el siguiente nivel':'Maestría completada'}</p><div class="agent-mastery-milestones"><span class="${level>=2?'unlocked':''}">Nv. 2 · Coral</span><span class="${level>=4?'unlocked':''}">Nv. 4 · Glacial</span></div></div>
 <div class="agent-appearance"><label for="mastery-skin">Aspecto<select id="mastery-skin"><option value="0">Original</option><option value="1" ${level<2?'disabled':''}>Coral · nivel 2</option><option value="2" ${level<4?'disabled':''}>Glacial · nivel 4</option></select></label><p>Gana XP con bajas, tiempo y jefes. Abandonar reduce la XP de la partida a la mitad.</p></div>
 </section>
 <section class="agent-difficulty-panel"><div class="agent-difficulty-heading"><h2>Dificultad</h2><span>Para tu próxima partida</span></div><select id="difficulty-select" hidden aria-label="Dificultad">${DIFFICULTIES.map((d,i)=>`<option value="${i}" ${i===meta.difficulty?'selected':''} ${i>0&&!meta.wins[i-1]?'disabled':''}>${d.name}</option>`).join('')}</select><div class="agent-difficulty-options">${DIFFICULTIES.map((d,i)=>{const locked=i>0&&!meta.wins[i-1];return `<button class="difficulty-option ${meta.difficulty===i?'selected':''}" data-difficulty="${i}" aria-pressed="${meta.difficulty===i}" ${locked?'disabled':''}><span class="difficulty-option-heading"><strong>${d.name}</strong><span>${locked?'Bloqueada':meta.difficulty===i?'Seleccionada':'Disponible'}</span></span><b>${i===0?'Recompensa base':'+'+Math.round((d.reward-1)*100)+' % de recompensa'}</b><span class="difficulty-option-detail">${i===0?'Resistencia y velocidad normales.':i===1?'Enemigos más resistentes y rápidos.':'Mayor resistencia, velocidad y presión.'}</span><small>${locked?'Completa '+DIFFICULTIES[i-1].name:'Lista para jugar'}</small></button>`;}).join('')}</div></section>
 </div></article>
 <article ${progressionPanel('arsenal')}><div class="arsenal-dashboard"><header class="progress-section-heading"><h2>Evoluciones de armas</h2><span>Se activan al reunir las mejoras durante la partida</span></header><div class="arsenal-recipes">${EVOLUTIONS.map((r,i)=>`<section class="arsenal-recipe" style="--recipe-color:${['#8ce0df','#f3cd71','#bf9aff'][i]}"><div class="arsenal-recipe-name">${progressEmblem(r.id)}<h3>${r.name}</h3></div><div class="arsenal-recipe-ingredients">${Object.entries(r.needs).map(([name,n],i)=>(i?'<span class="recipe-plus" aria-hidden="true">+</span>':'')+arsenalIngredient(name,n)).join('')}</div><span class="recipe-arrow" aria-hidden="true">→</span><div class="arsenal-recipe-effect"><span>EFECTO</span><p>${r.desc}</p></div></section>`).join('')}</div><div class="arsenal-synergies"><h2>Sinergias</h2><div><section class="arsenal-synergy">${progressEmblem('storm')}<div><h3>Críticos eléctricos</h3><p class="synergy-needs">30 % de crítico + Gatillo veloz</p><p>Los críticos encadenan electricidad.</p></div></section><section class="arsenal-synergy">${progressEmblem('nova')}<div><h3>Impactos explosivos</h3><p class="synergy-needs">Proyectiles que atraviesan + Núcleo ardiente ×2</p><p>Cada tercer impacto del mismo proyectil explota.</p></div></section></div></div></div></article>
 <article ${progressionPanel('guardado')}><div class="save-dashboard"><header class="progress-section-heading"><h2>Gestionar progreso</h2><div class="save-inventory-summary"><span><b>${progress.owned.length}</b> ${progress.owned.length===1?'agente':'agentes'}</span><span><b>${progress.ownedWeapons.length}</b> ${progress.ownedWeapons.length===1?'arma':'armas'}</span><span><b>${progress.coins.toLocaleString('es-ES')}</b> KC</span></div></header><div class="save-actions">
 <section class="save-action save-download">${saveIllustration('download')}<div class="save-action-copy"><span class="save-file-tag">.VALOROGUE</span><h3>Descargar copia</h3><p>Conserva tus agentes, armas, KC, mejoras y misiones en un archivo protegido.</p></div><button id="export-save" class="save-action-button"><span>Descargar</span><span aria-hidden="true">↧</span></button></section>
 <section class="save-action save-upload">${saveIllustration('upload')}<div class="save-action-copy"><span class="save-file-tag">.VALOROGUE</span><h3>Restaurar copia</h3><p>Recupera un archivo .valorogue. Sustituirá el progreso de este navegador.</p></div><label class="save-action-button save-import"><span>Seleccionar copia</span><span aria-hidden="true">↥</span><input id="import-save" type="file" accept=".valorogue" aria-label="Seleccionar copia para restaurar"></label></section>
 <section class="save-action save-reset">${saveIllustration('reset')}<div class="save-action-copy"><span class="save-file-tag">PRESTIGIO ${meta.prestige.level}</span><h3>Reiniciar y mejorar</h3><p>Reinicia tus KC y mejoras compradas para ganar 1 punto de prestigio. Conserva tu colección, maestría, misiones, tickets y récords.</p><p class="prestige-requirement">${meta.prestige.level>=40?'Prestigio completado':prestigeReady()?'Listo: ganarás 1 punto':'Completa una nueva partida de 15 minutos para desbloquearlo'}</p></div><button id="reset-save" class="save-action-button" ${!prestigeReady()?'disabled':''}>Ascender · +1 punto</button></section>
 </div>${prestigeWorkshop()}<p id="backup-status" role="status"></p></div></article>
 </div>`;
}
function bindProgression(){
 const root=document.getElementById('menu-content');
 root.querySelectorAll('[data-prestige-upgrade]').forEach(b=>b.onclick=()=>{if(buyPrestigeUpgrade(b.dataset.prestigeUpgrade))showMenu('progreso');});
 root.querySelectorAll('[data-claim-weekly]').forEach(b=>b.onclick=()=>{if(claimWeekly(b.dataset.claimWeekly))showMenu('progreso');});
 root.querySelectorAll('[data-progression-tab]').forEach(button=>{button.onclick=()=>{progressionTab=button.dataset.progressionTab;root.querySelectorAll('[data-progression-tab]').forEach(tab=>{const active=tab===button;tab.setAttribute('aria-selected',active);tab.tabIndex=active?0:-1;document.getElementById('progression-panel-'+tab.dataset.progressionTab).hidden=!active;});root.querySelector('.progression-grid').scrollTop=0;};button.onkeydown=event=>{const tabs=[...root.querySelectorAll('[data-progression-tab]')],index=tabs.indexOf(button);let next;if(event.key==='ArrowRight')next=tabs[(index+1)%tabs.length];if(event.key==='ArrowLeft')next=tabs[(index+tabs.length-1)%tabs.length];if(event.key==='Home')next=tabs[0];if(event.key==='End')next=tabs[tabs.length-1];if(next){event.preventDefault();next.click();next.focus();}};});
 root.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{refreshDaily();const m=MISSIONS.find(m=>m.id===b.dataset.claim);if(!m||meta.daily.claimed.includes(m.id)||meta.daily[m.id]<m.target)return;meta.daily.claimed.push(m.id);progress.coins+=m.reward;saveMeta();saveProgress();showMenu('progreso');});
 const skin=root.querySelector('#mastery-skin');if(skin){skin.value=meta.skins[activeHero().id]||0;skin.onchange=()=>{const n=Number(skin.value);if(n===0||masteryLevel(activeHero().id)>=(n===1?2:4)){meta.skins[activeHero().id]=n;saveMeta();}};}
 root.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.difficulty);if(n===0||meta.wins[n-1]){meta.difficulty=n;saveMeta();showMenu('progreso');}});
 const select=root.querySelector('#difficulty-select');if(select)select.onchange=()=>{const n=Number(select.value);if(n===0||meta.wins[n-1]){meta.difficulty=n;saveMeta();}};
 bindBackupControls(root);
}
