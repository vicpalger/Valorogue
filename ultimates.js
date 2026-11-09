'use strict';
// Adaptaciones para esta arena; no sustituyen las habilidades de E.
const ultimateDefinitions=[
 ['sage','Resurrección',50,'Durante 15 s, evita una muerte y vuelve con toda la vida.'],
 ['sova','Furia del cazador',45,'Tres descargas hacia el cursor atraviesan el terreno: 18 de daño cada una.'],
 ['brimstone','Ataque orbital',50,'Un campo orbital al cursor causa 15 de daño por segundo durante 4 s.'],
 ['skye','Buscadores',40,'Tres buscadores persiguen enemigos, causan 12 de daño y aturden 4 s.'],
 ['cypher','Hurto neuronal',35,'Revela a todos los enemigos y los vuelve vulnerables durante 10 s.'],
 ['harbor','Ajuste de cuentas',45,'Un campo de 230 px al cursor causa 5 de daño por segundo durante 6 s y ralentiza.'],
 ['jett','Tormenta de cuchillas',40,'Lanza cinco cuchillas hacia el cursor: 12 de daño cada una.'],
 ['breach','Fragor imparable',45,'Una onda frontal de 600 px causa 15 de daño y aturde 6 s.'],
 ['killjoy','Bloqueo',50,'Tras 2 s, inmoviliza 7 s a los enemigos en un radio de 320 px.'],
 ['raze','Cierratelones',50,'Un cohete hacia el cursor explota: 45 de daño en 180 px.'],
 ['neon','Sobrecarga',45,'Durante 10 s, +80 % de velocidad y un aura eléctrica de 12 de daño por segundo.'],
 ['deadlock','Aniquilación',45,'Atrapa al enemigo más cercano al cursor: 60 de daño y 6 s inmovilizado si sobrevive.'],
 ['phoenix','Cenizas',40,'Marca tu posición durante 12 s: al morir o terminar, regresas con toda la vida.'],
 ['viper','Pozo de la víbora',50,'Una nube de 220 px te sigue durante 12 s: 6 de daño por segundo y ralentización.'],
 ['fade','Anochecer',45,'Todos los enemigos quedan vulnerables y debilitados durante 10 s.'],
 ['gekko','Thrash',40,'Un compañero persigue enemigos y estalla: 18 de daño y 6 s de aturdimiento en 160 px.'],
 ['kayo','NULL/CMD',45,'Durante 10 s, pulsos cercanos causan 4 de daño por segundo y ralentizan; +20 % de cadencia.'],
 ['chamber','Tour de force',45,'Tus siguientes cinco disparos de arma infligen cinco veces el daño.'],
 ['omen','Desde las sombras',40,'Teletransporte de largo alcance al cursor y aturdimiento de 4 s al llegar.'],
 ['astra','División cósmica',45,'Una franja frontal inmoviliza a los enemigos y reduce su daño durante 8 s.'],
 ['yoru','Deriva dimensional',40,'Invulnerabilidad y +60 % de velocidad durante 8 s.'],
 ['clove','Todavía no',45,'Durante 15 s, evita una muerte, recupera un 70 % de vida y gana 3 s de invulnerabilidad.'],
 ['vyse','Jardín de acero',45,'Inmoviliza y vuelve vulnerables 8 s a los enemigos en 280 px.'],
 ['tejo','Armagedón',50,'Cinco explosiones avanzan hacia el cursor: 20 de daño por impacto en 110 px.'],
 ['reyna','Emperatriz',45,'Durante 12 s, daño doble, mayor cadencia y cada baja cura un 8 % de vida.'],
 ['iso','Contrato de asesinato',45,'El enemigo más cercano al cursor recibe 80 de daño; obtienes un escudo de un golpe.'],
 ['waylay','Convergencia',45,'Una onda frontal causa 12 de daño y ralentiza 10 s; +80 % de velocidad durante 8 s.'],
 ['veto','Mutación',45,'Durante 12 s, daño doble, +30 % de velocidad y curación de un 40 % de vida.'],
 ['miks','Epicentro',45,'Durante 8 s, pulsos cercanos curan un 4 % por segundo y aturden; explosión inicial de 15 de daño.'],
 ['hush','Singularidad',50,'Un campo al cursor atrae enemigos durante 8 s y causa 8 de daño por segundo.']
];
const ULTIMATES=Object.fromEntries(ultimateDefinitions.map(([id,name,cost,description])=>[id,{name,cost,description}]));
function resetUltimate(){Object.assign(player,{ultCharge:0,ultTime:0,ultPower:1,ultShots:0,ultRegen:false,ultRevive:null});}
function ultimateKill(){
 const u=ULTIMATES[activeHero().id];player.ultCharge=Math.min(u.cost,player.ultCharge+agentUltimateGain());
 if(player.ultRegen&&player.ultTime>0)player.hp=Math.min(player.max,player.hp+player.max*.08);
 updateUltimateHUD();
}
function updateUltimateHUD(){
 if(!player)return;const u=ULTIMATES[activeHero().id],ready=player.ultCharge>=u.cost;
 document.getElementById('ultimate-name').textContent=u.name;
 const active=player.ultRevive?`${Math.ceil(player.ultRevive.time)} s · protección`:player.ultTime>0?`${Math.ceil(player.ultTime)} s · activa`:player.ultShots>0?`${player.ultShots} disparos`:'';
 document.getElementById('ultimate-state').textContent=ready?'LISTA · X':`${player.ultCharge} / ${u.cost}${active?' · '+active:' eliminaciones'}`;
 const bar=document.getElementById('ultimate-progress');bar.setAttribute('aria-valuemax',u.cost);bar.setAttribute('aria-valuenow',player.ultCharge);
 document.getElementById('ultimate-fill').style.width=`${player.ultCharge/u.cost*100}%`;
 const button=document.getElementById('ultimate');button.classList.toggle('ready',ready);button.title=`${u.description} (X)`;button.setAttribute('aria-label',`${u.name}. ${u.description}. ${ready?'Lista':player.ultCharge+' de '+u.cost}`);
}
function ultimateDamage(){const power=player.ultTime>0?player.ultPower:1;if(player.ultShots>0){player.ultShots--;return power*5;}return power;}
function updateUltimate(dt){
 if(player.ultTime>0){player.ultTime=Math.max(0,player.ultTime-dt);if(!player.ultTime){player.ultPower=1;player.ultRegen=false;}}
 const revive=player.ultRevive;if(revive){revive.time-=dt;if(revive.time<=0){if(revive.kind==='phoenix'){safeTeleport(revive);player.hp=player.max;}player.ultRevive=null;}}
}
function ultimateSave(){
 const revive=player.ultRevive;if(!revive)return false;player.ultRevive=null;
 if(revive.kind==='phoenix')safeTeleport(revive);
 player.hp=player.max*(revive.kind==='clove'?.7:1);player.inv=Math.max(player.inv,3);updateHUD();return true;
}
function activateUltimate(){
 if(state!=='playing')return false;const id=activeHero().id,u=ULTIMATES[id];if(player.ultCharge<u.cost)return false;
 if(skillEffects.length>48){skillHint('Espera a que terminen los efectos');return false;}
 const p=skillPoint(600),angle=aimAngle(),target=enemies.filter(e=>e.hp>0).sort((a,b)=>distance(a,p)-distance(b,p))[0];
 if(['deadlock','iso'].includes(id)&&!target){skillHint('Necesitas un enemigo');return false;}
 player.ultCharge=0;player.ultChargeFraction=0;agentUltimateStart();const previousSlot=agentCastSlot;agentCastSlot='x';
 const area=(r,damage,stun=0)=>skillBurst(player.x,player.y,r,damage,stun);
 const line=(damage,stun,slow=0)=>{for(const e of enemies){const dx=e.x-player.x,dy=e.y-player.y,along=dx*Math.cos(angle)+dy*Math.sin(angle),side=Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle));if(e.hp>0&&along>=0&&along<600&&side<90+e.r){e.stun=Math.max(e.stun||0,stun);e.slow=Math.max(e.slow||0,slow);damageEnemy(e,damage);}}addSkillEffect('beam',player.x,player.y,{angle,length:600,width:180,life:.8});};
 switch(id){
 case 'sage':case 'clove':case 'phoenix':player.ultRevive={kind:id,time:id==='phoenix'?12:15,x:player.x,y:player.y};addSkillEffect('aura',player.x,player.y,{follow:true,r:35,life:id==='phoenix'?12:15});break;
 case 'sova':for(let i=0;i<3;i++)addSkillEffect('ultimate-line',player.x,player.y,{angle,life:.2+i*.45,damage:18});break;
 case 'brimstone':addSkillEffect('fire',p.x,p.y,{r:150,life:4,dps:15});break;
 case 'skye':for(let i=0;i<3;i++)addSkillEffect('beast',player.x,player.y,{r:85,life:8,speed:300,damage:12,stun:4});break;
 case 'cypher':case 'fade':for(const e of enemies){e.vulnerable=10;e.revealed=10;if(id==='fade'){e.suppressed=10;e.slow=10;}}area(Math.max(W,H),0);break;
 case 'harbor':addSkillEffect('electric',p.x,p.y,{r:230,life:6,dps:5});break;
 case 'jett':for(let i=0;i<5;i++){const a=angle+(i-2)*.08;addSkillEffect('bolt',player.x,player.y,{vx:Math.cos(a)*800,vy:Math.sin(a)*800,r:35,life:1.5,damage:12});}break;
 case 'breach':line(15,6);break;
 case 'killjoy':addSkillEffect('ultimate-lock',player.x,player.y,{r:320,life:2});break;
 case 'raze':addSkillEffect('bolt',player.x,player.y,{vx:Math.cos(angle)*430,vy:Math.sin(angle)*430,r:180,life:1.5,damage:45});break;
 case 'neon':player.sprint=10;player.sprintFactor=1.8;addSkillEffect('electric',player.x,player.y,{r:100,follow:true,life:10,dps:12});break;
 case 'deadlock':target.root=6;damageEnemy(target,60);addSkillEffect('tether',target.x,target.y,{r:50,life:2});break;
 case 'viper':addSkillEffect('poison',player.x,player.y,{r:220,life:12,dps:6,follow:true});break;
 case 'gekko':addSkillEffect('wingman',player.x,player.y,{r:160,life:8,speed:320,damage:18,stun:6});break;
 case 'kayo':player.stim=10;addSkillEffect('electric',player.x,player.y,{r:200,life:10,dps:4,follow:true});break;
 case 'chamber':player.ultShots=5;addSkillEffect('aura',player.x,player.y,{r:34,follow:true,life:2});break;
 case 'omen':safeTeleport(p);area(160,0,4);break;
 case 'astra':for(const e of enemies){const dx=e.x-player.x,dy=e.y-player.y;if(dx*Math.cos(angle)+dy*Math.sin(angle)>=0&&Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle))<80){e.root=8;e.suppressed=8;}}addSkillEffect('beam',player.x,player.y,{angle,length:600,width:160,life:8});break;
 case 'yoru':player.inv=8;player.sprint=8;player.sprintFactor=1.6;addSkillEffect('aura',player.x,player.y,{r:32,follow:true,life:8});break;
 case 'vyse':skillArea(player.x,player.y,280,e=>{e.root=8;e.vulnerable=8;});area(280,0);break;
 case 'tejo':for(let i=0;i<5;i++)addSkillEffect('grenade',Math.max(18,Math.min(W-18,player.x+Math.cos(angle)*(80+i*95))),Math.max(18,Math.min(H-18,player.y+Math.sin(angle)*(80+i*95))),{r:110,life:.5+i*.35,damage:20});break;
 case 'reyna':player.ultTime=12;player.ultPower=2;player.ultRegen=true;player.stim=12;break;
 case 'iso':damageEnemy(target,80);player.shieldHits=1;player.shieldTime=12;break;
 case 'waylay':line(12,0,10);player.sprint=8;player.sprintFactor=1.8;break;
 case 'veto':player.ultTime=12;player.ultPower=2;player.sprint=12;player.sprintFactor=1.3;player.hp=Math.min(player.max,player.hp+player.max*.4);break;
 case 'miks':area(180,15);addSkillEffect('sound',player.x,player.y,{r:180,life:8,tick:0,follow:true});break;
 case 'hush':addSkillEffect('gravity',p.x,p.y,{r:230,life:8});addSkillEffect('poison',p.x,p.y,{r:230,life:8,dps:8});break;
 }
 agentUltimateEnd();agentCastSlot=previousSlot;skillHint(u.name);updateHUD();return true;
}
