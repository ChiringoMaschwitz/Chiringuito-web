/* ══ Fin de año · El Chiringuito ══
   1. Cotizador, formulario y marcador de días (andan siempre)
   2. Contador 000→365 como un loading (anda siempre, con o sin librerías)
   3. Recorrido: frase → escena automática (unos 8 s, como un video, con "Saltar"):
      se prende el neón del bar → una nube de cuadraditos gira y se posa
      sobre una copa 3D de alambre mientras las fotos giran en torbellino → entra el trago real →
      cae y estalla en cuadraditos →
      "Un menú. De la entrada al brindis." → propuestas que emergen de a una → barrido de franjas
   Movimiento con transform/opacity; partículas en un solo canvas. */
(function () {
  'use strict';

  var PRECIO = 42000, SENA = 0.2, WA = '5491140857072', LOCAL = 'chiringuito';
  var d = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var plata = function (n) { return '$' + Math.round(n).toLocaleString('es-AR'); };
  var medir = function (ev, extra) { if (window.medir) window.medir(ev, LOCAL, extra); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var ss = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var MOTION = d.classList.contains('motion');

  /* ─────────── marcador: días que quedan del año (fecha real) ─────────── */
  (function () {
    var hoy = new Date(), fin = new Date(hoy.getFullYear(), 11, 31, 23, 59, 59);
    var dias = Math.max(0, Math.floor((fin - hoy) / 864e5));
    $('#hudNum').textContent = dias;
    $('#hudTxt').innerHTML = (dias === 1 ? 'día queda' : 'días quedan') + '<br>del año';
  })();

  /* ─────────── cotizador ─────────── */
  var cot = { n: 10, mostrado: 10 * PRECIO };
  var cotTotal = $('#cotTotal'), cotCuenta = $('#cotCuenta'), cotSena = $('#cotSena'), cotWa = $('#cotWa');
  function textoWa(n) {
    return ['¡Hola! Vengo de la web. Quiero reservar el menú de fin de año para ' + n + ' personas en El Chiringuito.', 'Empresa: ', 'Fecha tentativa: '].join('\n');
  }
  function elegir(n) {
    cot.n = n;
    $$('.cant-b').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.n === n)); });
    var total = n * PRECIO;
    cotCuenta.textContent = n + ' personas × ' + plata(PRECIO);
    cotSena.textContent = 'Seña para reservar (20%): ' + plata(total * SENA);
    cotWa.textContent = 'Reservá para ' + n + ' por WhatsApp';
    cotWa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(textoWa(n));
    if (window.gsap && MOTION) {
      gsap.to(cot, { mostrado: total, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: function () { cotTotal.textContent = plata(cot.mostrado); } });
    } else { cot.mostrado = total; cotTotal.textContent = plata(total); }
  }
  $$('.cant-b').forEach(function (b) { b.addEventListener('click', function () { elegir(+b.dataset.n); }); });
  cotWa.addEventListener('click', function () { medir('cotizacion_fin_de_ano', { personas: cot.n }); });
  elegir(10);

  /* ─────────── formulario "algo distinto" ─────────── */
  var form = $('#form'), formError = $('#formError');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, empresa = f.empresa.value.trim(), nombre = f.nombre.value.trim(), mensaje = f.mensaje.value.trim();
    if (!empresa || !nombre || !mensaje) { formError.hidden = false; return; }
    formError.hidden = true;
    var fecha = f.fecha.value ? f.fecha.value.split('-').reverse().join('/') : '', personas = f.personas.value.trim();
    var lineas = ['¡Hola! Quiero armar una despedida de fin de año en El Chiringuito.', 'Empresa: ' + empresa, 'Nombre: ' + nombre];
    if (fecha) lineas.push('Fecha tentativa: ' + fecha);
    if (personas) lineas.push('Personas: ' + personas);
    lineas.push('Lo que buscamos: ' + mensaje);
    medir('solicitud_fin_de_ano', personas ? { personas: +personas } : null);
    var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(lineas.join('\n'));
    var w = window.open(url, '_blank');
    if (!w) window.location.href = url;
  });

  /* ═════════════ contador 000 → 365 (loading) ═════════════
     JS puro: no depende de GSAP ni de la preferencia de movimiento, así nunca queda clavado.
     Cuenta tiempo visible (si la pestaña arranca oculta, espera) y no deja scrollear mientras corre. */
  var lenis = null, hud = $('#hud');
  var contador = $('#contador'), digs = $$('.dig'), cargaBarra = $('#cargaBarra'), contadorLabel = $('#contadorLabel');
  var video = $('#fondoVideo');
  var DUR = 3600, acum = 0, ultimo = null, corriendo = false, terminado = false;
  function pintarNum(v) {
    var s = String(Math.round(v)); while (s.length < 3) s = '0' + s;
    for (var i = 0; i < 3; i++) if (digs[i].textContent !== s[i]) digs[i].textContent = s[i];
  }
  var alTerminar = [];
  function finCuenta() {
    if (terminado) return;
    terminado = true;
    alTerminar.forEach(function (f) { f(); });
    pintarNum(365);
    cargaBarra.style.transform = 'scaleX(1)';
    contadorLabel.textContent = 'Días del año';
    contador.classList.add('listo');
    if (lenis) lenis.start();
    if (window.gsap && MOTION) {
      gsap.to('#saltar', { autoAlpha: 0, duration: 0.3 });
      gsap.to('#bajar', { opacity: 1, duration: 0.6, delay: 0.15 });
      gsap.to(hud, { opacity: 1, duration: 0.8, delay: 0.3 });
    } else { hud.style.opacity = 1; }
  }
  function paso(ts) {
    if (terminado) return;
    if (ultimo !== null) acum += Math.min(ts - ultimo, 40);
    ultimo = ts;
    var p = Math.min(acum / DUR, 1);
    /* arranca rápido, se toma su tiempo en el medio y frena al llegar: se ven pasar los números */
    var e = 1 - Math.pow(1 - p, 2.4);
    pintarNum(e * 365);
    cargaBarra.style.transform = 'scaleX(' + e.toFixed(4) + ')';
    if (p < 1) requestAnimationFrame(paso); else finCuenta();
  }
  function arrancar() {
    if (corriendo || terminado || document.hidden) return;
    corriendo = true;
    ultimo = null;
    requestAnimationFrame(paso);
  }
  pintarNum(0);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !terminado) { ultimo = null; if (!corriendo) arrancar(); } });
  /* arranca apenas está el primer cuadro del video (o a los 1,2 s como máximo) */
  var yaPidio = false;
  function pedirArranque() { if (yaPidio) return; yaPidio = true; setTimeout(arrancar, 200); }
  if (video) {
    if (video.readyState >= 2) pedirArranque();
    else { video.addEventListener('loadeddata', pedirArranque, { once: true }); video.addEventListener('error', pedirArranque, { once: true }); }
    var pv = video.play(); if (pv && pv.catch) pv.catch(function () {});
  }
  setTimeout(pedirArranque, 1200);
  /* red de seguridad: si por algo el bucle no corrió (pestaña rara, iframe), a los 9 s queda en 365 */
  setTimeout(function () { if (!terminado && acum === 0) { corriendo = false; arrancar(); setTimeout(finCuenta, DUR + 400); } }, 9000);
  $('#saltar').addEventListener('click', function () { acum = DUR; if (!corriendo) { corriendo = true; requestAnimationFrame(paso); } });

  /* ═════════════ recorrido animado ═════════════ */
  if (!MOTION) return;
  if (!window.gsap || !window.ScrollTrigger || !window.Lenis) { d.classList.remove('motion'); return; }

  var QUIETO = d.classList.contains('quieto');
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  lenis = new Lenis({ lerp: QUIETO ? 1 : 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(500, 33);
  if (!terminado) lenis.stop();

  /* ── 2 · intro: el 365 se va, entra la frase ── */
  var pals = $$('.frase .pal');
  gsap.set('#frase', { yPercent: -50, y: 0 });
  gsap.set(pals, { y: 0, yPercent: 135 });
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#intro', start: 'top top', end: 'bottom bottom', scrub: true,
      onLeave: function () { if (video) video.pause(); },
      onEnterBack: function () { if (video) { var q = video.play(); if (q && q.catch) q.catch(function () {}); } }
    }
  })
    .to('#bajar, #saltar, #introPie', { opacity: 0, duration: 0.08 }, 0)
    .to(digs, { yPercent: -110, opacity: 0, stagger: 0.05, duration: 0.24, ease: 'power2.in' }, 0.02)
    .to('#contadorLabel, .carga', { opacity: 0, y: -16, duration: 0.14 }, 0.02)
    .to('#fondoVideo', { opacity: 0.5, duration: 0.3 }, 0.12)
    .to(pals, { yPercent: 0, stagger: 0.022, duration: 0.2, ease: 'power3.out' }, 0.26)
    .to('#frase', { scale: 0.9, opacity: 0, duration: 0.16, ease: 'power1.in' }, 0.82)
    .to('#fondoVideo', { opacity: 0, duration: 0.14 }, 0.84)
    .to({}, { duration: 0.02 }, 0.98);

  /* ── 3 · la noche ──
     Todo lo que se mueve acá lo maneja el scroll (no hay tiempos fijos), salvo el polvo de fondo. */
  var noche = $('#noche'), pin = $('#nochePin');
  var ambiente = $('#ambiente'), ambCerca = $('#ambCerca'), ambSombra = $('#ambSombra'), ambBrillo = $('#ambBrillo');
  var videosCard = [];
  var copa = $('#copa'), canvas = $('#polvo'), ctx = canvas.getContext('2d');
  var pista = $('#pista'), declaraPals = $$('#declara .pal'), declaraSub = $('.declara-sub');
  var cards = $$('.card', pista), caras = cards.map(function (c) { return $('figure', c); }), medios = cards.map(function (c) { return $('figure img, figure video', c); });
  videosCard = cards.map(function (c) { return $('figure video', c); });

  /* precarga: cuando termina el contador, cada video se baja completo en segundo plano
     (de a uno: primero el torbellino, después las propuestas) y queda en memoria.
     Safari de iPhone no baja ni reproduce videos fuera de pantalla, así que precalentarlos
     con play no sirve; con el archivo ya en memoria arrancan al instante cuando aparecen. */
  var colaVideos = $$('.flota-video').filter(function (v) { return getComputedStyle(v).display !== 'none'; })
    .concat(videosCard.filter(Boolean));
  function precargar(i) {
    if (i >= colaVideos.length) return;
    var v = colaVideos[i], fuente = $('source', v), url = fuente ? fuente.src : v.currentSrc;
    var sig = function () { setTimeout(function () { precargar(i + 1); }, 60); };
    if (!url || !window.fetch || !window.URL || !window.Blob || v._blob) { sig(); return; }
    fetch(url).then(function (r) { if (!r.ok) throw new Error('video'); return r.blob(); }).then(function (b) {
      var u = URL.createObjectURL(new Blob([b], { type: 'video/mp4' }));
      v._blob = u;
      v.src = u;                       // el atributo src manda sobre el <source>
      v.load();
      if (v._quiero) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      sig();
    }).catch(sig);
  }
  function arrancarPrecarga() { setTimeout(function () { precargar(0); }, 300); }
  if (terminado) arrancarPrecarga(); else alTerminar.push(arrancarPrecarga);
  var rielPie = $('#rielPie'), rielBarra = $('#rielBarra'), rielCuenta = $('#rielCuenta');
  var espacio = $('#espacio'), flotas = $$('.flota'), franjasBox = $('#franjas');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* la copa entra al mismo espacio 3D que las fotos: así las de adelante le pasan por delante
     y las de atrás quedan detrás del trago */
  espacio.appendChild(copa);
  espacio.appendChild(canvas);   // las partículas quedan entre las fotos de atrás y las de adelante

  /* torbellino de fotos: ángulo de partida, altura (fracción de pantalla), ancho, radio relativo,
     cuánto suben en la espiral y en qué momento del torbellino entran */
  var FOTOS = [
    { a: 0.0, y: -0.20, w: 270, rr: 1.00, dy: 0.10, t0: 0.00 },
    { a: 2.4, y: 0.16, w: 250, rr: 0.92, dy: -0.08, t0: 0.05 },
    { a: 4.8, y: -0.04, w: 330, rr: 1.08, dy: 0.12, t0: 0.10 },
    { a: 1.2, y: 0.26, w: 230, rr: 0.96, dy: -0.10, t0: 0.15 },
    { a: 3.6, y: -0.28, w: 240, rr: 1.04, dy: 0.08, t0: 0.20 },
    { a: 5.9, y: 0.08, w: 260, rr: 0.88, dy: -0.12, t0: 0.25 },
    { a: 0.6, y: 0.30, w: 180, rr: 1.12, dy: 0.06, t0: 0.30 },
    { a: 3.0, y: 0.00, w: 240, rr: 1.15, dy: -0.06, t0: 0.34 },
    { a: 4.2, y: 0.22, w: 230, rr: 0.98, dy: 0.10, t0: 0.38 },
    { a: 5.3, y: -0.16, w: 280, rr: 1.10, dy: -0.08, t0: 0.42 }
  ];
  var FOTOS_MOVIL = [
    { a: 0.0, y: -0.22, w: 132, rr: 1.00, dy: 0.08, t0: 0.00 },
    { a: 2.1, y: 0.18, w: 124, rr: 0.95, dy: -0.08, t0: 0.08 },
    { a: 4.2, y: -0.04, w: 150, rr: 1.05, dy: 0.10, t0: 0.16 },
    { a: 1.05, y: 0.27, w: 116, rr: 1.00, dy: -0.06, t0: 0.24 },
    { a: 3.15, y: -0.27, w: 120, rr: 1.02, dy: 0.06, t0: 0.32 },
    { a: 5.25, y: 0.07, w: 128, rr: 0.92, dy: -0.10, t0: 0.40 }
  ];

  /* barrido de franjas onduladas */
  var COLORES = ['#E8B84B', '#DD9640', '#C8643B', '#8C4024', '#3A2418', '#120F0C'];
  var ola = 'M0,40 C120,8 240,8 360,30 S600,58 720,34 S960,4 1080,22 S1320,56 1440,30 L1440,60 L0,60 Z';
  franjasBox.innerHTML = COLORES.map(function (c, i) {
    return '<div class="franja" style="background:' + c + ';z-index:' + (i + 1) + '"><svg viewBox="0 0 1440 60" preserveAspectRatio="none"><path fill="' + c + '" d="' + ola + '" transform="translate(' + (i % 2 ? -180 : 0) + ',0) scale(1.15,1)"/></svg></div>';
  }).join('');
  var franjas = $$('.franja', franjasBox);

  /* ── partículas: cuadraditos sueltos de tamaños mezclados que se posan sobre una copa 3D ──
     La copa es un cuerpo de revolución: de su silueta sale el radio de cada altura y con eso
     se arma la malla de alambre y la superficie donde caen las partículas. */
  var PALETA = ['rgb(246,236,214)', 'rgb(255,248,230)', 'rgb(234,205,146)', 'rgb(232,170,80)'];
  var ORO = 'rgb(246,214,138)';
  var P = { n: 0 }, PERFIL = { h: 0, r: null, c: null, acum: null, max: 1 };
  var vw = 0, vh = 0, cx = 0, cy = 0, copaW = 0, copaH = 0, piso = 0, caidaMax = 0, giroMax = 0;
  var FOCO = 900, TILT = -0.16, ct = Math.cos(TILT), st = Math.sin(TILT);
  var anchoPista = 0, offsets = [], cardW = 0;
  var S = { amb: 0, neon: 0, ambOut: 0, nube: 0, giro: 0, arma: 0, copa: 0, torb: 0, caida: 0, salp: 0, decl: 0, x: 0, pie: 0, franja: 0 };
  /* geometría de la foto del bar: el vaso ocupaba este recuadro (fracciones de la foto original) */
  var VASO = { x0: 0.3086, x1: 0.6379, y0: 0.1622, y1: 0.9074 }, NEON = { x0: 0.08, x1: 0.70, y0: 0.19, y1: 0.29 };
  var ambL = 0, ambT = 0, ambW = 0, ambH = 0;
  var cache = {};
  var easeIO = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  function perfilar() {
    copaH = copa.offsetHeight; copaW = copa.offsetWidth;
    var w = Math.round(copaW), h = Math.round(copaH);
    if (!w || !h) return false;
    var off = document.createElement('canvas');
    off.width = w; off.height = h;
    var oc = off.getContext('2d', { willReadFrequently: true });
    oc.drawImage(copa, 0, 0, w, h);
    var data = oc.getImageData(0, 0, w, h).data;
    var r = new Float32Array(h), c = new Float32Array(h);
    for (var y = 0; y < h; y++) {
      var a = -1, b = -1;
      for (var x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 110) { if (a < 0) a = x; b = x; }
      if (a < 0) { r[y] = 0; c[y] = 0; } else { r[y] = (b - a + 1) / 2; c[y] = (a + b) / 2 - w / 2; }
    }
    /* suavizado del radio para que la malla no tiemble */
    var rs = new Float32Array(h), cs = new Float32Array(h), k = 4;
    for (y = 0; y < h; y++) {
      var sr = 0, sc = 0, n = 0;
      for (var j = Math.max(0, y - k); j <= Math.min(h - 1, y + k); j++) { sr += r[j]; sc += c[j]; n++; }
      rs[y] = sr / n; cs[y] = sc / n;
    }
    var acum = new Float32Array(h), tot = 0, max = 1;
    for (y = 0; y < h; y++) { tot += Math.pow(rs[y], 0.8); acum[y] = tot; if (rs[y] > max) max = rs[y]; }
    PERFIL = { h: h, r: rs, c: cs, acum: acum, tot: tot, max: max };
    return true;
  }

  function filaAzar(u) {
    var objetivo = u * PERFIL.tot, lo = 0, hi = PERFIL.h - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (PERFIL.acum[mid] < objetivo) lo = mid + 1; else hi = mid; }
    return lo;
  }

  function sembrar() {
    if (!perfilar()) { P = { n: 0 }; return; }
    var movil = vw < 760, n = movil ? 720 : 1400, h = PERFIL.h;
    var seed = 11, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    P = {
      n: n,
      /* nube inicial (cilíndricas) */
      nr: new Float32Array(n), na: new Float32Array(n), ny: new Float32Array(n), nv: new Float32Array(n),
      /* destino sobre la copa */
      sy: new Float32Array(n), sr: new Float32Array(n), sc: new Float32Array(n), st: new Float32Array(n),
      libre: new Uint8Array(n), del: new Float32Array(n), tam: new Float32Array(n), col: new Uint8Array(n),
      vx: new Float32Array(n), vy: new Float32Array(n)
    };
    var radioNube = Math.min(vw * (movil ? 0.46 : 0.34), 560), altoNube = vh * 0.62;
    for (var i = 0; i < n; i++) {
      var u = rnd();
      P.nr[i] = radioNube * Math.sqrt(rnd()) * (0.35 + 0.65 * rnd());
      P.na[i] = rnd() * Math.PI * 2;
      P.ny[i] = (rnd() - 0.5) * altoNube * (0.5 + 0.5 * rnd());
      P.nv[i] = 0.7 + rnd() * 0.9;
      /* 18% quedan sueltas girando alrededor, como en la referencia */
      P.libre[i] = rnd() < 0.18 ? 1 : 0;
      var fila = filaAzar(rnd());
      P.sy[i] = fila - h / 2;
      P.sr[i] = PERFIL.r[fila] * (P.libre[i] ? 1.6 + rnd() * 2.4 : 0.96 + rnd() * 0.08);
      P.sc[i] = P.libre[i] ? 0 : PERFIL.c[fila];
      P.st[i] = rnd() * Math.PI * 2;
      if (P.libre[i]) P.sy[i] = (rnd() - 0.5) * h * 1.1;
      /* se arma de abajo hacia arriba, con algo de azar */
      P.del[i] = (fila / h) * -0.28 + 0.28 + rnd() * 0.16;
      /* tamaños: la mayoría chiquitos, algunos grandes */
      var t = Math.pow(rnd(), 3.2);
      P.tam[i] = (movil ? 1.3 : 1.5) + t * (movil ? 6 : 8.5);
      P.col[i] = t > 0.45 ? (rnd() < 0.6 ? 1 : 0) : (u < 0.45 ? 0 : u < 0.75 ? 2 : u < 0.92 ? 1 : 3);
      /* salpicadura */
      var ang = -Math.PI / 2 + (rnd() - 0.5) * 2.5;
      var vel = vh * (0.45 + rnd() * 1.3);
      P.vx[i] = Math.cos(ang) * vel * 0.9;
      P.vy[i] = Math.sin(ang) * vel;
    }
  }

  /* polvo en suspensión con la luz del bar: sube lento (depende del tiempo, no del scroll) */
  var POLVO = [];
  (function () {
    var seed = 5, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (var i = 0; i < 90; i++) POLVO.push({ u: rnd(), v: rnd(), f: 0.2 + rnd() * 0.5, ph: rnd() * 6.28, s: 0.6 + rnd() * 1.3, vel: 0.006 + rnd() * 0.014 });
  })();
  /* parpadeo del neón al prenderse: devuelve 0 (apagado) a 1 (prendido) */
  function neon(t) {
    if (t <= 0) return 0;
    if (t < 0.12) return t / 0.12 * 0.7;
    if (t < 0.2) return 0.08;
    if (t < 0.32) return 0.85;
    if (t < 0.38) return 0.25;
    if (t < 0.46) return 0.9;
    if (t < 0.5) return 0.55;
    return 0.75 + 0.25 * ss(0.5, 1, t);
  }

  /* lotes de dibujo: 4 colores × 4 niveles de opacidad, un Path2D por lote */
  var lotes = [];
  function lotesNuevos() { lotes = []; for (var i = 0; i < 16; i++) lotes.push(null); }
  function agregar(col, alfa, x, y, s) {
    if (alfa < 0.04) return;
    var b = col * 4 + (alfa > 0.8 ? 3 : alfa > 0.55 ? 2 : alfa > 0.3 ? 1 : 0);
    (lotes[b] || (lotes[b] = new Path2D())).rect(x - s / 2, y - s / 2, s, s);
  }
  var ALFAS = [0.22, 0.45, 0.7, 0.95];
  function volcar(mult) {
    for (var b = 0; b < 16; b++) {
      if (!lotes[b]) continue;
      var col = b >> 2;
      ctx.globalCompositeOperation = col === 1 ? 'lighter' : 'source-over';
      ctx.globalAlpha = ALFAS[b & 3] * mult;
      ctx.fillStyle = PALETA[col];
      ctx.fill(lotes[b]);
    }
  }

  /* proyección: x/y/z locales de la copa → pantalla (z positivo = lejos) */
  var PX = 0, PY = 0, PK = 1;
  function proyectar(x, y, z, ox, oy) {
    var y2 = y * ct - z * st, z2 = y * st + z * ct;
    var k = FOCO / (FOCO + z2);
    PX = ox + x * k; PY = oy + y2 * k; PK = k;
  }

  function malla(phi, alfa) {
    if (alfa < 0.02 || !PERFIL.h) return;
    var h = PERFIL.h, frente = new Path2D(), atras = new Path2D(), i, j;
    /* anillos */
    var anillos = vw < 760 ? 14 : 20, seg = 44;
    for (i = 1; i < anillos; i++) {
      var fila = Math.round(i / anillos * (h - 1)), r = PERFIL.r[fila], c = PERFIL.c[fila], y = fila - h / 2;
      if (r < 3) continue;
      var px0 = 0, py0 = 0, z0 = 0;
      for (j = 0; j <= seg; j++) {
        var a = j / seg * Math.PI * 2 + phi, x = c + r * Math.cos(a), z = r * Math.sin(a);
        proyectar(x, y, z, cx, cy);
        if (j > 0) { var p = (z + z0) > 0 ? atras : frente; p.moveTo(px0, py0); p.lineTo(PX, PY); }
        px0 = PX; py0 = PY; z0 = z;
      }
    }
    /* meridianos */
    var meri = vw < 760 ? 10 : 16, pasos = 60;
    for (i = 0; i < meri; i++) {
      var am = i / meri * Math.PI * 2 + phi, ca = Math.cos(am), sa = Math.sin(am), zz = 0, ant = false;
      for (j = 0; j <= pasos; j++) {
        var f2 = Math.round(j / pasos * (h - 1)), r2 = PERFIL.r[f2];
        if (r2 < 1.5) { ant = false; continue; }
        var x2 = PERFIL.c[f2] + r2 * ca, z2 = r2 * sa;
        proyectar(x2, f2 - h / 2, z2, cx, cy);
        var pp = z2 > 0 ? atras : frente;
        if (ant) { pp.moveTo(PX0, PY0); pp.lineTo(PX, PY); }
        var PX0 = PX, PY0 = PY; ant = true; zz = z2;
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgb(232,178,84)';
    ctx.globalAlpha = alfa * 0.22; ctx.stroke(atras);
    ctx.globalAlpha = alfa * 0.75; ctx.stroke(frente);
  }

  function dibujar(tiempo) {
    var W = canvas.width, H = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* polvo en suspensión, más denso cerca del trago */
    var aPolvo = neon(S.neon) * 0.6 * (1 - 0.6 * S.ambOut) * (1 - S.x);
    if (aPolvo > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = ORO;
      var tt = tiempo / 1000;
      for (var j = 0; j < POLVO.length; j++) {
        var q = POLVO[j], yy = 1 - ((q.v + tt * q.vel) % 1);
        var xx = vw / 2 + (q.u - 0.5) * Math.min(vw, ambW * 2.2) + Math.sin(tt * q.f + q.ph) * 16;
        var cerca = 1 - Math.min(1, Math.abs(xx - cx) / (vw * 0.5));
        ctx.globalAlpha = aPolvo * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(q.ph + tt * q.f * 2))) * (0.35 + 0.65 * cerca) * ss(0, 0.15, yy) * (1 - ss(0.85, 1, yy));
        ctx.fillRect(xx, yy * vh, q.s, q.s);
      }
    }

    var n = P.n, i;
    if (!n) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; return; }
    var phi = S.giro * Math.PI * 3.2;

    /* malla de alambre: aparece mientras se arma y se va cuando entra el trago real */
    malla(phi, ss(0.25, 0.75, S.arma) * (1 - ss(0.1, 0.9, S.copa)) * (1 - S.caida));

    /* nube → copa */
    if (S.nube > 0 && S.salp <= 0) {
      lotesNuevos();
      var giroNube = S.giro * Math.PI * 2.4;
      var ox = cx - vw * 0.05 * (1 - S.arma), oy = cy - vh * 0.06 * (1 - S.arma);
      var sale = 1 - ss(0.5, 1, S.caida);
      for (i = 0; i < n; i++) {
        /* posición en la nube: torbellino, el centro gira más rápido */
        var an = P.na[i] + giroNube * P.nv[i] * (1.3 - P.nr[i] / (vw * 0.5));
        var nx = P.nr[i] * Math.cos(an), nz = P.nr[i] * Math.sin(an), ny = P.ny[i];
        /* posición sobre la copa (o en su órbita, las sueltas) */
        var as = P.st[i] + phi * (P.libre[i] ? 0.6 : 1);
        var sx = P.sc[i] + P.sr[i] * Math.cos(as), sz = P.sr[i] * Math.sin(as), sy = P.sy[i];
        var t = clamp((S.arma - P.del[i]) / 0.55, 0, 1), e = easeIO(t);
        var x = nx + (sx - nx) * e, y = ny + (sy - ny) * e, z = nz + (sz - nz) * e;
        var oxx = ox + (cx - ox) * e, oyy = oy + (cy - oy) * e;
        proyectar(x, y, z, oxx, oyy + S.caida * caidaMax * (P.libre[i] ? 0 : 1));
        /* cuando entra el trago real, las pegadas a la copa se apagan y quedan las sueltas */
        var a = S.nube * clamp(0.2 + 0.75 * PK, 0, 1);
        a *= P.libre[i] ? (0.75 * sale) : (1 - 0.92 * ss(0, 0.8, S.copa));
        agregar(P.col[i], a, PX, PY, P.tam[i] * PK);
      }
      volcar(1);
    }

    /* la copa cae y queda apoyada: solo un destello cálido y suave en el piso al tocar */
    if (S.salp > 0 && S.salp < 1) {
      var fl = clamp(1 - S.salp * 2.5, 0, 1);
      if (fl > 0) {
        var gr = ctx.createRadialGradient(cx, piso, 0, cx, piso, vw * 0.28);
        gr.addColorStop(0, 'rgba(246,214,138,' + (0.32 * fl).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(246,214,138,0)');
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(0, 0, vw, vh);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* bucle de dibujo: solo mientras la escena está a la vista */
  var activo = false;
  function bucle(ts) { if (!activo) return; dibujar(ts); revisarVideos(); requestAnimationFrame(bucle); }
  function encender(v) { if (v === activo) return; activo = v; if (v) requestAnimationFrame(bucle); else { dibujar(0); render(); } }

  /* play/pause sin repetir llamadas */
  /* play/pause con reintento: si Safari rechaza o frena un video que tiene que correr,
     se le vuelve a dar play (como mucho cada 0,6 s) hasta que arranque */
  var todosVideos = [];
  function tocar(v, k, si) {
    v._quiero = si;
    if (todosVideos.indexOf(v) < 0) todosVideos.push(v);
    if (!si) { if (!v.paused) v.pause(); return; }
    if (!v.paused) return;
    var ahora = performance.now();
    if (v._intento && ahora - v._intento < 600) return;
    v._intento = ahora;
    var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
  }
  function revisarVideos() {
    for (var i = 0; i < todosVideos.length; i++) { var v = todosVideos[i]; if (v._quiero && v.paused) tocar(v, null, true); }
  }

  function poner(k, prop, el, v) {
    k = k + prop;
    if (cache[k] === v) return;
    cache[k] = v; el.style[prop] = v;
  }

  function render() {
    /* el bar: aparece, el neón se prende titilando, y después se apaga de a poco */
    var nn = neon(S.neon);
    poner('a', 'opacity', ambiente, (S.amb * (1 - 0.7 * S.ambOut) * (1 - 0.75 * S.x)).toFixed(3));
    poner('s', 'opacity', ambSombra, (1 - 0.9 * nn).toFixed(3));
    poner('b', 'opacity', ambBrillo, (nn * (1 - 0.5 * S.ambOut)).toFixed(3));

    /* copa */
    var op = S.copa * (1 - 0.55 * S.decl) * (1 - ss(0, 0.12, S.x));
    poner('c', 'opacity', copa, op.toFixed(3));
    poner('c', 'transform', copa, 'translate(-50%,-50%) translate3d(0,' + (S.caida * caidaMax).toFixed(1) + 'px,0) scale(' + (1 - 0.03 * Math.sin(Math.PI * clamp(S.salp * 3, 0, 1))).toFixed(4) + ',' + (1 - 0.06 * Math.sin(Math.PI * clamp(S.salp * 3, 0, 1))).toFixed(4) + ')');

    /* torbellino: las fotos giran alrededor de la copa con el scroll, entran desde afuera
       y salen despedidas cuando cae el trago */
    var movil = vw < 760, cfg = movil ? FOTOS_MOVIL : FOTOS, esc = movil ? 1 : Math.min(1.15, vw / 1440);
    var R = movil ? vw * 0.40 : Math.min(vw * 0.32, 500), vuelta = S.torb * Math.PI * 2 * 1.4;
    var sale = ss(0, 1, S.caida);
    for (var i = 0; i < flotas.length; i++) {
      var el = flotas[i], c = cfg[i];
      if (!c) { poner('f' + i, 'opacity', el, '0'); continue; }
      var ent = ss(c.t0, c.t0 + 0.22, S.torb), ee = 1 - Math.pow(1 - ent, 3);
      var o = ee * (1 - ss(0.15, 0.85, sale));
      var a = c.a + vuelta * (1 + 0.15 * (c.rr - 1) * 4);
      var rad = R * c.rr * (1 + 1.3 * (1 - ee)) * (1 + 1.8 * sale);
      /* órbita achatada en profundidad: las de adelante no tapan todo el trago */
      var X = Math.sin(a) * rad, Z = Math.cos(a) * rad * 0.55;
      var Y = (c.y + c.dy * (S.torb - 0.5)) * vh * (1 + 0.6 * (1 - ee));
      /* las de atrás, más tenues */
      var luzF = 0.5 + 0.5 * (Math.cos(a) + 1) / 2;
      poner('f' + i, 'opacity', el, (o * luzF).toFixed(3));
      if (el.tagName === 'VIDEO') tocar(el, 'f' + i, o > 0.02 && activo);
      if (o <= 0.001) continue;
      poner('f' + i, 'zIndex', el, Z > 0 ? '6' : '2');
      poner('f' + i, 'width', el, Math.round(c.w * esc) + 'px');
      poner('f' + i, 'transform', el, 'translate(-50%,-50%) translate3d(' + X.toFixed(1) + 'px,' + Y.toFixed(1) + 'px,' + Z.toFixed(0) + 'px) rotateY(' + (Math.sin(a) * 68).toFixed(1) + 'deg) rotateZ(' + (Math.sin(a * 0.5 + i) * 4).toFixed(2) + 'deg)');
    }

    /* declaración y propuestas */
    var dl = S.decl;
    for (i = 0; i < declaraPals.length; i++) {
      var lt = clamp(dl * 1.6 - i * 0.09, 0, 1), e3 = 1 - Math.pow(1 - lt, 3);
      poner('d' + i, 'transform', declaraPals[i], 'translate3d(0,' + ((1 - e3) * 135).toFixed(1) + '%,0)');
    }
    poner('ds', 'opacity', declaraSub, ss(0.6, 1, dl).toFixed(3));
    var tx = -(anchoPista - vw) * S.x;
    poner('p', 'transform', pista, 'translate3d(' + tx.toFixed(1) + 'px,0,0)');

    /* cada propuesta emerge de a una cuando llega: sube, aparece y la foto se destapa de abajo */
    var actual = -1, desde = vw * (movil ? 0.6 : 0.64), hasta = vw * (movil ? 0.98 : 0.96);
    for (i = 0; i < cards.length; i++) {
      var izq = offsets[i] + tx;
      var em = 1 - ss(desde, hasta, izq), ec = 1 - Math.pow(1 - em, 3);
      poner('k' + i, 'opacity', cards[i], ec.toFixed(3));
      poner('k' + i, 'transform', cards[i], 'translate3d(0,' + ((1 - ec) * 90).toFixed(1) + 'px,0)');
      if (caras[i]) {
        var ef2 = clamp(em * 1.15 - 0.1, 0, 1), ef3 = 1 - Math.pow(1 - ef2, 3);
        poner('kf' + i, 'clipPath', caras[i], 'inset(' + ((1 - ef3) * 100).toFixed(2) + '% 0 0 0)');
        poner('km' + i, 'transform', medios[i], 'scale(' + (1 + 0.16 * (1 - ef3)).toFixed(4) + ')');
      }
      if (izq < vw * 0.55) actual = i;
    }
    /* los videos de las tarjetas corren solo mientras su tarjeta está a la vista */
    for (i = 0; i < videosCard.length; i++) {
      if (!videosCard[i]) continue;
      var xp = offsets[i] + tx, emv = 1 - ss(desde, hasta, xp);
      tocar(videosCard[i], 'k' + i, emv > 0.3 && xp > -cardW * 0.85 && S.franja < 0.5 && activo);   // corre cuando la tarjeta ya se ve
    }
    poner('rp', 'opacity', rielPie, (S.pie * (1 - ss(0.2, 0.45, S.franja))).toFixed(3));
    poner('rb', 'transform', rielBarra, 'scaleX(' + S.x.toFixed(4) + ')');
    var etq = actual <= 0 ? 'La propuesta' : 'Propuesta ' + ('0' + actual).slice(-2) + ' / 08';
    if (rielCuenta.textContent !== etq) rielCuenta.textContent = etq;

    /* barrido de franjas */
    poner('pv', 'visibility', pista, S.franja > 0.62 ? 'hidden' : 'visible');
    for (i = 0; i < franjas.length; i++) {
      var lf = clamp((S.franja - i * 0.07) / 0.58, 0, 1);
      var ef = lf < 0.5 ? 2 * lf * lf : 1 - Math.pow(-2 * lf + 2, 2) / 2;
      poner('fr' + i, 'transform', franjas[i], 'translate3d(0,' + (120 - ef * 270).toFixed(2) + '%,0)');
    }
    if (!activo) dibujar(0);
  }

  /* ── la escena de la copa corre sola, por tiempo, como un video ──
     Al llegar a la sección se frena el scroll, corre la escena (unos 8 s) y se libera.
     Si se vuelve a subir y a entrar, se repite. Las propuestas siguen manejadas por el scroll. */
  var saltarShow = $('#saltarShow'), seguir = $('#seguir');
  var showHecho = false, showCorriendo = false, irDirecto = false, stNoche = null;
  var tlShow = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: render, onComplete: finShow })
    .to(S, { amb: 1, duration: 0.6 }, 0)
    .to(S, { neon: 1, duration: 1.0 }, 0.2)
    .to(S, { nube: 1, duration: 0.5 }, 0.3)
    .to(S, { giro: 1, duration: 5.2 }, 0.3)
    .to(S, { arma: 1, duration: 2.2, ease: 'power1.inOut' }, 0.7)
    .to(S, { copa: 1, duration: 0.5 }, 2.75)
    .to(S, { torb: 1, duration: 4.2 }, 1.0)
    .to(S, { caida: 1, duration: 0.6, ease: 'power2.in' }, 5.3)
    .to(S, { ambOut: 1, duration: 1.0 }, 5.5)
    .to(S, { salp: 1, duration: 1.0, ease: 'power1.out' }, 5.9)
    .to(S, { decl: 1, duration: 0.8, ease: 'power2.out' }, 6.9);
  function mostrarSaltar(si) { gsap.to(saltarShow, { autoAlpha: si ? 0.7 : 0, duration: 0.3 }); }
  function mostrarSeguir(si) { gsap.to(seguir, { opacity: si ? 0.8 : 0, duration: si ? 0.6 : 0.2 }); }
  function finShow() {
    showCorriendo = false; showHecho = true;
    lenis.start();
    mostrarSaltar(false);
    mostrarSeguir(true);
  }
  function arrancarShow(st) {
    if (showHecho || showCorriendo) return;
    /* si se llegó de un salto (link a "Cotizá", recarga más abajo) no se frena a nadie */
    if (irDirecto || st.scroll() - st.start > vh * 0.6) { tlShow.progress(1); showHecho = true; return; }
    showCorriendo = true;
    lenis.scrollTo(st.start, { immediate: true, force: true });
    lenis.stop();
    mostrarSaltar(true);
    tlShow.restart();
  }
  function reiniciarShow() {
    if (showCorriendo) lenis.start();
    showCorriendo = false; showHecho = false;
    tlShow.pause(0);
    mostrarSaltar(false); mostrarSeguir(false);
  }
  saltarShow.addEventListener('click', function () { if (showCorriendo) tlShow.progress(1); });
  /* los links internos (Cotizá, preguntas) saltan la escena en vez de frenarse en el medio */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    irDirecto = true;
    setTimeout(function () { irDirecto = false; }, 2500);
  });

  var tlNoche = null;
  function construir() {
    vw = window.innerWidth;
    vh = pin.clientHeight || window.innerHeight;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    cx = vw / 2; cy = vh * (vw < 760 ? 0.5 : 0.53);
    FOCO = vw < 760 ? 700 : 1000;
    espacio.style.perspective = (vw < 760 ? 800 : 1400) + 'px';
    /* la foto del bar se escala para que el vaso original quede justo debajo de la copa */
    var hc = copa.offsetHeight;
    ambH = hc / (VASO.y1 - VASO.y0); ambW = ambH * 1065 / 1600;
    ambL = cx - ambW * (VASO.x0 + VASO.x1) / 2; ambT = cy - ambH * (VASO.y0 + VASO.y1) / 2;
    ambCerca.style.width = ambW.toFixed(1) + 'px'; ambCerca.style.height = ambH.toFixed(1) + 'px';
    ambCerca.style.transform = 'translate3d(' + ambL.toFixed(1) + 'px,' + ambT.toFixed(1) + 'px,0)';
    var bw = ambW * 1.5, bh = ambH * 0.5;
    ambBrillo.style.width = bw.toFixed(1) + 'px'; ambBrillo.style.height = bh.toFixed(1) + 'px';
    ambBrillo.style.transform = 'translate3d(' + (ambL + ambW * (NEON.x0 + NEON.x1) / 2 - bw / 2).toFixed(1) + 'px,' + (ambT + ambH * (NEON.y0 + NEON.y1) / 2 - bh / 2).toFixed(1) + 'px,0)';
    sembrar();
    piso = vh * 0.94;
    caidaMax = Math.max(0, piso - (cy + copaH / 2));   // la base de la copa apoya en el piso
    anchoPista = pista.scrollWidth;
    offsets = cards.map(function (c) { return c.offsetLeft; });
    cardW = cards[0] ? cards[0].offsetWidth : 300;
    cache = {};

    var prog = tlNoche ? tlNoche.progress() : 0;
    if (tlNoche) tlNoche.kill();
    var D = Math.max(anchoPista - vw, vh);
    /* el scroll ya no maneja la escena de la copa: solo el paso lateral de las propuestas */
    var X0 = vh * 0.35;
    tlNoche = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: function () { render(); if (S.x > 0.02) mostrarSeguir(false); } })
      .to(S, { x: 1, duration: D }, X0)
      .to(S, { pie: 1, duration: vh * 0.2 }, X0)
      .to(S, { franja: 1, duration: vh * 1.1 }, X0 + D + vh * 0.1)
      .to({}, { duration: vh * 0.1 }, X0 + D + vh * 1.2);

    var total = tlNoche.duration();
    noche.style.height = (total + vh) + 'px';
    ScrollTrigger.getAll().forEach(function (st) { if (st.vars && st.vars.id === 'noche') st.kill(); });
    stNoche = ScrollTrigger.create({
      id: 'noche', trigger: noche, start: 'top top', end: '+=' + total,
      onUpdate: function (st) { tlNoche.progress(st.progress); },
      onToggle: function (st) { encender(st.isActive); },
      onEnter: function (st) { arrancarShow(st); },
      onLeaveBack: function () { reiniciarShow(); }
    });
    tlNoche.progress(prog);
    /* si la página arranca más abajo de la escena (recarga, link directo), queda terminada */
    if (!showHecho && !showCorriendo && stNoche.scroll() > stNoche.start + vh * 0.6) { tlShow.progress(1); showHecho = true; }
    render();
  }

  /* entrada suave de cotizador y formulario */
  $$('.cot-izq, .cot-der, .dist-izq, .form').forEach(function (el) {
    gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  function listo() { construir(); ScrollTrigger.refresh(); }
  var copaLista = copa.complete && copa.naturalWidth ? Promise.resolve() : new Promise(function (r) { copa.addEventListener('load', r, { once: true }); copa.addEventListener('error', r, { once: true }); });
  Promise.all([copaLista, document.fonts ? document.fonts.ready : Promise.resolve()]).then(listo);

  var anchoPrevio = window.innerWidth, altoPrevio = window.innerHeight, espera;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(function () {
      var w = window.innerWidth, h = window.innerHeight;
      if (w === anchoPrevio && Math.abs(h - altoPrevio) < 140) return;
      anchoPrevio = w; altoPrevio = h;
      listo();
    }, 220);
  });
})();
