import {EditMode, TModifierType, type AbstractLayer, type TLayerModifier} from './layers/abstract.layer';
import type {LayerReorderEntry} from './layers-manager';
import type {Session} from './session';
import {isLayerPropertySupported} from './layer-property-capabilities';
import {Point} from './point';
import {PaintLayer} from './layers/paint.layer';
import type {TEditorResolvedAsset} from './asset-library';

export type LayerTreeNode =
    | {type: 'layer'; layer: AbstractLayer}
    | {type: 'group'; group: string; layers: AbstractLayer[]};

export type LayerSelectionMode = 'replace' | 'add' | 'remove' | 'range' | 'group' | 'clear';

export type EditorActionsGuard = {
    readonly?: boolean;
};

export type EditorActionError =
    | {code: 'readonly'; message: string}
    | {code: 'stale_context' | 'stale_layer_state'; message: string}
    | {code: 'locked'; message: string}
    | {code: 'not_found'; message: string; uid?: string}
    | {code: 'unsupported_for_platform'; message: string; field?: string}
    | {code: 'invalid' | 'internal'; message: string; field?: string};

export type EditorActionResult<T = void> = {ok: true; data: T} | {ok: false; error: EditorActionError};

export type EditorLayerPatch = Record<string, unknown>;

export type EditorCreationTool = {
    getName(): string;
    isSupported?(platform: string): boolean;
    createLayer(): AbstractLayer;
    onStartEdit?(layer: AbstractLayer, point: Point, event: MouseEvent | TouchEvent): void;
    onStopEdit?(layer: AbstractLayer, point: Point, event: MouseEvent | TouchEvent): void;
    finalizeCreate?(layer: AbstractLayer, point: Point, event: MouseEvent | TouchEvent): boolean;
    cancelCreate?(layer: AbstractLayer): boolean;
};

export type EditorLayerCreatePlan = {
    origin?: Point;
    extent?: Point;
    properties?: EditorLayerPatch;
    apply?: (layer: AbstractLayer) => void;
};

export type EditorLayerCreateOptions = {
    /** A live editor tool or its name in the active platform tool catalog. */
    tool: string | EditorCreationTool;
    /** Pointer geometry is supplied by the UI/WebMCP adapter, not parsed here. */
    origin?: Point;
    extent?: Point;
    event?: MouseEvent | TouchEvent;
    /** Adapter-only geometry/property preparation after the layer is instantiated. */
    prepare?: (layer: AbstractLayer) => EditorLayerCreatePlan | {error: EditorActionError};
    properties?: EditorLayerPatch;
    apply?: (layer: AbstractLayer) => void;
    /** Complete creation immediately (used by non-pointer adapters). */
    complete?: boolean;
    /** UI tools opt into their pointer callbacks; WebMCP intentionally does not. */
    invokeToolCallbacks?: boolean;
    readonly?: boolean;
};

export type EditorLayerCreateData = {
    layer: AbstractLayer;
    tool: EditorCreationTool;
    completed: boolean;
};

export type EditorLayerCompleteOptions = {
    layer: AbstractLayer;
    tool: EditorCreationTool;
    point?: Point;
    event?: MouseEvent | TouchEvent;
    mode?: 'stop' | 'finalize' | 'cancel' | 'discard';
    invokeToolCallback?: boolean;
    /** Clear the selected tool after an explicit completion/cancel. */
    clearTool?: boolean;
};

export type EditorLayerUpdateData = {
    layer: AbstractLayer;
    /** Values after the same normalization the Inspector applies. */
    normalizedPatch: EditorLayerPatch;
    changed: boolean;
};

export type EditorLayerUpdateOptions = EditorActionsGuard & {
    /** Inspector coalesces rapid text/number input into one undo step. */
    history?: 'immediate' | 'coalesced';
    /**
     * Finalize derived geometry after property setters and before the redo
     * snapshot is recorded. This keeps adapter-specific coordinate transforms
     * inside the same transaction and undo/redo step.
     */
    afterMutation?: (layer: AbstractLayer) => void;
};

export type EditorAssetAddOptions = EditorActionsGuard & {
    asset: TEditorResolvedAsset;
    x?: number;
    y?: number;
    color?: string;
    signal?: AbortSignal;
};

export type EditorAssetAddData = {layer: AbstractLayer};

export const EDITOR_DISPLAY_MIN = 1;
export const EDITOR_DISPLAY_MAX = 4096;

export type LayerClickInput = {
    layer: AbstractLayer;
    shiftKey?: boolean;
    ctrlKey?: boolean;
};

export function buildLayerTree(sortedLayers: AbstractLayer[]): {
    nodes: LayerTreeNode[];
    activeGroups: Set<string>;
} {
    const grouped = new Map<string, AbstractLayer[]>();
    sortedLayers.forEach((layer) => {
        if (!layer.group) return;
        if (!grouped.has(layer.group)) grouped.set(layer.group, []);
        grouped.get(layer.group)!.push(layer);
    });
    const seen = new Set<string>();
    const nodes: LayerTreeNode[] = [];
    sortedLayers.forEach((layer) => {
        if (layer.group) {
            if (seen.has(layer.group)) return;
            seen.add(layer.group);
            nodes.push({type: 'group', group: layer.group, layers: [...(grouped.get(layer.group) ?? [])]});
        } else {
            nodes.push({type: 'layer', layer});
        }
    });
    return {nodes, activeGroups: seen};
}

export function findRootIndex(nodes: LayerTreeNode[], type: 'layer' | 'group', id: string): number {
    return nodes.findIndex((node) =>
        type === 'layer' ? node.type === 'layer' && node.layer.uid === id : node.type === 'group' && node.group === id
    );
}

export type DropTarget =
    | {
          container: 'root';
          position: 'before' | 'after';
          referenceType: 'layer' | 'group';
          referenceId: string;
          rootIndex: number;
      }
    | {container: 'root'; position: 'end'}
    | {container: 'group'; group: string; position: 'before' | 'after'; referenceLayerId: string; rootIndex: number}
    | {container: 'group'; group: string; position: 'start' | 'end'; rootIndex: number};

function hasRootReference(
    target: DropTarget
): target is Extract<DropTarget, {container: 'root'; referenceType: string}> {
    return target.container === 'root' && 'referenceType' in target;
}
function hasGroupReference(
    target: DropTarget
): target is Extract<DropTarget, {container: 'group'; referenceLayerId: string}> {
    return target.container === 'group' && 'referenceLayerId' in target;
}

function cloneTree(nodes: LayerTreeNode[]): LayerTreeNode[] {
    return nodes.map((node) =>
        node.type === 'group'
            ? {type: 'group', group: node.group, layers: [...node.layers]}
            : {type: 'layer', layer: node.layer}
    );
}
function removeDrag(
    nodes: LayerTreeNode[],
    layer: AbstractLayer
): {nodes: LayerTreeNode[]; removed: AbstractLayer} | null {
    const next = cloneTree(nodes);
    for (let i = 0; i < next.length; i++) {
        const node = next[i];
        if (node.type === 'layer' && node.layer.uid === layer.uid) {
            next.splice(i, 1);
            return {nodes: next, removed: layer};
        }
        if (node.type === 'group') {
            const index = node.layers.findIndex((item) => item.uid === layer.uid);
            if (index !== -1) {
                node.layers.splice(index, 1);
                if (!node.layers.length) next.splice(i, 1);
                return {nodes: next, removed: layer};
            }
        }
    }
    return null;
}
function insertLayer(nodes: LayerTreeNode[], layer: AbstractLayer, target: DropTarget): LayerTreeNode[] {
    if (target.container === 'root') {
        if (target.position === 'end' || !hasRootReference(target)) {
            nodes.push({type: 'layer', layer});
            return nodes;
        }
        const index = findRootIndex(nodes, target.referenceType, target.referenceId);
        nodes.splice(index < 0 ? nodes.length : target.position === 'before' ? index : index + 1, 0, {
            type: 'layer',
            layer,
        });
        return nodes;
    }
    let group = nodes.find((node) => node.type === 'group' && node.group === target.group) as
        | Extract<LayerTreeNode, {type: 'group'}>
        | undefined;
    if (!group) {
        group = {type: 'group', group: target.group, layers: []};
        nodes.splice(target.rootIndex < 0 ? nodes.length : Math.min(target.rootIndex, nodes.length), 0, group);
    }
    if (target.position === 'start') group.layers.unshift(layer);
    else if (target.position === 'end' || !hasGroupReference(target)) group.layers.push(layer);
    else {
        const index = group.layers.findIndex((item) => item.uid === target.referenceLayerId);
        group.layers.splice(
            index < 0 ? group.layers.length : target.position === 'before' ? index : index + 1,
            0,
            layer
        );
    }
    return nodes;
}

export function computeReorderEntries(
    nodes: LayerTreeNode[],
    layer: AbstractLayer,
    target: DropTarget
): LayerReorderEntry[] | null {
    const removal = removeDrag(nodes, layer);
    if (!removal) return null;
    const inserted = insertLayer(removal.nodes, removal.removed, target);
    return inserted
        .filter((node) => node.type !== 'group' || node.layers.length)
        .map((node) =>
            node.type === 'group'
                ? {type: 'group', group: node.group, layers: node.layers}
                : {type: 'layer', layer: node.layer}
        );
}

function snapshot(layers: AbstractLayer[]) {
    return layers.map((layer) => ({uid: layer.uid, group: layer.group ?? null}));
}

export class EditorActions {
    private readonly coalescedHistoryTimers = new WeakMap<
        AbstractLayer,
        {timer: ReturnType<typeof setTimeout>; epoch: number | undefined}
    >();

    constructor(private readonly session: Session) {}

    setDisplay(width: number, height: number): EditorActionResult<{width: number; height: number; custom: boolean}> {
        if (
            !Number.isInteger(width) ||
            !Number.isInteger(height) ||
            width < EDITOR_DISPLAY_MIN ||
            height < EDITOR_DISPLAY_MIN ||
            width > EDITOR_DISPLAY_MAX ||
            height > EDITOR_DISPLAY_MAX
        ) {
            return {
                ok: false,
                error: {code: 'invalid', message: 'Display dimensions must be whole pixels in the supported range.'},
            };
        }
        const custom = !this.session
            .getDisplays()
            .some((display) => display.size.x === width && display.size.y === height);
        this.session.setDisplay(new Point(width, height));
        this.session.saveDisplayCustom(custom);
        // Session.setDisplay schedules a frame after resizing the canvas. MCP
        // callers need a completed frame before the immediate-update signal so
        // autosave and other reactive consumers never capture a cleared canvas.
        this.session.virtualScreen.redraw();
        this.session.layersManager.update?.();
        return {ok: true, data: {width, height, custom}};
    }

    setScreenBackground(color: string): EditorActionResult<{color: string}> {
        if (!/^#[0-9a-f]{6}$/i.test(color)) {
            return {ok: false, error: {code: 'invalid', message: 'Background color must be a six-digit hex color.'}};
        }
        const platform = this.session.platforms[this.session.state.platform];
        if (!platform) {
            return {
                ok: false,
                error: {code: 'unsupported_for_platform', message: 'The active platform is not available.'},
            };
        }
        const normalized = color.toUpperCase();
        platform.features.screenBgColor = normalized;
        localStorage.setItem(`lopaka_${this.session.state.platform}_color_bg`, normalized);
        // Image layers with alpha disabled flatten transparent pixels against
        // the platform background while drawing. Rebuild every layer buffer so
        // a background change cannot leave stale pixels behind on the canvas.
        this.session.layersManager.eachLayer?.((layer) => layer.draw?.());
        this.session.virtualScreen.redraw();
        this.session.layersManager.update?.();
        return {ok: true, data: {color: normalized}};
    }

    async setPlatform(platformId: string): Promise<EditorActionResult<{platform: string}>> {
        if (!this.session.platforms[platformId]) {
            return {
                ok: false,
                error: {code: 'unsupported_for_platform', message: 'The requested platform is not available.'},
            };
        }
        if (this.session.state.platform !== platformId) await this.session.preparePlatform(platformId, true);
        this.session.layersManager.update?.();
        return {ok: true, data: {platform: platformId}};
    }

    private check(guard: EditorActionsGuard = {}): EditorActionError | null {
        if (guard.readonly) return {code: 'readonly', message: 'The active editor document is read-only.'};
        return null;
    }

    private flushCoalescedHistory(layer: AbstractLayer): void {
        const pending = this.coalescedHistoryTimers.get(layer);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.coalescedHistoryTimers.delete(layer);
        const stillAttached = Boolean(this.session.layersManager.getLayer(layer.uid));
        if (stillAttached) {
            layer.pushRedoHistory();
        }
    }

    /**
     * Callers may hold a reactive proxy around a layer, so screen membership is
     * resolved by uid and every action works with the tracked instance.
     */
    private resolve(input: readonly (AbstractLayer | string)[]): {layers?: AbstractLayer[]; error?: EditorActionError} {
        const layers: AbstractLayer[] = [];
        for (const item of input) {
            const uid = typeof item === 'string' ? item : item?.uid;
            const layer = uid ? this.session.layersManager.getLayer(uid) : undefined;
            if (!layer) {
                return {
                    error: {
                        code: 'not_found',
                        message: 'A supplied layer is not on the active screen.',
                        uid,
                    },
                };
            }
            layers.push(layer);
        }
        return {layers};
    }

    private finish<T>(data: T): EditorActionResult<T> {
        // WebMCP mutations must invalidate the same reactive counters as direct
        // editor actions, otherwise layer lists and generated code wait for a
        // debounced manager update even though the canvas was already redrawn.
        this.session.virtualScreen.redraw();
        this.session.layersManager.update?.();
        return {ok: true, data};
    }

    private availableFontNames(): string[] {
        const platform = this.session.platforms?.[this.session.state.platform];
        return [...(platform?.getFonts?.() ?? []), ...(this.session.state.customFonts ?? [])].map((font) => font.name);
    }

    private normalizeLayerPatch(
        layer: AbstractLayer,
        patch: EditorLayerPatch
    ): {normalizedPatch?: EditorLayerPatch; error?: EditorActionError} {
        const requested = Object.keys(patch);
        if (!requested.length)
            return {error: {code: 'invalid', message: 'At least one property to change is required.'}};

        const normalizedPatch: EditorLayerPatch = {};
        for (const name of requested) {
            const value = patch[name];
            if (name === 'name') {
                if (typeof value !== 'string')
                    return {error: {code: 'invalid', message: 'Layer name must be a string.'}};
                normalizedPatch[name] = value;
                continue;
            }

            const modifiers = layer.modifiers as Record<string, TLayerModifier>;
            const modifier: TLayerModifier | undefined = modifiers?.[name];
            if (!modifier) {
                return {
                    error: {code: 'invalid', message: 'That layer does not have this property.', field: name},
                };
            }
            if (
                !isLayerPropertySupported({
                    name,
                    modifier,
                    platformId: this.session.state.platform,
                    layerType: layer.getType?.(),
                    features: this.session.getPlatformFeatures?.(),
                    paintColorMode: this.session.state.paintColorMode,
                })
            ) {
                return {
                    error: {code: 'invalid', message: 'That property is not supported on this platform.', field: name},
                };
            }
            if (modifier.fixed || typeof modifier.setValue !== 'function') {
                return {error: {code: 'invalid', message: 'That property is read-only on this layer.', field: name}};
            }
            if (value === null && !modifier.nullable) {
                return {error: {code: 'invalid', message: 'That property cannot be cleared.', field: name}};
            }

            switch (modifier.type) {
                case TModifierType.number: {
                    const parsed = typeof value === 'number' ? Math.trunc(value) : parseInt(String(value), 10);
                    const numeric = Number.isNaN(parsed) ? 0 : parsed;
                    const min = modifier.min ?? Number.NEGATIVE_INFINITY;
                    const max = modifier.max ?? Number.POSITIVE_INFINITY;
                    normalizedPatch[name] = Math.max(min, Math.min(max, numeric));
                    break;
                }
                case TModifierType.boolean:
                    if (typeof value !== 'boolean')
                        return {
                            error: {code: 'invalid', message: 'Boolean properties require true or false.', field: name},
                        };
                    normalizedPatch[name] = value;
                    break;
                case TModifierType.string:
                    if (typeof value !== 'string')
                        return {error: {code: 'invalid', message: 'String properties require text.', field: name}};
                    normalizedPatch[name] = value;
                    break;
                case TModifierType.font:
                    if (typeof value !== 'string' || !this.availableFontNames().includes(value)) {
                        return {
                            error: {
                                code: 'unsupported_for_platform',
                                message: 'The active Lopaka platform does not provide that font.',
                                field: name,
                            },
                        };
                    }
                    normalizedPatch[name] = value;
                    break;
                case TModifierType.color:
                    if (value !== null && typeof value !== 'string')
                        return {
                            error: {
                                code: 'invalid',
                                message: 'Color properties require a string or null.',
                                field: name,
                            },
                        };
                    // Keep arbitrary platform color strings, but make HEX values
                    // deterministic for Inspector/WebMCP parity and memory.
                    normalizedPatch[name] =
                        typeof value === 'string' && /^#?[0-9a-f]{6}$/i.test(value.trim())
                            ? `#${value.trim().replace(/^#/, '').toUpperCase()}`
                            : value;
                    break;
                default:
                    normalizedPatch[name] = value;
            }
        }
        return {normalizedPatch};
    }

    private resolveCreationTool(requested: string | EditorCreationTool): {
        tool?: EditorCreationTool;
        error?: EditorActionError;
    } {
        const tool =
            typeof requested === 'string'
                ? (this.session.editor.getSupportedTools(this.session.state.platform)[requested] as
                      | EditorCreationTool
                      | undefined)
                : requested;
        if (!tool || (this.session.state.platform && tool.isSupported?.(this.session.state.platform) === false)) {
            return {
                error: {
                    code: 'unsupported_for_platform',
                    message: 'The active Lopaka platform does not support that layer type.',
                },
            };
        }
        return {tool};
    }

    private applyCreationDefaults(layer: AbstractLayer): void {
        const features =
            this.session.getPlatformFeatures?.() ??
            ({} as {hasRGBSupport?: boolean; hasIndexedColors?: boolean; defaultColor?: string});
        if (!features.hasRGBSupport && !features.hasIndexedColors) {
            if (features.defaultColor) layer.color = features.defaultColor;
            return;
        }
        const color = this.session.editor.lastColor ?? this.session.state.brushColor;
        if (color) layer.color = color;
    }

    private applyNormalizedLayerPatch(layer: AbstractLayer, patch: EditorLayerPatch): void {
        Object.entries(patch).forEach(([name, value]) => {
            if (name === 'name') layer.setName(value as string);
            else (layer.modifiers as Record<string, TLayerModifier>)[name]!.setValue!(value);

            const modifier = name === 'name' ? undefined : (layer.modifiers as Record<string, TLayerModifier>)[name];
            if (modifier?.type === TModifierType.font) {
                this.session.editor.lastFontName = value as string;
                this.session.editor.font = layer.font ?? this.session.editor.font;
            }
            if (modifier?.type === TModifierType.color && value !== null) {
                this.session.setBrushColor?.(value as string);
                this.session.setLastColor?.(value as string);
            }
        });
    }

    private applyCreationProperties(
        layer: AbstractLayer,
        properties: EditorLayerPatch | undefined
    ): EditorActionError | null {
        if (!properties || Object.keys(properties).length === 0) return null;
        const normalized = this.normalizeLayerPatch(layer, properties);
        if (normalized.error) return normalized.error;
        this.applyNormalizedLayerPatch(layer, normalized.normalizedPatch!);
        return null;
    }

    private assetPlacementIntersectsDisplay(x: number, y: number, width: number, height: number): boolean {
        const display = this.session.state.display;
        const left = Math.max(0, x);
        const top = Math.max(0, y);
        const right = Math.min(display.x, x + width);
        const bottom = Math.min(display.y, y + height);
        if (left >= right || top >= bottom) return false;
        return true;
    }

    /** Add a resolved image, icon, or animation through one editor-owned transaction. */
    async addAsset(input: EditorAssetAddOptions): Promise<EditorActionResult<EditorAssetAddData>> {
        const denied = this.check({readonly: input.readonly});
        if (denied) return {ok: false, error: denied};
        if (input.signal?.aborted) {
            return {ok: false, error: {code: 'stale_context', message: 'The active editor document has changed.'}};
        }
        const hasX = input.x !== undefined;
        const hasY = input.y !== undefined;
        if (hasX !== hasY) {
            return {
                ok: false,
                error: {code: 'invalid', message: 'Asset coordinates x and y must be provided together.'},
            };
        }
        if ((hasX && !Number.isInteger(input.x)) || (hasY && !Number.isInteger(input.y))) {
            return {ok: false, error: {code: 'invalid', message: 'Asset coordinates must be integers.'}};
        }

        const features = this.session.getPlatformFeatures?.();
        let layer: AbstractLayer;
        try {
            const imageLayer = new PaintLayer(features, this.session.createRenderer(), input.asset.colorMode);
            this.applyCreationDefaults(imageLayer);
            imageLayer.name = input.asset.name;
            imageLayer.size = new Point(input.asset.width, input.asset.height);
            input.asset.image.dataset.name ||= input.asset.name;
            input.asset.image.dataset.colorMode ||= input.asset.colorMode;
            input.asset.image.dataset.w ||= String(input.asset.width);
            input.asset.image.dataset.h ||= String(input.asset.height);
            imageLayer.modifiers.icon.setValue!(input.asset.image);
            layer = imageLayer;
        } catch (error) {
            if (input.signal?.aborted) {
                return {ok: false, error: {code: 'stale_context', message: 'The active editor document has changed.'}};
            }
            return {
                ok: false,
                error: {
                    code: 'internal',
                    message: error instanceof Error ? error.message : 'The asset could not be loaded.',
                },
            };
        }

        if (input.signal?.aborted) {
            return {ok: false, error: {code: 'stale_context', message: 'The active editor document has changed.'}};
        }
        if (input.color !== undefined && !features?.hasRGBSupport && !features?.hasIndexedColors) {
            return {
                ok: false,
                error: {
                    code: 'unsupported_for_platform',
                    message: 'The active Lopaka platform does not support asset colors.',
                    field: 'color',
                },
            };
        }
        const colorError = this.applyCreationProperties(
            layer,
            input.color === undefined ? undefined : {color: input.color}
        );
        if (colorError) return {ok: false, error: colorError};

        const width = input.asset.width;
        const height = input.asset.height;
        const x = input.x ?? Math.floor(this.session.state.display.x / 2 - width / 2);
        const y = input.y ?? Math.floor(this.session.state.display.y / 2 - height / 2);
        if (!this.assetPlacementIntersectsDisplay(x, y, width, height)) {
            return {
                ok: false,
                error: {code: 'invalid', message: 'The asset must intersect the visible Canvas.', field: 'x'},
            };
        }

        const positioned = layer as AbstractLayer & {position: Point; size: Point};
        positioned.position = new Point(x, y);
        positioned.size = new Point(width, height);
        layer.updateBounds();
        layer.stopEdit();

        const add = this.session.addLayer ?? this.session.layersManager.add?.bind(this.session.layersManager);
        if (!add) return {ok: false, error: {code: 'internal', message: 'The active editor cannot add layers.'}};
        this.session.layersManager.clearSelection();
        add(layer, true);
        this.session.editor.state.activeLayer = layer;
        this.session.layersManager.selectLayer(layer);
        this.session.virtualScreen.redraw();
        this.session.layersManager.update?.();
        return {ok: true, data: {layer}};
    }

    /**
     * Begin (and optionally complete) the one application-layer creation
     * transaction shared by pointer UI and WebMCP adapters.
     */
    createLayer(input: EditorLayerCreateOptions): EditorActionResult<EditorLayerCreateData> {
        const denied = this.check({readonly: input.readonly});
        if (denied) return {ok: false, error: denied};
        const resolved = this.resolveCreationTool(input.tool);
        if (resolved.error) return {ok: false, error: resolved.error};
        const tool = resolved.tool!;

        let layer: AbstractLayer;
        try {
            layer = tool.createLayer();
        } catch {
            return {ok: false, error: {code: 'internal', message: 'Lopaka could not create that layer type.'}};
        }

        this.applyCreationDefaults(layer);
        const propertyError = this.applyCreationProperties(layer, input.properties);
        if (propertyError) return {ok: false, error: propertyError};

        const prepared = input.prepare?.(layer);
        if (prepared && 'error' in prepared) return {ok: false, error: prepared.error};
        const plan: EditorLayerCreatePlan = prepared && !('error' in prepared) ? prepared : {};
        const origin = plan.origin ?? input.origin;
        const extent = plan.extent ?? input.extent;
        const planPropertyError = this.applyCreationProperties(layer, plan.properties);
        if (planPropertyError) return {ok: false, error: planPropertyError};

        this.session.layersManager.clearSelection();
        const add = this.session.addLayer ?? this.session.layersManager.add?.bind(this.session.layersManager);
        if (!add) return {ok: false, error: {code: 'internal', message: 'The active editor cannot add layers.'}};
        // Creation history is committed only after completion, so an aborted
        // pointer creation cannot leave a phantom add entry behind.
        add(layer, false);

        this.session.editor.state.activeLayer = layer;
        this.session.layersManager.selectLayer(layer);
        if (origin) {
            layer.startEdit(EditMode.CREATING, origin, undefined, input.event);
            if (input.invokeToolCallbacks !== false) tool.onStartEdit?.(layer, origin, input.event as MouseEvent);
            if (extent) layer.edit(extent, input.event);
        }
        plan.apply?.(layer);
        input.apply?.(layer);

        if (input.complete) {
            const completed = this.completeLayerCreation({
                layer,
                tool,
                point: extent ?? origin,
                event: input.event,
                invokeToolCallback: input.invokeToolCallbacks,
            });
            if (!completed.ok) return completed as EditorActionResult<EditorLayerCreateData>;
            return completed;
        }

        this.session.virtualScreen.redraw();
        this.session.layersManager.update?.();
        return {ok: true, data: {layer, tool, completed: false}};
    }

    /** Complete or cancel a layer started by `createLayer`, without another history entry. */
    completeLayerCreation(input: EditorLayerCompleteOptions): EditorActionResult<EditorLayerCreateData> {
        const manager = this.session.layersManager as typeof this.session.layersManager & {
            sorted?: AbstractLayer[];
            getLayer?: (uid: string) => AbstractLayer | undefined;
        };
        const tracked =
            manager.getLayer?.(input.layer.uid) ??
            manager.sorted?.find((candidate) => candidate.uid === input.layer.uid);
        const layer = tracked ?? input.layer;
        if ((manager.getLayer || manager.sorted) && !tracked)
            return {ok: false, error: {code: 'not_found', message: 'The layer is not on the active screen.'}};
        const point = input.point ?? new Point();
        const event = input.event as MouseEvent;
        let keep = true;
        if (input.mode === 'discard') keep = false;
        else if (input.mode === 'cancel') keep = input.tool.cancelCreate?.(layer) ?? false;
        else if (input.mode === 'finalize') keep = input.tool.finalizeCreate?.(layer, point, event) ?? true;
        else if (input.invokeToolCallback !== false) input.tool.onStopEdit?.(layer, point, event);
        layer.stopEdit();

        if (keep) {
            layer.updateBounds?.();
            layer.draw?.();
            this.session.layersManager.selectLayer(layer);
        } else {
            this.session.layersManager.removeLayer?.(layer, false);
        }
        if (keep) {
            const change = {type: 'add' as const, layer, state: layer.state};
            this.session.history.push(change);
            this.session.history.pushRedo(change);
        }
        // The editor state is reactive, so identity may be a proxy around the
        // newly-created layer. This transaction owns the active creation slot.
        this.session.editor.state.activeLayer = null;
        if (input.clearTool ?? input.mode !== 'stop') this.session.editor.state.activeTool = null;
        this.session.virtualScreen.redraw();
        this.session.layersManager.update?.();
        return {ok: true, data: {layer, tool: input.tool, completed: true}};
    }

    /**
     * Apply an existing layer patch through the editor transaction boundary.
     * Validation and normalization happen before the first setter; history,
     * memory side effects, layer-list reactivity and repaint happen here too.
     */
    updateLayer(
        input: {layer: AbstractLayer | string; patch: EditorLayerPatch},
        options: EditorLayerUpdateOptions = {}
    ): EditorActionResult<EditorLayerUpdateData> {
        const denied = this.check(options);
        if (denied) return {ok: false, error: denied};

        const resolved = this.resolve([input.layer]);
        if (resolved.error) return {ok: false, error: resolved.error};
        const layer = resolved.layers![0];
        if (layer.locked) {
            return {ok: false, error: {code: 'locked', message: 'The layer is locked. Unlock it before changing it.'}};
        }
        const normalized = this.normalizeLayerPatch(layer, input.patch);
        if (normalized.error) return {ok: false, error: normalized.error};
        const normalizedPatch = normalized.normalizedPatch!;
        const entries = Object.entries(normalizedPatch);

        const beforeValues = new Map<string, unknown>();
        entries.forEach(([name]) => {
            beforeValues.set(
                name,
                name === 'name' ? layer.name : (layer.modifiers as Record<string, TLayerModifier>)[name]?.getValue()
            );
        });
        const changed = entries.some(([name, value]) => beforeValues.get(name) !== value);

        const historyMode = options.history ?? 'immediate';
        if (historyMode === 'immediate') this.flushCoalescedHistory(layer);
        if (historyMode === 'immediate' || !this.coalescedHistoryTimers.has(layer)) layer.pushHistory();
        entries.forEach(([name, value]) => {
            if (name === 'name') layer.setName(value as string);
            else (layer.modifiers as Record<string, TLayerModifier>)[name]!.setValue!(value);

            const modifier = name === 'name' ? undefined : (layer.modifiers as Record<string, TLayerModifier>)[name];
            if (modifier?.type === TModifierType.font) this.session.editor.lastFontName = value as string;
            if (modifier?.type === TModifierType.color && value !== null) {
                (this.session as Session & {setBrushColor?: (color: string) => void}).setBrushColor?.(value as string);
                (this.session as Session & {setLastColor?: (color: string) => void}).setLastColor?.(value as string);
            }
        });

        // Derived geometry must settle before the redo snapshot is captured.
        // Adapters can use this hook for coordinate-space normalization while
        // the action still owns history, reactivity, and repaint.
        options.afterMutation?.(layer);

        if (historyMode === 'immediate') {
            layer.pushRedoHistory();
        } else {
            const currentTimer = this.coalescedHistoryTimers.get(layer);
            if (currentTimer) clearTimeout(currentTimer.timer);
            const timer = setTimeout(() => {
                this.coalescedHistoryTimers.delete(layer);
                const stillAttached = Boolean(this.session.layersManager.getLayer(layer.uid));
                if (stillAttached) layer.pushRedoHistory();
            }, 500);
            this.coalescedHistoryTimers.set(layer, {timer, epoch: undefined});
        }

        this.session.virtualScreen.redraw();
        this.session.layersManager.update?.();
        this.session.state.immidiateUpdates++;
        return {ok: true, data: {layer, normalizedPatch, changed}};
    }

    select(
        input: {
            mode: LayerSelectionMode;
            layerIds?: readonly (string | AbstractLayer)[];
            rangeStart?: string | AbstractLayer;
            rangeEnd?: string | AbstractLayer;
            group?: string;
        },
        guard?: EditorActionsGuard
    ): EditorActionResult<{selectedLayerIds: string[]}> {
        const denied = this.check(guard);
        if (denied) return {ok: false, error: denied};
        if (!['replace', 'add', 'remove', 'range', 'group', 'clear'].includes(input.mode))
            return {ok: false, error: {code: 'invalid', message: 'An unsupported selection mode was requested.'}};
        const manager = this.session.layersManager;
        const current = new Set(manager.sorted.filter((layer) => layer.selected).map((layer) => layer.uid));
        let next = new Set<string>();
        if (input.mode === 'clear') next = new Set();
        else if (input.mode === 'group') {
            if (!input.group) return {ok: false, error: {code: 'invalid', message: 'A group name is required.'}};
            const members = manager.getLayersInGroup(input.group);
            if (!members.length)
                return {ok: false, error: {code: 'not_found', message: 'The group is not on the active screen.'}};
            next = new Set(members.map((layer) => layer.uid));
        } else if (input.mode === 'range') {
            const resolved = this.resolve([input.rangeStart!, input.rangeEnd!]);
            if (resolved.error) return {ok: false, error: resolved.error};
            const [start, end] = resolved.layers!;
            const min = Math.min(start.index, end.index),
                max = Math.max(start.index, end.index);
            manager.sorted.forEach((layer) => {
                if (layer.index >= min && layer.index <= max) next.add(layer.uid);
            });
        } else {
            const resolved = this.resolve(input.layerIds ?? []);
            if (resolved.error) return {ok: false, error: resolved.error};
            next = new Set(input.mode === 'replace' ? resolved.layers!.map((layer) => layer.uid) : current);
            if (input.mode === 'add') resolved.layers!.forEach((layer) => next.add(layer.uid));
            if (input.mode === 'remove') resolved.layers!.forEach((layer) => next.delete(layer.uid));
        }
        manager.clearSelection();
        next.forEach((uid) => {
            const layer = manager.getLayer(uid);
            if (layer) manager.selectLayer(layer);
        });
        return this.finish({
            selectedLayerIds: manager.sorted.filter((layer) => layer.selected).map((layer) => layer.uid),
        });
    }

    setState(
        input: {layerIds: readonly (string | AbstractLayer)[]; visible?: boolean; locked?: boolean},
        guard?: EditorActionsGuard
    ): EditorActionResult<unknown[]> {
        const denied = this.check(guard);
        if (denied) return {ok: false, error: denied};
        if (input.visible === undefined && input.locked === undefined)
            return {ok: false, error: {code: 'invalid', message: 'A visible or locked state is required.'}};
        const resolved = this.resolve(input.layerIds);
        if (resolved.error) return {ok: false, error: resolved.error};
        const changes: Array<() => void> = [];
        const historyChanges: Array<{type: 'show' | 'hide' | 'lock' | 'unlock'; layer: AbstractLayer; state: unknown}> =
            [];
        resolved.layers!.forEach((layer) => {
            if (input.visible !== undefined && input.visible === layer.hidden) {
                const type = input.visible ? 'show' : 'hide';
                changes.push(() =>
                    input.visible
                        ? this.session.layersManager.showLayer(layer, false)
                        : this.session.layersManager.hideLayer(layer, false)
                );
                historyChanges.push({type, layer, state: layer.state});
            }
            if (input.locked !== undefined && Boolean(layer.locked) !== input.locked) {
                const type = input.locked ? 'lock' : 'unlock';
                changes.push(() =>
                    input.locked
                        ? this.session.layersManager.lockLayer(layer, false)
                        : this.session.layersManager.unlockLayer(layer, false)
                );
                historyChanges.push({type, layer, state: layer.state});
            }
        });
        if (changes.length > 1) this.session.history.batchStart();
        changes.forEach((change) => change());
        historyChanges.forEach((change) => {
            this.session.history.push(change as any);
            this.session.history.pushRedo(change as any);
        });
        if (changes.length > 1) this.session.history.batchEnd();
        return this.finish(
            resolved.layers!.map((layer) => ({uid: layer.uid, visible: !layer.hidden, locked: Boolean(layer.locked)}))
        );
    }

    delete(
        input: readonly (string | AbstractLayer)[],
        guard?: EditorActionsGuard
    ): EditorActionResult<{deletedLayerIds: string[]}> {
        const denied = this.check(guard);
        if (denied) return {ok: false, error: denied};
        if (new Set(input.map((item) => (typeof item === 'string' ? item : item.uid))).size !== input.length)
            return {ok: false, error: {code: 'invalid', message: 'A layer may be listed only once.'}};
        const resolved = this.resolve(input);
        if (resolved.error) return {ok: false, error: resolved.error};
        if (resolved.layers!.some((layer) => layer.locked))
            return {
                ok: false,
                error: {code: 'locked', message: 'The layer is locked. Unlock it before changing or removing it.'},
            };
        if (resolved.layers!.length > 1) this.session.history.batchStart();
        resolved.layers!.forEach((layer) => this.session.layersManager.removeLayer(layer, false));
        resolved.layers!.forEach((layer) => {
            const change = {type: 'remove' as const, layer, state: layer.state};
            this.session.history.push(change);
            this.session.history.pushRedo(change);
        });
        if (resolved.layers!.length > 1) this.session.history.batchEnd();
        this.session.virtualScreen.redraw();
        this.session.layersManager.update?.();
        return {ok: true, data: {deletedLayerIds: resolved.layers!.map((layer) => layer.uid)}};
    }

    reorder(
        entries: LayerReorderEntry[],
        guard?: EditorActionsGuard
    ): EditorActionResult<{layers: ReturnType<typeof snapshot>}> {
        const denied = this.check(guard);
        if (denied) return {ok: false, error: denied};
        const before = snapshot(this.session.layersManager.sorted);
        const ids = entries.flatMap((entry) =>
            entry.type === 'layer' ? [entry.layer.uid] : entry.layers.map((layer) => layer.uid)
        );
        if (new Set(ids).size !== ids.length || ids.length !== this.session.layersManager.sorted.length) {
            return {ok: false, error: {code: 'invalid', message: 'A complete layer order is required.'}};
        }
        const valid = entries.every((entry) =>
            entry.type === 'layer'
                ? Boolean(this.session.layersManager.getLayer(entry.layer.uid))
                : entry.layers.every((layer) => Boolean(this.session.layersManager.getLayer(layer.uid)))
        );
        if (!valid)
            return {ok: false, error: {code: 'not_found', message: 'A supplied layer is not on the active screen.'}};
        this.session.layersManager.reorder(entries);
        const after = snapshot(this.session.layersManager.sorted);
        if (JSON.stringify(before) !== JSON.stringify(after)) {
            const change = {type: 'reorder' as const, state: {before, after}};
            this.session.history.push(change);
            this.session.history.pushRedo(change);
        }
        return this.finish({layers: after});
    }

    group(
        input: readonly (string | AbstractLayer)[],
        name?: string,
        guard?: EditorActionsGuard
    ): EditorActionResult<{layers: ReturnType<typeof snapshot>}> {
        const denied = this.check(guard);
        if (denied) return {ok: false, error: denied};
        const resolved = this.resolve(input);
        if (resolved.error) return {ok: false, error: resolved.error};
        if (resolved.layers!.length < 2)
            return {ok: false, error: {code: 'invalid', message: 'At least two layers are required.'}};
        if (new Set(resolved.layers!.map((layer) => layer.uid)).size !== resolved.layers!.length)
            return {ok: false, error: {code: 'invalid', message: 'A layer may be listed only once.'}};
        const normalizedName = name?.trim();
        const hasControl = normalizedName
            ? [...normalizedName].some((char) => {
                  const code = char.charCodeAt(0);
                  return code <= 0x1f || code === 0x7f;
              })
            : false;
        if (name !== undefined && (!normalizedName || normalizedName.length > 64 || hasControl))
            return {ok: false, error: {code: 'invalid', message: 'A group name is not supported.'}};
        const before = snapshot(resolved.layers!);
        this.session.layersManager.group(resolved.layers!, name?.trim());
        const after = snapshot(resolved.layers!);
        if (JSON.stringify(before) !== JSON.stringify(after)) {
            const change = {type: 'group' as const, state: {before, after}};
            this.session.history.push(change);
            this.session.history.pushRedo(change);
        }
        return this.finish({layers: snapshot(this.session.layersManager.sorted)});
    }

    ungroup(
        input: readonly (string | AbstractLayer)[] | {group: string},
        guard?: EditorActionsGuard
    ): EditorActionResult<{layers: ReturnType<typeof snapshot>}> {
        const denied = this.check(guard);
        if (denied) return {ok: false, error: denied};
        const resolved =
            'group' in input ? {layers: this.session.layersManager.getLayersInGroup(input.group)} : this.resolve(input);
        if (resolved.error) return {ok: false, error: resolved.error};
        if (!resolved.layers!.some((layer) => layer.group))
            return {ok: false, error: {code: 'not_found', message: 'The supplied layers are not grouped.'}};
        const before = snapshot(resolved.layers!);
        this.session.layersManager.ungroup(resolved.layers!);
        const after = snapshot(resolved.layers!);
        if (JSON.stringify(before) !== JSON.stringify(after)) {
            const change = {type: 'group' as const, state: {before, after}};
            this.session.history.push(change);
            this.session.history.pushRedo(change);
        }
        return this.finish({layers: snapshot(this.session.layersManager.sorted)});
    }
}
