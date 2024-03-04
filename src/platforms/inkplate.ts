import {AdafruitPlatform} from './adafruit';
import defaultTemplate from './templates/adafruit/inkplate.pug';

export class InkplatePlatform extends AdafruitPlatform {
    public static id = 'inkplate';
    protected name = 'Inkplate';
    protected description = 'Inkplate';

    protected templates = {
        Default: {
            template: defaultTemplate,
            settings: {}
        }
    };

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

    protected packColor(color: string): string {
        switch (color) {
            case '#000000':
                return '0';
            case '#111111':
                return '6';
            case '#333333':
                return '5';
            case '#555555':
                return '4';
            case '#777777':
                return '3';
            case '#999999':
                return '2';
            case '#bbbbbb':
                return '1';
            case '#ffffff':
                return '7';
        }
        return '1';
    }
}
