'use strict';
// Names/categories: official VALORANT arsenal. Values are balanced for this arena.
// id, name, category, price, mode, damage, interval, magazine, reload, pellets, spread, speed, life
const weaponDefinitions=[
 ['classic','Classic','Pistolas',0,'semi',1,.24,12,1.5,1,0,530,1.5],
 ['shorty','Shorty','Pistolas',160,'semi',.6,.5,2,1.6,7,.5,500,.4],
 ['frenzy','Frenzy','Pistolas',220,'auto',.75,.1,13,1.5,1,.1,530,.85],
 ['ghost','Ghost','Pistolas',260,'semi',1.4,.22,15,1.6,1,.015,620,1.6],
 ['bandit','Bandit','Pistolas',320,'semi',1.7,.27,8,1.8,1,.025,600,1.6],
 ['sheriff','Sheriff','Pistolas',400,'semi',3,.5,6,2,1,.01,700,1.8],
 ['stinger','Stinger','Subfusiles',450,'burst',.7,.075,20,1.8,1,.14,550,.8],
 ['spectre','Spectre','Subfusiles',600,'auto',1,.09,30,2,1,.06,600,1],
 ['bucky','Bucky','Escopetas',500,'semi',.8,.85,5,2.3,8,.5,500,.5],
 ['judge','Judge','Escopetas',800,'auto',.65,.32,7,2.2,7,.45,500,.5],
 ['bulldog','Bulldog','Fusiles',850,'burst',1.4,.14,24,2,1,.04,680,1.5],
 ['guardian','Guardian','Fusiles',1100,'semi',3.2,.4,12,2.2,1,0,850,1.6],
 ['phantom','Phantom','Fusiles',1300,'auto',1.8,.1,30,2.5,1,.025,750,1.5],
 ['vandal','Vandal','Fusiles',1350,'auto',2.2,.12,25,2.5,1,.04,780,1.6],
 ['marshal','Marshal','Francotiradores',900,'semi',5.5,.95,5,2.4,1,0,1000,1.8],
 ['outlaw','Outlaw','Francotiradores',1250,'semi',7.5,.55,2,2.4,1,0,1000,1.8],
 ['operator','Operator','Francotiradores',1800,'semi',14,1.5,5,3,1,0,1100,2],
 ['ares','Ares','Ametralladoras',950,'auto',1.2,.105,50,3,1,.09,650,1.4],
 ['odin','Odin','Ametralladoras',1750,'auto',1.5,.075,100,4,1,.1,650,1.4],
 ['knife','Cuchillo táctico','Cuerpo a cuerpo',200,'melee',3.5,.45,0,0,1,.65,0,0]
];
const WEAPONS=weaponDefinitions.map(([id,name,category,price,mode,damage,rate,magazine,reload,pellets,spread,speed,life])=>({id,name,category,price,mode,damage,rate,magazine,reload,pellets,spread,speed,life}));
const alternateFire={
    classic:{kind:'spread',rounds:3,spread:.42,cooldown:.75}
};
const primaryBursts={
    bulldog:{kind:'burst',rounds:3,gap:.085,cooldown:.42},
    stinger:{kind:'burst',rounds:4,gap:.065,cooldown:.4}
};
const weaponById=id=>WEAPONS.find(w=>w.id===id)||WEAPONS[0];
function selectedWeapon(){return weaponById(progress.selectedWeapon);}
function currentWeapon(){return weaponById(player?player.weaponId:progress.selectedWeapon);}
function weaponMode(weapon){if(weapon.mode==='burst')return `Ráfaga de ${primaryBursts[weapon.id].rounds} por clic`;const mode=weapon.mode==='auto'?'Automática':weapon.mode==='melee'?'Cuerpo a cuerpo':'Un disparo por clic';return alternateFire[weapon.id]?`${mode} · Alt. ×${alternateFire[weapon.id].rounds}`:mode;}
const SHOP_SLOTS=6,SHOP_ZONE='Europe/Madrid';
const shopDateFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:SHOP_ZONE,year:'numeric',month:'2-digit',day:'2-digit'});
function shopDay(date=new Date()){
    const parts=shopDateFormatter.formatToParts(date),get=key=>parts.find(p=>p.type===key).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
}
function dailyWeapons(date=new Date()){
    let seed=2166136261;for(const c of shopDay(date))seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const pool=WEAPONS.filter(w=>w.price>0);
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return pool.slice(0,SHOP_SLOTS);
}
function nextShopRefresh(date=new Date()){
    const day=shopDay(date);let low=date.getTime(),high=low+27*3600000;
    // Find the actual local midnight; also handles the 23/25-hour DST days.
    while(high-low>1){const mid=Math.floor((high+low)/2);if(shopDay(new Date(mid))===day)low=mid;else high=mid;}
    return high;
}
let displayedShopDay='',shopRefreshAt=0,shopMessage='',inventoryPage='agents',shopPage=0;
function buyWeapon(id,date=new Date()){
    if(state!=='menu'||currentTab!=='tienda')return false;
    const weapon=WEAPONS.find(w=>w.id===id);
    if(!weapon||!dailyWeapons(date).some(w=>w.id===id)){shopMessage='La tienda ha cambiado. Consulta las armas disponibles hoy.';showMenu('tienda');return false;}
    if(progress.ownedWeapons.includes(id))return false;
    if(progress.coins<weapon.price)return false;
    progress.coins-=weapon.price;progress.ownedWeapons.push(id);saveProgress();
    shopMessage=`${weapon.name} añadida a tu inventario. Es tuya para siempre.`;showMenu('tienda');return true;
}
function equipWeapon(id){
    if(state!=='menu'||!hasWeapon(id))return false;
    progress.selectedWeapon=id;saveProgress();showMenu('inventario');return true;
}
function weaponCard(weapon,shop=false){
    const owned=shop?progress.ownedWeapons.includes(weapon.id):hasWeapon(weapon.id),equipped=progress.selectedWeapon===weapon.id;
    return `<article class="hero-card weapon-card"><div class="weapon-portrait">${weaponPortrait(weapon)}</div><h2>${weapon.name}</h2><dl class="weapon-specs"><div><dt>Daño${weapon.pellets>1?' / perdigón':''}</dt><dd>${weapon.damage}${weapon.pellets>1?` × ${weapon.pellets}`:''}</dd></div><div><dt>Cadencia</dt><dd>${(1/weapon.rate).toFixed(1)} /s</dd></div><div><dt>Cargador</dt><dd>${weapon.magazine||'—'}</dd></div><div><dt>${weapon.mode==='melee'?'Alcance':'Recarga'}</dt><dd>${weapon.mode==='melee'?'58 px':`${weapon.reload} s`}</dd></div></dl>${shop?`<button data-purchase-weapon="${weapon.id}" ${owned||progress.coins<weapon.price?'disabled':''}>${owned?'Ya está en tu inventario':`Comprar · KC ${weapon.price}`}</button>`:`<button data-equip-weapon="${weapon.id}" ${equipped?'disabled':''}>${equipped?'Equipada':'Equipar'}</button>`}</article>`;
}
function shopScreen(date=new Date()){
    displayedShopDay=shopDay(date);shopRefreshAt=nextShopRefresh(date);
    return `<h1>Tienda de armas</h1><div class="shop-summary"><span>Renovación a las 00:00 · Madrid</span><strong id="shop-countdown"></strong></div><p id="shop-message" role="status">${shopMessage}</p><div class="collection weapon-collection">${dailyWeapons(date).map(w=>weaponCard(w,true)).join('')}</div><nav class="shop-pages" aria-label="Páginas de la tienda"><button id="shop-prev" aria-label="Página anterior">‹</button><span id="shop-page" aria-live="polite"></span><button id="shop-next" aria-label="Página siguiente">›</button></nav>`;
}
function inventoryTabs(){return `<div class="inventory-tabs" role="group" aria-label="Tipo de inventario"><button data-inventory="agents" class="${inventoryPage==='agents'?'active':''}" aria-pressed="${inventoryPage==='agents'}">Agentes · ${availableAgents().length}</button><button data-inventory="weapons" class="${inventoryPage==='weapons'?'active':''}" aria-pressed="${inventoryPage==='weapons'}">Armas · ${availableWeapons().length}</button></div>`;}
function weaponInventory(){return `<div class="collection-scroll" tabindex="0" role="region" aria-label="Armas del inventario"><div class="collection weapon-collection">${WEAPONS.filter(w=>hasWeapon(w.id)).map(w=>weaponCard(w)).join('')}</div></div>`;}
function layoutShop(){
 const grid=document.querySelector('#menu-dialog[data-panel="tienda"] .weapon-collection');if(!grid)return;
 const columns=innerWidth<600?1:innerWidth<900?2:3,rows=innerHeight>=800&&innerWidth>=600?2:1,size=columns*rows;
 const cards=[...grid.children],pages=Math.ceil(cards.length/size);shopPage=Math.max(0,Math.min(shopPage,pages-1));
 grid.style.gridTemplateColumns=`repeat(${columns},minmax(0,1fr))`;
 cards.forEach((card,i)=>card.hidden=i<shopPage*size||i>=(shopPage+1)*size);
 const nav=document.querySelector('.shop-pages');nav.hidden=pages===1;
 document.getElementById('shop-page').textContent=`${shopPage+1} / ${pages}`;
 const prev=document.getElementById('shop-prev'),next=document.getElementById('shop-next');prev.disabled=shopPage===0;next.disabled=shopPage===pages-1;
 prev.onclick=()=>{shopPage--;layoutShop();};next.onclick=()=>{shopPage++;layoutShop();};
}
window.addEventListener('resize',layoutShop);
function bindWeaponMenu(){
 layoutShop();
    lobby.querySelectorAll('[data-purchase-weapon]').forEach(b=>b.onclick=()=>buyWeapon(b.dataset.purchaseWeapon));
    lobby.querySelectorAll('[data-equip-weapon]').forEach(b=>b.onclick=()=>equipWeapon(b.dataset.equipWeapon));
    lobby.querySelectorAll('[data-inventory]').forEach(b=>b.onclick=()=>{inventoryPage=b.dataset.inventory;showMenu('inventario');});
    updateShopClock();
}
function updateShopClock(){
    if(state!=='menu'||currentTab!=='tienda')return;
    const now=new Date();if(shopDay(now)!==displayedShopDay){shopMessage='Nueva rotación diaria disponible.';showMenu('tienda');return;}
    const remaining=Math.max(0,Math.ceil((shopRefreshAt-now.getTime())/1000)),hours=Math.floor(remaining/3600),minutes=Math.floor(remaining%3600/60),seconds=remaining%60;
    const counter=document.getElementById('shop-countdown');if(counter)counter.textContent=`${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}
setInterval(updateShopClock,1000);
function resetWeapon(){
    const weapon=selectedWeapon();player.weaponId=weapon.id;player.magazineBonus=0;player.reloadScale=Math.pow(.95,progress.upgrades.reload||0);player.ammo=weapon.magazine;player.reloadLeft=0;player.reloadTotal=0;player.burstRemaining=0;player.burstClock=0;player.burstProfile=null;
}
function magazineCapacity(){const w=currentWeapon();return w.magazine? w.magazine+(player.magazineBonus||0):0;}
function reloadDuration(){return currentWeapon().reload*(player.reloadScale||1);}
function magazineIncrease(){return Math.max(1,Math.ceil(currentWeapon().magazine*.2));}
function reloadWeapon(){
    if(state!=='playing'||player.reloadLeft>0)return false;
    const weapon=currentWeapon();if(!weapon.magazine||player.ammo===magazineCapacity())return false;
    player.burstRemaining=0;player.burstProfile=null;player.reloadLeft=reloadDuration();player.reloadTotal=player.reloadLeft;updateWeaponHUD();return true;
}
function updateWeapon(dt){
    if(player.burstRemaining>0&&player.reloadLeft<=0){
        player.burstClock-=dt;
        // No wall-clock timers: bursts stop during pauses and level-up choices.
        while(player.burstRemaining>0&&player.burstClock<=0){
            const profile=player.burstProfile;player.burstRemaining--;
            if(!fireWeapon({burstStep:true})){player.burstRemaining=0;player.burstProfile=null;break;}
            if(player.burstRemaining>0)player.burstClock+=profile.gap*cadenceScale();
            else{fireClock=profile.cooldown*cadenceScale();player.burstProfile=null;}
        }
    }
    if(player.reloadLeft>0){player.reloadLeft=Math.max(0,player.reloadLeft-dt);if(player.reloadLeft===0)player.ammo=magazineCapacity();}
}
function cadenceScale(){return (player.rate/currentWeapon().rate)/(player.stim>0?1.2:1);}
function updateWeaponHUD(){
    if(!player)return;const weapon=currentWeapon();
    const evolved=runStats&&runStats.evolutions.length?runStats.evolutions.map(id=>EVOLUTIONS.find(r=>r.id===id)):[];
    document.getElementById('weapon-name').textContent=weapon.name+(evolved.length?' · '+evolved[evolved.length-1].name:'');
    document.getElementById('weapon-hud').classList.toggle('evolved',evolved.length>0);
    document.getElementById('weapon-hud').title=evolved.map(e=>e.name+': '+e.desc).join(' · ');
    document.getElementById('weapon-ammo').textContent=weapon.magazine?`${player.ammo} / ${magazineCapacity()}`:'∞';
    const status=document.getElementById('weapon-state');
    status.textContent=player.reloadLeft>0?`Recargando · ${player.reloadLeft.toFixed(1)} s`:player.burstRemaining>0?'Ráfaga en curso':'';
    status.hidden=!status.textContent;
    document.getElementById('weapon-hud').classList.toggle('reloading',player.reloadLeft>0);
}
function fireWeapon({secondary=false,burstStep=false}={}){
    if(state!=='playing'||(!burstStep&&(fireClock>0||player.burstRemaining>0))||player.reloadLeft>0)return false;
    const weapon=currentWeapon(),alternate=secondary?alternateFire[weapon.id]:(!burstStep?primaryBursts[weapon.id]:null);
    if(secondary&&!alternate)return false;
    if(weapon.magazine&&player.ammo<=0){reloadWeapon();return false;}
    const angle=aimAngle(),muzzle=weaponMuzzle(weapon,player,angle);
    if(weapon.mode==='melee'){
        const boosted=player.heavyShots>0;if(boosted)player.heavyShots--;const ultMultiplier=ultimateDamage();
        for(const e of enemies){const d=distance(e,player),delta=Math.atan2(Math.sin(Math.atan2(e.y-player.y,e.x-player.x)-angle),Math.cos(Math.atan2(e.y-player.y,e.x-player.x)-angle));if(e.hp>0&&d<=58+e.r&&Math.abs(delta)<.8&&clearTerrainLine(player.x,player.y,e.x,e.y,0))damageEnemy(e,player.damage*(boosted?3:1)*ultMultiplier,'weapon');}
        addSkillEffect('beam',player.x,player.y,{angle,length:58,width:35,life:.16,color:'#c3dce4'});
    }else{
        if(bullets.length>=220||!clearTerrainLine(player.x,player.y,muzzle.x,muzzle.y,4))return false;
        const boosted=player.heavyShots>0;if(boosted)player.heavyShots--;const ultMultiplier=ultimateDamage();
        const rounds=alternate&&alternate.kind==='spread'?Math.min(alternate.rounds,player.ammo):1;
        const total=Math.min(32,(alternate&&alternate.kind==='spread'?rounds:weapon.pellets)+player.shots-1);
        for(let i=0;i<total&&bullets.length<220;i++){
            const spread=alternate&&alternate.kind==='spread'?alternate.spread:weapon.pellets>1?weapon.spread:.16*(player.shots-1),a=angle+(alternate&&alternate.kind==='spread'?(Math.random()-.5)*spread:total>1?(i/(total-1)-.5)*spread:0)+(weapon.spread&&weapon.pellets===1?(Math.random()-.5)*weapon.spread:0);
            const critical=Math.random()<player.crit;if(runStats)runStats.shots++;
            bullets.push({chamberRound:boosted&&activeHero().id==='chamber',agentPiercing:boosted&&activeHero().id==='chamber'&&hasAgentUpgrade(0),playerWeapon:true,critical,x:muzzle.x,y:muzzle.y,vx:Math.cos(a)*weapon.speed,vy:Math.sin(a)*weapon.speed,speed:weapon.speed,life:Math.max(weapon.life,player.artifacts.includes('bounce')?4:0)*player.range,damage:player.damage*(boosted?3:1)*ultMultiplier*(critical?2:1),hit:new Set(),bounces:3});
        }
        player.ammo-=rounds;
    }
    fireClock=player.rate/(player.stim>0?1.2:1);
    if(alternate){
        fireClock=alternate.cooldown*cadenceScale();
        if(alternate.kind==='burst'&&player.ammo>0){player.burstProfile=alternate;player.burstRemaining=Math.min(alternate.rounds-1,player.ammo);player.burstClock=alternate.gap*cadenceScale();}
    }

    if(weapon.magazine&&player.ammo===0)reloadWeapon();updateWeaponHUD();return true;
}
function pressWeapon(event){
    if((event.button!==0&&event.button!==2)||state!=='playing')return;
    const rect=canvas.getBoundingClientRect();mouse.x=event.clientX-rect.left;mouse.y=event.clientY-rect.top;
    if(event.button===0)mouse.down=true;canvas.focus();fireWeapon({secondary:event.button===2});
}
