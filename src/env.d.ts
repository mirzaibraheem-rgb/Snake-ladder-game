/// <reference types="vite/client" />
declare const __APP_VERSION__: string;
declare module '*.txt?raw' {
  const content: string;
  export default content;
}
declare const __SINGLE_FILE__: boolean;
declare module 'virtual:board-images' {
  const images: Record<string, string>;
  export default images;
}
