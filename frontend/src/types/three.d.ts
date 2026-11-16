declare module "three" {
  export const Cache: { enabled: boolean };

  export class ImageLoader {
    load(
      url: string,
      onLoad?: (image: HTMLImageElement) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (error: unknown) => void,
    ): HTMLImageElement;
  }
}
