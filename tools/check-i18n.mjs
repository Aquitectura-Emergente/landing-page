/**
 * Comprueba que las traducciones esten completas.
 *
 * - en.json y es.json deben tener exactamente las mismas claves.
 * - Toda clave usada en el HTML (data-i18n, data-i18n-html, data-i18n-attr)
 *   y en los scripts (t('...') / i18n.t('...')) debe existir.
 *
 *   node tools/check-i18n.mjs
 */
import { readFileSync } from 'node:fs';

const IDIOMAS = ['en', 'es'];
const PAGINAS = ['index.html', 'checkout.html', 'navbar/login.html'];
const SCRIPTS = ['scripts/checkout.js', 'scripts/login-scripts.js'];

function aplanar(objeto, prefijo = '') {
  return Object.entries(objeto).flatMap(([clave, valor]) => {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave;
    return typeof valor === 'object' && valor !== null ? aplanar(valor, ruta) : [ruta];
  });
}

const claves = Object.fromEntries(
  IDIOMAS.map(idioma => [idioma, new Set(aplanar(JSON.parse(readFileSync(`i18n/${idioma}.json`, 'utf8'))))])
);

const errores = [];

for (const a of IDIOMAS) {
  for (const b of IDIOMAS) {
    if (a === b) continue;
    for (const clave of claves[a]) {
      if (!claves[b].has(clave)) errores.push(`Falta en ${b}.json: ${clave} (existe en ${a}.json)`);
    }
  }
}

const usadas = new Set();
for (const pagina of PAGINAS) {
  const html = readFileSync(pagina, 'utf8');
  for (const [, clave] of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) usadas.add(clave);
  for (const [, pares] of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const par of pares.split(';')) usadas.add(par.split(':')[1].trim());
  }
}
for (const script of SCRIPTS) {
  const js = readFileSync(script, 'utf8');
  for (const [, clave] of js.matchAll(/\bt\('([\w.]+)'/g)) usadas.add(clave);
}
// Claves que checkout.js arma con plantilla: checkout.plans.<id>.<campo>
for (const campo of ['segment', 'price', 'description', 'benefit1', 'benefit2', 'benefit3', 'benefit4']) {
  usadas.add(`checkout.plans.premium.${campo}`);
}

for (const clave of usadas) {
  for (const idioma of IDIOMAS) {
    if (!claves[idioma].has(clave)) errores.push(`Clave usada pero ausente en ${idioma}.json: ${clave}`);
  }
}

errores.forEach(error => console.error(error));
console.log(`${usadas.size} claves usadas, ${claves.en.size} definidas por idioma, ${errores.length} errores`);
if (errores.length > 0) process.exit(1);
