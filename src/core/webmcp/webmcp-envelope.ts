/** Shared WebMCP result and browser registration contracts. */
export type TWebMcpErrorCode =
    | 'invalid_input'
    | 'not_found'
    | 'stale_context'
    | 'stale_layer_state'
    | 'unsupported_for_platform'
    | 'busy'
    | 'internal_error';

export type TWebMcpError = {code: TWebMcpErrorCode; message: string; details?: Record<string, unknown>};
export type TWebMcpSuccess<TData> = {
    ok: true;
    data: TData;
    contextId?: string;
    structureToken?: string;
    warnings: string[];
};
export type TWebMcpFailure = {ok: false; error: TWebMcpError; contextId?: string};
export type TWebMcpResult<TData> = TWebMcpSuccess<TData> | TWebMcpFailure;

export function webMcpSuccess<TData>(
    data: TData,
    options: {contextId?: string; structureToken?: string; warnings?: string[]} = {}
): TWebMcpSuccess<TData> {
    return {
        ok: true,
        data,
        ...(options.contextId ? {contextId: options.contextId} : {}),
        ...(options.structureToken ? {structureToken: options.structureToken} : {}),
        warnings: options.warnings ?? [],
    };
}

export function webMcpFailure(error: TWebMcpError, options: {contextId?: string} = {}): TWebMcpFailure {
    return {
        ok: false,
        error: {code: error.code, message: error.message, ...(error.details ? {details: error.details} : {})},
        ...(options.contextId ? {contextId: options.contextId} : {}),
    };
}

/** Browser callbacks return this object directly. */
export function webMcpResult<T>(result: T): T {
    return result;
}

export type TWebMcpJsonSchema = {$schema?: string; type?: string; [key: string]: unknown};
export type TWebMcpTool = {
    name: string;
    title: string;
    description: string;
    inputSchema: TWebMcpJsonSchema;
    annotations: {readOnlyHint: boolean; untrustedContentHint?: true};
    /** Optional metadata emitted from the same typed definition as the tool. */
    area?: string;
    mutating?: boolean;
    execute(
        input?: unknown,
        options?: {signal?: AbortSignal; detachLifecycle?: () => void}
    ): unknown | Promise<unknown>;
};
