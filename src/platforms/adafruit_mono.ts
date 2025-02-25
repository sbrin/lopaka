import {AdafruitPlatform} from './adafruit';

export class AdafruitMonochromePlatform extends AdafruitPlatform {
    public static id = 'adafruit_gfx_mono';
    protected name = 'AdafruitGFX Mono';
    protected description = 'Adafruit GFX Monochrome';

    constructor() {
        super();
        this.features.hasRGBSupport = false;
        this.features.defaultColor = '#FFFFFF';
        this.features.hasIndexedColors = true;
        this.features.palette = ['#000000', '#ffffff'];
    }

    protected packColor(color: string): string {
        if (color === '#000000' || color === '0xFFFF') return '0';
        return '1';
    }
}
