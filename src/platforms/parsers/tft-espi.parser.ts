import {Point} from '../../core/point';
import {unpackedHexColor565, xbmpToImgData} from '../../utils';
import {AbstractParser} from './abstract-parser';

export class TFTeSPIParser extends AbstractParser {
    importSourceCode(sourceCode: string) {
        const {defines, images, methods, variables} = this.parseSourceCode(sourceCode);
        const states = [];
        let textSize = 1;
        let textColor = '0xFFFF';
        let textWrap = true;
        let font = 'adafruit';
        const warnings = [];
        methods.forEach((call) => {
            switch (call.functionName) {
                case 'setFreeFont':
                    {
                        const [fontName] = this.getArgs(call.args, defines, variables);
                        font = fontName.replace('&', '');
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
                case 'drawString':
                    {
                        const [text, x, y] = this.getArgs(call.args, defines, variables);
                        const fontSize = font.match(/\d+pt/)
                            ? Math.max(parseInt(font.match(/\d+pt/)[0].replace('pt', '')), 10)
                            : 1;
                        const fontOffset = font === 'adafruit' || font === '' ? 5 : 3;
                        states.push({
                            type: 'string',
                            text: text ? text.replace(/"/g, '') : 'Text',
                            position: new Point(
                                parseInt(x),
                                parseInt(y) + (fontSize + fontOffset) * textSize + textSize
                            ),
                            font,
                            color: this.getColor(textColor),
                            scaleFactor: textSize,
                        });
                    }
                    break;
                case 'drawBitmap':
                    {
                        const [x, y, name, width, height, color] = this.getArgs(call.args, defines, variables);
                        let imageName = this.parseImageName(name);
                        if (!images.get(imageName)) {
                            warnings.push(`Bitmap array declaration for ${name} was not found. Skipping.`);
                            break;
                        }
                        states.push({
                            type: 'paint',
                            data: xbmpToImgData(images.get(imageName), width, height, true),
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            color: this.getColor(color),
                            imageName,
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
            }
        });
        console.log(warnings);

        return {states, warnings};
    }

    protected getColor(color: string): string {
        return unpackedHexColor565(color);
    }
}
