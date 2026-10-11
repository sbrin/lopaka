export type LayerTitle = {name: string; used?: boolean};

/** Mask comments without moving source offsets or touching quoted literals. */
export function parseLayerTitles(source: string, python = false) {
    const titles: {offset: number; title?: LayerTitle}[] = [];
    const tokens = python
        ? /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|#[^\r\n]*/g
        : /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|[{}]/g;
    const code = source.replace(tokens, (token: string, offset: number) => {
        const lineComment = token.startsWith(python ? '#' : '//');
        const blockComment = !python && token.startsWith('/*');
        if (lineComment) {
            const prefix = source.slice(source.lastIndexOf('\n', offset - 1) + 1, offset);
            // Only whole-line comments are exported layer titles.
            if (!prefix.trim()) {
                const name = token.slice(python ? 1 : 2).trim();
                titles.push({offset, title: name ? {name} : undefined});
            }
        } else if (blockComment || token === '{' || token === '}') {
            // A title outside a function must not leak into its body.
            titles.push({offset});
        }
        return lineComment || blockComment ? token.replace(/[^\r\n]/g, ' ') : token;
    });
    return {
        code,
        titleAt(offset: number): LayerTitle | undefined {
            // Lookups also support the separate LVGL widget discovery pass.
            for (let i = titles.length - 1; i >= 0; i--) {
                if (titles[i].offset < offset) return titles[i].title;
            }
        },
    };
}

/** Consume a title only when a drawing command actually creates a layer. */
export function applyLayerTitle(states: {name?: string}[], start: number, title?: LayerTitle, prefix = '') {
    if (!title || title.used || states.length === start) return;
    const name = prefix && title.name.startsWith(prefix) ? title.name.slice(prefix.length) : title.name;
    for (let i = start; i < states.length; i++) states[i].name = name;
    title.used = true;
}
