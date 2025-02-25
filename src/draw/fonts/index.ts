import {BDFFont} from './bdf.font';
import {BinaryFont} from './binary.font';
import {Font, FontFormat} from './font';
import {TTFFont} from './ttf.font';
import {GFXFont} from '/src/draw/fonts/gfx.font';

const loadedFonts: Map<string, Font> = new Map();
export async function loadFont(platformFont: TPlatformFont): Promise<Font> {
    if (!loadedFonts.has(platformFont.name)) {
        let font: Font;
        switch (platformFont.format) {
            case FontFormat.FORMAT_BDF:
                font = new BDFFont(platformFont.file, platformFont.name, platformFont.options);
                break;
            case FontFormat.FORMAT_TTF:
                font = new TTFFont(platformFont.file, platformFont.name, platformFont.options);
                break;
            case FontFormat.FORMAT_5x7:
                font = new BinaryFont(platformFont.file, platformFont.name, platformFont.options);
                break;
            case FontFormat.FORMAT_GFX:
                font = new GFXFont(platformFont.file, platformFont.name, platformFont.options);
                break;
        }
        await font.fontReady;
        loadedFonts.set(platformFont.name, font);
    }
    return loadedFonts.get(platformFont.name);
}

export function getFont(name: string): Font {
    const font = loadedFonts.get(name);
    if (font) {
        return font;
    } else {
        return loadedFonts.values().next().value;
    }
}
