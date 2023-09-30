import {imgDataToXBMP} from '../utils';
import f4x6_tr from '../../fonts/f4x6_tr.ttf';
import haxrcorp4089_tr from '../../fonts/haxrcorp4089_tr.ttf';
import profont22_tr from '../../fonts/profont22_tr.ttf';
import u8g2_font_haxrcorp4089_tr from '../../fonts/u8g2_font_haxrcorp4089_tr.ttf';
import u8g2_font_helvB08_tr from '../../fonts/u8g2_font_helvB08_tr.ttf';
import {Platform} from './platform';

export class U8g2Platform extends Platform {
    protected name = 'U8g2';
    protected description = 'U8g2';
    protected fonts: TPlatformFont[] = [
        {
            name: 'HaXRcorp4089',
            file: haxrcorp4089_tr,
            options: {
                textContainerHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },
        {
            name: 'HelvB08',
            file: u8g2_font_helvB08_tr,
            options: {
                textContainerHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },
        {
            name: 'HaXRcorp4089',
            file: u8g2_font_haxrcorp4089_tr,
            options: {
                textContainerHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },
        {
            name: 'Profont22',
            file: profont22_tr,
            options: {
                textContainerHeight: 22,
                textCharWidth: 12,
                size: 22
            }
        },
        {
            name: 'F4x6',
            file: f4x6_tr,
            options: {
                textContainerHeight: 6,
                textCharWidth: 4,
                size: 6
            }
        }
    ];

    drawDot(layer: TLayer, source: TSourceCode): void {
        source.code.push(`u8g2.drawPixel(${layer.x}, ${layer.y});`);
    }
    drawLine(layer: TLayer, source: TSourceCode): void {
        source.code.push(`u8g2.drawLine(${layer.x}, ${layer.y}, ${layer.x2}, ${layer.y2});`);
    }
    drawText(layer: TLayer, source: TSourceCode): void {
        source.code.push(`u8g2.setFont(${layer.font});
u8g2.drawStr(${layer.x}, ${layer.y}, "${layer.text}");`);
    }
    drawBox(layer: TLayer, source: TSourceCode): void {
        source.code.push(`u8g2.drawBox(${layer.x}, ${layer.y}, ${layer.width}, ${layer.height});`);
    }
    drawFrame(layer: TLayer, source: TSourceCode): void {
        source.code.push(`u8g2.drawFrame(${layer.x}, ${layer.y}, ${layer.width}, ${layer.height});`);
    }
    drawCircle(layer: TLayer, source: TSourceCode): void {
        source.code.push(`u8g2.drawCircle(${layer.x + layer.radius}, ${layer.y + layer.radius}, ${layer.radius});`);
    }
    drawDisc(layer: TLayer, source: TSourceCode): void {
        source.code.push(`u8g2.drawDisc(${layer.x + layer.radius}, ${layer.y + layer.radius}, ${layer.radius});`);
    }
    drawBitmap(layer: TLayer, source: TSourceCode): void {
        const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.width, layer.height);
        source.declarations.push(`static const unsigned char image_${layer.name}_bits[] U8X8_PROGMEM = {${XBMP}};`);
        source.code.push(
            `u8g2.drawXBMP( ${layer.x}, ${layer.y}, ${layer.width}, ${layer.height}, image_${layer.name}_bits);`
        );
    }
    drawIcon(layer: TLayer, source: TSourceCode): void {
        return this.drawBitmap(layer, source);
    }
}
