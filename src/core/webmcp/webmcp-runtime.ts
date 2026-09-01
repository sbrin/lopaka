/**
 * WebMCP runtime for the Lopaka editor.
 *
 * The editor is a single mounted document, so registration is driven by the
 * session rather than by a router: the tools are registered once and then
 * re-registered whenever the target changes, because the platform and display
 * size are part of the context identity that mutations are validated against.
 */

import {watch} from 'vue';
import {useSession, type Session} from '/src/core/session';
import {buildWebMcpEditorTools} from './webmcp-editor-tools';
import {supportedWebMcpLayerTypes} from './webmcp-layer-creation';
import {buildWebMcpContextTools} from './webmcp-context-tools';
import {buildWebMcpContextId, type TWebMcpContextSource} from './webmcp-context';
import {buildWebMcpToolCatalog, type TWebMcpCapabilitySource, type TWebMcpToolDescriptor} from './webmcp-capabilities';
import type {TWebMcpTool} from './webmcp-envelope';

export type TWebMcpRuntime = {refresh(): void; dispose(): void};
export type TWebMcpModelContext = {
    registerTool: (tool: TWebMcpTool, options?: {signal?: AbortSignal}) => Promise<void>;
};

type ComposedWebMcpSignal = AbortSignal & {cleanup?: () => void; detachLifecycle?: () => void};
const REGISTRATION_REPLACED = 'registration_replaced' as const;

/** Abort an invocation when either the browser or the mounted runtime aborts it. */
export function composeWebMcpSignals(lifecycleSignal: AbortSignal, externalSignal?: AbortSignal): AbortSignal {
    const controller = new AbortController();
    let cleaned = false;
    let lifecycleDetached = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        if (!lifecycleDetached) lifecycleSignal.removeEventListener('abort', abortLifecycle);
        externalSignal?.removeEventListener('abort', abortExternal);
    };
    const abort = (reason?: unknown) => {
        controller.abort(reason);
        cleanup();
    };
    const abortLifecycle = () => abort(lifecycleSignal.reason);
    const abortExternal = () => abort(externalSignal?.reason);
    const detachLifecycle = () => {
        if (lifecycleDetached || cleaned) return;
        lifecycleDetached = true;
        lifecycleSignal.removeEventListener('abort', abortLifecycle);
    };
    if (lifecycleSignal.aborted || externalSignal?.aborted) {
        controller.abort(lifecycleSignal.aborted ? lifecycleSignal.reason : externalSignal?.reason);
        return controller.signal;
    }
    lifecycleSignal.addEventListener('abort', abortLifecycle, {once: true});
    externalSignal?.addEventListener('abort', abortExternal, {once: true});
    (controller.signal as ComposedWebMcpSignal).cleanup = cleanup;
    (controller.signal as ComposedWebMcpSignal).detachLifecycle = detachLifecycle;
    return controller.signal;
}

export function getWebMcpModelContext(documentLike: Document = document): TWebMcpModelContext | null {
    return (documentLike as Document & {modelContext?: TWebMcpModelContext}).modelContext ?? null;
}

function randomMountId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

export function createWebMcpRuntime(modelContext: TWebMcpModelContext | null): TWebMcpRuntime {
    // The reactive session proxy is structurally the editor session the tools expect.
    const session = useSession() as unknown as Session;
    const mountId = randomMountId('editor');
    let controller = new AbortController();
    let disposed = false;
    let registrationGeneration = 0;
    let refreshScheduled = false;
    let lastRegistrationKey: string | null = null;

    const editorContext = (): TWebMcpContextSource => ({
        mountId,
        platform: session.state.platform,
        displayWidth: session.state.display?.x ?? 0,
        displayHeight: session.state.display?.y ?? 0,
    });

    const readCapabilities = (): TWebMcpCapabilitySource => ({
        platform: session.state.platform ?? null,
        display: {x: session.state.display?.x ?? 0, y: session.state.display?.y ?? 0},
        creatableLayerTypes: [...supportedWebMcpLayerTypes(session)],
        features: session.getPlatformFeatures?.(),
        paintColorMode: session.state.paintColorMode,
    });

    function buildCurrentTools(): TWebMcpTool[] {
        const catalogRef: {current: TWebMcpToolDescriptor[]} = {current: []};
        const getContextSource = editorContext;
        const definitions = [
            ...buildWebMcpContextTools({
                getContextSource,
                getCapabilitySource: readCapabilities,
                getCatalog: () => catalogRef.current,
            }),
            ...buildWebMcpEditorTools({session, getContextSource}),
        ];
        catalogRef.current = buildWebMcpToolCatalog(definitions);
        return definitions;
    }

    async function registerCurrentTools() {
        if (!modelContext || disposed) return;
        const context = editorContext();
        const registrationKey = [buildWebMcpContextId(context), session.state.paintColorMode].join('|');
        if (registrationKey === lastRegistrationKey) return;

        const generation = ++registrationGeneration;
        lastRegistrationKey = null;
        controller.abort(REGISTRATION_REPLACED);
        controller = new AbortController();
        const signal = controller.signal;
        if (disposed || signal.aborted || generation !== registrationGeneration) return;

        const tools = buildCurrentTools();
        await Promise.all(
            tools.map((tool) =>
                modelContext.registerTool(
                    {
                        ...tool,
                        execute: (input, options) => {
                            const composed = composeWebMcpSignals(signal, options?.signal) as ComposedWebMcpSignal;
                            const result = tool.execute(input, {
                                signal: composed,
                                detachLifecycle: composed.detachLifecycle,
                            });
                            if (result instanceof Promise) {
                                return result.finally(() => composed.cleanup?.());
                            }
                            composed.cleanup?.();
                            return result;
                        },
                    },
                    {signal}
                )
            )
        );
        if (!signal.aborted && generation === registrationGeneration) lastRegistrationKey = registrationKey;
    }

    const refresh = () => {
        if (refreshScheduled || disposed) return;
        refreshScheduled = true;
        queueMicrotask(() => {
            refreshScheduled = false;
            void registerCurrentTools().catch((error) => console.warn('Failed to register WebMCP tools:', error));
        });
    };

    const stopSession = watch(
        () => [
            session.state.platform,
            session.state.paintColorMode,
            session.state.display?.x,
            session.state.display?.y,
        ],
        () => refresh()
    );
    refresh();

    return {
        refresh,
        dispose: () => {
            disposed = true;
            controller.abort();
            stopSession();
        },
    };
}
