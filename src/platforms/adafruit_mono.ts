import {AdafruitPlatform} from './adafruit';

export class AdafruitMonochromePlatform extends AdafruitPlatform {
    public static id = 'adafruit_gfx_mono';
    protected name = 'AdafruitGFX Mono';
    protected description = 'Adafruit GFX Monochrome';

    constructor() {
        super();
        this.features.hasRGBSupport = false;
        this.features.defaultColor = '#FFFFFF';
    }

    protected packColor(color: string): string {
        return '1';
    }
}
