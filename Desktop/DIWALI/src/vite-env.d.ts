/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_ENQUIRY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
