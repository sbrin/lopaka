import {Point} from '../../core/point';
import {unpackedHexColor565, xbmpToImgData} from '../../utils';
import {AbstractParser} from './abstract-parser';

export class AdafruitParser extends AbstractParser {
    importSourceCode(sourceCode: string): any[] {
        const {defines, images, methods, variables} = this.parseSoorceCode(sourceCode);
        const states = [];
        let textSize = 1;
        let textColor = '0xFFFF';
        let textWrap = true;
        let cursorPos = new Point(0, 0);
        methods.forEach((call) => {
            switch (call.functionName) {
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
                case 'setCursor': {
                    const [x, y] = this.getArgs(call.args, defines, variables);
                    cursorPos.x = parseInt(x);
                    cursorPos.y = parseInt(y);
                    break;
                }
                case 'print':
                    {
                        const [text] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'string',
                            text: text.replace(/"/g, ''),
                            position: new Point(cursorPos.x, cursorPos.y + 7 * textSize),
                            font: 'adafruit',
                            color: unpackedHexColor565(textColor)
                        });
                    }
                    break;
                case 'drawBitmap':
                    {
                        const [x, y, name, width, height, color] = this.getArgs(call.args, defines, variables);
                        let imageName = this.parseImageName(name);
                        states.push({
                            type: 'paint',
                            data: xbmpToImgData(images.get(imageName), width, height, true),
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            color: unpackedHexColor565(color),
                            imageName
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
                            color: unpackedHexColor565(color)
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
                            color: unpackedHexColor565(color)
                        });
                    }
                    break;
                case 'drawPixel':
                    {
                        const [x, y, color] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'dot',
                            position: new Point(parseInt(x), parseInt(y)),
                            color: unpackedHexColor565(color)
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
                            color: unpackedHexColor565(color)
                        });
                    }
                    break;
            }
        });
        return states;
    }
}
