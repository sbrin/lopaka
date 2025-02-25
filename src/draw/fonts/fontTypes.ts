import adafruitFont from './binary/adafruit-5x7.bin?url';
import {FontFormat} from './font';

const bdfFiles = (import.meta as any).glob('./bdf/*.bdf');
const gfxFiles = (import.meta as any).glob('./gfx/*.h');
const gfxSourcesFiles = (import.meta as any).glob('./gfx/*.h', {as: 'raw'});

export const bdfFonts = Object.keys(bdfFiles).map((path: string) => {
    const name = path.split('/').pop().replace('.bdf', '');
    return {
        name,
        title: name,
        file: bdfFiles[path],
        format: FontFormat.FORMAT_BDF,
    };
});

export const gfxFonts = Object.keys(gfxFiles).map((path: string) => {
    const name = path.split('/').pop().replace('.h', '');
    return {
        name,
        title: name,
        file: gfxFiles[path],
        format: FontFormat.FORMAT_GFX,
    };
});

export const gfxSources = Object.keys(gfxSourcesFiles).map((path: string) => {
    const name = path.split('/').pop().replace('.h', '');
    return {
        name,
        file: gfxSourcesFiles[path],
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
            size: 8,
        },
        format: FontFormat.FORMAT_5x7,
    },
};
