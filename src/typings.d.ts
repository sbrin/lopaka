declare module '*.vue' {
    import {DefineComponent} from 'vue';
    const Component: DefineComponent;
    export default Component;
}
declare module '*.png' {
    export default string;
}

declare type TPackImage = {
    name: string;
    width: number;
    height: number;
    image: string;
};

declare module '*.icons.pack' {
    export default [];
}

declare module '*.ttf' {
    export default string;
}

declare module '*?url' {
    export default string;
}

declare module '*.bdf' {
    const content: BDFFormat;
    export default content;
}

declare type TFontSizes = {
    textCharHeight: number;
    textCharWidth: number;
    size: number;
};

declare type TFontSource = string | File | BDFFormat | Promise<{default: BDFFormat}>;

declare type TPlatformFont = {
    name: string;
    title: string;
    file: TFontSource;
    options?: TFontSizes;
    format: number;
};
declare type TLayerImageData = {
    name: string;
    width: number;
    height: number;
    image: HTMLImageElement;
    isCustom?: boolean;
};

declare type TSourceCode = {
    declarations: string[];
    code: string[];
};

interface Window {
    gtag: any;
}

declare type ELayerType =
    | 'box'
    | 'line'
    | 'dot'
    | 'circle'
    | 'disc'
    | 'string'
    | 'icon'
    | 'frame'
    | 'paint'
    | 'rect'
    | 'ellipse';

declare function gtag(...args: any[]): void;

declare type BDFGlyph = {
    code?: number;
    char?: string;
    name?: string;
    bytes?: number[];
    bounds?: number[];
    scalableSize?: number[];
    deviceSize?: number[];
};

declare type BDFMeta = {
    version?: string;
    name?: string;
    size?: {
        points: number;
        resolutionX: number;
        resolutionY: number;
    };
    bounds?: number[4];
    properties?: {
        fontDescent?: number;
        fontAscent?: number;
        defaultChar?: number;
    };
    totalChars?: number;
};

declare type BDFFormat = {
    meta: BDFMeta;
    glyphs: Map<number, BDFGlyph>;
};
