/**
 * Controlled `document.modelContext` stub. Stable browsers do not implement
 * WebMCP, so registration and invocation are exercised through this capture.
 */

import type {TWebMcpModelContext} from './webmcp-runtime';
import type {TWebMcpResult, TWebMcpTool} from './webmcp-envelope';
import {buildWebMcpToolCatalog, selectWebMcpToolsForContext} from './webmcp-capabilities';
import type {TWebMcpContextSource} from './webmcp-context';

export type TCapturedWebMcpTool = TWebMcpTool;

export type TWebMcpStub = TWebMcpModelContext & {
    /** Tool names currently advertised, in registration order. */
    toolNames(): string[];
    tool(name: string): TCapturedWebMcpTool;
    has(name: string): boolean;
    /** Invoke a synchronous callback and return its object envelope. */
    call<TData = unknown>(name: string, input?: unknown): TWebMcpResult<TData>;
    /** Invoke a callback that may answer asynchronously, and return its object envelope. */
    callAsync<TData = unknown>(name: string, input?: unknown): Promise<TWebMcpResult<TData>>;
};

export function createWebMcpStub(): TWebMcpStub {
    const registered = new Map<string, TCapturedWebMcpTool>();

    return {
        registerTool: (tool, options) => {
            const captured = tool as TCapturedWebMcpTool;
            registered.set(captured.name, captured);
            // Abort unregisters, mirroring the browser lifecycle.
            options?.signal?.addEventListener('abort', () => registered.delete(captured.name));
            return Promise.resolve();
        },
        toolNames: () => [...registered.keys()],
        tool(name) {
            const tool = registered.get(name);
            if (!tool) {
                throw new Error(`Tool is not registered: ${name}`);
            }
            return tool;
        },
        has: (name) => registered.has(name),
        call<TData = unknown>(name: string, input?: unknown): TWebMcpResult<TData> {
            const result = this.tool(name).execute(input);
            if (result instanceof Promise) throw new Error(`Tool answered asynchronously; use callAsync: ${name}`);
            return result as TWebMcpResult<TData>;
        },
        async callAsync<TData = unknown>(name: string, input?: unknown): Promise<TWebMcpResult<TData>> {
            return (await this.tool(name).execute(input)) as TWebMcpResult<TData>;
        },
    };
}

export async function registerWebMcpToolDefinitions(
    stub: TWebMcpStub,
    tools: TCapturedWebMcpTool[],
    signal?: AbortSignal,
    contextSource?: TWebMcpContextSource
): Promise<void> {
    const selected = contextSource
        ? new Set(selectWebMcpToolsForContext(contextSource, buildWebMcpToolCatalog(tools)).map((tool) => tool.name))
        : null;
    await Promise.all(
        tools.filter((tool) => !selected || selected.has(tool.name)).map((tool) => stub['registerTool'](tool, {signal}))
    );
}
