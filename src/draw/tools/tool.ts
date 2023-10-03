import {Layer} from '../../core/layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {Session} from '../../core/session';

export enum ToolParamType {
    'string',
    'number',
    'boolean',
    'font'
}

export type ToolParam = {
    name: string;
    type: ToolParamType;
    value?: any;
    setValue: (layer: Layer, value: any) => void;
    getValue: (layer: Layer) => any;
    onChange?: (value: any) => void;
};

export abstract class Tool {
    protected name: string;
    mousePos: Point;
    isDrawing: boolean;
    params: ToolParam[] = [];

    abstract startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void;
    abstract edit(layer: Layer, position: Point, originalEvent: MouseEvent): void;
    abstract stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void;

    constructor(protected session: Session) {}

    onMouseDown(position: Point, originalEvent: MouseEvent): void {
        this.isDrawing = true;
        const {platform, layers, display, scale, virtualScreen} = this.session;
        position
            .divide(scale)
            .round()
            .boundTo(new Rect(0, 0, display.x, display.y));

        const layer = new Layer(this.name, layers.length + 1);
        layer.name = 'Layer ' + (layers.length + 1);
        layer.position = position.clone();
        layer.edititng = true;
        layer.buffer.width = display.x;
        layer.buffer.height = display.y;
        // layer.ctx.scale(scale.x, scale.y);
        layer.dc.ctx.fillStyle = '#000';
        // layer.dc.ctx.translate(0.5, 0.5);
        layers.push(layer);
        this.session.activeLayer = layer;
        // }
        this.mousePos = position.clone();
        this.startEdit(layer, position.clone(), originalEvent);
        virtualScreen.redraw();
    }

    onMouseMove(position: Point, originalEvent: MouseEvent) {
        const {scale, display, activeLayer, virtualScreen} = this.session;
        position
            .divide(scale)
            .round()
            .boundTo(new Rect(0, 0, display.x, display.y));
        this.mousePos = position.clone();
        this.edit(activeLayer, position.clone(), originalEvent);
        virtualScreen.redraw();
    }

    onMouseUp(position: Point, originalEvent: MouseEvent): void {
        const {activeLayer} = this.session;
        this.isDrawing = false;
        this.stopEdit(activeLayer, this.mousePos.clone(), originalEvent);
    }

    getFont() {
        const fonts = this.session.platform.getFonts();
        return fonts[0];
    }

    getName(): string {
        return this.name;
    }

    getParams() {
        const {activeLayer} = this.session;
        return this.params.map((param: ToolParam) => {
            return {
                ...param,
                value: param.getValue(activeLayer),
                onChange: (value: any) => {
                    param.setValue(activeLayer, value);
                    this.redraw();
                }
            };
        });
    }

    redraw() {
        const {activeLayer} = this.session;
        if (activeLayer) {
            this.draw(activeLayer);
            this.session.virtualScreen.redraw();
        }
    }

    abstract draw(layer: Layer): void;
}
