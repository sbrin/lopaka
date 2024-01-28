declare module '*.vue' {
    import {DefineComponent} from 'vue';
    const Component: DefineComponent;
    export default Component;
}
declare module '*.png' {
    export default string;
}

declare module '*.ttf' {
    export default string;
}

declare module '*?url' {
    export default string;
}

declare type TFontSizes = {
    textCharHeight: number;
    textCharWidth: number;
    size: number;
};

declare type TPlatformFont = {
    // name of the font, used in generated code
    name: string;
    // title of the font, used in UI
    title: string;
    // path to the font file
    file: string;
    // font options
    options: TFontSizes;
    // font format
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
    | 'ellipse';

declare function gtag(...args: any[]): void;
