'use strict';
const pixelSprites = {
    tree: [
        '        oo        ', '      ooggoo      ', '     oggllggo     ', '    ogllhhlggo    ',
        '   oglllhllgggo   ', '  oggllggllggggo  ', ' oggllggllggggggo ', ' ogllgggggllggggo ',
        'oggllggllggggdgggo', 'oggllgggggggddgggo', ' ogggllggggdddggo ', '  oggggggddddggo  ',
        '   oddggddddddo   ', '    ooddddddoo    ', '      oottoo      ', '       ottto      ',
        '       ottto      ', '      ottttto     '
    ],
    rock: ['    oooooo    ', '  oollhhhloo  ', ' olllhhhllldo ', 'ollllllllldddo', 'olllldlllddddo', 'olldddlldddddo', ' oddddddddddo ', '  ommmmddmmo  '],
    hero: ['   oooooo   ', '  occccllo  ', ' occlllcllo ', 'occlllllccco', 'ocooeeeoooco', 'ocooeeeoooco', ' occcccccco ', '  oooooooo  ', '  obbbbbbo  ', '  obbllbbo  ', '  oobbbboo  ', '  oo    oo  '],
    enemy: ['   oooooo   ', '  occcccco  ', ' occcccccco ', 'occllccclcco', 'ocoeecceecoo', 'ocoeecceecoo', 'occcccccccco', ' occddddcco ', '  oddddddo  ', '  oooooooo  ', '  oo    oo  '],
    gem: ['   o   ', '  olo  ', ' olhlo ', 'olhhllo', ' olllo ', '  olo  ', '   o   '],
    heal: ['  ooooo  ', ' olllllo ', 'olllhlllo', 'ollhhhllo', 'olllhlllo', ' olllllo ', '  ooooo  '],
    bomb: ['    ll   ', '   ol    ', '  ooooo  ', ' occccco ', 'oclhhccco', 'occccccco', ' occccco ', '  ooooo  '],
    magnet: [' oo   oo ', 'oll   llo', 'oll   llo', 'oll   llo', 'oll   llo', ' olllllo ', '  olllo  ', '   ooo   ']
};
const spriteCache = new Map();
function spriteImage(name, color) {
    if (name.startsWith('agent:')) return agentSpriteImage(AGENTS.find(hero => hero.id === name.slice(6)) || AGENTS[0]);
    const key = name + color; if (spriteCache.has(key)) return spriteCache.get(key);
    const pattern = pixelSprites[name], w = Math.max(...pattern.map(r => r.length)), img = document.createElement('canvas'); img.width = w; img.height = pattern.length;
    const g = img.getContext('2d'), palette = { o: '#09131f', c: color || '#94d9db', l: '#86b6c4', h: '#f2eee5', g: '#344d59', d: '#243644', t: '#667076', b: '#354b60', e: '#f2eee5', m: '#52747a' };
    if (name === 'rock') Object.assign(palette, { l: '#6c8290', h: '#a2b7bd', d: '#394f60' });
    if (name === 'hero') Object.assign(palette, { c: '#edeae0', l: '#b8cbd2', h: '#ffffff', b: '#405b70', e: '#7be8e4', d: color || '#8ce0df' });
    if (name === 'enemy') Object.assign(palette, color === '#8bc6e8' ? { c: '#75c6df', l: '#b3efff', d: '#355d78', e: '#f2eee5' } : color === '#bf88d6' ? { c: '#ba7199', l: '#f5a1b8', d: '#65364e', e: '#ffe6d0' } : { c: '#df566a', l: '#ff8991', d: '#6e354d', e: '#ffe6d0' });
    if (name === 'gem') Object.assign(palette, { o: '#07324b', l: '#32d9ff', h: '#e0ffff' });
    if (name === 'heal') Object.assign(palette, { l: '#45a879', h: '#d3ffe4' });
    if (name === 'magnet') palette.l = '#82c6ed';
    if (name === 'speedUpgrade') Object.assign(palette, { o:'#09131f', c:'#f13d46', h:'#f7edde', m:'#9297a6', d:'#a62439' });
    if (name === 'critical') Object.assign(palette, { o:'#09131f', l:'#ff2538', h:'#ff9a9d', d:'#ed4e58' });
    if (name === 'mirror') Object.assign(palette, { o:'#09131f', l:'#969fc9', h:'#fff0df', d:'#536486' });
    if (name === 'damage') Object.assign(palette, { o:'#09131f', c:'#ffc638', h:'#fff0d6', l:'#aa5d1d', d:'#d78a20', g:'#fa8a42', t:'#b74c29' });
    if (name === 'magazine') Object.assign(palette, { o:'#09131f', c:'#4f596b', l:'#7c8392', h:'#c5c4cd', d:'#293447', g:'#ffcf5a', t:'#e88e2b' });
    if (name === 'rapid') Object.assign(palette, { o:'#09131f', c:'#ffcf29', h:'#fff0d4', d:'#f59b19' });
    if (name === 'heart') Object.assign(palette, { o:'#09131f', c:'#f1444c', h:'#fff0e1', d:'#a92539' });
    if (name === 'cooldown') Object.assign(palette, { o:'#09131f', h:'#f6eddd', l:'#858d9e', m:'#b4b1ba' });
    if (name === 'reload') Object.assign(palette, { o:'#09131f', h:'#f5eee0', l:'#9699a9' });
    if (name === 'magnetUpgrade') Object.assign(palette, { o:'#08131d', h:'#eeeee5', m:'#74818a', c:'#fa373f', l:'#e92f39', d:'#a32031', b:'#701d2b' });
    if (name === 'bomb') Object.assign(palette, { c: '#686373', l: '#ffb663', h: '#a5a0aa' });
    for (let y = 0; y < pattern.length; y++)for (let x = 0; x < pattern[y].length; x++) { const c = palette[pattern[y][x]]; if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }
    spriteCache.set(key, img); return img;
}
function drawSprite(g, name, x, y, scale = 2, color) { const img = spriteImage(name, color), unit = name.startsWith('agent:') ? scale / 2 : scale; g.imageSmoothingEnabled = false; g.drawImage(img, Math.round(x - img.width * unit / 2), Math.round(y - img.height * unit / 2), img.width * unit, img.height * unit); }
function drawPixelGun(g, x, y, angle) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(angle);
    g.fillStyle = '#09131f'; g.fillRect(-2, -5, 30, 10); g.fillStyle = '#658699'; g.fillRect(0, -3, 24, 6); g.fillStyle = '#edf0e9'; g.fillRect(2, -3, 16, 2); g.fillStyle = '#8ce0df'; g.fillRect(22, -3, 4, 6); g.restore();
}

const portraitCache = new Map();
function heroPortrait(hero, large = false) {
    if (!portraitCache.has(hero.id)) portraitCache.set(hero.id, agentSpriteImage(hero).toDataURL());
    return `<span class="pixel-portrait ${large ? 'large' : ''}"><img style="filter:${masteryFilter(hero.id)}" src="${portraitCache.get(hero.id)}" alt="${hero.name}" width="72" height="72"></span>`;
}

// Iconos propios de las seis mejoras, dibujados en una cuadrícula de píxeles.
Object.assign(pixelSprites, {
    magnetUpgrade: [
        '  oooo      oooo  ',
        ' ohhhho    ohhhho ',
        'ohhhhho    ohhhhho',
        'ommmmmo    ommmmmo',
        'ommmmmo    ommmmmo',
        'occcclo    olcccco',
        'occcclo    olcccco',
        'occcclo    olcccco',
        'occcclo    olcccco',
        'occcclo    olcccco',
        'occccdo    odcccco',
        'odcccdoooooodcccdo',
        'odccccloolccccccdo',
        ' odccccllccccccdo ',
        '  odccccccccccdo  ',
        '   oddllllllddo   ',
        '    obbbbbbbo     ',
        '     ooooooo      '
    ],
    damage: [
        '                                  ',
        '                                  ',
        '                                  ',
        '                                  ',
        '                                  ',
        '                                  ',
        '                                  ',
        '                     ooooo        ',
        '                  oooogggoo       ',
        '                 ooggghhggo       ',
        '                ooggghhgggo       ',
        '               ooggghhgggto       ',
        '              ooddggggggtoo       ',
        '             ooccddggggtto        ',
        '            oocchcddggttto        ',
        '           oocchhhclltttoo        ',
        '          oocchhhccclltoo         ',
        '         oocchhhcccddloo          ',
        '        oocchhhcccdddoo           ',
        '       oocchhhcccdddoo            ',
        '     ooocchhhcccdddoo             ',
        '     occchhhcccdddoo              ',
        '     occcchcccdddoo               ',
        '     ooccccccdddoo                ',
        '      ooccccdddoo                 ',
        '       oocldddoo                  ',
        '        oolldoo                   ',
        '         oollo                    ',
        '          oooo                    ',
        '                                  ',
        '                                  ',
        '                                  ',
        '                                  ',
        '                                  '
    ],
    rapid: [
        '         ooooooooooo  ',
        '         ohhhhhcccdo  ',
        '        oohcccccccdo  ',
        '        ohcccccccdoo  ',
        '       oohccccccdoo   ',
        '       ohcccccccdo    ',
        '      oohccccccdoo    ',
        '      ohccccccdoo     ',
        '     oohcccccdoo      ',
        '    oohcccccdoo       ',
        '    occccccdooooooooo ',
        '   ooccccccccccccccdo ',
        '   occcccccccccccccdo ',
        '  ooccccccccccccccdoo ',
        '  oddddddccccccccdoo  ',
        '  ooooooocccccccdoo   ',
        '       ooccccccdoo    ',
        '       occccccdoo     ',
        '       occcccdoo      ',
        '      ooccccdoo       ',
        '      occccdoo        ',
        '     oocccdoo         ',
        '     occcdoo          ',
        '    ooccdoo           ',
        '    occdoo            ',
        '   oocdoo             ',
        '   oddoo              ',
        '   oooo               '
    ],
    boots: ['   oooo     ', '   ollo     ', '   ollo     ', '   ollo     ', ' ooollo     ', 'ollhhlo     ', 'ollhhloooo  ', 'olllllllhlo ', 'olllllllllo ', ' oddddddddo ', ' oooooooooo '],
    speedUpgrade: [
        '            ooo             ',
        '           ohho oooo        ',
        '          ochhooohhho       ',
        '         occchhmmmmmo       ',
        '    hhh  occcchhoooo        ',
        '        occcccoohhho        ',
        '        oddcccooooo         ',
        '  hhhh oodddccochhho        ',
        '       ohhdddoocchhoo       ',
        '       ohhhhooocccooo       ',
        'hhhhh  ommhho oocchhhoo     ',
        '        ommhho occchhooo    ',
        '         ommhho occcccccoo  ',
        '          ommhho oddcccccco ',
        '    hhhh   ommhho odddddddo ',
        '            ommhhoohhhhhho  ',
        '             ommmhhhhhhmo   ',
        '              ommmmmmmo    ',
        '               ooooooo     '
    ],
    heart: [
        '                       ',
        '   ooooooo ooooooo     ',
        '  oocccddooocccddoo    ',
        '  occcccdcocccccddo    ',
        ' oocchhhdcocccccddoo   ',
        ' occchhhcccccccccddo   ',
        ' occhhcccccccccccddo   ',
        ' occhhcccccccccccddo   ',
        ' odccccccccccccccddo   ',
        ' oddcccccccccccccddo   ',
        ' ooddcccccccccccddoo   ',
        '  ooddcccccccccddoo    ',
        '   ooddcccccccddoo     ',
        '    ooddcccccddoo      ',
        '     ooddcccddoo       ',
        '      ooddcddoo        ',
        '       oodddoo         ',
        '        oodoo          ',
        '         ooo           ',
        '                       '
    ],
    spread: ['  oo    oo  ', ' ohho  ohho ', ' ohlo  ohlo ', '  oo    oo  ', '     oo     ', '    ohho    ', '    ohlo    ', '     oo     ', '    ollo    ', '   ollllo   ', '   oooooo   '],
    recovery: ['    oooo    ', '    ohho    ', '    ohlo    ', ' oooohloooo ', 'ohhhhhhhhllo', 'ohlllllllldo', ' oooohloooo ', '    ohlo    ', '    oddo    ', '    oooo    ', '            ']
});
// Iconos de interfaz: recorte de margen transparente y encuadre común.
// Los sprites de combate conservan sus dimensiones originales.
const uiIconCache=new Map();
function uiIconImage(name){
    if(uiIconCache.has(name))return uiIconCache.get(name);
    const source=spriteImage(name),pixels=source.getContext('2d').getImageData(0,0,source.width,source.height).data;
    let left=source.width,top=source.height,right=-1,bottom=-1;
    for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(pixels[(y*source.width+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    const img=document.createElement('canvas');img.width=32;img.height=32;const g=img.getContext('2d');g.imageSmoothingEnabled=false;
    if(right>=left){const w=right-left+1,h=bottom-top+1,scale=28/Math.max(w,h),dw=Math.round(w*scale),dh=Math.round(h*scale);g.drawImage(source,left,top,w,h,Math.floor((32-dw)/2),Math.floor((32-dh)/2),dw,dh);}
    uiIconCache.set(name,img);return img;
}
// Assets originales de las mejoras. Se muestran directamente, sin redibujarlos
// ni reducirlos a la cuadrícula de 32 px de los artefactos.
const upgradeAssets=Object.freeze({
    '✦':'assets/mejoras/Bala dorada pixel art.png',
    'ϟ':'assets/mejoras/Rayo pixelado amarillo sobre fondo azul oscuro.png',
    '➚':'assets/mejoras/Zapatilla pixel art en movimiento.png',
    '♥':'assets/mejoras/Corazón rojo pixelado con brillo (1).png',
    '⋔':'assets/mejoras/Tres balas doradas en arco pixelado.png',
    '✚':'assets/mejoras/Cruz médica pixelada roja.png',
    '∩':'assets/mejoras/Imán de herradura pixelado con chispas.png',
    '◎':'assets/mejoras/Mira de píxeles cian brillante.png',
    '✧':'assets/mejoras/Mira de objetivo pixelada roja.png',
    '▣':'assets/mejoras/Escudo medieval azul en píxeles.png',
    '▤':'assets/mejoras/Cargador de arma pixel art.png',
    '↻':'assets/mejoras/Icono pixelado de recarga circular retro.png',
    '◷':'assets/mejoras/Icono de reloj pixelado clásico.png',
    '◇':'assets/Kingdom_Credits.webp'
});
function upgradeIcon(upgrade) {
    const src=encodeURI(upgradeAssets[upgrade.icon]);
    return `<img class="upgrade-asset" src="${src}" width="72" height="72" decoding="async" loading="lazy" alt="">`;
}

Object.assign(pixelSprites, {
    credits: ['    ooo     ','   ohhlo    ','  ohhlllo   ',' ohllohllo  ','ohllooohllo ',' olllohllo  ','  ollhllo   ','   ollo     ','    oo      '],
    cooldown: [
        '',
        '        ooooooooo',
        '      oooohhhhhoooo',
        '     ooohhhhhhhhhooo',
        '    oohhhooooooohhhoo',
        '   oohhoohhoohhhoohhoo',
        '  oohhoohhhoohhhhoohhoo',
        '  oohoohhhhhhhhhhooohoo',
        ' oohhohohhhhhhhhohhohhoo',
        ' oohohhhohhhhhhohhhhohoo',
        ' ohhohhhhohhhhohhhhhohho',
        ' ohhooohhhoooohhhhooohho',
        ' ohhooohhhhomohhhhooohho',
        ' ollohhhhhhooohhhhhhollo',
        ' ollohhhhhhhhhhhhhhhollo',
        ' oolohhhhhhhhhhhhhhholoo',
        ' oollohhhhhhhhhhhhholloo',
        '  ooloohhhhhhhhhhhooloo',
        '  oolloohhhoohhhhoolloo',
        '   oolloohhoohhhoolloo',
        '    oolllooooooollloo',
        '     ooolllllllllooo',
        '      oooollllloooo',
        '        ooooooooo',
        ''
    ],
    magazine: [
        '                           ',
        '                           ',
        '                  ooooooo  ',
        '                ooogggggo  ',
        '              ooogggggtto  ',
        '            oooggggggttoo  ',
        '          oooggggggggtto   ',
        '          oggtttttttttoo   ',
        '        ooooooooooooooooo  ',
        '        ohhhhhhhhhhhhhhho  ',
        '        ohhoooooooolllllo  ',
        '        ohhoooooooolllllo  ',
        '        ohlccccccccccccco  ',
        '        ohlccccccccccccco  ',
        '       oohlcccddcccddccco  ',
        '       ohlcccddcccddcccoo  ',
        '       ohlcccddcccddccco   ',
        '       ohlcccddcccddccco   ',
        '      oohlcccddcccddccco   ',
        '      ohlcccddcccddcccoo   ',
        '      ohlcccddcccddccco    ',
        '      ohlcccddcccddccco    ',
        '     oohlcccddcccddccco    ',
        '     ohlcccddcccddcccoo    ',
        '     ohlcccddcccddccco     ',
        '     ohlcccddcccddccco     ',
        '    oohlcccddcccddccco     ',
        '    ohlcccddcccddcccoo     ',
        '    ohlccccccccccccoo      ',
        '    ohhhhhhhhhhhhhho       ',
        '   oocccccccccccccco       ',
        '   occccccccccccccoo       ',
        '   oooooooooooooooo        ',
        '                           '
    ],
    reload: [
        '',
        '                     ooo',
        '           ooo      ooho',
        '       ooooohooooo oohho',
        '     ooohhhhhhhhhooohhho',
        '    oolhhhhhhhhhhhhhhhho',
        '   oollhhhhhhhhhhhhhhhho',
        '   ohllhhooooooohhhhhhho',
        '  oohllhoo     ohhhhhhho',
        '  ohhlloo      olllllllo',
        '  ohhloo       ooooooooo',
        '  ohhlo',
        ' oohhlo',
        ' ohhhlo',
        ' oolhlo',
        '  olhlo           ooooo',
        '  olhloo         oohhlo',
        '  olllloo       oohhllo',
        '  oolllhoo     oohhhloo',
        '   olllhhooooooohhhllo',
        '   oollhhhhhhhhhhhlloo',
        '    oolllhhhhhhhllloo',
        '     ooolllllllllooo',
        '       ooooolooooo',
        '           ooo',
        ''
    ],
    range: ['    o           o    ','   olo         olo   ','  ohlo         olho  ',' ohl o    o    o lho ','ohhlooooooh oooo lhh o',' ohhhhhhhhhlhhhhhhho ','ohhlooooooh oooo lhh o',' ohl o    o    o lho ','  ohlo         olho  ','   olo         olo   ','    o           o    '],
    target: ['   ooooo    ', ' oollhlloo  ', 'olhooooohlo ', 'ollo   ollo ', 'ohlo o olho ', 'ollo   ollo ', 'olhooooohlo ', ' oollhlloo  ', '   ooooo    '],
    critical: [
        '                                   ',
        '               ooooo               ',
        '               ohllo               ',
        '               ohllo               ',
        '           ooooohllooooo           ',
        '         ooodddhhllllllooo         ',
        '        oohdddhhhlllllllloo        ',
        '       oohdddooohllooolllloo       ',
        '      oohdddoo ohllo oolllloo      ',
        '     oohddooo  ohllo  ooollloo     ',
        '     ohddoo    ooooo    oolllo     ',
        '    oodddo               ollloo    ',
        '    odddoo               oolllo    ',
        '    oddoo      ooooo      oollo    ',
        '    odho       olllo       ollo    ',
        ' oooohhoooo  ooolllooo  oooolloooo ',
        ' ohhhhhhhho  olllllllo  ollllllllo ',
        ' ollllllllo  olllllllo  ollllllllo ',
        ' ollllllllo  olllllllo  ollllllllo ',
        ' oooolloooo  ooolllooo  oooolloooo ',
        '    ollo       olllo       ollo    ',
        '    olloo      ooooo      oollo    ',
        '    ollloo               oolllo    ',
        '    oolllo               ollloo    ',
        '     ollloo    ooooo    oolllo     ',
        '     oolllooo  olllo  ooollloo     ',
        '      oolllloo olllo oolllloo      ',
        '       oollllooodllooolllloo       ',
        '        oolllllldlllllllloo        ',
        '         ooolllldllllllooo         ',
        '           ooooodllooooo           ',
        '               odllo               ',
        '               odllo               ',
        '               ooooo               ',
        '                                   '
    ],
    shield: [' oooooooo   ', 'olhhhhhhlo  ', 'ollhlllllo  ', 'ollhlllllo  ', 'ollllldddo  ', ' ollllddo   ', '  ollldo    ', '   oddo     ', '    oo      ']
});

// Insignias originales de los artefactos, reutilizando el renderizador de sprites.
Object.assign(pixelSprites, {
    piercing: ['     oo     ', '    ohho    ', '   ohhhho   ', '  ohhhhllo  ', '    ollo    ', '    ollo    ', ' oo ollo oo ', ' olhllllhlo ', '  olllllo   ', '    ollo    ', '     oo     '],
    frost: [' ol  oo  lo ', '  oloholo  ', '   olllo   ', 'oooohhhoooo', 'olllhhhlllo', 'oooohhhoooo', '   olllo   ', '  oloholo  ', ' ol  oo  lo '],
    mirror: ['     oo     ', '    ohlo    ', '   ohlllo   ', '  ohlllllo  ', ' ohllohlllo ', 'ohllooohlllo', ' olllohlllo ', '  olllllo   ', '   olllo    ', '    olo     ', '     o      ']
});
function artifactIcon(artifact) {
    const name = { homing: 'target', piercing: 'piercing', frost: 'frost', bounce: 'mirror' }[artifact.id];
    return `<img src="${uiIconImage(name).toDataURL()}" width="64" height="64" alt="">`;
}


// Agentes chibi de 24 × 24. Más detalle en la cabeza y un cuerpo compacto.
// drawSprite conserva su huella visual de 24 × 24 px en la arena.
const agentArtStyles = {
    astra: { hair: '#272433', accent: '#dba84b', coat: '#7850a3', trim: '#cb8bb4', style: 'astra' },
    breach: { hair: '#aa582f', accent: '#d79652', coat: '#47715b', trim: '#d5b16a', style: 'breach' },
    brimstone: { hair: '#282c32', accent: '#ec7435', coat: '#52697a', trim: '#8ba3ae', style: 'brimstone' },
    chamber: { hair: '#5b3b2f', accent: '#d8bb70', coat: '#8c3945', trim: '#ece5d3', style: 'chamber' },
    clove: { hair: '#4a305b', accent: '#b67bc4', coat: '#cf80a8', trim: '#e9abbd', style: 'clove' },
    cypher: { hair: '#ddd4b4', accent: '#72e4f2', coat: '#c6b894', trim: '#f0e9d3', style: 'cypher' },
    deadlock: { hair: '#dfc889', accent: '#9aa79c', coat: '#9ba99b', trim: '#dce0c8', style: 'deadlock' },
    fade: { hair: '#283445', accent: '#bcc4d0', coat: '#42526c', trim: '#9caabc', style: 'fade' },
    gekko: { hair: '#b0cc47', accent: '#d2eb73', coat: '#89529c', trim: '#b2c16b', style: 'gekko' },
    harbor: { hair: '#252f33', accent: '#cbab65', coat: '#2e7277', trim: '#92b3a6', style: 'harbor' },
    iso: { hair: '#242735', accent: '#aa91cf', coat: '#f0e9e0', trim: '#6c4c9a', style: 'iso' },
    jett: { hair: '#d6e4e5', accent: '#f2f4e8', coat: '#438e9c', trim: '#84d0ce', style: 'jett' },
    kayo: { hair: '#4a5384', accent: '#6be4ef', coat: '#505d9d', trim: '#d0dce5', style: 'kayo' },
    killjoy: { hair: '#292c2d', accent: '#3d9562', coat: '#e0b343', trim: '#f4d16d', style: 'killjoy' },
    neon: { hair: '#2353a0', accent: '#4c8bdd', coat: '#346bc1', trim: '#e8ca58', style: 'neon' },
    omen: { hair: '#514584', accent: '#8a73b5', coat: '#4c477f', trim: '#9187bd', style: 'omen' },
    phoenix: { hair: '#292831', accent: '#f08a3c', coat: '#f0e3d4', trim: '#e47837', style: 'phoenix' },
    raze: { hair: '#553d2b', accent: '#eea849', coat: '#cc8338', trim: '#73a795', style: 'raze' },
    reyna: { hair: '#36253f', accent: '#8b4d98', coat: '#65407e', trim: '#af72bd', style: 'reyna' },
    sage: { hair: '#202c33', accent: '#afded1', coat: '#83c8bb', trim: '#f1eee2', style: 'sage' },
    skye: { hair: '#be6237', accent: '#4b864d', coat: '#507453', trim: '#98ac72', style: 'skye' },
    sova: { hair: '#d9c58e', accent: '#97c9df', coat: '#416b9a', trim: '#b9d9df', style: 'sova' },
    viper: { hair: '#202f34', accent: '#3d8359', coat: '#316a4d', trim: '#78b77a', style: 'viper' },
    yoru: { hair: '#244477', accent: '#477ed1', coat: '#3156a0', trim: '#bc5263', style: 'yoru' },
    waylay: { hair: '#d9d6ad', accent: '#89c7bc', coat: '#8ba568', trim: '#e7cc6d', style: 'waylay' },
    tejo: { hair: '#3c3533', accent: '#d4a158', coat: '#657b77', trim: '#e2b461', style: 'tejo' },
    vyse: { hair: '#4c4169', accent: '#bab9d7', coat: '#52546e', trim: '#dde2e5', style: 'vyse' },
    veto: { hair: '#25322c', accent: '#aec791', coat: '#5e7965', trim: '#c6d1a0', style: 'veto' },
    miks: { hair: '#65505b', accent: '#ef9a6c', coat: '#bc7357', trim: '#d3c2a2', style: 'miks' },
    hush: { hair: '#354650', accent: '#b8e7e7', coat: '#9baebd', trim: '#dae9e7', style: 'hush' }
};
function spriteTone(hex, amount) {
    const n = parseInt(hex.slice(1), 16), channel = shift => Math.max(0, Math.min(255, ((n >> shift) & 255) + amount));
    return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}
function agentSpriteImage(hero) {
    const key = `agent:${hero.id}`; if (spriteCache.has(key)) return spriteCache.get(key);
    const art = agentArtStyles[hero.id] || { hair: hero.hair, accent: hero.color, coat: hero.jacket, trim: '#e4e6d8', style: 'plain' };
    const image = document.createElement('canvas'); image.width = 24; image.height = 24; const g = image.getContext('2d'); g.imageSmoothingEnabled = false;
    const outline = '#09141f', skin = hero.skin, skinShade = spriteTone(skin, -23), skinLight = spriteTone(skin, 17), hair = art.hair, hairShade = spriteTone(hair, -16), hairLight = spriteTone(hair, 21), coat = art.coat, coatShade = spriteTone(coat, -24), coatLight = spriteTone(coat, 18);
    const rect = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
    const shape = (points, color) => {
        g.fillStyle = color;
        // Fill whole pixels, including diagonal silhouettes: alpha remains 0 or 255.
        for (let py = 0; py < 24; py++)for (let px = 0; px < 24; px++) {
            const x = px + .5, y = py + .5; let inside = false;
            for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                const [ax, ay] = points[i], [bx, by] = points[j];
                if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
            }
            if (inside) g.fillRect(px, py, 1, 1);
        }
    };
    const borderBox = (x, y, w, h, color) => { rect(x, y, w, h, outline); rect(x + 1, y + 1, w - 2, h - 2, color); };
    // Back hair and accessories sit behind the face and shoulders.
    shape([[6, 1], [17, 1], [17, 2], [20, 2], [20, 4], [21, 4], [21, 12], [20, 12], [20, 16], [4, 16], [4, 13], [3, 13], [3, 5], [4, 5], [4, 3], [6, 3]], outline);
    rect(5, 4, 14, 12, hairShade);
    if (['reyna', 'fade', 'sage', 'hush', 'neon'].includes(art.style)) { rect(3, 10, 3, 11, outline); rect(18, 10, 3, 11, outline); rect(4, 11, 2, 8, hairShade); rect(18, 11, 2, 9, hair); }
    // Legs, small body, sleeves and warm skin highlights.
    rect(7, 21, 4, 3, outline); rect(13, 21, 4, 3, outline); rect(8, 21, 2, 2, coatShade); rect(14, 21, 2, 2, coatShade);
    rect(5, 16, 14, 7, outline); rect(6, 17, 12, 5, coat); rect(6, 20, 12, 2, coatShade); rect(7, 17, 4, 1, coatLight);
    rect(3, 17, 3, 5, outline); rect(18, 17, 3, 5, outline); rect(4, 18, 2, 3, skin); rect(18, 18, 2, 3, skin); rect(4, 18, 1, 1, skinLight); rect(19, 20, 1, 1, skinShade);
    rect(4, 17, 2, 2, coat); rect(18, 17, 2, 2, coat); rect(8, 17, 8, 2, art.trim); rect(10, 17, 4, 1, skinShade); rect(11, 19, 2, 3, coatShade);
    // Large squared head, stepped jaw, single-pixel highlight and dark square eyes.
    rect(4, 6, 16, 9, outline); rect(5, 7, 14, 8, skinShade); rect(6, 6, 12, 9, skin); rect(7, 6, 10, 2, skinLight); rect(6, 15, 12, 1, outline); rect(7, 14, 10, 1, skinShade);
    rect(4, 9, 1, 3, skinShade); rect(19, 9, 1, 3, skinShade); rect(7, 9, 2, 3, outline); rect(15, 9, 2, 3, outline); rect(10, 13, 3, 1, skinShade);
    // Base hair cap and uneven fringe: no smooth curves or anti-aliased outlines.
    shape([[6, 2], [16, 2], [16, 3], [19, 3], [19, 5], [20, 5], [20, 8], [17, 8], [17, 6], [14, 6], [14, 7], [11, 7], [11, 6], [8, 6], [8, 7], [5, 7], [5, 9], [4, 9], [4, 5], [6, 5]], hair);
    rect(7, 3, 8, 1, hairLight); rect(5, 5, 3, 1, hairLight); rect(17, 4, 2, 3, hairShade);
    switch (art.style) {
        case 'astra':
            rect(4, 1, 4, 2, hair); rect(8, 0, 5, 2, hairShade); rect(3, 5, 2, 9, hair); rect(2, 7, 5, 1, art.accent); rect(4, 5, 1, 5, art.accent); rect(6, 3, 3, 1, '#e3c07b'); rect(7, 2, 1, 3, '#e3c07b');
            rect(6, 18, 2, 3, art.accent); rect(9, 19, 5, 2, art.trim); rect(14, 17, 2, 5, '#a783c5'); break;
        case 'breach':
            rect(5, 3, 14, 3, hair); rect(5, 11, 2, 4, hairShade); rect(17, 11, 2, 4, hairShade); rect(7, 13, 10, 3, hair); rect(9, 13, 6, 1, hairLight); rect(11, 14, 2, 1, skinShade);
            borderBox(2, 17, 5, 4, '#9aab9a'); borderBox(17, 17, 5, 4, '#9aab9a'); rect(3, 18, 2, 1, '#e6c390'); rect(18, 18, 2, 1, '#e6c390'); rect(8, 19, 8, 1, '#ce864d'); break;
        case 'brimstone':
            shape([[4, 2], [19, 2], [19, 5], [18, 5], [18, 7], [5, 7], [5, 6], [3, 6], [3, 4], [4, 4]], outline); rect(5, 3, 13, 3, art.accent); rect(5, 3, 13, 1, '#f29449'); rect(4, 5, 3, 2, art.accent); rect(17, 4, 1, 1, '#f2d66d');
            rect(6, 12, 3, 3, hair); rect(15, 12, 3, 3, hair); rect(9, 13, 6, 3, hair); rect(10, 13, 4, 1, '#9d8d7c'); rect(7, 17, 3, 3, '#a7a998'); rect(14, 17, 3, 3, '#768d96'); break;
        case 'chamber':
            borderBox(5, 8, 6, 5, '#cfb172'); borderBox(13, 8, 6, 5, '#cfb172'); rect(6, 9, 4, 2, skin); rect(14, 9, 4, 2, skin); rect(11, 9, 2, 1, '#d2b66c'); rect(7, 9, 1, 2, outline); rect(15, 9, 1, 2, outline);
            rect(8, 17, 3, 5, art.trim); rect(13, 17, 3, 5, art.trim); rect(11, 17, 2, 5, '#ae7858'); rect(5, 7, 2, 1, hairShade); break;
        case 'clove':
            rect(3, 5, 3, 8, hair); rect(5, 4, 3, 3, '#9d66b6'); rect(8, 4, 4, 2, '#9364ad'); rect(12, 5, 5, 2, '#ba85ca'); rect(18, 8, 3, 6, '#9863b5'); rect(19, 12, 2, 2, '#e1a4d6');
            rect(6, 17, 3, 4, art.trim); rect(15, 17, 3, 4, art.trim); rect(10, 18, 4, 4, '#253441'); break;
        case 'cypher':
            // Broad ivory hat, dark mask and cyan optics.
            rect(6, 0, 11, 1, outline); rect(5, 1, 13, 4, outline); rect(6, 1, 11, 4, '#f0eee1'); rect(7, 1, 9, 1, '#ffffff'); rect(3, 5, 18, 2, outline); rect(2, 6, 20, 2, '#ece7d2'); rect(1, 7, 22, 1, outline); rect(6, 4, 12, 1, '#3b4550');
            rect(5, 8, 14, 7, '#142733'); rect(7, 9, 2, 3, '#75d9ec'); rect(15, 9, 2, 3, '#75d9ec'); rect(7, 9, 1, 1, '#d5ffff'); rect(15, 9, 1, 1, '#d5ffff'); rect(6, 16, 12, 2, art.trim); rect(7, 19, 3, 3, art.trim); rect(14, 19, 3, 3, art.trim); break;
        case 'deadlock':
            shape([[5, 3], [17, 2], [19, 4], [20, 7], [19, 14], [17, 14], [17, 6], [13, 5], [11, 7], [8, 6], [6, 12], [4, 12], [4, 5]], hair); rect(7, 3, 8, 1, '#f3dda4'); rect(4, 6, 2, 8, hairLight); rect(18, 7, 2, 8, hairShade);
            rect(7, 17, 3, 5, '#dce0c8'); rect(15, 17, 3, 4, '#dce0c8'); rect(11, 19, 3, 3, '#35474b'); break;
        case 'fade':
            rect(3, 5, 3, 11, hair); rect(18, 5, 3, 11, hair); shape([[5, 3], [11, 2], [11, 4], [9, 4], [9, 8], [7, 8], [7, 11], [5, 11]], art.accent); rect(4, 9, 2, 7, '#9ba9b7'); rect(17, 7, 2, 9, '#8192a6');
            rect(6, 17, 3, 4, '#b4c0ca'); rect(15, 17, 3, 4, '#8fa0b6'); rect(10, 18, 4, 3, '#263244'); rect(7, 9, 1, 1, '#8fd6dc'); break;
        case 'gekko':
            rect(5, 4, 14, 3, hair); rect(5, 4, 3, 1, art.accent); rect(8, 3, 8, 1, art.accent); rect(18, 5, 1, 4, hairShade); rect(5, 7, 1, 3, hairShade);
            rect(7, 17, 3, 5, '#bcca6e'); rect(14, 17, 3, 5, '#bcca6e'); rect(10, 18, 4, 2, '#e0bb8a'); rect(4, 19, 1, 2, '#74458b'); rect(19, 19, 1, 2, '#74458b'); break;
        case 'harbor':
            rect(4, 5, 3, 3, hair); rect(5, 11, 3, 4, hair); rect(16, 11, 3, 4, hair); rect(8, 13, 8, 3, hair); rect(9, 13, 6, 1, '#5c4b3b');
            rect(6, 17, 4, 2, art.accent); rect(10, 19, 4, 3, '#c2af7a'); rect(14, 17, 3, 3, '#9ec4b1'); rect(4, 19, 2, 2, '#b79a53'); break;
        case 'iso':
            rect(3, 5, 3, 5, hair); rect(17, 5, 3, 4, hair); shape([[8, 3], [16, 3], [19, 6], [16, 6], [15, 8], [13, 6], [11, 8], [10, 6], [8, 7]], hairShade);
            rect(6, 17, 3, 4, '#f4f0e9'); rect(15, 17, 3, 4, '#f4f0e9'); rect(10, 17, 4, 5, '#7251a3'); rect(11, 18, 2, 1, '#b59ad5'); break;
        case 'jett':
            borderBox(17, 0, 5, 5, hair); rect(20, 4, 3, 3, outline); rect(20, 4, 2, 2, hairLight); rect(17, 4, 3, 2, '#3a5967'); rect(7, 3, 9, 1, '#ffffff'); rect(5, 7, 2, 3, hairLight); rect(17, 6, 2, 3, hairShade);
            rect(7, 17, 10, 2, art.trim); rect(10, 19, 6, 2, '#325b6e'); rect(8, 19, 2, 2, '#9bddd7'); break;
        case 'kayo':
            shape([[5, 2], [18, 2], [20, 4], [20, 14], [18, 16], [5, 16], [3, 14], [3, 4]], outline); rect(5, 3, 13, 12, '#465288'); rect(6, 4, 11, 9, '#343867'); rect(4, 5, 1, 7, '#8395b7'); rect(18, 5, 1, 7, '#8297bd');
            shape([[7, 6], [17, 6], [17, 8], [15, 8], [15, 10], [13, 10], [13, 12], [11, 12], [11, 10], [9, 10], [9, 8], [7, 8]], art.accent); rect(9, 7, 6, 1, '#c3fcff'); rect(11, 8, 2, 2, '#343867'); rect(10, 17, 4, 4, '#92a9da'); rect(4, 18, 2, 3, '#d6e0e7'); rect(18, 18, 2, 3, '#d6e0e7'); break;
        case 'killjoy':
            rect(5, 1, 13, 5, outline); rect(6, 2, 11, 4, art.accent); rect(8, 1, 7, 1, '#4daf72'); rect(4, 6, 16, 2, '#34764d'); rect(4, 7, 16, 1, '#81b77a');
            borderBox(5, 8, 6, 5, '#cbbf89'); borderBox(13, 8, 6, 5, '#cbbf89'); rect(6, 9, 4, 3, skin); rect(14, 9, 4, 3, skin); rect(7, 9, 1, 2, outline); rect(15, 9, 1, 2, outline); rect(11, 9, 2, 1, '#cbbf89');
            rect(4, 17, 3, 3, '#f0c65b'); rect(17, 17, 3, 3, '#f0c65b'); rect(9, 17, 6, 2, '#33563c'); rect(11, 19, 2, 3, '#3b7350'); break;
        case 'neon':
            borderBox(0, 2, 5, 5, '#2458b0'); borderBox(19, 2, 5, 5, '#2458b0'); rect(2, 3, 2, 1, '#5795e7'); rect(20, 3, 2, 1, '#5795e7'); rect(3, 6, 2, 9, hair); rect(19, 6, 2, 9, hair); rect(3, 7, 2, 2, '#e6c658'); rect(19, 7, 2, 2, '#e6c658');
            rect(4, 17, 2, 2, '#e6c658'); rect(18, 17, 2, 2, '#e6c658'); rect(10, 17, 4, 2, '#91d5da'); rect(8, 21, 2, 1, art.trim); rect(14, 21, 2, 1, art.trim); break;
        case 'omen':
            shape([[9, 1], [15, 1], [15, 2], [18, 2], [18, 4], [20, 4], [20, 7], [22, 7], [22, 14], [20, 14], [20, 16], [4, 16], [4, 14], [2, 14], [2, 7], [4, 7], [4, 4], [6, 4], [6, 2], [9, 2]], outline);
            shape([[9, 2], [15, 2], [15, 3], [18, 3], [18, 5], [20, 5], [20, 8], [21, 8], [21, 13], [19, 13], [19, 15], [5, 15], [5, 13], [3, 13], [3, 8], [5, 8], [5, 5], [7, 5], [7, 3], [9, 3]], hair);
            shape([[8, 6], [16, 6], [16, 7], [18, 7], [18, 14], [6, 14], [6, 8], [8, 8]], '#0c1824'); rect(8, 9, 3, 1, '#8cebf3'); rect(9, 10, 2, 2, '#58becf'); rect(13, 9, 3, 1, '#8cebf3'); rect(13, 10, 2, 2, '#58becf'); rect(5, 16, 4, 3, art.trim); rect(15, 16, 4, 3, art.trim); break;
        case 'phoenix':
            rect(3, 4, 4, 3, hair); rect(5, 1, 4, 2, hair); rect(10, 0, 5, 2, hair); rect(16, 2, 3, 2, hair); rect(17, 5, 2, 1, '#a97039'); rect(18, 3, 2, 3, art.accent); rect(17, 4, 4, 1, '#ffc360');
            rect(6, 17, 3, 4, '#fff1db'); rect(15, 17, 3, 4, '#fff1db'); rect(9, 17, 6, 2, '#e2843c'); rect(10, 19, 4, 2, '#322c2b'); rect(4, 19, 2, 1, '#e2843c'); break;
        case 'raze':
            rect(4, 3, 16, 4, outline); rect(5, 3, 14, 4, art.accent); rect(7, 2, 10, 2, '#edb653'); rect(10, 4, 5, 2, '#1e2c32'); rect(9, 6, 7, 1, '#d37532');
            borderBox(2, 7, 3, 7, '#e5a14c'); borderBox(19, 7, 3, 7, '#e5a14c'); rect(3, 8, 1, 4, '#edd098'); rect(20, 8, 1, 4, '#edd098'); rect(8, 18, 8, 1, '#486660'); rect(9, 19, 2, 3, '#8bb0a1'); rect(14, 19, 2, 3, '#8bb0a1'); break;
        case 'reyna':
            rect(3, 5, 3, 14, hair); rect(18, 5, 3, 15, hair); rect(4, 11, 2, 7, '#804393'); rect(18, 10, 2, 9, '#804393'); rect(15, 4, 3, 2, '#b26a9b'); rect(17, 6, 2, 4, '#9a588e');
            rect(7, 9, 2, 3, '#8e4aaa'); rect(15, 9, 2, 3, '#8e4aaa'); rect(5, 14, 1, 3, '#e5c45c'); rect(18, 14, 1, 3, '#e5c45c'); rect(9, 17, 6, 2, '#c7a16d'); rect(10, 20, 4, 1, '#a178ba'); break;
        case 'sage':
            rect(8, 0, 7, 2, outline); rect(9, 0, 5, 1, '#b8dfd5'); rect(18, 3, 3, 4, hair); rect(19, 7, 3, 10, hairShade); rect(20, 15, 3, 2, hairShade);
            shape([[8, 3], [15, 3], [19, 6], [19, 10], [17, 10], [16, 7], [13, 6], [12, 7], [9, 7]], hair); rect(6, 17, 3, 4, '#f3eee2'); rect(15, 17, 3, 4, '#f3eee2'); rect(9, 18, 6, 2, '#aadbd2'); rect(12, 20, 3, 2, '#3e8e84'); break;
        case 'skye':
            rect(3, 6, 3, 10, hair); rect(18, 7, 3, 9, hair); rect(2, 16, 3, 3, hairShade); rect(3, 18, 3, 2, hair); rect(4, 6, 16, 2, '#47824d'); rect(9, 4, 6, 3, '#47824d'); rect(10, 3, 4, 1, '#65a15a');
            rect(8, 17, 8, 2, '#c9d8a8'); rect(8, 20, 8, 1, '#7e995e'); rect(4, 19, 2, 2, '#bca06f'); break;
        case 'sova':
            rect(4, 5, 2, 8, hair); rect(18, 5, 2, 8, hair); rect(7, 3, 10, 1, '#f2dc9d'); rect(17, 5, 2, 4, hairShade); rect(7, 9, 1, 1, '#80c7e7');
            shape([[4, 16], [8, 16], [8, 17], [16, 17], [16, 16], [20, 16], [20, 19], [17, 20], [7, 20], [4, 19]], art.trim); rect(5, 17, 3, 2, '#82b3c9'); rect(17, 17, 2, 2, '#d6e8e9'); rect(11, 20, 2, 2, '#203d5b'); break;
        case 'viper':
            rect(3, 5, 3, 11, hair); rect(18, 5, 3, 11, hair); rect(4, 3, 4, 3, hairShade); rect(15, 3, 4, 3, hairShade);
            rect(6, 12, 12, 3, outline); rect(7, 12, 10, 3, '#285948'); rect(10, 11, 4, 4, '#35795c'); rect(11, 12, 2, 1, '#7cbb85'); rect(10, 18, 4, 4, '#243d36'); rect(7, 20, 2, 2, '#62a56b'); rect(15, 20, 2, 2, '#62a56b'); break;
        case 'yoru':
            shape([[6, 2], [9, 2], [9, 0], [13, 0], [13, 2], [17, 2], [17, 3], [20, 3], [20, 6], [18, 6], [18, 8], [16, 8], [16, 6], [13, 6], [13, 5], [10, 5], [10, 6], [7, 6], [7, 8], [5, 8], [5, 4], [6, 4]], hair);
            rect(7, 3, 3, 1, art.accent); rect(12, 2, 3, 1, art.accent); rect(7, 18, 4, 2, '#be5365'); rect(13, 18, 4, 2, '#be5365'); rect(11, 19, 2, 3, '#d2a09b'); rect(7, 21, 2, 1, '#5783c0'); break;
        case 'waylay':
            shape([[3, 3], [5, 3], [5, 0], [8, 0], [8, 3], [10, 3], [10, 1], [13, 1], [13, 3], [16, 3], [16, 0], [19, 1], [19, 4], [21, 4], [21, 7], [19, 7], [19, 6], [17, 6], [17, 8], [15, 8], [15, 6], [11, 6], [11, 7], [8, 7], [8, 6], [5, 7], [3, 7]], hair);
            rect(4, 6, 16, 2, '#69b4a7'); rect(3, 8, 2, 6, hairLight); rect(19, 8, 2, 6, hairShade); rect(7, 17, 3, 3, '#d7ba61'); rect(14, 17, 3, 3, '#d7ba61'); rect(10, 19, 4, 2, '#94b791'); break;
        case 'tejo':
            rect(4, 5, 3, 3, hair); rect(17, 5, 3, 3, hair); rect(6, 12, 3, 3, '#c29248'); rect(15, 12, 3, 3, '#c29248'); rect(9, 13, 6, 3, '#ce9e4f'); rect(10, 14, 4, 1, '#e8c16d');
            borderBox(5, 8, 6, 4, '#d4b778'); borderBox(13, 8, 6, 4, '#d4b778'); rect(6, 9, 4, 2, '#c4a072'); rect(14, 9, 4, 2, '#c4a072'); rect(11, 9, 2, 1, '#e8c16d'); rect(3, 16, 5, 3, '#e5bf64'); rect(16, 16, 5, 3, '#e5bf64'); break;
        case 'vyse':
            shape([[11, 1], [13, 1], [14, 3], [17, 3], [18, 5], [20, 5], [20, 14], [18, 16], [6, 16], [4, 14], [4, 5], [7, 5], [8, 3], [10, 3]], '#3c345d');
            rect(10, 3, 4, 11, '#514575'); rect(11, 5, 2, 4, '#bfc1e4'); rect(5, 11, 3, 3, '#e1e6e6'); rect(7, 13, 3, 3, '#aeb9c8'); rect(16, 11, 3, 3, '#e1e6e6'); rect(14, 13, 3, 3, '#aeb9c8'); rect(6, 17, 3, 4, art.trim); rect(15, 17, 3, 4, art.trim); break;
        case 'veto':
            rect(5, 3, 14, 3, hair); rect(7, 2, 10, 1, '#344a3c'); rect(9, 5, 7, 1, '#56744d'); rect(7, 11, 2, 1, '#d3e3b0'); rect(15, 11, 2, 1, '#d3e3b0'); rect(7, 17, 3, 4, '#a2b78c'); rect(14, 17, 3, 4, '#a2b78c'); rect(10, 19, 4, 2, '#324c3e'); break;
        case 'miks':
            borderBox(1, 6, 4, 8, '#d28a61'); borderBox(19, 6, 4, 8, '#d28a61'); rect(2, 7, 2, 4, '#e6c4a0'); rect(20, 7, 2, 4, '#e6c4a0'); rect(4, 2, 16, 1, '#bca4a0'); rect(6, 1, 12, 1, '#948594');
            rect(6, 17, 3, 5, '#ddaf82'); rect(15, 17, 3, 5, '#ddaf82'); rect(10, 18, 4, 3, '#4a5368'); rect(11, 19, 2, 1, '#e8b37d'); break;
        case 'hush':
            rect(18, 1, 3, 5, hair); rect(20, 5, 2, 7, hairShade); rect(7, 3, 4, 1, '#849da9'); rect(5, 7, 3, 1, '#9db5bb'); rect(5, 9, 1, 4, '#b6e5e6'); rect(18, 10, 1, 3, '#b6e5e6');
            rect(6, 17, 3, 4, '#e3edeb'); rect(15, 17, 3, 4, '#e3edeb'); rect(11, 18, 2, 3, '#6eb4bd'); break;
    }
    spriteCache.set(key, image); return image;
}
