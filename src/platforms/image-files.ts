export type ImageFile = {filename: string; content: string | ImageData};
export type ImageDeclaration = (name: string, declaration: string, image?: ImageData) => string;
export const inlineImage: ImageDeclaration = (_name, declaration) => declaration;

/** One collection per generation, shared by the code panel and file downloads. */
export function createImageExport(enabled: boolean, format: 'h' | 'py' | 'png' = 'h') {
    const files: ImageFile[] = [];
    const declare: ImageDeclaration = (name, declaration, image) => {
        if (!enabled) return declaration;
        let stem = name;
        let suffix = 2;
        while (files.some((file) => file.filename.toLowerCase() === `${stem}.${format}`.toLowerCase())) {
            stem = `${name}_${suffix++}`;
        }
        const filename = `${stem}.${format}`;
        if (format === 'png') {
            if (!image) throw new Error('Missing image data');
            files.push({filename, content: image});
            return filename;
        }
        if (format === 'py') {
            files.push({filename, content: `${declaration}\n`});
            return `from ${stem} import ${name}`;
        }
        const file = createImageHeader(name, declaration);
        files.push({...file, filename});
        return `#include "${filename}"`;
    };
    return {files, declare};
}

export function createImageHeader(name: string, declaration: string) {
    const guard = `LOPAKA_${name}_H`;
    return {
        filename: `${name}.h`,
        content: `#ifndef ${guard}\n#define ${guard}\n\n#include <stdint.h>\n\n${declaration}\n\n#endif // ${guard}\n`,
    };
}
