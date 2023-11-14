import {DrawContext} from '../../draw/draw-context';
import {generateUID} from '../../utils';
import {Point} from '../point';
import {Rect} from '../rect';
// TODO move type delarations outside of the class
export enum EditMode {
    MOVING,
    RESIZING,
    CREATING,
    DRAWING,
    NONE,
    EMPTY
}
export enum TModifierType {
    'string',
    'number',
    'boolean',
    'font',
    'image'
}
export type TModifierName =
    | 'x'
    | 'y'
    | 'w'
    | 'h'
    | 'radius'
    | 'text'
    | 'font'
    | 'icon'
    | 'x1'
    | 'x2'
    | 'y1'
    | 'y2'
    | 'color'
    | 'image'
    | 'overlay'
    | 'fontSize';

export type TLayerModifier = {
    setValue(value: any): void;
    getValue(): any;
    type: TModifierType;
};

export type TLayerModifiers = Partial<{[key in TModifierName]: TLayerModifier}>;

export type TLayerEditPoint = {
    cursor: 'nwse-resize' | 'nesw-resize' | 'move';
    getRect(): Rect;
    move(point: Point): void;
};

export type TLayerState = {
    t: ELayerType; // type
    n: string; // name
    i: number; // index
    g: number; // group
    u: string; // uid
};

/**
 * Abstract layer class
 */
export abstract class AbstractLayer {
    protected abstract type: ELayerType;
    // OffscreenCanvas where layer is drawn
    protected buffer: OffscreenCanvas = new OffscreenCanvas(0, 0);
    // DrawContext
    protected dc: DrawContext = new DrawContext(this.buffer);
    // Unique id
    protected id: string = '';
    // Is layer visible
    protected isOverlay: boolean = false;
    // current layer state
    protected state: any = {};
    // current edit mode
    protected mode: EditMode = EditMode.EMPTY;
    // history of changing
    protected history: any[] = [];
    // UID
    public uid = generateUID();

    // is layer selected
    public selected: boolean = false;
    // Bounds of the layer
    public bounds: Rect = new Rect();
    // Layer name
    public name: string;
    // Layer index
    public index: number;
    // public group
    public group: number;
    // is layer already added to the session
    public added: boolean = false;
    // is layer resizable
    public resizable: boolean = true;
    // modifiers
    public modifiers: TLayerModifiers;

    public editPoints: TLayerEditPoint[] = [];

    constructor() {}

    // called when layer starts to edit
    abstract startEdit(mode: EditMode, point?: Point, editPoint?: TLayerEditPoint);
    // called when layer is editing
    abstract edit(point: Point, originalEvent?: MouseEvent);
    // called when layer stops to edit
    abstract stopEdit();
    // draw layer
    abstract draw();
    // save layer state
    abstract saveState();
    // load layer state
    abstract loadState(state: any);
    // update layer bounds
    abstract updateBounds(): void;

    /**
     * Check that point inside layer
     * @param point
     * @returns {boolean}
     */
    public contains(point: Point): boolean {
        return this.dc.ctx.isPointInPath(point.x, point.y) || this.dc.ctx.isPointInStroke(point.x, point.y);
    }

    /**
     * Resize buffer to fit display
     * @param display
     * @param scale
     */
    public resize(display: Point, scale: Point): void {
        const {dc, buffer} = this;
        buffer.width = display.x;
        buffer.height = display.y;
        dc.ctx.fillStyle = '#000';
        dc.ctx.strokeStyle = '#000';
        if (this.mode !== EditMode.EMPTY) {
            this.draw();
        }
    }

    /**
     * Get layer buffer
     * @returns {OffscreenCanvas} - buffer
     */
    public getBuffer(): OffscreenCanvas {
        return this.buffer;
    }

    /**
     * Clone this layer as new one
     * @returns copy of the layer
     */
    public clone(): typeof this {
        const cloned = new (this.constructor as any)();
        cloned.loadState(this.state);
        return cloned;
    }

    /**
     * Is layer in resizing mode
     * @param state
     */
    public isResizing(): boolean {
        return this.mode === EditMode.RESIZING;
    }

    /**
     * Is layer in editing mode
     * @returns {boolean}
     */
    public isEditing() {
        return this.mode !== EditMode.NONE;
    }

    public getState(): any {
        return this.state;
    }

    public getType() {
        return this.type;
    }
}
