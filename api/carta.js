// api/carta.js
// Intermediario de lectura para las cartas: pide la carta al Web App del Sheet de cada local
// y la deja guardada en la red de Vercel, así los clientes la reciben al instante.
//
//  - Copia fresca durante 60 s; después se sigue sirviendo la última copia mientras se
//    actualiza por detrás (hasta 1 día). Si Google falla, se sirve la última copia buena.
//  - Solo lee (GET). Visitas, likes y el panel siguen yendo directo al Apps Script.
//  - Lista cerrada de locales: no sirve como proxy abierto.

const LOCALES = {
  chiringuito: 'https://script.google.com/macros/s/AKfycbyfEynCpShkMtsGMq4wt7JBQIBqWSS74sUvsZdddnHNOW8EJv8u21X8jLGpMxtWlShHKg/exec',
  lounge: 'https://script.google.com/macros/s/AKfycbzOW8QgMiXCM8auujV9DFwGhgvB-yTPk4ukog-SOc4GZTgtfvwraSMmZhMR1fQTJPbX/exec',
  focacceria: 'https://script.google.com/macros/s/AKfycbwwh2wNmw3i1Wx7v6r1QMt8yfLIkXtENxqXkfa_nFKFZioQsC-tJjOSEGBZbBzz1jxf/exec'
}
const ESPERA_MAXIMA = 9000; // ms

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ ok: false, error: 'metodo_no_permitido' });
  }
  const local = String((req.query && req.query.local) || '').toLowerCase();
  const destino = LOCALES[local];
  if (!destino) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ ok: false, error: 'local_desconocido' });
  }

  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ESPERA_MAXIMA);
  try {
    const r = await fetch(destino, { redirect: 'follow', signal: corte.signal });
    const texto = await r.text();
    let datos;
    try { datos = JSON.parse(texto); } catch (e) { datos = null; }
    if (!r.ok || !datos || !Array.isArray(datos.secciones)) {
      throw new Error('respuesta_invalida_' + r.status);
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Navegador: siempre pregunta (max-age=0). Red de Vercel: 60 s fresca + copia vieja mientras actualiza.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400, stale-if-error=86400');
    return res.status(200).send(texto);
  } catch (e) {
    // No se guarda el error: la red de Vercel sigue sirviendo la última copia buena si la tiene.
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ ok: false, error: 'no_se_pudo_leer_la_carta' });
  } finally {
    clearTimeout(reloj);
  }
}
