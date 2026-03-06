import {describe, expect, it, vi, beforeEach} from 'vitest';
import {mapping, getState, setState, fieldsMap, getLayerProperties} from './mapping';
import {Point} from '../point';

// Mock dependencies
vi.mock('vue', () => ({
    isProxy: vi.fn(() => false),
    toRaw: vi.fn((obj) => obj),
}));

vi.mock('../../draw/fonts', () => ({
    getFont: vi.fn((name) => ({name, title: `Font ${name}`})),
}));

vi.mock('../../utils', () => ({
    packImage: vi.fn((img) => `packed:${img.data}`),
    unpackImage: vi.fn((data, w, h) => ({data: data.replace('packed:', ''), width: w, height: h})),
}));

describe('mapping decorator', () => {
    beforeEach(() => {
        fieldsMap.clear();
    });

    describe('@mapping decorator', () => {
        it('should register field mapping', () => {
            class TestClass {
                @mapping('x', 'any')
                public xValue: number = 10;
            }

            const fields = fieldsMap.get('TestClass');
            expect(fields).toBeDefined();
            expect(fields!.has('xValue')).toBe(true);

            const field = fields!.get('xValue');
            expect(field).toEqual({
                name: 'xValue',
                alias: 'x',
                type: 'any',
                skip: false,
            });
        });

        it('should register field with default type', () => {
            class TestClass {
                @mapping('val')
                public value: string = 'test';
            }

            const field = fieldsMap.get('TestClass')!.get('value');
            expect(field!.type).toBe('any');
        });

        it('should register field with skip flag', () => {
            class TestClass {
                @mapping('skip', 'any', true)
                public skipField: any = null;
            }

            const field = fieldsMap.get('TestClass')!.get('skipField');
            expect(field!.skip).toBe(true);
        });
    });

    describe('getState', () => {
        it('should serialize basic field types', () => {
            class TestClass {
                @mapping('s')
                public stringField: string = 'hello';

                @mapping('n')
                public numberField: number = 42;

                @mapping('b')
                public booleanField: boolean = true;
            }

            const instance = new TestClass();
            const state = getState(instance);

            expect(state).toEqual({
                s: 'hello',
                n: 42,
                b: true,
            });
        });

        it('should serialize Point fields', () => {
            class TestClass {
                @mapping('pos', 'point')
                public position: Point = new Point(10, 20);
            }

            const instance = new TestClass();
            const state = getState(instance);

            expect(state).toEqual({
                pos: [10, 20],
            });
        });

        it('should serialize image fields', () => {
            class TestClass {
                @mapping('img', 'image')
                public image: any = {data: 'imageData'};
            }

            const instance = new TestClass();
            const state = getState(instance);

            expect(state).toEqual({
                img: 'packed:imageData',
            });
        });

        it('should serialize font fields', () => {
            class TestClass {
                @mapping('f', 'font')
                public font: any = {name: 'Arial'};
            }

            const instance = new TestClass();
            const state = getState(instance);

            expect(state).toEqual({
                f: 'Arial',
            });
        });

        it('should skip fields marked as skip', () => {
            class TestClass {
                @mapping('include')
                public includedField: string = 'included';

                @mapping('skip', 'any', true)
                public skippedField: string = 'skipped';
            }

            const instance = new TestClass();
            const state = getState(instance);

            expect(state).toEqual({
                include: 'included',
            });
            expect(state).not.toHaveProperty('skip');
        });

        it('should handle null image fields', () => {
            class TestClass {
                @mapping('img', 'image')
                public image: any = null;
            }

            const instance = new TestClass();
            const state = getState(instance);

            expect(state).toEqual({
                img: null,
            });
        });
    });

    describe('setState', () => {
        it('should deserialize basic field types', () => {
            class TestClass {
                @mapping('s')
                public stringField: string = '';

                @mapping('n')
                public numberField: number = 0;

                @mapping('b')
                public booleanField: boolean = false;
            }

            const instance = new TestClass();
            setState(instance, {
                s: 'hello',
                n: 42,
                b: true,
            });

            expect(instance.stringField).toBe('hello');
            expect(instance.numberField).toBe(42);
            expect(instance.booleanField).toBe(true);
        });

        it('should deserialize Point fields from array', () => {
            class TestClass {
                @mapping('pos', 'point')
                public position: Point = new Point();
            }

            const instance = new TestClass();
            setState(instance, {pos: [15, 25]});

            expect(instance.position).toBeInstanceOf(Point);
            expect(instance.position.xy).toEqual([15, 25]);
        });

        it('should deserialize Point fields from Point instance', () => {
            class TestClass {
                @mapping('pos', 'point')
                public position: Point = new Point();
            }

            const instance = new TestClass();
            const point = new Point(30, 40);
            setState(instance, {pos: point});

            expect(instance.position).toBeInstanceOf(Point);
            expect(instance.position.xy).toEqual([30, 40]);
            expect(instance.position).not.toBe(point); // Should be cloned
        });

        it('should skip type field during setState', () => {
            class TestClass {
                @mapping('t')
                public type: string = 'original';
            }

            const instance = new TestClass();
            setState(instance, {t: 'changed'});

            expect(instance.type).toBe('original'); // Should not change
        });

        it('should skip undefined values', () => {
            class TestClass {
                @mapping('val')
                public value: string = 'original';
            }

            const instance = new TestClass();
            setState(instance, {otherField: 'test'});

            expect(instance.value).toBe('original');
        });
    });

    describe('getLayerProperties', () => {
        it('should extract properties for display', () => {
            class TestClass {
                @mapping('s')
                public stringProp: string = 'test';

                @mapping('n')
                public numberProp: number = 42;

                @mapping('pos', 'point')
                public position: Point = new Point(10, 20);

                @mapping('bounds', 'rect')
                public rect: any = {xy: [0, 0], wh: [100, 50]};

                @mapping('f', 'font')
                public font: any = {name: 'Arial', title: 'Arial Font'};
            }

            const instance = new TestClass();
            const properties = getLayerProperties(instance);

            expect(properties.stringProp).toBe('test');
            expect(properties.numberProp).toBe(42);
            expect(properties.position).toEqual([10, 20]);
            expect(properties.rect).toEqual([0, 0, 100, 50]);
            expect(properties.font).toBe('Arial Font');
        });

        it('should handle font without title', () => {
            class TestClass {
                @mapping('f', 'font')
                public font: any = {name: 'Arial'};
            }

            const instance = new TestClass();
            const properties = getLayerProperties(instance);

            expect(properties.font).toBe('Arial');
        });
    });

    describe('inheritance', () => {
        it('should handle fields from parent classes', () => {
            class ParentClass {
                @mapping('parent')
                public parentField: string = 'parent';
            }

            class ChildClass extends ParentClass {
                @mapping('child')
                public childField: string = 'child';
            }

            const instance = new ChildClass();
            const state = getState(instance);

            expect(state).toEqual({
                parent: 'parent',
                child: 'child',
            });
        });

        it('should not override child fields with parent fields', () => {
            class ParentClass {
                @mapping('field')
                public field: string = 'parent';
            }

            class ChildClass extends ParentClass {
                @mapping('field')
                public field: string = 'child';
            }

            const instance = new ChildClass();
            const state = getState(instance);

            expect(state).toEqual({
                field: 'child',
            });
        });
    });
});
