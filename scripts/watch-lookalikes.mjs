#!/usr/bin/env node
/**
 * Vigilancia de dominios que suplantan a ROOTS Barefoot.
 *
 * Usa dos fuentes independientes, porque ninguna basta por sí sola:
 *
 *  1. Certificate Transparency (crt.sh). Todo dominio que se levanta con HTTPS
 *     deja huella pública, normalmente el mismo día. Permite buscar por
 *     subcadena, así que encuentra nombres que no habríamos imaginado. Su API
 *     se cae a menudo: si falla, se dice, no se silencia.
 *
 *  2. Barrido de variantes. Combina raíces, sufijos y TLDs y resuelve cada
 *     candidato por DNS. Es más limitado, pero no depende de nadie y siempre
 *     responde.
 *
 * De cada dominio encontrado se comprueba además si sirve el kit de robo de
 * tarjetas conocido, de forma que un clon de esa red se identifica al instante.
 *
 * Uso:
 *   node scripts/watch-lookalikes.mjs           # sólo lo nuevo
 *   node scripts/watch-lookalikes.mjs --all     # todo lo encontrado
 *   node scripts/watch-lookalikes.mjs --no-ct   # sin crt.sh (más rápido)
 *
 * Sale con código 1 si aparece algo nuevo, para que un cron avise por correo.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve4 } from 'node:dns/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ESTADO = join(AQUI, 'lookalikes-seen.json');

const PATRONES_CT = ['%rootsbarefoot%', '%roots-barefoot%'];

const RAICES = ['rootsbarefoot', 'roots-barefoot'];
const SUFIJOS = [
  '', 'studio', 'store', 'shop', 'official', 'oficial', 'outlet',
  'sale', 'sales', 'spain', 'es', 'online', 'shoes', 'barefoot', 'eu',
];
const TLDS = [
  'com', 'shop', 'store', 'online', 'site', 'xyz', 'top', 'vip',
  'net', 'es', 'eu', 'co', 'info', 'shoes', 'sale', 'life', 'club',
];

/** Dominios propios o ya revisados a mano: nunca avisan. */
const PROPIOS = new Set([
  'rootsbarefoot.com',
  'rootsbarefoot.store',
  'rootsbarefoot.es',
  'roots-barefoot.com',
]);

/** Huella del kit de robo de tarjetas de la red detectada el 2026-09-02. */
const KIT = {
  ruta: '/payment-vanilla.iife.js',
  sha256: 'e6c60ca4f996b209bbaf7429182d7ed76acf761bb9c1de63486fcb76635fa58c',
};

const TIMEOUT_MS = 20_000;
const CONCURRENCIA = 24;

async function pedir(url, opciones = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opciones, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Ejecuta tareas con concurrencia limitada. */
async function enLotes(elementos, tarea, limite = CONCURRENCIA) {
  const salida = [];
  for (let i = 0; i < elementos.length; i += limite) {
    salida.push(...(await Promise.all(elementos.slice(i, i + limite).map(tarea))));
  }
  return salida;
}

const raizDe = (dominio) => dominio.split('.').slice(-2).join('.');
const esPropio = (dominio) => PROPIOS.has(dominio) || PROPIOS.has(raizDe(dominio));

/**
 * Fuente 1: Certificate Transparency.
 * Devuelve { dominios, fallo } para poder distinguir "no hay nada" de "no pude mirar".
 */
async function consultarCT(patron, intentos = 3) {
  const url = `https://crt.sh/?q=${encodeURIComponent(patron)}&output=json`;
  let ultimoError = 'desconocido';
  for (let i = 1; i <= intentos; i++) {
    try {
      const res = await pedir(url, { headers: { 'User-Agent': 'roots-lookalike-watch' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const filas = await res.json();
      const dominios = new Map();
      for (const fila of filas) {
        for (const nombre of String(fila.name_value || '').split('\n')) {
          const dominio = nombre.trim().toLowerCase().replace(/^\*\./, '');
          if (!dominio || dominio.includes(' ')) continue;
          const desde = String(fila.not_before || '').slice(0, 10);
          const previo = dominios.get(dominio);
          if (!previo || desde < previo) dominios.set(dominio, desde);
        }
      }
      return { dominios, fallo: null };
    } catch (err) {
      ultimoError = err.message;
      if (i < intentos) await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
  return { dominios: new Map(), fallo: ultimoError };
}

/** Fuente 2: barrido de variantes por DNS. */
async function barrerVariantes() {
  const candidatos = [];
  for (const raiz of RAICES) {
    for (const sufijo of SUFIJOS) {
      for (const tld of TLDS) {
        candidatos.push(`${raiz}${sufijo}.${tld}`);
      }
    }
  }
  const unicos = [...new Set(candidatos)];
  const vivos = await enLotes(unicos, async (dominio) => {
    try {
      const ips = await resolve4(dominio);
      return ips.length ? dominio : null;
    } catch {
      return null;
    }
  });
  return { dominios: vivos.filter(Boolean), revisados: unicos.length };
}

/** ¿Sirve este dominio el kit de robo de tarjetas conocido? */
async function comprobarKit(dominio) {
  try {
    const res = await pedir(`https://${dominio}${KIT.ruta}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = createHash('sha256').update(buf).digest('hex');
    return { hash, coincide: hash === KIT.sha256, bytes: buf.length };
  } catch {
    return null;
  }
}

async function cargarEstado() {
  try {
    return new Set(JSON.parse(await readFile(ESTADO, 'utf8')));
  } catch {
    return new Set();
  }
}

async function main() {
  const listarTodo = process.argv.includes('--all');
  const sinCT = process.argv.includes('--no-ct');
  const conocidos = await cargarEstado();
  const hallados = new Map(); // dominio -> fecha o '' si viene del barrido
  const avisos = [];

  if (!sinCT) {
    console.log('1/2 Certificate Transparency…');

    // Consulta de control: nuestro propio dominio SIEMPRE tiene certificados.
    // Si crt.sh contesta 200 con una lista vacía, su índice no está sirviendo
    // datos y el resto de consultas darían falsos negativos en silencio.
    const control = await consultarCT('rootsbarefoot.com');
    if (control.fallo || control.dominios.size === 0) {
      avisos.push(
        `crt.sh no devuelve datos ni para nuestro propio dominio (${control.fallo || 'lista vacía'}). ` +
        'Se omite esta fuente: la pasada se apoya sólo en el barrido de variantes.',
      );
      PATRONES_CT.length = 0;
    }

    for (const patron of PATRONES_CT) {
      const { dominios, fallo } = await consultarCT(patron);
      if (fallo) {
        avisos.push(`crt.sh no respondió para "${patron}" (${fallo}). Esta pasada va incompleta.`);
        continue;
      }
      for (const [dominio, fecha] of dominios) {
        if (esPropio(dominio)) continue;
        const previo = hallados.get(dominio);
        if (previo === undefined || (fecha && fecha < previo)) hallados.set(dominio, fecha);
      }
    }
    // crt.sh responde a consultas de dominio exacto pero su búsqueda por
    // subcadena falla a menudo devolviendo listas vacías con HTTP 200. Si el
    // control trajo datos y los comodines no, es limitación del servicio, no
    // ausencia de clones.
    if (PATRONES_CT.length > 0 && hallados.size === 0) {
      avisos.push(
        'crt.sh responde, pero su búsqueda por subcadena no devuelve nada. ' +
        'Trátalo como fuente incompleta: lo fiable en esta pasada es el barrido.',
      );
    }
    console.log(`    ${hallados.size} dominio(s)`);
  }

  console.log('2/2 Barrido de variantes por DNS…');
  const { dominios: vivos, revisados } = await barrerVariantes();
  for (const dominio of vivos) {
    if (esPropio(dominio)) continue;
    if (!hallados.has(dominio)) hallados.set(dominio, '');
  }
  console.log(`    ${revisados} candidatos, ${vivos.length} resuelven`);

  const nuevos = [...hallados].filter(([d]) => !conocidos.has(d));
  const aMostrar = listarTodo ? [...hallados] : nuevos;

  console.log('');
  for (const aviso of avisos) console.log(`⚠️  ${aviso}`);

  if (aMostrar.length === 0) {
    console.log(`Sin novedades. ${hallados.size} dominio(s) bajo vigilancia.`);
  } else {
    console.log(`${nuevos.length} nuevo(s) de ${hallados.size} vigilados:\n`);
    const ordenados = aMostrar.sort((a, b) => (b[1] || '').localeCompare(a[1] || ''));
    for (const [dominio, fecha] of ordenados) {
      const kit = await comprobarKit(dominio);
      const marca = kit?.coincide
        ? '   ⚠️ SIRVE EL KIT DE ROBO DE TARJETAS'
        : kit
          ? `   (sirve ${KIT.ruta}, hash distinto: ${kit.hash.slice(0, 16)}…)`
          : '';
      console.log(`${conocidos.has(dominio) ? ' ' : '+'} ${(fecha || '  —  ').padEnd(10)} ${dominio}${marca}`);
    }
  }

  await writeFile(ESTADO, JSON.stringify([...hallados.keys()].sort(), null, 2) + '\n');
  console.log(`\nEstado en ${ESTADO}`);
  return nuevos.length > 0 ? 1 : 0;
}

main().then(
  (codigo) => process.exit(codigo),
  (err) => {
    console.error('Error inesperado:', err);
    process.exit(2);
  },
);
