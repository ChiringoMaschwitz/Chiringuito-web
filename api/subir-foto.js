// api/subir-foto.js
// Recibe {nombre, base64, carpeta} desde los paneles de las cartas y sube la imagen al repo en GitHub.
// Necesita la variable de entorno GITHUB_TOKEN configurada en Vercel (nunca en el código).
//
// Seguridad (versión blindada):
//  - Solo acepta carpetas de fotos y promos de las cartas (lista cerrada).
//  - Solo acepta imágenes: extensión .jpg/.jpeg/.png/.webp y contenido real de imagen.
//  - Tope de peso por archivo.
//  - No puede pisar archivos existentes (GitHub rechaza la subida si el archivo ya existe).

const REPO = 'ChiringoMaschwitz/Chiringuito-web';
const CARPETA_DEFAULT = 'carta/lounge/fotos'; // el panel del Lounge no manda carpeta
const CARPETAS_PERMITIDAS = [
  'carta/chiringuito/fotos',
  'carta/chiringuito/promos',
  'carta/lounge/fotos',
  'carta/lounge/promos'
];
const PESO_MAXIMO = 3 * 1024 * 1024; // 3 MB ya decodificado (una foto comprimida por el panel pesa mucho menos)

function esImagenReal(buf) {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  // WEBP: "RIFF" .... "WEBP"
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'metodo_no_permitido' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: 'falta_configurar_github_token_en_vercel' });
  }

  const { nombre, base64, carpeta } = req.body || {};
  if (!nombre || !base64 || typeof nombre !== 'string' || typeof base64 !== 'string') {
    return res.status(400).json({ ok: false, error: 'faltan_datos' });
  }

  // Nombre: solo letras, números, punto, guion y guion bajo, y extensión de imagen.
  if (!/^[a-z0-9_-][a-z0-9._-]{0,99}\.(jpe?g|png|webp)$/i.test(nombre)) {
    return res.status(400).json({ ok: false, error: 'nombre_invalido' });
  }

  // Carpeta: solo las de la lista.
  const destino = carpeta ? String(carpeta).replace(/\/+$/, '') : CARPETA_DEFAULT;
  if (CARPETAS_PERMITIDAS.indexOf(destino) === -1) {
    return res.status(400).json({ ok: false, error: 'carpeta_no_permitida' });
  }

  // Contenido: base64 válido, imagen real y bajo el tope de peso.
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return res.status(400).json({ ok: false, error: 'contenido_invalido' });
  }
  const buf = Buffer.from(base64, 'base64');
  if (buf.length > PESO_MAXIMO) {
    return res.status(413).json({ ok: false, error: 'imagen_muy_pesada' });
  }
  if (!esImagenReal(buf)) {
    return res.status(400).json({ ok: false, error: 'no_es_una_imagen' });
  }

  const ruta = `${destino}/${nombre}`;
  const url = `https://api.github.com/repos/${REPO}/contents/${ruta}`;

  try {
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: `Imagen nueva vía panel: ${ruta}`,
        content: base64,
        branch: 'main'
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ ok: false, error: data.message || 'error_github' });
    }
    return res.status(200).json({ ok: true, nombre });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
