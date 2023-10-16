import {imgDataToUint32Array} from '../utils';
import adafruitFont from '../draw/fonts/binary/adafruit-5x7.bin?url';
import {Platform} from './platform';
import {Layer} from 'src/core/layer';
import {FontFormat} from '../draw/fonts/font';

export class AdafruitPlatform extends Platform {
    public static id = 'adafruit_gfx';
    protected name = 'Adafruit GFX';
    protected description = 'Adafruit GFX';
    protected fonts: TPlatformFont[] = [
        {
            name: 'adafruit',
            title: 'Adafruit 5x7',
            file: adafruitFont,
            options: {
                textCharHeight: 7,
                textCharWidth: 5,
                size: 8
            },
            format: FontFormat.FORMAT_5x7
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
        const from = layer.position.clone();
        const to = layer.position.clone().add(layer.size);
        source.code.push(`display.drawLine(${from.x}, ${from.y}, ${to.x}, ${to.y}, 1);`);
    }

    addBox(layer: Layer, source: TSourceCode): void {
        source.code.push(
            `display.drawRect(${layer.position.x}, ${layer.position.y}, ${layer.size.x + 1}, ${layer.size.y + 1}, 1);`
        );
    }

    addCircle(layer: Layer, source: TSourceCode): void {
        const radius = (layer.size.x + 1) / 2;
        const center = layer.position.clone().add(radius).add(1);
        source.code.push(`display.drawCircle(${center.x}, ${center.y}, ${radius}, 1);`);
    }

    addDisc(layer: Layer, source: TSourceCode): void {
        const radius = (layer.size.x + 1) / 2;
        const center = layer.position.clone().add(radius).add(1);
        source.code.push(`display.fillCircle(${center.x}, ${center.y}, ${radius}, 1);`);
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
