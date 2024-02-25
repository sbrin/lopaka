import {getFont} from '../../draw/fonts';
import {packImage, unpackImage} from '../../utils';
import {AbstractLayer} from '../layers/abstract.layer';
import {Point} from '../point';

const fieldsMap = new WeakMap<Function, Map<string, TLayerFieldOptions<any, any>>>();

export type TLayerMappingType = 'point' | 'image' | 'font' | 'any';

export type TLayerFieldOptions<C, T> = {
    name: string;
    alias: string;
    type: TLayerMappingType;
};

export function mapping(alias: string, type: TLayerMappingType = 'any') {
    return function actualDecorator(target: any, name: string) {
        const c = target.constructor;
        if (!fieldsMap.has(c)) {
            fieldsMap.set(c, new Map());
        }
        fieldsMap.get(c).set(name, {name, alias, type});
    };
}

function getFields<T extends AbstractLayer>(target: T) {
    const fields = new Map<string, TLayerFieldOptions<any, any>>();
    let proto = target;
    while (proto) {
        const protoFields = fieldsMap.get(proto.constructor);
        if (protoFields) {
            for (const [name, options] of protoFields) {
                if (!fields.has(name)) {
                    fields.set(name, options);
                }
            }
        }
        proto = Object.getPrototypeOf(proto);
    }
    return fields;
}

export function getState(target: any): any {
    const fields = getFields(target);
    const state = {};
    for (const [fieldName, options] of fields) {
        const name = options.alias ?? options.name;
        switch (options.type) {
            case 'point':
                state[name] = target[fieldName].xy;
                break;
            case 'image':
                state[name] = packImage(target[fieldName]);
                break;
            case 'font':
                state[name] = target[fieldName].name;
                break;
            default:
                state[name] = target[fieldName];
        }
    }
    return state;
}

export function setState(target: any, state: any) {
    const fields = getFields(target);
    for (const [fieldName, options] of fields) {
        const name = options.alias ?? options.name;
        if (state[name] === undefined) {
            continue;
        }
        switch (options.type) {
            case 'point':
                target[fieldName] = new Point(state[name]);
                break;
            case 'image':
                target[fieldName] = unpackImage(state[name], state?.s?.[0] ?? 5, state?.s?.[1] ?? 5);
                break;
            case 'font':
                target[fieldName] = getFont(state[name]);
                break;
            default:
                target[fieldName] = state[name];
        }
    }
}
