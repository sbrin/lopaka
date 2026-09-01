/**
 * Additive layer creation.
 *
 * One tool, `lopaka_create_layer`, adds exactly one layer to the active screen
 * through the editor's own tool objects: the type enum, the platform support
 * test, and the layer instance all come from `editor.getSupportedTools`, so a
 * type the UI cannot draw is a type the agent cannot create. Nothing here keeps
 * a second list of layer types that could drift from the editor.
 *
 * The geometry plan is handed to the session's `EditorActions` creation
 * transaction, which owns insertion, defaults, selection, history and repaint.
 * WebMCP only validates input and supplies adapter-specific coordinates.
 *
 * The whole request is validated before anything is added, so a rejected call
 * leaves the screen exactly as it was.
 */

import {AbstractLayer} from '../layers/abstract.layer';
import type {EditorActionError, EditorActions} from '../editor-actions';
import {Point} from '../point';
import {TWebMcpContextSource, validateWebMcpContextId} from './webmcp-context';
import {WEBMCP_BUSY_RESULT, runExclusiveWebMcpMutation, runExclusiveWebMcpMutationAsync} from './webmcp-mutation-lock';
import {
    TWebMcpError,
    TWebMcpJsonSchema,
    TWebMcpResult,
    TWebMcpTool,
    webMcpResult,
    webMcpFailure,
    webMcpSuccess,
} from './webmcp-envelope';
import {annotateWebMcpTools, createWebMcpTool, WEBMCP_ABORTED_RESULT} from './webmcp-tool';
import {describeWebMcpLayerDetail} from './webmcp-read-model';
import {buildWebMcpStructureToken} from './webmcp-structure-token';
import {applyWebMcpTextTopLeft, isWebMcpTextAnchored} from './webmcp-text-anchor';
import {
    buildWebMcpCreateLayerSchema,
    buildWebMcpLayerValidationSchema,
    creationPropertyPatch,
    WEBMCP_LAYER_CONTRACTS,
} from './webmcp-layer-contract';
import {invalidInputFromZodIssues} from './webmcp-schema';
import {z} from 'zod';
import type {TPlatformFeatures} from '/src/platforms/platform';

// Keep the old import path available to adapters while the contract lives in
// its single shared module.
export {buildWebMcpCreateLayerSchema} from './webmcp-layer-contract';

const MIN_POLYGON_VERTICES = 3;
const TRIANGLE_VERTICES = 3;

/**
 * The editor surface this tool drives. Typed structurally so pure tests can
 * supply a controlled fixture instead of the whole canvas stack.
 */
export type TWebMcpCreationTool = {
    getName(): string;
    isSupported(platform: string): boolean;
    createLayer(): AbstractLayer;
};

export type TWebMcpCreationSession = {
    state: {
        platform: string;
        display: {x: number; y: number};
        brushColor?: string;
        paintColorMode?: 'rgb' | 'monochrome';
        customFonts?: {name: string}[];
    };
    layersManager: {
        sorted: AbstractLayer[];
        clearSelection(): void;
        selectLayer(layer: AbstractLayer): void;
        add?(layer: AbstractLayer, saveHistory?: boolean): void;
        removeLayer?(layer: AbstractLayer): void;
        loadFontsForLayers?(usedFonts: string[]): Promise<unknown>;
    };
    platforms?: Record<string, {getFonts(): {name: string}[]}>;
    editor?: {
        state?: {activeLayer?: unknown; activeTool?: unknown};
        lastColor?: string;
        getSupportedTools(platform: string): Record<string, TWebMcpCreationTool>;
    };
    editorActions: Pick<EditorActions, 'createLayer'>;
    addLayer?(layer: AbstractLayer, saveHistory?: boolean): void;
    getPlatformFeatures?(): Partial<TPlatformFeatures>;
    virtualScreen?: {redraw(force?: boolean): void};
};

function invalidInput(message: string, field: string): TWebMcpError {
    return {code: 'invalid_input', message, details: {field}};
}

function toEditorActionError(error: TWebMcpError): EditorActionError {
    const code =
        error.code === 'invalid_input'
            ? 'invalid'
            : error.code === 'stale_context'
              ? 'stale_context'
              : error.code === 'unsupported_for_platform'
                ? 'unsupported_for_platform'
                : 'internal';
    return {code, message: error.message, field: error.details?.field as string | undefined};
}

function webmcpFailureFromEditorAction(error: EditorActionError, meta: {contextId: string}): TWebMcpError {
    const code =
        error.code === 'invalid'
            ? 'invalid_input'
            : error.code === 'stale_context'
              ? 'stale_context'
              : error.code === 'unsupported_for_platform'
                ? 'unsupported_for_platform'
                : 'internal_error';
    const field = 'field' in error ? error.field : undefined;
    return {code, message: error.message, details: field ? {field, ...meta} : meta};
}

const UNSUPPORTED_TYPE: TWebMcpError = {
    code: 'unsupported_for_platform',
    message: 'The active Lopaka platform does not support that layer type.',
};

function geometryPlanFor(toolName: string) {
    return WEBMCP_LAYER_CONTRACTS[toolName] ?? {geometry: 'bounded' as const, properties: []};
}

/**
 * Image import and animation creation use dedicated editor workflows, so
 * they are filtered out of the creation enum even though the editor supports
 * them.
 */
const EXCLUDED_CREATION_TOOLS: readonly string[] = ['image', 'animation'];

type TCreationPlan = {
    /** Where the created layer starts, in display coordinates. */
    origin: Point;
    /** Applied as a drag after `startEdit`, when the request carries an extent. */
    extent?: Point;
    /** Applied after the layer exists, for shapes the pointer path cannot express. */
    apply?: (layer: AbstractLayer) => void;
};

function numberAt(value: Record<string, unknown>, field: string): number | undefined {
    return typeof value[field] === 'number' ? Math.trunc(value[field] as number) : undefined;
}

function verticesAt(value: Record<string, unknown>): Point[] | undefined {
    const raw = value.vertices as {x: number; y: number}[] | undefined;
    return raw ? raw.map((point) => new Point(point.x, point.y)) : undefined;
}

/** Default placement mirrors the editor tools: the layer's own size, centered. */
function centeredOrigin(layer: AbstractLayer, display: {x: number; y: number}): Point {
    const size = layer.size ?? layer.bounds ?? null;
    const width = size ? (size.x ?? size.w ?? 0) : 0;
    const height = size ? (size.y ?? size.h ?? 0) : 0;
    return new Point((display.x - width) / 2, (display.y - height) / 2).round();
}

function centeredOriginForSize(width: number, height: number, display: {x: number; y: number}): Point {
    return new Point((display.x - width) / 2, (display.y - height) / 2).round();
}

/**
 * Turn a validated request into a placement plan. Returns an error only for
 * geometry the schema cannot express, such as a degenerate polygon.
 */
function planCreation(
    toolName: string,
    value: Record<string, unknown>,
    layer: AbstractLayer,
    display: {x: number; y: number}
): {plan?: TCreationPlan; error?: TWebMcpError} {
    const plan = geometryPlanFor(toolName);

    if (plan.geometry === 'triangle') {
        const x1 = numberAt(value, 'x1');
        const y1 = numberAt(value, 'y1');
        const x2 = numberAt(value, 'x2');
        const y2 = numberAt(value, 'y2');
        const x3 = numberAt(value, 'x3');
        const y3 = numberAt(value, 'y3');
        const coordinates = [x1, y1, x2, y2, x3, y3];
        const vertices = coordinates.every((coordinate) => coordinate !== undefined)
            ? [new Point(x1!, y1!), new Point(x2!, y2!), new Point(x3!, y3!)]
            : verticesAt(value);
        if (
            coordinates.some((coordinate) => coordinate !== undefined) &&
            !coordinates.every((coordinate) => coordinate !== undefined)
        ) {
            return {error: invalidInput('A triangle needs x1, y1, x2, y2, x3, and y3 together.', 'x1')};
        }
        if (!vertices) {
            const origin = centeredOrigin(layer, display);
            return {plan: {origin}};
        }
        if (vertices.length !== TRIANGLE_VERTICES) {
            return {error: invalidInput('A triangle needs exactly three vertices.', 'vertices')};
        }
        return {
            plan: {
                origin: vertices[0].clone().round(),
                apply: (created) => applyVertices(toolName, created, vertices),
            },
        };
    }

    if (plan.geometry === 'vertices') {
        const vertices = verticesAt(value);
        if (!vertices) {
            // Without vertices the shape falls back to its default placement.
            const origin = centeredOrigin(layer, display);
            return {plan: {origin}};
        }
        if (vertices.length < MIN_POLYGON_VERTICES) {
            return {error: invalidInput('A polygon needs at least three vertices.', 'vertices')};
        }
        return {
            plan: {
                origin: vertices[0].clone().round(),
                apply: (created) => applyVertices(toolName, created, vertices),
            },
        };
    }

    if (plan.geometry === 'line') {
        const x1 = numberAt(value, 'x1');
        const y1 = numberAt(value, 'y1');
        const x2 = numberAt(value, 'x2');
        const y2 = numberAt(value, 'y2');
        if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
            const origin = centeredOrigin(layer, display);
            return {plan: {origin}};
        }
        const start = new Point(x1, y1).round();
        const end = new Point(x2, y2).round();
        return {plan: {origin: start, extent: end}};
    }

    if (plan.geometry === 'radial') {
        const x = numberAt(value, 'x');
        const y = numberAt(value, 'y');
        const radius = numberAt(value, 'radius');
        const normalizedRadius =
            radius === undefined
                ? undefined
                : typeof layer.modifiers?.radius?.getValue === 'function'
                  ? Number(layer.modifiers.radius.getValue())
                  : toolName === 'arc'
                    ? Math.max(1, Math.round(radius))
                    : radius;
        if (x === undefined || y === undefined) {
            const size = normalizedRadius === undefined ? layer.size : new Point(normalizedRadius * 2);
            const origin =
                size === undefined ? centeredOrigin(layer, display) : centeredOriginForSize(size.x, size.y, display);
            return {
                plan: {
                    origin,
                    apply:
                        radius === undefined
                            ? undefined
                            : (created) => created.modifiers?.radius?.setValue?.(normalizedRadius),
                },
            };
        }
        const origin = new Point(x, y).round();
        if (radius === undefined) {
            return {plan: {origin}};
        }
        const end = origin.clone().add(normalizedRadius! * 2, normalizedRadius! * 2);
        return {
            plan: {
                origin,
                apply: (created) => created.modifiers?.radius?.setValue?.(normalizedRadius),
            },
        };
    }

    if (plan.geometry === 'point') {
        const x = numberAt(value, 'x');
        const y = numberAt(value, 'y');
        if (isWebMcpTextAnchored(layer)) {
            // The agent's x/y is the top-left corner of the rendered text, so the
            // layer is placed from its own bounds rather than the raw point.
            const requested = x === undefined || y === undefined ? centeredOrigin(layer, display) : new Point(x, y);
            applyWebMcpTextTopLeft(layer, requested.x, requested.y);
            const bounds = layer.bounds;
            const origin = (layer as unknown as {position: Point}).position.clone();
            return {
                plan: {
                    origin,
                    apply: (created) => applyWebMcpTextTopLeft(created, requested.x, requested.y),
                },
            };
        }
        const origin = x === undefined || y === undefined ? centeredOrigin(layer, display) : new Point(x, y).round();
        return {plan: {origin}};
    }

    if (plan.geometry === 'placement') {
        const x = numberAt(value, 'x');
        const y = numberAt(value, 'y');
        const origin = x === undefined || y === undefined ? centeredOrigin(layer, display) : new Point(x, y).round();
        return {plan: {origin}};
    }

    if (plan.geometry === 'widget') {
        const x = numberAt(value, 'x');
        const y = numberAt(value, 'y');
        const width = numberAt(value, 'width');
        const height = numberAt(value, 'height');
        const origin = x === undefined || y === undefined ? centeredOrigin(layer, display) : new Point(x, y).round();
        const size = layer.size ? new Point(layer.size.x, layer.size.y) : new Point();
        const end = origin.clone().add(width ?? size.x, height ?? size.y);
        return {
            plan: {
                origin,
            },
        };
    }

    const x = numberAt(value, 'x');
    const y = numberAt(value, 'y');
    const width = numberAt(value, 'width');
    const height = numberAt(value, 'height');

    // No geometry at all means the editor's own default size and centering.
    if (x === undefined && y === undefined && width === undefined && height === undefined) {
        const origin = centeredOrigin(layer, display);
        const size = layer.size ? new Point(layer.size.x, layer.size.y) : new Point();
        return {plan: {origin}};
    }

    const defaultSize = layer.size ? new Point(layer.size.x, layer.size.y) : new Point();
    const requestedSize = new Point(width ?? defaultSize.x, height ?? defaultSize.y);
    const origin =
        x === undefined && y === undefined
            ? centeredOriginForSize(requestedSize.x, requestedSize.y, display)
            : new Point(x ?? 0, y ?? 0).round();
    if (width === undefined && height === undefined) {
        return {plan: {origin}};
    }

    const end = origin.clone().add(width ?? defaultSize.x, height ?? defaultSize.y);
    return {plan: {origin, extent: end}};
}

/**
 * Vertex shapes are not expressible as a pointer drag, so their points are set
 * directly on the layer and its bounds recalculated, which is what the triangle
 * and polygon tools do once creation finishes.
 */
function applyVertices(toolName: string, layer: AbstractLayer, vertices: Point[]): void {
    const rounded = vertices.map((point) => point.clone().round());
    if (toolName === 'triangle') {
        layer.p1 = rounded[0];
        layer.p2 = rounded[1];
        layer.p3 = rounded[2];
    } else {
        layer.points = rounded.map((point) => point.xy);
    }
    layer.updateBounds();
    layer.draw();
}

function supportedToolsFor(session: TWebMcpCreationSession): Record<string, TWebMcpCreationTool> {
    const supported = session.editor?.getSupportedTools?.(session.state.platform) ?? {};
    return Object.fromEntries(Object.entries(supported).filter(([name]) => !EXCLUDED_CREATION_TOOLS.includes(name)));
}

function hasFont(session: TWebMcpCreationSession, name: string): boolean {
    const platformFonts = session.platforms?.[session.state.platform]?.getFonts() ?? [];
    return [...platformFonts, ...(session.state.customFonts ?? [])].some((font) => font.name === name);
}

export function supportedWebMcpLayerTypes(session: TWebMcpCreationSession): string[] {
    return Object.keys(supportedToolsFor(session)).filter((type) => WEBMCP_LAYER_CONTRACTS[type] !== undefined);
}

/**
 * Build the creation tool. Registration advertises the live supported-tool
 * list, and invocation rechecks it so a stale definition cannot create an
 * unsupported layer after a platform change.
 */
export function buildWebMcpLayerCreationTools({
    session,
    getContextSource,
}: {
    session: TWebMcpCreationSession;
    getContextSource: () => TWebMcpContextSource;
}): TWebMcpTool[] {
    function execute(
        value: Record<string, unknown>,
        execution?: {signal?: AbortSignal}
    ): TWebMcpResult<unknown> | Promise<TWebMcpResult<unknown>> {
        const supportedTools = supportedToolsFor(session);

        // Then the live context, so a stale call is rejected before the request
        // is judged against the current platform.
        const context = validateWebMcpContextId(getContextSource(), value.contextId);
        if (context.error) {
            return webMcpResult(webMcpFailure(context.error));
        }

        const toolName = value.type as string;
        const editorTool = supportedTools[toolName];
        if (!editorTool || !WEBMCP_LAYER_CONTRACTS[toolName] || !editorTool.isSupported(session.state.platform)) {
            return webMcpResult(webMcpFailure(UNSUPPORTED_TYPE, {contextId: context.contextId}));
        }

        const activeSchema = buildWebMcpCreateLayerSchema([toolName], {
            platformId: session.state.platform,
            features: session.getPlatformFeatures?.(),
            paintColorMode: session.state.paintColorMode,
        });
        const parsed = activeSchema.safeParse(value);
        if (!parsed.success) {
            return webMcpResult(
                webMcpFailure(invalidInputFromZodIssues(parsed.error.issues, value), {
                    contextId: context.contextId,
                })
            );
        }
        value = parsed.data;

        const fontName = typeof value.font === 'string' ? value.font : null;
        if (fontName && !hasFont(session, fontName)) {
            return webMcpResult(
                webMcpFailure(invalidInput('That font is not available for the active platform.', 'font'), {
                    contextId: context.contextId,
                })
            );
        }
        if (fontName) {
            return runExclusiveWebMcpMutationAsync(
                async () => {
                    if (execution?.signal?.aborted) return WEBMCP_ABORTED_RESULT;
                    await session.layersManager.loadFontsForLayers?.([fontName]);
                    if (execution?.signal?.aborted) return WEBMCP_ABORTED_RESULT;
                    return createLayer(toolName, value, context.contextId);
                },
                () => WEBMCP_BUSY_RESULT
            );
        }
        return runExclusiveWebMcpMutation(
            () => createLayer(toolName, value, context.contextId),
            () => WEBMCP_BUSY_RESULT
        );
    }

    function createLayer(toolName: string, value: Record<string, unknown>, contextId: string): TWebMcpResult<unknown> {
        const result = session.editorActions.createLayer({
            tool: toolName,
            event: INERT_POINTER_EVENT,
            complete: true,
            invokeToolCallbacks: false,
            properties: creationPropertyPatch(toolName, value),
            prepare: (layer) => {
                const planned = planCreation(toolName, value, layer, session.state.display);
                if (planned.error) return {error: toEditorActionError(planned.error)};
                return {
                    origin: planned.plan.origin,
                    extent: planned.plan.extent,
                    apply: planned.plan.apply,
                };
            },
        });
        if (result.ok === false) {
            return webMcpResult(webMcpFailure(webmcpFailureFromEditorAction(result.error, {contextId}), {contextId}));
        }
        const {layer} = result.data;
        return webMcpResult(
            webMcpSuccess(
                describeWebMcpLayerDetail(layer, {
                    editable: true,
                    platformId: session.state.platform,
                    features: session.getPlatformFeatures?.(),
                    paintColorMode: session.state.paintColorMode,
                }),
                {
                    contextId,
                    structureToken: buildWebMcpStructureToken({
                        screenKey: contextId,
                        layers: session.layersManager.sorted,
                    }),
                }
            )
        );
    }

    const supportedTypes = supportedWebMcpLayerTypes(session);
    const options = {
        platformId: session.state.platform,
        features: session.getPlatformFeatures?.(),
        paintColorMode: session.state.paintColorMode,
    } as const;
    const schema = buildWebMcpLayerValidationSchema();
    const tool = createWebMcpTool({
        name: 'lopaka_create_layer',
        title: 'Create a Lopaka layer',
        description:
            'Add one layer of a platform-supported type to the active Lopaka screen, with optional geometry and properties.',
        // The created layer echoes agent-supplied text back to the agent.
        inputSchema: schema,
        annotations: {readOnlyHint: false, untrustedContentHint: true},
        handler: execute,
    });
    const advertisedSchema = z.toJSONSchema(buildWebMcpCreateLayerSchema(supportedTypes, options), {
        target: 'draft-7',
    }) as TWebMcpJsonSchema;
    const definitions = annotateWebMcpTools(
        [
            {
                ...tool,
                inputSchema: {
                    ...advertisedSchema,
                },
            },
        ],
        {area: 'layer-creation'}
    );
    return definitions;
}
/**
 * Layers read modifier keys off the pointer event during creation, and several
 * dereference it without a guard. The agent path has no real event, so it
 * passes an inert one with every modifier off, which selects the same plain
 * drag behaviour a user gets without holding Shift or Alt.
 */
const INERT_POINTER_EVENT = {
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
} as unknown as MouseEvent;
