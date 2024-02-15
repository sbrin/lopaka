import f4x6 from '/fonts/f4x6.ttf?url';
import haxrcorp4089 from '/fonts/haxrcorp4089.ttf?url';
import u8g2_font_helvB08 from '/fonts/helvb08.ttf?url';
import profont11 from './bdf/profont11.bdf?url';
import profont22 from '/fonts/profont22.ttf?url';
import bdf5x8 from './bdf/5x8.bdf?url';
import bdf6x10 from './bdf/6x10.bdf?url';
import adafruitFont from './binary/adafruit-5x7.bin?url';
import {FontFormat} from './font';
import timR10 from './bdf/timR10.bdf?url';
import timR12 from './bdf/timR12.bdf?url';
import timR14 from './bdf/timR14.bdf?url';
import timR18 from './bdf/timR18.bdf?url';
import timR24 from './bdf/timR24.bdf?url';

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
    haxrcorp4089_tr: {
        name: 'haxrcorp4089_tr',
        title: 'HaXRcorp 4089 8',
        file: haxrcorp4089,
        options: {
            textCharHeight: 8,
            textCharWidth: 4,
            size: 16
        },
        format: FontFormat.FORMAT_TTF
    },
    helvB08_tr: {
        name: 'helvB08_tr',
        title: 'Helvetica Bold 8',
        file: u8g2_font_helvB08,
        options: {
            textCharHeight: 8,
            textCharWidth: 5,
            size: 8
        },
        format: FontFormat.FORMAT_TTF
    },

    profont11: {
        name: 'profont11_mr',
        title: 'Profont 11',
        file: profont11,
        options: {
            textCharHeight: 11,
            textCharWidth: 8,
            size: 12
        },
        format: FontFormat.FORMAT_BDF
    },

    profont22_tr: {
        name: 'profont22_tr',
        title: 'Profont 22',
        file: profont22,
        options: {
            textCharHeight: 16,
            textCharWidth: 11,
            size: 22
        },
        format: FontFormat.FORMAT_TTF
    },
};
