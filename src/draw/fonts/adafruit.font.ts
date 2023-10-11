import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {DrawContext} from '../draw-context';
import adafruitFontUrl from './adafruit-5x7.bin?url';
import {Font, FontFormat} from './font';

export class AdafruitFont extends Font {
    data: ArrayBuffer;
    constructor() {
        super(FontFormat.FORMAT_5x7);
    }
    async loadFont(): Promise<void> {
        return fetch(adafruitFontUrl)
            .then((res) => res.arrayBuffer())
            .then((data) => {
                this.data = new Uint8Array(data);
            });
    }

    drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number = 1): Rect {
        const charPos = position.clone();
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            const charData = this.getCharData(charCode);
            for (let col = 0; col < charData.byteLength; col++) {
                const byte = charData[col];
                for (let row = 0; row < 8; row++) {
                    if (byte & (1 << row)) {
                        dc.ctx.rect(
                            charPos.x + col * scaleFactor,
                            charPos.y + row * scaleFactor,
                            scaleFactor,
                            scaleFactor
                        );
                    }
                }
            }
            charPos.x += 6 * scaleFactor;
        }
        return new Rect(position, charPos);
    }

    getCharData(charCode: number): Uint8Array {
        return new Uint8Array(this.data.slice(charCode * 5, charCode * 5 + 5));
    }
}
