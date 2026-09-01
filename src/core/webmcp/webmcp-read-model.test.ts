import {describe, expect, it, vi} from 'vitest';
import {
    describeWebMcpGeneratedCode,
    describeWebMcpLayer,
    describeWebMcpLayerDetail,
    describeWebMcpLayerProperties,
    describeWebMcpScreenSummary,
    findWebMcpLayer,
    serializeWebMcpBounds,
    WEBMCP_LAYER_ACTIONS,
} from './webmcp-read-model';
import {RectangleLayer} from '../layers/rectangle.layer';
import {TModifierType} from '../layers/abstract.layer';
import {Point} from '../point';
import {U8g2Platform} from '/src/platforms/u8g2';

const rendererStub = {
    drawRect: vi.fn(),
    drawRoundedRect: vi.fn(),
    setDrawContext: vi.fn(),
};

const featuresStub = {
    hasRGBSupport: true,
    hasIndexedColors: false,
    hasInvertedColors: true,
    hasRoundCorners: true,
    defaultColor: '#00ff00',
};

function createRectangleLayer() {
    const layer = new RectangleLayer(featuresStub as any, rendererStub as any);
    layer.uid = 'rect-1';
    layer.name = 'Frame';
    layer.index = 1;
    layer.position = new Point(4, 8);
    layer.size = new Point(40, 20);
    layer.updateBounds();
    return layer;
}

function fixtureLayer(overrides: Record<string, any> = {}) {
    return {
        uid: 'layer-1',
        name: 'Layer 1',
        index: 1,
        hidden: false,
        locked: false,
        getType: () => 'rect',
        ...overrides,
    };
}

describe('serializeWebMcpBounds', () => {
    it('reports usable bounds as an explicit rectangle', () => {
        expect(serializeWebMcpBounds({x: 1, y: 2, w: 3, h: 4})).toEqual({x: 1, y: 2, width: 3, height: 4});
    });

    it('reports null when a layer has no bounds at all', () => {
        expect(serializeWebMcpBounds(undefined)).toBeNull();
    });

    it('reports null when a bounds component is not a finite number', () => {
        expect(serializeWebMcpBounds({x: 0, y: 0, w: Number.NaN, h: 4})).toBeNull();
    });
});

describe('describeWebMcpLayerProperties', () => {
    it('describes the real editable properties of a rectangle layer', () => {
        const properties = describeWebMcpLayerProperties(createRectangleLayer() as any);
        const byName = Object.fromEntries(properties.map((property) => [property.name, property]));

        expect(byName.x).toMatchObject({type: 'number', value: 4, editable: true});
        expect(byName.w).toMatchObject({type: 'number', value: 40, editable: true});
        expect(byName.fill).toMatchObject({type: 'boolean', value: false, editable: true});
    });

    it('reports declared numeric constraints', () => {
        const properties = describeWebMcpLayerProperties(
            fixtureLayer({
                modifiers: {
                    value: {
                        getValue: () => 30,
                        setValue: (): void => undefined,
                        type: TModifierType.number,
                        min: 0,
                        max: 100,
                        step: 5,
                    },
                },
            }) as any
        );

        expect(properties).toEqual([
            {name: 'value', type: 'number', value: 30, editable: true, minimum: 0, maximum: 100, step: 5},
        ]);
    });

    it('marks a fixed modifier as not editable', () => {
        const [property] = describeWebMcpLayerProperties(
            fixtureLayer({
                modifiers: {
                    radius: {
                        getValue: () => 2,
                        setValue: (): void => undefined,
                        type: TModifierType.number,
                        fixed: true,
                    },
                },
            }) as any
        );

        expect(property.editable).toBe(false);
    });

    it('reports an image modifier without its pixel buffer', () => {
        const [property] = describeWebMcpLayerProperties(
            fixtureLayer({
                modifiers: {
                    image: {getValue: () => ({data: new Uint8ClampedArray(4)}), type: TModifierType.image},
                },
            }) as any
        );

        expect(property).toEqual({name: 'image', type: 'image', value: null, editable: false});
    });

    it('still reports a property whose value cannot be read', () => {
        const [property] = describeWebMcpLayerProperties(
            fixtureLayer({
                modifiers: {
                    font: {
                        getValue: () => {
                            throw new Error('font is still loading');
                        },
                        type: TModifierType.font,
                    },
                },
            }) as any
        );

        expect(property).toMatchObject({name: 'font', type: 'font', value: null});
    });

    it('reports no properties for a layer without modifiers', () => {
        expect(describeWebMcpLayerProperties(fixtureLayer() as any)).toEqual([]);
    });

    it('filters properties the active platform does not expose', () => {
        const properties = describeWebMcpLayerProperties(
            fixtureLayer({
                getType: () => 'string',
                modifiers: {
                    color: {
                        getValue: () => '#ffffff',
                        setValue: vi.fn(),
                        type: TModifierType.color,
                    },
                    text: {
                        getValue: () => 'Hello',
                        setValue: vi.fn(),
                        type: TModifierType.string,
                    },
                },
            }) as any,
            {platformId: U8g2Platform.id, features: new U8g2Platform().features}
        );

        // U8g2 draws monochrome text, so the color modifier is not offered.
        expect(properties.map(({name}) => name)).toEqual(['text']);
        expect(properties[0]).toMatchObject({value: 'Hello', type: 'string', editable: true});
    });
});

describe('describeWebMcpLayer', () => {
    it('describes identity, placement, group, and state', () => {
        expect(
            describeWebMcpLayer(
                fixtureLayer({
                    uid: 'divider',
                    name: 'Divider',
                    index: 2,
                    group: 'Header',
                    hidden: true,
                    locked: true,
                    selected: true,
                    bounds: {x: 0, y: 32, w: 128, h: 1},
                    getType: () => 'line',
                }) as any
            )
        ).toEqual({
            layerId: 'divider',
            name: 'Divider',
            type: 'line',
            index: 2,
            group: 'Header',
            bounds: {x: 0, y: 32, width: 128, height: 1},
            hidden: true,
            locked: true,
            selected: true,
            properties: [],
        });
    });

    it('reports an ungrouped, unselected layer with explicit null and false values', () => {
        expect(describeWebMcpLayer(fixtureLayer() as any)).toMatchObject({
            group: null,
            selected: false,
            bounds: null,
        });
    });

    it('reports the exact text of a text layer, including an empty string', () => {
        expect(describeWebMcpLayer(fixtureLayer({text: '', getType: () => 'string'}) as any).text).toBe('');
        expect(describeWebMcpLayer(fixtureLayer({text: '24°C', getType: () => 'string'}) as any).text).toBe('24°C');
    });

    it('omits text for a layer that carries none', () => {
        expect(describeWebMcpLayer(fixtureLayer() as any)).not.toHaveProperty('text');
    });
});

describe('describeWebMcpLayerDetail', () => {
    it('reports the release-one layer actions on an editable screen', () => {
        expect(describeWebMcpLayerDetail(fixtureLayer() as any, {editable: true}).actions).toEqual([
            ...WEBMCP_LAYER_ACTIONS,
        ]);
    });

    it('reports no actions on a read-only screen', () => {
        expect(describeWebMcpLayerDetail(fixtureLayer() as any, {editable: false}).actions).toEqual([]);
    });
});

describe('findWebMcpLayer', () => {
    it('finds a layer by its stable identifier', () => {
        const layers = [fixtureLayer({uid: 'a'}), fixtureLayer({uid: 'b'})];

        expect(findWebMcpLayer(layers as any, 'b')?.uid).toBe('b');
    });

    it('reports null for an identifier that is not on the screen', () => {
        expect(findWebMcpLayer([fixtureLayer({uid: 'a'})] as any, 'missing')).toBeNull();
    });
});

describe('describeWebMcpScreenSummary', () => {
    const source = {
        contextId: 'ctx:mount-1:u8g2:128x64',
        platform: 'u8g2',
        display: {x: 128, y: 64},
        background: '#000000',
        layers: [
            fixtureLayer({uid: 'a', index: 1, selected: true}),
            fixtureLayer({uid: 'b', index: 2}),
            fixtureLayer({uid: 'c', index: 3, selected: true}),
        ],
        canUndo: true,
        canRedo: false,
        warnings: ['Animation could not be loaded'],
        infos: ['Screen saved'],
    };

    it('describes the target, geometry, and layer count', () => {
        expect(describeWebMcpScreenSummary(source as any)).toMatchObject({
            platform: 'u8g2',
            width: 128,
            height: 64,
            background: '#000000',
            layerCount: 3,
            contextId: 'ctx:mount-1:u8g2:128x64',
        });
    });

    it('reports the selected layers in stacking order', () => {
        expect(describeWebMcpScreenSummary(source as any).selectedLayerIds).toEqual(['a', 'c']);
    });

    it('reports whether undo and redo are currently available', () => {
        expect(describeWebMcpScreenSummary(source as any)).toMatchObject({canUndo: true, canRedo: false});
    });

    it('reports the current warnings and infos in display order', () => {
        const summary = describeWebMcpScreenSummary(source as any);

        expect(summary.warnings).toEqual(['Animation could not be loaded']);
        expect(summary.infos).toEqual(['Screen saved']);
    });

    it('copies messages so a later editor change does not mutate a returned result', () => {
        const warnings: string[] = [];
        const summary = describeWebMcpScreenSummary({...source, warnings} as any);
        warnings.push('added afterwards');

        expect(summary.warnings).toEqual([]);
    });
});

describe('describeWebMcpGeneratedCode', () => {
    it('maps each generated line to its layer identifier', () => {
        expect(
            describeWebMcpGeneratedCode({
                code: 'void draw() {\n  u8g2.drawBox(10, 4);\n}',
                map: {'rect-1': {line: 1, params: {x: 15, y: 19}}},
            })
        ).toEqual({
            code: 'void draw() {\n  u8g2.drawBox(10, 4);\n}',
            mapping: [
                {
                    layerId: 'rect-1',
                    line: 1,
                    parameters: [
                        {name: 'x', column: 15},
                        {name: 'y', column: 19},
                    ],
                },
            ],
            mappingGranularity: 'line',
        });
    });

    it('reports an empty mapping when the generator produced no annotated layer', () => {
        expect(describeWebMcpGeneratedCode({code: 'u8g2.setFontMode(1);', map: {}})).toMatchObject({
            mapping: [],
            mappingGranularity: 'line',
        });
    });

    it('reports empty code when no platform is selected', () => {
        expect(describeWebMcpGeneratedCode({})).toEqual({code: '', mapping: [], mappingGranularity: 'line'});
    });
});
