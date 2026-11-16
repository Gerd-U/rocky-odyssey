# Rocky Odyssey - Frontend

Web del proyecto para el reto de NASA Space Apps _"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars"_.

Stack: Vite + React + TypeScript, Tailwind CSS v4, React Router, Motion y react-globe.gl (three.js).

## Instalar y correr

Requiere Node 20 o superior.

```bash
cd frontend
npm install
cp .env.example .env   # si todavía no existe .env
npm run dev            # http://localhost:5173
```

Otros scripts:

- `npm run build`: chequeo de TypeScript y build de producción en `dist/`
- `npm run preview`: sirve el build
- `npm run lint`: oxlint

## Rutas

| Ruta              | Página                                          |
| ----------------- | ----------------------------------------------- |
| `/`               | Landing (Hero, globo, criterios, destacados)    |
| `/ubicaciones`    | Lista de sitios análogos con filtros            |
| `/ubicacion/:id`  | Detalle del sitio y su base en la Luna o Marte  |

## Datos del backend

Ningún componente hace `fetch` directo: todo pasa por `src/services/api.ts` (`getSites()`, `getSite(id)`, `getBases()`).
Los datos salen siempre del backend; ya no hay datos de prueba en el frontend.

| Variable       | Valor por defecto       | Efecto                                     |
| -------------- | ----------------------- | ------------------------------------------ |
| `VITE_API_URL` | `http://localhost:8000` | URL base del backend (sin `/api` al final) |

Para ver la web:

1. Levanta el backend (ver [`../backend/README.md`](../backend/README.md)). Tiene que responder `GET /api/sites`, `GET /api/sites/:id` y `GET /api/bases` con los tipos de `src/types/site.ts`, y permitir CORS desde el origen de Vite.
2. Si el backend no está en `http://localhost:8000`, pon su URL en `VITE_API_URL` dentro de `.env` y reinicia `npm run dev` (Vite solo lee `.env` al arrancar).

Si el backend responde con un código de error, `api.ts` lanza una excepción y las páginas muestran el mensaje de error.

> **Los datos de prueba son provisionales.** Las coordenadas de los sitios y las bases son reales, pero los valores de `factors` (precipitación, temperaturas, terreno) y `similarity` son aproximados y están puestos a mano para probar la interfaz. Hay que reemplazarlos por los que calcule el backend.

## Texturas de los globos

`GlobeView` busca las texturas en `public/textures/`:

- `earth.jpg`: si no está, usa como respaldo `https://unpkg.com/three-globe/example/img/earth-night.jpg`.
- `moon.jpg`: sin respaldo; mientras falte, el globo se ve liso.
- `mars.jpg`: sin respaldo; mientras falte, el globo se ve liso.

Las texturas tienen que estar en proyección equirectangular (relación 2:1). Con 2048×1024 o 4096×2048 alcanza; más grande pesa demasiado para la web. Dónde bajarlas:

- **Luna**: NASA Scientific Visualization Studio, _CGI Moon Kit_ (mosaico de color de la LRO): <https://svs.gsfc.nasa.gov/4720>. Baja el mapa de color en JPG o TIFF y conviértelo a `moon.jpg`.
- **Marte**: mosaico global a color del Viking (MDIM 2.1) publicado por USGS Astrogeology con datos de la NASA: <https://astrogeology.usgs.gov/search/map/mars_viking_global_color_mosaic_232m>. También hay texturas listas en el repositorio NASA 3D Resources: <https://github.com/nasa/NASA-3D-Resources> (carpeta _Images and Textures_).

Las fotos de cada sitio van en `public/images/<id>.jpg` (por ejemplo `public/images/atacama.jpg`).

## Estructura

```
src/
├── App.tsx               rutas y fondo de estrellas
├── index.css             Tailwind + @theme (colores, animación twinkle)
├── types/site.ts         Site, Base, Target (contrato con el backend)
├── services/api.ts       único acceso a datos (backend)
├── hooks/useSites.ts     useSites, useSite(id), useBases con loading/error
├── context/ModeContext   modo "moon" | "mars" y sitio seleccionado
├── data/                 JSON de prueba
├── pages/                Home, Locations, LocationDetail
└── components/
    ├── layout/           Navbar, Footer
    ├── home/             secciones de la landing
    ├── globe/            GlobeView (carga diferida), ModeToggle, Legend, colors
    ├── sites/            SiteCard, SitePanel, CompareBars, FilterBar
    └── ui/Reveal.tsx     animación al hacer scroll (respeta reduced motion)
```

El color de acento (`bg-accent`, `text-accent`...) cambia con el modo: `ModeContext` escribe `data-mode` en `<html>` e `index.css` redefine `--color-accent` según ese valor.

`GlobeView` se carga con `React.lazy`, así que three.js va en un chunk aparte y no frena la carga inicial. Por eso el build avisa que ese chunk pasa de 500 kB; es esperado.
