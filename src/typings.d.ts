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
    name: string;
    x: number;
    y: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    radius: number;
    type: ELayerType;
    text: string;
    font: string;
    isOverlay: boolean;
    data: any; // imageData for ex.
};

declare enum ELayerType {
    dot = 'dot',
    line = 'line',
    text = 'text',
    box = 'box',
    frame = 'frame',
    circle = 'circle',
    disc = 'disc',
    bitmap = 'bitmap',
    icon = 'icon'
}

declare type TSourceCode = {
    declarations: string[];
    code: string[];
};
