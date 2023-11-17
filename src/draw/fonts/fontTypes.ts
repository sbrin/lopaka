import f4x6 from '/fonts/f4x6.ttf?url';
import haxrcorp4089 from '/fonts/haxrcorp4089.ttf?url';
import u8g2_font_helvB08 from '/fonts/helvb08.ttf?url';
import profont22 from '/fonts/profont22.ttf?url';
import bdf5x8 from './bdf/5x8.bdf?url';
import bdf6x10 from './bdf/6x10.bdf?url';
import adafruitFont from './binary/adafruit-5x7.bin?url';
import { FontFormat } from "./font";

export const fontTypes = {
    'adafruit': {
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
    'haxrcorp4089_tr': {
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
    'helvB08_tr': {
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

    // TODO: add profont11_mr
    //
    // 'profont11_mr': {
    //     name: 'profont11_mr',
    //     title: 'Profont 11',
    //     file: profont22,
    //     options: {
    //         textCharHeight: 16,
    //         textCharWidth: 11,
    //         size: 11
    //     },
    //     format: FontFormat.FORMAT_TTF
    // },

    'profont22_tr': {
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
    '4x6_tr': {
        name: '4x6_tr',
        title: '4x6',
        file: f4x6,
        options: {
            textCharHeight: 6,
            textCharWidth: 4,
            size: 6
        },
        format: FontFormat.FORMAT_TTF
    },
    '5x8_tr': {
        name: '5x8_tr',
        title: '5x8',
        file: bdf5x8,
        options: {
            textCharHeight: 10,
            textCharWidth: 5,
            size: 10
        },
        format: FontFormat.FORMAT_BDF
    },
    '6x10_tr': {
        name: '6x10_tr',
        title: '6x10',
        file: bdf6x10,
        options: {
            textCharHeight: 10,
            textCharWidth: 6,
            size: 10
        },
        format: FontFormat.FORMAT_BDF
    }
}