import {z, type ZodType} from 'zod';
import {TWebMcpJsonSchema, TWebMcpResult, TWebMcpTool, webMcpFailure} from './webmcp-envelope';
import {invalidInputFromZodIssues} from './webmcp-schema';

type ParsedInput = Record<string, unknown>;

export type TWebMcpExecutionContext = {
    signal?: AbortSignal;
    /** Keep a context-changing invocation alive while its old registration is replaced. */
    detachLifecycle?: () => void;
};
export type TWebMcpToolMetadata = Partial<Pick<TWebMcpTool, 'area' | 'mutating'>>;

export type TWebMcpToolDefinition<TInput extends ParsedInput = ParsedInput> = {
    name: string;
    title: string;
    description: string;
    annotations: TWebMcpTool['annotations'];
    inputSchema: ZodType<TInput>;
    handler(input: TInput, context?: TWebMcpExecutionContext): TWebMcpResult<unknown> | Promise<TWebMcpResult<unknown>>;
    metadata?: TWebMcpToolMetadata;
};

export const WEBMCP_ABORTED_RESULT = webMcpFailure({
    code: 'stale_context',
    message: 'The Lopaka document changed before this operation completed.',
});

function abortedResult(signal?: AbortSignal): TWebMcpResult<never> {
    return signal?.reason === 'registration_replaced'
        ? webMcpFailure({
              code: 'stale_context',
              message: 'WebMCP registration was replaced before this operation completed.',
              details: {reason: 'registration_replaced'},
          })
        : WEBMCP_ABORTED_RESULT;
}

/** Build one strict-Zod WebMCP definition and emit its Draft-07 schema. */
export function createWebMcpTool<TInput extends ParsedInput>(definition: TWebMcpToolDefinition<TInput>): TWebMcpTool {
    return {
        name: definition.name,
        title: definition.title,
        description: definition.description,
        annotations: definition.annotations,
        inputSchema: z.toJSONSchema(definition.inputSchema, {target: 'draft-7'}) as TWebMcpJsonSchema,
        ...definition.metadata,
        execute(input?: unknown, context: TWebMcpExecutionContext = {}) {
            if (context.signal?.aborted) return abortedResult(context.signal);
            const parsed = definition.inputSchema.safeParse(input ?? {});
            if (!parsed.success) return webMcpFailure(invalidInputFromZodIssues(parsed.error.issues, input));
            const result = definition.handler(parsed.data, context);
            if (!(result instanceof Promise)) return context.signal?.aborted ? abortedResult(context.signal) : result;
            return result.then(
                (value) => (context.signal?.aborted ? abortedResult(context.signal) : value),
                (error) => (context.signal?.aborted ? abortedResult(context.signal) : Promise.reject(error))
            );
        },
    };
}

/** Attach one area/policy descriptor to definitions built by a single adapter. */
export function annotateWebMcpTools(tools: readonly TWebMcpTool[], metadata: TWebMcpToolMetadata): TWebMcpTool[] {
    return tools.map((tool) => ({
        ...metadata,
        mutating: metadata.mutating ?? !tool.annotations.readOnlyHint,
        ...tool,
    }));
}
