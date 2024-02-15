import {AbstractLayer} from '../core/layers/abstract.layer';
import {bdfFonts} from '../draw/fonts/fontTypes';
import {imgDataToUint32Array} from '../utils';
import {Platform} from './platform';
export class Uint32RawPlatform extends Platform {
    public static id = 'uint32';
    protected name = 'Uint32 Bitmap';
    protected description = 'Uint32 Bitmap';

    protected fonts: TPlatformFont[] = [...bdfFonts];
    constructor() {
        super();
        this.features.hasInvertedColors = true;
        this.features.defaultColor = '#FFFFFF';
    }

    public generateSourceCode(
        templateName: string,
        layers: AbstractLayer[],
        ctx: OffscreenCanvasRenderingContext2D
    ): string {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const UINT32 = imgDataToUint32Array(imageData);
        const iconName = `image_frame`;
        return `const uint32_t ${iconName}[] = {${UINT32}};`;
    }
}
