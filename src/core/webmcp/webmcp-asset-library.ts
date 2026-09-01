import {z} from 'zod';
import type {EditorAssetLibrary} from '../asset-library';
import {AssetLibraryError} from '../asset-library';
import type {EditorActions, EditorActionError} from '../editor-actions';
import type {AbstractLayer} from '../layers/abstract.layer';
import type {TPlatformFeatures} from '/src/platforms/platform';
import {buildWebMcpContextId, TWebMcpContextSource, validateWebMcpContextId} from './webmcp-context';
import {TWebMcpError, TWebMcpResult, TWebMcpTool, webMcpFailure, webMcpResult, webMcpSuccess} from './webmcp-envelope';
import {annotateWebMcpTools, createWebMcpTool, WEBMCP_ABORTED_RESULT} from './webmcp-tool';
import {WEBMCP_BUSY_RESULT, runExclusiveWebMcpMutationAsync} from './webmcp-mutation-lock';
import {describeWebMcpLayerDetail} from './webmcp-read-model';
import {buildWebMcpStructureToken} from './webmcp-structure-token';

const MAX_ASSET_ID_LENGTH = 256;
const MAX_CONTEXT_ID_LENGTH = 256;
const MAX_QUERY_LENGTH = 128;
const MAX_COLOR_LENGTH = 32;
const MAX_CURSOR_LENGTH = 256;
const COORDINATE_LIMIT = 10000;

const SEARCH_SCHEMA = z.strictObject({
    query: z.string().max(MAX_QUERY_LENGTH).optional(),
    kinds: z
        .array(z.enum(['image', 'icon']))
        .min(1)
        .max(2)
        .optional(),
    sources: z
        .array(z.enum(['builtin', 'session']))
        .min(1)
        .max(2)
        .optional(),
    limit: z.number().int().min(1).max(50).optional(),
    cursor: z.string().min(1).max(MAX_CURSOR_LENGTH).optional(),
});

const GET_SCHEMA = z.strictObject({
    assetId: z.string().min(1).max(MAX_ASSET_ID_LENGTH),
});

const ADD_SCHEMA = z
    .strictObject({
        contextId: z.string().min(1).max(MAX_CONTEXT_ID_LENGTH),
        assetId: z.string().min(1).max(MAX_ASSET_ID_LENGTH),
        x: z.number().int().min(-COORDINATE_LIMIT).max(COORDINATE_LIMIT).optional(),
        y: z.number().int().min(-COORDINATE_LIMIT).max(COORDINATE_LIMIT).optional(),
        color: z.string().min(1).max(MAX_COLOR_LENGTH).optional(),
    })
    .refine((value) => (value.x === undefined) === (value.y === undefined), {
        message: 'Asset coordinates x and y must be provided together.',
        path: ['x'],
    });

export type TAssetLibraryPort = Pick<EditorAssetLibrary, 'search' | 'preview' | 'resolve'>;

type TAssetWebMcpSession = {
    state: {platform: string; paintColorMode?: 'rgb' | 'monochrome'};
    getPlatformFeatures?(): TPlatformFeatures;
    layersManager: {sorted: AbstractLayer[]};
    editorActions: EditorActions;
};

function libraryFailure(error: unknown): TWebMcpError {
    if (error instanceof AssetLibraryError) {
        return {code: error.code, message: error.message};
    }
    return {code: 'internal_error', message: 'The Lopaka asset library could not complete the request.'};
}

function actionFailure(error: EditorActionError): TWebMcpError {
    const field = 'field' in error ? error.field : undefined;
    switch (error.code) {
        case 'stale_context':
        case 'stale_layer_state':
        case 'not_found':
        case 'unsupported_for_platform':
            return {code: error.code, message: error.message, ...(field ? {details: {field}} : {})};
        case 'locked':
        case 'invalid':
            return {
                code: 'invalid_input',
                message: error.message,
                ...(field ? {details: {field}} : {}),
            };
        case 'internal':
            return {code: 'internal_error', message: error.message};
    }
}

export function buildWebMcpAssetLibraryTools({
    session,
    library,
    getContextSource,
}: {
    session: TAssetWebMcpSession;
    library: TAssetLibraryPort;
    getContextSource: () => TWebMcpContextSource;
}): TWebMcpTool[] {
    const readTools = annotateWebMcpTools(
        [
            createWebMcpTool({
                name: 'lopaka_search_assets',
                title: 'Search Lopaka assets',
                description:
                    'Search built-in icons and images imported in the current session. Results include dimensions and supported placement properties.',
                inputSchema: SEARCH_SCHEMA,
                annotations: {readOnlyHint: true, untrustedContentHint: true},
                async handler(input, execution) {
                    const contextId = buildWebMcpContextId(getContextSource());
                    try {
                        const result = await library.search({
                            ...input,
                            kinds: input.kinds,
                            sources: input.sources,
                        });
                        return execution?.signal?.aborted ? WEBMCP_ABORTED_RESULT : webMcpSuccess(result, {contextId});
                    } catch (error) {
                        return execution?.signal?.aborted
                            ? WEBMCP_ABORTED_RESULT
                            : webMcpFailure(libraryFailure(error));
                    }
                },
            }),
            createWebMcpTool({
                name: 'lopaka_get_asset',
                title: 'Get a Lopaka asset preview',
                description: 'Get an available asset as a PNG data URL at its native size.',
                inputSchema: GET_SCHEMA,
                annotations: {readOnlyHint: true, untrustedContentHint: true},
                async handler(input, execution) {
                    const contextId = buildWebMcpContextId(getContextSource());
                    try {
                        const result = await library.preview(input.assetId, {
                            signal: execution?.signal,
                        });
                        return execution?.signal?.aborted ? WEBMCP_ABORTED_RESULT : webMcpSuccess(result, {contextId});
                    } catch (error) {
                        return execution?.signal?.aborted
                            ? WEBMCP_ABORTED_RESULT
                            : webMcpFailure(libraryFailure(error));
                    }
                },
            }),
        ],
        {area: 'asset-library', mutating: false}
    );

    const addTool = annotateWebMcpTools(
        [
            createWebMcpTool({
                name: 'lopaka_add_asset',
                title: 'Add a Lopaka asset',
                description:
                    'Add an available image or icon to the active canvas at an optional top-left x/y position and optional supported color.',
                inputSchema: ADD_SCHEMA,
                annotations: {readOnlyHint: false, untrustedContentHint: true},
                handler(input, execution): Promise<TWebMcpResult<unknown>> | TWebMcpResult<unknown> {
                    const context = validateWebMcpContextId(getContextSource(), input.contextId);
                    if (context.error) return webMcpFailure(context.error);
                    const contextId = context.contextId!;
                    return runExclusiveWebMcpMutationAsync(
                        async () => {
                            try {
                                const asset = await library.resolve(input.assetId, {
                                    signal: execution?.signal,
                                });
                                if (execution?.signal?.aborted) return WEBMCP_ABORTED_RESULT;
                                const result = await session.editorActions.addAsset({
                                    asset,
                                    x: input.x,
                                    y: input.y,
                                    color: input.color,
                                    signal: execution?.signal,
                                });
                                if (result.ok === false) {
                                    return webMcpResult(webMcpFailure(actionFailure(result.error), {contextId}));
                                }
                                return webMcpResult(
                                    webMcpSuccess(
                                        describeWebMcpLayerDetail(result.data.layer, {
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
                            } catch (error) {
                                return execution?.signal?.aborted
                                    ? WEBMCP_ABORTED_RESULT
                                    : webMcpFailure(libraryFailure(error), {contextId});
                            }
                        },
                        () => WEBMCP_BUSY_RESULT
                    );
                },
            }),
        ],
        {area: 'asset-library', mutating: true}
    );

    return [...readTools, ...addTool];
}
