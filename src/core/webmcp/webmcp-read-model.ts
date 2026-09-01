/**
 * Editor read model for WebMCP tools.
 *
 * These helpers turn live session state into the structures an agent reads
 * before it proposes a change. Everything here is pure: the caller supplies a
 * snapshot read at invocation time, so a tool never answers from state captured
 * during registration.
 *
 * Returned content may include user-authored layer text, so every tool
 * built on this module carries `untrustedContentHint: true`.
 */

import {TLayerModifier, TModifierType} from '../layers/abstract.layer';
import {isLayerPropertySupported} from '../layer-property-capabilities';
import type {TPlatformFeatures} from '/src/platforms/platform';

export type TWebMcpRectLike = {x: number; y: number; w: number; h: number};

export type TWebMcpBounds = {x: number; y: number; width: number; height: number};

/**
 * Structural view of a layer. `AbstractLayer` satisfies it, and so can a plain
 * fixture, which keeps these helpers testable without the canvas stack.
 */
export type TWebMcpReadLayer = {
    uid: string;
    name: string;
    index: number;
    hidden: boolean;
    locked: boolean;
    selected?: boolean;
    group?: string | null;
    bounds?: TWebMcpRectLike;
    text?: string;
    modifiers?: Partial<Record<string, TLayerModifier>>;
    getType(): string;
};

/**
 * Layer operations an agent may perform, reported so it stops proposing the
 * ones Lopaka deliberately does not expose. The list is static application data
 * and is gated only by whether the active context is editable.
 */
export const WEBMCP_LAYER_ACTIONS: readonly string[] = [
    'lopaka_select_layers',
    'lopaka_update_layer_state',
    'lopaka_reorder_layers',
    'lopaka_group_layers',
    'lopaka_ungroup_layers',
    'lopaka_update_layer',
    'lopaka_delete_layers',
];

const MODIFIER_TYPE_NAMES: Record<number, string> = {
    [TModifierType.string]: 'string',
    [TModifierType.number]: 'number',
    [TModifierType.boolean]: 'boolean',
    [TModifierType.font]: 'font',
    [TModifierType.image]: 'image',
    [TModifierType.color]: 'color',
};

export type TWebMcpLayerProperty = {
    name: string;
    type: string;
    /** Primitive current value, or null when the value is not representable. */
    value: string | number | boolean | null;
    editable: boolean;
    minimum?: number;
    maximum?: number;
    step?: number;
    nullable?: boolean;
};

export type TWebMcpLayerSummary = {
    /** Public WebMCP identifier; the editor's internal layer field remains `uid`. */
    layerId: string;
    name: string;
    type: string;
    index: number;
    group: string | null;
    bounds: TWebMcpBounds | null;
    hidden: boolean;
    locked: boolean;
    selected: boolean;
    properties: TWebMcpLayerProperty[];
    text?: string;
};

export type TWebMcpLayerDetail = TWebMcpLayerSummary & {
    actions: string[];
};

export function serializeWebMcpBounds(bounds?: TWebMcpRectLike): TWebMcpBounds | null {
    if (
        !bounds ||
        !Number.isFinite(bounds.x) ||
        !Number.isFinite(bounds.y) ||
        !Number.isFinite(bounds.w) ||
        !Number.isFinite(bounds.h)
    ) {
        return null;
    }

    return {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h};
}

/**
 * Image modifiers hold pixel buffers rather than a readable value, and a
 * modifier can throw while a layer is mid-load. Either way the property is
 * still reported, with a null value, so the agent sees the full property set.
 */
function serializeModifierValue(modifier: TLayerModifier): string | number | boolean | null {
    if (modifier.type === TModifierType.image) {
        return null;
    }
    let value: unknown;
    try {
        value = modifier.getValue();
    } catch {
        return null;
    }
    if (typeof value === 'string' || typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    return null;
}

export type TWebMcpLayerReadOptions = {
    platformId?: string;
    features?: Partial<TPlatformFeatures>;
    paintColorMode?: 'rgb' | 'monochrome';
};

export function describeWebMcpLayerProperties(
    layer: TWebMcpReadLayer,
    options: TWebMcpLayerReadOptions = {}
): TWebMcpLayerProperty[] {
    const modifiers = layer.modifiers ?? {};
    // Text stores a baseline position, so its x/y are reported as the top-left
    // corner of the rendered text, the same coordinates the write tools accept.
    const textTopLeft = layer.getType() === 'string' && layer.bounds ? {x: layer.bounds.x, y: layer.bounds.y} : null;

    const properties = Object.keys(modifiers).reduce<TWebMcpLayerProperty[]>((result, name) => {
        const modifier = modifiers[name];
        if (!modifier) {
            return result;
        }
        if (
            options.platformId !== undefined &&
            !isLayerPropertySupported({
                name,
                modifier,
                platformId: options.platformId,
                layerType: layer.getType(),
                features: options.features,
                paintColorMode: options.paintColorMode,
            })
        ) {
            return result;
        }
        result.push({
            name,
            type: MODIFIER_TYPE_NAMES[modifier.type] ?? 'unknown',
            value: textTopLeft && (name === 'x' || name === 'y') ? textTopLeft[name] : serializeModifierValue(modifier),
            // A fixed modifier is displayed but cannot be set by the user.
            editable: !modifier.fixed && typeof modifier.setValue === 'function',
            ...(modifier.min !== undefined ? {minimum: modifier.min} : {}),
            ...(modifier.max !== undefined ? {maximum: modifier.max} : {}),
            ...(modifier.step !== undefined ? {step: modifier.step} : {}),
            ...(modifier.nullable ? {nullable: true} : {}),
        });
        return result;
    }, []);

    return properties;
}

export function describeWebMcpLayer(
    layer: TWebMcpReadLayer,
    options: TWebMcpLayerReadOptions = {}
): TWebMcpLayerSummary {
    return {
        layerId: layer.uid,
        name: layer.name,
        type: layer.getType(),
        index: layer.index,
        group: layer.group ?? null,
        bounds: serializeWebMcpBounds(layer.bounds),
        hidden: Boolean(layer.hidden),
        locked: Boolean(layer.locked),
        selected: Boolean(layer.selected),
        properties: describeWebMcpLayerProperties(layer, options),
        // Exact current text, including an empty string, for layers that carry one.
        ...(typeof layer.text === 'string' ? {text: layer.text} : {}),
    };
}

export function describeWebMcpLayers(
    layers: TWebMcpReadLayer[],
    options: TWebMcpLayerReadOptions = {}
): TWebMcpLayerSummary[] {
    return (layers ?? []).map((layer) => describeWebMcpLayer(layer, options));
}

export function describeWebMcpLayerDetail(
    layer: TWebMcpReadLayer,
    options: TWebMcpLayerReadOptions & {editable: boolean}
): TWebMcpLayerDetail {
    return {
        ...describeWebMcpLayer(layer, options),
        // Read-only contexts support no layer operations at all.
        actions: options.editable ? [...WEBMCP_LAYER_ACTIONS] : [],
    };
}

export function findWebMcpLayer(layers: TWebMcpReadLayer[], layerId: string): TWebMcpReadLayer | null {
    return (layers ?? []).find((layer) => layer.uid === layerId) ?? null;
}

export function selectedWebMcpLayerIds(layers: TWebMcpReadLayer[]): string[] {
    return (layers ?? []).filter((layer) => layer.selected).map((layer) => layer.uid);
}

export type TWebMcpScreenSummarySource = {
    contextId: string;
    platform: string | null;
    display: {x: number; y: number};
    /** True when the display size is not one of the platform presets. */
    displayCustom: boolean;
    background: string | null;
    layers: TWebMcpReadLayer[];
    canUndo: boolean;
    canRedo: boolean;
    warnings: string[];
    infos: string[];
};

export type TWebMcpScreenSummary = {
    platform: string | null;
    width: number;
    height: number;
    displayCustom: boolean;
    background: string | null;
    layerCount: number;
    selectedLayerIds: string[];
    canUndo: boolean;
    canRedo: boolean;
    warnings: string[];
    infos: string[];
    contextId: string;
};

export function describeWebMcpScreenSummary(source: TWebMcpScreenSummarySource): TWebMcpScreenSummary {
    const layers = source.layers ?? [];

    return {
        platform: source.platform,
        width: source.display.x,
        height: source.display.y,
        displayCustom: source.displayCustom,
        background: source.background,
        layerCount: layers.length,
        // Stacking order, matching the order lopaka_list_layers reports.
        selectedLayerIds: selectedWebMcpLayerIds(layers),
        canUndo: source.canUndo,
        canRedo: source.canRedo,
        warnings: [...(source.warnings ?? [])],
        infos: [...(source.infos ?? [])],
        contextId: source.contextId,
    };
}

export type TWebMcpCodeParameter = {name: string; column: number};

export type TWebMcpCodeMapping = {
    layerId: string;
    /** Zero-based line index into the returned code. */
    line: number;
    /** Column of each generated parameter value on that line. */
    parameters: TWebMcpCodeParameter[];
};

export type TWebMcpGeneratedCode = {
    code: string;
    /**
     * Lopaka's generator annotates one line per drawn layer, so the mapping is
     * line-and-column based. There is no end offset to report, and layers that
     * are hidden or drawn as an overlay are not generated and therefore not
     * mapped.
     */
    mapping: TWebMcpCodeMapping[];
    mappingGranularity: 'line';
};

export function describeWebMcpGeneratedCode(source: {code?: string; map?: TSourceCodeMap}): TWebMcpGeneratedCode {
    const map = source?.map ?? {};

    return {
        code: source?.code ?? '',
        mapping: Object.keys(map).map((layerId) => {
            const entry =
                map[layerId] ?? ({line: undefined, params: {}} as {line: number; params: Record<string, any>});
            const params = entry.params ?? {};
            return {
                layerId,
                line: entry.line,
                parameters: Object.keys(params)
                    .filter((name) => typeof params[name] === 'number')
                    .map((name) => ({name, column: params[name] as number})),
            };
        }),
        mappingGranularity: 'line',
    };
}
