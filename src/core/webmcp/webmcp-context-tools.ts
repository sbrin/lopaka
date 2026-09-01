import {
    TWebMcpCapabilitySource,
    TWebMcpToolArea,
    TWebMcpToolDescriptor,
    WEBMCP_TOOL_AREAS,
    describeWebMcpCapabilities,
} from './webmcp-capabilities';
import {TWebMcpContextSource, buildWebMcpContextId, describeWebMcpContext} from './webmcp-context';
import {TWebMcpTool, webMcpSuccess} from './webmcp-envelope';
import {annotateWebMcpTools, createWebMcpTool} from './webmcp-tool';
import {EMPTY_WEBMCP_INPUT_SCHEMA} from './webmcp-schema';
import {z} from 'zod';

const CAPABILITIES_INPUT_SCHEMA = z.strictObject({
    area: z.enum(WEBMCP_TOOL_AREAS as [TWebMcpToolArea, ...TWebMcpToolArea[]]).optional(),
});

export function buildWebMcpContextTools({
    getContextSource,
    getCapabilitySource,
    catalog,
    getCatalog,
}: {
    getContextSource: () => TWebMcpContextSource;
    getCapabilitySource: () => TWebMcpCapabilitySource;
    /** The exact domain-tool catalog registered in the current application state. */
    catalog?: readonly TWebMcpToolDescriptor[];
    getCatalog?: () => readonly TWebMcpToolDescriptor[];
}): TWebMcpTool[] {
    return annotateWebMcpTools(
        [
            createWebMcpTool({
                name: 'lopaka_get_context',
                title: 'Get Lopaka context',
                description: 'Get the active Lopaka editor context, target platform, display size, and editability.',
                inputSchema: EMPTY_WEBMCP_INPUT_SCHEMA,
                annotations: {readOnlyHint: true, untrustedContentHint: true},
                handler: () => {
                    const context = describeWebMcpContext(getContextSource());
                    return webMcpSuccess(context, {contextId: context.contextId});
                },
            }),
            createWebMcpTool({
                name: 'lopaka_get_capabilities',
                title: 'Get Lopaka capabilities',
                description:
                    'Get the Lopaka tools available in the active context, creatable layer types with exact creation properties, input limits, and excluded operations.',
                inputSchema: CAPABILITIES_INPUT_SCHEMA,
                annotations: {readOnlyHint: true},
                handler: ({area}) => {
                    const context = getContextSource();
                    const activeCatalog = getCatalog?.() ?? catalog ?? [];
                    return webMcpSuccess(
                        describeWebMcpCapabilities(context, getCapabilitySource(), area, activeCatalog),
                        {
                            contextId: buildWebMcpContextId(context),
                        }
                    );
                },
            }),
        ],
        {area: 'context', mutating: false}
    );
}
