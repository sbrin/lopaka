export type ImageHeader = {filename: string; content: string};

/** Collect image files for one code generation pass. */
export function createImageExport(enabled: boolean = false) {
    const headers: ImageHeader[] = [];
    return {
        headers,
        declare(name: string, declaration: string): string {
            if (!enabled) return declaration;
            const header = createImageHeader(name, declaration);
            let suffix = 2;
            while (headers.some((asset) => asset.filename.toLowerCase() === header.filename.toLowerCase())) {
                header.filename = `${name}_${suffix++}.h`;
            }
            headers.push(header);
            return `#include "${header.filename}"`;
        },
    };
}

/** Keep the exact platform declaration, including its storage and pixel format. */
export function createImageHeader(name: string, declaration: string): ImageHeader {
    const guard = `LOPAKA_${name}_H`;
    return {
        filename: `${name}.h`,
        content: `#ifndef ${guard}\n#define ${guard}\n\n#include <stdint.h>\n\n${declaration}\n\n#endif // ${guard}\n`,
    };
}
