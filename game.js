'use strict';
const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const ui = Object.fromEntries(['health', 'wave', 'kills', 'time', 'xpbar', 'level', 'pause'].map(id => [id, document.getElementById(id)]));
let W = 1000, H = 600, state = 'menu', player, enemies = [], bullets = [], gems = [], pickups = [], particles = [], keys = new Set(), mouse = { x: 500, y: 300, down: false };
let elapsed = 0, kills = 0, wave = 1, spawnClock = 0, fireClock = 0, last = 0, shake = 0, choices = [];
const rand = (a, b) => a + Math.random() * (b - a), distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let best = 0; try { best = Number(localStorage.getItem('chispa-best')) || 0; } catch { }
function resize() {
    const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    const oldW=W,oldH=H;W=r.width;H=r.height;
    canvas.width=Math.max(1,Math.round(W));canvas.height=Math.max(1,Math.round(H));ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
    if(terrainReady){
        const sx=W/oldW,sy=H/oldH,seen=new Set();
        const reposition=item=>{if(!item||seen.has(item))return;seen.add(item);if(Number.isFinite(item.x))item.x*=sx;if(Number.isFinite(item.y))item.y*=sy;};
        reposition(player);[enemies,bullets,gems,pickups,particles,skillEffects,soulOrbs,enemyShots,attackWarnings].forEach(list=>list.forEach(reposition));
        if(player){reposition(player.anchor);reposition(player.ultRevive);}
        for(const warning of attackWarnings){if(Number.isFinite(warning.tx))warning.tx*=sx;if(Number.isFinite(warning.ty))warning.ty*=sy;}
        mouse.x=Math.max(0,Math.min(W,mouse.x*sx));mouse.y=Math.max(0,Math.min(H,mouse.y*sy));
        buildTerrain();
        if(player)freeTerrainPosition(player);for(const e of enemies)freeTerrainPosition(e);
        for(const item of [...gems,...pickups,...soulOrbs]){const point={x:item.x,y:item.y,r:6};freeTerrainPosition(point);item.x=point.x;item.y=point.y;}
    }
}

new ResizeObserver(resize).observe(canvas);
new ResizeObserver(entries=>{const height=Math.ceil(entries[0].target.getBoundingClientRect().height);if(document.documentElement.style.getPropertyValue('--topbar-height')!==height+'px')document.documentElement.style.setProperty('--topbar-height',height+'px');}).observe(document.querySelector('header'));
function panel(title, body, button, action) { overlay.classList.remove('hidden'); overlay.innerHTML = `<div class="panel report-${state}"><span class="eyebrow">${state === 'won' ? 'OPERACIÓN COMPLETADA / VICTORIA' : state === 'dead' ? 'OPERACIÓN FINALIZADA / DERROTA' : 'CHISPA / CONTROL'}</span><h2>${title}</h2><p>${body}</p><button class="primary">${button}</button></div>`; overlay.querySelector('button').onclick = action; }
function start() { konamiBuffer=[]; pendingUpgrade = false; pendingArtifact = false; completedPhases = 0; showGame(); runCoins = 0; rewardPaid = false; keys.clear(); player = { x: W / 2, y: H / 2, r: 12, hp: 100, max: 100, speed: 210, damage: 1, rate: .24, shots: 1, xp: 0, need: 6, level: 1, inv: 0, artifacts: [], pickupRadius: 100, range: 1, crit: 0, armor: 0 }; applyProgress(); resetWeapon(); resetAbilities(); resetUltimate(); resetExpansion(); buildTerrain(true); freeTerrainPosition(player); enemies = []; bullets = []; gems = []; pickups = []; particles = []; elapsed = 0; kills = 0; wave = 1; spawnClock = .6; fireClock = 0; mouse.down = false; shake = 0; state = 'playing'; overlay.classList.add('hidden'); ui.pause.textContent = 'Pausar'; canvas.focus(); updateHUD(); }
function updateHUD() { document.getElementById('health-fill').style.width = `${player.hp / player.max * 100}%`; document.getElementById('health-text').textContent = `${Math.ceil(player.hp)} / ${player.max} PV`; ui.health.setAttribute('aria-valuemin', '0'); ui.health.setAttribute('aria-valuemax', player.max); ui.health.setAttribute('aria-valuenow', player.hp); document.getElementById('health-fill').style.background = player.hp / player.max <= .3 ? '#ff5865' : '#8ce0df'; ui.wave.textContent = `OLEADA ${wave}`; ui.kills.textContent = `${kills} BAJAS`; ui.time.textContent = `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')} / 15:00`; document.getElementById('run-coins').textContent = `KC ${runCoins}`; ui.level.textContent = `${terrainStyle.name.toUpperCase()} · NIVEL ${player.level} · FASE ${Math.min(3, completedPhases + 1)} / 3${player.artifacts.length ? ' · ' + player.artifacts.map(id => artifacts.find(a => a.id === id).icon).join(' ') : ''}`; document.getElementById('xp-text').textContent=`XP ${player.xp} / ${player.need}`; ui.xpbar.style.width = `${player.xp / player.need * 100}%`; updateAbilityHUD(); updateWeaponHUD(); updateUltimateHUD(); updateBossHUD(); }
const upgrades = [
    { name: 'Flujo de habilidad', icon: '◷', desc: 'Reduce un 15 % la recarga de E, incluida la que esté en curso. Se acumula hasta un 65 % de reducción total.', available: () => player.skillScale>.350001, apply: () => { const previous=player.skillScale;player.skillScale=Math.max(.35,previous*.85);skillCooldown*=player.skillScale/previous; } },
    { name: 'Cargador ampliado', icon: '▤', desc: '+20 % de la capacidad base del cargador (mínimo 1 bala). Se acumula.', available: () => currentWeapon().magazine>0, apply: () => { player.magazineBonus+=magazineIncrease(); } },
    { name: 'Recarga rápida', icon: '↻', desc: 'Reduce un 15 % el tiempo de recarga. Se acumula.', available: () => currentWeapon().magazine>0, apply: () => { player.reloadScale*=.85; if(player.reloadLeft>0){player.reloadLeft*=.85;player.reloadTotal*=.85;} } },
    { name: 'Núcleo ardiente', icon: '✦', desc: '+1 de daño por proyectil.', apply: () => player.damage++ },
    { name: 'Gatillo veloz', icon: 'ϟ', desc: 'Dispara un 20 % más rápido.', apply: () => player.rate = Math.max(.065, player.rate * .8) },
    { name: 'Paso ligero', icon: '➚', desc: '+15 % de velocidad de movimiento.', apply: () => player.speed *= 1.15 },
    { name: 'Corazón de musgo', icon: '♥', desc: '+20 PV máximos y recupera toda la vida.', apply: () => { player.max += 20; player.hp = player.max; } },
    { name: 'Abanico de fuego', icon: '⋔', desc: 'Un proyectil adicional por disparo.', apply: () => player.shots++ },
    { name: 'Segundo aliento', icon: '✚', desc: 'Recupera 60 PV y gana un 10 % de velocidad.', apply: () => { player.hp = Math.min(player.max, player.hp + 60); player.speed *= 1.1; } },
    { name: 'Imán', icon: '∩', desc: '+60 píxeles de radio para atraer experiencia. Se acumula al elegirla de nuevo.', apply: () => player.pickupRadius += 60 },
    { name: 'Largo alcance', icon: '◎', desc: '+25 % de alcance: los proyectiles duran más tiempo.', apply: () => player.range *= 1.25 },
    { name: 'Golpe crítico', icon: '✧', desc: '+10 puntos de probabilidad de causar el doble de daño. Máximo: 60 %.', available: () => player.crit < .6, apply: () => player.crit = Math.min(.6, Math.round((player.crit + .1) * 10) / 10) },
    { name: 'Corteza protectora', icon: '▣', desc: 'Recibe 3 PV menos por contacto. El daño mínimo es de 5 PV.', available: () => player.armor < 15, apply: () => player.armor = Math.min(15, player.armor + 3) }

];
function levelUp() { player.xp -= player.need; player.level++; player.need = Math.ceil(player.need * 1.45); choices = upgrades.filter(u => !u.available || u.available()).sort(() => Math.random() - .5).slice(0, 3); pendingUpgrade = true; renderUpgrade(); }
function upgradePreview(upgrade) {
    const speed = value => `${Math.round(value)} px/s`;
    const rate = value => `${(1 / value).toFixed(1)} /s`;
    const stats = {
        'Flujo de habilidad': ['Recarga de E', `${(activeHero().cooldown*player.skillScale).toFixed(1)} s`, `${(activeHero().cooldown*Math.max(.35,player.skillScale*.85)).toFixed(1)} s`],
        'Cargador ampliado': ['Cargador', magazineCapacity(), magazineCapacity()+magazineIncrease()],
        'Recarga rápida': ['Recarga', `${reloadDuration().toFixed(2)} s`, `${(reloadDuration()*.85).toFixed(2)} s`],
        'Núcleo ardiente': ['Daño', player.damage, player.damage + 1],
        'Gatillo veloz': ['Disparos', rate(player.rate), rate(Math.max(.065, player.rate * .8))],
        'Paso ligero': ['Velocidad', speed(player.speed), speed(player.speed * 1.15)],
        'Corazón de musgo': ['Vida máxima', `${player.max} PV`, `${player.max + 20} PV`],
        'Abanico de fuego': ['Proyectiles', player.shots, player.shots + 1],
        'Imán': ['Radio de recogida', `${player.pickupRadius} px`, `${player.pickupRadius + 60} px`],
        'Largo alcance': ['Alcance', `${Math.round(currentWeapon().speed * Math.max(currentWeapon().life,player.artifacts.includes('bounce')?4:0) * player.range)} px`, `${Math.round(currentWeapon().speed * Math.max(currentWeapon().life,player.artifacts.includes('bounce')?4:0) * player.range * 1.25)} px`],
        'Golpe crítico': ['Probabilidad', `${Math.round(player.crit * 100)} %`, `${Math.min(60, Math.round(player.crit * 100) + 10)} %`],
        'Corteza protectora': ['Daño recibido', `${20 - player.armor} PV`, `${Math.max(5, 20 - player.armor - 3)} PV`],
        'Segundo aliento': ['Vida', `${Math.ceil(player.hp)} PV`, `${Math.ceil(Math.min(player.max, player.hp + 60))} PV`]
    };
    const [label, before, after] = stats[upgrade.name];
    return `<span class="upgrade-stat"><span class="stat-label">${label}</span><span class="stat-change"><span>${before}</span><span class="stat-arrow" aria-hidden="true">→</span><strong>${after}</strong></span></span>`;
}
function renderUpgrade() { state = 'upgrade'; mouse.down = false; overlay.classList.remove('hidden'); overlay.innerHTML = `<div class="panel upgrade-panel"><h2>Subida de nivel <span class="level-number">${player.level}</span></h2><div class="cards">${choices.map((u, i) => `<button class="card" data-choice="${i}"><span class="upgrade-icon" aria-hidden="true">${upgradeIcon(u)}</span><b>${u.name}</b><small>${u.desc}</small>${upgradePreview(u)}<span class="pick-upgrade">Elegir mejora</span></button>`).join('')}</div><button id="reroll-upgrades" ${runStats.rerolls<=0?'disabled':''}>Cambiar opciones · ${runStats.rerolls} restantes</button></div>`; document.getElementById('reroll-upgrades').onclick=rerollUpgrades;overlay.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => { const selected=choices[Number(b.dataset.choice)];selected.apply();choseUpgrade(selected); pendingUpgrade = false; state = 'playing'; overlay.classList.add('hidden'); canvas.focus(); updateHUD(); }); }
function reportTime(){return `${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;}
function reportScreen(kind,title,label,stats,details=''){
    overlay.classList.remove('hidden');
    overlay.innerHTML=`<section class="panel session-report report-${kind}" aria-label="${title}"><div class="report-heading"><span class="report-symbol" aria-hidden="true">${kind==='paused'?'Ⅱ':kind==='won'?'✓':'×'}</span><div><span class="eyebrow">${label}</span><h2>${title}</h2></div></div><dl class="report-stats">${stats.map(([name,value])=>`<div><dt>${name}</dt><dd>${value}</dd></div>`).join('')}</dl>${details}<div class="report-actions"></div></section>`;
}
function reportButton(label,action,primary=false){
    const button=document.createElement('button');button.textContent=label;if(primary)button.className='primary';button.onclick=action;overlay.querySelector('.report-actions').appendChild(button);return button;
}
function renderPause(){
    reportScreen('paused','Partida en pausa','OPERACIÓN EN CURSO',[
        ['Tiempo',reportTime()],['Fase',`${Math.min(3,completedPhases+1)} / 3`],['Vida',`${Math.ceil(player.hp)} / ${player.max} PV`]
    ],`<p class="report-note">El tiempo está detenido. Continúa cuando estés listo.</p><details class="paused-build"><summary>Mejoras y evoluciones actuales</summary><p>${Object.entries(runStats.upgrades).map(([name,n])=>name+' ×'+n).join(' · ')||'Sin mejoras de nivel'}</p><p>Evoluciones: ${runStats.evolutions.map(id=>EVOLUTIONS.find(r=>r.id===id).name).join(', ')||'Ninguna'}</p></details>`);
    reportButton('Continuar partida',pause,true);
    reportButton('Terminar partida',()=>document.getElementById('home').click());
}
function pause() { if (state === 'playing') { state = 'paused'; mouse.down = false; keys.clear(); ui.pause.textContent = 'Continuar'; renderPause(); } else if (state === 'paused') { if (pendingArtifact) { renderArtifacts(); return; } if (pendingUpgrade) { renderUpgrade(); return; } state = 'playing'; ui.pause.textContent = 'Pausar'; overlay.classList.add('hidden'); canvas.focus(); } }
ui.pause.onclick = pause;
document.getElementById('ability').onclick=activateAbility;
document.getElementById('ultimate').onclick=activateUltimate;
window.addEventListener('keydown', e => { if(e.code==='Escape'&&state==='menu'&&document.getElementById('how-to-play').open){e.preventDefault();document.getElementById('how-to-play').open=false;return;} if ((state === 'playing' || state === 'paused') && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); if (!e.repeat && (e.code === 'KeyP' || e.code === 'Escape') && (state === 'playing' || state === 'paused')) { e.preventDefault(); pause(); } if(!e.repeat&&e.code==='KeyR'&&state==='playing'){e.preventDefault();reloadWeapon();} if(e.code==='KeyE'&&state==='playing'){e.preventDefault();if(!e.repeat)activateAbility();} if(e.code==='KeyX'&&state==='playing'){e.preventDefault();if(!e.repeat)activateUltimate();} keys.add(e.code); });
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => { keys.clear(); mouse.down = false; if (state === 'playing') pause(); });
canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
canvas.addEventListener('pointerdown',pressWeapon); canvas.addEventListener('contextmenu',event=>event.preventDefault()); window.addEventListener('pointerup', () => mouse.down = false);
function burst(x, y, color, n = 8) { for (let i = 0; i < n && particles.length < 180; i++)particles.push({ x, y, vx: rand(-90, 90), vy: rand(-90, 90), life: rand(.15, .45), color }); }
function spawn() { const side = Math.floor(rand(0, 4)), strong = Math.random() < Math.min(.35, wave * .045); enemies.push(chooseEnemy({ x: side === 0 ? -20 : side === 1 ? W + 20 : rand(0, W), y: side === 2 ? -20 : side === 3 ? H + 20 : rand(0, H), strong, r: strong ? 17 : 11, hp: strong ? 3 + Math.floor(wave / 3) : 1 + Math.floor(wave / 4), speed: (strong ? 43 : 65) + wave * 5, color: strong ? '#bf88d6' : '#de866d' })); }
const pickupTypes = {
    heal: { icon: '+', color: '#90efb0' },
    bomb: { icon: '✹', color: '#ffae76' },
    magnet: { icon: '∩', color: '#88caff' }
};
function defeatEnemy(enemy, allowPickup = true, source='bomb') {
    // All deaths share XP, coins and kill credit, including bomb kills.
    if(enemy.defeated)return;enemy.defeated=true;
    enemy.hp = 0; kills++; ultimateKill();recordKill(enemy,source);
    if(activeHero().id==='reyna'&&soulOrbs.length<60)soulOrbs.push({x:enemy.x,y:enemy.y,life:3});
    if (Math.random() < player.creditChance) {
        const amount = 2;
        runCoins += amount; progress.coins += amount; saveProgress();
    }
    if (gems.length < 220) gems.push({ x: enemy.x, y: enemy.y, value: 1 });
    if (allowPickup && pickups.length < 40) {
        const roll = Math.random(), factor = enemy.strong ? 2 : 1;
        const type = roll < .03 * factor ? 'heal' : roll < .04 * factor ? 'bomb' : roll < .06 * factor ? 'magnet' : null;
        if (type) pickups.push({ x: Math.max(16, Math.min(W - 16, enemy.x)), y: Math.max(16, Math.min(H - 16, enemy.y)), type, life: 30 });
    }
    burst(enemy.x, enemy.y, enemy.color);
}
function collectPickup(item) {
    burst(item.x, item.y, pickupTypes[item.type].color, 16);
    if (item.type === 'heal') player.hp = Math.min(player.max, player.hp + player.max * .1);
    if (item.type === 'magnet') { for (const gem of gems) gem.magnetized = true; }
    if (item.type === 'bomb') {
        for (const enemy of enemies) {
            if (enemy.hp > 0 && enemy.x >= 0 && enemy.x <= W && enemy.y >= 0 && enemy.y <= H) damageEnemy(enemy,enemy.boss?enemy.max*.2:enemy.hp*3,'bomb');
        }
        enemies = enemies.filter(enemy => enemy.hp > 0); shake = 12;
    }
}
function aimAngle() { return Math.atan2(mouse.y - player.y, mouse.x - player.x); }
function shoot() { return fireWeapon(); }
function finishRun(manual = false) {
    if (rewardPaid) return 0;
    rewardPaid = true;
    const reward = Math.floor((10 + Math.floor(elapsed / 5) + Math.floor(kills / 2))*difficulty().reward);
    settleExpansion(state==='won',manual);
    const loss = manual ? Math.ceil((runCoins + reward) / 2) : 0;
    progress.coins += reward - loss; progress.best = Math.max(progress.best, kills); best = progress.best;
    saveProgress(); return reward;
}
function die() {
    if(ultimateSave())return;
    state = 'dead'; mouse.down = false; keys.clear();
    const reward = finishRun();
    reportScreen('dead','Fin de la partida','OPERACIÓN FINALIZADA / DERROTA',[
        ['Tiempo',reportTime()],['Bajas',kills],['Jefes',`${runStats.bosses} / 3`]
    ],`<div class="report-reward"><span>Créditos de enemigos <strong>KC ${runCoins}</strong></span><span>Recompensa final <strong>KC ${reward}</strong></span><span>Total <strong>KC ${runCoins+reward}</strong></span></div>`);
    overlay.querySelector('.panel').insertAdjacentHTML('beforeend',statisticsHTML());
    reportButton('Volver a intentarlo',start,true);
    reportButton('Volver al menú',()=>showMenu('jugar'));
}
function update(dt) {
    elapsed = Math.min((completedPhases+1)*300, elapsed + dt);
    if(phaseGate()){updateHUD();return;}
    updateExpansion(dt);if(state!=='playing')return;
    updateAgentTimers(dt); updateWeapon(dt);
    wave = 1 + Math.floor(elapsed / 22); spawnClock -= dt; if (spawnClock <= 0) { if (enemies.length < 100) spawn(); spawnClock = Math.max(.17, .95 - wave * .075)/difficulty().spawn; } player.inv = Math.max(0, player.inv - dt); let dx = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')), dy = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')); let len = Math.hypot(dx, dy) || 1; moveOnTerrain(player, dx / len * player.speed * (player.sprint>0?player.sprintFactor:1) * dt, dy / len * player.speed * (player.sprint>0?player.sprintFactor:1) * dt); player.x = Math.max(15, Math.min(W - 15, player.x)); player.y = Math.max(15, Math.min(H - 15, player.y)); refreshFlow(dt); fireClock=Math.max(0,fireClock-dt); if(mouse.down&&currentWeapon().mode==='auto')shoot();
    updateSkillEffects(dt); updateUltimate(dt);
    for (const b of bullets) {
        if (player.artifacts.includes('homing')) {
            const targets = enemies.filter(e => e.hp > 0 && !b.hit.has(e));
            if (targets.length) { const target = targets.reduce((a, c) => distance(a, b) < distance(c, b) ? a : c); const angle = Math.atan2(target.y - b.y, target.x - b.x); b.vx = Math.cos(angle) * (b.speed||530); b.vy = Math.sin(angle) * (b.speed||530); }
        }
        const nextX = b.x + b.vx * dt, nextY = b.y + b.vy * dt;
        if (!clearTerrainLine(b.x, b.y, nextX, nextY, 4)) { b.life = 0; burst(b.x, b.y, '#9caa7b', 3); continue; }
        b.x = nextX; b.y = nextY; b.life -= dt;
        if (player.artifacts.includes('bounce') && b.bounces > 0) {
            if (b.x < 4 || b.x > W - 4) { b.vx *= -1; b.x = Math.max(4, Math.min(W - 4, b.x)); b.bounces--; }
            if ((b.y < 4 || b.y > H - 4) && b.bounces > 0) { b.vy *= -1; b.y = Math.max(4, Math.min(H - 4, b.y)); b.bounces--; }
        }
        for (const e of enemies) {
            if (e.hp > 0 && b.life > 0 && !b.hit.has(e) && distance(b, e) < e.r + 4) {
                damageEnemy(e,b.damage,b.source||'weapon',b);bulletImpact(b,e); b.hit.add(e);
                if (!player.artifacts.includes('piercing')) b.life = 0;
                if (player.artifacts.includes('frost')) e.slow = 2;
                burst(b.x, b.y, '#e1f7a3', 4); if (e.hp <= 0) defeatEnemy(e);
            }
        }
    }
    bullets = bullets.filter(b => b.life > 0 && b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30); enemies = enemies.filter(e => e.hp > 0);
    for (const e of enemies) { const d = distance(e, player) || 1; e.slow = Math.max(0, (e.slow || 0) - dt); const speed = e.speed * (e.slow > 0 ? .5 : 1) * (e.stun>0||e.root>0?0:1); const clone=skillEffects.find(f=>f.type==='clone'&&distance(f,e)<320); const target = clone&&clearTerrainLine(e.x,e.y,clone.x,clone.y,e.r)?clone:terrainEnemyTarget(e), td = distance(target, e) || 1; if(!updateAdvancedEnemy(e,dt))moveOnTerrain(e, (target.x - e.x) / td * speed * dt, (target.y - e.y) / td * speed * dt); if (d < e.r + player.r && player.inv <= 0 && !(e.stun>0)) { takeArenaDamage(Math.max(5,20-player.armor)*(e.suppressed>0?.5:1)+player.armor);if(state!=='playing')return; } }
    for (const item of [...pickups]) {
        item.life -= dt;
        if (distance(item, player) < player.r + 13) { item.life = 0; collectPickup(item); }
    }
    pickups = pickups.filter(item => item.life > 0);
    for (const g of gems) {
        const d = distance(g, player);
        if (g.magnetized || d < player.pickupRadius) {
            const step = Math.min(d, (g.magnetized ? 600 : Math.max(300, player.pickupRadius * 3)) * dt);
            if (d > 0) { g.x += (player.x - g.x) / d * step; g.y += (player.y - g.y) / d * step; }
        }
        if (distance(g, player) < 19) { player.xp += g.value; g.value = 0; }
    } gems = gems.filter(g => g.value); for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; } particles = particles.filter(p => p.life > 0); shake = Math.max(0, shake - dt * 35); if (player.xp >= player.need) levelUp(); updateHUD();
}
function circle(x, y, r, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x - r), Math.round(y - r), r * 2, r * 2); }
function draw() {
    ctx.clearRect(0, 0, W, H); ctx.save(); if (shake) ctx.translate(Math.round(rand(-shake, shake) / 2) * 2, Math.round(rand(-shake, shake) / 2) * 2); ctx.imageSmoothingEnabled = false;
    if (groundLayer) ctx.drawImage(groundLayer, 0, 0, W, H);
    drawExpansion(false);drawAbilityEffects();
    for (const g of gems) {
        const bob = Math.floor(elapsed * 3) % 2 * 2;
        ctx.fillStyle='#071c2c';ctx.fillRect(Math.round(g.x-8),Math.round(g.y+7),16,4);
        drawSprite(ctx,'gem',g.x,g.y-bob,3);
        if(Math.floor(elapsed*2)%2===0){ctx.fillStyle='#c7faff';ctx.fillRect(Math.round(g.x+10),Math.round(g.y-bob-8),2,2);}
    }
    for (const b of bullets) { circle(b.x, b.y, 3, runStats&&runStats.evolutions.includes('nova')?'#ffb078':runStats&&runStats.evolutions.includes('storm')?'#ff788a':'#8ce0df'); circle(b.x, b.y, 1, '#f2eee5'); }
    const actors = enemies.map(e => ({ actor: e, hero: false })); if (player) actors.push({ actor: player, hero: true }); actors.sort((a, b) => a.actor.y - b.actor.y);
    for (const { actor: a, hero } of actors) {
        if (hero && a.inv > 0 && Math.floor(a.inv * 15) % 2) continue;
        ctx.fillStyle = '#09131f'; ctx.fillRect(Math.round(a.x - 12), Math.round(a.y + 9), 24, 6);
        const walking = hero && (keys.has('KeyW') || keys.has('KeyA') || keys.has('KeyS') || keys.has('KeyD') || [...keys].some(k => k.startsWith('Arrow')));
        const bob = walking || !hero ? Math.floor(elapsed * 7) % 2 * 2 : 0;
        if (hero) {if(runStats.evolutions.length)ctx.filter=runStats.evolutions.includes('nova')?'sepia(.6) saturate(2)':'saturate(1.8) hue-rotate(320deg)';drawEquippedWeapon(ctx, a.x, a.y, aimAngle());ctx.filter='none';}
        if(hero)ctx.filter=masteryFilter(activeHero().id);
        if(hero)drawSprite(ctx,`agent:${activeHero().id}`,a.x,a.y-bob,2,activeHero().color);else drawCombatActor(ctx,a,bob);
        ctx.filter='none';
        if (hero) {
            ctx.strokeStyle='#8ce0df';ctx.lineWidth=2;ctx.beginPath();
            for(const side of [-1,1]){ctx.moveTo(Math.round(a.x+side*18),Math.round(a.y-8));ctx.lineTo(Math.round(a.x+side*18),Math.round(a.y+10));ctx.lineTo(Math.round(a.x+side*12),Math.round(a.y+10));}ctx.stroke();
        }
    }
    drawAbilityEffects(true);drawExpansion(true);
    for (const item of pickups) { ctx.globalAlpha = item.life < 5 ? .5 + .5 * Math.sin(elapsed * 12) : 1; drawSprite(ctx, item.type, item.x, item.y, 2); }
    ctx.globalAlpha = 1; for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 3); circle(p.x, p.y, 2, p.color); } ctx.globalAlpha = 1; ctx.restore();
}
function frame(now) { const dt = Math.min(.04, (now - last) / 1000 || 0); last = now; if (state === 'playing') update(dt); if (state !== 'menu') draw(); requestAnimationFrame(frame); }
const heroes = AGENTS;
const permanent = [
    { id: 'health', name: 'Vitalidad', icon: '♥', desc: '+20 PV iniciales por nivel.', base: 50, max: 5 },
    { id: 'damage', name: 'Potencia', icon: '✦', desc: '+1 de daño inicial por nivel.', base: 80, max: 5 },
    { id: 'speed', name: 'Agilidad', icon: '➚', desc: '+10 % de velocidad inicial por nivel.', base: 40, max: 5 },
    { id: 'rate', name: 'Cadencia', icon: 'ϟ', desc: 'Reduce un 8 % el intervalo entre disparos por nivel.', base: 60, max: 5 },
    { id: 'credits', name: 'Prospección Kingdom', icon: '◇', desc: '+5 puntos de probabilidad de obtener 2 KC por baja. Máximo: 50 %.', base: 100, max: 5 },
    { id: 'pickup', name: 'Recolector', icon: '∩', desc: '+20 píxeles de radio inicial para atraer experiencia por nivel.', base: 45, max: 5 },
    { id: 'reload', name: 'Armero', icon: '↻', desc: 'Reduce un 5 % la recarga del arma por nivel.', base: 65, max: 5 },
    { id: 'ability', name: 'Sincronización', icon: '◷', desc: 'Reduce un 5 % la recarga de E por nivel.', base: 90, max: 5 }
];
let permanentPage=0;
const GACHA_COST = 50;
let progress = { coins: 0, owned: ['sage'], selected: 'sage', upgrades: Object.fromEntries(permanent.map(u=>[u.id,0])), ownedWeapons:['classic'],selectedWeapon:'classic', best: best };
try {
    const data = JSON.parse(localStorage.getItem('chispa-progress'));
    if (data && typeof data === 'object') {
        progress.coins = Number.isSafeInteger(data.coins) && data.coins >= 0 ? data.coins : 0;
        const owned=(Array.isArray(data.owned)?data.owned:[]).map(migrateAgentId);
        progress.owned = heroes.filter(h => h.id === 'sage' || owned.includes(h.id)).map(h => h.id);
        progress.ownedWeapons=WEAPONS.filter(w=>w.id==='classic'||(Array.isArray(data.ownedWeapons)&&data.ownedWeapons.includes(w.id))).map(w=>w.id);
        progress.selectedWeapon=progress.ownedWeapons.includes(data.selectedWeapon)?data.selectedWeapon:'classic';
        const selected=migrateAgentId(data.selected);
        progress.selected = progress.owned.includes(selected) ? selected : 'sage';
        permanent.forEach(u => { const n = data.upgrades && data.upgrades[u.id]; progress.upgrades[u.id] = Number.isInteger(n) ? Math.max(0, Math.min(u.max, n)) : 0; });
        progress.best = Number.isSafeInteger(data.best) && data.best >= 0 ? Math.max(best, data.best) : best;
    }
} catch { }
best = progress.best;
let runCoins = 0, rewardPaid = true, pendingUpgrade = false, currentTab = 'jugar';
const initialLobby = document.getElementById('lobby'), menuDialog = document.getElementById('menu-dialog');
let lobby = initialLobby;
const playArea = document.getElementById('play-area'), navigation = document.getElementById('navigation');
let sessionUnlocks=false,permanentAgentSelection=progress.selected,permanentWeaponSelection=progress.selectedWeapon;
let konamiBuffer=[];
const konamiSequence=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA','Enter'];
function availableAgents(){return sessionUnlocks?heroes.map(h=>h.id):progress.owned;}
function availableWeapons(){return sessionUnlocks?WEAPONS.map(w=>w.id):progress.ownedWeapons;}
function hasAgent(id){return availableAgents().includes(id);}
function hasWeapon(id){return availableWeapons().includes(id);}
function unlockKonami(){
    sessionUnlocks=true;konamiBuffer=[];inventoryPage='agents';showMenu('inventario');
}
window.addEventListener('keydown',event=>{
    const editing=event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable]');
    if(state!=='menu'||isSummoning||editing||event.isComposing){konamiBuffer=[];return;}
    if(event.repeat)return;
    konamiBuffer.push(event.code);if(konamiBuffer.length>konamiSequence.length)konamiBuffer.shift();
    if(event.code.startsWith('Arrow'))event.preventDefault();
    if(konamiBuffer.length===konamiSequence.length&&konamiBuffer.every((key,i)=>key===konamiSequence[i])){
        event.preventDefault();event.stopImmediatePropagation();unlockKonami();
    }
},true);
function activeHero() { return heroes.find(h => h.id === progress.selected) || heroes[0]; }
function updateWallet(){
    const wallet=document.getElementById('wallet');
    wallet.innerHTML=`<img class="currency-icon" src="assets/Kingdom_Credits.webp" alt=""><strong>${progress.coins.toLocaleString('es-ES')}</strong><small class="currency-long">Kingdom Credits</small><small class="currency-short">KC</small>`;
    wallet.setAttribute('aria-label',`${progress.coins} Kingdom Credits`);
}
function saveProgress() {
    if(progress.owned.includes(progress.selected))permanentAgentSelection=progress.selected;
    if(progress.ownedWeapons.includes(progress.selectedWeapon))permanentWeaponSelection=progress.selectedWeapon;
    const saved={...progress,selected:permanentAgentSelection,selectedWeapon:permanentWeaponSelection};
    try { localStorage.setItem('chispa-progress',JSON.stringify(saved)); }
    catch { document.getElementById('save-status').textContent='No se ha podido guardar: el progreso durará hasta cerrar esta página.'; }
    updateWallet();
}
function applyProgress() { const u=progress.upgrades;player.max+=20*u.health;player.hp=player.max;player.damage=selectedWeapon().damage+u.damage;player.speed*=1+u.speed*.1;player.rate=selectedWeapon().rate*Math.pow(.92,u.rate);player.creditChance=.25+.05*(u.credits||0);player.pickupRadius+=20*(u.pickup||0); }
function showGame() { document.getElementById('how-to-play').open=false; menuDialog.close(); initialLobby.hidden = true; document.body.classList.remove('in-menu'); lobby.hidden = true; navigation.hidden = true; playArea.hidden = false; resize(); }
function heroSummary(hero){
    const u=progress.upgrades;
    const hp=100+20*u.health;
    const damage=selectedWeapon().damage+u.damage;
    const speed=Math.round(210*(1+u.speed*.1));
    return `<div class="hero-summary"><span>Vida <strong>${hp} PV</strong></span><span>Daño <strong>${damage}</strong></span><span>Velocidad <strong>${speed} px/s</strong></span></div>`;
}
function permanentPreview(upgrade){
    const n=progress.upgrades[upgrade.id]||0,next=Math.min(upgrade.max,n+1);
    const format=level=>{
        switch(upgrade.id){
            case 'health':return `+${level*20} PV`;
            case 'damage':return `+${level} daño`;
            case 'speed':return `+${level*10} %`;
            case 'rate':return `${(1/(selectedWeapon().rate*Math.pow(.92,level))).toFixed(1)} /s`;
            case 'credits':return `${25+level*5} %`;
            case 'pickup':return `${100+level*20} px`;
            case 'reload':return selectedWeapon().magazine?`${(selectedWeapon().reload*Math.pow(.95,level)).toFixed(2)} s`:`−${((1-Math.pow(.95,level))*100).toFixed(1)} %`;
            case 'ability':return `${(activeHero().cooldown*Math.pow(.95,level)).toFixed(1)} s`;
        }
    };
    return `<div class="upgrade-stat"><span class="stat-label">${n===upgrade.max?'Mejora completa':'Actual → siguiente nivel'}</span><span class="stat-change"><span>${format(n)}</span>${n===upgrade.max?'':`<span class="stat-arrow" aria-hidden="true">→</span><strong>${format(next)}</strong>`}</span></div><div class="permanent-level" aria-label="Nivel ${n} de ${upgrade.max}">${Array.from({length:upgrade.max},(_,i)=>`<span class="${i<n?'filled':''}"></span>`).join('')}</div><span class="permanent-level-label">Nivel ${n} / ${upgrade.max}</span>`;
}
let collectionAgents=[],collectionIsInventory=false;
function agentCollection(list,inventory){
    collectionAgents=list;collectionIsInventory=inventory;
    return `<div class="agent-filters"><label>Buscar agente<input id="agent-search" type="search" placeholder="Nombre del agente" autocomplete="off"></label><label>Rareza<select id="agent-rarity"><option value="">Todas</option>${rarityTiers.map(r=>`<option>${r.name}</option>`).join('')}</select></label><span id="agent-count" aria-live="polite">${list.length} agentes</span></div><div id="agent-grid" class="collection">${list.map(h=>heroCard(h,inventory)).join('')}</div>`;
}
function bindAgentFilters(){
    const search=document.getElementById('agent-search'),rarity=document.getElementById('agent-rarity');if(!search||!rarity)return;
    const filter=()=>{const list=collectionAgents.filter(h=>h.name.toLocaleLowerCase('es').includes(search.value.trim().toLocaleLowerCase('es'))&&(!rarity.value||h.rarity===rarity.value));document.getElementById('agent-grid').innerHTML=list.length?list.map(h=>heroCard(h,collectionIsInventory)).join(''):'<p class="empty-collection">No hay agentes con este filtro.</p>';document.getElementById('agent-count').textContent=`${list.length} agentes`;lobby.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>equipHero(b.dataset.equip));};
    search.oninput=filter;rarity.onchange=filter;
}
function agentInfoButton(hero){return `<button type="button" class="agent-info-button" data-agent-info="${hero.id}" aria-label="Información de ${hero.name}" aria-haspopup="dialog" title="Información de ${hero.name}">i</button>`;}
function heroCard(h, inventory = false) { const owned = hasAgent(h.id), selected = progress.selected === h.id; return `<article class="hero-card agent-collection-card ${!owned ? 'locked' : ''}" style="--rarity:${h.color}">${agentInfoButton(h)}<span class="rarity">${h.rarity}</span>${heroPortrait(h)}<h2>${h.name}</h2>${inventory ? `<button data-equip="${h.id}" ${!owned || selected ? 'disabled' : ''}>${selected ? 'Equipado' : owned ? 'Equipar' : 'Sin conseguir'}</button>` : `<small>${owned ? 'En tu inventario' : 'Por descubrir'}</small>`}</article>`; }
function showAgentInfo(id){
    const hero=heroes.find(h=>h.id===id);if(!hero||state!=='menu')return;
    const ultimate=ULTIMATES[id],dialog=document.getElementById('agent-info-dialog');
    dialog.style.setProperty('--rarity',hero.color);
    document.getElementById('agent-info-content').innerHTML=`<span class="rarity">${hero.rarity} · ${hasAgent(id)?'En tu inventario':'Sin conseguir'}</span>${heroPortrait(hero,true)}<h2 id="agent-info-title">${hero.name}</h2>${agentSkillDetails(hero)}<div class="agent-skill-info"><span class="skill-key">X</span><div><strong>${ultimate.name}</strong><p>${ultimate.description}</p><small>${ultimate.cost} eliminaciones para cargar la definitiva</small></div></div><p class="agent-info-chance">Probabilidad de invocación: ${formatChance(hero.chance)} %</p>`;
    if(!dialog.open)dialog.showModal();
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-agent-info]');if(button)showAgentInfo(button.dataset.agentInfo);});
const agentInfoDialog=document.getElementById('agent-info-dialog');
document.getElementById('close-agent-info').onclick=()=>agentInfoDialog.close();
agentInfoDialog.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();agentInfoDialog.close();});
document.addEventListener('keydown',event=>{if(event.code==='Escape'&&agentInfoDialog.open){event.preventDefault();event.stopImmediatePropagation();agentInfoDialog.close();}},true);
agentInfoDialog.addEventListener('click',event=>{if(event.target===agentInfoDialog){const r=agentInfoDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)agentInfoDialog.close();}});

function equipHero(id) { if (state !== 'menu' || !hasAgent(id)) return; progress.selected = id; saveProgress(); showMenu(currentTab); }
function upgradeCost(u) { return u.base * ((progress.upgrades[u.id]||0) + 1); }
function buyUpgrade(id) { if (state !== 'menu') return false; const u = permanent.find(x => x.id === id); if (!u) return false; const cost = upgradeCost(u); if (progress.upgrades[id] >= u.max || progress.coins < cost) return false; progress.coins -= cost; progress.upgrades[id]=(progress.upgrades[id]||0)+1; saveProgress(); showMenu('mejoras'); return true; }
let isSummoning=false;
function rollHero(){
    let roll=Math.random()*100;
    for(const hero of heroes){roll-=hero.chance;if(roll<0)return hero;}
    return heroes[heroes.length-1];
}
async function summon(){
    if(isSummoning||state!=='menu'||progress.coins<GACHA_COST)return null;
    const hero=rollHero(),duplicate=progress.owned.includes(hero.id);
    progress.coins-=GACHA_COST;
    if(duplicate)progress.coins+=20;else progress.owned.push(hero.id);
    // Persist the award before the animation so closing the browser cannot lose it.
    saveProgress();showMenu('gacha');isSummoning=true;
    const result=document.getElementById('gacha-result'),button=document.getElementById('summon'),close=document.getElementById('close-panel');
    button.disabled=true;button.textContent='Invocando…';close.disabled=true;result.setAttribute('aria-busy','true');
    const winnerIndex=32,strip=Array.from({length:38},(_,i)=>i===winnerIndex?hero:rollHero());
    result.innerHTML=`<div class="roulette"><p class="roulette-status" role="status">La ruleta está girando…</p><div class="roulette-window"><span class="roulette-pointer" aria-hidden="true">▼</span><div class="roulette-strip" aria-hidden="true">${strip.map(h=>`<div class="roulette-tile" style="--rarity:${h.color}">${heroPortrait(h)}<b>${h.name}</b><span class="rarity">${h.rarity}</span></div>`).join('')}</div><span class="roulette-marker" aria-hidden="true"></span></div></div>`;
    result.scrollIntoView({block:'nearest'});
    const track=result.querySelector('.roulette-strip'),viewport=result.querySelector('.roulette-window'),tile=track.firstElementChild;
    const step=tile.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap),from=viewport.clientWidth/2-tile.getBoundingClientRect().width/2,to=from-winnerIndex*step;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try{
        const animation=track.animate([{transform:`translateX(${from}px)`},{transform:`translateX(${to}px)`}],{duration:reduced?300:5200,easing:'cubic-bezier(.12,.74,.12,1)',fill:'forwards'});
        await animation.finished;
        track.children[winnerIndex].classList.add('roulette-winner');
        result.querySelector('.roulette-status').textContent='¡La ruleta se ha detenido!';
        await new Promise(resolve=>setTimeout(resolve,reduced?0:450));
    }catch{ /* Always reveal the already-saved award if animation is unavailable. */ }
    finally{isSummoning=false;close.disabled=false;result.removeAttribute('aria-busy');}
    result.innerHTML=`<div class="hero-card result gacha-reveal agent-collection-card" style="--rarity:${hero.color}">${agentInfoButton(hero)}<span class="rarity">${hero.rarity}</span>${heroPortrait(hero,true)}<h2>${hero.name}</h2><strong>${duplicate?'Repetido: recuperas 20 KC.':'¡Nuevo personaje! Ya está en tu inventario.'}</strong></div>`;
    button.disabled=progress.coins<GACHA_COST;button.textContent=`Invocar · KC ${GACHA_COST}`;
    result.focus();return hero;
}
function menuIcon(id){
    const paths={progreso:'<path d="M4 20V12h4v8M10 20V8h4v12M16 20V3h4v17M3 21h18"/>',jugar:'<path d="m8 4 12 8-12 8Z" fill="currentColor" stroke="none"/>',tienda:'<path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10q3 4 6 0 3 4 6 0 3 4 6 0M9 20v-6h6v6"/>',mejoras:'<path d="m4 11 8-8 8 8M4 21l8-8 8 8"/>',inventario:'<path d="m3 7 9-4 9 4v11l-9 4-9-4ZM3 7l9 5 9-5M12 12v10"/>',gacha:'<path d="M7 3h12v17H7ZM3 7v15h12M13 7l3 5-3 4-3-4Z"/>',personaje:'<circle cx="12" cy="7" r="4"/><path d="M3 22v-3c0-7 18-7 18 0v3Z"/>'};
    return `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${paths[id]||paths.mejoras}</svg>`;
}
function homeScreen(hero){
    const w=selectedWeapon(),damage=Number((w.damage+progress.upgrades.damage).toFixed(2)),rate=(1/(w.rate*Math.pow(.92,progress.upgrades.rate))).toFixed(1);
    const hint=(w.mode==='burst'?`Cada clic dispara una ráfaga de ${primaryBursts[w.id].rounds} balas.`:w.mode==='auto'?'Mantén pulsado el clic para disparar.':w.mode==='melee'?'Un clic para atacar a los enemigos cercanos.':'Cada clic realiza un disparo.')+(alternateFire[w.id]?` Clic derecho: ${alternateFire[w.id].kind==='burst'?'ráfaga de':'disparo triple de'} ${alternateFire[w.id].rounds} balas.`:'');
    return `<div class="home-heading"><div><p class="eyebrow">PREPARACIÓN / ARENA ROGUELIKE</p><h1>Tu próximo despliegue</h1></div><span class="home-record">RÉCORD PERSONAL<strong>${best} <small>bajas</small></strong></span></div><div class="collection home-loadout"><article class="hero-card home-agent" style="--rarity:${hero.color}"><div class="loadout-label"><span>01 / AGENTE</span><span class="rarity">${hero.rarity}</span></div><div class="agent-profile"><div class="agent-stage" data-agent="${hero.name}" aria-hidden="true">${heroPortrait(hero,true)}<span class="stage-caption">AGENTE EQUIPADO</span></div><div class="agent-identity"><h2>${hero.name}</h2><span class="skills-label">HABILIDADES</span><details class="loadout-skill"><summary><kbd>E</kbd><span>${hero.skill}</span><small>${(hero.cooldown*Math.pow(.95,progress.upgrades.ability||0)).toFixed(1)} s</small></summary><div><p>${hero.description}</p></div></details><details class="loadout-skill ultimate-details"><summary><kbd>X</kbd><span>${ULTIMATES[hero.id].name}</span><small>${ULTIMATES[hero.id].cost} bajas</small></summary><div><p>${ULTIMATES[hero.id].description}</p></div></details></div></div>${heroSummary(hero)}<label class="home-agent-picker"><span>Cambiar personaje</span><select id="home-agent-select" aria-label="Cambiar personaje">${heroes.filter(agent=>hasAgent(agent.id)).map(agent=>`<option value="${agent.id}" ${agent.id===hero.id?'selected':''}>${agent.name} · ${agent.rarity}</option>`).join('')}</select></label></article><article class="hero-card home-weapon" style="--rarity:#36d9d0"><div class="loadout-label"><span>02 / ARMA</span><span class="rarity">${w.category}</span></div><div class="home-weapon-heading"><h2>${w.name}</h2><span>${weaponMode(w)}</span></div><div class="home-weapon-art">${weaponPortrait(w)}</div><dl class="weapon-specs home-weapon-specs"><div><dt>Daño${w.pellets>1?' / perdigón':''}</dt><dd>${damage}${w.pellets>1?` × ${w.pellets}`:''}</dd></div><div><dt>Cadencia</dt><dd>${rate} <small>/s</small></dd></div><div><dt>Cargador</dt><dd>${w.magazine||'∞'}</dd></div><div><dt>Recarga</dt><dd>${w.reload?`${(w.reload*Math.pow(.95,progress.upgrades.reload||0)).toFixed(2)} s`:'—'}</dd></div><div><dt>Alcance base</dt><dd>${w.mode==='melee'?58:Math.round(w.speed*w.life)} <small>px</small></dd></div><div><dt>Proyectiles</dt><dd>${w.mode==='melee'?'—':w.pellets}</dd></div></dl><p class="home-weapon-hint">${hint}${w.magazine?' R para recargar.':''}</p><button id="change-home-weapon" class="loadout-action">${menuIcon('inventario')}<span>Cambiar arma</span><span aria-hidden="true">›</span></button></article></div><div class="home-briefing"><span><b>15:00</b> DURACIÓN</span><span><b>3</b> FASES · UN ARTEFACTO CADA 5 MIN</span><span><b>6</b> MAPAS · SELECCIÓN ALEATORIA</span></div>`;
}
function showMenu(tab = 'jugar') {
    if(isSummoning)return;
    document.getElementById('how-to-play').open=false;
    const isPanel = tab !== 'jugar';
    menuDialog.dataset.panel = tab;
    lobby = isPanel ? document.getElementById('menu-content') : initialLobby;
    if (!isPanel) menuDialog.close();
    initialLobby.hidden = false;
    state = 'menu'; currentTab = tab; mouse.down = false; keys.clear(); document.body.classList.add('in-menu'); lobby.hidden = false; navigation.hidden = false; playArea.hidden = true; overlay.classList.add('hidden');
    navigation.innerHTML = '<div class="menu-brand"><div class="brand">ÚLTIMA <br>CHISPA<span class="brand-line" aria-hidden="true"></span></div><span class="tag">OPERACIONES / ROGUELIKE</span></div>' + ['jugar', 'tienda', 'mejoras', 'inventario', 'gacha', 'progreso'].map(id => `<button data-tab="${id}" class="${id === tab ? 'active' : ''}" aria-current="${id === tab ? 'page' : 'false'}">${menuIcon(id)}<span>${id[0].toUpperCase()+id.slice(1)}</span></button>`).join('')+`<div class="nav-collection"><span>TU COLECCIÓN</span><strong>${availableAgents().length}<small> / ${heroes.length} agentes</small></strong><strong>${availableWeapons().length}<small> / ${WEAPONS.length} armas</small></strong></div>`;
    navigation.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => b.dataset.tab === 'jugar' ? start() : showMenu(b.dataset.tab));
    const h = activeHero();
    if(tab==='jugar')lobby.innerHTML=homeScreen(h);
    if(tab==='tienda')lobby.innerHTML=shopScreen();
    if(tab==='progreso')lobby.innerHTML=progressionScreen();
    if (tab === 'inventario') lobby.innerHTML = `<p class="eyebrow">TU COLECCIÓN · ${availableAgents().length} / ${heroes.length}</p><h1>Inventario</h1>${sessionUnlocks?'<p class="konami-note" role="status">Código Konami activado: todos los agentes y armas disponibles hasta recargar la página.</p>':''}${inventoryTabs()}${inventoryPage==='weapons'?weaponInventory():agentCollection(heroes.filter(h => hasAgent(h.id)),true)}`;
    if (tab === 'mejoras') lobby.innerHTML = `<p class="eyebrow">EL TALLER DEL REFUGIO</p><h1>Mejoras permanentes</h1><nav class="permanent-pages" aria-label="Grupos de mejoras"><button data-permanent-page="0" aria-pressed="${permanentPage===0}">Combate</button><button data-permanent-page="1" aria-pressed="${permanentPage===1}">Recursos y equipo</button></nav><p>Se aplican a todos tus personajes al empezar una partida. Cada mejora tiene cinco niveles.</p><div class="collection">${permanent.slice(permanentPage*4,permanentPage*4+4).map(u => { const n = progress.upgrades[u.id]||0, cost = upgradeCost(u); return `<article class="hero-card permanent-card"><span class="upgrade-icon" aria-hidden="true">${upgradeIcon(u)}</span><h2>${u.name}</h2><p>${u.desc}</p>${permanentPreview(u)}<button data-buy="${u.id}" ${n >= u.max || progress.coins < cost ? 'disabled' : ''}>${n >= u.max ? 'Al máximo' : `Mejorar · KC ${cost}`}</button></article>`; }).join('')}</div>`;
    if (tab === 'gacha') lobby.innerHTML = `<p class="eyebrow">EL PORTAL DE LAS CHISPAS</p><h1>Gacha</h1><p>Invoca uno de los ${heroes.length} agentes por ${GACHA_COST} Kingdom Credits. Si se repite, recuperas 20 KC.</p><button id="summon" class="primary" ${progress.coins < GACHA_COST ? 'disabled' : ''}>Invocar · KC ${GACHA_COST}</button>${progress.coins < GACHA_COST ? `<p>Te faltan ${GACHA_COST - progress.coins} KC. Consíguelas jugando.</p>` : ''}<div id="gacha-result" aria-live="polite" tabindex="-1"></div><p class="gacha-odds">Por rareza: común 60 % · raro 25 % · épico 10 % · legendario 4 % · ultralegendario 1 %. Repartido entre 6 agentes por rareza.</p>${agentCollection(heroes,false)}`;
    const changeAgent=document.getElementById('home-agent-select');if(changeAgent)changeAgent.onchange=()=>equipHero(changeAgent.value);
    const changeWeapon=document.getElementById('change-home-weapon');if(changeWeapon)changeWeapon.onclick=()=>{inventoryPage='weapons';showMenu('inventario');};
    bindAgentFilters(); bindWeaponMenu();if(tab==='progreso')bindProgression();
    if (isPanel) { menuDialog.setAttribute('aria-label', tab[0].toUpperCase() + tab.slice(1)); if (!menuDialog.open) menuDialog.showModal(); }
    const summonButton = document.getElementById('summon'); if (summonButton) summonButton.onclick = summon;
    lobby.querySelectorAll('[data-equip]').forEach(b => b.onclick = () => equipHero(b.dataset.equip));
    lobby.querySelectorAll('[data-permanent-page]').forEach(b=>b.onclick=()=>{permanentPage=Number(b.dataset.permanentPage);showMenu('mejoras');});
    lobby.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buyUpgrade(b.dataset.buy));
    lobby.querySelectorAll('[data-go]').forEach(b => b.onclick = () => showMenu(b.dataset.go));
    updateWallet();
    document.getElementById('session-mode').hidden=!sessionUnlocks;
}
document.getElementById('close-panel').onclick = () => showMenu('jugar');
menuDialog.addEventListener('cancel', e => { e.preventDefault(); showMenu('jugar'); });
document.getElementById('home').onclick = () => {
    if (['playing', 'paused', 'upgrade', 'artifact'].includes(state)) {
        state = 'paused'; keys.clear(); mouse.down = false;
        panel('¿Terminar esta partida?', 'Si abandonas, perderás el 50 % de los créditos conseguidos en esta partida, incluida la recompensa final. Los créditos anteriores se conservan.', 'Terminar y volver al menú', () => { finishRun(true); showMenu('jugar'); });
        const resume = document.createElement('button'); resume.textContent = 'Seguir jugando'; resume.onclick = () => { if (pendingArtifact) { renderArtifacts(); } else if (pendingUpgrade) { renderUpgrade(); } else { state = 'playing'; overlay.classList.add('hidden'); ui.pause.textContent = 'Pausar'; canvas.focus(); } }; overlay.querySelector('.panel').appendChild(resume);
    } else showMenu('jugar');
};

const artifacts = [
    { id: 'homing', name: 'Ojo del cometa', icon: '◎', desc: 'Los proyectiles persiguen al enemigo más cercano después de disparar.' },
    { id: 'piercing', name: 'Aguja del vacío', icon: '➶', desc: 'Los proyectiles atraviesan enemigos y pueden golpear a varios objetivos.' },
    { id: 'frost', name: 'Cristal invernal', icon: '❄', desc: 'Cada impacto ralentiza al enemigo un 50 % durante 2 segundos.' },
    { id: 'bounce', name: 'Espejo solar', icon: '◇', desc: 'Los proyectiles rebotan hasta tres veces en los bordes y duran más.' }
];
let completedPhases = 0, pendingArtifact = false, artifactChoices = [];
function phaseComplete() {
    completedPhases++; pendingArtifact = true; mouse.down = false; keys.clear();
    artifactChoices = artifacts.filter(a => !player.artifacts.includes(a.id)).sort(() => Math.random() - .5).slice(0, 3);
    renderArtifacts();
}
function renderArtifacts() {
    state = 'artifact'; overlay.classList.remove('hidden');
    overlay.innerHTML = `<div class="panel"><span class="eyebrow">FASE ${completedPhases} / 3 COMPLETADA</span><h2>Un poder ancestral.</h2><p>Elige un artefacto. Sus efectos se combinan y duran esta partida.${completedPhases === 3 ? ' Esta es tu recompensa final antes de completar la aventura.' : ''}</p><div class="cards">${artifactChoices.map((a, i) => `<button class="card" data-artifact="${i}"><em aria-hidden="true">${artifactIcon(a)}</em><b>${a.name}</b><small>${a.desc}</small></button>`).join('')}</div></div>`;
    overlay.querySelectorAll('[data-artifact]').forEach(b => b.onclick = () => {
        player.artifacts.push(artifactChoices[Number(b.dataset.artifact)].id); pendingArtifact = false;
        if (completedPhases === 3) { victory(); return; }
        state = 'playing'; overlay.classList.add('hidden'); ui.pause.textContent = 'Pausar'; canvas.focus(); updateHUD();
    });
}
function victory() {
    state = 'won'; mouse.down = false; keys.clear(); const reward = finishRun();
    reportScreen('won','Victoria','OPERACIÓN COMPLETADA',[
        ['Tiempo',reportTime()],['Bajas',kills],['Jefes',`${runStats.bosses} / 3`]
    ],`<div class="report-reward"><span>Créditos de enemigos <strong>KC ${runCoins}</strong></span><span>Recompensa final <strong>KC ${reward}</strong></span><span>Total <strong>KC ${runCoins+reward}</strong></span></div>`);
    reportButton('Jugar otra vez',start,true);reportButton('Volver al refugio',()=>showMenu('jugar'));
    overlay.querySelector('.panel').insertAdjacentHTML('beforeend',statisticsHTML());
}

showMenu('jugar'); requestAnimationFrame(frame);

window.addEventListener('pointerdown',event=>{const help=document.getElementById('how-to-play');if(help.open&&!help.contains(event.target))help.open=false;});
