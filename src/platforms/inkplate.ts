import {AdafruitPlatform} from './adafruit';
import {InkplateParser} from './parsers/inkplate.parser';
import defaultTemplate from './templates/adafruit/default.pug';
import {Point} from '/src/core/point';

export class InkplatePlatform extends AdafruitPlatform {
    public static id = 'inkplate';
    protected name = 'Inkplate';
    protected description = 'Inkplate';

    protected parser: InkplateParser = new InkplateParser();

    protected templates = {
        Default: {
            template: defaultTemplate,
            settings: {
                wrap: false,
                include_fonts: false,
                comments: false,
            },
        },
    };

    public displays = [
        {title: '2 (202×104)', size: new Point(202, 104)},
        {title: '6COLOR (600×448)', size: new Point(600, 448)},
        {title: '4TEMPERA (600×600)', size: new Point(600, 600)},
        {title: '6 (800×600)', size: new Point(800, 600)},
        {title: '5 (960×540)', size: new Point(960, 540)},
        {title: '5V2 (1280×720)', size: new Point(1280, 720)},
        {title: '6PLUS (1024×758)', size: new Point(1024, 758)},
        {title: '10 (1200×825)', size: new Point(1200, 825)},
    ];

    constructor() {
        super();
        Object.assign(this.features, {
            hasIndexedColors: true,
            palette: ['#000000', '#111111', '#333333', '#555555', '#777777', '#999999', '#bbbbbb', '#f8f8f8'],
            defaultColor: '#000000',
            screenBgColor: '#f8f8f8',
            interfaceColors: {
                selectColor: 'rgba(0, 0, 0, 0.9)',
                resizeIconColor: 'rgba(0, 0, 0, 0.6)',
                hoverColor: 'rgba(0, 0, 0, 0.5)',
                rulerColor: '#999',
                rulerLineColor: '#999',
                selectionStrokeColor: 'rgba(0, 0, 0, 0.9)',
            },
        });
    }

    protected getTextPosition(layer: any) {
        if (layer.font === 'adafruit') {
            return [layer.position[0], layer.position[1] - layer.bounds[3]];
        }
        return [layer.position[0], layer.position[1] - layer.scaleFactor];
    }

    protected packColor(color: string): string {
        switch (color) {
            case '#000000':
                return '0';
            case '#111111':
                return '1';
            case '#333333':
                return '2';
            case '#555555':
                return '3';
            case '#777777':
                return '4';
            case '#999999':
                return '5';
            case '#bbbbbb':
                return '6';
            case '#f8f8f8':
            case '#ffffff':
                return '7';
        }
        return '0';
    }
}
