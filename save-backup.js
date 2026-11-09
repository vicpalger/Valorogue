'use strict';
// Protección local contra edición casual. Esta clave se distribuye con el juego:
// no es un secreto frente a quien controle el navegador. No sustituye un servidor.
const BACKUP_FORMAT='valorogue-save',BACKUP_VERSION=2;
const BACKUP_KEY_V2=new Uint8Array([182,34,71,219,9,143,56,207,114,68,232,16,173,94,201,41,63,156,225,108,18,247,85,194,137,6,211,78,162,49,120,253]);
const BACKUP_HEADER=new TextEncoder().encode('valorogue-save:2:AES-GCM');
async function backupKey(){
 if(!globalThis.crypto||!crypto.subtle)throw Error('Para usar copias protegidas, abre el juego en HTTPS o localhost.');
 return crypto.subtle.importKey('raw',BACKUP_KEY_V2,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
function backupBase64(bytes){let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out);}
function backupBytes(text){
 if(typeof text!=='string'||!text.length||text.length>1400000||text.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw Error('Formato de copia no válido');
 return Uint8Array.from(atob(text),c=>c.charCodeAt(0));
}
function validateBackup(data){
 const p=data&&data.progress;
 if(!p||!Array.isArray(p.owned)||!Array.isArray(p.ownedWeapons)||!Number.isSafeInteger(p.coins)||p.coins<0||!Number.isSafeInteger(p.best)||p.best<0)throw Error('Datos de progreso no válidos');
 const owned=AGENTS.filter(h=>h.id==='sage'||p.owned.includes(h.id)).map(h=>h.id);
 const ownedWeapons=WEAPONS.filter(w=>w.id==='classic'||p.ownedWeapons.includes(w.id)).map(w=>w.id);
 const upgrades=Object.fromEntries(permanent.map(u=>[u.id,Number.isInteger(p.upgrades&&p.upgrades[u.id])?Math.max(0,Math.min(u.max,p.upgrades[u.id])):0]));
 return {progress:{coins:p.coins,best:p.best,owned,ownedWeapons,selected:owned.includes(p.selected)?p.selected:'sage',selectedWeapon:ownedWeapons.includes(p.selectedWeapon)?p.selectedWeapon:'classic',upgrades},meta:cleanMeta(data.meta)};
}
async function encodeBackup(data){
 const clean=validateBackup(data),key=await backupKey(),iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:BACKUP_HEADER,tagLength:128},key,new TextEncoder().encode(JSON.stringify(clean)));
 return JSON.stringify({format:BACKUP_FORMAT,version:BACKUP_VERSION,algorithm:'AES-GCM',iv:backupBase64(iv),data:backupBase64(new Uint8Array(encrypted))});
}
async function decodeBackup(text){
 if(typeof text!=='string'||text.length>1000000)throw Error('La copia es demasiado grande');
 let envelope;try{envelope=JSON.parse(text);}catch{throw Error('El archivo no es una copia válida de Valorogue');}
 if(envelope&&envelope.version===1)throw Error('Las copias JSON antiguas ya no se admiten. Descarga una copia protegida desde el navegador que conserva tu progreso.');
 if(!envelope||envelope.format!==BACKUP_FORMAT||envelope.version!==BACKUP_VERSION||envelope.algorithm!=='AES-GCM'||Object.keys(envelope).some(k=>!['format','version','algorithm','iv','data'].includes(k)))throw Error('Formato de copia protegida no válido');
 const key=await backupKey();let data;
 try{
  const iv=backupBytes(envelope.iv),bytes=backupBytes(envelope.data);if(iv.length!==12||bytes.length<17)throw Error();
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:BACKUP_HEADER,tagLength:128},key,bytes);
  data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain));
 }catch{throw Error('La copia está modificada o dañada. No se ha cambiado tu progreso.');}
 return validateBackup(data);
}
function storeBackup(data){
 const clean=validateBackup(data),keys=['chispa-progress',META_KEY],previous=keys.map(k=>localStorage.getItem(k));
 try{localStorage.setItem(keys[0],JSON.stringify(clean.progress));localStorage.setItem(keys[1],JSON.stringify(clean.meta));}
 catch(error){keys.forEach((key,i)=>{if(previous[i]===null)localStorage.removeItem(key);else localStorage.setItem(key,previous[i]);});throw error;}
}
function performPrestige(){
 if(state!=='menu'||!prestigeReady())throw Error('Completa una nueva partida de 15 minutos antes de ascender.');
 const next={...progress,coins:0,upgrades:Object.fromEntries(permanent.map(u=>[u.id,0])),selected:progress.owned.includes(progress.selected)?progress.selected:permanentAgentSelection,selectedWeapon:progress.ownedWeapons.includes(progress.selectedWeapon)?progress.selectedWeapon:permanentWeaponSelection};
 const nextMeta=cleanMeta(meta);nextMeta.prestige.level++;nextMeta.prestige.points++;nextMeta.prestige.winsSpent=meta.wins.reduce((a,b)=>a+b,0);
 const clean=validateBackup({progress:next,meta:nextMeta});storeBackup(clean);progress=clean.progress;meta=clean.meta;sessionUnlocks=false;konamiBuffer=[];permanentAgentSelection=progress.selected;permanentWeaponSelection=progress.selectedWeapon;runStats=null;
}

function bindBackupControls(root){
 const exp=root.querySelector('#export-save'),imp=root.querySelector('#import-save'),status=root.querySelector('#backup-status');if(!exp||!imp)return;
 let busy=false;
 const reset=root.querySelector('#reset-save'),confirmation=document.getElementById('reset-confirm-dialog'),confirm=document.getElementById('confirm-reset-save'),cancel=document.getElementById('cancel-reset-save');
 const lock=value=>{busy=value;exp.disabled=value;imp.disabled=value;if(reset)reset.disabled=value;if(confirm)confirm.disabled=value;};
 if(reset&&confirm&&cancel&&confirmation){
  let frame=0,started=0,holding=false,mode=null;
  const fill=document.getElementById('reset-hold-fill'),notice=document.getElementById('reset-hold-status');
  const stop=()=>{holding=false;mode=null;cancelAnimationFrame(frame);frame=0;fill.style.width='0%';notice.textContent='';window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',visibility);};
  const visibility=()=>{if(document.hidden)stop();};
  const tick=now=>{if(!holding||!confirmation.open||busy){stop();return;}const ratio=Math.min(1,(now-started)/2000);fill.style.width=(ratio*100)+'%';if(ratio<1){frame=requestAnimationFrame(tick);return;}
   stop();lock(true);try{performPrestige();confirmation.close();lock(false);progressionTab='guardado';showMenu('progreso');}catch(error){notice.textContent='No se pudo realizar el prestigio. '+(error.message||'');lock(false);}
  };
  const begin=type=>{if(busy||holding||!confirmation.open)return;holding=true;mode=type;started=performance.now();notice.textContent='Mantén pulsado para ascender…';window.addEventListener('blur',stop);document.addEventListener('visibilitychange',visibility);frame=requestAnimationFrame(tick);};
  reset.onclick=()=>{if(busy||!prestigeReady())return;stop();document.getElementById('reset-confirm-title').textContent='¿Ascender a prestigio '+(meta.prestige.level+1)+'?';confirmation.showModal();cancel.focus();};
  cancel.onclick=()=>confirmation.close();confirmation.onclose=stop;confirmation.oncancel=stop;
  confirm.onpointerdown=e=>{if(e.button!==0||holding)return;e.preventDefault();confirm.focus();confirm.setPointerCapture(e.pointerId);begin('pointer');};
  confirm.onpointerup=confirm.onpointercancel=confirm.onlostpointercapture=()=>{if(mode==='pointer')stop();};
  confirm.onpointerleave=()=>{if(mode==='pointer')stop();};confirm.onblur=stop;
  confirm.onkeydown=e=>{if(!['Space','Enter'].includes(e.code))return;e.preventDefault();if(!e.repeat)begin(e.code);};
  confirm.onkeyup=e=>{if(e.code===mode){e.preventDefault();stop();}};
  confirm.onclick=e=>e.preventDefault();confirm.oncontextmenu=e=>e.preventDefault();
 }

 exp.onclick=async()=>{if(busy)return;lock(true);status.textContent='';try{
  saveMeta();saveProgress();const text=await encodeBackup({progress:JSON.parse(localStorage.getItem('chispa-progress')),meta});
  const url=URL.createObjectURL(new Blob([text],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download='valorogue-progreso-'+shopDay()+'.valorogue';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Copia protegida descargada.';
 }catch(error){status.textContent=error.message||'No se pudo descargar la copia';}finally{lock(false);}};
 imp.onchange=async()=>{if(busy)return;const file=imp.files[0];if(!file)return;lock(true);status.textContent='';try{
  if(file.size>1000000)throw Error('La copia es demasiado grande');
  const data=await decodeBackup(await file.text());storeBackup(data);meta=data.meta;location.reload();
 }catch(error){status.textContent=error.message||'No se pudo importar la copia';}finally{imp.value='';lock(false);}};
}
