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

declare type TFontSizes = {
    textContainerHeight: number;
    textCharWidth: number;
    size: number;
};

declare type TPlatformFont = {
    name: string;
    file: string;
    options: TFontSizes;
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

declare type ELayerType = 'dot' | 'line' | 'text' | 'box' | 'frame' | 'circle' | 'disc' | 'bitmap' | 'icon';

declare type TSourceCode = {
    declarations: string[];
    code: string[];
};
