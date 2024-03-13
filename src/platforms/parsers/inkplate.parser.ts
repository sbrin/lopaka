import {AdafruitParser} from './adafruit.parser';

export class InkplateParser extends AdafruitParser {
    protected getColor(color: string): string {
        switch (color) {
            case '0':
                return '#000000';
            case '1':
                return '#111111';
            case '2':
                return '#333333';
            case '3':
                return '#555555';
            case '4':
                return '#777777';
            case '5':
                return '#999999';
            case '6':
                return '#bbbbbb';
            case '7':
                return '#f8f8f8';
        }
        return '#000000';
    }
}
