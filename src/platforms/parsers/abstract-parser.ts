export abstract class AbstractParser {
    protected variablesRegex = /(\w+)\s+(\w+)(\[\d+\])?(\s*=\s*([^;]+))?;/gm;
    protected definesRegex = /#define\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)/gm;
    protected xbmpRegex =
        /(char|uint8_t)\s+(PROGMEM)?\s*([a-zA-Z0-9_]+)\s*\[\]\s*([\w\d_]*PROGMEM)?\s*=\s+\{([^}]+)\};/gm;
    protected cppMethodsRegexp = /(\w+)\s*\(/gm;

    parseSourceCode(sourceCode: string) {
        const images = new Map<string, string>();
        const methods = [];
        const defines = new Map<string, string>();
        const variables = new Map<string, string>();
        let match;
        sourceCode = sourceCode.replace(/\/\/[^\n]*\n/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        while ((match = this.variablesRegex.exec(sourceCode)) !== null) {
            const type = match[1];
            const name = match[2];
            const size = match[3];
            const value = match[5];
            variables.set(name, value);
        }
        while ((match = this.definesRegex.exec(sourceCode)) !== null) {
            const name = match[1];
            const value = match[2];
            defines.set(name, value);
        }
        while ((match = this.xbmpRegex.exec(sourceCode)) !== null) {
            let {name, xbmp} = this.getXbmpFromMatch(match);
            images.set(this.parseImageName(name), xbmp);
        }
        while ((match = this.cppMethodsRegexp.exec(sourceCode)) !== null) {
            const functionName = match[1];
            const startPos = match.index + match[0].length;
            const args = this.parseFunctionArguments(sourceCode, startPos);
            methods.push({functionName, args});
        }
        return {methods, defines, variables, images};
    }

    /**
     * Parse function arguments from source code starting at a given position
     * Extracts and splits arguments in a single pass, handling nested parentheses and quoted strings
     */
    protected parseFunctionArguments(sourceCode: string, startPos: number): string[] {
        const args: string[] = [];
        let currentArg = '';
        let inQuotes = false;
        let parenCount = 0;
        let escapeNext = false;

        for (let i = startPos; i < sourceCode.length; i++) {
            const char = sourceCode[i];

            if (escapeNext) {
                // Handle escaped character - add the backslash and the escaped character
                currentArg += `\\${char}`;
                escapeNext = false;
            } else if (char === '\\') {
                // Mark next character as escaped (don't add backslash yet)
                escapeNext = true;
            } else if (char === '"') {
                // Toggle quote state (escaped quotes are handled above)
                inQuotes = !inQuotes;
                currentArg += char;
            } else if (char === '(' && !inQuotes) {
                parenCount++;
                currentArg += char;
            } else if (char === ')' && !inQuotes) {
                if (parenCount === 0) {
                    // Found the closing parenthesis for our function
                    if (currentArg.trim()) {
                        args.push(currentArg.trim());
                    }
                    break;
                }
                parenCount--;
                currentArg += char;
            } else if (char === ',' && !inQuotes && parenCount === 0) {
                args.push(currentArg.trim());
                currentArg = '';
            } else {
                currentArg += char;
            }
        }

        return args;
    }

    protected getXbmpFromMatch(match: RegExpExecArray): {name; xbmp} {
        const name = match[3];
        const xbmp = match[5]
            .split(',')
            .map((x) => x.trim())
            .join(',');
        return {name, xbmp};
    }

    protected getArgs(args: any[], defines: Map<string, string>, variables: Map<string, string>): any[] {
        return args.map((arg) => {
            if (defines.has(arg)) {
                return defines.get(arg);
            } else if (variables.has(arg)) {
                return variables.get(arg);
            }
            return arg;
        });
    }

    protected parseImageName(name: string): string {
        return name.replace(/image_(.*)_bits/g, '$1');
    }

    abstract importSourceCode(sourceCode: string): {states: any[]; warnings: string[]};
}
