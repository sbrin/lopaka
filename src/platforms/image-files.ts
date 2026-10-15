export type ImageFile = {filename: string; content: string | ImageData};

export function createImageDeclaration(
    enabled: boolean,
    format: 'h' | 'py' | 'png' = 'h',
    onImage?: (file: ImageFile) => void
) {
    const filenames = new Set<string>();
    return (name: string, declaration: string, image?: ImageData): string => {
        if (!enabled) return declaration;
        let stem = name;
        let suffix = 2;
        while (filenames.has((stem + '.' + format).toLowerCase())) {
            stem = name + '_' + suffix++;
        }
        const filename = stem + '.' + format;
        filenames.add(filename.toLowerCase());
        if (format === 'png') {
            if (!image) throw new Error('Missing image data');
            onImage?.({filename, content: image});
            return filename;
        }
        if (format === 'py') {
            onImage?.({filename, content: declaration + '\n'});
            return 'from ' + stem + ' import ' + name;
        }
        if (onImage) onImage({...createImageHeader(name, declaration), filename});
        return '#include "' + filename + '"';
    };
}

export function createImageHeader(name: string, declaration: string) {
    const guard = `LOPAKA_${name}_H`;
    return {
        filename: `${name}.h`,
        content: `#ifndef ${guard}\n#define ${guard}\n\n#include <stdint.h>\n\n${declaration}\n\n#endif // ${guard}\n`,
    };
}
