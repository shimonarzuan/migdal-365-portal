/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_MODE?: 'mock' | 'msal';
  readonly VITE_TENANT_ID?: string;
  readonly VITE_CLIENT_ID?: string;
  readonly VITE_REDIRECT_URI?: string;
  readonly VITE_GRAPH_ENDPOINT?: string;
  readonly VITE_SHAREPOINT_SITE?: string;
  readonly VITE_ADMIN_UPNS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
