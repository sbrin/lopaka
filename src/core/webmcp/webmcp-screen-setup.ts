import {z} from 'zod';
import type {Session} from '../session';
import {EDITOR_DISPLAY_MAX, EDITOR_DISPLAY_MIN, type EditorActionError} from '../editor-actions';
import {buildWebMcpContextId, type TWebMcpContextSource, validateWebMcpContextId} from './webmcp-context';
import {TWebMcpError, TWebMcpTool, webMcpFailure, webMcpResult, webMcpSuccess} from './webmcp-envelope';
import {WEBMCP_BUSY_RESULT, runExclusiveWebMcpMutation, runExclusiveWebMcpMutationAsync} from './webmcp-mutation-lock';
import {EMPTY_WEBMCP_INPUT_SCHEMA} from './webmcp-schema';
import {annotateWebMcpTools, createWebMcpTool} from './webmcp-tool';

const MAX_CONTEXT_ID_LENGTH = 256;
const MAX_PLATFORM_ID_LENGTH = 64;
const CONTEXT_INPUT = {contextId: z.string().min(1).max(MAX_CONTEXT_ID_LENGTH)} as const;

const DISPLAY_INPUT_SCHEMA = z.strictObject({
    ...CONTEXT_INPUT,
    width: z.number().int().min(EDITOR_DISPLAY_MIN).max(EDITOR_DISPLAY_MAX),
    height: z.number().int().min(EDITOR_DISPLAY_MIN).max(EDITOR_DISPLAY_MAX),
});
const BACKGROUND_INPUT_SCHEMA = z.strictObject({
    ...CONTEXT_INPUT,
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
});
const PLATFORM_INPUT_SCHEMA = z.strictObject({
    ...CONTEXT_INPUT,
    platform: z.string().min(1).max(MAX_PLATFORM_ID_LENGTH),
});

function actionError(error: EditorActionError, field: string): TWebMcpError {
    if (error.code === 'unsupported_for_platform') {
        return {code: 'unsupported_for_platform', message: error.message, details: {field}};
    }
    return {code: 'invalid_input', message: error.message, details: {field}};
}

function currentContext(getContextSource: () => TWebMcpContextSource): string {
    return buildWebMcpContextId(getContextSource());
}

function validateContext(getContextSource: () => TWebMcpContextSource, contextId: string) {
    const validation = validateWebMcpContextId(getContextSource(), contextId);
    return validation.error ? webMcpResult(webMcpFailure(validation.error)) : null;
}

export function describeWebMcpScreenSetupOptions(session: Session) {
    return {
        platforms: Object.entries(session.platforms).map(([identifier, platform]) => ({
            identifier,
            name: platform.getName(),
            description: platform.getDescription(),
            monochrome: platform.features.hasMonochromeSupport ?? !platform.features.hasRGBSupport,
            displays: platform.displays.map((display) => ({
                title: display.title,
                width: display.size.x,
                height: display.size.y,
            })),
        })),
        customDisplay: {
            minWidth: EDITOR_DISPLAY_MIN,
            minHeight: EDITOR_DISPLAY_MIN,
            maxWidth: EDITOR_DISPLAY_MAX,
            maxHeight: EDITOR_DISPLAY_MAX,
            wholePixels: true,
        },
    };
}

export function buildWebMcpScreenSetupTools({
    session,
    getContextSource,
}: {
    session: Session;
    getContextSource: () => TWebMcpContextSource;
}): TWebMcpTool[] {
    return annotateWebMcpTools(
        [
            createWebMcpTool({
                name: 'lopaka_get_screen_setup_options',
                title: 'Get Lopaka screen setup options',
                description:
                    'List selectable platforms, their display presets, and the supported custom display range.',
                inputSchema: EMPTY_WEBMCP_INPUT_SCHEMA,
                annotations: {readOnlyHint: true},
                handler: () => {
                    const contextId = currentContext(getContextSource);
                    return webMcpSuccess(describeWebMcpScreenSetupOptions(session), {contextId});
                },
            }),
            createWebMcpTool({
                name: 'lopaka_set_display',
                title: 'Set Lopaka display size',
                description:
                    'Set the active display to a preset or supported custom width and height without removing layers.',
                inputSchema: DISPLAY_INPUT_SCHEMA,
                annotations: {readOnlyHint: false},
                handler: ({contextId, width, height}) => {
                    const invalidContext = validateContext(getContextSource, contextId);
                    if (invalidContext) return invalidContext;
                    return runExclusiveWebMcpMutation(
                        () => {
                            const result = session.editorActions.setDisplay(width, height);
                            if (result.ok === false) {
                                return webMcpResult(webMcpFailure(actionError(result.error, 'width')));
                            }
                            const nextContextId = currentContext(getContextSource);
                            return webMcpResult(webMcpSuccess(result.data, {contextId: nextContextId}));
                        },
                        () => WEBMCP_BUSY_RESULT
                    );
                },
            }),
            createWebMcpTool({
                name: 'lopaka_set_screen_background',
                title: 'Set Lopaka screen background',
                description: 'Set the active platform screen background to a six-digit hex color.',
                inputSchema: BACKGROUND_INPUT_SCHEMA,
                annotations: {readOnlyHint: false},
                handler: ({contextId, color}) => {
                    const invalidContext = validateContext(getContextSource, contextId);
                    if (invalidContext) return invalidContext;
                    return runExclusiveWebMcpMutation(
                        () => {
                            const result = session.editorActions.setScreenBackground(color);
                            if (result.ok === false) {
                                return webMcpResult(webMcpFailure(actionError(result.error, 'color')));
                            }
                            return webMcpResult(
                                webMcpSuccess(result.data, {contextId: currentContext(getContextSource)})
                            );
                        },
                        () => WEBMCP_BUSY_RESULT
                    );
                },
            }),
            createWebMcpTool({
                name: 'lopaka_set_platform',
                title: 'Set Lopaka platform',
                description: 'Switch the editor target and load the layers stored locally for that platform.',
                inputSchema: PLATFORM_INPUT_SCHEMA,
                annotations: {readOnlyHint: false},
                async handler({contextId, platform}, execution) {
                    const invalidContext = validateContext(getContextSource, contextId);
                    if (invalidContext) return invalidContext;
                    return runExclusiveWebMcpMutationAsync(
                        async () => {
                            execution.detachLifecycle?.();
                            const result = await session.editorActions.setPlatform(platform);
                            if (result.ok === false) {
                                return webMcpResult(webMcpFailure(actionError(result.error, 'platform')));
                            }
                            return webMcpResult(
                                webMcpSuccess(result.data, {contextId: currentContext(getContextSource)})
                            );
                        },
                        () => WEBMCP_BUSY_RESULT
                    );
                },
            }),
        ],
        {area: 'screen-setup'}
    );
}
