/// <reference types="vite/client" />



declare const __MODEL_ASSET_V__: string;



interface ImportMetaEnv {

  readonly VITE_BASE_PATH?: string;

  readonly VITE_API_PROXY?: string;

  readonly VITE_API_BASE?: string;

  readonly VITE_BODY_MODEL_FILE?: string;

}



interface ImportMeta {

  readonly env: ImportMetaEnv;

}


