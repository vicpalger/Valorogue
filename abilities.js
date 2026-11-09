'use strict';
let skillEffects = [], soulOrbs = [], skillCooldown = 0, skillNotice = '', skillNoticeTime = 0;
function resetAbilities() {
    skillEffects = []; soulOrbs = []; skillCooldown = 0; skillNotice = ''; skillNoticeTime = 0;
    Object.assign(player, { skillScale: Math.pow(.95, progress.upgrades.ability || 0), healLeft: 0, healRate: 0, sprint: 0, sprintFactor: 1, stim: 0, shieldHits: 0, shieldTime: 0, heavyShots: 0, anchor: null, anchorTime: 0 });
}
function skillHint(text) { skillNotice = text; skillNoticeTime = 1.6; updateAbilityHUD(); }
function updateAbilityHUD() {
    if (!player) return;
    const hero = activeHero(), button = document.getElementById('ability');
    document.getElementById('ability-name').textContent = hero.skill;
    const recast = hero.id === 'waylay' && player.anchor;
    const soulMissing = hero.id === 'reyna' && !soulOrbs.some(s => distance(s, player) <= agentSoulRange());
    const activeStatus = player.heavyShots > 0 ? `${player.heavyShots} disparos potenciados` : player.shieldHits > 0 ? `Escudo · ${Math.ceil(player.shieldTime)} s` : '';
    const status = hero.id==='jett'&&hasAgentUpgrade(1)?`${player.eCharges} / 2 cargas${skillCooldown>0?' · '+Math.ceil(skillCooldown)+' s':''}`:skillNoticeTime > 0 ? skillNotice : activeStatus ? activeStatus : recast ? 'E · Volver a la marca' : skillCooldown > 0 ? `${Math.ceil(skillCooldown)} s` : soulMissing ? 'Necesita un alma' : 'LISTA · E';
    document.getElementById('ability-state').textContent = status;
    document.getElementById('ability-fill').style.width = `${recast ? 100 : (1 - Math.min(1, skillCooldown / (hero.cooldown * player.skillScale))) * 100}%`;
    button.classList.toggle('ready', !!recast || hero.id==='jett'&&hasAgentUpgrade(1)&&player.eCharges>0 || skillCooldown <= 0 && !soulMissing);
    button.setAttribute('aria-label', `${hero.skill}. ${status}`);
}
function skillPoint(range = 320) {
    const dx = mouse.x - player.x, dy = mouse.y - player.y, d = Math.hypot(dx, dy) || 1, m = Math.min(range, d);
    return { x: Math.max(18, Math.min(W - 18, player.x + dx / d * m)), y: Math.max(18, Math.min(H - 18, player.y + dy / d * m)) };
}
function addSkillEffect(type, x, y, options = {}) {
    if (skillEffects.length >= 64) return null;
    const effect = { type, x, y, age: 0, life: 1, r: 90, color: abilityPalette()[0], ...prepareAgentEffect(type,options), agentId: activeHero().id, visualLife: options.life || 1 }; effect.visualLife=effect.life; skillEffects.push(effect); return effect;
}
function damageEnemy(enemy,damage,source='ability',projectile){
    if(enemy.hp<=0||enemy.defeated)return;
    let amount=damage*(enemy.vulnerable>0?1.5:1);
    if(enemy.kind==='shield'&&source==='weapon'&&projectile){const incoming=Math.atan2(projectile.y-enemy.y,projectile.x-enemy.x);if(Math.cos(incoming-enemy.face)>.4)amount*=.4;}
    if(runStats)runStats.damage+=Math.min(enemy.hp,amount);
    enemy.hp-=amount;
    if(enemy.hp<=0)defeatEnemy(enemy,true,source,projectile);
}
function skillArea(x, y, r, apply) { for (const e of enemies) if (e.hp > 0 && distance(e, { x, y }) <= r + e.r) apply(e); }
function skillHeal(fraction, seconds) { player.healLeft = fraction * player.max; player.healRate = player.healLeft / seconds; }
function skillBurst(x, y, r, damage = 0, stun = 0, color, source='ability') {
    agentBurstStatuses(x,y,r);
    skillArea(x, y, r, e => { if (stun) e.stun = Math.max(e.stun || 0, stun); if (damage) damageEnemy(e, damage,source); });
    addSkillEffect('flash', x, y, { r, life: .4, color: color || abilityPalette()[0] }); burst(x, y, color || abilityPalette()[0], 12);
}
function safeTeleport(point) {
    const target = { ...point, r: player.r }; freeTerrainPosition(target);
    const from = { x: player.x, y: player.y }; player.x = target.x; player.y = target.y; flowClock = 0;
    addSkillEffect('flash', from.x, from.y, { r: 24, life: .4 }); addSkillEffect('flash', player.x, player.y, { r: 28, life: .4 }); player.inv = Math.max(player.inv, .65);
}
function activateBaseAbility() {
    if (state !== 'playing') return false;
    const hero = activeHero(), p = skillPoint();
    if (hero.id === 'waylay' && player.anchor) { safeTeleport(player.anchor); player.anchor = null; player.anchorTime = 0; updateAbilityHUD(); return true; }
    if (skillCooldown > 0) { skillHint(`Recargando · ${Math.ceil(skillCooldown)} s`); return false; }
    switch (hero.id) {
        case 'sage': if (player.hp >= player.max&&!canCastFullHeal(hero.id)) { skillHint('Vida completa'); return false; } skillHeal(.35, 3); addSkillEffect('aura', player.x, player.y, { r: 30, life: 3, follow: true }); break;
        case 'sova': { const a = aimAngle(); addSkillEffect('bolt', player.x, player.y, { vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, r: 80, life: 1.2, damage: 6 }); break; }
        case 'brimstone': addSkillEffect('fire', p.x, p.y, { r: 90, life: 5, dps: 3 }); break;
        case 'skye': addSkillEffect('beast', player.x, player.y, { r: 65, life: 4, speed: 270, damage: 5, stun: 2 }); break;
        case 'cypher': addSkillEffect('wire', p.x, p.y, { r: 75, life: 6 }); break;
        case 'harbor': {
            const angle = aimAngle(); for (const e of enemies) { const dx = e.x - player.x, dy = e.y - player.y, along = dx * Math.cos(angle) + dy * Math.sin(angle), side = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle)); if (e.hp > 0 && along >= 0 && along <= 300 && side < 90) { e.slow = 4; moveOnTerrain(e, Math.cos(angle) * 55, Math.sin(angle) * 55); } }
            addSkillEffect('beam', player.x, player.y, { angle, length: 300, width: 100, life: .7 }); break;
        }
        case 'jett': {
            let dx = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')), dy = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
            if (!dx && !dy) { dx = Math.cos(aimAngle()); dy = Math.sin(aimAngle()); } const d = Math.hypot(dx, dy) || 1;
            addSkillEffect('beam', player.x, player.y, { angle: Math.atan2(dy, dx), length: 170, width: 16, life: .3 }); moveOnTerrain(player, dx / d * 170, dy / d * 170); player.x = Math.max(15, Math.min(W - 15, player.x)); player.y = Math.max(15, Math.min(H - 15, player.y)); player.inv = Math.max(player.inv, .3); break;
        }
        case 'breach': {
            const angle = aimAngle(); for (const e of enemies) { const dx = e.x - player.x, dy = e.y - player.y, along = dx * Math.cos(angle) + dy * Math.sin(angle), side = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle)); if (e.hp > 0 && along >= 0 && along <= 360 && side < 42 + e.r) { e.stun = 3; damageEnemy(e, 3); } }
            addSkillEffect('beam', player.x, player.y, { angle, length: 360, width: 84, life: .6 }); break;
        }
        case 'killjoy': { const q = { x: player.x + Math.cos(aimAngle()) * 36, y: player.y + Math.sin(aimAngle()) * 36, r: 12 }; freeTerrainPosition(q); addSkillEffect('turret', q.x, q.y, { r: 300, life: 9, tick: 0 }); break; }
        case 'raze': addSkillEffect('grenade', p.x, p.y, { r: 95, life: .65, damage: 8, clusters: true }); break;
        case 'neon': player.sprint = 5; player.sprintFactor = 1.8; addSkillEffect('electric', player.x, player.y, { r: 48, life: 5, follow: true }); break;
        case 'deadlock': addSkillEffect('sensor', p.x, p.y, { r: 105, life: 8 }); break;
        case 'phoenix': addSkillEffect('grenade', p.x, p.y, { r: 130, life: .35, damage: 0, stun: 3 }); break;
        case 'viper': addSkillEffect('poison', p.x, p.y, { r: 105, life: 6, dps: 2 }); break;
        case 'fade': skillArea(p.x, p.y, 100, e => { e.root = 3; e.vulnerable = 6; }); addSkillEffect('tether', p.x, p.y, { r: 100, life: 3 }); break;
        case 'gekko': addSkillEffect('wingman', player.x, player.y, { r: 75, life: 4, speed: 230, damage: 3, stun: 3 }); break;
        case 'kayo': skillArea(player.x, player.y, 180, e => { e.suppressed = 5; e.stun = 1; }); addSkillEffect('flash', player.x, player.y, { r: 180, life: .6 }); break;
        case 'chamber': player.heavyShots = 6; addSkillEffect('aura', player.x, player.y, { r: 28, life: 1, follow: true }); break;
        case 'omen': safeTeleport(skillPoint(260)); break;
        case 'astra': addSkillEffect('gravity', p.x, p.y, { r: 145, life: 4 }); break;
        case 'yoru': addSkillEffect('clone', player.x, player.y, { r: 120, life: 6, angle: aimAngle() }); break;
        case 'clove': skillArea(p.x, p.y, 120, e => { if (!e.decayDebt) { e.decayDebt = e.hp * .5; e.hp -= e.decayDebt; } e.decayTime = 5; }); player.sprint = 4; player.sprintFactor = 1.2; addSkillEffect('flash', p.x, p.y, { r: 120, life: .6 }); break;
        case 'vyse': addSkillEffect('grenade', p.x, p.y, { r: 140, life: .8, damage: 0, stun: 3.5 }); break;
        case 'tejo': addSkillEffect('grenade', Math.max(18, p.x - 35), p.y, { r: 75, life: .6, damage: 6 }); addSkillEffect('grenade', Math.min(W - 18, p.x + 40), p.y, { r: 75, life: 1.2, damage: 6 }); break;
        case 'reyna': {
            if (player.hp >= player.max&&!canCastFullHeal(hero.id)) { skillHint('Vida completa'); return false; }
            const soul = soulOrbs.filter(s => distance(s, player) <= agentSoulRange()).sort((a, b) => distance(a, player) - distance(b, player))[0];
            if (!soul) { skillHint('Necesitas un alma cercana'); return false; } soulOrbs.splice(soulOrbs.indexOf(soul), 1); skillHeal(.3, 2); addSkillEffect('aura', player.x, player.y, { r: 32, life: 2, follow: true }); break;
        }
        case 'iso': player.shieldHits = 1; player.shieldTime = 10; addSkillEffect('flash', player.x, player.y, { r: 32, life: .5 }); break;
        case 'waylay': player.anchor = { x: player.x, y: player.y }; player.anchorTime = 4; player.sprint = 4; player.sprintFactor = 1.5; break;
        case 'veto': addSkillEffect('hold', p.x, p.y, { r: 110, life: 7, triggered: false }); break;
        case 'miks': addSkillEffect('sound', player.x, player.y, { r: 125, life: 4, tick: 0 }); break;
        case 'hush': addSkillEffect('telekinesis', p.x, p.y, { r: 145, life: 2.8 }); break;
        default: return false;
    }
    skillCooldown = hero.cooldown * player.skillScale; skillHint(hero.skill); updateHUD(); return true;
}
function updateAgentTimers(dt) {
    skillCooldown = Math.max(0, skillCooldown - dt); skillNoticeTime = Math.max(0, skillNoticeTime - dt);
    player.sprint = Math.max(0, player.sprint - dt); player.stim = Math.max(0, player.stim - dt);
    player.shieldTime = Math.max(0, player.shieldTime - dt); if (!player.shieldTime) player.shieldHits = 0;
    if (player.anchor) { player.anchorTime -= dt; if (player.anchorTime <= 0) player.anchor = null; }
    if (player.healLeft > 0) { const amount = Math.min(player.healLeft, player.healRate * dt); player.hp = Math.min(player.max, player.hp + amount); player.healLeft -= amount; }
    for (const soul of soulOrbs) soul.life -= dt; soulOrbs = soulOrbs.filter(s => s.life > 0);
    for (const e of enemies) {
        for (const status of ['stun', 'root', 'vulnerable', 'suppressed']) e[status] = Math.max(0, (e[status] || 0) - dt);
        if (e.decayTime > 0) { e.decayTime -= dt; if (e.decayTime <= 0) { e.hp += e.decayDebt || 0; e.decayDebt = 0; } }
    }
}
function companionWaypoint(fx, target, dt) {
    if (clearTerrainLine(fx.x, fx.y, target.x, target.y, 9)) return target;
    fx.navClock = (fx.navClock || 0) - dt;
    const { size, cols, rows, blocked } = navigationGrid;
    const cell = (x, y) => Math.max(0, Math.min(rows - 1, Math.floor(y / size))) * cols + Math.max(0, Math.min(cols - 1, Math.floor(x / size)));
    const targetCell = cell(target.x, target.y);
    if (!fx.navDist || fx.navClock <= 0 || fx.targetCell !== targetCell || fx.navCols !== cols || fx.navRows !== rows) {
        fx.navCols = cols; fx.navRows = rows;
        fx.navClock = .35; fx.targetCell = targetCell;
        let start = targetCell; if (blocked[start]) { let best = Infinity; for (let i = 0; i < blocked.length; i++)if (!blocked[i]) { const d = Math.hypot((i % cols) * size + size / 2 - target.x, Math.floor(i / cols) * size + size / 2 - target.y); if (d < best) { best = d; start = i; } } }
        const dist = new Int32Array(blocked.length); dist.fill(-1); dist[start] = 0; const queue = [start];
        for (let head = 0; head < queue.length; head++) { const i = queue[head], x = i % cols, y = Math.floor(i / cols); for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) { const n = ny * cols + nx; if (!blocked[n] && dist[n] < 0) { dist[n] = dist[i] + 1; queue.push(n); } } } fx.navDist = dist;
    }
    const current = cell(fx.x, fx.y), cx = current % cols, cy = Math.floor(current / cols); let best = Infinity, waypoint = fx;
    for (let dy = -1; dy <= 1; dy++)for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= cols || y >= rows) continue; const i = y * cols + x, p = { x: x * size + size / 2, y: y * size + size / 2 }; if (fx.navDist[i] >= 0 && fx.navDist[i] < best && clearTerrainLine(fx.x, fx.y, p.x, p.y, 9)) { best = fx.navDist[i]; waypoint = p; } }
    return waypoint;
}
function updateSkillEffects(dt) {
    for (const fx of [...skillEffects]) {
        const previousSlot=agentCastSlot;agentCastSlot=fx.slot;
        fx.age += dt; fx.life -= dt; if (fx.follow) { fx.x = player.x; fx.y = player.y; }
        updateAgentEffect(fx,dt);
        if(fx.vulnerability&&['grenade','bolt','beast','wingman'].includes(fx.type)&&fx.life<=0)skillArea(fx.x,fx.y,fx.r,e=>e.vulnerable=fx.vulnerability);
        if (fx.type === 'ultimate-lock' && fx.life <= 0) { skillArea(fx.x, fx.y, fx.r, e => { e.root = 7; }); skillBurst(fx.x, fx.y, fx.r, 0); }
        if (fx.type === 'ultimate-line' && fx.life <= 0) { for (const e of enemies) { const dx = e.x - fx.x, dy = e.y - fx.y; if (e.hp > 0 && dx * Math.cos(fx.angle) + dy * Math.sin(fx.angle) >= 0 && Math.abs(-dx * Math.sin(fx.angle) + dy * Math.cos(fx.angle)) < 55 + e.r) damageEnemy(e, fx.damage); } addSkillEffect('beam', fx.x, fx.y, { angle: fx.angle, length: Math.max(W, H), width: 110, life: .3 }); }
        if (fx.type === 'bolt') {
            const nx = fx.x + fx.vx * dt, ny = fx.y + fx.vy * dt;
            if (!clearTerrainLine(fx.x, fx.y, nx, ny, 3) || enemies.some(e => e.hp > 0 && distance(e, fx) < e.r + 10) || nx < 0 || nx > W || ny < 0 || ny > H) fx.life = 0;
            else { fx.x = nx; fx.y = ny; }
            if (fx.life <= 0){if(fx.vulnerability)skillArea(fx.x,fx.y,fx.r,e=>e.vulnerable=fx.vulnerability);skillBurst(fx.x, fx.y, fx.r, fx.damage, 0, fx.color);}
        }
        if (fx.type === 'grenade' && fx.life <= 0) {
            skillBurst(fx.x, fx.y, fx.r, fx.damage, fx.stun, fx.color);
            if (fx.clusters) for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; addSkillEffect('grenade', Math.max(18, Math.min(W - 18, fx.x + Math.cos(a) * 75)), Math.max(18, Math.min(H - 18, fx.y + Math.sin(a) * 75)), { r: 45, life: .45, damage: 2 }); }
        }
        if (['fire', 'poison', 'electric'].includes(fx.type)) skillArea(fx.x, fx.y, fx.r, e => { if (fx.type !== 'fire') e.slow = Math.max(e.slow || 0, 1.2); damageEnemy(e, (fx.dps || 1) * dt); });
        if (fx.type === 'wire') skillArea(fx.x, fx.y, fx.r, e => { e.root = Math.max(e.root || 0, .25); e.revealed = .3; });
        if (fx.type === 'sensor' && enemies.some(e => e.hp > 0 && distance(e, fx) < fx.r)) { skillBurst(fx.x, fx.y, fx.r, 0, 4, fx.color); fx.life = 0; }
        if (fx.type === 'hold') {
            if (!fx.triggered && enemies.some(e => e.hp > 0 && distance(e, fx) < fx.r)) { fx.triggered = true; fx.life = 4; }
            if (fx.triggered) skillArea(fx.x, fx.y, fx.r, e => { e.root = Math.max(e.root || 0, .3); e.vulnerable = Math.max(e.vulnerable || 0, .5); });
        }
        if (['gravity', 'telekinesis'].includes(fx.type)) skillArea(fx.x, fx.y, fx.r, e => {
            const d = distance(e, fx) || 1, step = Math.min(d, (fx.pullSpeed||100) * dt); moveOnTerrain(e, (fx.x - e.x) / d * step, (fx.y - e.y) / d * step);
            if (fx.type === 'gravity') e.vulnerable = Math.max(e.vulnerable || 0, 1);
            else if (d < 28) e.stun = Math.max(e.stun || 0, 1.5);
        });
        if (fx.type === 'sound') {
            fx.tick -= dt; if (fx.tick <= 0) { fx.tick = fx.interval||1; skillBurst(fx.x, fx.y, fx.r, 0, .6, fx.color); if (distance(player, fx) < fx.r) { player.hp = Math.min(player.max, player.hp + player.max * .04); player.stim = 1.1; } }
        }
        if (fx.type === 'turret') {
            fx.tick -= dt; if (fx.tick <= 0) {
                const targets=enemies.filter(e=>e.hp>0&&distance(e,fx)<=fx.r&&clearTerrainLine(fx.x,fx.y,e.x,e.y,3)).sort((a,b)=>distance(a,fx)-distance(b,fx)).slice(0,fx.slot==='e'&&activeHero().id==='killjoy'&&hasAgentUpgrade(0)?2:1);
                for(const target of targets)if(bullets.length<220){const a=Math.atan2(target.y-fx.y,target.x-fx.x);bullets.push({source:'ability',x:fx.x,y:fx.y,vx:Math.cos(a)*530,vy:Math.sin(a)*530,life:1,damage:Math.max(1,player.damage*.7),hit:new Set(),bounces:0});}
                if(targets.length)fx.tick=.55;
            }
        }
        if (fx.type === 'beast' || fx.type === 'wingman') {
            const target = enemies.filter(e => e.hp > 0).sort((a, b) => distance(a, fx) - distance(b, fx))[0];
            if (target) { const actor = { x: fx.x, y: fx.y, r: 9 }, t = companionWaypoint(fx, target, dt), d = distance(actor, t) || 1; moveOnTerrain(actor, (t.x - actor.x) / d * fx.speed * dt, (t.y - actor.y) / d * fx.speed * dt); fx.x = actor.x; fx.y = actor.y; if (distance(fx, target) < target.r + 15) {if(fx.vulnerability)skillArea(fx.x,fx.y,fx.r,e=>e.vulnerable=fx.vulnerability); skillBurst(fx.x, fx.y, fx.r, fx.damage, fx.stun, fx.color); fx.life = 0; } }
        }
        if (fx.type === 'clone') {
            const actor = { x: fx.x, y: fx.y, r: 12 }; moveOnTerrain(actor, Math.cos(fx.angle) * 85 * dt, Math.sin(fx.angle) * 85 * dt); fx.x = Math.max(15, Math.min(W - 15, actor.x)); fx.y = Math.max(15, Math.min(H - 15, actor.y));
            if (fx.life <= 0) skillBurst(fx.x, fx.y, fx.r, 0, 2, fx.color);
        }
        if(fx.life<=0)agentEffectEnded(fx);
        agentCastSlot=previousSlot;
    }
    skillEffects = skillEffects.filter(fx => fx.life > 0); enemies = enemies.filter(e => e.hp > 0);
}
function drawAbilityEffects(front = false) {
    ctx.save();
    for (const fx of skillEffects) {
        if ((['turret', 'beast', 'wingman', 'clone', 'bolt'].includes(fx.type)) !== front) continue;
        const x = Math.round(fx.x), y = Math.round(fx.y);
        if (fx.type === 'clone') { ctx.globalAlpha = .55; drawSprite(ctx, `agent:${activeHero().id}`, x, y, 2); ctx.globalAlpha = 1; continue; }
        if (fx.type === 'turret') { ctx.fillStyle = '#07121d'; ctx.fillRect(x - 12, y - 10, 24, 20); ctx.fillStyle = fx.color; ctx.fillRect(x - 8, y - 8, 16, 14); ctx.fillStyle = '#f2eee5'; ctx.fillRect(x - 4, y - 5, 8, 4); continue; }
        if (fx.type === 'beast' || fx.type === 'wingman') { const [body,eye]=abilityPalette(fx.agentId);ctx.fillStyle='#09131e';ctx.fillRect(x-12,y-9,24,19);ctx.fillStyle=body;ctx.fillRect(x-9,y-7,18,13);ctx.fillRect(x-10,y+7,5,4);ctx.fillRect(x+5,y+7,5,4);ctx.fillStyle=eye;ctx.fillRect(x-6,y-4,4,4);ctx.fillRect(x+3,y-4,4,4);ctx.strokeStyle=body;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-8,y-7);ctx.lineTo(x-10,y-13);ctx.moveTo(x+8,y-7);ctx.lineTo(x+10,y-13);ctx.stroke(); continue; }
        if (fx.type === 'bolt') { ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(fx.vy||0,fx.vx||1));ctx.fillStyle=abilityPalette(fx.agentId)[0];ctx.fillRect(-13,-2,21,4);ctx.fillStyle=abilityPalette(fx.agentId)[1];ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(3,-5);ctx.lineTo(3,5);ctx.fill();ctx.restore(); continue; }
        drawAbilityField(fx);
    }
    if (front) {
        for (const soul of soulOrbs) { ctx.globalAlpha = Math.min(1, soul.life); drawSprite(ctx, 'gem', soul.x, soul.y, 2); ctx.fillStyle = '#df8cff'; ctx.fillRect(soul.x - 3, soul.y - 3, 6, 6); }
        ctx.globalAlpha = 1;
        if(player.healLeft>0){ctx.strokeStyle=abilityPalette()[1];ctx.lineWidth=2;ctx.globalAlpha=.8;abilityGlyph('heal',player.x-25,player.y-14,5);}
        if (player.shieldHits > 0) { ctx.strokeStyle = abilityPalette()[0]; ctx.lineWidth = 3; ctx.strokeRect(Math.round(player.x - 20), Math.round(player.y - 20), 40, 40); }
        if(player.qAnchor){ctx.strokeStyle=abilityPalette()[0];ctx.lineWidth=2;ctx.strokeRect(Math.round(player.qAnchor.x-12),Math.round(player.qAnchor.y-12),24,24);}
        if (player.anchor) { ctx.strokeStyle = abilityPalette()[1]; ctx.lineWidth = 2; ctx.strokeRect(Math.round(player.anchor.x - 14), Math.round(player.anchor.y - 14), 28, 28); }
        for (const e of enemies) if (e.stun > 0 || e.root > 0 || e.vulnerable > 0) { ctx.fillStyle = e.vulnerable > 0 ? '#f0b8ff' : '#8ce0df'; ctx.fillRect(e.x - 5, e.y - e.r - 8, 10, 3); }
    }
    ctx.restore();
}
