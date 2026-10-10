export type ImageHeader = {filename: string; content: string};

/** Keep the exact platform declaration, including its storage and pixel format. */
export function createImageHeader(name: string, declaration: string): ImageHeader {
    const guard = `LOPAKA_${name}_H`;
    return {
        filename: `${name}.h`,
        content: `#ifndef ${guard}\n#define ${guard}\n\n#include <stdint.h>\n\n${declaration}\n\n#endif // ${guard}\n`,
    };
}
