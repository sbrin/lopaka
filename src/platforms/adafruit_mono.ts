import {AdafruitPlatform} from './adafruit';
import {PlatformTemplates} from '/src/types';
import monoTemplate from './templates/adafruit/mono.pug';

export class AdafruitMonochromePlatform extends AdafruitPlatform {
    public static id = 'adafruit_gfx_mono';
    protected name = 'AdafruitGFX Mono';
    protected description = 'Adafruit GFX Monochrome';

    constructor() {
        super();
        this.features.defaultColor = '#FFFFFF';
        this.features.hasIndexedColors = true;
        this.features.palette = ['#000000', '#ffffff'];
        this.features.clearScreenMethod = 'clearDisplay()';
    }

    getClearScreenMethod() {
        return `clearDisplay()`;
    }

    protected templates: PlatformTemplates = {
        Default: {
            template: monoTemplate,
            settings: {
                wrap: false,
                include_fonts: false,
                include_images: true,
                declare_vars: true,
                comments: false,
                clear_screen: true,
            },
        },
    };

    packColor(color: string): string {
        if (color === '#000000' || color === '0xFFFF') return '0';
        return '1';
    }
}
