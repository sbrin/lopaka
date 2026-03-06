import {TextLayer} from '../core/layers/text.layer';
import {bdfFonts, gfxFonts, ttfFonts} from '../draw/fonts/fontTypes';
import {Platform} from './platform';

export class FreestylePlatform extends Platform {
    public static id = 'freestyle';
    protected name = 'Free Drawing';
    protected description = 'Free Drawing mode';
    protected fonts: TPlatformFont[] = [...ttfFonts, ...bdfFonts, ...gfxFonts];
    protected parser = null;

    protected currentTemplate: string = 'default';

    constructor() {
        super();
        Object.assign(this.features, {
            hasRGBSupport: true,
            hasCustomFontSize: true,
            defaultColor: '#000000',
            screenBgColor: '#FFFFFF',
            interfaceColors: {
                selectColor: '#999',
                resizeIconColor: 'rgba(0, 0, 0, 0.6)',
                hoverColor: 'rgba(0, 0, 0, 0.5)',
                rulerColor: '#999',
                rulerLineColor: '#999',
                selectionStrokeColor: '#999',
            },
        });
    }

    generateSourceCode(layers?: any[], ctx?: OffscreenCanvasRenderingContext2D, screenTitle?: string): string {
        return '';
    }

    getTextPosition(layer: TextLayer) {
        return [layer.position[0], layer.position[1] - layer.bounds[3]];
    }
}
