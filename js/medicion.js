/* ══ Medición — Google Analytics 4 (G-PJ69CTBM5H) ══
   Se carga en todas las páginas con: <script src="/js/medicion.js" defer></script>
   Mide solo:
   - vistas de página (automático)
   - click_whatsapp, click_llamar, click_como_llegar, ver_carta, click_reservar, click_instagram
     (cada uno con el parámetro "local")
   - solicitud_cumple (lo dispara el formulario de /cumpleanos/ con window.medir)
   No manda datos personales: ni nombres, ni teléfonos de la gente, ni textos de formularios. */
(function () {
  var ID = 'G-PJ69CTBM5H';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('js', new Date());
  gtag('config', ID);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  /* evento con nombre y local */
  window.medir = function (evento, local, extra) {
    var p = { local: local || 'grupo', pagina: location.pathname };
    if (extra) for (var k in extra) p[k] = extra[k];
    try { window.gtag('event', evento, p); } catch (e) {}
  };

  /* de qué local es cada teléfono, ficha de Maps, carta o Instagram */
  var TEL = {
    '541140857072': 'chiringuito', '5491140857072': 'chiringuito',
    '5491124635464': 'lounge',
    '5491178196138': 'focacceria',
    '5491126091109': 'unapizza', '543484625434': 'unapizza',
    '5491144002737': 'bakery',
    '5491122721108': 'viandas'
  };
  var MAPS = {
    'ChIJEQoNyPKfvJURVYuNHd5OyAo': 'chiringuito',
    'ChIJNZFaVwCfvJURWEmqMPee-RM': 'lounge',
    'ChIJQX_VsSifvJUR7WaILC2fUBY': 'focacceria',
    'ChIJwRbxXQCfvJURKEn1wUjQrXE': 'unapizza'
  };
  var IG = {
    'elchiringuitook': 'chiringuito', 'chiringuito.lounge': 'lounge',
    'lafocacceria.elchiringuito': 'focacceria', 'unapizza.maschwitz': 'unapizza',
    'chirinbakery': 'bakery'
  };

  function localDe(a, href) {
    var marcado = a.closest('[data-local]');
    if (marcado) return marcado.getAttribute('data-local');
    var num = (href.match(/(?:wa\.me\/|tel:\+?)(\d+)/) || [])[1];
    if (num && TEL[num]) return TEL[num];
    var pid = (href.match(/query_place_id=([\w-]+)/) || [])[1];
    if (pid && MAPS[pid]) return MAPS[pid];
    var ig = (href.match(/instagram\.com\/([\w.]+)/) || [])[1];
    if (ig && IG[ig]) return IG[ig];
    var carta = (href.match(/\/(?:carta|reservas)\/(\w+)/) || [])[1];
    if (carta) return carta;
    if (/\/una-pizza\//.test(href)) return 'unapizza';
    return 'grupo';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var ev = null;
    if (/wa\.me\//.test(href)) ev = 'click_whatsapp';
    else if (/^tel:/.test(href)) ev = 'click_llamar';
    else if (/google\.[a-z.]+\/maps/.test(href)) ev = 'click_como_llegar';
    else if (/instagram\.com\/(?!reel)/.test(href)) ev = 'click_instagram';
    else if (/\/carta\/\w+\/?$|\/una-pizza\/(#carta)?$/.test(href)) ev = 'ver_carta';
    else if (/\/reservas(\/|$)/.test(href)) ev = 'click_reservar';
    if (ev) window.medir(ev, localDe(a, href));
  }, { capture: true, passive: true });
})();
