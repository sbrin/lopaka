declare module '*.vue' {
    import {DefineComponent} from 'vue';
    const Component: DefineComponent;
    export default Component;
}
declare module '*.png' {
    export default string;
}

declare module '*.svg' {
    export default string;
}

declare module '*?component' {
    import {DefineComponent} from 'vue';
    const Component: DefineComponent;
    export default Component;
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

declare module '*?raw' {
    export default string;
}

declare module '*.pug' {
    export default (locals: any) => string;
}

declare module '*.bdf' {
    const content: FontFormat;
    export default content;
}

declare type TFontSizes = {
    textCharHeight: number;
    textCharWidth: number;
    size: number;
};

declare type TFontSource = string | File | FontFormat | Function<Promise<{default: FontFormat}>>;

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
    id?: number;
};

declare type TSourceCodeMap = Record<string, {line: number; params: Record<string, any>}>;

declare type TSourceCode = {
    map: TSourceCodeMap;
    code: string;
};

interface Window {
    gtag: any;
    posthog: any;
}

declare type ELayerType =
    | 'box'
    | 'line'
    | 'circle'
    | 'disc'
    | 'string'
    | 'icon'
    | 'frame'
    | 'paint'
    | 'rect'
    | 'ellipse';

declare function gtag(...args: any[]): void;

declare type FontGlyph = {
    code?: number;
    char?: string;
    name?: string;
    bytes?: number[];
    bounds?: number[];
    scalableSize?: number[];
    deviceSize?: number[];
    xAdvance?: number;
};

declare type FontMeta = {
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

declare type FontPack = {
    meta: FontMeta;
    glyphs: Map<number, FontGlyph>;
};

declare type GFXFont = {
    name: string;
    bitmaps: number[];
    glyphs: GFXGlyph[];
    first: number;
    last: number;
    yAdvance: number;
};

declare type GFXGlyph = {
    bitmapOffset: number;
    width: number;
    height: number;
    xAdvance: number;
    xOffset: number;
    yOffset: number;
};
