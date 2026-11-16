/** Una entrada de src/data/credits.json */
export interface ImageCredit {
  /** Ruta pública de la imagen, p. ej. /images/atacama.jpg */
  path: string;
  title: string;
  author: string;
  /** Código: "public-domain", "pixabay" o el nombre de una Creative Commons ("CC BY 4.0") */
  license: string;
  /** Página de la imagen en Wikimedia Commons */
  source: string;
}