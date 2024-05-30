import {DrawContext} from '../../draw/draw-context';
import {TPlatformFeatures} from '../../platforms/platform';
import {generateUID} from '../../utils';
import {getState, mapping, setState} from '../decorators/mapping';
import {ChangeHistory, useHistory} from '../history';
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
    'image',
    'color'
}
export type TModifierName =
    | 'x'
    | 'y'
    | 'w'
    | 'h'
    | 'radius'
    | 'radiusX'
    | 'radiusY'
    | 'fill'
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
    | 'inverted'
    | 'color'
    | 'fontSize';

export type TLayerModifier = {
    setValue?(value: any): void;
    getValue(): any;
    type: TModifierType;
};

export type TLayerAction = {
    label: string;
    title: string;
    action: () => void;
};

export type TLayerModifiers = Partial<{[key in TModifierName]: TLayerModifier}>;
export type TLayerActions = TLayerAction[];

export type TLayerEditPoint = {
    cursor: 'nwse-resize' | 'nesw-resize' | 'move';
    getRect(): Rect;
    move(point: Point): void;
};

/**
 * Abstract layer class
 */
export abstract class AbstractLayer {
    @mapping('t') protected type: ELayerType;
    // OffscreenCanvas where layer is drawn
    protected buffer: OffscreenCanvas = new OffscreenCanvas(0, 0);
    // DrawContext
    protected dc: DrawContext = new DrawContext(this.buffer);
    // Is layer visible
    protected isOverlay: boolean = false;
    // current layer state
    public get state() {
        return getState(this);
    }
    public set state(state: any) {
        setState(this, state);
        this.onLoadState();
    }
    // current edit mode
    protected mode: EditMode = EditMode.EMPTY;
    // history of changing
    protected history: ChangeHistory = useHistory();
    // UID
    @mapping('u') public uid = generateUID();

    // is layer selected
    public selected: boolean = false;
    // Bounds of the layer
    @mapping('b', 'rect', true)
    public bounds: Rect = new Rect();
    // Layer name
    @mapping('n') public name: string;
    // Layer index
    @mapping('i') public index: number;
    // public group
    @mapping('g') public group: string;
    // color
    @mapping('c') public color: string = '#000000';
    // ibnverted
    @mapping('in') public inverted: boolean = false;
    // is layer already added to the session
    public added: boolean = false;
    // is layer resizable
    public resizable: boolean = true;
    // modifiers
    public modifiers: TLayerModifiers = {};
    // actions
    public actions: TLayerActions = [];

    public editPoints: TLayerEditPoint[] = [];

    constructor(protected features?: TPlatformFeatures) {}

    // called when layer starts to edit
    abstract startEdit(mode: EditMode, point?: Point, editPoint?: TLayerEditPoint);
    // called when layer is editing
    abstract edit(point: Point, originalEvent?: MouseEvent);
    // called when layer stops to edit
    abstract stopEdit();
    // draw layer
    abstract draw();
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
     * On load state
     */
    protected onLoadState() {}

    /**
     * Clone this layer as new one
     * @returns copy of the layer
     */
    public clone(): typeof this {
        const cloned = new (this.constructor as any)();
        cloned.state = this.state;
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

    public pushHistory() {
        if (this.mode === EditMode.EMPTY) {
            return;
        }
        this.history.push({
            type: 'change',
            layer: this,
            state: this.state
        });
    }

    public getType() {
        return this.type;
    }
}
