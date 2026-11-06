'use strict';
// Roster checked against https://playvalorant.com/es-es/agents/ on 2026-11-05.
// One arena adaptation per agent; cooldowns and numbers belong to this game.
const rarityTiers = [
    { name: 'Común', chance: 60, color: '#b8d3c3' }, { name: 'Raro', chance: 25, color: '#77bdff' },
    { name: 'Épico', chance: 10, color: '#bf88ef' }, { name: 'Legendario', chance: 4, color: '#f3c56c' },
    { name: 'Ultralegendario', chance: 1, color: '#fa8cbd' }
];
// id, name, rarity, skill, cooldown, explanation, jacket, hair, appearance, skin
const agentDefinitions = [
    ['sage', 'Sage', 0, 'Orbe de sanación', 24, 'Recupera un 35 % de tu vida máxima durante 3 segundos.', '#ecede4', '#1e2931', 'pony', '#d9ac91'],
    ['sova', 'Sova', 0, 'Flecha de choque', 14, 'Una flecha eléctrica explota al impactar y causa 6 de daño en un radio de 80 px.', '#6d9cbd', '#d6cfac', 'short', '#d9b898'],
    ['brimstone', 'Brimstone', 0, 'Incendiaria', 20, 'Despliega fuego durante 5 s: 3 de daño por segundo en un radio de 90 px.', '#606e7b', '#cb713a', 'beret', '#c28d6d'],
    ['skye', 'Skye', 0, 'Depredador', 18, 'Envía una bestia que persigue un objetivo, inflige 5 de daño y aturde 2 s.', '#4a8256', '#ce8454', 'band', '#e2b899'],
    ['cypher', 'Cypher', 0, 'Cable trampa', 18, 'Coloca una zona de 75 px durante 6 s que inmoviliza y revela a los enemigos.', '#c6c3a8', '#ece5cf', 'hat', '#43596a'],
    ['harbor', 'Harbor', 0, 'Marea alta', 18, 'Una ola frontal empuja a los enemigos y los ralentiza durante 4 s.', '#3e8d96', '#293039', 'beard', '#a97854'],
    ['jett', 'Jett', 1, 'Viento de cola', 12, 'Avanza hasta 170 px en tu dirección de movimiento o hacia el cursor. Respeta los muros.', '#67c7d3', '#e2e8e9', 'pony', '#d8b294'],
    ['breach', 'Breach', 1, 'Falla', 18, 'Una onda atraviesa el terreno: 3 de daño y 3 s de aturdimiento en una línea de 360 px.', '#a27443', '#bd7d42', 'beard', '#d4a481'],
    ['killjoy', 'Killjoy', 1, 'Torreta', 24, 'Despliega una torreta durante 9 s que dispara al enemigo visible más cercano.', '#d5bd4b', '#6fbc84', 'cap', '#ceaa8a'],
    ['raze', 'Raze', 1, 'Balas de pintura', 20, 'Lanza una granada al cursor: 8 de daño y tres pequeñas explosiones posteriores.', '#b87c42', '#df8f4e', 'headphones', '#ad7855'],
    ['neon', 'Neon', 1, 'A toda máquina', 18, 'Corre un 80 % más rápido durante 5 s y electrifica a los enemigos que se acercan.', '#3e70c4', '#4a92ed', 'twin', '#b88b6c'],
    ['deadlock', 'Deadlock', 1, 'Sensor sónico', 18, 'Coloca un sensor de 105 px que, al detectar un enemigo, aturde 4 s.', '#91a299', '#ddd7ad', 'short', '#d8b798'],
    ['phoenix', 'Phoenix', 2, 'Bola curva', 16, 'Un destello al cursor ciega y detiene durante 3 s a los enemigos en 130 px.', '#f0ddd0', '#3c292b', 'crest', '#9f6c4c'],
    ['viper', 'Viper', 2, 'Nube venenosa', 22, 'Crea una nube durante 6 s: ralentiza y causa 2 de daño por segundo.', '#3e9d71', '#192a31', 'bob', '#cfb299'],
    ['fade', 'Fade', 2, 'Capturar', 19, 'Atrapa 3 s y vuelve vulnerables 6 s a los enemigos dentro de 100 px.', '#3b536a', '#b7b7c7', 'bob', '#c3a18a'],
    ['gekko', 'Gekko', 2, 'Wingman', 16, 'Tu compañero persigue un enemigo y estalla: 3 de daño y aturdimiento de 3 s.', '#88b84c', '#bddc65', 'short', '#d4ad83'],
    ['kayo', 'KAY/O', 2, 'Punto/Cero', 20, 'Un pulso de 180 px detiene 1 s y reduce a la mitad el daño por contacto durante 5 s.', '#5c72a8', '#a0a8d4', 'robot', '#66728e'],
    ['chamber', 'Chamber', 2, 'Cazador de cabezas', 22, 'Tus próximos 6 disparos manuales infligen el triple de daño.', '#d9c28b', '#382a2d', 'glasses', '#dab591'],
    ['omen', 'Omen', 3, 'Aparición tenebrosa', 18, 'Te teletransporta hasta 260 px hacia el cursor, siempre a un destino libre.', '#555c9c', '#454d85', 'hood', '#6a97bb'],
    ['astra', 'Astra', 3, 'Pozo gravitacional', 24, 'Un pozo de 145 px atrae enemigos durante 4 s y los vuelve vulnerables.', '#9d68ad', '#38243e', 'crest', '#835338'],
    ['yoru', 'Yoru', 3, 'Engaño', 20, 'Crea un señuelo durante 6 s: atrae enemigos y los ciega cuando desaparece.', '#4365b1', '#385ec4', 'crest', '#d0a78a'],
    ['clove', 'Clove', 3, 'Intromisión', 22, 'Reduce temporalmente a la mitad la vida de los enemigos en 120 px y acelera 4 s.', '#a58cd1', '#413343', 'bob', '#d7b29c'],
    ['vyse', 'Vyse', 3, 'Rosa arcana', 18, 'Una rosa de metal detona tras 0,8 s y ciega 3,5 s a los enemigos en 140 px.', '#73708e', '#a49ba8', 'mask', '#ac9d99'],
    ['tejo', 'Tejo', 3, 'Salva guiada', 22, 'Marca dos ataques de misiles al cursor: 6 de daño por explosión.', '#a48463', '#c5b39a', 'glasses', '#b88a64'],
    ['reyna', 'Reyna', 4, 'Devorar', 8, 'Consume un alma cercana de un enemigo derrotado para recuperar un 30 % de vida en 2 s.', '#804e9a', '#50315e', 'long', '#c49b7b'],
    ['iso', 'Iso', 4, 'Doble disparo', 20, 'Genera un escudo durante 10 s que absorbe el siguiente golpe por completo.', '#a4a2bd', '#333141', 'hood', '#ccb096'],
    ['waylay', 'Waylay', 4, 'Refracción', 24, 'Marca tu posición y acelera 4 s. Pulsa E otra vez para volver a la marca.', '#dbc85e', '#e3d8ab', 'long', '#be986e'],
    ['veto', 'Veto', 4, 'Asfixia', 20, 'Despliega una trampa de 110 px: inmoviliza 4 s y vuelve vulnerables a los enemigos.', '#6e8a79', '#233635', 'crest', '#73503c'],
    ['miks', 'Miks', 4, 'Pulso M', 22, 'Durante 4 s, una zona sonora cercana te cura y emite pulsos que aturden enemigos.', '#de8a64', '#61474c', 'headphones', '#d0a88c'],
    ['hush', 'Hush', 4, 'Desplazamiento', 20, 'Un campo telequinético de 145 px atrae enemigos y los aturde al llegar al centro.', '#adc8d0', '#3a4a51', 'pony', '#d7b397']
];
const AGENTS = agentDefinitions.map(([id, name, tier, skill, cooldown, description, jacket, hair, look, skin]) => {
    const rarity = rarityTiers[tier], count = agentDefinitions.filter(row => row[2] === tier).length;
    return { id, name, rarity: rarity.name, color: rarity.color, chance: rarity.chance / count, skill, cooldown, description, trait: `E · ${skill}: ${description}`, icon: '✦', jacket, hair, look, skin };
});
const legacyAgents = { brizna: 'sage', rafaga: 'jett', ascua: 'phoenix', sol: 'omen', nova: 'reyna' };
function migrateAgentId(id) { return legacyAgents[id] || id; }
function formatChance(chance) { return Number(chance.toFixed(3)).toLocaleString('es-ES', { maximumFractionDigits: 3 }); }
function agentSkillDetails(hero) { return `<div class="agent-skill-info"><span class="skill-key">E</span><div><strong>${hero.skill}</strong><p>${hero.description}</p><small>Recarga: ${(hero.cooldown*Math.pow(.95,progress.upgrades.ability||0)).toFixed(1)} s · Adaptación para esta arena</small></div></div>`; }
