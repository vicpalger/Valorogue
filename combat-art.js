'use strict';
// Siluetas originales: lienzos pequeños, cacheados y sin alterar los radios de colisión.
const combatArtCache=new Map();
function combatSprite(kind,phase=0){
 const key=kind+phase;if(combatArtCache.has(key))return combatArtCache.get(key);
 const boss=kind==='boss',size=boss?32:24,img=document.createElement('canvas');img.width=size;img.height=size;
 const g=img.getContext('2d');const ink='#08131d',steel='#526777',light='#b2c0c8',red='#ee626b',shade='#94384b';
 const box=(x,y,w,h,color)=>{g.fillStyle=ink;g.fillRect(x-1,y-1,w+2,h+2);g.fillStyle=color;g.fillRect(x,y,w,h);};
 const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
 if(!boss){
  box(6,18,5,4,steel);box(14,18,5,4,steel);
  if(kind==='shooter'){
   box(7,10,11,9,'#a08755');box(6,3,12,8,'#bfa36c');rect(8,6,9,3,ink);rect(9,7,3,1,'#ffd57d');
   box(3,12,5,5,steel);box(15,12,8,4,steel);rect(19,13,4,2,'#f1c76f');rect(9,12,5,1,light);rect(8,17,8,2,'#665b47');
  }else if(kind==='charger'){
   box(4,9,14,10,shade);box(9,3,11,8,red);rect(11,7,7,2,ink);rect(14,7,3,1,'#ffe4bf');
   box(3,4,4,7,'#b64a55');box(1,13,5,4,red);box(16,14,5,4,red);rect(5,10,4,2,'#ffb58d');rect(8,13,3,4,red);
   g.clearRect(13,19,6,4);box(15,19,7,3,steel);
  }else if(kind==='shield'){
   box(3,8,18,11,steel);box(7,2,10,7,'#8a9eaa');rect(9,5,6,2,ink);rect(10,5,4,1,red);
   box(4,10,16,10,'#5d849b');rect(6,11,12,2,'#b5d2dc');rect(10,13,4,6,'#263f50');rect(11,14,2,3,red);
  }else{
   box(2,8,6,12,'#4b816f');box(16,9,6,10,'#46665e');box(7,10,10,9,'#a3b9ad');
   box(7,2,10,8,'#698a7a');rect(8,3,8,2,'#c8e0d1');rect(9,6,6,2,ink);rect(9,7,2,1,red);
   rect(9,12,6,5,'#365b50');rect(11,12,2,5,'#b1e7c7');rect(9,14,6,1,'#b1e7c7');rect(3,10,3,7,'#a8d9b9');
  }
 }else if(phase===1){
  box(5,24,8,6,steel);box(19,24,8,6,steel);box(6,11,20,15,'#405765');
  box(2,9,7,14,'#728895');box(23,9,7,14,'#728895');rect(3,10,5,3,red);rect(24,10,5,3,red);
  box(9,3,14,10,'#91a1a9');rect(11,7,10,3,ink);rect(12,8,8,1,red);
  box(11,15,10,8,'#172a38');rect(14,16,4,5,red);rect(15,17,2,2,'#ffe9d6');rect(9,24,14,2,light);
 }else if(phase===2){
  box(5,25,8,5,steel);box(20,25,8,5,steel);box(5,12,21,14,'#81664f');
  box(9,4,13,10,'#a58a6d');rect(11,8,9,3,ink);rect(13,9,5,1,'#ffb16b');
  box(1,13,7,10,'#9d7057');box(24,7,5,20,steel);box(22,5,9,7,'#b38b68');rect(23,7,7,2,'#e6bc8b');
  rect(10,15,12,2,'#c8a480');rect(13,18,6,5,red);rect(15,18,2,5,'#ffe7cc');rect(7,21,4,3,'#4b4140');
 }else{
  // Núcleo flotante y cuatro aletas articuladas.
  box(2,5,5,9,steel);box(25,5,5,9,steel);box(2,21,5,7,steel);box(25,21,5,7,steel);
  box(6,8,20,16,'#534b68');box(9,4,14,24,'#786980');box(4,11,24,10,'#786980');
  box(9,9,14,14,'#1a2233');box(12,12,8,8,red);rect(14,14,4,4,'#fff0dc');
  rect(8,6,2,5,'#c5a9bb');rect(22,21,2,5,'#c5a9bb');rect(2,7,4,2,red);rect(26,7,4,2,red);
 }
 combatArtCache.set(key,img);return img;
}
function drawCombatActor(g,enemy,bob){
 if(!enemy.boss&&(!enemy.kind||enemy.kind==='grunt')){drawSprite(g,'enemy',enemy.x,enemy.y-bob,enemy.strong?3:2,enemy.slow>0?'#8bc6e8':enemy.color);return;}
 const sprite=combatSprite(enemy.boss?'boss':enemy.kind,enemy.phase),size=enemy.boss?60:enemy.kind==='shield'?34:26;
 g.save();g.imageSmoothingEnabled=false;
 if(enemy.stun>0||enemy.slow>0)g.filter='saturate(.6) brightness(1.2)';
 g.translate(Math.round(enemy.x),Math.round(enemy.y-bob));
 if(enemy.kind==='charger'&&Math.cos(enemy.face||0)<0)g.scale(-1,1);
 g.drawImage(sprite,-size/2,-size/2,size,size);g.restore();
}
function paintMapDetails(g,map,seed){
 const random=terrainRandom(seed^81293);g.save();
 // Pequeños motivos decorativos sobre el suelo; nunca crean colisiones.
 for(let i=0;i<24;i++){
  const x=Math.round((.04+random()*.92)*W/2)*2,y=Math.round((.08+random()*.84)*H/2)*2;
  if(terrainHit(x,y,22)||Math.hypot(x-W/2,y-H/2)<65)continue;
  g.globalAlpha=.28;
  if(map.id==='icebox'){
   g.fillStyle='#d3e2e7';g.fillRect(x,y,14,3);g.fillRect(x+3,y-3,7,3);g.fillStyle='#334f62';g.fillRect(x,y+4,16,2);
  }else if(map.id==='lotus'||map.id==='haven'){
   g.fillStyle='#6d9678';g.fillRect(x,y,3,12);g.fillRect(x-4,y+3,10,3);g.fillStyle='#b3b89c';g.fillRect(x+4,y+1,3,3);
  }else if(map.id==='bind'){
   g.fillStyle='#b69a70';g.fillRect(x,y,12,2);g.fillRect(x+5,y+3,10,2);g.fillStyle='#7e6850';g.fillRect(x-4,y+5,4,3);
  }else{
   g.fillStyle=map.accent;g.fillRect(x,y,8,2);g.fillRect(x+3,y-3,2,8);
  }
 }
 // Las tuberías y carteles se pintan dentro de la geometría ya sólida.
 for(const o of obstacles){
  if(o.type!=='building'&&o.type!=='container'&&o.type!=='ruin')continue;
  const x=Math.round(o.x+o.w*.12),y=Math.round(o.y+o.h*.2),w=Math.min(34,o.w*.55),h=Math.min(16,o.h*.4);
  if(o.w<42||o.h<30)continue;g.globalAlpha=.5;
  if(map.id==='bind'||map.id==='sunset'){
   g.fillStyle='#1c2b31';g.fillRect(x,y,w,h);g.fillStyle=map.id==='sunset'?'#bd837c':'#91a7a1';g.fillRect(x+3,y+3,w-6,2);g.fillRect(x+3,y+7,w*.4,2);
  }else if(map.id==='icebox'){
   g.fillStyle='#314956';g.fillRect(x,y,w,4);g.fillRect(x,y,4,h);g.fillStyle='#b5aa7a';g.fillRect(x+6,y+7,7,5);
  }else if(map.id==='lotus'||map.id==='haven'){
   g.fillStyle='#3e6855';g.fillRect(x,y,4,h);g.fillRect(x,y+3,w,3);g.fillRect(x+w-5,y+3,3,8);
  }else{
   g.fillStyle='#324750';g.fillRect(x,y,w,h);g.fillStyle='#788b8d';for(let j=3;j<w-3;j+=5)g.fillRect(x+j,y+3,2,h-6);
  }
 }
 g.restore();
}
