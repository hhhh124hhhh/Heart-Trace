/// <reference types="vite/client" />

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_APP_API_URL?: string;
  readonly VITE_APP_ENV?: string;
  // 添加项目中使用的其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}