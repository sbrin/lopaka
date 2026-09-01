/**
 * Non-destructive layer organization tools.
 *
 * Every tool here mutates the active screen only, through the same domain
 * calls the layers panel uses, so an agent change is an ordinary editor change
 * the user can undo. Selection and stacking logic is reused from the layers
 * panel rather than reimplemented: a second ordering implementation would drift
 * from what the user sees.
 *
 * Each tool validates its whole request before touching anything, so a
 * rejected call leaves the screen exactly as it was.
 */

import {AbstractLayer} from '../layers/abstract.layer';
import {LayerReorderEntry} from '../layers-manager';
import {
    EditorActions,
    buildLayerTree,
    computeReorderEntries,
    findRootIndex,
    type DropTarget,
    type LayerTreeNode,
    type EditorActionError,
} from '../editor-actions';
import {WEBMCP_MAX_IDENTIFIERS_PER_CALL} from './webmcp-capabilities';
import {TWebMcpContextSource, validateWebMcpContextId} from './webmcp-context';
import {WEBMCP_BUSY_RESULT, runExclusiveWebMcpMutation} from './webmcp-mutation-lock';
import {TWebMcpError, TWebMcpResult, TWebMcpTool, webMcpResult, webMcpFailure, webMcpSuccess} from './webmcp-envelope';
import {annotateWebMcpTools, createWebMcpTool} from './webmcp-tool';
import {buildWebMcpStructureToken} from './webmcp-structure-token';
import {z, type ZodType} from 'zod';

/** Layer identifiers are short generated ids; the bound keeps input closed. */
const MAX_LAYER_ID_LENGTH = 128;
const MAX_CONTEXT_ID_LENGTH = 256;
const MAX_STRUCTURE_TOKEN_LENGTH = 128;
/** Group names are user-authored, so they are bounded on the way in. */
const MAX_GROUP_NAME_LENGTH = 64;
/** A whole-screen reorder may list every layer, so it gets a wider bound. */
const MAX_ORDERED_IDENTIFIERS = 500;

export const WEBMCP_SELECT_MODES = ['replace', 'add', 'remove', 'range', 'group', 'clear'] as const;
export type TWebMcpSelectMode = (typeof WEBMCP_SELECT_MODES)[number];

export const WEBMCP_REORDER_POSITIONS = ['before', 'after', 'start', 'end'] as const;

/**
 * The layers-manager surface these tools drive. Typed structurally so the pure
 * tests can supply a controlled fixture instead of the full editor stack.
 */
export type TWebMcpOrganizationLayersManager = {
    sorted: AbstractLayer[];
    getLayer(uid: string): AbstractLayer;
    getLayersInGroup(group: string): AbstractLayer[];
    clearSelection(): void;
    selectLayer(layer: AbstractLayer): void;
    reorder(structure: LayerReorderEntry[]): void;
    group(layers: AbstractLayer[], name?: string): void;
    ungroup(layers: AbstractLayer[]): void;
    showLayer(layer: AbstractLayer, saveHistory?: boolean): void;
    hideLayer(layer: AbstractLayer, saveHistory?: boolean): void;
    lockLayer(layer: AbstractLayer, saveHistory?: boolean): void;
    unlockLayer(layer: AbstractLayer, saveHistory?: boolean): void;
};

export type TWebMcpOrganizationHistory = {
    push(change: unknown): void;
    pushRedo(change: unknown): void;
    batchStart?(): void;
    batchEnd?(): void;
};

export type TWebMcpOrganizationSession = {
    layersManager: TWebMcpOrganizationLayersManager;
    history?: TWebMcpOrganizationHistory;
    virtualScreen?: {redraw(): void};
    editorActions: EditorActions;
};

const contextIdProperty = z.string().min(1).max(MAX_CONTEXT_ID_LENGTH);
const structureTokenProperty = z.string().min(1).max(MAX_STRUCTURE_TOKEN_LENGTH);
const layerIdProperty = z.string().min(1).max(MAX_LAYER_ID_LENGTH);
const groupNameProperty = z.string().min(1).max(MAX_GROUP_NAME_LENGTH);
const SELECT_INPUT_SCHEMA = z.strictObject({
    contextId: contextIdProperty,
    mode: z.enum(WEBMCP_SELECT_MODES),
    layerIds: z.array(layerIdProperty).min(1).max(WEBMCP_MAX_IDENTIFIERS_PER_CALL).optional(),
    group: groupNameProperty.optional(),
    rangeStart: layerIdProperty.optional(),
    rangeEnd: layerIdProperty.optional(),
});
const UPDATE_STATE_INPUT_SCHEMA = z.strictObject({
    contextId: contextIdProperty,
    layerIds: z.array(layerIdProperty).min(1).max(WEBMCP_MAX_IDENTIFIERS_PER_CALL),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),
});
const REORDER_INPUT_SCHEMA = z.strictObject({
    contextId: contextIdProperty,
    structureToken: structureTokenProperty,
    order: z.array(layerIdProperty).min(1).max(MAX_ORDERED_IDENTIFIERS).optional(),
    layerId: layerIdProperty.optional(),
    position: z.enum(WEBMCP_REORDER_POSITIONS).optional(),
    referenceLayerId: layerIdProperty.optional(),
    group: groupNameProperty.optional(),
});
const GROUP_INPUT_SCHEMA = z.strictObject({
    contextId: contextIdProperty,
    structureToken: structureTokenProperty,
    layerIds: z.array(layerIdProperty).min(2).max(WEBMCP_MAX_IDENTIFIERS_PER_CALL),
    name: groupNameProperty,
});
const UNGROUP_INPUT_SCHEMA = z.strictObject({
    contextId: contextIdProperty,
    structureToken: structureTokenProperty,
    layerIds: z.array(layerIdProperty).min(1).max(WEBMCP_MAX_IDENTIFIERS_PER_CALL).optional(),
    group: groupNameProperty.optional(),
});

function invalidInput(message: string, field: string): TWebMcpError {
    return {code: 'invalid_input', message, details: {field}};
}

function mapActionError(error: EditorActionError): TWebMcpError {
    if (error.code === 'not_found') return NOT_FOUND;
    if (error.code === 'stale_layer_state') return STALE_STRUCTURE;
    return {code: 'invalid_input', message: error.message};
}

const NOT_FOUND: TWebMcpError = {
    code: 'not_found',
    message: 'A supplied identifier is not on the active screen.',
};

const STALE_STRUCTURE: TWebMcpError = {
    code: 'stale_layer_state',
    message: 'The layer structure has changed since that token was issued. Read the layers again and retry.',
};

/**
 * Group names come from the user and can carry instructions, so they are
 * length-bounded, trimmed, and stripped of control characters before use. They
 * are never echoed into an error message.
 */
function normalizeGroupName(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed.length || trimmed.length > MAX_GROUP_NAME_LENGTH) {
        return null;
    }
    // eslint-disable-next-line no-control-regex
    return /[\u0000-\u001f\u007f]/.test(trimmed) ? null : trimmed;
}

/** Resolve identifiers to layers, or report the first unknown one. */
function resolveLayers(
    layersManager: TWebMcpOrganizationLayersManager,
    layerIds: string[]
): {layers?: AbstractLayer[]; error?: TWebMcpError} {
    const layers: AbstractLayer[] = [];
    for (const uid of layerIds) {
        const layer = layersManager.getLayer(uid);
        if (!layer) {
            return {error: NOT_FOUND};
        }
        layers.push(layer);
    }
    return {layers};
}

function selectedIdsInStackingOrder(layersManager: TWebMcpOrganizationLayersManager): string[] {
    return layersManager.sorted.filter((layer) => layer.selected).map((layer) => layer.uid);
}

function describeStructure(layersManager: TWebMcpOrganizationLayersManager) {
    return layersManager.sorted.map((layer) => ({
        layerId: layer.uid,
        index: layer.index,
        group: layer.group ?? null,
    }));
}

function structureTokenFor(session: TWebMcpOrganizationSession, contextId: string): string {
    return buildWebMcpStructureToken({screenKey: contextId, layers: session.layersManager.sorted});
}

/**
 * Display order, top layer first. The layers panel builds its tree from the
 * reversed stack and `reorder` reassigns indexes from the same direction, so
 * both must agree here.
 */
function buildDisplayTree(layers: AbstractLayer[]): LayerTreeNode[] {
    return buildLayerTree(layers.slice().reverse()).nodes;
}

/** Membership snapshot in the shape `LayersManager` restores on undo. */
/**
 * Shared precondition chain. Schema first so unknown properties fail the same
 * way on every tool, then the live context, then the structure token when the
 * call replaces structure.
 */
function prepare(
    input: Record<string, unknown>,
    session: TWebMcpOrganizationSession,
    getContextSource: () => TWebMcpContextSource,
    requireStructureToken: boolean
): {value?: Record<string, unknown>; contextId?: string; failure?: TWebMcpResult<unknown>} {
    const context = validateWebMcpContextId(getContextSource(), input.contextId);
    if (context.error) {
        return {failure: webMcpResult(webMcpFailure(context.error))};
    }

    if (requireStructureToken && input.structureToken !== structureTokenFor(session, context.contextId)) {
        return {failure: webMcpResult(webMcpFailure(STALE_STRUCTURE, {contextId: context.contextId}))};
    }

    return {value: input, contextId: context.contextId};
}

/** Reject fields that do not belong to the requested selection mode. */
function validateSelectShape(value: Record<string, unknown>): TWebMcpError | null {
    const mode = value.mode as TWebMcpSelectMode;
    const allowed: Record<TWebMcpSelectMode, string[]> = {
        replace: ['layerIds'],
        add: ['layerIds'],
        remove: ['layerIds'],
        range: ['rangeStart', 'rangeEnd'],
        group: ['group'],
        clear: [],
    };

    for (const field of allowed[mode]) {
        if (value[field] === undefined) {
            return invalidInput('Required input property is missing for this mode.', field);
        }
    }
    for (const field of ['layerIds', 'rangeStart', 'rangeEnd', 'group']) {
        if (value[field] !== undefined && !allowed[mode].includes(field)) {
            return invalidInput('Input property does not apply to this mode.', field);
        }
    }
    return null;
}

function executeSelect(
    session: TWebMcpOrganizationSession,
    value: Record<string, unknown>,
    contextId: string
): TWebMcpResult<unknown> {
    const {layersManager} = session;
    const shapeError = validateSelectShape(value);
    if (shapeError) {
        return webMcpResult(webMcpFailure(shapeError, {contextId}));
    }

    const mode = value.mode as TWebMcpSelectMode;
    const sorted = layersManager.sorted.slice();
    let actionInput: Parameters<EditorActions['select']>[0];
    if (mode === 'group') {
        const name = normalizeGroupName(value.group);
        if (!name) {
            return webMcpResult(webMcpFailure(invalidInput('Group name is not supported.', 'group'), {contextId}));
        }
        actionInput = {mode, group: name};
    } else if (mode === 'range') {
        actionInput = {mode, rangeStart: value.rangeStart as string, rangeEnd: value.rangeEnd as string};
    } else {
        actionInput = {mode, layerIds: value.layerIds as string[]};
    }

    const actions = session.editorActions;
    const action = actions.select(actionInput);
    if (action.ok === false) return webMcpResult(webMcpFailure(mapActionError(action.error), {contextId}));

    return webMcpResult(webMcpSuccess({selectedLayerIds: selectedIdsInStackingOrder(layersManager)}, {contextId}));
}

function executeUpdateState(
    session: TWebMcpOrganizationSession,
    value: Record<string, unknown>,
    contextId: string
): TWebMcpResult<unknown> {
    const {layersManager} = session;
    const visible = value.visible as boolean | undefined;
    const locked = value.locked as boolean | undefined;

    if (visible === undefined && locked === undefined) {
        return webMcpResult(
            webMcpFailure(invalidInput('A desired visible or locked state is required.', 'visible'), {contextId})
        );
    }

    // Only layers that are not already in the desired state are touched, so a
    // no-op request does not pile up empty history entries.
    const action = session.editorActions.setState({layerIds: value.layerIds as string[], visible, locked}, undefined);
    if (action.ok === false) return webMcpResult(webMcpFailure(mapActionError(action.error), {contextId}));

    return webMcpResult(
        webMcpSuccess(
            {
                layers: (value.layerIds as string[]).map((uid) => {
                    const layer = layersManager.getLayer(uid);
                    return {
                        layerId: uid,
                        visible: !layer.hidden,
                        locked: Boolean(layer.locked),
                    };
                }),
            },
            {contextId}
        )
    );
}

/** Build the reorder entries for a complete stacking order supplied by the agent. */
function entriesForExplicitOrder(
    layersManager: TWebMcpOrganizationLayersManager,
    order: string[]
): {entries?: LayerReorderEntry[]; error?: TWebMcpError} {
    const resolved = resolveLayers(layersManager, order);
    if (resolved.error) {
        return {error: resolved.error};
    }
    const unique = new Set(order);
    if (unique.size !== order.length || order.length !== layersManager.sorted.length) {
        return {
            error: invalidInput('A complete stacking order must list every layer exactly once.', 'order'),
        };
    }
    // Group membership is preserved; only the stacking sequence changes.
    return {
        entries: buildDisplayTree(resolved.layers).map((node) =>
            node.type === 'group'
                ? {type: 'group', group: node.group, layers: node.layers}
                : {type: 'layer', layer: node.layer}
        ),
    };
}

/**
 * Translate a single move into the drop target the layers panel would produce.
 *
 * The agent works in the reported stacking order, bottom layer first, while the
 * panel tree is built top-first. Every relative position is therefore mirrored
 * on the way in.
 */
function dropTargetForMove(
    nodes: LayerTreeNode[],
    value: Record<string, unknown>,
    groupName: string | null
): {target?: DropTarget; error?: TWebMcpError} {
    const position = value.position as 'before' | 'after' | 'start' | 'end' | undefined;
    const referenceLayerId = value.referenceLayerId as string | undefined;

    if (!position) {
        return {error: invalidInput('A position is required for a layer move.', 'position')};
    }
    if ((position === 'before' || position === 'after') && !referenceLayerId) {
        return {error: invalidInput('A reference layer is required for this position.', 'referenceLayerId')};
    }
    if (referenceLayerId && position !== 'before' && position !== 'after') {
        return {error: invalidInput('A reference layer applies only before or after a layer.', 'position')};
    }
    if (referenceLayerId && referenceLayerId === value.layerId) {
        return {error: invalidInput('A layer cannot be moved relative to itself.', 'referenceLayerId')};
    }

    // Reported order is bottom-first; the panel tree is top-first.
    const mirrored = position === 'before' ? 'after' : position === 'after' ? 'before' : position;
    const mirroredEdge = position === 'start' ? 'end' : 'start';

    if (!groupName) {
        if (position === 'start' || position === 'end') {
            return {
                error: invalidInput('A root position must be before or after a reference layer.', 'position'),
            };
        }
        return {
            target: {
                container: 'root',
                position: mirrored as 'before' | 'after',
                referenceType: 'layer',
                referenceId: referenceLayerId,
                rootIndex: findRootIndex(nodes, 'layer', referenceLayerId),
            },
        };
    }

    const rootIndex = findRootIndex(nodes, 'group', groupName);
    if (rootIndex === -1) {
        return {error: NOT_FOUND};
    }
    if (position === 'start' || position === 'end') {
        return {target: {container: 'group', group: groupName, position: mirroredEdge, rootIndex}};
    }
    return {
        target: {
            container: 'group',
            group: groupName,
            position: mirrored as 'before' | 'after',
            referenceLayerId,
            rootIndex,
        },
    };
}

function executeReorder(
    session: TWebMcpOrganizationSession,
    value: Record<string, unknown>,
    contextId: string
): TWebMcpResult<unknown> {
    const {layersManager} = session;
    const hasOrder = value.order !== undefined;
    const hasMove = value.layerId !== undefined;

    if (hasOrder === hasMove) {
        return webMcpResult(
            webMcpFailure(invalidInput('Supply either a complete stacking order or one layer move.', 'order'), {
                contextId,
            })
        );
    }
    if (
        hasOrder &&
        (value.position !== undefined || value.referenceLayerId !== undefined || value.group !== undefined)
    ) {
        return webMcpResult(
            webMcpFailure(invalidInput('Move properties do not apply to a complete order.', 'position'), {contextId})
        );
    }

    let entries: LayerReorderEntry[];

    if (hasOrder) {
        const built = entriesForExplicitOrder(layersManager, value.order as string[]);
        if (built.error) {
            return webMcpResult(webMcpFailure(built.error, {contextId}));
        }
        entries = built.entries;
    } else {
        const layer = layersManager.getLayer(value.layerId as string);
        if (!layer) {
            return webMcpResult(webMcpFailure(NOT_FOUND, {contextId}));
        }
        let groupName: string | null = null;
        if (value.group !== undefined) {
            groupName = normalizeGroupName(value.group);
            if (!groupName) {
                return webMcpResult(webMcpFailure(invalidInput('Group name is not supported.', 'group'), {contextId}));
            }
        }
        const nodes = buildDisplayTree(layersManager.sorted);
        const target = dropTargetForMove(nodes, value, groupName);
        if (target.error) {
            return webMcpResult(webMcpFailure(target.error, {contextId}));
        }
        if (value.referenceLayerId !== undefined && !layersManager.getLayer(value.referenceLayerId as string)) {
            return webMcpResult(webMcpFailure(NOT_FOUND, {contextId}));
        }
        // Same computation the panel runs for a completed drag.
        const computed = computeReorderEntries(nodes, layer, target.target);
        if (!computed) {
            return webMcpResult(
                webMcpFailure({code: 'internal_error', message: 'The layer move could not be resolved.'}, {contextId})
            );
        }
        entries = computed;
    }

    const action = session.editorActions.reorder(entries);
    if (action.ok === false) return webMcpResult(webMcpFailure(mapActionError(action.error), {contextId}));

    return webMcpResult(
        webMcpSuccess(
            {layers: describeStructure(layersManager)},
            {
                contextId,
                structureToken: structureTokenFor(session, contextId),
            }
        )
    );
}

function executeGroup(
    session: TWebMcpOrganizationSession,
    value: Record<string, unknown>,
    contextId: string
): TWebMcpResult<unknown> {
    const {layersManager} = session;
    const name = normalizeGroupName(value.name);
    if (!name) {
        return webMcpResult(webMcpFailure(invalidInput('Group name is not supported.', 'name'), {contextId}));
    }

    const layerIds = value.layerIds as string[];
    if (new Set(layerIds).size !== layerIds.length) {
        return webMcpResult(webMcpFailure(invalidInput('A layer may be listed only once.', 'layerIds'), {contextId}));
    }

    const action = session.editorActions.group(layerIds, name);
    if (action.ok === false) return webMcpResult(webMcpFailure(mapActionError(action.error), {contextId}));

    return webMcpResult(
        webMcpSuccess(
            {layers: describeStructure(layersManager)},
            {
                contextId,
                structureToken: structureTokenFor(session, contextId),
            }
        )
    );
}

function executeUngroup(
    session: TWebMcpOrganizationSession,
    value: Record<string, unknown>,
    contextId: string
): TWebMcpResult<unknown> {
    const {layersManager} = session;
    const hasLayerIds = value.layerIds !== undefined;
    const hasGroup = value.group !== undefined;

    if (hasLayerIds === hasGroup) {
        return webMcpResult(
            webMcpFailure(invalidInput('Supply either layer identifiers or one group name.', 'layerIds'), {contextId})
        );
    }

    let actionInput: readonly (string | AbstractLayer)[] | {group: string};
    if (hasGroup) {
        const name = normalizeGroupName(value.group);
        if (!name) {
            return webMcpResult(webMcpFailure(invalidInput('Group name is not supported.', 'group'), {contextId}));
        }
        actionInput = {group: name};
    } else {
        actionInput = value.layerIds as string[];
    }

    const action = session.editorActions.ungroup(actionInput);
    if (action.ok === false) return webMcpResult(webMcpFailure(mapActionError(action.error), {contextId}));

    return webMcpResult(
        webMcpSuccess(
            {layers: describeStructure(layersManager)},
            {
                contextId,
                structureToken: structureTokenFor(session, contextId),
            }
        )
    );
}

/**
 * Build the five organization tools. Registration filtering happens in the tool
 * catalog, so this list is the same on every editable context.
 */
export function buildWebMcpLayerOrganizationTools({
    session,
    getContextSource,
}: {
    session: TWebMcpOrganizationSession;
    getContextSource: () => TWebMcpContextSource;
}): TWebMcpTool[] {
    const mutating = {readOnlyHint: false} as const;
    // Group names travel back in the result, and they are user-authored.
    const mutatingUntrusted = {readOnlyHint: false, untrustedContentHint: true} as const;

    function tool(
        name: string,
        title: string,
        description: string,
        inputSchema: ZodType<Record<string, unknown>>,
        annotations: TWebMcpTool['annotations'],
        requireStructureToken: boolean,
        execute: (value: Record<string, unknown>, contextId: string) => TWebMcpResult<unknown>
    ): TWebMcpTool {
        return createWebMcpTool({
            name,
            title,
            description,
            inputSchema,
            annotations,
            handler(input) {
                const prepared = prepare(input, session, getContextSource, requireStructureToken);
                if (prepared.failure) {
                    return prepared.failure;
                }
                return runExclusiveWebMcpMutation(
                    () => execute(prepared.value, prepared.contextId),
                    () => WEBMCP_BUSY_RESULT
                );
            },
        });
    }

    const definitions = annotateWebMcpTools(
        [
            tool(
                'lopaka_select_layers',
                'Select Lopaka layers',
                'Set the selected layers of the active Lopaka screen by identifier, stacking range, or group.',
                SELECT_INPUT_SCHEMA,
                mutating,
                false,
                (value, contextId) => executeSelect(session, value, contextId)
            ),
            tool(
                'lopaka_update_layer_state',
                'Set Lopaka layer state',
                'Set the visible and locked state of layers on the active Lopaka screen to an explicit value.',
                UPDATE_STATE_INPUT_SCHEMA,
                mutating,
                false,
                (value, contextId) => executeUpdateState(session, value, contextId)
            ),
            tool(
                'lopaka_reorder_layers',
                'Reorder Lopaka layers',
                'Move one layer or set the complete stacking order of the active Lopaka screen.',
                REORDER_INPUT_SCHEMA,
                mutatingUntrusted,
                true,
                (value, contextId) => executeReorder(session, value, contextId)
            ),
            tool(
                'lopaka_group_layers',
                'Group Lopaka layers',
                'Place layers of the active Lopaka screen into one named group.',
                GROUP_INPUT_SCHEMA,
                mutatingUntrusted,
                true,
                (value, contextId) => executeGroup(session, value, contextId)
            ),
            tool(
                'lopaka_ungroup_layers',
                'Ungroup Lopaka layers',
                'Remove layers of the active Lopaka screen from their group, keeping their stacking positions.',
                UNGROUP_INPUT_SCHEMA,
                mutatingUntrusted,
                true,
                (value, contextId) => executeUngroup(session, value, contextId)
            ),
        ],
        {area: 'layer-organization'}
    );
    return definitions;
}
