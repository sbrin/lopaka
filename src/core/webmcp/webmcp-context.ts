/**
 * Active editor context identity for WebMCP tools.
 *
 * The editor has no authoritative document revision, so tools identify the
 * mounted editor by its mount plus the target it is drawing for. Changing the
 * platform or the display size produces a different `contextId`, which lets a
 * delayed tool call be rejected as `stale_context` instead of landing on a
 * screen the user has already reconfigured.
 */

import {TWebMcpError} from './webmcp-envelope';

/**
 * Live view of the mounted editor. Every field is read at invocation time so a
 * tool never answers from state captured during registration.
 */
export type TWebMcpContextSource = {
    /** Stable for one editor mount, regenerated on remount. */
    mountId: string;
    /** Identifier of the active platform, for example `u8g2`. */
    platform: string;
    /** Active display size in pixels. */
    displayWidth: number;
    displayHeight: number;
};

export type TWebMcpContext = {
    route: string;
    editable: boolean;
    platform: string;
    displayWidth: number;
    displayHeight: number;
    contextId: string;
};

function identityPart(value: string | number | null | undefined): string {
    return value === null || value === undefined ? '-' : String(value);
}

/**
 * Opaque to the agent, but derived so that any change of mount, platform, or
 * display size yields a different value.
 */
export function buildWebMcpContextId(source: TWebMcpContextSource): string {
    return [
        'ctx',
        source.mountId,
        identityPart(source.platform),
        `${identityPart(source.displayWidth)}x${identityPart(source.displayHeight)}`,
    ].join(':');
}

export function describeWebMcpContext(source: TWebMcpContextSource): TWebMcpContext {
    return {
        route: 'editor',
        editable: true,
        platform: source.platform,
        displayWidth: source.displayWidth,
        displayHeight: source.displayHeight,
        contextId: buildWebMcpContextId(source),
    };
}

/**
 * `error` is absent when the context is valid. Kept as optional fields rather
 * than a discriminated union because this project compiles without
 * `strictNullChecks`.
 */
export type TWebMcpContextValidation = {
    contextId?: string;
    error?: TWebMcpError;
};

/**
 * Precondition shared by every mutation tool: the supplied `contextId` must
 * match the context that is live right now, so a call prepared against an
 * earlier platform or display size cannot be applied to the current screen.
 */
export function validateWebMcpContextId(
    source: TWebMcpContextSource,
    providedContextId: unknown
): TWebMcpContextValidation {
    const contextId = buildWebMcpContextId(source);

    if (typeof providedContextId !== 'string' || providedContextId.length === 0) {
        return {
            error: {code: 'invalid_input', message: 'A contextId string is required.', details: {field: 'contextId'}},
        };
    }
    if (providedContextId !== contextId) {
        return {
            error: {
                code: 'stale_context',
                message: 'The active Lopaka editor context has changed. Read the current context and retry.',
            },
        };
    }

    return {contextId};
}
