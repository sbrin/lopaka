/**
 * Point2d and Rect2d classes
 * author: @deadlink
 */
function isArray(obj: any): boolean {
  return Object.prototype.toString.call(obj) === "[object Array]";
}
const x: symbol = Symbol("x");
const y: symbol = Symbol("y");
const pos: symbol = Symbol("pos");
const size: symbol = Symbol("size");
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
    return this.clone().divide(
      Math.sqrt(this[x] * this[x] + this[y] * this[y])
    );
  }
  boundTo(rect: Rect): Point {
    this[x] = Math.min(Math.max(this[x], rect.x), rect.w);
    this[y] = Math.min(Math.max(this[y], rect.y), rect.h);
    return this;
  }
}

export class Rect {
  constructor();
  constructor(rect: Rect | Point | HTMLElement | SVGRectElement | DOMRect);
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
          this[pos] = new Point(
            args[0].x.baseVal.value,
            args[0].y.baseVal.value
          );
          this[size] = new Point(
            args[0].width.baseVal.value,
            args[0].height.baseVal.value
          );
        } else if (args[0] instanceof DOMRect) {
          this[pos] = new Point(args[0].x, args[0].y);
          this[size] = new Point(args[0].width, args[0].height);
        } else {
          this[pos] = new Point(args[0]);
          this[size] = new Point(args[0]);
        }
      } else {
        this[pos] = new Point(args[0], args[1]);
        this[size] = new Point(args[2], args[3]);
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
    this.calc("add", args);
    return this;
  }
  subtract(v: number): Rect;
  subtract(v: number[]): Rect;
  subtract(x: number, y: number, w?: number, h?: number): Rect;
  subtract(v: Rect): Rect;
  subtract(...args: any[]): Rect {
    this.calc("subtract", args);
    return this;
  }
  multiply(v: number): Rect;
  multiply(v: number[]): Rect;
  multiply(x: number, y: number, w?: number, h?: number): Rect;
  multiply(v: Rect): Rect;
  multiply(...args: any[]): Rect {
    this.calc("multiply", args);
    return this;
  }
  divide(v: number): Rect;
  divide(v: number[]): Rect;
  divide(x: number, y: number, w?: number, h?: number): Rect;
  divide(v: Rect): Rect;
  divide(...args: any[]): Rect {
    this.calc("divide", args);
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
    return (
      point.x > this.x &&
      point.x < this.x + this.w &&
      point.y > this.y &&
      point.y < this.y + this.h
    );
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
}
