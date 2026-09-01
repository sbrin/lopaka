/**
 * Structural fingerprint of the active screen's layer stack.
 *
 * The editor has no authoritative document revision, so structural mutations
 * use a narrow token. It is derived from the
 * active screen identity plus the ordered sequence of stable layer identifiers
 * and their group membership, so it changes when a layer is added, removed,
 * reordered, grouped, or ungrouped, and stays put for selection, geometry,
 * text, visibility, and locking.
 *
 * The value is hashed rather than concatenated because group names are
 * user-authored: an opaque token cannot carry layer content back to the agent.
 */

export type TWebMcpStructureLayer = {
    uid: string;
    group?: string | null;
};

export type TWebMcpStructureSource = {
    /** Identity of the screen the stack belongs to, normally the `contextId`. */
    screenKey: string;
    /** Layers in stacking order. */
    layers: TWebMcpStructureLayer[];
};

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(input: string): string {
    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        // Multiply in 32-bit space without relying on float precision.
        hash = Math.imul(hash, FNV_PRIME) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

// Separators cannot appear in the escaped parts, so two different stacks cannot
// serialize to the same string before hashing.
function escapePart(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/~/g, '\\~').replace(/\|/g, '\\p');
}

export function buildWebMcpStructureToken(source: TWebMcpStructureSource): string {
    const layers = source.layers ?? [];
    const serialized = [
        escapePart(source.screenKey ?? ''),
        ...layers.map((layer) => `${escapePart(layer.uid ?? '')}~${escapePart(layer.group ?? '')}`),
    ].join('|');

    return `st:${layers.length}:${fnv1a(serialized)}`;
}
