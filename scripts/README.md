# scripts

## `watch-lookalikes.mjs` — vigilancia de dominios clon

Busca a diario dominios que suplantan a ROOTS Barefoot. Se escribió tras
detectar `rootsbarefootstudio.shop`, una tienda falsa que copiaba el catálogo
público de Shopify y robaba tarjetas a través de un panel en `radive.shop`.

```bash
node scripts/watch-lookalikes.mjs           # sólo lo nuevo
node scripts/watch-lookalikes.mjs --all     # todo lo encontrado
node scripts/watch-lookalikes.mjs --no-ct   # sin crt.sh, más rápido
```

Sale con código 1 cuando aparece un dominio nuevo. Sin dependencias.

### Dos fuentes, porque ninguna basta

**Certificate Transparency (crt.sh).** Todo dominio que se levanta con HTTPS deja
huella pública, normalmente el mismo día, y se puede buscar por subcadena, así
que encuentra nombres que no habríamos imaginado. También es poco fiable:
devuelve 502 a menudo y su búsqueda por comodín contesta `[]` con HTTP 200
aunque existan certificados. Por eso el script lanza una consulta de control
contra nuestro propio dominio: si ni eso trae datos, avisa de que la pasada va
incompleta en lugar de informar de que no hay novedades.

**Barrido de variantes por DNS.** 510 candidatos generados combinando raíces,
sufijos y TLDs, resueltos directamente. Más limitado, pero no depende de nadie y
siempre responde.

### Huella del kit

De cada dominio encontrado se descarga `/payment-vanilla.iife.js` y se compara
su SHA-256 con `e6c60ca4f996b209bbaf7429182d7ed76acf761bb9c1de63486fcb76635fa58c`,
el kit de robo de tarjetas que comparten las tiendas falsas de esa red. Si
coincide, el dominio se marca en el informe.

### Ejecución automática

`.github/workflows/watch-lookalikes.yml` lo lanza a las 06:17 UTC. Cuando
aparece un dominio nuevo el job **falla a propósito**, y GitHub envía entonces un
correo al propietario del repositorio. No abre un issue de forma deliberada:
este repositorio es público y eso haría visible lo que se vigila.

El estado vive en la caché de Actions, no en commits. Guardarlo es un paso
`always()` aparte porque la caché no se escribe cuando un job falla, y si no el
mismo dominio se reportaría cada mañana.

Los workflows programados sólo se ejecutan desde la rama por defecto, y GitHub
los desactiva en repositorios públicos tras 60 días sin actividad (avisa por
correo y se reactivan con un clic).

### Mantenimiento

Cuando se confirme que un dominio es nuestro, añadirlo al conjunto `PROPIOS`
para que deje de aparecer. `lookalikes-seen.json` es la semilla del estado: evita
que la primera ejecución en un entorno limpio avise de lo ya conocido.
