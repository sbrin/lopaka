import {imgDataToUint32Array} from '../utils';
import adafruitFont from '../../fonts/adafruit.ttf';
import {Platform} from './platform';

export class AdafruitPlatform extends Platform {
    protected name = 'Adafruit GFX';
    protected description = 'Adafruit GFX';
    protected fonts: TPlatformFont[] = [
        {
            name: 'Adafruit 5x7',
            file: adafruitFont,
            options: {
                textContainerHeight: 7,
                textCharWidth: 5,
                size: 8
            }
        }
    ];

    drawDot(layer: TLayer, source: TSourceCode): void {
        source.code.push(`display.drawPixel(${layer.x}, ${layer.y}, 1);`);
    }

    drawText(layer: TLayer, source: TSourceCode): void {
        source.code.push(`display.setTextColor(1);
display.setTextSize(1);
display.setCursor(${layer.x}, ${layer.y});
display.setTextWrap(false);
display.print("${layer.text}");`);
    }

    drawLine(layer: TLayer, source: TSourceCode): void {
        source.code.push(`display.drawLine(${layer.x}, ${layer.y}, ${layer.x2}, ${layer.y2}, 1);`);
    }

    drawBox(layer: TLayer, source: TSourceCode): void {
        source.code.push(`display.drawRect(${layer.x}, ${layer.y}, ${layer.width + 1}, ${layer.height + 1}, 1);`);
    }

    drawCircle(layer: TLayer, source: TSourceCode): void {
        source.code.push(
            `display.drawCircle(${layer.x + layer.radius}, ${layer.y + layer.radius}, ${layer.radius}, 1);`
        );
    }

    drawDisc(layer: TLayer, source: TSourceCode): void {
        source.code.push(
            `display.fillCircle(${layer.x + layer.radius}, ${layer.y + layer.radius}, ${layer.radius}, 1);`
        );
    }

    drawFrame(layer: TLayer, source: TSourceCode): void {
        source.code.push(`display.drawRect(${layer.x}, ${layer.y}, ${layer.width + 1}, ${layer.height + 1}, 1);`);
    }

    drawIcon(layer: TLayer, source: TSourceCode): void {
        this.drawBitmap(layer, source);
    }

    drawBitmap(layer: TLayer, source: TSourceCode): void {
        const XBMP = imgDataToUint32Array(layer.data);
        source.declarations.push(`static const unsigned char PROGMEM image_${layer.name}_bits[] = {${XBMP}};`);
        source.code.push(
            `display.drawBitmap( ${layer.x}, ${layer.y}, image_${layer.name}_bits, ${layer.width}, ${layer.height}, 1);`
        );
    }
}
