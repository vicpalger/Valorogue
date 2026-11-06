'use strict';
// Static scenery is painted once per arena size; navigation is shared by all enemies.
let terrainReady = false, obstacles = [], groundLayer, navigationGrid, flowClock = 0;
let terrainSeed=7241, terrainRound=0, terrainPlan=[], terrainStyle;
function terrainRandom(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function newTerrainPlan(){
    terrainSeed=((Math.random()*4294967296)>>>0)^(++terrainRound*2654435761);
    const random=terrainRandom(terrainSeed);
    const pool=ARENA_MAPS.filter(map=>!terrainStyle||map.id!==terrainStyle.id);
    terrainStyle=pool[Math.floor(random()*pool.length)];
    terrainPlan=terrainStyle.blocks.map(block=>block.slice());
    // Solo varían coberturas pequeñas; edificios y rutas definen cada mapa.
    for(let i=0;i<4;i++){
        const nx=.1+random()*.8,ny=.14+random()*.72;
        if(Math.hypot((nx-.5)*W,(ny-.5)*H)<130)continue;
        if(terrainStyle.lanes.some(([x,y,w,h])=>nx>x-.05&&nx<x+w+.05&&ny>y-.06&&ny<y+h+.06))continue;
        if(terrainPlan.some(([x,y,,w,h])=>Math.abs(nx-x)<w/2+.07&&Math.abs(ny-y)<h/2+.08))continue;
        terrainPlan.push([nx,ny,random()<.5?'crate':'planter',.045,.055]);
    }
}
function terrainFloorAt(nx,ny){return [...terrainStyle.lanes,...terrainStyle.courts].some(([x,y,w,h])=>nx>=x&&nx<=x+w&&ny>=y&&ny<=y+h);}
function connectTerrain(){
    // Reject layouts that isolate any walkable navigation cell.
    while(obstacles.length){
        buildNavigation();const {cols,rows,blocked}=navigationGrid;
        const start=blocked.findIndex(v=>!v);if(start<0){obstacles.pop();continue;}
        const visited=new Uint8Array(blocked.length),queue=[start];visited[start]=1;
        for(let head=0;head<queue.length;head++){
            const i=queue[head],x=i%cols,y=Math.floor(i/cols);
            for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=0&&ny>=0&&nx<cols&&ny<rows){const n=ny*cols+nx;if(!blocked[n]&&!visited[n]){visited[n]=1;queue.push(n);}}
        }
        if(blocked.every((v,i)=>v||visited[i]))break;
        obstacles.pop();
    }
}
function terrainHit(x, y, r = 0) {
    return obstacles.some(o => x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h);
}
function moveOnTerrain(actor, dx, dy) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
    for (let i = 0; i < steps; i++) {
        if (!terrainHit(actor.x + dx / steps, actor.y, actor.r)) actor.x += dx / steps;
        if (!terrainHit(actor.x, actor.y + dy / steps, actor.r)) actor.y += dy / steps;
    }
}
function freeTerrainPosition(actor) {
    actor.x = Math.max(actor.r + 2, Math.min(W - actor.r - 2, actor.x));
    actor.y = Math.max(actor.r + 2, Math.min(H - actor.r - 2, actor.y));
    if (!terrainHit(actor.x, actor.y, actor.r)) return;
    const x = actor.x, y = actor.y;
    for (let radius = 12; radius < Math.max(W, H); radius += 12)for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const nx = x + Math.cos(a) * radius, ny = y + Math.sin(a) * radius;
        if (nx > actor.r && nx < W - actor.r && ny > actor.r && ny < H - actor.r && !terrainHit(nx, ny, actor.r)) { actor.x = nx; actor.y = ny; return; }
    }
    actor.x = W / 2; actor.y = H / 2;
}
function clearTerrainLine(x, y, tx, ty, r = 0) {
    const n = Math.max(1, Math.ceil(Math.hypot(tx - x, ty - y) / 6));
    for (let i = 0; i <= n; i++)if (terrainHit(x + (tx - x) * i / n, y + (ty - y) * i / n, r)) return false;
    return true;
}
function buildTerrain(newRound=false) {
    if(newRound||!terrainStyle)newTerrainPlan();
    terrainReady = true;
    const scale = Math.min(1, Math.max(.55, Math.min(W / 1000, H / 650)));
    obstacles = terrainPlan.map(([nx, ny, type, nw, nh]) => {
        const w=Math.max(18,nw*W),h=Math.max(18,nh*H);
        return {x:nx*W-w/2,y:ny*H-h/2,w,h,type};
    }).filter(o=>! (o.x< W/2+38&&o.x+o.w>W/2-38&&o.y<H/2+38&&o.y+o.h>H/2-38));
    connectTerrain();
    groundLayer = document.createElement('canvas'); groundLayer.width = Math.ceil(W / 2); groundLayer.height = Math.ceil(H / 2);
    const g = groundLayer.getContext('2d'); g.scale(.5, .5); g.imageSmoothingEnabled = false;
    const noise=terrainRandom(terrainSeed);
    const tile = 16;
    for (let y = 0; y < H; y += tile)for (let x = 0; x < W; x += tile) {
        const path=terrainFloorAt(x/W,y/H),colors=path?terrainStyle.path:terrainStyle.ground;
        g.fillStyle=colors[Math.floor(noise()*colors.length)];g.fillRect(x,y,tile,tile);
        g.fillStyle=path?'#ffffff0b':'#00000010';g.fillRect(x+Math.floor(noise()*6)*2,y+Math.floor(noise()*6)*2,4,2);
        if(path){g.fillStyle='#101c2222';g.fillRect(x,y,1,tile);g.fillRect(x,y,tile,1);}
        if(terrainStyle.id==='icebox'&&!path&&noise()<.16){g.fillStyle='#c4d8df55';g.fillRect(x+2,y+4,10,4);}
        if(['haven','lotus'].includes(terrainStyle.id)&&!path&&noise()<.08){g.fillStyle='#72886555';g.fillRect(x+2,y+4,4,6);}
    }
    // Plazas y zonas de combate: marcas decorativas, sin colisión.
    terrainStyle.courts.forEach(([x,y,w,h],i)=>{
        const px=Math.round(x*W),py=Math.round(y*H),pw=Math.round(w*W),ph=Math.round(h*H);
        g.strokeStyle=terrainStyle.accent+'55';g.lineWidth=2;g.strokeRect(px+8,py+8,pw-16,ph-16);
        g.fillStyle=terrainStyle.accent+'99';g.font=`bold ${Math.max(14,Math.round(24*scale))}px monospace`;g.fillText(terrainStyle.id==='ascent'?['A','B','MID'][i]:terrainStyle.courts.length===3?['A','B','C'][i]:['A','B'][i],px+16,py+30);
    });
    g.strokeStyle=terrainStyle.accent;g.lineWidth=2;g.strokeRect(W/2-24,H/2-24,48,48);
    g.fillStyle=terrainStyle.accent+'55';g.fillRect(W/2-12,H/2-2,24,4);g.fillRect(W/2-2,H/2-12,4,24);
    for (const o of obstacles) paintObstacle(g, o);
    paintMapDetails(g,terrainStyle,terrainSeed);
    buildNavigation(); flowClock = 0;
}
function paintObstacle(g,o){
    const x=Math.round(o.x),y=Math.round(o.y),w=Math.round(o.w),h=Math.round(o.h),type=o.type;
    const [light,dark]=terrainStyle.wall;
    g.fillStyle='#09131c88';g.fillRect(x+6,y+8,w,h);
    g.fillStyle='#121e28';g.fillRect(x-2,y-2,w+4,h+4);
    if(type==='pond'){
        g.fillStyle=dark;g.fillRect(x,y,w,h);g.fillStyle='#356b70';g.fillRect(x+6,y+6,w-12,h-12);
        g.fillStyle='#82aba3';for(let i=0;i<3;i++)g.fillRect(x+10+i*8,y+10+i*10,Math.max(4,w/3),2);
        return;
    }
    g.fillStyle=dark;g.fillRect(x,y,w,h);g.fillStyle=light;g.fillRect(x+3,y+3,w-6,Math.max(3,h-10));
    g.fillStyle='#ffffff30';g.fillRect(x+3,y+3,w-6,3);g.fillStyle='#00000035';g.fillRect(x,y+h-7,w,7);
    if(type==='building'){
        g.fillStyle=terrainStyle.id==='haven'?'#533f3c':terrainStyle.id==='sunset'?'#82616a':'#6d7379';g.fillRect(x+8,y+8,w-16,h-22);
        g.strokeStyle='#17273566';g.lineWidth=2;for(let ry=y+14;ry<y+h-18;ry+=10){g.beginPath();g.moveTo(x+8,ry);g.lineTo(x+w-8,ry);g.stroke();}
        g.fillStyle=terrainStyle.accent;for(let wx=x+12;wx<x+w-8;wx+=22)g.fillRect(wx,y+h-9,8,3);
    }else if(type==='container'){
        g.fillStyle='#18384988';for(let bx=8;bx<w-4;bx+=12)g.fillRect(x+bx,y+5,3,h-14);
        g.fillStyle=terrainStyle.accent;g.fillRect(x+5,y+7,Math.min(18,w-10),4);
    }else if(type==='planter'){
        g.fillStyle=terrainStyle.id==='bind'?'#657f6b':'#416c5d';g.fillRect(x+5,y+5,w-10,h-14);
        g.fillStyle='#8fa67c';for(let i=0;i<4;i++)g.fillRect(x+6+(i%2)*Math.max(3,(w-15)/2),y+6+Math.floor(i/2)*Math.max(3,(h-18)/2),5,5);
    }else if(type==='ruin'){
        g.strokeStyle='#374d4688';g.lineWidth=3;g.strokeRect(x+7,y+7,w-14,h-20);g.fillStyle='#597e6266';g.fillRect(x+4,y+h-16,w*.5,7);
    }else{
        g.strokeStyle='#15273188';g.lineWidth=3;g.beginPath();g.moveTo(x+5,y+5);g.lineTo(x+w-5,y+h-10);g.moveTo(x+w-5,y+5);g.lineTo(x+5,y+h-10);g.stroke();
    }
}
function buildNavigation() {
    const size = 24, cols = Math.ceil(W / size), rows = Math.ceil(H / size), blocked = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++)for (let x = 0; x < cols; x++)blocked[y * cols + x] = terrainHit(Math.min(W - 1, x * size + size / 2), Math.min(H - 1, y * size + size / 2), 19) ? 1 : 0;
    navigationGrid = { size, cols, rows, blocked, dist: new Int32Array(cols * rows) };
}
function refreshFlow(dt) {
    flowClock -= dt; if (flowClock > 0) return; flowClock = .35;
    const { size, cols, rows, blocked, dist } = navigationGrid; dist.fill(-1);
    let target = Math.min(rows - 1, Math.floor(player.y / size)) * cols + Math.min(cols - 1, Math.floor(player.x / size));
    if (blocked[target]) { let best = Infinity; for (let i = 0; i < blocked.length; i++)if (!blocked[i]) { const d = Math.hypot((i % cols) * size + size / 2 - player.x, Math.floor(i / cols) * size + size / 2 - player.y); if (d < best) { best = d; target = i; } } }
    const queue = [target]; dist[target] = 0;
    for (let head = 0; head < queue.length; head++) {
        const i = queue[head], x = i % cols, y = Math.floor(i / cols);
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) { const n = ny * cols + nx; if (!blocked[n] && dist[n] < 0) { dist[n] = dist[i] + 1; queue.push(n); } }
    }
}
function terrainEnemyTarget(e) {
    if (clearTerrainLine(e.x, e.y, player.x, player.y, e.r + 1)) return player;
    const { size, cols, rows, dist, blocked } = navigationGrid, x = Math.max(0, Math.min(cols - 1, Math.floor(e.x / size))), y = Math.max(0, Math.min(rows - 1, Math.floor(e.y / size)));
    let best = Infinity, target = e;
    for (let dy = -1; dy <= 1; dy++)for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const i = ny * cols + nx, tx = nx * size + size / 2, ty = ny * size + size / 2;
        if (!blocked[i] && dist[i] >= 0 && dist[i] < best && clearTerrainLine(e.x, e.y, tx, ty, e.r + 1)) { best = dist[i]; target = { x: tx, y: ty }; }
    }
    return target;
}
