"""Mide bases nuevas de la Luna con las mismas fórmulas del equipo.

Uso, desde la raíz del repo (entorno de datos/requirements.txt):
    python datos/scripts/medir_bases_luna.py

Entradas:  datos/bases_luna_candidatas.csv (id, nombre, lat, lon, fuente_coordenadas, motivo)
Caché (se descarga solo lo que falte; luego corre sin red):
  datos/datos_crudos/lola_<id>_9puntos.csv   9 elevaciones del DEM
  datos/datos_crudos/diviner_<id>.csv        temperaturas bolométricas de Diviner por hora local
  datos/datos_crudos/validacion/             lo mismo para Shackleton y Tranquilidad
Salidas (solo si la validación de cada fuente pasa):
  datos/datos_limpios/targets_moon.csv y datos/sources_log_moon.csv (filas existentes intactas, sin duplicar)

Fórmulas:
  rugosidad  9 puntos (destino/nueve_puntos de moon_roughness.py, R = 1737.4 km, D = 5.5 km), std ddof=0, 1 decimal
             |lat| < 80: ldem_64_uint.tif (NASA SVS 4720) leído con elevacion() de moon_roughness.py
             |lat| >= 80: DEM polar de LOLA (PDS), CRS leído del archivo y puntos transformados con pyproj
  tmax_k / tmin_k  máximo y mínimo de la temperatura bolométrica de superficie de Diviner en la celda del punto,
             sobre todas las horas locales: GCP global (Williams et al. 2017) o PCP polar (Williams et al. 2019,
             verano e invierno). rango_termico = tmax_k - tmin_k. Todo a 1 decimal.
  hielo      100 si (tmax_k + tmin_k) / 2 < 273.15 K, si no 0
"""

import ast
import csv
import math
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

import numpy as np
import pyproj
import rasterio
import requests

BASE = Path(__file__).resolve().parent.parent
SCRIPTS = BASE / "scripts"
CRUDOS = BASE / "datos_crudos"
VALIDACION = CRUDOS / "validacion"
CANDIDATAS = BASE / "bases_luna_candidatas.csv"
TARGETS = BASE / "datos_limpios" / "targets_moon.csv"
LOG = BASE / "sources_log_moon.csv"
UA = {"User-Agent": "rocky-odyssey-data/1.0 (educational project)"}

# ---------- Fuentes ----------
SVS_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_64_uint.tif"
SVS_CAPA = "NASA SVS 4720 CGI Moon Kit, ldem_64_uint.tif (LOLA, 64 píxeles/grado, altura = (DN - 20000) * 0.5 m)"
PDS_POLAR = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/"
DEM_POLAR = {
    "S": ("LDEM_80S_80M", PDS_POLAR + "ldem_80s_80m.lbl"),
    "N": ("LDEM_80N_80M", PDS_POLAR + "ldem_80n_80m.lbl"),
}
DEM_875S = ("LDEM_875S_20M", "https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/LDEM_875S_20M.LBL")
DIVINER = "https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/"
GCP_DOI = "https://doi.org/10.1016/j.icarus.2016.08.012"      # Williams et al. 2017
PCP_REF = "Williams et al. (2019), JGR Planets, 'Seasonal polar temperatures on the Moon'"

# ---------- Validación ----------
VALIDAR_RUGOSIDAD = [
    # (id, nombre, lat, lon, referencia, DEM)  coordenadas de Shackleton: las de generar_web.py
    ("shackleton-875s", "Shackleton (borde)", -89.9, 0.0, 909.9, "875S"),
    ("shackleton-80s", "Shackleton (borde)", -89.9, 0.0, 909.9, "polar"),
    ("tranquilidad", "Pozo Mare Tranquillitatis", 8.3, 33.2, 34.5, "global"),
]
VALIDAR_TEMPERATURA = ("tranquilidad", 8.3, 33.2, 392.0, 95.0)   # Williams et al. 2017, solo orientación
TOL_RUGOSIDAD = 0.05
TOL_TEMPERATURA = 0.10
# Con pocas horas locales con dato, máximo y mínimo no representan el ciclo diario
MIN_HORAS = 24


# ---------------------------------------------------------------------------
# Código del equipo: constantes y funciones de moon_roughness.py (sin su parte que abre el TIF local)
# ---------------------------------------------------------------------------

def funciones_moon_roughness() -> dict:
    fuente = (SCRIPTS / "moon_roughness.py").read_text(encoding="utf-8")
    nodos = [n for n in ast.parse(fuente).body
             if isinstance(n, ast.FunctionDef) and n.name in {"destino", "elevacion", "nueve_puntos"}
             or isinstance(n, ast.Assign) and any(getattr(t, "id", None) in {"PPD", "R", "D"} for t in n.targets)]
    ns = {"np": np, "Window": rasterio.windows.Window}
    exec(compile(ast.Module(body=nodos, type_ignores=[]), "moon_roughness.py", "exec"), ns)
    return ns


# ---------------------------------------------------------------------------
# DEM
# ---------------------------------------------------------------------------

ENV = dict(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_MAX_RETRY="4", GDAL_HTTP_RETRY_DELAY="2",
           GDAL_HTTP_USERAGENT=UA["User-Agent"])


def elevaciones_global(ns, puntos):
    """ldem_64_uint.tif con elevacion() del equipo: 64 píxeles/grado, borde izquierdo en -180."""
    with rasterio.Env(**ENV), rasterio.open("/vsicurl/" + SVS_URL) as src:
        assert (src.width, src.height) == (360 * ns["PPD"], 180 * ns["PPD"]), "el TIF no es 64 píxeles/grado"
        return [ns["elevacion"](src, la, lo) for la, lo in puntos]


def elevaciones_polar(url, puntos):
    """DEM polar de LOLA: CRS del archivo, puntos con pyproj, altura = DN * escala (la etiqueta da 0.5 m)."""
    with rasterio.Env(**ENV), rasterio.open("/vsicurl/" + url) as src:
        proj = pyproj.CRS.from_wkt(src.crs.to_wkt())
        a_xy = pyproj.Transformer.from_crs(proj.geodetic_crs, proj, always_xy=True)
        escala = src.scales[0]
        salida = []
        for la, lo in puntos:
            x, y = a_xy.transform(lo, la)
            fila, col = src.index(x, y)
            if not (0 <= fila < src.height and 0 <= col < src.width):
                raise ValueError(f"({la:.3f}, {lo:.3f}) cae fuera del DEM")
            dn = src.read(1, window=rasterio.windows.Window(col, fila, 1, 1))[0, 0]
            if src.nodata is not None and dn == src.nodata:
                raise ValueError(f"sin dato en ({la:.3f}, {lo:.3f})")
            salida.append(float(dn) * escala)
        return salida


def nueve_elevaciones(id_, lat, lon, tipo, carpeta, ns):
    """tipo: 'global', 'polar' (80S/80N según el hemisferio) o '875S'."""
    ruta = carpeta / f"lola_{id_}_9puntos.csv"
    if ruta.exists():
        with open(ruta, encoding="utf-8") as f:
            filas = list(csv.DictReader(f))
        return [float(r["elevacion_m"]) for r in filas], filas[0]["dem"]
    puntos = [(float(a), float(b)) for a, b in ns["nueve_puntos"](lat, lon)]
    if tipo == "global":
        nombre_dem, elev = "ldem_64_uint", elevaciones_global(ns, puntos)
    else:
        nombre_dem, url = DEM_875S if tipo == "875S" else DEM_POLAR["S" if lat < 0 else "N"]
        elev = elevaciones_polar(url, puntos)
    carpeta.mkdir(parents=True, exist_ok=True)
    with open(ruta, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["dem", "lat", "lon", "elevacion_m"])
        w.writerows([[nombre_dem, f"{a:.6f}", f"{b:.6f}", f"{e:.1f}"] for (a, b), e in zip(puntos, elev)])
    return elev, nombre_dem


def rugosidad(elev) -> float:
    return round(float(np.array(elev).std()), 1)   # ddof=0, igual que moon_roughness.py


# ---------------------------------------------------------------------------
# Diviner
# ---------------------------------------------------------------------------

_sesion = requests.Session()
_sesion.headers.update(UA)


def leer_rango(url, inicio, fin) -> bytes:
    for intento in range(5):
        try:
            r = _sesion.get(url, headers={"Range": f"bytes={inicio}-{fin}"}, timeout=60)
            if r.status_code == 206:
                return r.content
            raise RuntimeError(f"HTTP {r.status_code}")
        except Exception:
            if intento == 4:
                raise
    return b""


def gcp_banda(lat):
    lo = math.floor(lat / 10) * 10
    nombre = lambda v: f"{abs(v):02d}{'s' if v < 0 else 'n'}"
    return f"global_cumul_avg_cyl_{nombre(lo)}{nombre(lo + 10)}_002.tab", lo


def diviner_gcp(lat, lon):
    """96 filas consecutivas (horas locales) de la celda de 0.5° que contiene el punto."""
    archivo, lat0 = gcp_banda(lat)
    ilon = int((lon + 180) // 0.5)
    ilat = int((lat - lat0) // 0.5)
    fila0 = (ilon * 20 + ilat) * 96
    url = DIVINER + "data_derived_gcp/" + archivo
    datos = leer_rango(url, (fila0 + 1) * 113, (fila0 + 97) * 113 - 1).decode("ascii")
    filas = []
    for linea in datos.splitlines():
        v = [c.strip() for c in linea.split(",")]
        filas.append({"producto": archivo, "temporada": "", "clon": v[0], "clat": v[1], "ltim": v[2], "tbol": v[10]})
    assert abs(float(filas[0]["clon"]) - (-179.75 + 0.5 * ilon)) < 1e-6, "fila GCP equivocada"
    return filas


PCP_FILA = 59
PCP_PASO = 240 / 1737400.0


def pcp_xy(lat, lon):
    if lat < 0:
        rho = 2 * math.tan(math.radians(90 + lat) / 2)
        return rho * math.sin(math.radians(lon)), rho * math.cos(math.radians(lon))
    rho = 2 * math.tan(math.radians(90 - lat) / 2)
    return rho * math.sin(math.radians(lon)), -rho * math.cos(math.radians(lon))


def pcp_celda(url, total, x0, y0):
    """Busca la celda de 240 m (ordenadas por x y luego y) leyendo trozos por bisección."""
    trozo = 8192
    lo, hi = 1, total            # fila 0 = cabecera
    leer = lambda i: [float(c) for c in leer_rango(url, i * PCP_FILA, i * PCP_FILA + PCP_FILA - 1).decode().split(",")]
    objetivo = x0 - PCP_PASO / 2
    while hi - lo > trozo // PCP_FILA:
        mid = (lo + hi) // 2
        if leer(mid)[0] < objetivo:
            lo = mid
        else:
            hi = mid
    bloque = leer_rango(url, lo * PCP_FILA, lo * PCP_FILA + 3200 * PCP_FILA).decode(errors="ignore").splitlines()
    mejor = None
    for linea in bloque:
        try:
            x, y, clon, clat, t = [float(c) for c in linea.split(",")]
        except ValueError:
            continue
        if abs(x - x0) <= PCP_PASO / 2 and abs(y - y0) <= PCP_PASO / 2:
            d = (x - x0) ** 2 + (y - y0) ** 2
            if mejor is None or d < mejor[0]:
                mejor = (d, clon, clat, t)
    return mejor


def diviner_pcp(lat, lon):
    polo = "pols" if lat < 0 else "poln"
    x0, y0 = pcp_xy(lat, lon)
    trabajos = [(temp, h) for temp in ("sum", "win") for h in range(1, 97)]

    def uno(par):
        temp, h = par
        archivo = f"pcp_avg_tbol_{polo}_{temp}_ltim{h:02d}_240.tab"
        url = f"{DIVINER}data_derived_pcp/diurnal/ltim/{polo}/{archivo}"
        lbl = _sesion.get(url[:-4] + ".lbl", timeout=60).text
        total = int(next(l.split("=")[1] for l in lbl.splitlines() if l.strip().startswith("ROWS")))
        celda = pcp_celda(url, total, x0, y0)
        if celda is None:
            return None
        _, clon, clat, t = celda
        return {"producto": archivo, "temporada": temp, "clon": f"{clon:.6f}", "clat": f"{clat:.6f}",
                "ltim": f"{(h - 0.5) * 0.25:.3f}", "tbol": f"{t:.6f}"}

    with ThreadPoolExecutor(max_workers=12) as ex:
        return [r for r in ex.map(uno, trabajos) if r]


def temperaturas_diviner(id_, lat, lon, carpeta):
    ruta = carpeta / f"diviner_{id_}.csv"
    if not ruta.exists():
        filas = diviner_gcp(lat, lon) if abs(lat) < 80 else diviner_pcp(lat, lon)
        carpeta.mkdir(parents=True, exist_ok=True)
        with open(ruta, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["producto", "temporada", "clon", "clat", "ltim", "tbol"], lineterminator="\n")
            w.writeheader()
            w.writerows(filas)
    with open(ruta, encoding="utf-8") as f:
        filas = list(csv.DictReader(f))
    valores = [float(r["tbol"]) for r in filas if r["tbol"] and float(r["tbol"]) > 0]
    if len(valores) < MIN_HORAS:
        print(f"   Diviner: solo {len(valores)} horas locales con dato (mínimo {MIN_HORAS}); sin temperatura")
        return None
    tmax, tmin = round(max(valores), 1), round(min(valores), 1)
    return tmax, tmin, round(tmax - tmin, 1), len(valores), filas[0]["producto"]


# ---------------------------------------------------------------------------
# Programa
# ---------------------------------------------------------------------------

def main() -> None:
    ns = funciones_moon_roughness()
    print(f"Funciones de moon_roughness.py: R = {ns['R']} km, D = {ns['D']} km, PPD = {ns['PPD']}")

    # ---------- Validación ----------
    print("\nValidación de rugosidad (referencia / recalculado / diferencia):")
    ok = {"global": True, "polar": True, "875S": True, "gcp": True}
    for id_, nombre, lat, lon, ref, tipo in VALIDAR_RUGOSIDAD:
        try:
            elev, dem = nueve_elevaciones(id_, lat, lon, tipo, VALIDACION, ns)
            r = rugosidad(elev)
            dif = (r - ref) / ref
            ok[tipo] &= abs(dif) <= TOL_RUGOSIDAD
            print(f"   {nombre:28} {dem:14} {ref:>7} / {r:>7} / {dif:+.2%}")
        except Exception as error:
            ok[tipo] = False
            print(f"   {nombre:28} {tipo:14} sin dato: {error}")
    id_, lat, lon, ref_max, ref_min = VALIDAR_TEMPERATURA
    t = temperaturas_diviner(id_, lat, lon, VALIDACION)
    print("Validación de temperatura (Williams et al. 2017, orientación ±10 %):")
    if t:
        dmax, dmin = (t[0] - ref_max) / ref_max, (t[1] - ref_min) / ref_min
        ok["gcp"] = abs(dmax) <= TOL_TEMPERATURA and abs(dmin) <= TOL_TEMPERATURA
        print(f"   Tranquilidad tmax {ref_max} / {t[0]} / {dmax:+.2%}   tmin {ref_min} / {t[1]} / {dmin:+.2%}")
    else:
        ok["gcp"] = False
        print("   Tranquilidad: sin dato")
    print("   resultado:", ok)

    # ---------- Medir ----------
    with open(CANDIDATAS, encoding="utf-8-sig") as f:
        bases = list(csv.DictReader(f))
    resultados = []
    for b in bases:
        lat, lon = float(b["lat"]), float(b["lon"])
        tipo = "global" if abs(lat) < 80 else "polar"
        print(f"\n{b['nombre']} ({lat}, {lon})")
        r = {"base": b, "rugosidad": None, "dem": "", "temp": None, "faltan": []}
        try:
            elev, r["dem"] = nueve_elevaciones(b["id"], lat, lon, tipo, CRUDOS, ns)
            r["rugosidad"] = rugosidad(elev) if ok[tipo] else None
            print(f"   {r['dem']}: {[round(e) for e in elev]} -> {rugosidad(elev)} m"
                  + ("" if ok[tipo] else "  (fuente no validada: no se guarda)"))
        except Exception as error:
            print(f"   DEM sin dato: {error}")
        if r["rugosidad"] is None:
            r["faltan"].append("rugosidad")
        try:
            t = temperaturas_diviner(b["id"], lat, lon, CRUDOS)
            fuente_ok = ok["gcp"] if abs(lat) < 80 else True    # el PCP polar no tiene referencia del equipo
            if t and fuente_ok:
                r["temp"] = t
                print(f"   Diviner ({t[3]} valores): tmax {t[0]} K, tmin {t[1]} K, rango {t[2]} K")
            else:
                print("   Diviner: sin dato" if not t else "   Diviner: fuente no validada, no se guarda")
        except Exception as error:
            print(f"   Diviner sin dato: {error}")
        if r["temp"] is None:
            r["faltan"] += ["tmax_k", "tmin_k", "rango_termico", "hielo"]
        resultados.append(r)

    guardar_targets(resultados)
    guardar_log(resultados)


def fmt(v, dec=1):
    return "" if v is None else (f"{v:.{dec}f}" if dec else str(int(v)))


def hielo_de(temp):
    return None if not temp else (100 if (temp[0] + temp[1]) / 2 < 273.15 else 0)


def guardar_targets(resultados) -> None:
    lineas = TARGETS.read_text(encoding="utf-8").rstrip("\n").replace("\r\n", "\n").split("\n")
    cabecera, filas = lineas[0], lineas[1:]
    existentes = {f.split(",")[0]: i for i, f in enumerate(filas)}
    protegidas = {"Shackleton (borde)", "Pozo Mare Tranquillitatis"}
    for r in resultados:
        nombre = r["base"]["nombre"]
        if nombre in protegidas:
            continue
        temp = r["temp"]
        linea = ",".join([nombre, "luna", fmt(r["rugosidad"]), fmt(temp[2] if temp else None), fmt(hielo_de(temp), 0)])
        if nombre in existentes:
            filas[existentes[nombre]] = linea
        else:
            filas.append(linea)
    TARGETS.write_text("\n".join([cabecera] + filas) + "\n", encoding="utf-8", newline="\n")
    print(f"\nGuardado {TARGETS.relative_to(BASE.parent)}")


def guardar_log(resultados) -> None:
    texto = LOG.read_text(encoding="utf-8")
    hoy = date.today().isoformat()
    filas = []
    for r in resultados:
        b = r["base"]
        nombre, lat, lon = b["nombre"], float(b["lat"]), float(b["lon"])
        url_coord = re.search(r"https?://[^\s,)]+", b["fuente_coordenadas"])
        filas.append([nombre, "coordenadas", f"{lat}, {lon}", f"Fuente: {b['fuente_coordenadas']}. Motivo: {b['motivo']}",
                      url_coord.group(0) if url_coord else "", hoy])
        if r["rugosidad"] is not None:
            if r["dem"] == "ldem_64_uint":
                capa, url = SVS_CAPA, SVS_URL
            else:
                capa = (f"LOLA {r['dem']} (PDS, estereográfica polar, CRS leído del archivo, altura = DN * 0.5 m; "
                        "puntos transformados con pyproj)")
                url = DEM_POLAR["S" if lat < 0 else "N"][1].replace(".lbl", ".img")
            filas.append([nombre, "rugosidad", fmt(r["rugosidad"]),
                          f"{capa}; 9 puntos (3x3, 5.5 km sobre la esfera, R = 1737.4 km) centrados en ({lat}, {lon}); "
                          f"desviación estándar con ddof=0; elevaciones en datos_crudos/lola_{b['id']}_9puntos.csv", url, hoy])
        if r["temp"]:
            tmax, tmin, rango, n, producto = r["temp"]
            if abs(lat) < 80:
                capa = (f"Diviner GCP (Williams et al. 2017, Icarus 283), {producto}: temperatura bolométrica de superficie, "
                        f"celda de 0.5° del punto ({lat}, {lon}), {n} horas locales con dato")
                url = GCP_DOI
            else:
                capa = (f"Diviner PCP diurno 240 m ({PCP_REF}), verano e invierno, 96 horas locales cada uno: temperatura "
                        f"bolométrica de superficie en la celda del punto ({lat}, {lon}), {n} valores con dato")
                url = DIVINER + "data_derived_pcp/diurnal/ltim/"
            for var, val, nota in [("tmax_k", fmt(tmax), "máximo"), ("tmin_k", fmt(tmin), "mínimo"),
                                   ("rango_termico", fmt(rango), "tmax_k - tmin_k")]:
                filas.append([nombre, var, val, f"{capa}. {nota}; datos en datos_crudos/diviner_{b['id']}.csv", url, hoy])
            medio = (tmax + tmin) / 2
            frio = hielo_de(r["temp"])
            filas.append([nombre, "hielo", str(frio),
                          "Indice de frio: % de meses con temperatura media bajo 0 C (misma formula que la Tierra). "
                          f"Punto medio entre tmax_k y tmin_k ~{medio:.0f} K (superficie, Diviner), "
                          f"{'por debajo' if frio else 'por encima'} de 273 K.", url, hoy])
    nuevas = [f for f in filas if f"{f[0]},{f[1]}," not in texto]
    if nuevas:
        with open(LOG, "a", encoding="utf-8", newline="") as f:
            if texto and not texto.endswith("\n"):
                f.write("\n")
            csv.writer(f, lineterminator="\n").writerows(nuevas)
    print(f"Log: {len(nuevas)} filas nuevas ({len(filas) - len(nuevas)} ya estaban)")


if __name__ == "__main__":
    main()
