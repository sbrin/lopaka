import {imgDataToUint32Array} from 'src/utils';
import {Platform} from './platform';

export class Uint32RawPlatform extends Platform {
    protected name = 'Uint32 Raw';
    protected description = 'Uint32 Raw';

    drawDot(layer: TLayer, source: TSourceCode): void {}
    drawLine(layer: TLayer, source: TSourceCode): void {}
    drawText(layer: TLayer, source: TSourceCode): void {}
    drawBox(layer: TLayer, source: TSourceCode): void {}
    drawFrame(layer: TLayer, source: TSourceCode): void {}
    drawCircle(layer: TLayer, source: TSourceCode): void {}
    drawDisc(layer: TLayer, source: TSourceCode): void {}
    drawBitmap(layer: TLayer, source: TSourceCode): void {}
    drawIcon(layer: TLayer, source: TSourceCode): void {}

    public genereateSourceCode(layers: TLayer[], ctx: OffscreenCanvasRenderingContext2D): TSourceCode {
        const source: TSourceCode = {code: [], declarations: []};
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const UINT32 = imgDataToUint32Array(imageData);
        const iconName = `image_frame`;
        source.declarations.push(`const uint32_t ${iconName}[] = {${UINT32}};`);
        return source;
    }
}
