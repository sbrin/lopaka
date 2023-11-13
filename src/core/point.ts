import {Rect} from './rect';

/**
 * Point2d class
 * author: @deadlink
 */
function isArray(obj: any): boolean {
    return Object.prototype.toString.call(obj) === '[object Array]';
}
const x: symbol = Symbol('x');
const y: symbol = Symbol('y');
export class Point {
    constructor();
    constructor(point: Point);
    constructor(v: number[]);
    constructor(v: number);
    constructor(x: number, y: number);
    constructor(...args: any[]) {
        if (args.length) {
            if (args.length == 1) {
                if (args[0] instanceof Point) {
                    this[x] = args[0].x;
                    this[y] = args[0].y;
                } else if (isArray(args[0])) {
                    this[x] = args[0][0];
                    this[y] = args[0][1];
                } else {
                    this[x] = args[0];
                    this[y] = args[0];
                }
            } else {
                this[x] = args[0];
                this[y] = args[1];
            }
        } else {
            this.xy = [0, 0];
        }
    }
    get x(): number {
        return this[x];
    }
    set x(v: number) {
        this[x] = v;
    }
    get y(): number {
        return this[y];
    }
    set y(v: number) {
        this[y] = v;
    }
    get xy(): number[] {
        return [this[x], this[y]];
    }
    set xy(v: number[]) {
        this[x] = v[0];
        this[y] = v[1];
    }
    add(v: number): Point;
    add(v: number[]): Point;
    add(x: number, y: number): Point;
    add(v: Point): Point;
    add(...args: any[]): Point {
        if (args.length == 1) {
            if (args[0] instanceof Point) {
                this[x] += args[0].x;
                this[y] += args[0].y;
            } else if (isArray(args[0])) {
                this[x] += args[0][0];
                this[y] += args[0][1];
            } else {
                this[x] += args[0];
                this[y] += args[0];
            }
        } else {
            this[x] += args[0];
            this[y] += args[1];
            return this;
        }
        return this;
    }
    subtract(v: number): Point;
    subtract(v: number[]): Point;
    subtract(x: number, y: number): Point;
    subtract(v: Point): Point;
    subtract(...args: any[]): Point {
        if (args.length == 1) {
            if (args[0] instanceof Point) {
                this[x] -= args[0].x;
                this[y] -= args[0].y;
            } else if (isArray(args[0])) {
                this[x] -= args[0][0];
                this[y] -= args[0][1];
            } else {
                this[x] -= args[0];
                this[y] -= args[0];
            }
        } else {
            this[x] -= args[0];
            this[y] -= args[1];
            return this;
        }
        return this;
    }
    multiply(v: number): Point;
    multiply(v: number[]): Point;
    multiply(x: number, y: number): Point;
    multiply(v: Point): Point;
    multiply(...args: any[]): Point {
        if (args.length == 1) {
            if (args[0] instanceof Point) {
                this[x] *= args[0].x;
                this[y] *= args[0].y;
            } else if (isArray(args[0])) {
                this[x] *= args[0][0];
                this[y] *= args[0][1];
            } else {
                this[x] *= args[0];
                this[y] *= args[0];
            }
        } else {
            this[x] *= args[0];
            this[y] *= args[1];
            return this;
        }
        return this;
    }
    divide(v: number): Point;
    divide(v: number[]): Point;
    divide(x: number, y: number): Point;
    divide(v: Point): Point;
    divide(...args: any[]): Point {
        if (args.length == 1) {
            if (args[0] instanceof Point) {
                this[x] /= args[0].x;
                this[y] /= args[0].y;
            } else if (isArray(args[0])) {
                this[x] /= args[0][0];
                this[y] /= args[0][1];
            } else {
                this[x] /= args[0];
                this[y] /= args[0];
            }
        } else {
            this[x] /= args[0];
            this[y] /= args[1];
            return this;
        }
        return this;
    }
    min(point: Point): Point {
        return new Point(Math.min(this[x], point.x), Math.min(this[y], point.y));
    }
    max(point: Point): Point {
        return new Point(Math.max(this[x], point.x), Math.max(this[y], point.y));
    }
    abs(): Point {
        this[x] = Math.abs(this[x]);
        this[y] = Math.abs(this[y]);
        return this;
    }
    clone(): Point {
        return new Point(this);
    }
    round(): Point {
        this[x] = Math.round(this[x]);
        this[y] = Math.round(this[y]);
        return this;
    }
    floor(): Point {
        this[x] = Math.floor(this[x]);
        this[y] = Math.floor(this[y]);
        return this;
    }
    ceil(): Point {
        this[x] = Math.ceil(this[x]);
        this[y] = Math.ceil(this[y]);
        return this;
    }
    distanceTo(p: Point): number {
        return Math.hypot(this.x - p.x, this.y - p.y);
    }
    normalize(): Point {
        return this.clone().divide(Math.sqrt(this[x] * this[x] + this[y] * this[y]));
    }
    boundTo(rect: Rect): Point {
        this[x] = Math.min(Math.max(this[x], rect.x), rect.w);
        this[y] = Math.min(Math.max(this[y], rect.y), rect.h);
        return this;
    }
    equals(p: Point): boolean {
        return this[x] == p.x && this[y] == p.y;
    }
    toString(): string {
        return this.xy.join(',');
    }
    static fromString(str: string): Point {
        const [x, y] = str.split(',').map((n) => parseInt(n));
        return new Point(x, y);
    }
}
