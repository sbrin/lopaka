import {AbstractLayer} from '../core/layers/abstract.layer';
import {imgDataToUint32Array} from '../utils';
import {Platform} from './platform';
import { fontTypes } from "../draw/fonts/fontTypes";
export class Uint32RawPlatform extends Platform {
    public static id = 'uint32';
    protected name = 'Uint32 Raw';
    protected description = 'Uint32 Raw';

    public getFonts(): TPlatformFont[] {
        return [
            fontTypes['4x6_tr'],
            fontTypes['5x8_tr'],
            fontTypes['haxrcorp4089_tr'],
            fontTypes['helvB08_tr'],
            fontTypes['6x10_tr'],
            fontTypes['profont22_tr'],
        ];
    }

    addDot(layer: AbstractLayer, source: TSourceCode): void {}
    addLine(layer: AbstractLayer, source: TSourceCode): void {}
    addText(layer: AbstractLayer, source: TSourceCode): void {}
    addBox(layer: AbstractLayer, source: TSourceCode): void {}
    addFrame(layer: AbstractLayer, source: TSourceCode): void {}
    addCircle(layer: AbstractLayer, source: TSourceCode): void {}
    addDisc(layer: AbstractLayer, source: TSourceCode): void {}
    addImage(layer: AbstractLayer, source: TSourceCode): void {}
    addIcon(layer: AbstractLayer, source: TSourceCode): void {}

    public generateSourceCode(layers: AbstractLayer[], ctx: OffscreenCanvasRenderingContext2D): TSourceCode {
        const source: TSourceCode = {code: [], declarations: []};
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const UINT32 = imgDataToUint32Array(imageData);
        const iconName = `image_frame`;
        source.declarations.push(`const uint32_t ${iconName}[] = {${UINT32}};`);
        return source;
    }
}
