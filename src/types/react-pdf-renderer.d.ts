import type { ComponentType } from 'react';

declare module '@react-pdf/renderer' {
  export const Document: ComponentType<any>;
  export const Page: ComponentType<any>;
  export const View: ComponentType<any>;
  export const Text: ComponentType<any>;
  export const Image: ComponentType<any>;
  export const Link: ComponentType<any>;
  export const Note: ComponentType<any>;
  export const Canvas: ComponentType<any>;
  export const Svg: ComponentType<any>;
  export const G: ComponentType<any>;
  export const Path: ComponentType<any>;
  export const Rect: ComponentType<any>;
  export const Circle: ComponentType<any>;
  export const Line: ComponentType<any>;
  export const Polyline: ComponentType<any>;
  export const Polygon: ComponentType<any>;
  export const PDFViewer: ComponentType<any>;
  export const PDFDownloadLink: ComponentType<any>;
  export const BlobProvider: ComponentType<any>;
  export const Font: any;
  export const StyleSheet: any;
  export const pdf: any;
  export const renderToStream: any;
  export const renderToFile: any;
  export const usePDF: any;
}
