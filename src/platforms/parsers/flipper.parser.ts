import {Point} from '../../core/point';
import {iconsList} from '../../icons/icons';
import {xbmpToImgData} from '../../utils';
import {AbstractParser} from './abstract-parser';

export class FlipperParser extends AbstractParser {
    // Allow optional qualifiers like static/const when locating bitmap arrays
    protected xbmpRegex = /(?:static\s+|const\s+)*uint8_t\s+([a-zA-Z0-9_]+)\[\]\s*=\s*\{([^}]+)\};/gm;

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
        // Track the active canvas color to map value 2 to inverted layers
        let currentColor = 1;
        const warnings = [];
        methods.forEach((call) => {
            switch (call.functionName) {
                case 'canvas_set_font':
                    {
                        const [canvas, font] = this.getArgs(call.args, defines, variables);
                        currentFont = font;
                    }
                    break;
                case 'canvas_set_color':
                    {
                        const [canvas, colorValue] = this.getArgs(call.args, defines, variables);
                        // Mirror canvas color changes so value 2 toggles inverted rendering
                        const parsedColor = parseInt(colorValue, 10);
                        currentColor = Number.isNaN(parsedColor) ? 1 : parsedColor;
                    }
                    break;
                case 'canvas_draw_xbm':
                    {
                        const [canvas, x, y, width, height, name] = this.getArgs(call.args, defines, variables);
                        let imageName = this.parseImageName(name);
                        const bitmap = images.get(imageName);
                        // Skip bitmap drawing when the backing array cannot be resolved
                        if (!bitmap) {
                            warnings.push(`Bitmap array declaration for ${name} was not found. Skipping.`);
                            return;
                        }
                        states.push({
                            type: 'paint',
                            data: xbmpToImgData(bitmap, width, height),
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            imageName,
                            inverted: currentColor === 2,
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
                            inverted: currentColor === 2,
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
                            inverted: currentColor === 2,
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
                            inverted: currentColor === 2,
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
                            inverted: currentColor === 2,
                        });
                    }
                    break;
                case 'canvas_draw_dot':
                    {
                        const [canvas, x, y] = this.getArgs(call.args, defines, variables);
                        states.push({
                            type: 'dot',
                            position: new Point(parseInt(x), parseInt(y)),
                            inverted: currentColor === 2,
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
                            inverted: currentColor === 2,
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
                            inverted: currentColor === 2,
                        });
                    }
                    break;
                case 'canvas_draw_triangle':
                    {
                        const [canvas, x, y, base, height] = this.getArgs(call.args, defines, variables);
                        const xVal = parseInt(x);
                        const yVal = parseInt(y);
                        const baseVal = parseInt(base);
                        const heightVal = parseInt(height);
                        // Flipper triangle: x,y = top vertex, base = base width, height = height
                        // Convert to three points: p1 (top), p2 (bottom-left), p3 (bottom-right)
                        states.push({
                            type: 'triangle',
                            p1: new Point(xVal, yVal),
                            p2: new Point(xVal - baseVal / 2, yVal + heightVal),
                            p3: new Point(xVal + baseVal / 2, yVal + heightVal),
                            fill: false,
                            inverted: currentColor === 2,
                        });
                    }
                    break;
            }
        });
        return {states, warnings};
    }
}
