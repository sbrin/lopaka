import {BoxLayer} from '../core/layers/box.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {DiscLayer} from '../core/layers/disc.layer';
import {DotLayer} from '../core/layers/dot.layer';
import {FrameLayer} from '../core/layers/frame.layer';
import {IconLayer} from '../core/layers/icon.layer';
import {LineLayer} from '../core/layers/line.layer';
import {PaintLayer} from '../core/layers/paint.layer';
import {TextLayer} from '../core/layers/text.layer';
import adafruitFont from '../draw/fonts/binary/adafruit-5x7.bin?url';
import {FontFormat} from '../draw/fonts/font';
import {imgDataToUint32Array} from '../utils';
import {Platform} from './platform';

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
    private color = '0xFFFF';

    addDot(layer: DotLayer, source: TSourceCode): void {
        source.code.push(`display.drawPixel(${layer.position.x}, ${layer.position.y},  ${this.color});`);
    }

    addText(layer: TextLayer, source: TSourceCode): void {
        source.code.push(`display.setTextColor(${this.color});
display.setTextSize(1);
display.setCursor(${layer.position.x}, ${layer.position.y});
display.setTextWrap(false);
display.print("${layer.text}");`);
    }

    addLine(layer: LineLayer, source: TSourceCode): void {
        const {p1, p2} = layer;
        source.code.push(`display.drawLine(${p1.x}, ${p1.y}, ${p2.x}, ${p2.y}, ${this.color});`);
    }

    addBox(layer: BoxLayer, source: TSourceCode): void {
        source.code.push(
            `display.drawRect(${layer.position.x}, ${layer.position.y}, ${layer.size.x + 1}, ${layer.size.y + 1}, ${
                this.color
            });`
        );
    }

    addCircle(layer: CircleLayer, source: TSourceCode): void {
        const {radius, position} = layer;
        const center = position.clone().add(radius).add(1);
        source.code.push(`display.drawCircle(${center.x}, ${center.y}, ${radius},  ${this.color});`);
    }

    addDisc(layer: DiscLayer, source: TSourceCode): void {
        const {radius, position} = layer;
        const center = position.clone().add(radius).add(1);
        source.code.push(`display.fillCircle(${center.x}, ${center.y}, ${radius}, ${this.color});`);
    }

    addFrame(layer: FrameLayer, source: TSourceCode): void {
        source.code.push(
            `display.drawRect(${layer.position.x}, ${layer.position.y}, ${layer.size.x + 1}, ${layer.size.y + 1}, ${
                this.color
            });`
        );
    }

    addImage(layer: IconLayer | PaintLayer, source: TSourceCode): void {
        let image;
        if (layer instanceof IconLayer) {
            if (!layer.image) return;
            image = layer.image;
        } else if (layer instanceof PaintLayer) {
            if (!layer.position || !layer.size.x || !layer.size.y) return;
            image = layer
                .getBuffer()
                .getContext('2d')
                .getImageData(layer.position.x, layer.position.y, layer.size.x, layer.size.y);
        }
        const XBMP = imgDataToUint32Array(image);
        source.declarations.push(`static const unsigned char PROGMEM image_${layer.name}_bits[] = {${XBMP}};`);
        source.code.push(
            `display.drawBitmap(${layer.position.x}, ${layer.position.y}, image_${layer.name}_bits, ${layer.size.x}, ${layer.size.y}, ${this.color});`
        );
    }

    addIcon(layer: IconLayer, source: TSourceCode): void {
        this.addImage(layer, source);
    }
}
