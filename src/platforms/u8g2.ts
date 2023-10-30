import {Layer} from 'src/core/layer';
import f4x6 from '../../fonts/f4x6.ttf?url';
import haxrcorp4089 from '../../fonts/haxrcorp4089.ttf?url';
import u8g2_font_helvB08 from '../../fonts/helvb08.ttf?url';
import profont22 from '../../fonts/profont22.ttf?url';
import {imgDataToXBMP} from '../utils';
import {Platform} from './platform';
import {FontFormat} from '../draw/fonts/font';
import bdf5x8 from '../draw/fonts/bdf/5x8.bdf?url';
import bdf6x10 from '../draw/fonts/bdf/6x10.bdf?url';

export class U8g2Platform extends Platform {
    public static id = 'u8g2';
    protected name = 'U8g2';
    protected description = 'U8g2';
    protected fonts: TPlatformFont[] = [
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

    public generateSourceCode(layers: Layer[], ctx?: OffscreenCanvasRenderingContext2D): TSourceCode {
        const source = super.generateSourceCode(layers, ctx);
        source.declarations.unshift('u8g2.setBitmapMode(1);');
        return source;
    }

    addDot(layer: Layer, source: TSourceCode): void {
        source.code.push(`u8g2.drawPixel(${layer.position.x}, ${layer.position.y});`);
    }
    addLine(layer: Layer, source: TSourceCode): void {
        const from = layer.position.clone();
        const to = layer.position.clone().add(layer.size);
        source.code.push(`u8g2.drawLine(${from.x}, ${from.y}, ${to.x}, ${to.y});`);
    }
    addText(layer: Layer, source: TSourceCode): void {
        source.code.push(`u8g2.setFont(${layer.data.font});
u8g2.drawStr(${layer.position.x}, ${layer.position.y}, "${layer.data.text}");`);
    }
    addBox(layer: Layer, source: TSourceCode): void {
        source.code.push(`u8g2.drawBox(${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`);
    }
    addFrame(layer: Layer, source: TSourceCode): void {
        source.code.push(`u8g2.drawFrame(${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`);
    }
    addCircle(layer: Layer, source: TSourceCode): void {
        const radius = (layer.size.x + 1) / 2;
        const center = layer.position.clone().add(radius).add(1);
        source.code.push(`u8g2.drawCircle(${center.x}, ${center.y}, ${radius});`);
    }
    addDisc(layer: Layer, source: TSourceCode): void {
        const radius = (layer.size.x + 1) / 2;
        const center = layer.position.clone().add(radius).add(1);
        source.code.push(`u8g2.drawDisc(${center.x}, ${center.y}, ${radius});`);
    }
    addImage(layer: Layer, source: TSourceCode): void {
        if (!layer.data.image) return;
        const XBMP = imgDataToXBMP(layer.data.image, 0, 0, layer.size.x, layer.size.y);
        source.declarations.push(`static const unsigned char image_${layer.name}_bits[] U8X8_PROGMEM = {${XBMP}};`);
        source.code.push(
            `u8g2.drawXBMP( ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y}, image_${layer.name}_bits);`
        );
    }
    addIcon(layer: Layer, source: TSourceCode): void {
        return this.addImage(layer, source);
    }
}
