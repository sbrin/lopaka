import {AbstractParser} from './abstract-parser';

export class EsphomeParser extends AbstractParser {
    private lambdaRegex = /it\.([a-zA-Z_]+)\((.*)\)/gm;
    private colorRegex = /Color\((\d+),\s*(\d+),\s*(\d+)\)/g;

    importSourceCode(sourceCode: string): {states: any[]; warnings: string[]} {
        const warnings: string[] = [];
        const states: any[] = [];

        // Parse font definitions from the YAML configuration
        const fonts = this.parseFonts(sourceCode);

        // Reset the regex lastIndex to ensure we start from the beginning
        this.lambdaRegex.lastIndex = 0;

        let match;
        while ((match = this.lambdaRegex.exec(sourceCode)) !== null) {
            const functionName = match[1];
            // Get the raw arguments string
            const rawArgs = match[2];

            try {
                switch (functionName) {
                    case 'line':
                        this.parseLine(rawArgs, states);
                        break;
                    case 'rectangle':
                        this.parseRectangle(rawArgs, states, false);
                        break;
                    case 'filled_rectangle':
                        this.parseRectangle(rawArgs, states, true);
                        break;
                    case 'circle':
                        this.parseCircle(rawArgs, states, false);
                        break;
                    case 'filled_circle':
                        this.parseCircle(rawArgs, states, true);
                        break;
                    case 'triangle':
                        this.parseTriangle(rawArgs, states, false);
                        break;
                    case 'filled_triangle':
                        this.parseTriangle(rawArgs, states, true);
                        break;
                    case 'print':
                    case 'printf':
                        this.parsePrint(rawArgs, states, fonts, warnings);
                        break;
                    case 'image':
                        this.parseImage(rawArgs, states, customImages);
                        break;
                }
            } catch (e) {
                warnings.push(`Failed to parse ${functionName}: ${e.message}`);
            }
        }

        return {states, warnings};
    }

    private parseLine(rawArgs: string, states: any[]): void {
        // Format: it.line(x1, y1, x2, y2, Color(r,g,b))
        const args = this.splitArguments(rawArgs);

        if (args.length >= 4) {
            const x1 = parseInt(args[0]);
            const y1 = parseInt(args[1]);
            const x2 = parseInt(args[2]);
            const y2 = parseInt(args[3]);
            const color = args.length > 4 ? this.parseColor(args[4]) : '#FFFFFF';

            states.push({
                type: 'line',
                p1: [x1, y1],
                p2: [x2, y2],
                color,
            });
        }
    }

    private parseRectangle(rawArgs: string, states: any[], fill: boolean): void {
        // Format: it.rectangle(x, y, width, height, Color(r,g,b))
        // or: it.filled_rectangle(x, y, width, height, Color(r,g,b))
        const args = this.splitArguments(rawArgs);

        if (args.length >= 4) {
            const x = parseInt(args[0]);
            const y = parseInt(args[1]);
            const width = parseInt(args[2]);
            const height = parseInt(args[3]);
            const color = args.length > 4 ? this.parseColor(args[4]) : '#FFFFFF';

            states.push({
                type: 'rect',
                position: [x, y],
                size: [width, height],
                fill,
                color,
            });
        }
    }

    private parseCircle(rawArgs: string, states: any[], fill: boolean): void {
        // Format: it.circle(x, y, radius, Color(r,g,b))
        // or: it.filled_circle(x, y, radius, Color(r,g,b))
        const args = this.splitArguments(rawArgs);

        if (args.length >= 3) {
            const x = parseInt(args[0]);
            const y = parseInt(args[1]);
            const radius = parseInt(args[2]);
            const color = args.length > 3 ? this.parseColor(args[3]) : '#FFFFFF';

            states.push({
                type: 'circle',
                position: [x - radius, y - radius],
                radius,
                fill,
                color,
            });
        }
    }

    private parseTriangle(rawArgs: string, states: any[], fill: boolean): void {
        // Format: it.triangle(x1, y1, x2, y2, x3, y3, Color(r,g,b))
        // or: it.filled_triangle(x1, y1, x2, y2, x3, y3, Color(r,g,b))
        const args = this.splitArguments(rawArgs);

        if (args.length >= 6) {
            const x1 = parseInt(args[0]);
            const y1 = parseInt(args[1]);
            const x2 = parseInt(args[2]);
            const y2 = parseInt(args[3]);
            const x3 = parseInt(args[4]);
            const y3 = parseInt(args[5]);
            const color = args.length > 6 ? this.parseColor(args[6]) : '#FFFFFF';

            states.push({
                type: 'triangle',
                p1: [x1, y1],
                p2: [x2, y2],
                p3: [x3, y3],
                fill,
                color,
            });
        }
    }

    private parsePrint(rawArgs: string, states: any[], fonts: Map<string, any>, warnings: string[]): void {
        // Format: it.print(x, y, id(Font), Color(r,g,b), "text")
        try {
            // Split the arguments properly to handle the print function
            const args = this.splitArguments(rawArgs);

            if (args.length < 5) {
                warnings.push(`Failed to parse print: insufficient arguments (${args.length}): ${args.join(', ')}`);
                return;
            }

            // Parse coordinates
            const x = parseInt(args[0]);
            const y = parseInt(args[1]);

            // Parse font ID - using a more robust approach
            const fontArg = args[2];
            const fontIdMatch = fontArg.match(/id\(([a-zA-Z0-9_]+)\)/);
            if (!fontIdMatch) {
                warnings.push(`Failed to parse print: could not extract font ID from ${fontArg}`);
                return;
            }
            const fontId = fontIdMatch[1];

            // Parse color
            const colorArg = args[3];
            const colorMatch = colorArg.match(/Color\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (!colorMatch) {
                warnings.push(`Failed to parse print: could not extract color from ${colorArg}`);
                return;
            }
            const r = parseInt(colorMatch[1]);
            const g = parseInt(colorMatch[2]);
            const b = parseInt(colorMatch[3]);
            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

            // Parse text
            const textArg = args[4];
            const textMatch = textArg.match(/"([^"]*)"/);
            if (!textMatch) {
                warnings.push(`Failed to parse print: could not extract text from ${textArg}`);
                return;
            }
            const text = textMatch[1];

            // Get the font or use default
            const font = fonts.get(fontId) || {title: 'Courier_Prime', size: 14};

            states.push({
                type: 'string',
                position: [x, y + font.size + Math.round(0.2 * font.size)],
                text,
                color,
                font: fontId,
                scaleFactor: font.size,
            });
        } catch (e) {
            warnings.push(`Error parsing print: ${e.message}, args: ${rawArgs}`);
        }
    }

    private parseImage(rawArgs: string, states: any[], customImages): void {
        // TODO: Implement image parsing by getting the image data from the default icon packs or customImages
        // complicated because of state data type
        //
        // Format: it.image(x, y, id(ImageName), Color(r,g,b))
        // const args = this.splitArguments(rawArgs);
        // console.log(args);
        // if (args.length >= 3) {
        //     const x = parseInt(args[0]);
        //     const y = parseInt(args[1]);
        //     // Extract image ID from id(ImageName)
        //     const imageIdMatch = args[2].match(/id\(([a-zA-Z0-9_]+)\)/);
        //     console.log(imageIdMatch);
        //     if (!imageIdMatch) return;
        //     const imageId = imageIdMatch[1];
        //     // First try to find the image in the iconsList
        //     let imageData = null;
        //     let foundInIcons = false;
        //     let iconSrc = null;
        //     // Try to find image in iconsList
        //     Object.keys(iconsList).forEach((packName) => {
        //         const icon = iconsList[packName].icons.find((icon) => icon.name === imageId);
        //         console.log(imageId);
        //         if (icon) {
        //             iconSrc = icon.image;
        //             console.log(iconSrc);
        //             foundInIcons = true;
        //         }
        //     });
        //     // If not found in iconsList, try to get it from the images map
        //     // if (!foundInIcons) {
        //     //     imageData = customImages.get(imageId);
        //     //     if (!imageData) return; // Skip if the image is not found
        //     // } else {
        //     //     imageData = iconSrc; // Use the icon image data
        //     // }
        //     // Parse color if provided (optional)
        //     let color = '#FFFFFF';
        //     if (args.length > 3) {
        //         color = this.parseColor(args[3]);
        //     }
        //     // Create the base state object
        //     const stateObj: any = {
        //         type: 'paint',
        //         data: imageToImageData(iconSrc),
        //         position: [x, y],
        //         color,
        //         imageName: imageId,
        //     };
        //     states.push(stateObj);
        // }
    }

    private parseFonts(sourceCode: string): Map<string, any> {
        const fonts = new Map<string, any>();

        try {
            // First, extract the font section
            const fontSectionMatch = sourceCode.match(/font:[\s\S]*?(?=\n\w+:|$)/);
            if (!fontSectionMatch) return fonts;

            const fontSection = fontSectionMatch[0];

            // Parse each font entry
            // Look for patterns like:
            // - file: "gfonts://Roboto"
            //   id: Roboto
            //   size: 14
            const fontEntries = fontSection.split(/\n\s*-\s*/);

            for (const entry of fontEntries) {
                if (!entry.includes('file:')) continue;

                const fileMatch = entry.match(/file:\s*"([^"]*)"/);
                const idMatch = entry.match(/id:\s*([a-zA-Z0-9_]+)/);
                const sizeMatch = entry.match(/size:\s*(\d+)/);

                if (fileMatch && idMatch && sizeMatch) {
                    const file = fileMatch[1];
                    const id = idMatch[1];
                    const size = parseInt(sizeMatch[1]);

                    fonts.set(id, {
                        title: file.replace('gfonts://', '').replace(/\+/g, ' '),
                        file,
                        size,
                    });
                }
            }
        } catch (e) {
            console.error('Error parsing fonts:', e);
        }

        return fonts;
    }

    private parseColor(colorArg: string): string {
        // Reset the regex before using it
        this.colorRegex.lastIndex = 0;
        const match = this.colorRegex.exec(colorArg);

        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return '#FFFFFF';
    }

    /**
     * Split arguments properly handling nested functions and commas within quotes
     */
    private splitArguments(argsString: string): string[] {
        const args: string[] = [];
        let currentArg = '';
        let inQuotes = false;
        let parenCount = 0;

        for (let i = 0; i < argsString.length; i++) {
            const char = argsString[i];

            if (char === '"' && argsString[i - 1] !== '\\') {
                inQuotes = !inQuotes;
                currentArg += char;
            } else if (char === '(' && !inQuotes) {
                parenCount++;
                currentArg += char;
            } else if (char === ')' && !inQuotes) {
                parenCount--;
                currentArg += char;
            } else if (char === ',' && !inQuotes && parenCount === 0) {
                args.push(currentArg.trim());
                currentArg = '';
            } else {
                currentArg += char;
            }
        }

        if (currentArg.trim()) {
            args.push(currentArg.trim());
        }

        return args;
    }
}
