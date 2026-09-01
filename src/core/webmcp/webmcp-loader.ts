import type {TWebMcpModelContext, TWebMcpRuntime} from './webmcp-runtime';

export type WebMcpDocument = Document & {modelContext?: TWebMcpModelContext};
export type WebMcpRuntimeLoader = () => Promise<typeof import('./webmcp-runtime')>;

export function hasWebMcpModelContext(documentLike: WebMcpDocument | null | undefined): boolean {
    return typeof documentLike?.modelContext?.registerTool === 'function';
}

/** Load the WebMCP graph only in a browser that exposes the model context API. */
export async function loadWebMcpRuntime(
    options: {
        documentLike?: WebMcpDocument | null;
        loader?: WebMcpRuntimeLoader;
    } = {}
): Promise<TWebMcpRuntime | null> {
    const documentLike =
        options.documentLike ?? (typeof document === 'undefined' ? null : (document as WebMcpDocument));
    if (!hasWebMcpModelContext(documentLike)) return null;
    const module = await (options.loader ?? (() => import('./webmcp-runtime')))();
    return module.createWebMcpRuntime(module.getWebMcpModelContext(documentLike));
}
