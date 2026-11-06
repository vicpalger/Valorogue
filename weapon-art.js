'use strict';
const weaponArtCache=new Map();
function weaponImage(weapon){
    if(weaponArtCache.has(weapon.id))return weaponArtCache.get(weapon.id);
    const image=document.createElement('canvas');image.width=64;image.height=24;const g=image.getContext('2d');
    const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
    const dark='#09131f',metal='#506c7e',light='#9cb5c0',bright='#dce9e9',grip='#263c4c',accent=weapon.mode==='auto'?'#ff7883':'#8ce0df';
    const pistol=weapon.category==='Pistolas',sniper=weapon.category==='Francotiradores',shotgun=weapon.category==='Escopetas',heavy=weapon.category==='Ametralladoras';
    if(weapon.mode==='melee'){
        rect(9,10,17,5,dark);rect(10,11,14,3,grip);rect(24,8,3,9,light);rect(27,9,24,7,dark);rect(28,10,23,4,light);rect(29,10,24,2,bright);rect(51,10,3,2,bright);rect(29,14,16,1,metal);
    }else if(pistol){
        const length={classic:24,shorty:28,frenzy:26,ghost:38,bandit:29,sheriff:32}[weapon.id];
        rect(13,6,length,9,dark);rect(14,7,length-2,5,metal);rect(15,7,length-3,2,light);rect(17,14,8,8,dark);rect(18,15,5,6,grip);rect(24,14,6,4,dark);rect(25,14,4,2,metal);rect(16,5,3,2,bright);
        if(weapon.id==='ghost'){rect(36,8,18,6,dark);rect(37,9,16,2,light);}
        if(weapon.id==='shorty'){rect(29,8,13,2,light);rect(29,12,13,2,light);rect(23,14,10,3,grip);}
        if(weapon.id==='sheriff'){rect(18,8,10,7,light);rect(20,9,6,5,metal);rect(21,10,2,3,dark);rect(29,6,12,2,bright);}
        if(weapon.id==='frenzy'){rect(20,15,5,8,metal);rect(15,8,11,2,accent);}
        if(weapon.id==='bandit'){rect(27,7,4,7,grip);rect(32,6,7,2,accent);}
    }else{
        const length=sniper?43:heavy?43:shotgun?34:37;
        rect(10,8,length,9,dark);rect(11,9,length-2,5,metal);rect(12,9,length-3,2,light);rect(6,10,6,7,dark);rect(2,10,5,9,dark);rect(3,11,5,5,grip);
        rect(19,15,6,8,dark);rect(20,16,3,6,grip);rect(29,15,7,8,dark);rect(30,16,5,5,metal);rect(12,11,5,2,accent);
        rect(46,10,13,4,dark);rect(47,10,12,1,light);rect(58,9,3,6,dark);
        if(sniper){rect(23,3,20,6,dark);rect(24,4,18,3,metal);rect(25,4,4,3,accent);rect(37,3,6,5,light);rect(29,9,5,2,bright);rect(53,10,9,2,bright);rect(30,16,5,4,grip);}
        if(shotgun){rect(34,13,12,3,grip);for(let x=35;x<46;x+=3)rect(x,13,1,3,light);rect(47,10,11,3,metal);rect(30,16,5,3,grip);}
        if(heavy){rect(29,15,13,9,dark);rect(30,16,11,7,metal);rect(35,17,5,5,grip);for(let x=43;x<53;x+=3)rect(x,10,1,3,dark);}
        if(weapon.id==='stinger'){rect(2,10,8,2,light);rect(30,17,3,6,accent);rect(40,8,4,2,light);}
        if(weapon.id==='spectre'||weapon.id==='phantom'){rect(48,8,14,7,dark);rect(49,9,12,2,metal);}
        if(weapon.id==='spectre'){rect(3,11,5,5,metal);rect(32,9,10,3,grip);rect(30,16,3,7,light);}
        if(weapon.id==='bulldog'){rect(10,14,9,6,grip);rect(32,8,12,2,accent);}
        if(weapon.id==='guardian'){rect(29,5,5,3,light);rect(31,16,5,5,grip);rect(42,10,9,2,bright);}
        if(weapon.id==='vandal'){rect(29,17,6,5,metal);rect(31,20,6,3,metal);rect(39,10,11,4,grip);}
        if(weapon.id==='odin'){rect(25,4,13,4,dark);rect(27,5,9,2,metal);rect(37,17,6,5,light);}
        if(weapon.id==='outlaw'){rect(45,9,17,2,bright);rect(45,13,17,2,bright);rect(26,15,5,6,grip);}
        if(weapon.id==='marshal'){rect(5,12,13,3,'#94724f');rect(34,12,13,3,'#94724f');}
        if(weapon.id==='bucky'){rect(5,12,11,3,'#94724f');rect(36,12,9,3,'#94724f');}
    }
    weaponArtCache.set(weapon.id,image);return image;
}
function weaponPortrait(weapon){return `<img src="${weaponImage(weapon).toDataURL()}" width="256" height="96" alt="${weapon.name}">`;}
const weaponGeometryCache=new Map();
function weaponGeometry(weapon){
    if(weaponGeometryCache.has(weapon.id))return weaponGeometryCache.get(weapon.id);
    const image=weaponImage(weapon),pixels=image.getContext('2d').getImageData(0,0,image.width,image.height).data;
    let maxX=0,minY=image.height,maxY=0;
    for(let x=image.width-1;x>=0;x--){
        let found=false;for(let y=0;y<image.height;y++)if(pixels[(y*image.width+x)*4+3]){found=true;minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
        if(found){maxX=x;break;}
    }
    const shape={radius:26,scale:.75,pivotX:18,pivotY:12,muzzleX:maxX+1,muzzleY:(minY+maxY+1)/2};
    weaponGeometryCache.set(weapon.id,shape);return shape;
}
function weaponMuzzle(weapon,origin,angle){
    const shape=weaponGeometry(weapon),flip=Math.cos(angle)<0?-1:1;
    const dx=shape.radius+(shape.muzzleX-shape.pivotX)*shape.scale,dy=(shape.muzzleY-shape.pivotY)*shape.scale*flip;
    return {x:origin.x+Math.cos(angle)*dx-Math.sin(angle)*dy,y:origin.y+Math.sin(angle)*dx+Math.cos(angle)*dy};
}
function drawEquippedWeapon(g,x,y,angle){
    const weapon=currentWeapon(),image=weaponImage(weapon),shape=weaponGeometry(weapon);
    g.save();g.translate(x+Math.cos(angle)*shape.radius,y+Math.sin(angle)*shape.radius);g.rotate(angle);
    // Flip across the barrel axis on the left, so the magazine stays below the gun.
    if(Math.cos(angle)<0)g.scale(1,-1);
    g.imageSmoothingEnabled=false;
    g.drawImage(image,-shape.pivotX*shape.scale,-shape.pivotY*shape.scale,image.width*shape.scale,image.height*shape.scale);
    g.restore();
}
