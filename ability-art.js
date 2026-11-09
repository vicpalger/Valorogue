'use strict';
// Colores de habilidad independientes de la rareza y del vestuario.
const ABILITY_PALETTES={
 sage:['#61edc4','#e4fff4'],sova:['#65beff','#e4f6ff'],brimstone:['#ff9b43','#ffe1ad'],
 skye:['#8fe078','#edffba'],cypher:['#e8d7ac','#85e1ef'],harbor:['#33d9c6','#c5fff5'],
 jett:['#99edff','#f2ffff'],breach:['#ffb257','#ffefd0'],killjoy:['#ffe36b','#abf490'],
 raze:['#ff9347','#ffdc68'],neon:['#51bfff','#fff26f'],deadlock:['#b2e6ed','#f3ffff'],
 phoenix:['#ff834c','#fff0ad'],viper:['#83ed52','#d3ff87'],fade:['#b79bde','#e9dcff'],
 gekko:['#bded68','#c5a2ff'],kayo:['#9a99ff','#79f6f2'],chamber:['#f3cd71','#fff1c3'],
 omen:['#9b8bff','#c7b8ff'],astra:['#c596ff','#ffd88c'],yoru:['#648dff','#c5deff'],
 clove:['#e5a0ef','#b6b4ff'],vyse:['#d79bdd','#f7c7e7'],tejo:['#ffb76c','#ffe7ad'],
 reyna:['#d174ef','#ffb5ed'],iso:['#b6a0ff','#ece2ff'],waylay:['#ffe478','#fffbd3'],
 veto:['#7ae6ae','#ddffe8'],miks:['#ff9cba','#b0f5ea'],hush:['#a4e9f3','#e1fbff']
};
function abilityPalette(id=activeHero().id){return ABILITY_PALETTES[id]||['#8ce0df','#f2eee5'];}
function abilityVisualKind(fx){
 if(fx.type==='agent-zone')return fx.dps?'damage':fx.root?'trap':fx.suppress?'suppress':'slow';
 if(['gravity','telekinesis'].includes(fx.type))return 'pull';
 if(['fire','poison','electric'].includes(fx.type))return 'damage';
 if(['wire','sensor','hold','tether'].includes(fx.type))return 'trap';
 if(fx.type==='agent-interceptor')return 'shield';
 if(fx.type==='agent-drone')return 'scan';
 if(fx.type==='sound')return 'heal';
 if(fx.type==='aura')return ['sage','skye','reyna','miks'].includes(fx.agentId)?'heal':'buff';
 if(fx.type==='grenade'||fx.type==='agent-echo')return 'warning';
 return 'burst';
}
function abilityGlyph(kind,x,y,size=9){
 ctx.beginPath();
 if(kind==='heal'){ctx.moveTo(x-size,y);ctx.lineTo(x+size,y);ctx.moveTo(x,y-size);ctx.lineTo(x,y+size);}
 else if(kind==='shield'){ctx.moveTo(x-size,y-size);ctx.lineTo(x+size,y-size);ctx.lineTo(x+size,y+2);ctx.lineTo(x,y+size);ctx.lineTo(x-size,y+2);ctx.closePath();}
 else if(kind==='slow'){for(let i=0;i<3;i++){const a=i*Math.PI/3,dx=Math.cos(a)*size,dy=Math.sin(a)*size;ctx.moveTo(x-dx,y-dy);ctx.lineTo(x+dx,y+dy);}}
 else if(kind==='trap'){ctx.rect(x-size,y-size,size*2,size*2);ctx.moveTo(x-size,y);ctx.lineTo(x+size,y);ctx.moveTo(x,y-size);ctx.lineTo(x,y+size);}
 else if(kind==='warning'){ctx.moveTo(x,y-size);ctx.lineTo(x+size,y+size);ctx.lineTo(x-size,y+size);ctx.closePath();ctx.moveTo(x,y-size/3);ctx.lineTo(x,y+size/3);}
 else if(kind==='damage'){ctx.moveTo(x,y-size);ctx.lineTo(x+size*.7,y);ctx.lineTo(x+size*.4,y+size);ctx.lineTo(x-size*.5,y+size);ctx.lineTo(x-size*.7,y);ctx.closePath();}
 else if(kind==='pull'){for(let i=0;i<4;i++){const a=i*Math.PI/2;const dx=Math.cos(a),dy=Math.sin(a);ctx.moveTo(x+dx*size,y+dy*size);ctx.lineTo(x+dx*3,y+dy*3);ctx.lineTo(x+dx*6-dy*3,y+dy*6+dx*3);}}
 else if(kind==='scan'){ctx.arc(x,y,size,0,Math.PI*2);ctx.moveTo(x,y);ctx.lineTo(x+size,y-size);}
 else if(kind==='suppress'){ctx.arc(x,y,size,0,Math.PI*2);ctx.moveTo(x-size*.7,y+size*.7);ctx.lineTo(x+size*.7,y-size*.7);}
 else{ctx.moveTo(x-size,y+size/2);ctx.lineTo(x,y-size/2);ctx.lineTo(x+size,y+size/2);}
 ctx.stroke();
}
function drawAbilityField(fx){
 const [color,light]=abilityPalette(fx.agentId),x=Math.round(fx.x),y=Math.round(fx.y),kind=abilityVisualKind(fx);
 const progress=Math.min(1,fx.age/(fx.visualLife||1)),r=fx.type==='flash'?fx.r*Math.min(1,fx.age/.25):fx.r;
 ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;
 if(fx.type==='beam'){
  ctx.translate(x,y);ctx.rotate(fx.angle);ctx.globalAlpha=.12;ctx.fillRect(0,-fx.width/2,fx.length,fx.width);ctx.globalAlpha=.8;
  ctx.beginPath();ctx.moveTo(0,-fx.width/2);ctx.lineTo(fx.length,-fx.width/2);ctx.moveTo(0,fx.width/2);ctx.lineTo(fx.length,fx.width/2);ctx.stroke();
  for(let d=20;d<fx.length;d+=45){ctx.beginPath();ctx.moveTo(d-8,-5);ctx.lineTo(d,0);ctx.lineTo(d-8,5);ctx.stroke();}ctx.restore();return;
 }
 if(fx.type==='agent-trail'){ctx.globalAlpha=.5;abilityGlyph('buff',x,y,6);ctx.restore();return;}
 ctx.globalAlpha=kind==='damage'?.12:.055;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=.7;ctx.setLineDash(['warning','trap','suppress'].includes(kind)?[6,6]:[]);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 // Duración o cuenta atrás sobre el límite real de la zona.
 ctx.strokeStyle=light;ctx.globalAlpha=.9;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-progress));ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle=color;
 if(kind==='pull'){
  for(let i=0;i<6;i++){const a=i*Math.PI/3,travel=1-((fx.age*.7+i/6)%1),d=r*(.25+.65*travel);ctx.save();ctx.translate(x+Math.cos(a)*d,y+Math.sin(a)*d);ctx.rotate(a+Math.PI);ctx.beginPath();ctx.moveTo(-6,-4);ctx.lineTo(0,0);ctx.lineTo(-6,4);ctx.stroke();ctx.restore();}
 }else if(kind==='damage'){
  for(let i=0;i<8;i++){const a=i*2.399,rad=r*(.35+.5*(i%3)/2),py=y+Math.sin(a)*rad-((fx.age*12+i*7)%14);ctx.globalAlpha=.45;ctx.fillRect(Math.round(x+Math.cos(a)*rad),Math.round(py),3,5);}
 }else if(kind==='trap'){
  ctx.globalAlpha=.25;ctx.beginPath();for(let i=0;i<3;i++){const a=i*Math.PI/3;ctx.moveTo(x-Math.cos(a)*r,y-Math.sin(a)*r);ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.stroke();
 }else if(['slow','heal','scan','shield'].includes(kind)){
  ctx.globalAlpha=.3;ctx.beginPath();ctx.arc(x,y,r*(.25+.7*((fx.age*.6)%1)),0,Math.PI*2);ctx.stroke();
 }
 ctx.globalAlpha=.95;ctx.fillStyle='#0b1521';ctx.fillRect(x-14,y-14,28,28);ctx.strokeStyle=light;abilityGlyph(kind,x,y,8);
 if(fx.slot){ctx.fillStyle=light;ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(fx.slot.toUpperCase(),x,y+25);}
 ctx.restore();
}
