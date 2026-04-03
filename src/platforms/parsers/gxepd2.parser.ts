import {AdafruitParser} from './adafruit.parser';

export class GxEPD2Parser extends AdafruitParser {
    protected getColor(color: string): string {
        switch (color) {
            case 'GxEPD_BLACK':
                return '#000000';
            case 'GxEPD_WHITE':
                return '#ffffff';
            case 'GxEPD_DARKGREY':
                return '#808080';
            case 'GxEPD_LIGHTGREY':
                return '#c0c0c0';
            case 'GxEPD_RED':
                return '#ff0000';
            case 'GxEPD_YELLOW':
                return '#ffff00';
            case 'GxEPD_BLUE':
                return '#0000ff';
            case 'GxEPD_GREEN':
                return '#00ff00';
            case 'GxEPD_ORANGE':
                return '#ff8000';
        }
        return super.getColor(color);
    }
}
