'use strict';
// Habilidades y especializaciones adaptadas a Valorogue, no a las teclas del juego original.
const qDefinitions=[
 ['sage','Orbe de ralentización',16,'slow','Una zona de 100 px ralentiza durante 5 s.'],
 ['sova','Dron explorador',20,'drone','Durante 5 s, revela y vuelve vulnerables a los enemigos en 180 px al cursor.'],
 ['brimstone','Baliza estimulante',18,'stim','Aumenta un 20 % la cadencia durante 5 s.'],
 ['skye','Recrecimiento',22,'heal','Recupera un 25 % de vida durante 3 s.'],
 ['cypher','Ciberjaula',18,'cage','Una jaula de 110 px ralentiza y reduce el daño de los enemigos durante 5 s.'],
 ['harbor','Cala',22,'shield','Un escudo absorbe un golpe durante los siguientes 6 s.'],
 ['jett','Vendaval ascendente',14,'evade','Esquiva con 1,2 s de invulnerabilidad y empuja a los enemigos cercanos.'],
 ['breach','Réplica',18,'blast','Explosión tras 0,8 s: 7 de daño en 100 px.'],
 ['killjoy','Bot de alarma',20,'alarm','Un bot persigue a un enemigo y estalla: 2 de daño y vulnerabilidad durante 5 s.'],
 ['raze','Fardo explosivo',16,'satchel','Avanza hasta 110 px hacia el cursor y causa 5 de daño en 90 px. Respeta los muros.'],
 ['neon','Electrorrebote',16,'stun-line','Una descarga frontal aturde durante 2,5 s.'],
 ['deadlock','GravNet',18,'net','Una red de 110 px inmoviliza durante 3 s.'],
 ['phoenix','Combustión',20,'flame','Fuego durante 4 s: 3 de daño por segundo. Te cura un 15 % si estás en la zona al lanzarlo.'],
 ['viper','Mordedura',18,'acid','Una zona de 110 px causa 2 de daño por segundo y vuelve vulnerables a los enemigos durante 4 s.'],
 ['fade','Acechador',18,'prowler','Un acechador persigue a un enemigo: 3 de daño y 2 s de aturdimiento.'],
 ['gekko','Dizzy',20,'dizzy','Durante 5 s, aturde brevemente a un enemigo cercano cada segundo.'],
 ['kayo','Unidad/Flash',16,'flash','Un destello al cursor aturde 2,5 s a los enemigos en 130 px.'],
 ['chamber','Rendezvous',20,'anchor','Coloca un ancla durante 8 s. Pulsa Q otra vez para regresar.'],
 ['omen','Paranoia',18,'paranoia','Una onda de 360 px atraviesa el terreno y aturde 2,5 s.'],
 ['astra','Pulso nova',18,'nova','Un pulso al cursor aturde durante 3 s en 130 px.'],
 ['yoru','Punto ciego',16,'blind','Un destello al cursor aturde 2,5 s en 130 px.'],
 ['clove','Tentempié',18,'recover','Recupera un 10 % de vida y corre un 40 % más rápido durante 4 s.'],
 ['vyse','Zarzas cortantes',20,'razors','Una zona de 120 px ralentiza y causa 1,5 de daño por segundo durante 5 s.'],
 ['tejo','Entrega especial',18,'delivery','Una granada causa 5 de daño y aturde 1,5 s en 100 px.'],
 ['reyna','Despreciar',12,'dismiss','Consume un alma cercana para obtener 2 s de invulnerabilidad y +30 % de velocidad.'],
 ['iso','Socavar',16,'undercut','Una onda frontal de 360 px vuelve vulnerables a los enemigos durante 5 s.'],
 ['waylay','Saturar',18,'saturate','Una zona de 120 px ralentiza y reduce el daño de enemigos durante 4 s.'],
 ['veto','Interceptor',20,'intercept','Durante 5 s, destruye los proyectiles enemigos a 100 px de ti.'],
 ['miks','Armonía',18,'harmony','Aumenta un 20 % la cadencia durante 5 s y recupera un 8 % de vida.'],
 ['hush','Repulsión',16,'repulse','Una onda frontal empuja enemigos y los aturde 1 s.']
];
const Q_ABILITIES=Object.fromEntries(qDefinitions.map(([id,name,cooldown,kind,description])=>[id,{name,cooldown,kind,description}]));
const signatureUpgrades={
 sage:[['Barrera vital','E también concede un escudo de un golpe durante 4 s.'],['Pulso restaurador','Al terminar la curación de E, ralentizas 3 s a enemigos en 130 px.']],
 sova:[['Eco eléctrico','La flecha de E genera otra explosión de 3 de daño tras 0,5 s.'],['Marca del cazador','Las explosiones de E vuelven vulnerables a los enemigos durante 4 s.']],
 brimstone:[['Combustible extra','La zona de E es un 35 % mayor y causa 4 de daño por segundo.'],['Baliza reparadora','Q dura 2 s más y recupera un 10 % de vida.']],
 skye:[['Manada','E envía dos bestias en vez de una.'],['Protección natural','Q también concede un escudo de un golpe durante 4 s.']],
 cypher:[['Cable electrificado','La trampa de E causa 2 de daño por segundo.'],['Jaula delatora','Q también vuelve vulnerables a los enemigos.']],
 harbor:[['Marea arrolladora','E empuja 40 px adicionales y vuelve vulnerables durante 4 s.'],['Agua reparadora','Q recupera un 15 % de vida al crear el escudo.']],
 jett:[['Cuchillas al viento','E lanza tres cuchillas de 3 de daño hacia el cursor.'],['Doble impulso','Puedes guardar dos cargas de E. Cada carga se recupera por separado.']],
 breach:[['Temblor residual','E deja una explosión retrasada de 4 de daño en su extremo.'],['Carga reforzada','La explosión de Q tiene un 50 % más de radio.']],
 killjoy:[['Doble objetivo','La torreta de E dispara a dos enemigos visibles a la vez.'],['Despedida explosiva','La torreta explota al desaparecer: 5 de daño y 2 s de aturdimiento en 110 px.']],
 raze:[['Incendio de pintura','La granada principal de E deja fuego de 2 de daño por segundo durante 3 s.'],['Implosión','E atrae enemigos antes de las explosiones secundarias.']],
 neon:[['Alto voltaje','La electricidad de E alcanza 80 px y causa 3 de daño por segundo.'],['Descarga ofensiva','Q también causa 4 de daño a los enemigos alcanzados.']],
 deadlock:[['Sensor letal','El sensor de E causa 5 de daño al activarse.'],['Red expuesta','La red de Q también vuelve vulnerables durante 4 s.']],
 phoenix:[['Destello abrasador','El destello de E deja fuego de 2 de daño por segundo durante 3 s.'],['Calor vital','La curación de Q pasa del 15 % al 30 %.']],
 viper:[['Nube extendida','La nube de E gana un 35 % de radio.'],['Veneno concentrado','Q causa 3 de daño por segundo y su vulnerabilidad dura 7 s.']],
 fade:[['Pesadilla persistente','Los enemigos atrapados por E quedan ralentizados 6 s.'],['Doble acecho','Q envía dos acechadores.']],
 gekko:[['Compañero feroz','Wingman gana 40 px de explosión y 1 s de aturdimiento.'],['Dizzy acelerado','Dizzy actúa cada 0,5 s y alcanza dos objetivos.']],
 kayo:[['Pulso ofensivo','E también causa 4 de daño en su zona.'],['Flash prolongado','Q aturde durante 4 s.']],
 chamber:[['Munición perforante','Los disparos potenciados de E atraviesan enemigos.'],['Reembolso preciso','Cada baja con un disparo potenciado de E devuelve una bala al cargador.']],
 omen:[['Sombra abandonada','Al usar E dejas un señuelo durante 4 s.'],['Llegada oscura','Al llegar con E causas 4 de daño y aturdes 1 s en 110 px.']],
 astra:[['Horizonte de sucesos','El pozo de E dura 6 s y causa 2 de daño por segundo.'],['Eco nova','Q detona dos veces, con 0,6 s de separación.']],
 yoru:[['Engaño explosivo','El señuelo de E causa 5 de daño al desaparecer.'],['Destello revelador','Q también vuelve vulnerables durante 5 s.']],
 clove:[['Intromisión veloz','La aceleración de E pasa a +40 % durante 5 s.'],['Recuperación intensa','Q recupera un 25 % de vida en lugar del 10 %.']],
 vyse:[['Pétalos afilados','La rosa de E también causa 5 de daño.'],['Zarzas invasivas','Q tiene 35 px más de radio y dura 7 s.']],
 tejo:[['Tercera salva','E añade una tercera explosión de 6 de daño.'],['Entrega expuesta','La explosión de Q vuelve vulnerables durante 4 s.']],
 reyna:[['Almas persistentes','Las almas duran 6 s y E/Q pueden consumirlas desde 400 px.'],['Exceso vital','La curación sobrante de E concede un escudo de un golpe durante 6 s. Puedes usar E con vida completa si no tienes escudo.']],
 iso:[['Ruptura cinética','Al romperse un escudo, causas 4 de daño y aturdes 1,5 s en 110 px.'],['Contrato protector','Durante 8 s tras X, cada baja añade 2 s al escudo actual o al siguiente, hasta 10 s extra.']],
 waylay:[['Retorno explosivo','Volver a la marca de E causa 6 de daño y aturde 1 s en 110 px.'],['Estela prismática','Durante 4 s tras E dejas una estela que ralentiza.']],
 veto:[['Trampa corrosiva','La trampa de E causa 2 de daño por segundo cuando está activada.'],['Reciclaje','Cada proyectil destruido por Q cura un 2 % de vida, hasta un 20 % por uso.']],
 miks:[['Ritmo rápido','Los pulsos de E se producen cada 0,7 s.'],['Armonía protectora','Q también concede un escudo de un golpe durante 4 s.']],
 hush:[['Atracción intensa','E gana 40 px de radio y atrae un 50 % más rápido.'],['Repulsión ofensiva','Q también causa 5 de daño y vuelve vulnerables durante 4 s.']]
};
let agentCastSlot=null;
function agentUpgradeCap(hero=activeHero()){return rarityTiers.findIndex(r=>r.name===hero.rarity)+2;}
function hasAgentUpgrade(index){return !!(player&&player.agentUpgrades&&player.agentUpgrades.includes(activeHero().id+':'+index));}
function resetAgentBuild(){Object.assign(player,{agentUpgrades:[],qCooldown:0,qScale:1,qAnchor:null,qAnchorTime:0,eCharges:null,sageWavePending:false,isoWindow:0,isoShieldBank:0,agentOverdrive:0,ultChargeFraction:0});agentCastSlot=null;}
function agentUpgradesFor(hero=activeHero()){
 const extra=[['Técnica ágil','Q recarga un 20 % más rápido.'],['Control experto','E recarga un 20 % más rápido, hasta el límite de reducción del 65 %.'],['Reserva definitiva','X obtiene un punto extra de carga cada cuatro eliminaciones.'],['Convergencia','Durante 8 s tras X, cada baja reduce 1 s la recarga de Q y E. Requiere las dos mejoras propias del agente.']];
 if(hero.id==='jett')extra[0]=['Vendaval','Con las dos mejoras propias: E lanza cinco cuchillas, Q lanza tres y recarga un 20 % más rápido.'];
 return [...signatureUpgrades[hero.id],...extra].slice(0,agentUpgradeCap(hero)).map(([name,desc],index)=>({id:hero.id+':'+index,name,desc,agentUpgrade:true,icon:'◷',available:()=>!hasAgentUpgrade(index)&&(index!==3||player.skillScale>.350001)&&(index!==5&&!(hero.id==='jett'&&index===2)||hasAgentUpgrade(0)&&hasAgentUpgrade(1)),apply:()=>{
  if(activeHero().id!==hero.id||player.agentUpgrades.length>=agentUpgradeCap(hero)||hasAgentUpgrade(index))return;
  player.agentUpgrades.push(hero.id+':'+index);
  if(index===2){player.qScale*=.8;player.qCooldown*=.8;}
  if(index===3){const old=player.skillScale;player.skillScale=Math.max(.35,old*.8);skillCooldown*=player.skillScale/old;}
  if(hero.id==='jett'&&index===1)player.eCharges=skillCooldown>0?1:2;
 }}));
}
function rollUpgradeChoices(previous=[]){
 const old=new Set(previous.map(u=>u.id||u.name)),pool=upgrades.filter(u=>!u.available||u.available()),fresh=pool.filter(u=>!old.has(u.id||u.name));
 const result=(fresh.length>=3?fresh:pool).slice().sort(()=>Math.random()-.5).slice(0,3);
 const own=agentUpgradesFor().filter(u=>u.available());
 if(player.agentUpgrades.length<agentUpgradeCap()&&own.length&&Math.random()<.25){const next=own.filter(u=>!old.has(u.id)),options=next.length?next:own;result[Math.floor(Math.random()*result.length)]=options[Math.floor(Math.random()*options.length)];}
 return result;
}
function agentSoulRange(){return activeHero().id==='reyna'&&hasAgentUpgrade(0)?400:260;}
function canCastFullHeal(id){return player.shieldHits<=0&&(id==='sage'&&hasAgentUpgrade(0)||id==='reyna'&&hasAgentUpgrade(1));}
function grantAgentShield(time){player.shieldHits=Math.max(1,player.shieldHits);player.shieldTime=Math.max(time,player.shieldTime);}
function agentLine(range,width,apply){const angle=aimAngle();for(const e of enemies){const dx=e.x-player.x,dy=e.y-player.y;if(e.hp>0&&dx*Math.cos(angle)+dy*Math.sin(angle)>=0&&dx*Math.cos(angle)+dy*Math.sin(angle)<=range&&Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle))<=width+e.r)apply(e);}addSkillEffect('beam',player.x,player.y,{angle,length:range,width:width*2,life:.4});}
function qZone(p,options){return addSkillEffect('agent-zone',p.x,p.y,{r:110,life:4,...options});}
function activateSecondary(){
 if(state!=='playing')return false;const hero=activeHero(),q=Q_ABILITIES[hero.id],p=skillPoint(),last=agentCastSlot;agentCastSlot='q';
 try{
  if(q.kind==='anchor'&&player.qAnchor){safeTeleport(player.qAnchor);player.qAnchor=null;player.qAnchorTime=0;updateHUD();return true;}
  if(player.qCooldown>0)return false;
  if(q.kind==='heal'&&player.hp>=player.max&&!hasAgentUpgrade(1))return false;
  if(skillEffects.length>58){skillHint('Espera a que terminen los efectos');return false;}
  switch(q.kind){
   case 'slow':qZone(p,{r:100,life:5,slow:1.2});break;
   case 'drone':addSkillEffect('agent-drone',p.x,p.y,{r:180,life:5,tick:0,mode:'reveal'});break;
   case 'stim':player.stim=Math.max(player.stim,hasAgentUpgrade(1)?7:5);if(hasAgentUpgrade(1))player.hp=Math.min(player.max,player.hp+player.max*.1);addSkillEffect('aura',player.x,player.y,{r:35,life:5,follow:true});break;
   case 'heal':skillHeal(.25,3);if(hasAgentUpgrade(1))grantAgentShield(4);addSkillEffect('aura',player.x,player.y,{r:35,life:3,follow:true});break;
   case 'cage':qZone(p,{r:110,life:5,slow:1.2,suppress:1.2,vulnerable:hasAgentUpgrade(1)?1.2:0});break;
   case 'shield':grantAgentShield(6);if(hasAgentUpgrade(1))player.hp=Math.min(player.max,player.hp+player.max*.15);addSkillEffect('flash',player.x,player.y,{r:40,life:.5});break;
   case 'evade':player.inv=Math.max(player.inv,1.2);skillArea(player.x,player.y,90,e=>{const d=distance(e,player)||1;moveOnTerrain(e,(e.x-player.x)/d*45,(e.y-player.y)/d*45);});addSkillEffect('flash',player.x,player.y,{r:90,life:.5});if(hasAgentUpgrade(2))for(let i=-1;i<=1;i++){const a=aimAngle()+i*.12;addSkillEffect('bolt',player.x,player.y,{vx:Math.cos(a)*650,vy:Math.sin(a)*650,r:24,life:1,damage:3});}break;
   case 'blast':addSkillEffect('grenade',p.x,p.y,{r:hasAgentUpgrade(1)?150:100,life:.8,damage:7});break;
   case 'alarm':addSkillEffect('wingman',player.x,player.y,{r:90,life:6,speed:240,damage:2,stun:0,vulnerability:5});break;
   case 'satchel':{const a=aimAngle();moveOnTerrain(player,Math.cos(a)*110,Math.sin(a)*110);player.x=Math.max(15,Math.min(W-15,player.x));player.y=Math.max(15,Math.min(H-15,player.y));skillBurst(player.x,player.y,90,5);player.inv=Math.max(player.inv,.4);break;}
   case 'stun-line':agentLine(320,45,e=>{e.stun=2.5;if(hasAgentUpgrade(1))damageEnemy(e,4);});break;
   case 'net':qZone(p,{r:110,life:3,root:.3,vulnerable:hasAgentUpgrade(1)?4:0});break;
   case 'flame':addSkillEffect('fire',p.x,p.y,{r:100,life:4,dps:3});if(distance(player,p)<=100)player.hp=Math.min(player.max,player.hp+player.max*(hasAgentUpgrade(1)?.3:.15));break;
   case 'acid':qZone(p,{r:110,life:4,dps:hasAgentUpgrade(1)?3:2,vulnerable:hasAgentUpgrade(1)?7:4});break;
   case 'prowler':for(let i=0;i<(hasAgentUpgrade(1)?2:1);i++)addSkillEffect('beast',player.x,player.y,{r:80,life:5,speed:260,damage:3,stun:2});break;
   case 'dizzy':addSkillEffect('agent-drone',p.x,p.y,{r:180,life:5,tick:0,mode:'dizzy',interval:hasAgentUpgrade(1)?.5:1,targets:hasAgentUpgrade(1)?2:1});break;
   case 'flash':case 'blind':addSkillEffect('grenade',p.x,p.y,{r:130,life:.3,damage:0,stun:q.kind==='flash'&&hasAgentUpgrade(1)?4:2.5,vulnerability:q.kind==='blind'&&hasAgentUpgrade(1)?5:0});break;
   case 'anchor':player.qAnchor={x:player.x,y:player.y};player.qAnchorTime=8;addSkillEffect('flash',player.x,player.y,{r:25,life:.5});break;
   case 'paranoia':agentLine(360,48,e=>e.stun=2.5);break;
   case 'nova':addSkillEffect('grenade',p.x,p.y,{r:130,life:.3,damage:0,stun:3});if(hasAgentUpgrade(1))addSkillEffect('grenade',p.x,p.y,{r:130,life:.9,damage:0,stun:3});break;
   case 'recover':player.hp=Math.min(player.max,player.hp+player.max*(hasAgentUpgrade(1)?.25:.1));player.sprint=4;player.sprintFactor=1.4;break;
   case 'razors':qZone(p,{r:hasAgentUpgrade(1)?155:120,life:hasAgentUpgrade(1)?7:5,slow:1.2,dps:1.5});break;
   case 'delivery':addSkillEffect('grenade',p.x,p.y,{r:100,life:.5,damage:5,stun:1.5,vulnerability:hasAgentUpgrade(1)?4:0});break;
   case 'dismiss':{const soul=soulOrbs.find(s=>distance(s,player)<=agentSoulRange());if(!soul)return false;soulOrbs.splice(soulOrbs.indexOf(soul),1);player.inv=Math.max(player.inv,2);player.sprint=2;player.sprintFactor=1.3;addSkillEffect('aura',player.x,player.y,{r:30,life:2,follow:true});break;}
   case 'undercut':agentLine(360,50,e=>e.vulnerable=5);break;
   case 'saturate':qZone(p,{r:120,life:4,slow:1.2,suppress:1.2});break;
   case 'intercept':addSkillEffect('agent-interceptor',player.x,player.y,{r:100,life:5,follow:true,healed:0});break;
   case 'harmony':player.stim=Math.max(player.stim,5);player.hp=Math.min(player.max,player.hp+player.max*.08);if(hasAgentUpgrade(1))grantAgentShield(4);addSkillEffect('aura',player.x,player.y,{r:35,life:5,follow:true});break;
   case 'repulse':agentLine(280,65,e=>{const d=distance(e,player)||1;moveOnTerrain(e,(e.x-player.x)/d*80,(e.y-player.y)/d*80);e.stun=1;if(hasAgentUpgrade(1)){e.vulnerable=4;damageEnemy(e,5);}});break;
  }
  player.qCooldown=q.cooldown*player.qScale;updateHUD();return true;
 }finally{agentCastSlot=last;}
}
function activateAbility(){
 if(state!=='playing')return false;const id=activeHero().id,from={x:player.x,y:player.y},wasReturn=id==='waylay'&&player.anchor,old=skillCooldown,last=agentCastSlot;
 const charged=id==='jett'&&hasAgentUpgrade(1);if(charged&&player.eCharges<=0)return false;if(charged)skillCooldown=0;
 agentCastSlot='e';let result=false;
 try{result=activateBaseAbility();if(!result){if(charged)skillCooldown=old;return false;}
  if(charged){player.eCharges--;skillCooldown=old>0?old:activeHero().cooldown*player.skillScale;}
  if(wasReturn){if(hasAgentUpgrade(0))skillBurst(player.x,player.y,110,6,1);if(hasAgentUpgrade(1))addSkillEffect('agent-trail',player.x,player.y,{life:4,follow:true,tick:0});}
  else onAgentE(from);
  updateHUD();return true;
 }finally{agentCastSlot=last;}
}
function onAgentE(from){const id=activeHero().id,p=skillPoint();
 if(id==='sage'){if(hasAgentUpgrade(0))grantAgentShield(4);if(hasAgentUpgrade(1))player.sageWavePending=true;}
 if(id==='skye'&&hasAgentUpgrade(0))addSkillEffect('beast',player.x,player.y,{r:65,life:4,speed:270,damage:5,stun:2});
 if(id==='harbor'&&hasAgentUpgrade(0))agentLine(300,100,e=>{e.vulnerable=4;moveOnTerrain(e,Math.cos(aimAngle())*40,Math.sin(aimAngle())*40);});
 if(id==='jett'&&hasAgentUpgrade(0))for(let i=hasAgentUpgrade(2)?-2:-1;i<=(hasAgentUpgrade(2)?2:1);i++){const a=aimAngle()+i*.12;addSkillEffect('bolt',player.x,player.y,{vx:Math.cos(a)*650,vy:Math.sin(a)*650,r:24,life:1,damage:3});}
 if(id==='breach'&&hasAgentUpgrade(0)){const end=skillPoint(300);addSkillEffect('grenade',end.x,end.y,{r:100,life:.6,damage:4,stun:1});}
 if(id==='fade'&&hasAgentUpgrade(0))skillArea(p.x,p.y,100,e=>e.slow=6);
 if(id==='kayo'&&hasAgentUpgrade(0))skillBurst(player.x,player.y,180,4);
 if(id==='omen'){if(hasAgentUpgrade(0))addSkillEffect('clone',from.x,from.y,{r:110,life:4,angle:aimAngle()});if(hasAgentUpgrade(1))skillBurst(player.x,player.y,110,4,1);}
 if(id==='clove'&&hasAgentUpgrade(0)){player.sprint=5;player.sprintFactor=1.4;}
 if(id==='tejo'&&hasAgentUpgrade(0))addSkillEffect('grenade',p.x,p.y,{r:75,life:.9,damage:6});
 if(id==='reyna'&&hasAgentUpgrade(1)&&player.hp+player.healLeft>player.max)grantAgentShield(6);
 if(id==='iso'&&player.isoShieldBank){player.shieldTime+=player.isoShieldBank;player.isoShieldBank=0;}
 if(id==='waylay'&&hasAgentUpgrade(1))addSkillEffect('agent-trail',player.x,player.y,{life:4,follow:true,tick:0});
}
function prepareAgentEffect(type,options){
 const o={...options,slot:agentCastSlot};if(agentCastSlot!=='e')return o;const id=activeHero().id;
 if(id==='brimstone'&&type==='fire'&&hasAgentUpgrade(0)){o.r=(o.r||90)*1.35;o.dps=4;}
 if(id==='neon'&&type==='electric'&&hasAgentUpgrade(0)){o.r=80;o.dps=3;}
 if(id==='viper'&&type==='poison'&&hasAgentUpgrade(0))o.r=(o.r||105)*1.35;
 if(id==='gekko'&&type==='wingman'&&hasAgentUpgrade(0)){o.r+=40;o.stun+=1;}
 if(id==='astra'&&type==='gravity'&&hasAgentUpgrade(0))o.life=6;
 if(id==='vyse'&&type==='grenade'&&hasAgentUpgrade(0))o.damage=5;
 if(id==='miks'&&type==='sound'&&hasAgentUpgrade(0))o.interval=.7;
 if(id==='hush'&&type==='telekinesis'&&hasAgentUpgrade(0)){o.r+=40;o.pullSpeed=150;}
 return o;
}
function agentBurstStatuses(x,y,r){if(agentCastSlot==='e'&&activeHero().id==='sova'&&hasAgentUpgrade(1))skillArea(x,y,r,e=>e.vulnerable=4);}
function updateAgentEffect(fx,dt){
 if(fx.type==='agent-zone')skillArea(fx.x,fx.y,fx.r,e=>{if(fx.slow)e.slow=Math.max(e.slow||0,fx.slow);if(fx.root)e.root=Math.max(e.root||0,fx.root);if(fx.suppress)e.suppressed=Math.max(e.suppressed||0,fx.suppress);if(fx.vulnerable)e.vulnerable=Math.max(e.vulnerable||0,fx.vulnerable);if(fx.dps)damageEnemy(e,fx.dps*dt);});
 if(fx.type==='agent-drone'){fx.tick-=dt;if(fx.tick<=0){fx.tick=fx.interval||1;const targets=enemies.filter(e=>e.hp>0&&distance(e,fx)<fx.r).sort((a,b)=>distance(a,fx)-distance(b,fx));for(const e of (fx.mode==='reveal'?targets:targets.slice(0,fx.targets||1))){e.revealed=1.2;if(fx.mode==='reveal')e.vulnerable=1.2;else e.stun=.6;} }}
 if(fx.type==='agent-interceptor'){for(const b of enemyShots)if(b.life>0&&distance(b,fx)<=fx.r){b.life=0;if(hasAgentUpgrade(1)&&fx.healed<.2){const heal=Math.min(.02,.2-fx.healed);player.hp=Math.min(player.max,player.hp+player.max*heal);fx.healed+=heal;}}}
 if(fx.type==='agent-trail'){fx.tick-=dt;if(fx.tick<=0){fx.tick=.2;qZone(fx,{r:36,life:1.2,slow:1.1});}}
 if(fx.type==='agent-echo'&&fx.life<=0)skillBurst(fx.x,fx.y,fx.r,fx.damage);
 if(fx.slot==='e'){
  const id=activeHero().id;
  if((id==='cypher'&&fx.type==='wire'||id==='astra'&&fx.type==='gravity'||id==='veto'&&fx.type==='hold'&&fx.triggered)&&hasAgentUpgrade(0))skillArea(fx.x,fx.y,fx.r,e=>damageEnemy(e,2*dt));
  if(id==='deadlock'&&fx.type==='sensor'&&hasAgentUpgrade(0)&&!fx.agentTriggered&&enemies.some(e=>e.hp>0&&distance(e,fx)<fx.r)){fx.agentTriggered=true;skillBurst(fx.x,fx.y,fx.r,5);}
 }
}
function agentEffectEnded(fx){
 if(fx.slot!=='e')return;const id=activeHero().id;
 if(id==='sova'&&fx.type==='bolt'&&hasAgentUpgrade(0))addSkillEffect('agent-echo',fx.x,fx.y,{r:80,life:.5,damage:3});
 if(id==='killjoy'&&fx.type==='turret'&&hasAgentUpgrade(1))skillBurst(fx.x,fx.y,110,5,2);
 if(id==='raze'&&fx.type==='grenade'&&fx.clusters){if(hasAgentUpgrade(0))addSkillEffect('fire',fx.x,fx.y,{r:95,life:3,dps:2});if(hasAgentUpgrade(1))addSkillEffect('gravity',fx.x,fx.y,{r:110,life:.8});}
 if(id==='phoenix'&&fx.type==='grenade'&&hasAgentUpgrade(0))addSkillEffect('fire',fx.x,fx.y,{r:90,life:3,dps:2});
 if(id==='yoru'&&fx.type==='clone'&&hasAgentUpgrade(0))skillBurst(fx.x,fx.y,fx.r,5);
}
function updateAgentBuild(dt){
 player.qCooldown=Math.max(0,player.qCooldown-dt);player.qAnchorTime=Math.max(0,player.qAnchorTime-dt);if(!player.qAnchorTime)player.qAnchor=null;
 player.isoWindow=Math.max(0,player.isoWindow-dt);player.agentOverdrive=Math.max(0,player.agentOverdrive-dt);
 if(player.sageWavePending&&player.healLeft<=0){player.sageWavePending=false;skillArea(player.x,player.y,130,e=>e.slow=3);addSkillEffect('flash',player.x,player.y,{r:130,life:.5});}
 if(activeHero().id==='jett'&&hasAgentUpgrade(1)&&skillCooldown<=0&&player.eCharges<2){player.eCharges++;if(player.eCharges<2)skillCooldown=activeHero().cooldown*player.skillScale;}
}
function agentShieldBreak(){if(activeHero().id==='iso'&&hasAgentUpgrade(0))skillBurst(player.x,player.y,110,4,1.5);}
function agentKill(enemy,source,projectile){
 if(activeHero().id==='chamber'&&hasAgentUpgrade(1)&&projectile&&projectile.chamberRound)player.ammo=Math.min(magazineCapacity(),player.ammo+1);
 if(activeHero().id==='iso'&&hasAgentUpgrade(1)&&player.isoWindow>0){if(player.shieldHits>0)player.shieldTime=Math.min(20,player.shieldTime+2);else player.isoShieldBank=Math.min(10,player.isoShieldBank+2);}
 if(player.agentOverdrive>0){skillCooldown=Math.max(0,skillCooldown-1);player.qCooldown=Math.max(0,player.qCooldown-1);}
}
function agentUltimateStart(){if(activeHero().id==='iso'&&hasAgentUpgrade(1))player.isoWindow=8;if(hasAgentUpgrade(5))player.agentOverdrive=8;}
function agentUltimateEnd(){if(activeHero().id==='iso'&&player.isoShieldBank&&player.shieldHits>0){player.shieldTime+=player.isoShieldBank;player.isoShieldBank=0;}}
function agentUltimateGain(){if(!hasAgentUpgrade(4))return 1;player.ultChargeFraction+=.25;const extra=Math.floor(player.ultChargeFraction);player.ultChargeFraction-=extra;return 1+extra;}
function updateSecondaryHUD(){
 if(!player)return;const q=Q_ABILITIES[activeHero().id],recast=!!player.qAnchor,soulMissing=q.kind==='dismiss'&&!soulOrbs.some(s=>distance(s,player)<=agentSoulRange()),ready=recast||player.qCooldown<=0&&!soulMissing;
 document.getElementById('secondary-name').textContent=q.name;const text=recast?'Volver al ancla':player.qCooldown>0?`${Math.ceil(player.qCooldown)} s`:soulMissing?'Necesita un alma':'Lista';
 document.getElementById('secondary-state').textContent=text;document.getElementById('secondary-fill').style.width=(recast?100:(1-Math.min(1,player.qCooldown/(q.cooldown*player.qScale)))*100)+'%';
 const button=document.getElementById('secondary');button.classList.toggle('ready',ready);button.title=q.description;button.setAttribute('aria-label',q.name+'. '+text);
}
function agentInfoBuild(hero){const q=Q_ABILITIES[hero.id];return `<div class="agent-skill-info"><span class="skill-key">Q</span><div><strong>${q.name}</strong><p>${q.description}</p><small>Recarga: ${q.cooldown} s</small></div></div>`;}
function agentUpgradeInfo(hero){return `<details class="agent-upgrade-info"><summary>Mejoras de ${hero.name} · máximo ${agentUpgradeCap(hero)}</summary><p>25 % de probabilidad de una opción exclusiva al subir de nivel. Solo duran esa partida; cada una se elige una vez.</p>${agentUpgradesFor(hero).map(u=>`<div><strong>${u.name}</strong><p>${u.desc}</p></div>`).join('')}</details>`;}
