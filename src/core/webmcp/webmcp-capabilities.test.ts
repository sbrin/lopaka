import {describe, expect, it} from 'vitest';
import {
    WEBMCP_EXCLUSIONS,
    WEBMCP_MAX_IDENTIFIERS_PER_CALL,
    buildWebMcpToolCatalog,
    describeWebMcpCapabilities,
    selectWebMcpToolNamesForContext,
    type TWebMcpCapabilitySource,
    type TWebMcpToolDescriptor,
} from './webmcp-capabilities';
import type {TWebMcpContextSource} from './webmcp-context';
import platforms from '../platforms';

function createSource(overrides: Partial<TWebMcpContextSource> = {}): TWebMcpContextSource {
    return {
        mountId: 'mount-1',
        platform: 'u8g2',
        displayWidth: 128,
        displayHeight: 64,
        ...overrides,
    };
}

const capabilitySource: TWebMcpCapabilitySource = {
    platform: 'u8g2',
    display: {x: 128, y: 64},
    creatableLayerTypes: ['rect', 'string', 'line'],
    features: platforms.u8g2.features,
};

const catalog: TWebMcpToolDescriptor[] = [
    {name: 'lopaka_get_context', area: 'context', mutating: false},
    {name: 'lopaka_get_capabilities', area: 'context', mutating: false},
    {name: 'lopaka_list_layers', area: 'read-model', mutating: false},
    {name: 'lopaka_reorder_layers', area: 'layer-organization', mutating: true},
];

describe('buildWebMcpToolCatalog', () => {
    it('describes each tool that declares an area', () => {
        const built = buildWebMcpToolCatalog([
            {name: 'lopaka_list_layers', area: 'read-model', mutating: false, annotations: {readOnlyHint: true}},
            {name: 'lopaka_create_layer', area: 'layer-creation', mutating: true, annotations: {readOnlyHint: false}},
        ] as any);

        expect(built).toEqual([
            {name: 'lopaka_list_layers', area: 'read-model', mutating: false},
            {name: 'lopaka_create_layer', area: 'layer-creation', mutating: true},
        ]);
    });

    it('derives the mutating flag from the annotation when it is not declared', () => {
        const built = buildWebMcpToolCatalog([
            {name: 'lopaka_delete_layers', area: 'layer-editing', annotations: {readOnlyHint: false}},
        ] as any);

        expect(built[0].mutating).toBe(true);
    });

    it('omits a tool that declares no area', () => {
        expect(buildWebMcpToolCatalog([{name: 'anonymous', annotations: {readOnlyHint: true}}] as any)).toEqual([]);
    });
});

describe('selectWebMcpToolNamesForContext', () => {
    it('advertises every registered tool, including mutations', () => {
        expect(selectWebMcpToolNamesForContext(createSource(), undefined, catalog)).toEqual([
            'lopaka_get_context',
            'lopaka_get_capabilities',
            'lopaka_list_layers',
            'lopaka_reorder_layers',
        ]);
    });

    it('narrows the advertised tools to one area on request', () => {
        expect(selectWebMcpToolNamesForContext(createSource(), 'context', catalog)).toEqual([
            'lopaka_get_context',
            'lopaka_get_capabilities',
        ]);
    });

    it('reports nothing for an area that has no registered tool', () => {
        expect(selectWebMcpToolNamesForContext(createSource(), 'asset-library', catalog)).toEqual([]);
    });
});

describe('describeWebMcpCapabilities', () => {
    it('reports exact creation properties for each active-platform layer type', () => {
        const capabilities = describeWebMcpCapabilities(createSource(), capabilitySource, undefined, catalog);

        expect(capabilities.editable).toBe(true);
        expect(capabilities.platform).toBe('u8g2');
        expect(capabilities.layerTypes.map(({type}) => type)).toEqual(['rect', 'string', 'line']);
        expect(capabilities.layerTypes[0].creationProperties).toEqual(
            expect.objectContaining({
                x: expect.objectContaining({type: 'number'}),
                y: expect.objectContaining({type: 'number'}),
                width: expect.objectContaining({type: 'number'}),
                height: expect.objectContaining({type: 'number'}),
            })
        );
        expect(capabilities.layerTypes[1].creationProperties).not.toHaveProperty('width');
    });

    it('reports the layer types the active platform supports, not the full catalog', () => {
        const capabilities = describeWebMcpCapabilities(
            createSource(),
            {...capabilitySource, platform: 'micropython', creatableLayerTypes: ['rect', 'circle']},
            undefined,
            catalog
        );

        expect(capabilities.layerTypes.map(({type}) => type)).toEqual(['rect', 'circle']);
    });

    it('states input limits and excluded operations', () => {
        const capabilities = describeWebMcpCapabilities(createSource(), capabilitySource, undefined, catalog);

        expect(capabilities.limits).toEqual({maxIdentifiersPerCall: WEBMCP_MAX_IDENTIFIERS_PER_CALL});
        expect(capabilities.exclusions).toEqual([...WEBMCP_EXCLUSIONS]);
    });

    it('keeps exact creation properties when the display size is not usable', () => {
        const capabilities = describeWebMcpCapabilities(
            createSource(),
            {...capabilitySource, display: {x: Number.NaN, y: -10}},
            undefined,
            catalog
        );

        expect(capabilities.layerTypes[0].creationProperties.x).toMatchObject({type: 'number'});
        expect(capabilities.layerTypes[0].creationProperties.y).toMatchObject({type: 'number'});
    });
});
