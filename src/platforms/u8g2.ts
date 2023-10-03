import {Layer} from 'src/core/layer';
import f4x6 from '../../fonts/f4x6.ttf';
import haxrcorp4089 from '../../fonts/haxrcorp4089.ttf';
import u8g2_font_helvB08 from '../../fonts/helvb08.ttf';
import profont22 from '../../fonts/profont22.ttf';
import {imgDataToXBMP} from '../utils';
import {Platform} from './platform';

export class U8g2Platform extends Platform {
    public static id = 'u8g2';
    protected name = 'U8g2';
    protected description = 'U8g2';
    protected fonts: TPlatformFont[] = [
        {
            name: 'HaXRcorp4089_tr',
            file: haxrcorp4089,
            options: {
                textContainerHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },
        {
            name: 'HelvB08_tr',
            file: u8g2_font_helvB08,
            options: {
                textContainerHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },

        {
            name: 'Profont22_tr',
            file: profont22,
            options: {
                textContainerHeight: 22,
                textCharWidth: 12,
                size: 22
            }
        },
        {
            name: 'F4x6_tr',
            file: f4x6,
            options: {
                textContainerHeight: 6,
                textCharWidth: 4,
                size: 6
            }
        }
    ];

    addDot(layer: Layer, source: TSourceCode): void {
        source.code.push(`u8g2.drawPixel(${layer.position.x}, ${layer.position.y});`);
    }
    addLine(layer: Layer, source: TSourceCode): void {
        source.code.push(`u8g2.drawLine(${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`);
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
        const radius = layer.size.x / 2;
        source.code.push(`u8g2.drawCircle(${layer.position.x + radius}, ${layer.position.y + radius}, ${radius});`);
    }
    addDisc(layer: Layer, source: TSourceCode): void {
        const radius = layer.size.x / 2;
        source.code.push(`u8g2.drawDisc(${layer.position.x + radius}, ${layer.position.y + radius}, ${radius});`);
    }
    addImage(layer: Layer, source: TSourceCode): void {
        const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y);
        source.declarations.push(`static const unsigned char image_${layer.name}_bits[] U8X8_PROGMEM = {${XBMP}};`);
        source.code.push(
            `u8g2.drawXBMP( ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y}, image_${layer.name}_bits);`
        );
    }
    addIcon(layer: Layer, source: TSourceCode): void {
        return this.addImage(layer, source);
    }
}
