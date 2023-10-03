import {imgDataToUint32Array} from '../utils';
import adafruitFont from '../../fonts/adafruit.ttf';
import {Platform} from './platform';
import {Layer} from 'src/core/layer';

export class AdafruitPlatform extends Platform {
    public static id = 'adafruit_gfx';
    protected name = 'Adafruit GFX';
    protected description = 'Adafruit GFX';
    protected fonts: TPlatformFont[] = [
        {
            name: 'adafruit',
            file: adafruitFont,
            options: {
                textContainerHeight: 7,
                textCharWidth: 5,
                size: 8
            }
        }
    ];

    addDot(layer: Layer, source: TSourceCode): void {
        source.code.push(`display.drawPixel(${layer.position.x}, ${layer.position.y}, 1);`);
    }

    addText(layer: Layer, source: TSourceCode): void {
        source.code.push(`display.setTextColor(1);
display.setTextSize(1);
display.setCursor(${layer.position.x}, ${layer.position.y});
display.setTextWrap(false);
display.print("${layer.data.text}");`);
    }

    addLine(layer: Layer, source: TSourceCode): void {
        source.code.push(
            `display.drawLine(${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y}, 1);`
        );
    }

    addBox(layer: Layer, source: TSourceCode): void {
        source.code.push(
            `display.drawRect(${layer.position.x}, ${layer.position.y}, ${layer.size.x + 1}, ${layer.size.y + 1}, 1);`
        );
    }

    addCircle(layer: Layer, source: TSourceCode): void {
        const radius = layer.size.x / 2;
        source.code.push(
            `display.drawCircle(${layer.position.x + radius}, ${layer.position.y + radius}, ${radius}, 1);`
        );
    }

    addDisc(layer: Layer, source: TSourceCode): void {
        const radius = layer.size.x / 2;
        source.code.push(
            `display.fillCircle(${layer.position.x + radius}, ${layer.position.y + radius}, ${radius}, 1);`
        );
    }

    addFrame(layer: Layer, source: TSourceCode): void {
        source.code.push(
            `display.drawRect(${layer.position.x}, ${layer.position.y}, ${layer.size.x + 1}, ${layer.size.y + 1}, 1);`
        );
    }

    addImage(layer: Layer, source: TSourceCode): void {
        const XBMP = imgDataToUint32Array(layer.data);
        source.declarations.push(`static const unsigned char PROGMEM image_${layer.name}_bits[] = {${XBMP}};`);
        source.code.push(
            `display.drawBitmap( ${layer.position.x}, ${layer.position.y}, image_${layer.name}_bits, ${layer.size.x}, ${layer.size.y}, 1);`
        );
    }

    addIcon(layer: Layer, source: TSourceCode): void {
        this.addImage(layer, source);
    }
}
