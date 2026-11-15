"""Mide bases nuevas de Marte con las mismas fórmulas del equipo.

Uso, desde la raíz del repo (con el entorno de datos/requirements.txt):
    python datos/scripts/medir_bases_marte.py

Entradas:
  datos/bases_marte_candidatas.csv   id, nombre, lat, lon (-180..180), fuente y criterio
Datos crudos (se descargan solo si no existen, así el script se puede volver a correr sin internet):
  datos/datos_crudos/mola_<id>_9puntos.csv          9 elevaciones del DEM de MOLA (COG de USGS)
  datos/datos_crudos/mcd_<id>_ls0.txt, _ls090.txt, _ls180.txt, _ls270.txt   Mars Climate Database
  datos/datos_crudos/validacion/                    lo mismo para Jezero y Arcadia, solo para validar
Salidas (solo si la validación pasa):
  datos/datos_limpios/targets_mars.csv   filas nuevas (Jezero y Arcadia no se tocan)
  datos/sources_log_mars.csv             una fila por base y variable, sin duplicar
  datos/consultas_mcd_pendientes.csv     si alguna consulta al MCD no se pudo hacer

Fórmulas (no se reescriben: se toman de los scripts del equipo):
  - destino, nueve_puntos, elevacion y las constantes R y D salen de mars_roughness.py
  - la lectura de los archivos MCD sale de mcd_range.py (se ejecuta su bloque de lectura)
  - rugosidad = np.std (ddof=0) de las 9 elevaciones, 1 decimal
  - tmax_k / tmin_k = promedio de las 4 máximas / mínimas diarias, 1 decimal; rango = tmax_k - tmin_k
  - hielo = 100 si (tmax_k + tmin_k) / 2 < 273.15 K, si no 0
"""

import ast
import csv
import io
import math
import re
import sys
import time
from datetime import date
from pathlib import Path

import numpy as np
import rasterio
import requests

BASE = Path(__file__).resolve().parent.parent          # datos/
SCRIPTS = BASE / "scripts"
CRUDOS = BASE / "datos_crudos"
VALIDACION = CRUDOS / "validacion"
CANDIDATAS = BASE / "bases_marte_candidatas.csv"
TARGETS = BASE / "datos_limpios" / "targets_mars.csv"
LOG = BASE / "sources_log_mars.csv"
PENDIENTES = BASE / "consultas_mcd_pendientes.csv"

MOLA_URL = ("https://asc-pds-services.s3.us-west-2.amazonaws.com/wms_basemaps3/Mars/MOLA/"
            "mola128_mola64_merge_90Nto90S_SimpleC_clon0_cog.tif")
MOLA_CAPA = "MOLA MEGDR mola128_mola64_merge (COG de USGS Astrogeology)"
MCD_URL = "https://www-mars.lmd.jussieu.fr/mcd_python/"
MCD_CGI = MCD_URL + "cgi-bin/mcdcgi.py"
TEMPORADAS = {"ls0": "0.", "ls090": "90.", "ls180": "180.", "ls270": "270."}
UA = {"User-Agent": "rocky-odyssey-data/1.0 (educational project)"}

# Referencias del equipo para validar (targets_mars.csv y sources_log_mars.csv)
REFERENCIA = {
    "jezero": {"rugosidad": 82.6, "tmax_k": 243.7, "tmin_k": 194.7},
    "arcadia-planitia": {"rugosidad": 9.2, "tmax_k": 212.8, "tmin_k": 173.4},
}
TOLERANCIA = 0.05   # 5 %
# Nombre que usan los archivos MCD del equipo para las bases de validación
MCD_NOMBRE_EQUIPO = {"jezero": "jezero", "arcadia-planitia": "arcadia"}


# ---------------------------------------------------------------------------
# Reutilizar el código del equipo sin modificar sus archivos
# ---------------------------------------------------------------------------

def funciones_mars_roughness() -> dict:
    """Ejecuta solo las constantes y funciones de mars_roughness.py (no su parte que abre el TIF local)."""
    fuente = (SCRIPTS / "mars_roughness.py").read_text(encoding="utf-8")
    arbol = ast.parse(fuente)
    nodos = [n for n in arbol.body
             if isinstance(n, ast.FunctionDef) and n.name in {"destino", "elevacion", "nueve_puntos"}
             or isinstance(n, ast.Assign) and any(getattr(t, "id", None) in {"PPD", "R", "D"} for t in n.targets)]
    ns = {"np": np, "Window": rasterio.windows.Window}
    exec(compile(ast.Module(body=nodos, type_ignores=[]), "mars_roughness.py", "exec"), ns)
    return ns


def leer_mcd(carpeta: Path) -> dict[str, list[tuple[float, float]]]:
    """Ejecuta el bloque de lectura de mcd_range.py sobre `carpeta`/datos_crudos/mcd_*.txt.

    Devuelve su `por_sitio`: nombre del archivo -> [(mínima, máxima)] de temperatura por estación.
    """
    fuente = (SCRIPTS / "mcd_range.py").read_text(encoding="utf-8")
    corte = fuente.index("# ---------- Guardar")
    lectura = fuente[:corte]
    falso = carpeta / "scripts" / "mcd_range.py"      # su BASE = parent.parent = carpeta
    ns = {"__file__": str(falso), "__name__": "mcd_range_lectura"}
    salida = io.StringIO()
    stdout, sys.stdout = sys.stdout, salida
    try:
        exec(compile(lectura, "mcd_range.py", "exec"), ns)
    finally:
        sys.stdout = stdout
    avisos = [l for l in salida.getvalue().splitlines() if "AVISO" in l]
    for aviso in avisos:
        print("   mcd_range:", aviso.strip())
    return ns["por_sitio"]


# ---------------------------------------------------------------------------
# Rugosidad con el DEM de MOLA leído por HTTP
# ---------------------------------------------------------------------------

def abrir_mola():
    env = rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_MAX_RETRY="3",
                       GDAL_HTTP_RETRY_DELAY="2", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif")
    env.__enter__()
    return env, rasterio.open("/vsicurl/" + MOLA_URL)


def metadatos_mola(src, ns) -> dict:
    """Resolución, convención de longitud y unidades leídas del archivo, no supuestas."""
    esferoide = re.search(r'SPHEROID\["[^"]+",([\d.]+),([\d.]+)', src.crs.to_wkt())
    if not esferoide or float(esferoide.group(2)) != 0:
        raise SystemExit("El CRS del DEM no es una esfera; elevacion() del equipo supone una esfera.")
    radio_m = float(esferoide.group(1))
    m_por_grado = math.pi * float(radio_m) / 180
    ppd = m_por_grado / src.res[0]
    centro = re.search(r'PARAMETER\["central_meridian",([-\d.]+)\]', src.crs.to_wkt())
    unidad_lineal = re.search(r'UNIT\["(metre|meter)"', src.crs.to_wkt().split("PROJECTION")[-1])
    oeste = src.bounds.left / m_por_grado
    norte = src.bounds.top / m_por_grado
    info = {
        "radio_m": float(radio_m),
        "pixel_m": src.res[0],
        "ppd": ppd,
        "meridiano_central": float(centro.group(1)) if centro else None,
        "lon_oeste": oeste,
        "lat_norte": norte,
        "dtype": src.dtypes[0],
        "escala": src.scales[0],
        "desplazamiento": src.offsets[0],
        "unidad_xy": "metro" if unidad_lineal else "desconocida",
        "minimo_declarado": src.tags(1).get("STATISTICS_MINIMUM"),
    }
    if abs(ppd - round(ppd)) > 1e-3:
        raise SystemExit(f"Píxeles por grado no enteros ({ppd}); revisa el DEM antes de seguir.")
    if info["escala"] != 1.0 or info["desplazamiento"] != 0.0:
        raise SystemExit(f"El DEM tiene escala/desplazamiento ({info['escala']}, {info['desplazamiento']}); "
                         "elevacion() del equipo no los aplica.")
    ns["PPD"] = round(ppd)   # elevacion() usa PPD como global
    return info


def prueba_punto_bajo(src, ns) -> int:
    """La misma prueba de mars_roughness.py: el punto más bajo de Marte, cerca de -8201 m."""
    prueba = {lon0: ns["elevacion"](src, -32.84749, 62.20833, lon0) for lon0 in (0, 180)}
    print("   prueba del punto más bajo (esperado cerca de -8201 m):", prueba)
    lon0 = min(prueba, key=lambda k: abs(prueba[k] + 8201))
    if abs(prueba[lon0] + 8201) > 150:
        raise SystemExit("AVISO: ninguna convención de longitud coincide. No se guarda nada.")
    print("   convención de longitud detectada: centro en", lon0)
    return lon0


def nueve_elevaciones(id_, lat, lon, carpeta, mola, ns) -> list[tuple[float, float, float]]:
    ruta = carpeta / f"mola_{id_}_9puntos.csv"
    if ruta.exists():
        with open(ruta, encoding="utf-8") as f:
            return [(float(r["lat"]), float(r["lon"]), float(r["elevacion_m"])) for r in csv.DictReader(f)]
    src, lon0 = mola()
    puntos = ns["nueve_puntos"](lat, lon)
    filas = [(float(la), float(lo), ns["elevacion"](src, la, lo, lon0)) for la, lo in puntos]
    carpeta.mkdir(parents=True, exist_ok=True)
    with open(ruta, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["lat", "lon", "elevacion_m"])
        w.writerows([[f"{la:.6f}", f"{lo:.6f}", f"{e:.1f}"] for la, lo, e in filas])
    return filas


def rugosidad(filas) -> float:
    return round(float(np.array([e for _, _, e in filas]).std()), 1)   # ddof=0, igual que mars_roughness.py


# ---------------------------------------------------------------------------
# Temperatura con el Mars Climate Database
# ---------------------------------------------------------------------------

def _num(x: float) -> str:
    """Hasta 4 decimales sin ceros de sobra: 184.0 -> '184', 241.3931 -> '241.3931'."""
    return f"{x:.4f}".rstrip("0").rstrip(".")


def parametros_mcd(lat: float, lon: float, ls: str) -> dict:
    """Mismos parámetros que el equipo: T a 2 m sobre la superficie, LT all, clim. ave solar, alta resolución."""
    # El formulario manda todos sus campos, también los vacíos: si falta alguno, el CGI ignora la
    # consulta y devuelve su perfil por defecto (Ls 200, 0°N 0°E, por altitud).
    return {
        "var1": "t", "var2": "none", "var3": "none", "var4": "none",
        "datekeyhtml": "1", "ls": ls, "localtime": "all",
        "year": "", "month": "", "day": "", "hours": "", "minutes": "", "seconds": "",
        "latitude": f"{lat}", "longitude": _num(lon % 360),    # el equipo usó longitudes este 0-360 (184.0)
        "altitude": "2.", "zkey": "3",                         # 3 = m above surface
        "spacecraft": "none", "isfixedlt": "off", "dust": "1",  # 1 = climatology ave solar
        "hrkey": "1",                                          # 1 = topografía de alta resolución
        "averaging": "off", "zonmean": "off", "diumean": "off", "animation": "off", "animframes": "12",
        "dpi": "80", "islog": "off", "colorm": "jet", "minval": "", "maxval": "",
        "proj": "cyl", "palt": "", "plon": "", "plat": "", "trans": "",
        "iswind": "off", "latpoint": "", "lonpoint": "",
    }


def comprobar_cabecera(texto: str, params: dict) -> None:
    """El archivo tiene que ser la consulta pedida: Ls, latitud, longitud y hora local en columna 1."""
    # El MCD escribe las latitudes sur con signo ("Latitude -4.6N") y redondea a 1 decimal
    m = re.search(r"### Ls ([-\d.]+)deg\. Latitude ([-\d.]+)([NS])\. Longitude ([-\d.]+)E\.", texto)
    if not m:
        raise RuntimeError("cabecera inesperada (no es la serie por hora local)")
    ls, lat, ns_, lon = float(m.group(1)), float(m.group(2)), m.group(3), float(m.group(4))
    lat = -lat if ns_ == "S" else lat
    tol = 0.051
    if (abs(ls - float(params["ls"])) > tol or abs(lat - float(params["latitude"])) > tol
            or abs((lon - float(params["longitude"]) + 180) % 360 - 180) > tol):
        raise RuntimeError(f"el servidor respondió otro punto: Ls {ls}, {lat}, {lon}E")
    if "Column 1 is Local time" not in texto:
        raise RuntimeError("la columna 1 no es la hora local")


def descargar_mcd(params: dict, destino: Path) -> None:
    r = requests.get(MCD_CGI, params=params, headers=UA, timeout=180)
    r.raise_for_status()
    m = re.search(r"href='\.\./txt/([0-9a-f]+\.txt)'", r.text)
    if not m:
        raise RuntimeError("la respuesta no trae el enlace al archivo de texto")
    t = requests.get(MCD_URL + "txt/" + m.group(1), headers=UA, timeout=60)
    t.raise_for_status()
    if "Column 2 is Temperature (K)" not in t.text:
        raise RuntimeError("el archivo no contiene la temperatura")
    comprobar_cabecera(t.text, params)
    destino.write_text(t.text, encoding="utf-8", newline="\n")


def asegurar_mcd(id_, nombre_archivo, lat, lon, carpeta: Path, pendientes: list) -> bool:
    """Descarga las 4 estaciones que falten. Devuelve True si están las 4."""
    carpeta.mkdir(parents=True, exist_ok=True)
    completas = True
    for sufijo, ls in TEMPORADAS.items():
        archivo = carpeta / f"mcd_{nombre_archivo}_{sufijo}.txt"
        params = parametros_mcd(lat, lon, ls)
        if archivo.exists():
            try:
                comprobar_cabecera(archivo.read_text(encoding="utf-8"), params)
                continue
            except RuntimeError as error:
                print(f"   {archivo.name} no corresponde a la consulta ({error}); se vuelve a descargar")
        try:
            descargar_mcd(params, archivo)
            print(f"   MCD descargado: {archivo.name}")
            time.sleep(2)
        except Exception as error:   # servidor caído o respuesta inesperada: se deja pendiente
            completas = False
            pendientes.append({"id": id_, "archivo": str(archivo.relative_to(BASE.parent)).replace("\\", "/"),
                               "ls": ls, "latitud": params["latitude"], "longitud_este": params["longitude"],
                               "altitud": "2 m above surface", "variable": "Temperature (K)",
                               "hora_local": "all", "polvo": "climatology ave solar",
                               "alta_resolucion": "sí", "url": MCD_URL, "error": str(error)[:120]})
            print(f"   MCD pendiente: {archivo.name} ({error})")
    return completas


def temperaturas(por_sitio: dict, nombre_archivo: str):
    lista = por_sitio.get(nombre_archivo, [])
    if len(lista) != 4:
        return None
    tmax = round(sum(mx for mn, mx in lista) / len(lista), 1)   # igual que mcd_range.py
    tmin = round(sum(mn for mn, mx in lista) / len(lista), 1)
    return tmax, tmin, round(tmax - tmin, 1)


def fecha_mcd(carpeta: Path, nombre_archivo: str) -> str:
    texto = (carpeta / f"mcd_{nombre_archivo}_ls0.txt").read_text(encoding="utf-8")
    m = re.search(r"Retrieved on: (\d{4}-\d{2}-\d{2})", texto)
    return m.group(1) if m else ""


def version_mcd(carpeta: Path, nombre_archivo: str) -> str:
    texto = (carpeta / f"mcd_{nombre_archivo}_ls0.txt").read_text(encoding="utf-8")
    m = re.search(r"### (MCD_v[\d.]+)", texto)
    return m.group(1).replace("MCD_v", "v") if m else "v?"


# ---------------------------------------------------------------------------
# Programa
# ---------------------------------------------------------------------------

def main() -> None:
    with open(CANDIDATAS, encoding="utf-8-sig") as f:
        bases = list(csv.DictReader(f))
    ns = funciones_mars_roughness()
    print(f"Funciones de mars_roughness.py: R = {ns['R']} km, D = {ns['D']} km")

    estado = {"src": None, "lon0": None, "env": None, "info": None}

    def mola():
        if estado["src"] is None:
            print("Abriendo el DEM de MOLA por HTTP:", MOLA_URL)
            estado["env"], estado["src"] = abrir_mola()
            estado["info"] = metadatos_mola(estado["src"], ns)
            print("   metadatos:", estado["info"])
            estado["lon0"] = prueba_punto_bajo(estado["src"], ns)
        return estado["src"], estado["lon0"]

    pendientes: list[dict] = []
    resultados: dict[str, dict] = {}

    # ---------- 1) Medir (validación primero) ----------
    for b in bases:
        id_, lat, lon = b["id"], float(b["lat"]), float(b["lon"])
        es_validacion = id_ in REFERENCIA
        carpeta = VALIDACION if es_validacion else CRUDOS
        nombre_mcd = MCD_NOMBRE_EQUIPO.get(id_, id_)
        print(f"\n{b['nombre']} ({lat}, {lon})" + ("  [validación]" if es_validacion else ""))

        try:
            filas = nueve_elevaciones(id_, lat, lon, carpeta, mola, ns)
            rug = rugosidad(filas)
            print(f"   9 elevaciones: {[round(e) for _, _, e in filas]} -> rugosidad {rug} m")
        except Exception as error:
            rug = None
            print(f"   MOLA no disponible: {error}")

        mcd_dir = carpeta
        completas = asegurar_mcd(id_, nombre_mcd, lat, lon, mcd_dir, pendientes)
        temp = None
        if completas:
            temp = temperaturas(leer_mcd(_raiz_falsa(mcd_dir)), nombre_mcd)
        if temp:
            print(f"   tmax_k {temp[0]} | tmin_k {temp[1]} | rango_termico {temp[2]} K")
        resultados[id_] = {"base": b, "rugosidad": rug, "temp": temp,
                           "fecha_mcd": fecha_mcd(mcd_dir, nombre_mcd) if temp else "",
                           "version_mcd": version_mcd(mcd_dir, nombre_mcd) if temp else ""}

    if estado["src"] is not None:
        estado["src"].close()
        estado["env"].__exit__(None, None, None)

    # ---------- 2) Validación ----------
    print("\nValidación (referencia del equipo / recalculado / diferencia):")
    fuente_ok = {"mola": True, "mcd": True}
    for id_, ref in REFERENCIA.items():
        r = resultados.get(id_)
        if r is None:
            print(f"   {id_}: no está en bases_marte_candidatas.csv")
            fuente_ok = {"mola": False, "mcd": False}
            continue
        valores = {"rugosidad": r["rugosidad"]}
        if r["temp"]:
            valores["tmax_k"], valores["tmin_k"] = r["temp"][0], r["temp"][1]
        for var, esperado in ref.items():
            obtenido = valores.get(var)
            fuente = "mola" if var == "rugosidad" else "mcd"
            if obtenido is None:
                fuente_ok[fuente] = False
                print(f"   {id_:18} {var:10} {esperado:>8} / sin dato")
                continue
            dif = (obtenido - esperado) / esperado
            print(f"   {id_:18} {var:10} {esperado:>8} / {obtenido:>8} / {dif:+.2%}")
            if abs(dif) > TOLERANCIA:
                fuente_ok[fuente] = False
    print("   resultado:", {k: ("OK" if v else "FALLA, no se guardan sus valores") for k, v in fuente_ok.items()})

    # ---------- 3) Pendientes de MCD ----------
    if pendientes:
        with open(PENDIENTES, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(pendientes[0]), lineterminator="\n")
            w.writeheader()
            w.writerows(pendientes)
        print(f"\n{len(pendientes)} consultas MCD pendientes en {PENDIENTES.name}")
    elif PENDIENTES.exists():
        PENDIENTES.unlink()

    # ---------- 4) Guardar las bases nuevas ----------
    nuevas = [r for id_, r in resultados.items() if id_ not in REFERENCIA]
    guardar_targets(nuevas, fuente_ok)
    guardar_log(nuevas, fuente_ok, estado["info"])


def _raiz_falsa(carpeta: Path) -> Path:
    """mcd_range.py lee BASE/datos_crudos/mcd_*.txt. Si los archivos están en datos_crudos/, BASE = datos/;
    si están en datos_crudos/validacion/, se usa una carpeta temporal que apunta solo a esos archivos."""
    if carpeta == CRUDOS:
        return BASE
    import shutil
    import tempfile
    tmp = Path(tempfile.mkdtemp(prefix="mcd_validacion_"))
    (tmp / "datos_crudos").mkdir()
    for f in carpeta.glob("mcd_*.txt"):
        shutil.copy(f, tmp / "datos_crudos" / f.name)
    return tmp


def fmt(valor, decimales=1):
    if valor is None:
        return ""
    return f"{valor:.{decimales}f}" if decimales else f"{int(valor)}"


def guardar_targets(nuevas, fuente_ok) -> None:
    texto = TARGETS.read_text(encoding="utf-8")
    lineas = texto.rstrip("\n").split("\n")
    cabecera, filas = lineas[0], lineas[1:]
    por_nombre = {f.split(",")[0]: i for i, f in enumerate(filas)}
    for r in nuevas:
        nombre = r["base"]["nombre"]
        rug = r["rugosidad"] if fuente_ok["mola"] else None
        temp = r["temp"] if fuente_ok["mcd"] else None
        rango = temp[2] if temp else None
        hielo = (100 if (temp[0] + temp[1]) / 2 < 273.15 else 0) if temp else None
        linea = ",".join([nombre, "marte", fmt(rug), fmt(rango), fmt(hielo, 0)])
        if nombre in REFERENCIA_NOMBRES:
            continue   # Jezero y Arcadia no se tocan
        if nombre in por_nombre:
            filas[por_nombre[nombre]] = linea
        else:
            filas.append(linea)
    TARGETS.write_text("\n".join([cabecera] + filas) + "\n", encoding="utf-8", newline="\n")
    print(f"\nGuardado {TARGETS.relative_to(BASE.parent)}")


REFERENCIA_NOMBRES = {"Jezero", "Arcadia Planitia"}


def guardar_log(nuevas, fuente_ok, info_mola) -> None:
    texto = LOG.read_text(encoding="utf-8")
    hoy = date.today().isoformat()
    filas = []
    for r in nuevas:
        b = r["base"]
        nombre, lat, lon = b["nombre"], float(b["lat"]), float(b["lon"])
        punto = f"{lat:.4f}, {lon:.4f} (lon este -180..180; {lon % 360:.4f} E en 0-360)"
        filas.append([nombre, "coordenadas", f"{lat}, {lon}", f"{b['criterio']}", b["fuente_coordenadas"], hoy])
        if r["rugosidad"] is not None and fuente_ok["mola"]:
            px = f"{info_mola['pixel_m']:.2f} m/píxel, {round(info_mola['ppd'])} píxeles/grado" if info_mola else "463 m/píxel"
            filas.append([nombre, "rugosidad", fmt(r["rugosidad"]),
                          f"{MOLA_CAPA}, {px}, int16 en metros, leído por HTTP; 9 puntos (3x3, 5.5 km sobre la esfera, "
                          f"R = 3396.19 km) centrados en ({punto}); desviación estándar con ddof=0; "
                          f"elevaciones en datos_crudos/mola_{b['id']}_9puntos.csv", MOLA_URL, hoy])
        if r["temp"] and fuente_ok["mcd"]:
            tmax, tmin, rango = r["temp"]
            capa = (f"Mars Climate Database {r['version_mcd']}; Temperature (K) a 2 m sobre la superficie; "
                    f"Ls 0, 90, 180, 270; hora local: all; escenario de polvo: climatology ave solar; "
                    f"topografía de alta resolución; punto {lat} N, {_num(lon % 360)} E")
            medio = (tmax + tmin) / 2
            frio = 100 if medio < 273.15 else 0
            comparacion = "muy por debajo de 273 K" if medio < 263 else ("por debajo de 273 K" if frio else "por encima de 273 K")
            for var, val, nota in [("tmax_k", fmt(tmax), "promedio de las 4 máximas diarias"),
                                   ("tmin_k", fmt(tmin), "promedio de las 4 mínimas diarias"),
                                   ("rango_termico", fmt(rango), "tmax_k - tmin_k")]:
                filas.append([nombre, var, val, f"{capa}. {nota}", MCD_URL, r["fecha_mcd"]])
            filas.append([nombre, "hielo", str(frio),
                          "Indice de frio: % de meses con temperatura media bajo 0 C (misma formula que la Tierra). "
                          f"Punto medio entre tmax_k y tmin_k ~{medio:.0f} K (aire a 2 m, MCD, promedio de 4 estaciones), "
                          f"{comparacion}.", MCD_URL, r["fecha_mcd"]])
    nuevas_filas = [f for f in filas if f"{f[0]},{f[1]}," not in texto]
    if nuevas_filas:
        with open(LOG, "a", encoding="utf-8", newline="") as f:
            if texto and not texto.endswith("\n"):
                f.write("\n")
            csv.writer(f, lineterminator="\n").writerows(nuevas_filas)
    print(f"Log: {len(nuevas_filas)} filas nuevas en {LOG.name} ({len(filas) - len(nuevas_filas)} ya estaban)")


if __name__ == "__main__":
    main()
