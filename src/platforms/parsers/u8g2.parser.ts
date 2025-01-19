import {Point} from '../../core/point';
import {xbmpToImgData} from '../../utils';
import {AbstractParser} from './abstract-parser';

export class U8g2Parser extends AbstractParser {
    importSourceCode(sourceCode: string): any[] {
        const {defines, images, methods, variables} = this.parseSoorceCode(sourceCode);
        const states = [];
        let currentFont = '4x6';
        methods.forEach((call) => {
            if (call.functionName.includes('u8g2_')) {
                call.args.shift();
            }
            switch (call.functionName) {
                case 'u8g2_SetFont':
                case 'setFont':
                    {
                        const [font] = this.getArgs(call.args, defines, variables);
                        currentFont = font.replace('_tr', '').replace('u8g2_font_', '').replace('u8g_font_', '');
                    }
                    break;
                case 'u8g2_DrawXBMP':
                case 'u8g2_DrawXBM':
                case 'drawXBMP':
                case 'drawXBM':
                    {
                        const [x, y, width, height, name] = this.getArgs(call.args, defines, variables);
                        let imageName = this.parseImageName(name);
                        states.push({
                            type: 'paint',
                            data: xbmpToImgData(images.get(imageName), width, height),
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            imageName
                        });
                    }
                    break;
                case 'u8g2_DrawLine':
                case 'drawLine':
                    {
                        const [x1, y1, x2, y2] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'line',
                            p1: new Point(parseInt(x1), parseInt(y1)),
                            p2: new Point(parseInt(x2), parseInt(y2))
                        });
                    }
                    break;
                case 'u8g2_DrawBox':
                case 'u8g2_DrawFrame':
                case 'drawBox':
                case 'drawFrame':
                    {
                        const [x, y, width, height] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'rect',
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            fill: call.functionName === 'drawBox'
                        });
                    }
                    break;
                case 'u8g2_DrawPixel':
                case 'drawPixel':
                    {
                        const [x, y] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'dot',
                            position: new Point(parseInt(x), parseInt(y))
                        });
                    }
                    break;
                case 'u8g2_DrawStr':
                case 'u8g2_DrawUTF8':
                case 'drawStr':
                case 'drawUTF8':
                    {
                        const [x, y, text] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'string',
                            text: text.replace(/"/g, ''),
                            position: new Point(parseInt(x), parseInt(y)),
                            font: currentFont
                        });
                    }
                    break;
                case 'u8g2_DrawCircle':
                case 'u8g2_DrawDisc':
                case 'drawCircle':
                case 'drawDisc': {
                    const [x, y, radius] = this.getArgs(call.args, defines, variables);
                    states.push({
                        type: 'circle',
                        position: new Point(parseInt(x) - parseInt(radius), parseInt(y) - parseInt(radius)),
                        radius: parseInt(radius),
                        fill: call.functionName === 'drawDisc'
                    });
                }
                case 'u8g2_DrawEllipse':
                case 'u8g2_DrawFilledEllipse':
                case 'drawEllipse':
                case 'drawFilledEllipse':
                    {
                        const [x, y, rx, ry] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'ellipse',
                            position: new Point(parseInt(x) - parseInt(rx), parseInt(y) - parseInt(ry)),
                            rx: parseInt(rx),
                            ry: parseInt(ry),
                            fill: call.functionName === 'drawFilledEllipse'
                        });
                    }
                    break;
            }
        });
        return states;
    }
}
