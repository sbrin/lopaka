import {isProxy, toRaw} from 'vue';
import {getFont} from '../../draw/fonts';
import {packImage, unpackImage} from '../../utils';
import {Point} from '../point';
import {Font} from '../../draw/fonts/font';

export const fieldsMap = new Map<string, Map<string, TLayerFieldOptions>>();

export type TLayerMappingType = 'point' | 'image' | 'font' | 'rect' | 'any';

export type TLayerFieldOptions = {
    name: string;
    alias: string;
    type: TLayerMappingType;
    skip: boolean;
};

export function mapping(alias: string, type: TLayerMappingType = 'any', skip: boolean = false) {
    return function actualDecorator(target: any, name: string) {
        const c = target.constructor.name;
        if (!fieldsMap.has(c)) {
            fieldsMap.set(c, new Map());
        }
        fieldsMap.get(c).set(name, {name, alias, type, skip});
    };
}

function getFields(target: any) {
    const fields = new Map<string, TLayerFieldOptions>();
    let proto = target;
    if (isProxy(proto)) {
        proto = toRaw(proto);
    }
    while (proto) {
        const protoFields = fieldsMap.get(proto.name);
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
    const fields = getFields(target.constructor);
    const state = {};
    for (const [fieldName, options] of fields) {
        if (options.skip) {
            continue;
        }
        const name = options.alias ?? options.name;
        switch (options.type) {
            case 'point':
                state[name] = [target[fieldName].x, target[fieldName].y];
                break;
            case 'image':
                state[name] = target[fieldName] ? packImage(target[fieldName]) : null;
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
    const fields = getFields(target.constructor);
    for (const [fieldName, options] of fields) {
        if (options.name === 'type') {
            continue;
        }
        const name = options.alias ?? options.name;
        if (state[name] === undefined) {
            continue;
        }
        switch (options.type) {
            case 'point':
                target[fieldName] = state[name] instanceof Point ? state[name].clone() : new Point(state[name]);
                break;
            case 'image':
                target[fieldName] =
                    state[name] instanceof ImageData
                        ? state[name]
                        : unpackImage(state[name], state?.s?.[0] ?? 5, state?.s?.[1] ?? 5);
                break;
            case 'font':
                target[fieldName] = state[name] instanceof Font ? state[name] : getFont(state[name]);
                break;
            default:
                target[fieldName] = state[name];
        }
    }
}

export function paramsToState(params: any, layerClassMap: any) {
    const layerClass = layerClassMap[params.type];
    const fields = getFields(layerClass);
    const state = {};
    for (const [fieldName, options] of fields) {
        const name = options.alias ?? options.name;
        // switch (options.type) {
        //     case 'point':
        //         state[name] = [params[fieldName].x, params[fieldName].y];
        //         break;
        //     case 'image':
        //         state[name] = packImage(params[fieldName]);
        //         break;
        //     case 'font':
        //         state[name] = params[fieldName].name;
        //         break;
        //     default:
        state[name] = params[fieldName];
        // }
    }
    return state;
}

export function getLayerProperties(target: any): any {
    const fields = getFields(target.constructor);
    const properties = {};
    for (const [fieldName, options] of fields) {
        switch (options.type) {
            case 'point':
                properties[fieldName] = target[fieldName].xy;
                break;
            case 'rect':
                properties[fieldName] = [...target[fieldName].xy, ...target[fieldName].wh];
                break;
            case 'image':
                // properties[fieldName] = target[fieldName];
                break;
            case 'font':
                properties[fieldName] = target[fieldName].title ?? target[fieldName].name;
                break;
            default:
                // check if type is number
                if (typeof target[fieldName] === 'number') {
                    properties[fieldName] = Number(target[fieldName]);
                }
                properties[fieldName] = target[fieldName];
        }
    }
    return properties;
}
