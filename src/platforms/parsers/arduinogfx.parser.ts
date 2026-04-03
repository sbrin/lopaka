import {Point} from '../../core/point';
import {rgb565ToImageData, unpackedHexColor565, xbmpToImgData} from '../../utils';
import {AbstractParser} from './abstract-parser';

export class ArduinoGFXParser extends AbstractParser {
    // Accept Arduino_GFX bitmap declarations for both monochrome (8-bit) and RGB565 (16-bit) assets.
    protected xbmpRegex =
        /(?:static\s+)?(?:const\s+)?(?:(?:unsigned\s+)?char|uint8_t|uint16_t)\s+(?:PROGMEM\s+)?([a-zA-Z0-9_]+)\s*\[\]\s*(?:PROGMEM)?\s*=\s*\{([^}]+)\};/gm;

    importSourceCode(sourceCode: string): {states: any[]; warnings: string[]} {
        // Parse the sketch up front so we can resolve references while walking draw calls.
        const {defines, images, methods, variables} = this.parseSourceCode(sourceCode);
        const states = [];
        let textSize = 1;
        let textColor = '0xFFFF';
        let textWrap = true;
        let cursorPos = new Point(0, 0);
        let font = 'adafruit';
        const warnings = [];

        methods.forEach((call) => {
            switch (call.functionName) {
                case 'setFont':
                    {
                        const [fontName] = this.getArgs(call.args, defines, variables);
                        // Guard against calls that reset the font with no argument.
                        font = fontName ? fontName.replace('&', '') : 'adafruit';
                    }
                    break;
                case 'setTextColor':
                    {
                        const [color] = this.getArgs(call.args, defines, variables);
                        textColor = color;
                    }
                    break;
                case 'setTextSize':
                    {
                        const [size] = this.getArgs(call.args, defines, variables);
                        textSize = parseInt(size);
                    }
                    break;
                case 'setTextWrap':
                    {
                        const [wrap] = this.getArgs(call.args, defines, variables);
                        textWrap = wrap === 'true';
                    }
                    break;
                case 'setCursor':
                    {
                        const [x, y] = this.getArgs(call.args, defines, variables);
                        cursorPos.x = parseInt(x);
                        cursorPos.y = parseInt(y);
                    }
                    break;
                case 'println':
                case 'print':
                    {
                        const [text] = this.getArgs(call.args, defines, variables);
                        const fontOffset = font === 'adafruit' || font === '' ? 7 : 1;
                        states.push({
                            type: 'string',
                            text: text ? text.replace(/"/g, '') : 'Text',
                            position: new Point(cursorPos.x, cursorPos.y + fontOffset * textSize),
                            font,
                            color: this.getColor(textColor),
                            scaleFactor: textSize,
                            wrap: textWrap,
                        });
                    }
                    break;
                case 'drawBitmap':
                    {
                        const [x, y, name, width, height, color] = this.getArgs(call.args, defines, variables);
                        const imageName = this.parseImageName(name);
                        const bitmap = images.get(imageName);
                        if (!bitmap) {
                            warnings.push(`Bitmap array declaration for ${name} was not found. Skipping.`);
                        }
                        states.push({
                            type: 'paint',
                            data: bitmap ? xbmpToImgData(bitmap, width, height, true) : undefined,
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            color: this.getColor(color),
                            imageName,
                            colorMode: 'monochrome',
                        });
                    }
                    break;
                case 'draw16bitRGBBitmap':
                    {
                        const [x, y, name, width, height] = this.getArgs(call.args, defines, variables);
                        const imageName = this.parseImageName(name);
                        const bitmap = images.get(imageName);
                        if (!bitmap) {
                            warnings.push(`Bitmap array declaration for ${name} was not found. Skipping.`);
                        }
                        states.push({
                            type: 'paint',
                            data: bitmap ? rgb565ToImageData(bitmap, parseInt(width), parseInt(height)) : undefined,
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            imageName,
                            colorMode: 'rgb',
                        });
                    }
                    break;
                case 'drawLine':
                    {
                        const [x1, y1, x2, y2, color] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'line',
                            p1: new Point(parseInt(x1), parseInt(y1)),
                            p2: new Point(parseInt(x2), parseInt(y2)),
                            color: this.getColor(color),
                        });
                    }
                    break;
                case 'drawRect':
                case 'fillRect':
                    {
                        const [x, y, width, height, color] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'rect',
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            fill: call.functionName === 'fillRect',
                            color: this.getColor(color),
                        });
                    }
                    break;
                case 'drawRoundRect':
                case 'fillRoundRect':
                    {
                        const [x, y, width, height, radius, color] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'rect',
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            fill: call.functionName === 'fillRoundRect',
                            color: this.getColor(color),
                            radius: parseInt(radius),
                        });
                    }
                    break;
                case 'drawPixel':
                    {
                        const [x, y, color] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'dot',
                            position: new Point(parseInt(x), parseInt(y)),
                            color: this.getColor(color),
                        });
                    }
                    break;
                case 'fillCircle':
                case 'drawCircle':
                    {
                        const [x, y, radius, color] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'circle',
                            position: new Point(parseInt(x) - parseInt(radius), parseInt(y) - parseInt(radius)),
                            radius: parseInt(radius),
                            fill: call.functionName === 'fillCircle',
                            color: this.getColor(color),
                        });
                    }
                    break;
                case 'drawEllipse':
                case 'fillEllipse':
                    {
                        const [x, y, rx, ry, color] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'ellipse',
                            position: new Point(parseInt(x) - parseInt(rx), parseInt(y) - parseInt(ry)),
                            radius: new Point(parseInt(rx), parseInt(ry)),
                            fill: call.functionName === 'fillEllipse',
                            color: this.getColor(color),
                        });
                    }
                    break;
                case 'drawTriangle':
                case 'fillTriangle':
                    {
                        const [x0, y0, x1, y1, x2, y2, color] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'triangle',
                            p1: new Point(parseInt(x0), parseInt(y0)),
                            p2: new Point(parseInt(x1), parseInt(y1)),
                            p3: new Point(parseInt(x2), parseInt(y2)),
                            fill: call.functionName === 'fillTriangle',
                            color: this.getColor(color),
                        });
                    }
                    break;
            }
        });

        return {states, warnings};
    }

    // Normalize regex captures from Arduino_GFX bitmap declarations.
    protected getXbmpFromMatch(match: RegExpExecArray): {name; xbmp} {
        const name = match[1];
        const xbmp = match[2]
            .split(',')
            .map((value) => value.trim())
            .join(',');
        return {name, xbmp};
    }

    // Allow both auto-generated image names (image_*_bits / image_*_pixels) and raw identifiers.
    protected parseImageName(name: string): string {
        return name.replace(/^(?:image_)?(.+?)(?:_(?:bits|pixels))?$/, '$1');
    }

    protected getColor(color: string): string {
        return unpackedHexColor565(color);
    }
}
