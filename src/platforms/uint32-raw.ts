import f4x6 from '../../fonts/f4x6.ttf?url';
import haxrcorp4089 from '../../fonts/haxrcorp4089.ttf?url';
import u8g2_font_helvB08 from '../../fonts/helvb08.ttf?url';
import profont22 from '../../fonts/profont22.ttf?url';
import bdf5x8 from '../draw/fonts/bdf/5x8.bdf?url';
import bdf6x10 from '../draw/fonts/bdf/6x10.bdf?url';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {imgDataToUint32Array} from '../utils';
import {Platform} from './platform';
import {FontFormat} from '../draw/fonts/font';
export class Uint32RawPlatform extends Platform {
    public static id = 'uint32';
    protected name = 'Uint32 Raw';
    protected description = 'Uint32 Raw';

    public getFonts(): TPlatformFont[] {
        return [
            {
                name: 'HaXRcorp4089_tr',
                title: 'HaXRcorp 4089 8',
                file: haxrcorp4089,
                options: {
                    textCharHeight: 8,
                    textCharWidth: 4,
                    size: 16
                },
                format: FontFormat.FORMAT_TTF
            },
            {
                name: 'HelvB08_tr',
                title: 'Helvetica Bold 8',
                file: u8g2_font_helvB08,
                options: {
                    textCharHeight: 8,
                    textCharWidth: 5,
                    size: 8
                },
                format: FontFormat.FORMAT_TTF
            },
    
            {
                name: 'Profont22_tr',
                title: 'Profont 22',
                file: profont22,
                options: {
                    textCharHeight: 16,
                    textCharWidth: 11,
                    size: 22
                },
                format: FontFormat.FORMAT_TTF
            },
            {
                name: 'F4x6_tr',
                title: 'F4x6',
                file: f4x6,
                options: {
                    textCharHeight: 6,
                    textCharWidth: 4,
                    size: 6
                },
                format: FontFormat.FORMAT_TTF
            },
            {
                name: '5x8_tr',
                title: '5x8',
                file: bdf5x8,
                options: {
                    textCharHeight: 8,
                    textCharWidth: 5,
                    size: 8
                },
                format: FontFormat.FORMAT_BDF
            },
            {
                name: '6x10_tr',
                title: '6x10',
                file: bdf6x10,
                options: {
                    textCharHeight: 10,
                    textCharWidth: 6,
                    size: 10
                },
                format: FontFormat.FORMAT_BDF
            }
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
