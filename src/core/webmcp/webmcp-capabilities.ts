/**
 * Capability description for the agent.
 *
 * The editor is a single context, so every registered tool is advertised. What
 * varies is the layer vocabulary: creatable types and their properties come
 * from the active platform rather than a static list that could drift from the
 * editor UI.
 */

import {TWebMcpContextSource} from './webmcp-context';
import type {TWebMcpTool} from './webmcp-envelope';
import {describeWebMcpCreationContracts} from './webmcp-layer-contract';
import type {TPlatformFeatures} from '/src/platforms/platform';

export type TWebMcpToolArea =
    | 'context'
    | 'read-model'
    | 'layer-organization'
    | 'layer-creation'
    | 'layer-editing'
    | 'asset-library'
    | 'screen-setup';

export const WEBMCP_TOOL_AREAS: readonly TWebMcpToolArea[] = [
    'context',
    'read-model',
    'layer-organization',
    'layer-creation',
    'layer-editing',
    'asset-library',
    'screen-setup',
];

/** Conservative per-call bound for identifier arrays in mutation tools. */
export const WEBMCP_MAX_IDENTIFIERS_PER_CALL = 100;

/**
 * Operations the editor deliberately does not expose. Stated positively to the
 * agent so it stops proposing them instead of retrying.
 */
export const WEBMCP_EXCLUSIONS: readonly string[] = [
    'Cutting, duplicating, pasting, or merging layers',
    'Undo and redo, which remain user-only',
    'Clearing the whole screen',
    'Importing a new image file, which uses the editor import workflow',
    'Fetching an agent-selected URL or opening a file picker',
    'Exporting, downloading, copying to clipboard, Web Serial, or fullscreen',
];

export type TWebMcpToolDescriptor = {
    name: string;
    area: TWebMcpToolArea;
    mutating: boolean;
};

/** Build the capability catalog from the definitions that will be registered. */
export function buildWebMcpToolCatalog(
    tools: readonly Pick<TWebMcpTool, 'name' | 'area' | 'mutating' | 'annotations'>[]
): TWebMcpToolDescriptor[] {
    return tools.flatMap((tool) =>
        tool.area
            ? [
                  {
                      name: tool.name,
                      area: tool.area as TWebMcpToolArea,
                      mutating: tool.mutating ?? !tool.annotations.readOnlyHint,
                  },
              ]
            : []
    );
}

/**
 * The editor advertises one tool set. This stays a function of the context so
 * a caller cannot accidentally read a catalog captured at registration time.
 */
export function selectWebMcpToolsForContext(
    _source: TWebMcpContextSource,
    catalog: readonly TWebMcpToolDescriptor[]
): TWebMcpToolDescriptor[] {
    return [...catalog];
}

export function selectWebMcpToolNamesForContext(
    source: TWebMcpContextSource,
    area: TWebMcpToolArea | undefined,
    catalog: readonly TWebMcpToolDescriptor[]
): string[] {
    return selectWebMcpToolsForContext(source, catalog)
        .filter((tool) => !area || tool.area === area)
        .map((tool) => tool.name);
}

export type TWebMcpLayerTypeCapability = {
    type: string;
    creationProperties: Record<string, Record<string, unknown>>;
};

export type TWebMcpCapabilities = {
    editable: boolean;
    platform: string | null;
    tools: string[];
    layerTypes: TWebMcpLayerTypeCapability[];
    limits: {maxIdentifiersPerCall: number};
    exclusions: string[];
};

export type TWebMcpCapabilitySource = {
    platform: string | null;
    display: {x: number; y: number};
    /** Layer type names the active platform can create, in catalog order. */
    creatableLayerTypes: string[];
    features?: Partial<TPlatformFeatures>;
    paintColorMode?: 'rgb' | 'monochrome';
};

/**
 * Creatable layer types come from the active platform's WebMCP creation tools
 * rather than a duplicated static list that could drift from the editor.
 */
export function describeWebMcpCapabilities(
    contextSource: TWebMcpContextSource,
    capabilitySource: TWebMcpCapabilitySource,
    area: TWebMcpToolArea | undefined,
    catalog: readonly TWebMcpToolDescriptor[]
): TWebMcpCapabilities {
    return {
        editable: true,
        platform: capabilitySource.platform,
        tools: selectWebMcpToolNamesForContext(contextSource, area, catalog),
        layerTypes: describeWebMcpCreationContracts(capabilitySource.creatableLayerTypes, {
            platformId: capabilitySource.platform ?? undefined,
            features: capabilitySource.features,
            paintColorMode: capabilitySource.paintColorMode,
        }),
        limits: {maxIdentifiersPerCall: WEBMCP_MAX_IDENTIFIERS_PER_CALL},
        exclusions: [...WEBMCP_EXCLUSIONS],
    };
}
