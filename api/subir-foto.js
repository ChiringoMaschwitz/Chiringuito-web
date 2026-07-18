// api/subir-foto.js
// Recibe {nombre, base64} y sube el archivo a carta/lounge/fotos/ en GitHub.
// Necesita la variable de entorno GITHUB_TOKEN configurada en Vercel (nunca en el código).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'metodo_no_permitido' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: 'falta_configurar_github_token_en_vercel' });
  }

  const { nombre, base64, carpeta } = req.body || {};
  if (!nombre || !base64) {
    return res.status(400).json({ ok: false, error: 'faltan_datos' });
  }
  if (!/^[a-z0-9._-]+$/i.test(nombre)) {
    return res.status(400).json({ ok: false, error: 'nombre_invalido' });
  }

  const repo = 'ChiringoMaschwitz/Chiringuito-web';
  const ruta = `${carpeta || 'carta/lounge/fotos'}/${nombre}`;
  const url = `https://api.github.com/repos/${repo}/contents/${ruta}`;

  try {
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: `Foto nueva vía panel: ${nombre}`,
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
