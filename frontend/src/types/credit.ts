/** Una entrada de src/data/credits.json */
export interface ImageCredit {
  /** Ruta pública de la imagen, p. ej. /images/atacama.jpg */
  path: string;
  title: string;
  author: string;
  license: string;
  /** Página de la imagen en Wikimedia Commons */
  source: string;
}