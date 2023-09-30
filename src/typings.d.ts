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

declare type TPlatformFont = {
  name: string;
  file: string;
};
