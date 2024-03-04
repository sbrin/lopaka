import {AdafruitPlatform} from './adafruit';

export class InkplatePlatform extends AdafruitPlatform {
    public static id = 'inkplate';
    protected name = 'Inkplate';
    protected description = 'Inkplate';

    constructor() {
        super();
        this.features.hasRGBSupport = false;
        this.features.defaultColor = '#000000';
        this.features.screenBgColor = '#d4dde3';
        this.features.hasIndexedColors = true;
        // 8 colors: black, white and 6 shades of gray
        this.features.palette = [
            '#000000',
            '#111111',
            '#333333',
            '#555555',
            '#777777',
            '#999999',
            '#bbbbbb',
            '#ffffff'
        ];
    }

    // protected packColor(color: string): string {
    //     return '1';
    // }
}
