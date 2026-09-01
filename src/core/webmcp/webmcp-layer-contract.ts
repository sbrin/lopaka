import {TModifierType, type TLayerModifier} from '../layers/abstract.layer';
import {isLayerPropertySupported} from '../layer-property-capabilities';
import type {TPlatformFeatures} from '../../platforms/platform';
import {z, type ZodTypeAny} from 'zod';

const MAX_CONTEXT_ID_LENGTH = 256;
const MAX_TEXT_LENGTH = 1024;
const MAX_COLOR_LENGTH = 32;
const MAX_FONT_NAME_LENGTH = 64;
const COORDINATE_LIMIT = 10000;
const MIN_POLYGON_VERTICES = 3;
const MAX_POLYGON_VERTICES = 64;
const TRIANGLE_VERTICES = 3;

export type TWebMcpCreationGeometry =
    | 'bounded'
    | 'widget'
    | 'line'
    | 'triangle'
    | 'vertices'
    | 'point'
    | 'radial'
    | 'placement';

export type TWebMcpLayerContractOptions = {
    platformId?: string;
    features?: Partial<TPlatformFeatures>;
    paintColorMode?: 'rgb' | 'monochrome';
};

type TContractProperty = {
    schema: ZodTypeAny;
    modifier: Pick<TLayerModifier, 'type' | 'fixed' | 'nullable'>;
};

export type TWebMcpLayerContract = {
    geometry: TWebMcpCreationGeometry;
    properties: readonly string[];
};

export type TWebMcpCreationProperty = Record<string, unknown>;

function layerTypeSupported(type: string, options: TWebMcpLayerContractOptions): boolean {
    // Every contract type in this editor is available on every platform; the
    // per-property rules below still narrow what each platform accepts.
    return true;
}

const coordinate = z.number().finite().min(-COORDINATE_LIMIT).max(COORDINATE_LIMIT);
const nonNegative = z.number().finite().min(0).max(COORDINATE_LIMIT);
const text = z.string().max(MAX_TEXT_LENGTH);
const color = z.string().min(1).max(MAX_COLOR_LENGTH);
const font = z.string().min(1).max(MAX_FONT_NAME_LENGTH);
const point = z.strictObject({x: coordinate, y: coordinate});

const PROPERTY_DEFINITIONS: Record<string, TContractProperty> = {
    radius: {schema: nonNegative, modifier: {type: TModifierType.number}},
    fill: {schema: z.boolean(), modifier: {type: TModifierType.boolean}},
    inverted: {schema: z.boolean(), modifier: {type: TModifierType.boolean}},
    borderWidth: {schema: nonNegative, modifier: {type: TModifierType.number}},
    rotation: {schema: coordinate, modifier: {type: TModifierType.number}},
    width: {schema: nonNegative, modifier: {type: TModifierType.number}},
    value: {schema: z.number().finite().min(0).max(100), modifier: {type: TModifierType.number}},
    overlay: {schema: z.boolean(), modifier: {type: TModifierType.boolean}},
    alphaChannel: {schema: z.boolean(), modifier: {type: TModifierType.boolean}},
    checked: {schema: z.boolean(), modifier: {type: TModifierType.boolean}},
    text: {schema: text, modifier: {type: TModifierType.string}},
    font: {schema: font, modifier: {type: TModifierType.font}},
    color: {schema: color, modifier: {type: TModifierType.color}},
    backgroundColor: {schema: color, modifier: {type: TModifierType.color, nullable: true}},
    borderColor: {schema: color, modifier: {type: TModifierType.color, nullable: true}},
};

/**
 * Creation geometry is adapter vocabulary. Property names are the modifier
 * vocabulary shared with layer editing, except for width/height aliases used
 * by bounded creation and widget sizing.
 */
export const WEBMCP_LAYER_CONTRACTS: Record<string, TWebMcpLayerContract> = {
    rect: {geometry: 'bounded', properties: ['color', 'radius', 'fill', 'inverted']},
    panel: {geometry: 'bounded', properties: ['radius', 'borderWidth', 'backgroundColor', 'borderColor']},
    ellipse: {geometry: 'bounded', properties: ['color', 'fill', 'inverted']},
    paint: {geometry: 'placement', properties: ['color', 'overlay', 'alphaChannel', 'inverted']},
    button: {geometry: 'widget', properties: ['color', 'radius', 'text', 'backgroundColor', 'font']},
    switch: {geometry: 'widget', properties: ['color', 'backgroundColor', 'checked']},
    slider: {geometry: 'widget', properties: ['color']},
    checkbox: {
        geometry: 'placement',
        properties: ['color', 'text', 'font', 'backgroundColor', 'borderColor', 'checked'],
    },
    textarea: {
        geometry: 'bounded',
        properties: ['color', 'radius', 'borderWidth', 'backgroundColor', 'borderColor', 'text', 'font'],
    },
    circle: {geometry: 'radial', properties: ['color', 'radius', 'fill', 'inverted']},
    line: {geometry: 'line', properties: ['color', 'inverted']},
    triangle: {geometry: 'triangle', properties: ['color', 'fill', 'inverted']},
    polygon: {geometry: 'vertices', properties: ['color', 'inverted']},
    string: {
        geometry: 'point',
        properties: ['color', 'text', 'font', 'inverted'],
    },
};

const GEOMETRY_PROPERTIES: Record<TWebMcpCreationGeometry, Record<string, ZodTypeAny>> = {
    bounded: {x: coordinate, y: coordinate, width: nonNegative, height: nonNegative},
    widget: {x: coordinate, y: coordinate, width: nonNegative, height: nonNegative},
    placement: {x: coordinate, y: coordinate},
    line: {x1: coordinate, y1: coordinate, x2: coordinate, y2: coordinate},
    triangle: {
        x1: coordinate,
        y1: coordinate,
        x2: coordinate,
        y2: coordinate,
        x3: coordinate,
        y3: coordinate,
        vertices: z.array(point).min(TRIANGLE_VERTICES).max(TRIANGLE_VERTICES),
    },
    vertices: {vertices: z.array(point).min(MIN_POLYGON_VERTICES).max(MAX_POLYGON_VERTICES)},
    point: {x: coordinate, y: coordinate},
    radial: {x: coordinate, y: coordinate, radius: nonNegative},
};

export function creationGeometryFields(type: string): Set<string> {
    const contract = WEBMCP_LAYER_CONTRACTS[type] ?? {geometry: 'bounded' as const, properties: []};
    return new Set(Object.keys(GEOMETRY_PROPERTIES[contract.geometry]));
}

/** Convert creation aliases to the modifier names consumed by EditorActions. */
export function creationPropertyPatch(type: string, value: Record<string, unknown>): Record<string, unknown> {
    const geometry = creationGeometryFields(type);
    const patch: Record<string, unknown> = {};
    Object.entries(value).forEach(([name, fieldValue]) => {
        if (name === 'contextId' || name === 'type' || geometry.has(name)) return;
        patch[name] = fieldValue;
    });
    const contract = WEBMCP_LAYER_CONTRACTS[type];
    if (contract?.geometry === 'radial' && value.radius !== undefined) {
        patch.radius = value.radius;
    }
    if (contract?.geometry === 'widget') {
        if (value.width !== undefined) patch.w = value.width;
        if (value.height !== undefined) patch.h = value.height;
    }
    return patch;
}

function propertySupported(name: string, type: string, options: TWebMcpLayerContractOptions): boolean {
    const definition = PROPERTY_DEFINITIONS[name];
    if (!definition || definition.modifier.fixed) return false;
    if (name === 'fontSize') return false;
    return isLayerPropertySupported({
        name,
        modifier: {getValue: () => undefined, ...definition.modifier},
        platformId: options.platformId,
        layerType: type,
        features: options.features,
        paintColorMode: options.paintColorMode,
    });
}

function fieldsForContract(type: string, options: TWebMcpLayerContractOptions): Record<string, ZodTypeAny> {
    const contract = WEBMCP_LAYER_CONTRACTS[type] ?? {geometry: 'bounded', properties: []};
    const fields: Record<string, ZodTypeAny> = {
        ...GEOMETRY_PROPERTIES[contract.geometry],
        name: z.string().min(1).max(MAX_TEXT_LENGTH),
    };
    contract.properties.forEach((name) => {
        if (propertySupported(name, type, options)) fields[name] = PROPERTY_DEFINITIONS[name].schema;
    });
    return fields;
}

function optionalObject(fields: Record<string, ZodTypeAny>): z.ZodObject<Record<string, ZodTypeAny>> {
    return z.strictObject(
        Object.fromEntries(Object.entries(fields).map(([name, schema]) => [name, schema.optional()]))
    ) as z.ZodObject<Record<string, ZodTypeAny>>;
}

export function layerContractFields(
    type: string,
    options: TWebMcpLayerContractOptions = {}
): Record<string, ZodTypeAny> {
    return fieldsForContract(type, options);
}

/** Exact active-platform schema shown to the browser agent. */
export function buildWebMcpCreateLayerSchema(
    supportedTypes: string[],
    options: TWebMcpLayerContractOptions = {}
): z.ZodType<Record<string, unknown>> {
    const branches = supportedTypes
        .filter((type) => WEBMCP_LAYER_CONTRACTS[type] && layerTypeSupported(type, options))
        .map((type) =>
            z.strictObject({
                contextId: z.string().min(1).max(MAX_CONTEXT_ID_LENGTH),
                type: z.literal(type),
                ...optionalObject(fieldsForContract(type, options)).shape,
            })
        );
    if (branches.length === 0) {
        return z.strictObject({
            contextId: z.string().min(1).max(MAX_CONTEXT_ID_LENGTH),
            type: z.string().min(1).max(MAX_FONT_NAME_LENGTH),
        }) as z.ZodType<Record<string, unknown>>;
    }
    const [first, ...rest] = branches;
    return z.discriminatedUnion('type', [first, ...rest]) as z.ZodType<Record<string, unknown>>;
}

/** Runtime superset used to preserve explicit unsupported-platform errors. */
export function buildWebMcpLayerValidationSchema(): z.ZodType<Record<string, unknown>> {
    const fields: Record<string, ZodTypeAny> = {
        contextId: z.string().min(1).max(MAX_CONTEXT_ID_LENGTH),
        type: z.string().min(1).max(MAX_FONT_NAME_LENGTH),
        name: z.string().min(1).max(MAX_TEXT_LENGTH).optional(),
    };
    Object.values(GEOMETRY_PROPERTIES).forEach((geometry) =>
        Object.entries(geometry).forEach(([name, schema]) => {
            fields[name] = fields[name] ?? schema.optional();
        })
    );
    // The broad validator must accept polygon-sized vertex lists; the active
    // discriminated schema narrows triangles back to exactly three vertices.
    fields.vertices = z.array(point).min(MIN_POLYGON_VERTICES).max(MAX_POLYGON_VERTICES).optional();
    Object.entries(PROPERTY_DEFINITIONS).forEach(([name, {schema}]) => {
        fields[name] = fields[name] ?? schema.optional();
    });
    return z.strictObject(fields) as z.ZodType<Record<string, unknown>>;
}

function withoutSchema(value: Record<string, unknown>): Record<string, unknown> {
    const copy = {...value};
    delete copy.$schema;
    return copy;
}

/** Exact per-type capability data generated from the same field schemas. */
export function describeWebMcpCreationContracts(
    supportedTypes: string[],
    options: TWebMcpLayerContractOptions = {}
): {type: string; creationProperties: Record<string, TWebMcpCreationProperty>}[] {
    return supportedTypes
        .filter((type) => WEBMCP_LAYER_CONTRACTS[type] && layerTypeSupported(type, options))
        .map((type) => {
            const properties = fieldsForContract(type, options);
            return {
                type,
                creationProperties: Object.fromEntries(
                    Object.entries(properties).map(([name, schema]) => [
                        name,
                        withoutSchema(z.toJSONSchema(schema, {target: 'draft-7'}) as Record<string, unknown>),
                    ])
                ),
            };
        });
}
