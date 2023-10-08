/**
 * Rect2d class
 * author: @deadlink
 */
import {Point} from './point';

function isArray(obj: any): boolean {
    return Object.prototype.toString.call(obj) === '[object Array]';
}
const pos: symbol = Symbol('pos');
const size: symbol = Symbol('size');

export class Rect {
    constructor();
    constructor(rect: Rect | Point | Point | HTMLElement | SVGRectElement | DOMRect);
    constructor(position: Point | number[], size: Point | number[]);
    constructor(x: number, y: number, w: number, h: number);
    constructor(...args: any[]) {
        if (args.length) {
            if (args.length == 1) {
                if (args[0] instanceof Rect) {
                    this[pos] = new Point(args[0].xy);
                    this[size] = new Point(args[0].wh);
                } else if (args[0] instanceof Point) {
                    this[pos] = new Point(args[0]);
                    this[size] = new Point(args[0]);
                } else if (isArray(args[0])) {
                    this[pos] = new Point(args[0][0], args[0][1]);
                    this[size] = new Point(args[0][2], args[0][3]);
                } else if (args[0] instanceof HTMLElement) {
                    this[pos] = new Point(args[0].offsetLeft, args[0].offsetTop);
                    this[size] = new Point(args[0].clientWidth, args[0].clientHeight);
                } else if (args[0] instanceof SVGRectElement) {
                    this[pos] = new Point(args[0].x.baseVal.value, args[0].y.baseVal.value);
                    this[size] = new Point(args[0].width.baseVal.value, args[0].height.baseVal.value);
                } else if (args[0] instanceof DOMRect) {
                    this[pos] = new Point(args[0].x, args[0].y);
                    this[size] = new Point(args[0].width, args[0].height);
                } else {
                    this[pos] = new Point(args[0]);
                    this[size] = new Point(args[0]);
                }
            } else if (args.length == 4) {
                this[pos] = new Point(args[0], args[1]);
                this[size] = new Point(args[2], args[3]);
            } else if (args.length == 2) {
                this[pos] = new Point(args[0]);
                this[size] = new Point(args[1]);
            }
        } else {
            this[pos] = new Point(0);
            this[size] = new Point(0);
        }
    }
    get x(): number {
        return this[pos].x;
    }
    set x(v: number) {
        this[pos].x = v;
    }
    get y(): number {
        return this[pos].y;
    }
    set y(v: number) {
        this[pos].y = v;
    }
    get xy(): number[] {
        return this[pos].xy;
    }
    set xy(v: number[]) {
        this[pos].xy = v;
    }
    get w(): number {
        return this[size].x;
    }
    set w(v: number) {
        this[size].x = v;
    }
    get h(): number {
        return this[size].y;
    }
    set h(v: number) {
        this[size].y = v;
    }
    get wh(): number[] {
        return this[size].xy;
    }
    set wh(v: number[]) {
        this[size].xy = v;
    }
    set xw(v: number[]) {
        this[pos].x = v[0];
        this[size].x = v[1];
    }
    get xw(): number[] {
        return [this[pos].x, this[size].x];
    }
    set yh(v: number[]) {
        this[pos].y = v[0];
        this[size].y = v[1];
    }
    get yh(): number[] {
        return [this[pos].y, this[size].y];
    }
    get size(): Point {
        return this[size];
    }
    get pos(): Point {
        return this[pos];
    }
    private calc(operation: string, args: any[]): void {
        let calcFunc: Function = Point.prototype[operation];
        if (args.length == 1) {
            if (args[0] instanceof Rect) {
                calcFunc.apply(this[pos], [args[0].xy]);
                calcFunc.apply(this[size], [args[0].wh]);
            } else if (args[0] instanceof Point) {
                calcFunc.apply(this[pos], [args[0].xy]);
                calcFunc.apply(this[size], [args[0].xy]);
            } else if (isArray(args[0])) {
                calcFunc.apply(this[pos], [args[0][0], args[0][1]]);
                calcFunc.apply(this[size], [args[0][2], args[0][3]]);
            } else {
                calcFunc.apply(this[pos], [args[0]]);
                calcFunc.apply(this[size], [args[0]]);
            }
        } else {
            calcFunc.apply(this[pos], [args[0], args[1]]);
            calcFunc.apply(this[size], [args[2], args[3]]);
        }
    }
    add(v: number): Rect;
    add(v: number[]): Rect;
    add(x: number, y: number, w?: number, h?: number): Rect;
    add(v: Rect): Rect;
    add(...args: any[]): Rect {
        this.calc('add', args);
        return this;
    }
    subtract(v: number): Rect;
    subtract(v: number[]): Rect;
    subtract(x: number, y: number, w?: number, h?: number): Rect;
    subtract(v: Rect): Rect;
    subtract(...args: any[]): Rect {
        this.calc('subtract', args);
        return this;
    }
    multiply(v: number): Rect;
    multiply(v: number[]): Rect;
    multiply(x: number, y: number, w?: number, h?: number): Rect;
    multiply(v: Rect): Rect;
    multiply(...args: any[]): Rect {
        this.calc('multiply', args);
        return this;
    }
    divide(v: number): Rect;
    divide(v: number[]): Rect;
    divide(x: number, y: number, w?: number, h?: number): Rect;
    divide(v: Rect): Rect;
    divide(...args: any[]): Rect {
        this.calc('divide', args);
        return this;
    }
    clone(): Rect {
        return new Rect(this);
    }
    round(): Rect {
        this[pos].round();
        this[size].round();
        return this;
    }
    floor(): Rect {
        this[pos].floor();
        this[size].floor();
        return this;
    }
    ceil(): Rect {
        this[pos].ceil();
        this[size].ceil();
        return this;
    }
    greedyRound(): Rect {
        this[size].ceil();
        this[pos].floor();
        return this;
    }
    contains(point: Point): boolean {
        return point.x > this.x && point.x < this.x + this.w && point.y > this.y && point.y < this.y + this.h;
    }
    intersect(rect: Rect): boolean {
        return !(
            this.x > rect.x + rect.w ||
            this.x + this.w < rect.x ||
            this.y > rect.y + rect.h ||
            this.y + this.h < rect.y
        );
    }
    toPath(): Path2D {
        let path: Path2D = new Path2D();
        path.rect(this.x, this.y, this.w, this.h);
        return path;
    }
    toString(): string {
        return `[${this.x}, ${this.y}, ${this.w}, ${this.h}]`;
    }
    toDOMRect(): DOMRect {
        return new DOMRect(this.x, this.y, this.w, this.h);
    }
    pack(): number[] {
        return [this.x, this.y, this.w, this.h];
    }
    static unpack(v: number[]): Rect {
        return new Rect(v[0], v[1], v[2], v[3]);
    }
}
