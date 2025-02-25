import {Point} from '../../core/point';
import {iconsList} from '../../icons/icons';
import {xbmpToImgData} from '../../utils';
import {AbstractParser} from './abstract-parser';

export class FlipperParser extends AbstractParser {
    protected xbmpRegex = /uint8_t\s+([a-zA-Z0-9_]+)\[\]\s*\s*=\s+\{([^}]+)\};/gm;

    protected getXbmpFromMatch(match: RegExpExecArray): {name; xbmp} {
        const name = match[1];
        const xbmp = match[2]
            .split(',')
            .map((x) => x.trim())
            .join(',');
        return {name, xbmp};
    }

    importSourceCode(sourceCode: string) {
        const {defines, images, methods, variables} = this.parseSourceCode(sourceCode);
        const states = [];
        let currentFont = 'FontPrimary';
        const warnings = [];
        methods.forEach((call) => {
            switch (call.functionName) {
                case 'canvas_set_font':
                    {
                        const [canvas, font] = this.getArgs(call.args, defines, variables);
                        currentFont = font;
                    }
                    break;
                case 'canvas_draw_xbm':
                    {
                        const [canvas, x, y, width, height, name] = this.getArgs(call.args, defines, variables);
                        let imageName = this.parseImageName(name);
                        if (!images.get(imageName)) {
                            warnings.push(`Bitmap array declaration for ${name} was not found. Skipping.`);
                        }
                        states.push({
                            type: 'paint',
                            data: xbmpToImgData(images.get(imageName), width, height),
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            imageName,
                        });
                    }
                    break;
                case 'canvas_draw_icon': // TODO
                    {
                        const [canvas, x, y, name] = this.getArgs(call.args, defines, variables);
                        let iconSrc;
                        const iconName = name.replace('&I_', '');
                        Object.keys(iconsList).forEach((packName) => {
                            const icon = iconsList[packName].icons.find((icon) => icon.name === iconName);
                            if (icon) {
                                iconSrc = icon.image;
                                return;
                            }
                        });
                        states.push({
                            type: 'icon',
                            iconSrc,
                            position: new Point(parseInt(x), parseInt(y)),
                            imageName: name,
                        });
                    }
                    break;
                case 'canvas_draw_line':
                    {
                        const [canvas, x1, y1, x2, y2] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'line',
                            p1: new Point(parseInt(x1), parseInt(y1)),
                            p2: new Point(parseInt(x2), parseInt(y2)),
                        });
                    }
                    break;
                case 'canvas_draw_box':
                case 'canvas_draw_frame':
                    {
                        const [canvas, x, y, width, height] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'rect',
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            fill: call.functionName === 'canvas_draw_box',
                        });
                    }
                    break;
                case 'canvas_draw_r_box':
                case 'canvas_draw_r_frame':
                    {
                        const [canvas, x, y, width, height, radius] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'rect',
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            fill: call.functionName === 'canvas_draw_r_box',
                            radius: parseInt(radius),
                        });
                    }
                    break;
                case 'canvas_draw_dot':
                    {
                        const [canvas, x, y] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'dot',
                            position: new Point(parseInt(x), parseInt(y)),
                        });
                    }
                    break;
                case 'canvas_draw_str':
                    {
                        const [canvas, x, y, text] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'string',
                            text: text ? text.replace(/"/g, '') : 'Text',
                            position: new Point(parseInt(x), parseInt(y)),
                            font: currentFont,
                        });
                    }
                    break;
                case 'canvas_draw_circle':
                case 'canvas_draw_disc':
                    {
                        const [canvas, x, y, radius] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'circle',
                            position: new Point(parseInt(x) - parseInt(radius), parseInt(y) - parseInt(radius)),
                            radius: parseInt(radius),
                            fill: call.functionName === 'canvas_draw_disc',
                        });
                    }
                    break;
            }
        });
        return {states, warnings};
    }
}
