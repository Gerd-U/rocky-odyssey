# Metodología

Cómo se calculan los datos que muestra Rocky Odyssey: 13 lugares de la Tierra y 4
bases (2 en la Luna y 2 en Marte). Todo sale de los archivos de esta carpeta; los
números de este documento son los que dan los scripts hoy.

## 1. Las tres variables

Las tres se calculan igual en los tres cuerpos, con la fuente de datos que hay en
cada uno.

### Rugosidad (m)

Desviación estándar (con `ddof=0`, como `np.std`) de 9 elevaciones tomadas en una
cuadrícula de 3 × 3 alrededor del lugar, redondeada a 1 decimal.

| Cuerpo | Fuente | Cuadrícula | Script |
| --- | --- | --- | --- |
| Tierra | ASTER GDEM v3 (`ASTGTM_NC.003`) vía NASA AppEEARS | paso de 0,05° | `metricas_tierra.py` |
| Luna, Pozo Mare Tranquillitatis | LRO LOLA DEM global 128 ppd (Moon Trek) | centro + extremos de 4 perfiles | `rugosidad_mare.py` |
| Luna, Shackleton (borde) | LRO LOLA DEM polar 87,5° (Moon Trek) | igual que el pozo | `rugosidad_shackleton.py` |
| Marte | MGS MOLA DEM 463 m (USGS) | 5,5 km | `mars_roughness.py` |

### Rango térmico

Diferencia media entre la temperatura alta y la baja. Una diferencia en °C es
igual que en K, así que la Tierra (°C) y las bases (K) se pueden comparar.

- **Tierra:** promedio anual de (día − noche) con las temperaturas de superficie de
  MODIS (`MOD11A2.061`, `LST_Day_1km` y `LST_Night_1km`, 2023), solo en las fechas
  que tienen los dos valores (`metricas_tierra.py`).
- **Marte:** promedio de las 4 máximas diarias menos promedio de las 4 mínimas
  (Ls 0, 90, 180 y 270), con la temperatura del aire a 2 m de la Mars Climate
  Database (`mcd_range.py`).
- **Luna:** máxima menos mínima publicadas (Williams et al. 2017) para el pozo
  (`luna_final.py`). Para Shackleton, contraste entre el borde y el fondo (ver
  limitaciones).

### Índice de frío (%)

Porcentaje de los 12 meses con temperatura media bajo 0 °C, redondeado a entero.

- **Tierra:** media mensual de (día + noche) / 2 con MODIS 2023. Un mes sin datos
  cuenta como "no bajo 0 °C" (le pasa a Salar de Uyuni, con 9 meses con dato).
- **Luna y Marte:** se usa la misma fórmula, con las temperaturas medias de los
  logs. Las 4 bases dan 100.

Cada valor de la Tierra, con su producto, fórmula, URL y fecha, está en
`sources_log_tierra.csv`; los de la Luna y Marte, en `sources_log_moon.csv` y
`sources_log_mars.csv`.

## 2. Similitud

`scripts/similitud_config.py` da una similitud de 0 a 100 para cada criterio, con
`a` = valor del lugar de la Tierra y `b` = valor de la base:

| Criterio | Variable | Fórmula |
| --- | --- | --- |
| `topography` | rugosidad | `100 × max(0, 1 − abs(log10(1 + a) − log10(1 + b)) / 2)` |
| `temperature` | rango térmico | `100 × max(0, 1 − abs(a − b) / ESCALA)`, con ESCALA = 300 en la Luna y 100 en Marte |
| `ice_water` | índice de frío | `100 − abs(a − b)` |

La rugosidad se compara en escala logarítmica porque va de unos pocos metros a
cientos: 10 m frente a 100 m es la misma distancia que 100 m frente a 1000 m. Si
falta uno de los dos valores, ese criterio queda sin dato (`None`).

Las tres similitudes pasan a `calculate_score` de
`backend/app/services/scoring.py` con peso 1 cada una. El score es el promedio
ponderado de los criterios con dato. Los otros cuatro criterios de `scoring.py`
(geología, polvo y atmósfera, habitabilidad y subsuelo) todavía no tienen datos,
por eso la cobertura de cada par es 3 / 7 = 42,86 %.

`scripts/generar_web.py` compara cada lugar con todas las bases y guarda, para la
Luna y para Marte, la base con mejor score. La web muestra ese score de 0 a 1 como
porcentaje.

## 3. Limitaciones

- **Cuadrícula de la Tierra.** Los puntos de AppEEARS se pidieron con un paso de
  0,05° (`generar_puntos.py`), no de 5,5 km como en Marte. En sentido norte-sur son
  unos 5,6 km en todos los sitios, pero en sentido este-oeste la separación
  depende de la latitud (0,05 × 111,32 × cos(lat)): de unos 1,2 km en McMurdo y
  1,4 km en Isla Devon a 5,4 km en Danakil. En los sitios polares la cuadrícula es
  más estrecha, así que la rugosidad puede quedar subestimada.
- **Rango térmico, dos medidas distintas.** En la Tierra es la temperatura de la
  superficie (MODIS) y en Marte la del aire a 2 m (MCD); la superficie varía más
  que el aire.
- **Rango térmico en los polos de la Tierra.** McMurdo (1,8 °C) e Isla Devon
  (2,3 °C) salen muy bajos porque en latitudes polares las pasadas de día y de
  noche del satélite ocurren a horas parecidas. No representa el ciclo diario real.
- **Fechas con nulos.** Hay fechas sin temperatura de día o de noche que se
  excluyen: Salar de Uyuni tiene 15 (de 46), Depresión de Danakil y Taklamakán 1
  cada uno, y los demás ninguna.
- **Shackleton.** Su rango térmico (130 K) es una aproximación: el contraste entre
  el borde (~220 K) y el fondo (~88 K), no un rango diario. El log lo marca como
  PROVISIONAL y la web lo muestra con la etiqueta "aproximación". Sus coordenadas
  (-89,9°, 0°) no están en los scripts ni en los logs: se tomaron del `bases.json`
  anterior.
- **Índice de frío en las bases.** Las 4 bases dan 100, así que en la práctica este
  criterio mide qué tan frío es el lugar de la Tierra: McMurdo (100) se parece más
  y Atacama (0) menos, sea cual sea la base.
- **Solo 4 bases medidas.** Marius Hills y Gale, que estaban en la versión anterior
  de la web, salieron por falta de datos. Con 2 bases por cuerpo, la mayoría de los
  lugares terminan emparejados con la misma (en Marte, 10 de 13 con Jezero).

## 4. Cómo actualizar los datos

Desde la raíz del repo, en este orden:

```powershell
python datos/scripts/metricas_tierra.py   # Tierra -> datos_limpios/tierra.csv, tierra_detalle.json y sources_log_tierra.csv
python datos/scripts/unir_objetivos.py    # Luna y Marte -> datos_limpios/objetivos.csv
python datos/scripts/generar_web.py       # backend/data/sites.json y bases.json, y los mocks del frontend
```

`metricas_tierra.py` y `generar_web.py` usan solo la biblioteca estándar de
Python; `unir_objetivos.py` necesita pandas (`requirements.txt`). Los textos de
cada lugar (nombre, país y descripción en español e inglés) están en
`textos_sitios.json`; las entradas con `"review": true` están pendientes de
revisión del equipo. Una base nueva en `objetivos.csv` entra sola en la web; si no
tiene textos ni coordenadas en `generar_web.py`, el script lo avisa.
