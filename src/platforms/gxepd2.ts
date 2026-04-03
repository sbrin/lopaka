import { AdafruitPlatform } from './adafruit';
import { GxEPD2Parser } from './parsers/gxepd2.parser';
import defaultTemplate from './templates/adafruit/mono.pug';
import { Point } from '/src/core/point';

export class GxEPD2Platform extends AdafruitPlatform {
    public static id = 'gxepd2';
    protected name = 'GxEPD2 (e-paper)';
    protected description = 'GxEPD2';

    protected parser: GxEPD2Parser = new GxEPD2Parser();

    protected templates = {
        Default: {
            template: defaultTemplate,
            settings: {
                wrap: false,
                include_fonts: false,
                include_images: true,
                declare_vars: true,
                comments: false,
                clear_screen: true,
            },
        },
    };

    constructor() {
        super();
        this.features.hasIndexedColors = true;
        this.features.palette = [
            '#000000',
            '#ffffff',
            '#808080',
            '#c0c0c0',
            '#ff0000',
            '#ffff00',
            '#0000ff',
            '#00ff00',
            '#ff8000',
        ];
        this.features.defaultColor = '#000000';
        this.features.screenBgColor = '#f8f8f8';
        this.features.interfaceColors = {
            selectColor: '#999',
            resizeIconColor: 'rgba(0, 0, 0, 0.6)',
            hoverColor: 'rgba(0, 0, 0, 0.5)',
            rulerColor: '#999',
            rulerLineColor: '#999',
            selectionStrokeColor: '#999',
        };
    }

    getClearScreenMethod(color) {
        return `fillScreen(${this.packColor(color)})`;
    }

    packColor(color: string): string {
        switch (color) {
            case '#000000':
                return 'GxEPD_BLACK';
            case '#f8f8f8':
            case '#ffffff':
                return 'GxEPD_WHITE';
            case '#808080':
                return 'GxEPD_DARKGREY';
            case '#c0c0c0':
                return 'GxEPD_LIGHTGREY';
            case '#ff0000':
                return 'GxEPD_RED';
            case '#ffff00':
                return 'GxEPD_YELLOW';
            case '#0000ff':
                return 'GxEPD_BLUE';
            case '#00ff00':
                return 'GxEPD_GREEN';
            case '#ff8000':
                return 'GxEPD_ORANGE';
        }
        return 'GxEPD_BLACK';
    }
}
