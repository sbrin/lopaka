import {Layer} from 'src/core/layer';
import {imgDataToUint32Array} from '../utils';
import {Platform} from './platform';

export class Uint32RawPlatform extends Platform {
    public static id = 'uint32';
    protected name = 'Uint32 Raw';
    protected description = 'Uint32 Raw';

    addDot(layer: Layer, source: TSourceCode): void {}
    addLine(layer: Layer, source: TSourceCode): void {}
    addText(layer: Layer, source: TSourceCode): void {}
    addBox(layer: Layer, source: TSourceCode): void {}
    addFrame(layer: Layer, source: TSourceCode): void {}
    addCircle(layer: Layer, source: TSourceCode): void {}
    addDisc(layer: Layer, source: TSourceCode): void {}
    addImage(layer: Layer, source: TSourceCode): void {}
    addIcon(layer: Layer, source: TSourceCode): void {}

    public generateSourceCode(layers: Layer[], ctx: OffscreenCanvasRenderingContext2D): TSourceCode {
        const source: TSourceCode = {code: [], declarations: []};
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const UINT32 = imgDataToUint32Array(imageData);
        const iconName = `image_frame`;
        source.declarations.push(`const uint32_t ${iconName}[] = {${UINT32}};`);
        return source;
    }
}
