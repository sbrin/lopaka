import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {LVGLPlatform} from '/src/platforms/lvgl';
import {TFTeSPIPlatform} from '/src/platforms/tft-espi';
import {U8g2Platform} from '/src/platforms/u8g2';
import platforms from '../platforms';
import {
    buildWebMcpCreateLayerSchema,
    describeWebMcpCreationContracts,
    WEBMCP_LAYER_CONTRACTS,
} from './webmcp-layer-contract';

function branchFor(schema: unknown, type: string): Record<string, any> {
    const json = z.toJSONSchema(schema as any, {target: 'draft-7'}) as any;
    return json.oneOf.find((branch: any) => branch.properties.type.const === type);
}

function fieldsFor(schema: unknown, type: string): Record<string, any> {
    const branch = branchFor(schema, type);
    const {contextId: _contextId, type: _type, ...fields} = branch.properties;
    return fields;
}

describe('WebMCP layer contract matrix', () => {
    it('keeps radial creation geometry free of rectangular extents', () => {
        const schema = buildWebMcpCreateLayerSchema(['circle'], {
            platformId: TFTeSPIPlatform.id,
            features: new TFTeSPIPlatform().features,
        });
        const fields = fieldsFor(schema, 'circle');

        // TFT_eSPI has no inverted-color mode, so that property is not advertised.
        expect(Object.keys(fields)).toEqual(['x', 'y', 'radius', 'name', 'color', 'fill']);
        expect(fields.radius).toMatchObject({type: 'number', minimum: 0});
        expect(fields).not.toHaveProperty('width');
        expect(fields).not.toHaveProperty('height');
    });

    it('omits properties the active platform does not expose', () => {
        const panel = fieldsFor(
            buildWebMcpCreateLayerSchema(['panel'], {
                platformId: LVGLPlatform.id,
                features: new LVGLPlatform().features,
            }),
            'panel'
        );
        expect(panel).not.toHaveProperty('color');
    });

    it('does not advertise fixed checkbox size or paint extents', () => {
        const schema = buildWebMcpCreateLayerSchema(['checkbox', 'paint'], {
            platformId: LVGLPlatform.id,
            features: new LVGLPlatform().features,
            paintColorMode: 'rgb',
        });

        const checkbox = fieldsFor(schema, 'checkbox');
        const paint = fieldsFor(schema, 'paint');
        expect(checkbox).toHaveProperty('x');
        expect(checkbox).toHaveProperty('y');
        expect(checkbox).not.toHaveProperty('width');
        expect(checkbox).not.toHaveProperty('height');
        expect(paint).toHaveProperty('x');
        expect(paint).toHaveProperty('y');
        expect(paint).not.toHaveProperty('width');
        expect(paint).not.toHaveProperty('height');
        expect(paint).not.toHaveProperty('color');

        const monochromePaint = fieldsFor(
            buildWebMcpCreateLayerSchema(['paint'], {
                platformId: U8g2Platform.id,
                features: new U8g2Platform().features,
                paintColorMode: 'monochrome',
            }),
            'paint'
        );
        expect(monochromePaint).toHaveProperty('color');
    });

    it('uses one field schema for capabilities and discriminated creation branches', () => {
        for (const [platformId, platform] of Object.entries(platforms)) {
            const options = {platformId, features: platform.features};
            const schema = buildWebMcpCreateLayerSchema(Object.keys(WEBMCP_LAYER_CONTRACTS), options);
            const capabilities = Object.fromEntries(
                describeWebMcpCreationContracts(Object.keys(WEBMCP_LAYER_CONTRACTS), options).map((entry) => [
                    entry.type,
                    entry.creationProperties,
                ])
            );

            for (const type of Object.keys(capabilities)) {
                const schemaFields = fieldsFor(schema, type);
                const capabilityFields = capabilities[type];
                expect(Object.keys(capabilityFields)).toEqual(Object.keys(schemaFields));
                for (const name of Object.keys(schemaFields)) {
                    expect(capabilityFields[name]).toEqual(schemaFields[name]);
                }
            }
        }
    });

    it('applies platform gates for triangle fill and round corners', () => {
        const micropythonTriangle = fieldsFor(
            buildWebMcpCreateLayerSchema(['triangle'], {
                platformId: 'micropython',
                features: {hasRGBSupport: true},
            }),
            'triangle'
        );
        expect(micropythonTriangle).not.toHaveProperty('fill');

        const tftTriangle = fieldsFor(
            buildWebMcpCreateLayerSchema(['triangle'], {
                platformId: TFTeSPIPlatform.id,
                features: new TFTeSPIPlatform().features,
            }),
            'triangle'
        );
        expect(tftTriangle).toHaveProperty('fill');

        const mono = fieldsFor(
            buildWebMcpCreateLayerSchema(['rect'], {
                platformId: 'micropython',
                features: {hasRoundCorners: false, hasInvertedColors: false},
            }),
            'rect'
        );
        expect(mono).not.toHaveProperty('radius');
        expect(mono).not.toHaveProperty('inverted');
    });
});
