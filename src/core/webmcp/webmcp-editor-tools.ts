import {TWebMcpContextSource, buildWebMcpContextId} from './webmcp-context';
import {
    describeWebMcpGeneratedCode,
    describeWebMcpLayerDetail,
    describeWebMcpLayers,
    describeWebMcpScreenSummary,
    findWebMcpLayer,
} from './webmcp-read-model';
import {buildWebMcpStructureToken} from './webmcp-structure-token';
import {buildWebMcpLayerOrganizationTools} from './webmcp-layer-organization';
import {buildWebMcpLayerCreationTools} from './webmcp-layer-creation';
import {buildWebMcpLayerEditingTools} from './webmcp-layer-editing';
import {TWebMcpTool, webMcpFailure, webMcpSuccess} from './webmcp-envelope';
import {annotateWebMcpTools, createWebMcpTool} from './webmcp-tool';
import {EMPTY_WEBMCP_INPUT_SCHEMA} from './webmcp-schema';
import {z} from 'zod';
import type {Session} from '../session';
import {createEditorAssetLibrary} from '../asset-library';
import {buildWebMcpAssetLibraryTools, type TAssetLibraryPort} from './webmcp-asset-library';
import {buildWebMcpScreenSetupTools} from './webmcp-screen-setup';

type TLopakaSession = Session;

/** Layer identifiers are short generated ids; the bound keeps input closed. */
const MAX_LAYER_ID_LENGTH = 128;

const LAYER_INPUT_SCHEMA = z.strictObject({layerId: z.string().min(1).max(MAX_LAYER_ID_LENGTH)});

type TCanvasPngSource = Pick<HTMLCanvasElement, 'width' | 'height'> & CanvasImageSource;

/**
 * Compose the editor pixels over the project background before encoding them.
 * The preview background lives in CSS, so it is otherwise absent from a PNG
 * made directly from the editor canvas.
 */
export function exportOpaqueCanvasPng(
    canvas: TCanvasPngSource,
    backgroundColor: string,
    createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas')
): string {
    const exportedCanvas = createCanvas();
    exportedCanvas.width = canvas.width;
    exportedCanvas.height = canvas.height;
    const context = exportedCanvas.getContext('2d', {alpha: false});
    if (!context) {
        throw new Error('Unable to create the PNG export context.');
    }
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, exportedCanvas.width, exportedCanvas.height);
    context.drawImage(canvas, 0, 0);
    return exportedCanvas.toDataURL('image/png');
}

export function buildWebMcpEditorTools({
    session,
    getContextSource,
    assetLibrary,
}: {
    session: TLopakaSession;
    /** Read live so a tool answers for the screen state that is active right now. */
    getContextSource: () => TWebMcpContextSource;
    /** Test/host injection; production uses the current session-backed library. */
    assetLibrary?: TAssetLibraryPort;
}): TWebMcpTool[] {
    const readOnlyUntrusted = {readOnlyHint: true, untrustedContentHint: true} as const;
    const emptyInput = EMPTY_WEBMCP_INPUT_SCHEMA;

    // Every read below happens inside a tool callback, so the answer describes
    // the screen as it is at invocation time rather than at registration.
    const readStructureToken = (contextId: string) =>
        buildWebMcpStructureToken({
            screenKey: contextId,
            layers: session.layersManager.sorted,
        });

    const readDefinitions = annotateWebMcpTools(
        [
            createWebMcpTool({
                name: 'lopaka_get_screen_summary',
                title: 'Get Lopaka screen summary',
                description:
                    'Get the active Lopaka platform, display size, background, layer count, selection, history availability, and current messages.',
                inputSchema: emptyInput,
                annotations: readOnlyUntrusted,
                handler: () => {
                    const contextSource = getContextSource();
                    const contextId = buildWebMcpContextId(contextSource);
                    return webMcpSuccess(
                        describeWebMcpScreenSummary({
                            contextId,
                            platform: session.state.platform,
                            display: session.state.display,
                            displayCustom: Boolean(session.state.isDisplayCustom),
                            background: session.getPlatformFeatures?.()?.screenBgColor ?? null,
                            layers: session.layersManager.sorted,
                            canUndo: Boolean(session.history?.history?.length),
                            canRedo: Boolean(session.history?.redoHistory?.length),
                            warnings: session.state.warnings ?? [],
                            infos: [],
                        }),
                        {contextId}
                    );
                },
            }),
            createWebMcpTool({
                name: 'lopaka_list_layers',
                title: 'List Lopaka layers',
                description:
                    'List the active Lopaka screen layers in stacking order with their type, group, bounds, visibility, lock, selection, and editable properties.',
                inputSchema: emptyInput,
                annotations: readOnlyUntrusted,
                handler: () => {
                    const contextId = buildWebMcpContextId(getContextSource());
                    return webMcpSuccess(
                        {
                            layers: describeWebMcpLayers(session.layersManager.sorted, {
                                platformId: session.state.platform,
                                features: session.getPlatformFeatures?.(),
                                paintColorMode: session.state.paintColorMode,
                            }),
                        },
                        {contextId, structureToken: readStructureToken(contextId)}
                    );
                },
            }),
            createWebMcpTool({
                name: 'lopaka_get_layer',
                title: 'Get Lopaka layer',
                description:
                    'Get one layer of the active Lopaka screen by identifier, with its exact supported properties, ranges, and actions.',
                inputSchema: LAYER_INPUT_SCHEMA,
                annotations: readOnlyUntrusted,
                handler: ({layerId}) => {
                    const contextId = buildWebMcpContextId(getContextSource());
                    const layer = findWebMcpLayer(session.layersManager.sorted, layerId);
                    if (!layer) {
                        return webMcpFailure(
                            {code: 'not_found', message: 'No layer with that identifier is on the active screen.'},
                            {contextId}
                        );
                    }
                    return webMcpSuccess(
                        describeWebMcpLayerDetail(layer, {
                            editable: true,
                            platformId: session.state.platform,
                            features: session.getPlatformFeatures?.(),
                            paintColorMode: session.state.paintColorMode,
                        }),
                        {contextId, structureToken: readStructureToken(contextId)}
                    );
                },
            }),
            createWebMcpTool({
                name: 'lopaka_generate_code',
                title: 'Generate Lopaka code',
                description:
                    'Generate code for the active Lopaka screen and selected platform, with the generated line of each layer.',
                inputSchema: emptyInput,
                annotations: readOnlyUntrusted,
                handler: () => {
                    const contextId = buildWebMcpContextId(getContextSource());
                    return webMcpSuccess(describeWebMcpGeneratedCode(session.generateCode() ?? {}), {contextId});
                },
            }),
            createWebMcpTool({
                name: 'lopaka_get_canvas_png',
                title: 'Get Lopaka canvas PNG',
                description:
                    'Get an opaque PNG data URL of the Lopaka canvas at its native display dimensions, composited over the active project background.',
                inputSchema: emptyInput,
                annotations: readOnlyUntrusted,
                handler: () => {
                    const contextId = buildWebMcpContextId(getContextSource());
                    const canvas = session.virtualScreen?.canvas;
                    if (!canvas) {
                        return webMcpFailure(
                            {code: 'internal_error', message: 'The active editor canvas is not ready yet.'},
                            {contextId}
                        );
                    }
                    try {
                        const backgroundColor = session.getPlatformFeatures?.()?.screenBgColor ?? '#000000';
                        return webMcpSuccess(
                            {
                                pngDataUrl: exportOpaqueCanvasPng(canvas, backgroundColor),
                                width: canvas.width,
                                height: canvas.height,
                            },
                            {contextId}
                        );
                    } catch {
                        return webMcpFailure(
                            {code: 'internal_error', message: 'The active editor canvas could not be exported as PNG.'},
                            {contextId}
                        );
                    }
                },
            }),
        ],
        {area: 'read-model', mutating: false}
    );

    const definitions: TWebMcpTool[] = [
        ...buildWebMcpScreenSetupTools({session, getContextSource}),
        ...buildWebMcpAssetLibraryTools({
            session,
            library: assetLibrary ?? createEditorAssetLibrary(session),
            getContextSource,
        }),
        ...buildWebMcpLayerOrganizationTools({session, getContextSource}),
        ...buildWebMcpLayerCreationTools({session, getContextSource}),
        ...buildWebMcpLayerEditingTools({session, getContextSource}),
    ];
    definitions.unshift(...readDefinitions);
    return definitions;
}
