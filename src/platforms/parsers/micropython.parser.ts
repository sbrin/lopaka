import {Point} from '../../core/point';
import {bufferToImageData, unpackedHexColor565} from '../../utils';
import {AbstractParser} from './abstract-parser';

export class MicropythonParser extends AbstractParser {
    // Match bytearray declarations that hold monochrome bitmap payloads.
    private byteArrayRegex = /(\w+)\s*=\s*bytearray\(\s*(b?["'][\s\S]*?["'])\s*\)/gim;

    // Match FrameBuffer wrappers so we can recover bitmap dimensions and color mode.
    private frameBufferRegex =
        /(\w+)\s*=\s*framebuf\.FrameBuffer\(\s*(\w+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*framebuf\.([A-Z_]+)\s*\)/gim;

    // Match display.* calls that draw primitives on screen.
    private displayCallRegex = /display\.(\w+)\s*\(/gm;

    // Match framebuffer.* calls (e.g., fbuf.poly) for drawing primitives.
    private frameBufferCallRegex = /(\w+)\.(\w+)\s*\(/gm;

    // Capture simple Python assignments for resolving variables inside draw calls.
    private assignmentRegex = /^(\w+)\s*=\s*([^\n#]+)/gm;

    importSourceCode(sourceCode: string): {states: any[]; warnings: string[]} {
        const warnings: string[] = [];
        const states: any[] = [];

        // Strip comments while leaving byte strings intact so parsing stays reliable.
        const sanitizedSource = this.removeComments(sourceCode);

        // Track user-defined variables so they can be substituted inside draw calls.
        const variables = this.parseVariables(sanitizedSource);

        // Decode embedded bytearray bitmaps before walking drawing commands.
        const images = this.parseImages(sanitizedSource, warnings);

        // Pair framebuffer handles with backing buffers and dimensions.
        const frameBuffers = this.parseFrameBuffers(sanitizedSource, warnings);

        // Walk every display.* call and convert it into an editor layer state.
        let match;
        while ((match = this.displayCallRegex.exec(sanitizedSource)) !== null) {
            const functionName = match[1];
            const args = this.parseFunctionArguments(sanitizedSource, match.index + match[0].length);
            try {
                switch (functionName) {
                    case 'line': {
                        // Map a display.line call into a line layer.
                        const [x1, y1, x2, y2, color] = args.map((arg) => this.resolveArg(arg, variables));
                        states.push({
                            type: 'line',
                            p1: new Point(parseInt(x1), parseInt(y1)),
                            p2: new Point(parseInt(x2), parseInt(y2)),
                            color: this.getColor(color),
                        });
                        break;
                    }
                    case 'rect':
                    case 'fill_rect': {
                        // Map rectangle calls, tracking whether the fill variant was used.
                        const [x, y, width, height, color] = args.map((arg) => this.resolveArg(arg, variables));
                        states.push({
                            type: 'rect',
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(parseInt(width), parseInt(height)),
                            fill: functionName === 'fill_rect',
                            color: this.getColor(color),
                        });
                        break;
                    }
                    case 'ellipse': {
                        // Recover ellipse bounds and fill flag.
                        const [x, y, rx, ry, color, fill] = args.map((arg) => this.resolveArg(arg, variables));
                        states.push({
                            type: 'ellipse',
                            position: new Point(parseInt(x) - parseInt(rx), parseInt(y) - parseInt(ry)),
                            radius: new Point(parseInt(rx), parseInt(ry)),
                            fill: this.resolveBoolean(fill),
                            color: this.getColor(color),
                        });
                        break;
                    }
                    case 'text': {
                        // Rebuild text layers, keeping variable references intact.
                        const [rawText, x, y, color] = args;
                        const {text, isVariable} = this.parseText(rawText, variables);
                        const resolvedX = parseInt(this.resolveArg(x, variables));
                        const resolvedY = parseInt(this.resolveArg(y, variables));
                        const state: any = {
                            type: 'string',
                            text,
                            position: new Point(resolvedX, resolvedY + 8),
                            font: 'Petme8x8',
                            color: this.getColor(this.resolveArg(color, variables)),
                            scaleFactor: 1,
                        };
                        if (isVariable) {
                            state.variables = {text: true};
                        }
                        states.push(state);
                        break;
                    }
                    case 'blit': {
                        // Restore paint layers from framebuffer blits.
                        const [fbName, x, y] = args.map((arg) => this.resolveArg(arg, variables));
                        const framebuffer = frameBuffers.get(fbName);
                        if (!framebuffer) {
                            warnings.push(`Framebuffer ${fbName} was not found. Skipping blit.`);
                            break;
                        }
                        const bitmap = images.get(framebuffer.imageName);
                        if (!bitmap) {
                            warnings.push(`Bitmap ${framebuffer.imageName} was not found. Skipping blit.`);
                            break;
                        }
                        states.push({
                            type: 'paint',
                            data: bufferToImageData(bitmap, framebuffer.width, framebuffer.height),
                            position: new Point(parseInt(x), parseInt(y)),
                            size: new Point(framebuffer.width, framebuffer.height),
                            imageName: framebuffer.imageName,
                            colorMode: 'monochrome',
                            color: this.getColor('1'),
                        });
                        break;
                    }
                }
            } catch (e) {
                warnings.push(`Failed to parse ${functionName}: ${e.message}`);
            }
        }

        // Walk every framebuffer.* call (e.g., fbuf.poly) and convert to editor layer state.
        this.frameBufferCallRegex.lastIndex = 0;
        while ((match = this.frameBufferCallRegex.exec(sanitizedSource)) !== null) {
            const functionName = match[2];
            const args = this.parseFunctionArguments(sanitizedSource, match.index + match[0].length);
            try {
                switch (functionName) {
                    case 'poly': {
                        // Parse fbuf.poly(x, y, array('h', [x0,y0,x1,y1,x2,y2]), color, fill)
                        // args: [x, y, arrayExpr, color, fill]
                        if (args.length >= 3) {
                            const offsetX = parseInt(this.resolveArg(args[0], variables));
                            const offsetY = parseInt(this.resolveArg(args[1], variables));
                            const arrayArg = args[2];
                            const color = args.length > 3 ? this.getColor(this.resolveArg(args[3], variables)) : this.getColor('1');
                            const fill = args.length > 4 ? this.resolveBoolean(this.resolveArg(args[4], variables)) : false;

                            // Extract coordinates from array('h', [x0,y0,x1,y1,x2,y2])
                            const coordsMatch = arrayArg.match(/\[\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/);
                            if (coordsMatch) {
                                const x0 = parseInt(coordsMatch[1]);
                                const y0 = parseInt(coordsMatch[2]);
                                const x1 = parseInt(coordsMatch[3]);
                                const y1 = parseInt(coordsMatch[4]);
                                const x2 = parseInt(coordsMatch[5]);
                                const y2 = parseInt(coordsMatch[6]);

                                states.push({
                                    type: 'triangle',
                                    p1: new Point(offsetX + x0, offsetY + y0),
                                    p2: new Point(offsetX + x1, offsetY + y1),
                                    p3: new Point(offsetX + x2, offsetY + y2),
                                    fill,
                                    color,
                                });
                            }
                        }
                        break;
                    }
                }
            } catch (e) {
                warnings.push(`Failed to parse ${functionName}: ${e.message}`);
            }
        }

        return {states, warnings};
    }

    // Resolve markers and variable indirections inside an argument.
    private resolveArg(arg: string, variables: Map<string, string>): string {
        const cleaned = this.cleanArg(arg);
        return variables.get(cleaned) ?? cleaned;
    }

    // Remove Lopaka source-map markers from arguments before parsing.
    private cleanArg(arg: string): string {
        const withoutParams = arg.replace(/@\w+:/g, '').replace(/^@\w+;/g, '');
        return withoutParams.trim();
    }

    // Parse text arguments, keeping track of whether they reference a variable.
    private parseText(arg: string, variables: Map<string, string>): {text: string; isVariable: boolean} {
        const cleaned = this.cleanArg(arg);
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            return {text: cleaned.slice(1, -1), isVariable: false};
        }
        if (variables.has(cleaned)) {
            const value = variables.get(cleaned).trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                return {text: value.slice(1, -1), isVariable: true};
            }
            return {text: value, isVariable: true};
        }
        return {text: cleaned, isVariable: true};
    }

    // Parse boolean-ish strings Micropython may emit for fill flags.
    private resolveBoolean(value: string): boolean {
        const normalized = value?.trim().toLowerCase();
        return normalized === 'true' || normalized === '1';
    }

    // Decode bytearray declarations into raw bytes keyed by their variable name.
    private parseImages(source: string, warnings: string[]): Map<string, Uint8Array> {
        const images = new Map<string, Uint8Array>();
        this.byteArrayRegex.lastIndex = 0;
        let match;
        while ((match = this.byteArrayRegex.exec(source)) !== null) {
            const name = match[1];
            try {
                images.set(name, this.parseByteString(match[2]));
            } catch (e) {
                warnings.push(`Failed to parse bitmap ${name}: ${e.message}`);
            }
        }
        return images;
    }

    // Map framebuffer variables back to their source bitmap names and dimensions.
    private parseFrameBuffers(
        source: string,
        warnings: string[]
    ): Map<string, {imageName: string; width: number; height: number; mode: string}> {
        const frameBuffers = new Map<string, {imageName: string; width: number; height: number; mode: string}>();
        this.frameBufferRegex.lastIndex = 0;
        let match;
        while ((match = this.frameBufferRegex.exec(source)) !== null) {
            try {
                frameBuffers.set(match[1], {
                    imageName: match[2],
                    width: parseInt(match[3]),
                    height: parseInt(match[4]),
                    mode: match[5],
                });
            } catch (e) {
                warnings.push(`Failed to parse framebuffer ${match[1]}: ${e.message}`);
            }
        }
        return frameBuffers;
    }

    // Collect simple assignments so calls can reference symbolic values.
    private parseVariables(source: string): Map<string, string> {
        const variables = new Map<string, string>();
        this.assignmentRegex.lastIndex = 0;
        let match;
        while ((match = this.assignmentRegex.exec(source)) !== null) {
            const name = match[1];
            const value = match[2].trim();
            if (/^bytearray\(/i.test(value) || /^framebuf\.framebuffer/i.test(value)) {
                continue;
            }
            variables.set(name, value);
        }
        return variables;
    }

    // Convert Micropython-style bytes literal into a Uint8Array.
    private parseByteString(literal: string): Uint8Array {
        const trimmed = literal.trim();
        const quoteIndex = trimmed.startsWith('b') || trimmed.startsWith('B') ? 1 : 0;
        const quote = trimmed[quoteIndex];
        const start = trimmed.indexOf(quote, quoteIndex) + 1;
        const end = trimmed.lastIndexOf(quote);
        // Guard against malformed literals that lack matching quotes.
        if (start <= 0 || end < start) {
            throw new Error('Invalid byte literal format');
        }
        const content = trimmed.slice(start, end);
        const bytes: number[] = [];
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            if (char === '\\') {
                const next = content[++i];
                switch (next) {
                    case 'x': {
                        const hex = content.substr(i + 1, 2);
                        bytes.push(parseInt(hex, 16) || 0);
                        i += 2;
                        break;
                    }
                    case 'n':
                        bytes.push(0x0a);
                        break;
                    case 'r':
                        bytes.push(0x0d);
                        break;
                    case 't':
                        bytes.push(0x09);
                        break;
                    case '\\':
                    case "'":
                    case '"':
                        bytes.push(next.charCodeAt(0));
                        break;
                    default:
                        bytes.push(next.charCodeAt(0));
                        break;
                }
            } else {
                bytes.push(char.charCodeAt(0));
            }
        }
        return new Uint8Array(bytes);
    }

    // Strip Python comments while respecting quoted literals.
    private removeComments(source: string): string {
        let result = '';
        let inSingle = false;
        let inDouble = false;
        for (let i = 0; i < source.length; i++) {
            const char = source[i];
            if (char === "'" && !inDouble) {
                inSingle = !inSingle;
            } else if (char === '"' && !inSingle) {
                inDouble = !inDouble;
            }
            if (char === '#' && !inSingle && !inDouble) {
                while (i < source.length && source[i] !== '\n') {
                    i++;
                }
                result += source[i] ?? '';
                continue;
            }
            result += char;
        }
        return result;
    }

    // Normalize Micropython color values to standard hex strings.
    protected getColor(color: string): string {
        const normalized = color?.trim().toLowerCase();
        if (normalized === '0' || normalized === 'black' || normalized === 'false') {
            return '#000000';
        }
        if (!normalized || normalized === '1' || normalized === 'white' || normalized === 'true') {
            return '#ffffff';
        }
        return unpackedHexColor565(color);
    }
}
