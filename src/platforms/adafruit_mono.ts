import {AbstractLayer} from '../core/layers/abstract.layer';
import {AdafruitPlatform} from './adafruit';

export class AdafruitMonochromePlatform extends AdafruitPlatform {
    public static id = 'adafruit_gfx_mono';
    protected name = 'Adafruit GFX Monochrome';
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
