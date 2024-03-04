import {AdafruitPlatform} from './adafruit';

export class InkplatePlatform extends AdafruitPlatform {
    public static id = 'inkplate';
    protected name = 'Inkplate';
    protected description = 'Inkplate';

    constructor() {
        super();
        Object.assign(this.features, {
            hasIndexedColors: true,
            palette: ['#000000', '#111111', '#333333', '#555555', '#777777', '#999999', '#bbbbbb', '#ffffff'],
            defaultColor: '#000000',
            screenBgColor: '#e2eeee',
            interfaceColors: {
                selectColor: 'rgba(0, 0, 0, 0.9)',
                resizeIconColor: 'rgba(0, 0, 0, 0.6)',
                hoverColor: 'rgba(0, 0, 0, 0.5)',
                rulerColor: '#ff8200',
                rulerLineColor: '#955B2F',
                selectionStrokeColor: 'rgba(0, 0, 0, 0.9)'
            }
        });
    }

    // protected packColor(color: string): string {
    //     return '1';
    // }
}
