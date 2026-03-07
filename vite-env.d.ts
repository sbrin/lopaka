interface ImportMetaEnv {
    readonly VITE_APP_URL: string;
    readonly VITE_CHECKOUT_URL: string;
    readonly VITE_CHECKOUT_URL_PLUS: string;
    readonly VITE_CHECKOUT_URL_HOBBY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
