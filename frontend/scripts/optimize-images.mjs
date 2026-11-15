// Genera versiones optimizadas de las fotos de public/images.
//
// Por cada JPG (también en subcarpetas, salvo optimized/) escribe en public/images/optimized/
// la misma ruta relativa con:
//   <nombre>-800.webp, <nombre>-1600.webp, <nombre>-2400.webp  (WebP calidad 88)
//   <nombre>.jpg                                               (respaldo, JPEG calidad 90, sin metadatos)
// Las fotos más pequeñas que un tamaño no se agrandan: ese archivo queda con su ancho original.
// Los originales no se tocan. Además escribe src/data/optimized-images.json con el ancho real
// de cada versión, que usa src/lib/images.ts para armar srcset.
//
// Uso: npm run images

import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const IMAGES_DIR = path.join(PUBLIC_DIR, "images");
const OUT_DIR = path.join(IMAGES_DIR, "optimized");
const MANIFEST = path.join(ROOT, "src", "data", "optimized-images.json");

const WIDTHS = [800, 1600, 2400];
const WEBP_QUALITY = 88;
const JPEG_QUALITY = 90;

async function findJpgs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full !== OUT_DIR) found.push(...(await findJpgs(full)));
    } else if (/\.jpe?g$/i.test(entry.name)) {
      found.push(full);
    }
  }
  return found.sort();
}

const toUrl = (file) => "/" + path.relative(PUBLIC_DIR, file).split(path.sep).join("/");
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

async function optimize(file) {
  const rel = path.relative(IMAGES_DIR, file);
  const base = rel.replace(/\.jpe?g$/i, "");
  const outBase = path.join(OUT_DIR, base);
  await mkdir(path.dirname(outBase), { recursive: true });

  // rotate() aplica la orientación EXIF antes de quitar los metadatos
  const source = sharp(file).rotate();
  const { width: originalWidth } = await source.metadata();
  const widths = {};

  for (const width of WIDTHS) {
    const out = `${outBase}-${width}.webp`;
    const info = await source
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toFile(out);
    widths[width] = info.width;
  }

  const jpg = `${outBase}.jpg`;
  await source.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(jpg);

  const sizes = await Promise.all(
    [...WIDTHS.map((w) => `${outBase}-${w}.webp`), jpg].map(async (f) => (await stat(f)).size),
  );
  console.log(
    `${rel} (${originalWidth}px, ${kb((await stat(file)).size)}) -> ` +
      WIDTHS.map((w, i) => `${w}: ${widths[w]}px ${kb(sizes[i])}`).join(", ") +
      `, jpg ${kb(sizes.at(-1))}`,
  );

  return [toUrl(file), widths];
}

const files = await findJpgs(IMAGES_DIR);
const manifest = Object.fromEntries(await Promise.all(files.map(optimize)));
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${files.length} imágenes optimizadas en ${path.relative(ROOT, OUT_DIR)}`);
