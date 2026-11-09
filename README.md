# Valorogue

Roguelike de arena para navegador, hecho con HTML, CSS y Canvas 2D sin dependencias. Interfaz táctica con gráficos pixel art originales.

Abre `index.html` directamente, o ejecuta `python3 -m http.server 8000` y visita http://localhost:8000. No requiere Node.js ni instalaciones.

## Controles

- WASD o flechas: moverse.
- Ratón: apuntar. Classic y otras semiautomáticas: un disparo por clic. Automáticas: clic izquierdo mantenido.
- Clic izquierdo: Bulldog dispara ráfagas de 3 balas y Stinger de 4, una ráfaga por clic.
- Clic derecho: triple disparo simultáneo con dispersión aleatoria de Classic.
- **R**: recargar el arma. También recarga automáticamente al agotar el cargador; la reserva de munición es ilimitada.
- **E**: habilidad activa del agente; también se puede pulsar su indicador.
- **Esc** o **P**: pausar o continuar. Cambiar de ventana pausa la partida.

El indicador de habilidad muestra cuándo está lista y su recarga. El tiempo de juego, los efectos y las recargas se detienen durante las pausas y las elecciones. Las habilidades no disparan por el jugador; Killjoy puede desplegar una torreta temporal.

## Agentes, inventario y gacha

Incluye los 30 agentes de la lista oficial consultada el 5 de noviembre de 2026, con una habilidad por agente adaptada al juego en solitario y sprites distintos. Consulta [PERSONAJES.md](PERSONAJES.md) para ver todos los efectos, las recargas y la conversión de los personajes anteriores.

Sage es el personaje inicial. El gacha cuesta 50 Kingdom Credits y devuelve 20 por duplicados; mantiene las probabilidades totales de 60 %, 25 %, 10 %, 4 % y 1 % para las cinco rarezas. Hay seis agentes por rareza. La ruleta guarda el resultado antes de animar y bloquea las tiradas dobles. Inventario y gacha tienen búsqueda y filtro de rareza.

## Armas y tienda diaria

Empiezas con la Classic desbloqueada y equipada. El catálogo incluye 19 armas de fuego y el cuchillo táctico del [arsenal oficial](https://playvalorant.com/en-us/arsenal/), con estadísticas adaptadas a esta arena. Consulta [ARMAS.md](ARMAS.md).

La Tienda ofrece seis armas distintas cada día, a precio fijo en Kingdom Credits. Cambia a las 00:00 de Europe/Madrid, incluidos los cambios de horario de verano. La selección es determinista para cada fecha: recargar la página o comprar no cambia los otros puestos, y un arma comprada aparece como adquirida hasta la siguiente rotación. La Classic gratuita no ocupa un puesto.

Las compras son permanentes y se equipan desde **Inventario → Armas** antes de iniciar una partida. Las armas no salen en el gacha. El inventario inicial y los guardados anteriores reciben la Classic automáticamente; se conservan todos los agentes, Kingdom Credits y mejoras. Cargadores, recargas y habilidades se reinician al comenzar una partida; el arma equipada se conserva.

Las escopetas disparan varios perdigones, los francotiradores tienen más alcance y daño con menor cadencia, las automáticas permiten mantener el gatillo y el cuchillo ataca cerca sin atravesar muros. Las mejoras de daño, cadencia, alcance, proyectiles y crítico se combinan con el arma; los artefactos también. Cargadores y recargas se congelan durante pausa y elecciones.

## Partida y progreso

La partida dura como máximo 15 minutos de juego activo. A los 5, 10 y 15 minutos se elige un artefacto; la tercera elección precede a la victoria. Artefactos: teledirigidos, perforación, hielo y rebotes. Las mejoras elegidas al subir de nivel duran esa partida e incluyen daño, cadencia, velocidad, salud, proyectiles, radio de recogida, alcance, crítico y resistencia.

La vida base es de 100 PV. Vitalidad añade 20 PV por nivel permanente; Potencia, Agilidad y Cadencia mejoran sus estadísticas iniciales. Las compras se aplican al empezar la siguiente partida.

Los enemigos tienen un 25 % de probabilidad de dar 2 Kingdom Credits, abonados directamente. La recompensa final es `10 + floor(segundos/5) + floor(bajas/2)`. Al abandonar desde Menú se conserva la mitad del total ganado en esa partida, redondeada hacia abajo; morir o ganar conserva el total. La liquidación se aplica una sola vez.

Kingdom Credits, agentes, selección, mejoras y récord se guardan en `localStorage`. El guardado depende del navegador y de la dirección desde la que se abre el juego. Si el almacenamiento está bloqueado se puede jugar durante la sesión y aparece un aviso.

## Terreno y objetos

Cada partida genera un bosque con ruinas, caminos y obstáculos distintos. El centro queda libre, se comprueba la conectividad y la semilla se conserva al redimensionar. Árboles, rocas y muros bloquean personajes, enemigos y proyectiles. Los enemigos y los compañeros de habilidad buscan rutas alrededor del terreno.

Los objetos se activan al tocarlos y duran 30 s:

- Orbe (+): cura un 10 % de vida máxima. Probabilidad base: 3 %.
- Bomba: elimina los enemigos en pantalla y concede sus recompensas. Probabilidad: 1 %.
- Imán: atrae la XP existente a 600 px/s y se recoge al llegar. Probabilidad: 2 %.

Los enemigos morados tienen el doble de probabilidades. La mejora temporal Imán aumenta 60 px el radio normal de recogida por elección y es independiente del objeto.

## Archivos

- `game.js`: partida, progresión, menús y guardado.
- `agents.js`: catálogo, rarezas, habilidades y conversión del progreso antiguo.
- `abilities.js`: activación, efectos, recargas, compañeros y HUD de E.
- `weapons.js`: catálogo, tienda diaria, compras, equipamiento, disparo y recarga.
- `weapon-art.js`: gráficos pixel art originales de las armas.
- `pixel-art.js`: sprites e iconos originales, guardados en caché.
- `terrain.js`: generación procedural, colisiones, rutas y capa estática del escenario.
- `style.css` y `tactical.css`: disposición y tema de la interfaz.

El lienzo se dibuja a resolución lógica 1× sin suavizado para conservar el detalle de los agentes; el terreno mantiene su capa estática a media resolución. Los agentes usan sprites chibi de 24 × 24 píxeles, con cabeza grande, cuerpo compacto y accesorios propios; se muestran a 24 × 24 px en la arena, conservando el radio de colisión de 12 px. El número de enemigos, proyectiles, efectos y partículas está limitado para controlar el consumo. Prototipo para teclado y ratón, sin audio ni controles táctiles completos.

## Código Konami

En el menú, introduce **↑ ↑ ↓ ↓ ← → ← → B A Intro**. Permite equipar todos los agentes y armas hasta recargar la página. Aparece una insignia KONAMI y el inventario muestra el desbloqueo temporal. No funciona durante una partida ni mientras se escribe en un campo de búsqueda.

El desbloqueo se mantiene solo en memoria: guardar una partida o equipar un objeto temporal no lo convierte en una compra permanente. Al recargar se restauran los agentes, armas y selecciones reales; se conservan los Kingdom Credits ganados y las compras legítimas.

## Inicio y Kingdom Credits

El inicio reúne el agente y el arma equipados en dos tarjetas, con estadísticas, un desplegable para cambiar de agente e Inventario → Armas. La ayuda está en el desplegable «Cómo jugar» de la esquina superior derecha; se cierra con Escape o al hacer clic fuera y se oculta durante la partida.

La moneda visible se llama **Kingdom Credits (KC)** y usa un icono vectorial local. Se conserva el saldo anterior, la recogida, los precios, las recompensas y la penalización por abandonar. La propiedad interna `coins` del guardado se mantiene para no perder compatibilidad.

Mejoras de nivel de armamento: Cargador ampliado añade un 20 % de la capacidad base (redondeado hacia arriba, mínimo una bala); Recarga rápida reduce un 15 % el tiempo de recarga. Ambas se acumulan y duran una partida. Ampliar el cargador no añade munición hasta recargar. No aparecen con el cuchillo.

- X o botón de definitiva: activa la definitiva del agente al llenar su barra con eliminaciones. Catálogo, costes y efectos en PERSONAJES.md. Se reinicia con cada partida.
- `ultimates.js`: catálogo y lógica de las 30 definitivas, carga, barra y efectos.

## Mapas de arena

Cada partida elige una adaptación original pixel art de Ascent, Bind, Haven, Icebox, Lotus o Sunset, sin repetir el mapa anterior durante la sesión. Cada uno tiene su paleta, plazas, rutas y bloques de cobertura; las pequeñas coberturas varían. Los estanques de Lotus son obstáculos sólidos. El nombre aparece junto al nivel durante la partida.

`maps.js` contiene las seis distribuciones; `terrain.js` dibuja el fondo una vez y conserva las colisiones y la navegación compartida. El mapa se adapta al redimensionar sin cambiar su identidad. La comprobación de conectividad elimina los bloques necesarios para evitar zonas inaccesibles en pantallas estrechas. No se añaden puertas ni teletransportes.

## Nuevas mejoras

El taller tiene dos páginas, Combate y Recursos y equipo, con cuatro compras visibles por página. Las nuevas permanentes tienen cinco niveles y cuestan su precio base multiplicado por el nivel que se compra:

| Mejora | Efecto por nivel | Coste base |
|---|---|---|
| Prospección Kingdom | +5 puntos porcentuales de probabilidad de obtener 2 KC por baja: 25 % → 50 % | 100 KC |
| Recolector | +20 px de radio inicial de recogida de XP | 45 KC |
| Armero | Tiempo de recarga de arma ×0,95 | 65 KC |
| Sincronización | Tiempo de recarga de E ×0,95 | 90 KC |

La mejora de nivel Flujo de habilidad multiplica la recarga de E por 0,85, también sobre el tiempo pendiente. Se acumula con Sincronización hasta un mínimo del 35 % del tiempo original (65 % de reducción total); entonces deja de aparecer. Dura esa partida y no afecta a la carga de X ni a la duración de los efectos de E. Los guardados anteriores reciben las nuevas permanentes en nivel cero.

El inicio muestra la preparación de despliegue con un retrato grande del agente, panel lateral de arma y estadísticas. E y X se consultan en desplegables; se conserva la selección directa de agente. La navegación incluye iconos y el progreso de colección. Duración, fases y número de mapas aparecen en una franja inferior. En móvil se compactan los accesos y los paneles sin scroll en los tamaños verificados.

## Ampliación de combate y progresión

- Cuatro enemigos adicionales: tirador (proyectiles con aviso), cargador (carga telegrafiada), escudero (resiste impactos frontales) y sanador (cura aliados cercanos). Aparecen gradualmente.
- Tres jefes, uno al final de cada fase. Debes derrotarlos antes de elegir el artefacto. El cronómetro de fase se detiene mientras combates al jefe; las estadísticas incluyen el tiempo real. Los jefes tienen explosiones señaladas y, en las fases posteriores, disparos en abanico y cargas. Las bombas les quitan un 20 % de la vida máxima.
- Tres renovaciones de opciones de mejora por partida, gratuitas y compartidas entre todos los niveles.
- Evoluciones automáticas: Perforador (Núcleo ardiente ×2 + Golpe crítico ×2) atraviesa; Tormenta (Gatillo veloz ×2 + Cargador ampliado ×2) añade un proyectil y reduce un 20 % la recarga; Nova (Abanico de fuego ×2 + Largo alcance ×1) genera explosiones de impacto. Se pueden combinar.
- Sinergias: con 30 % de crítico y Gatillo veloz, los críticos encadenan daño a dos enemigos cercanos. Con perforación y Núcleo ardiente ×2, cada tercer impacto de un mismo proyectil provoca una explosión.
- Nueva sección Progreso: tres misiones diarias (150 bajas / 300 segundos de combate / 30 bajas con habilidades, definitivas u objetos), con recompensas de 80 / 100 / 120 KC. Se cobran una vez y se renuevan a medianoche en Madrid.
- Maestría independiente por agente: 1 XP por baja, 1 por cada 10 segundos y 50 por jefe. Cinco niveles de 250 XP; aspectos Coral en nivel 2 y Glacial en nivel 4. Los aspectos cambian el color, sin ventajas estadísticas. Abandonar reduce a la mitad la XP de maestría.
- Veterano se desbloquea al ganar en Normal; Pesadilla al ganar en Veterano. Modifican vida, velocidad y frecuencia enemiga, con +30 % / +60 % de recompensa final. Se eligen antes de empezar.
- El informe final muestra daño causado/recibido, precisión por proyectil, bajas con poderes, jefes, dificultad, mejoras y evoluciones. La pausa permite consultar la build.
- Exportación/importación protegida `.valorogue` de personajes, armas, créditos, mejoras y metaprogresión. Importar una copia válida sustituye el guardado y recarga la web; los formatos incorrectos se rechazan. El progreso previo sigue usando chispa-progress; la ampliación usa chispa-meta-v1. La metaprogresión de combate se guarda al terminar la partida.

Toda la ampliación está en `expansion.js` y se integra con el Canvas existente. Los proyectiles enemigos y avisos tienen límites de cantidad, comparten las colisiones del terreno y sus tiempos se congelan al pausar. No se añade audio ni dependencias.

## Presentación táctica unificada

`combat-art.js` dibuja y cachea sprites específicos para tirador, cargador, escudero, sanador y los tres jefes. Conserva los radios y comportamientos existentes. Las advertencias se dibujan sobre el suelo antes de los actores; los efectos aliados usan azul claro. Añade decoración estática distinta por mapa sin cambiar los obstáculos ni la navegación.

`visual-refresh.css` agrupa vida/XP y arma/E/X, unifica los marcos de los iconos conservando sus proporciones y referencias, y presenta los resultados con estadísticas desplegables. Progreso tiene pestañas Misiones, Agente, Arsenal y Guardado, accesibles con flechas/Home/End. El inicio conserva el menú lateral de 310 px y presenta al agente en una plataforma; las tarjetas de gacha/inventario mantienen el botón de información.

## Resoluciones e iconos

`responsive.css` adapta el inicio, diálogos, cartas de nivel/artefacto, taller, estadísticas y HUD al ancho y alto disponibles. En ventanas bajas, los paneles permiten desplazamiento vertical para conservar el acceso a los botones; el juego ocupa el área exacta bajo la cabecera. Los controles de combate se organizan en una fila en horizontal y en dos filas en pantallas estrechas. Se tienen en cuenta los márgenes seguros del dispositivo.

Los iconos de mejoras y artefactos pasan por un lienzo cacheado de 32 × 32, que recorta el margen transparente y centra su silueta manteniendo la proporción. Se conservan las referencias de corazón, rayo, zapatilla, reloj, recarga e imán. Largo alcance tiene flecha de distancia propia; Golpe crítico usa un destello dorado y Progreso un gráfico de barras.

Al cambiar de tamaño u orientación se conservan vida, nivel, tiempos, mapa y mejoras. Jugador, enemigos, XP, objetos, proyectiles y efectos se recolocan proporcionalmente; se vuelve a comprobar que los actores y objetos estén en una zona libre. No se reinicia la partida.

Verificación de adaptación: 27 tamaños, de 240 × 320 a 3840 × 2160, incluyendo móvil vertical/horizontal, tablet, ventanas bajas y ultrapanorámica. Se comprobaron inicio, gacha, inventario, tienda, ambas páginas del taller, las cuatro pestañas de Progreso, información de agente, HUD, pausa, mejoras, artefactos y derrota/estadísticas. También se probaron botones accesibles tras desplazar el panel, densidad de pantalla 2×, cambio de orientación en plena partida y regresión de los 30 agentes y las ráfagas.

El HUD final se distribuye en dos franjas reservadas mediante `hud-layout.css`: vida/XP/estado arriba y arma/E/X abajo. El Canvas ocupa exclusivamente la fila central de la arena; ningún indicador queda encima del mapa. La barra del jefe también forma parte de la franja superior. Se verificó la separación entre HUD y Canvas en escritorio, móvil y horizontal, además del apuntado con el nuevo desplazamiento del Canvas y los botones E/X.

## Assets originales de las mejoras

Las 13 imágenes de `assets/mejoras/` se usan directamente en las cartas de subida de nivel y en sus equivalentes permanentes. `upgradeAssets` en `pixel-art.js` relaciona cada símbolo con su PNG; no se redibujan ni se reducen al lienzo de 32 px. Se mantienen los originales y se ajusta su tamaño mediante CSS, con carga diferida y decodificación asíncrona. Prospección Kingdom usa `assets/Kingdom_Credits.webp`. Los artefactos mantienen su iconografía independiente.

## Tandas de gacha

En Gacha puedes elegir entre 1 y 5 invocaciones, a 50 KC cada una (máximo 250 KC). Se exige el coste completo antes de comenzar; cada repetido devuelve 20 KC, incluidos los repetidos dentro de la misma tanda. Toda la tanda se guarda antes de animar. Las ruletas giran en paralelo y los resultados aparecen en una sola fila horizontal, con desplazamiento lateral en pantallas pequeñas, con resumen de nuevos/repetidos y acceso a información mediante el botón i. Las probabilidades de cada invocación se mantienen.

La interfaz elimina encabezados decorativos e instrucciones duplicadas del inicio, gacha, inventario, taller y HUD. Las instrucciones están en Cómo jugar; precios, estadísticas, efectos y avisos de pérdida de progreso permanecen visibles cuando son necesarios. Los rodillos de gacha giran verticalmente hacia abajo y las tandas (máximo cinco) se mantienen en una fila horizontal.

En Gacha e Inventario la cabecera y los filtros permanecen fijos; solo se desplaza la colección (agentes, armas y resultados). Durante la partida se oculta la cabecera de la web y Pausar se sitúa en el HUD; Esc y P siguen funcionando.

## Especializaciones de agente

`agent-builds.js` añade Q a los 30 agentes y 120 mejoras exclusivas (2–6 por agente según rareza). Cada nivel y renovación tiene un 25 % de probabilidad de ofrecer una opción exclusiva junto a las mejoras normales. Cada exclusiva se elige una vez, dura esa partida y respeta el límite de rareza. La ficha i muestra las tres habilidades y el catálogo de mejoras. Jett puede combinar sus dos mejoras propias con Vendaval.

La Q se activa con la tecla Q o su botón, tiene su propia recarga y comparte la franja reservada del HUD con el arma, E y X. Cámara/ancla de Q y marca de E son independientes y se recolocan al redimensionar. Las mejoras normales de recarga de E no reducen Q; Técnica ágil sí lo hace. Consulta PERSONAJES.md para los efectos y costes actuales.


## Copias protegidas

`save-backup.js` cifra y autentica las copias con AES-256-GCM mediante Web Crypto, IV aleatorio de 96 bits por exportación y etiqueta de 128 bits. Requiere HTTPS o localhost; no descarga una copia sin protección si Web Crypto no está disponible. El formato v2 autentica también una cabecera fija del protocolo. Antes de escribir en localStorage se verifica el cifrado y se validan los datos; un fallo al escribir intenta restaurar ambos valores anteriores.

Las copias `.valorogue` funcionan entre navegadores y dispositivos sin contraseña. El progreso local actual se conserva. Los JSON v1 dejan de aceptarse: para migrar, descarga una copia nueva desde el navegador que conserva el progreso. Mantener una vía de importación JSON permitiría eludir la comprobación.

Es una barrera contra la edición casual del archivo, no un sistema antitrampas: la clave v2 se distribuye en el código y debe conservarse para abrir copias futuras. Alguien con control del navegador puede extraerla, generar nuevas copias, modificar localStorage o el propio juego. Tampoco evita restaurar copias anteriores. Para validar los objetos ganados de forma fiable hace falta un servidor. No sustituir la clave v2 sin mantener un lector de versiones anteriores.

Referencia: [Web Crypto AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams).


## Misiones semanales

Misiones muestra las diarias y, debajo, las semanales en la misma pestaña. Las semanales acumulan 3000 bajas, 120 minutos, 15 jefes y 5 victorias; las tres primeras dan un ticket legendario+ cada una y las victorias dan un ticket ultralegendario. Se renuevan el lunes a las 00:00 de Europe/Madrid. Los tickets sin gastar no caducan con el cambio de semana.

Los tickets se canjean de uno en uno en Gacha, sin KC. Legendario+ usa las probabilidades relativas de las rarezas admitidas (80 % legendario, 20 % ultralegendario); el otro garantiza ultralegendario. Pueden salir repetidos, con el reembolso habitual de 20 KC. El gacha ordinario mantiene su coste y probabilidades. Contadores y tickets se incluyen en las copias protegidas; el progreso de las misiones se guarda cada 15 segundos de combate, al terminar y al salir de la página. Sigue siendo progreso local, sujeto a las limitaciones de restaurar copias antiguas y cambiar el reloj del equipo.


## Prestigio: reiniciar para mejorar

Progreso → Guardado sustituye el borrado total por un ascenso de prestigio. Requiere una victoria completa de 15 minutos nueva desde el último ascenso; las victorias ya obtenidas habilitan el primero. Cada ascenso consume esa oportunidad (registra el total de victorias actual), entrega 1 punto y reinicia solo los KC y las mejoras compradas con KC. Conserva agentes, armas, equipo seleccionado, maestría, aspectos, dificultades, récords, misiones, tickets y las mejoras de prestigio. El Konami temporal se desactiva. La confirmación requiere mantener «Sí, ascender» durante dos segundos y se puede cancelar soltando, con Escape o Cancelar.

Cada nivel cuesta 1 punto: Vitalidad superior +10 PV iniciales, Reflejos superiores +2 % de velocidad, Atracción superior +10 px de recogida de XP, Recompensa superior +5 % de KC finales. Diez niveles por mejora, máximo 40 ascensos. No multiplica los KC recogidos, las misiones ni los reembolsos de repetidos; la penalización por abandonar se mantiene. Los bonus se aplican al iniciar la partida y se suman o multiplican con las mejoras normales según su descripción. Las compras de prestigio permanecen tras ascender y se incluyen en las copias protegidas; guardados anteriores comienzan en prestigio 0 sin perder sus datos.
