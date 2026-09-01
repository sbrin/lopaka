/**
 * Editing and removing layers that already exist on the active screen.
 *
 * `lopaka_update_layer` delegates the complete property transaction to the
 * session-owned EditorActions. The Inspector uses that same path, so modifier
 * validation, normalization, history, memory updates and repaint cannot drift.
 *
 * `lopaka_delete_layers` funnels through `LayersManager.removeLayers`, the same
 * call the layers panel and the Delete key use, which batches a multi-layer
 * removal into one history entry.
 *
 * Both tools validate the whole request before touching anything, so a rejected
 * call leaves the screen exactly as it was.
 */

import {AbstractLayer} from '../layers/abstract.layer';
import {TWebMcpContextSource, validateWebMcpContextId} from './webmcp-context';
import {WEBMCP_MAX_IDENTIFIERS_PER_CALL} from './webmcp-capabilities';
import {WEBMCP_BUSY_RESULT, runExclusiveWebMcpMutation, runExclusiveWebMcpMutationAsync} from './webmcp-mutation-lock';
import {TWebMcpError, TWebMcpResult, TWebMcpTool, webMcpResult, webMcpFailure, webMcpSuccess} from './webmcp-envelope';
import {annotateWebMcpTools, createWebMcpTool, WEBMCP_ABORTED_RESULT} from './webmcp-tool';
import {describeWebMcpLayerDetail} from './webmcp-read-model';
import {buildWebMcpStructureToken} from './webmcp-structure-token';
import {EditorActions, type EditorActionError} from '../editor-actions';
import {applyWebMcpTextTopLeft, isWebMcpTextAnchored} from './webmcp-text-anchor';
import {z} from 'zod';

const MAX_LAYER_ID_LENGTH = 128;
const MAX_CONTEXT_ID_LENGTH = 256;
const MAX_STRUCTURE_TOKEN_LENGTH = 128;
/** Agent-authored layer text and names are bounded on the way in. */
const MAX_TEXT_LENGTH = 1024;
const MAX_NAME_LENGTH = 128;
const MAX_COLOR_LENGTH = 32;
const MAX_FONT_NAME_LENGTH = 64;
/** Geometry may sit off-screen while being composed, but not unboundedly so. */
const COORDINATE_LIMIT = 10000;

export type TWebMcpEditingLayersManager = {
    sorted: AbstractLayer[];
    getLayer(uid: string): AbstractLayer;
    removeLayers(layers: AbstractLayer[], saveHistory?: boolean): void;
    update?(): void;
    /** Loads the platform and custom fonts a layer needs before it renders. */
    loadFontsForLayers?(usedFonts: string[]): Promise<unknown>;
};

export type TWebMcpEditingSession = {
    state: {
        platform: string;
        customFonts?: {name: string}[];
        paintColorMode?: 'rgb' | 'monochrome';
    };
    platforms?: Record<string, {getFonts(): {name: string}[]}>;
    getPlatformFeatures?(): import('/src/platforms/platform').TPlatformFeatures;
    layersManager: TWebMcpEditingLayersManager;
    virtualScreen?: {redraw(force?: boolean): void};
    editorActions: EditorActions;
};

function invalidInput(message: string, field: string): TWebMcpError {
    return {code: 'invalid_input', message, details: {field}};
}

const NOT_FOUND: TWebMcpError = {
    code: 'not_found',
    message: 'No layer with that identifier is on the active screen.',
};

const STALE_STRUCTURE: TWebMcpError = {
    code: 'stale_layer_state',
    message: 'The layer structure has changed since that token was issued. Read the layers again and retry.',
};

const LOCKED: TWebMcpError = {
    code: 'invalid_input',
    message: 'The layer is locked. Unlock it before changing or removing it.',
    details: {field: 'layerId'},
};

/**
 * Every property an agent may set, keyed by the modifier name the editor uses.
 *
 * A modifier name carries the same value type on every layer type that exposes
 * it, so one closed schema describes them all. Which names a given layer
 * actually accepts is decided per request from that layer's own modifiers, so
 * this list cannot grant a property the editor does not expose.
 */
const number = z.number().finite().min(-COORDINATE_LIMIT).max(COORDINATE_LIMIT);
const nonNegative = z.number().finite().min(0).max(COORDINATE_LIMIT);
const EDITABLE_PROPERTIES = {
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    w: nonNegative,
    h: nonNegative,
    width: nonNegative,
    radius: nonNegative,
    rx: nonNegative,
    ry: nonNegative,
    borderWidth: nonNegative,
    rotation: number,
    startAngle: number,
    endAngle: number,
    value: number,
    fontSize: z.number().finite().min(1).max(COORDINATE_LIMIT),
    fill: z.boolean(),
    inverted: z.boolean(),
    checked: z.boolean(),
    smooth: z.boolean(),
    overlay: z.boolean(),
    alphaChannel: z.boolean(),
    text: z.string().max(MAX_TEXT_LENGTH),
    font: z.string().min(1).max(MAX_FONT_NAME_LENGTH),
    color: z.string().min(1).max(MAX_COLOR_LENGTH).nullable(),
    backgroundColor: z.string().min(1).max(MAX_COLOR_LENGTH).nullable(),
    borderColor: z.string().min(1).max(MAX_COLOR_LENGTH).nullable(),
} as const;

/** The layer's own name, which is not a modifier but is edited the same way. */
const NAME_PROPERTY = 'name';

export const WEBMCP_EDITABLE_PROPERTY_NAMES: readonly string[] = [...Object.keys(EDITABLE_PROPERTIES), NAME_PROPERTY];

const UPDATE_INPUT_SCHEMA = z.strictObject({
    contextId: z.string().min(1).max(MAX_CONTEXT_ID_LENGTH),
    layerId: z.string().min(1).max(MAX_LAYER_ID_LENGTH),
    [NAME_PROPERTY]: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
    ...Object.fromEntries(Object.entries(EDITABLE_PROPERTIES).map(([key, schema]) => [key, schema.optional()])),
});

const DELETE_INPUT_SCHEMA = z.strictObject({
    contextId: z.string().min(1).max(MAX_CONTEXT_ID_LENGTH),
    structureToken: z.string().min(1).max(MAX_STRUCTURE_TOKEN_LENGTH),
    layerIds: z.array(z.string().min(1).max(MAX_LAYER_ID_LENGTH)).min(1).max(WEBMCP_MAX_IDENTIFIERS_PER_CALL),
});

function structureTokenFor(session: TWebMcpEditingSession, contextId: string): string {
    return buildWebMcpStructureToken({screenKey: contextId, layers: session.layersManager.sorted});
}

function updateFailure(error: EditorActionError): TWebMcpError {
    if (error.code === 'not_found') return NOT_FOUND;
    if (error.code === 'locked') return LOCKED;
    if (error.code === 'stale_context') {
        return {code: 'stale_context', message: 'The active editor document has changed.'};
    }
    if (error.code === 'unsupported_for_platform') {
        return {
            code: 'unsupported_for_platform',
            message: error.message,
            details: error.field ? {field: error.field} : undefined,
        };
    }
    return invalidInput(error.message, ('field' in error ? error.field : undefined) ?? 'properties');
}

function executeDelete(
    session: TWebMcpEditingSession,
    value: z.infer<typeof DELETE_INPUT_SCHEMA>,
    contextId: string
): TWebMcpResult<unknown> {
    const {layersManager} = session;
    const layerIds = value.layerIds;

    if (new Set(layerIds).size !== layerIds.length) {
        return webMcpResult(webMcpFailure(invalidInput('A layer may be listed only once.', 'layerIds'), {contextId}));
    }

    const action = session.editorActions.delete(layerIds);
    if (action.ok === false) {
        if (action.error.code === 'locked') return webMcpResult(webMcpFailure(LOCKED, {contextId}));
        return webMcpResult(
            webMcpFailure(
                {
                    code: action.error.code === 'not_found' ? 'not_found' : 'invalid_input',
                    message: action.error.message,
                },
                {contextId}
            )
        );
    }

    return webMcpResult(
        webMcpSuccess(
            {
                deletedLayerIds: layerIds,
                remainingLayerIds: layersManager.sorted.map((layer) => layer.uid),
            },
            {contextId, structureToken: structureTokenFor(session, contextId)}
        )
    );
}

/**
 * Shared precondition chain, matching the organization tools: schema first so
 * unknown properties fail the same way everywhere, then the live context, then
 * the structure token when the call changes structure.
 */
function prepare<TInput extends Record<string, unknown>>(
    input: TInput,
    session: TWebMcpEditingSession,
    getContextSource: () => TWebMcpContextSource,
    requireStructureToken: boolean
): {value?: TInput; contextId?: string; failure?: TWebMcpResult<unknown>} {
    const context = validateWebMcpContextId(getContextSource(), input.contextId);
    if (context.error) {
        return {failure: webMcpResult(webMcpFailure(context.error))};
    }

    if (requireStructureToken && input.structureToken !== structureTokenFor(session, context.contextId)) {
        return {failure: webMcpResult(webMcpFailure(STALE_STRUCTURE, {contextId: context.contextId}))};
    }

    return {value: input, contextId: context.contextId};
}

export function buildWebMcpLayerEditingTools({
    session,
    getContextSource,
}: {
    session: TWebMcpEditingSession;
    getContextSource: () => TWebMcpContextSource;
}): TWebMcpTool[] {
    const definitions = annotateWebMcpTools(
        [
            createWebMcpTool({
                name: 'lopaka_update_layer',
                title: 'Update Lopaka layer',
                description:
                    'Change one or more properties reported by lopaka_get_layer using top-level fields for one layer on the active Lopaka screen. The update fields are dynamic by layerId; read the layer first for the exact supported set.',
                inputSchema: UPDATE_INPUT_SCHEMA,
                annotations: {readOnlyHint: false, untrustedContentHint: true},
                async handler(input: z.infer<typeof UPDATE_INPUT_SCHEMA>, execution): Promise<TWebMcpResult<unknown>> {
                    const prepared = prepare(input, session, getContextSource, false);
                    if (prepared.failure) {
                        return prepared.failure;
                    }
                    const value = prepared.value!;
                    const patch = Object.fromEntries(
                        Object.entries(value).filter(([field]) => field !== 'contextId' && field !== 'layerId')
                    );
                    // Text x/y are top-left coordinates, and the offset depends on
                    // the font, size and rotation the same call may be changing. The
                    // shared action finalizes that coordinate transform after all
                    // setters have landed, still inside the same undo step.
                    const target = session.layersManager.getLayer(value.layerId);
                    const anchorText = target ? isWebMcpTextAnchored(target) : false;
                    const anchorX = anchorText && typeof patch.x === 'number' ? (patch.x as number) : undefined;
                    const anchorY = anchorText && typeof patch.y === 'number' ? (patch.y as number) : undefined;
                    const apply = () => {
                        const action = session.editorActions.updateLayer(
                            {layer: value.layerId, patch},
                            {
                                history: 'immediate',
                                afterMutation:
                                    anchorX !== undefined || anchorY !== undefined
                                        ? (layer) => applyWebMcpTextTopLeft(layer, anchorX, anchorY)
                                        : undefined,
                            }
                        );
                        if (action.ok === false) {
                            return webMcpResult(
                                webMcpFailure(updateFailure(action.error), {contextId: prepared.contextId})
                            );
                        }
                        return webMcpResult(
                            webMcpSuccess(
                                describeWebMcpLayerDetail(action.data.layer, {
                                    editable: true,
                                    platformId: session.state.platform,
                                    features: session.getPlatformFeatures?.(),
                                    paintColorMode: session.state.paintColorMode,
                                }),
                                {contextId: prepared.contextId}
                            )
                        );
                    };

                    // The font file has to be in memory before the shared setter runs.
                    const fontName = typeof patch.font === 'string' ? patch.font : undefined;
                    if (fontName) {
                        return runExclusiveWebMcpMutationAsync(
                            async () => {
                                if (execution.signal?.aborted) return WEBMCP_ABORTED_RESULT;
                                await session.layersManager.loadFontsForLayers?.([fontName]);
                                if (execution.signal?.aborted) return WEBMCP_ABORTED_RESULT;
                                return apply();
                            },
                            () => WEBMCP_BUSY_RESULT
                        );
                    }

                    return runExclusiveWebMcpMutation(apply, () => WEBMCP_BUSY_RESULT);
                },
            }),
            createWebMcpTool({
                name: 'lopaka_delete_layers',
                title: 'Delete Lopaka layers',
                description: 'Remove layers from the active Lopaka screen as one undoable change.',
                inputSchema: DELETE_INPUT_SCHEMA,
                annotations: {readOnlyHint: false},
                handler(input: z.infer<typeof DELETE_INPUT_SCHEMA>): TWebMcpResult<unknown> {
                    const prepared = prepare(input, session, getContextSource, true);
                    if (prepared.failure) {
                        return prepared.failure;
                    }
                    return runExclusiveWebMcpMutation(
                        () => executeDelete(session, prepared.value!, prepared.contextId!),
                        () => WEBMCP_BUSY_RESULT
                    );
                },
            }),
        ],
        {area: 'layer-editing'}
    );
    return definitions;
}
