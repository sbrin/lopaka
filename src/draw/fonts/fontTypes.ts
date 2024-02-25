import adafruitFont from './binary/adafruit-5x7.bin?url';
import {FontFormat} from './font';

const bdfFiles = (import.meta as any).glob('./bdf/*.bdf');
export const bdfFonts = Object.keys(bdfFiles).map((path: string) => {
    const name = path.split('/').pop().replace('.bdf', '');
    return {
        name,
        title: name,
        file: bdfFiles[path],
        format: FontFormat.FORMAT_BDF
    };
});

export const fontTypes = {
    adafruit: {
        name: 'adafruit',
        title: 'Adafruit 5x7',
        file: adafruitFont,
        options: {
            textCharHeight: 7,
            textCharWidth: 5,
            size: 8
        },
        format: FontFormat.FORMAT_5x7
    },
};
