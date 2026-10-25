/**
 * Comprueba que cada referencia local de las paginas exista en disco.
 *
 * En un sitio estatico sin build no hay nada que avise de un `src` mal escrito:
 * el fallo se ve en produccion como una imagen rota o un video que no carga.
 * Esto lo caza antes.
 *
 * Solo se miran rutas locales; las absolutas (http, mailto, tel, #, data:)
 * quedan fuera a proposito, porque validarlas exigiria salir a la red.
 *
 *   node tools/check-links.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PAGINAS = ['index.html', 'checkout.html', 'navbar/login.html'];
const EXTERNA = /^(https?:|mailto:|tel:|#|data:|javascript:|\/\/)/i;

let revisadas = 0;
const rotas = [];

for (const pagina of PAGINAS) {
  const base = dirname(pagina);
  const html = readFileSync(pagina, 'utf8');

  for (const [, referencia] of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    if (EXTERNA.test(referencia) || referencia.trim() === '') continue;

    revisadas++;
    const limpia = decodeURIComponent(referencia.split('?')[0].split('#')[0]);
    if (!existsSync(join(base, limpia))) {
      rotas.push({ pagina, referencia });
    }
  }
}

for (const { pagina, referencia } of rotas) {
  console.error(`ROTA  ${pagina} -> ${referencia}`);
}

console.log(`${revisadas} referencias locales revisadas, ${rotas.length} rotas`);

if (rotas.length > 0) process.exit(1);
