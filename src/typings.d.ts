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

declare type TLayer = {
    name?: string;
    x?: number;
    y?: number;
    x2?: number;
    y2?: number;
    yy?: number; //?
    width?: number;
    height?: number;
    radius?: number;
    type?: ELayerType;
    text?: string;
    font?: string;
    isOverlay?: boolean;
    index?: number;
    id?: string;
    data?: any; // imageData for ex.
};

declare type TLayerImageData = {
    name: string;
    width: number;
    height: number;
    image: HTMLImageElement;
    isCustom?: boolean;
}

declare type ELayerType = 'dot' | 'line' | 'text' | 'box' | 'frame' | 'circle' | 'disc' | 'bitmap' | 'icon';

declare type TSourceCode = {
    declarations: string[];
    code: string[];
};

declare global {
    interface Window {
      serial: any;
      gtag: any;
    }
  }