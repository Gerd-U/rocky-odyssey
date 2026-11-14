# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Evaluadores del NASA Space Apps Challenge: revisan el proyecto en poco tiempo y necesitan entender la idea y ver que funciona.
- Público curioso por el espacio: llega a explorar y no tiene por qué saber qué es un "análogo".
- Compañeros del equipo y de la comunidad del reto.

Ninguno llega con contexto previo: la web tiene que explicarse sola.

## Product Purpose

Rocky Odyssey muestra lugares de la Tierra que se parecen a las zonas candidatas para bases permanentes en la Luna y en Marte. Sirven para entrenar tripulaciones y probar tecnología antes de salir del planeta.

En los primeros segundos el visitante tiene que:
- ver que un lugar de la Tierra se parece de verdad a una zona de la Luna o Marte;
- entender para qué sirven esos lugares (entrenar y probar antes de ir);
- poder explorar dónde están en el mundo y abrir cualquiera.

## Positioning

Cada lugar de la Tierra se presenta junto a su base gemela concreta en la Luna o Marte (`site.analogOf`), con los mismos factores medidos en los dos lados: lluvia anual, temperatura mínima y máxima, y terreno.

## Operating Context

Proyecto para el NASA Space Apps Challenge. Se ve en escritorio durante la evaluación y en móvil cuando se comparte.

## Capabilities and Constraints

- Frontend: React + Vite + Tailwind v4, globo 3D con react-globe.gl.
- Backend en Python (pendiente). Hasta entonces los datos salen de `frontend/src/data/*.mock.json`.
- Modo Luna / Marte que filtra todo el contenido.
- 11 sitios en la Tierra y 6 bases: en la Luna, Shackleton (polo sur), el pozo de Marius Hills y el Mar de la Tranquilidad; en Marte, Jezero, Arcadia Planitia y Gale. Cada sitio apunta a la base con la que comparte el motivo del parecido (frío polar, tubos de lava, basalto, cráteres).
- **Sin decidir:** cómo se calcula el porcentaje de similitud. Los valores actuales son provisionales; no presentarlos como resultado de un modelo.
- Las temperaturas de las bases son aproximadas.

## Evidence on Hand

- Fotos reales con licencia abierta de cada sitio y base en `frontend/public/images/`, con créditos en `frontend/src/data/credits.json`.
- Texturas de la Tierra, la Luna y Marte en `frontend/public/textures/`.
- Misiones y estudios reales asociados a cada sitio (en los datos).
- No hay testimonios, cifras de uso ni avales: no inventarlos.

## Product Principles

- Mostrar antes que explicar: el parecido se ve en fotos reales, no se afirma.
- Cada dato de la Tierra va junto a su equivalente en el destino.
- Contexto primero: nadie llega sabiendo qué es un análogo.
- Honestidad con los datos: lo provisional se dice provisional.
