declare module 'imagetracerjs' {
  const ImageTracer: {
    imagedataToSVG(
      imageData: { width: number; height: number; data: Uint8Array },
      options?: Record<string, number | boolean | string | undefined>
    ): string;
  };

  export default ImageTracer;
}
