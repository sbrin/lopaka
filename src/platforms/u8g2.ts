import f4x6 from '../../fonts/f4x6.ttf';
import haxrcorp4089 from '../../fonts/haxrcorp4089.ttf';
import u8g2_font_helvB08 from '../../fonts/helvb08.ttf';
import profont22 from '../../fonts/profont22.ttf';
import {imgDataToXBMP} from '../utils';
import {Platform} from './platform';

export class U8g2Platform extends Platform {
    protected name = 'U8g2';
    protected description = 'U8g2';
    protected fonts: TPlatformFont[] = [
        {
            name: 'HaXRcorp4089',
            file: haxrcorp4089,
            options: {
                textContainerHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },
        {
            name: 'HelvB08',
            file: u8g2_font_helvB08,
            options: {
                textContainerHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },

        {
            name: 'Profont22',
            file: profont22,
            options: {
                textContainerHeight: 22,
                textCharWidth: 12,
                size: 22
            }
        },
        {
            name: 'F4x6',
            file: f4x6,
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
