import {toRefs} from 'vue';
import {Layer} from '../../core/layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {Session} from '../../core/session';

export enum ToolParamType {
    'string',
    'number',
    'boolean',
    'font',
    'image'
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
    isModifier = false;
    templateLayer: Layer;

    abstract startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void;
    abstract edit(layer: Layer, position: Point, originalEvent: MouseEvent): void;
    abstract stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void;

    constructor(protected session: Session) {}

    initLayer(): Layer {
        const {display, activeLayer} = toRefs(this.session.state);
        const layer = new Layer(this.name, -1);
        layer.edititng = true;
        layer.buffer.width = display.value.x;
        layer.buffer.height = display.value.y;
        layer.dc.ctx.fillStyle = '#000';
        layer.dc.ctx.strokeStyle = '#000';
        return layer;
    }

    onMouseDown(position: Point, originalEvent: MouseEvent): void {
        this.isDrawing = true;
        const {layers, display, scale, activeLayer} = toRefs(this.session.state);
        position
            .divide(scale.value)
            .round()
            .boundTo(new Rect(0, 0, display.value.x, display.value.y));
        if (!this.isModifier) {
            if (!activeLayer.value) {
                activeLayer.value = this.initLayer();
            }
            if (activeLayer.value.isStub()) {
                activeLayer.value.index = layers.value.length + 1;
                activeLayer.value.name = 'Layer ' + (layers.value.length + 1);
                layers.value = [activeLayer.value, ...layers.value];
            }
        }
        this.startEdit(activeLayer.value, position.clone(), originalEvent);
        this.mousePos = position.clone();
        this.session.virtualScreen.redraw();
    }

    onMouseMove(position: Point, originalEvent: MouseEvent) {
        const {scale, display, activeLayer} = toRefs(this.session.state);
        position
            .divide(scale.value)
            .round()
            .boundTo(new Rect(0, 0, display.value.x, display.value.y));
        this.edit(activeLayer.value, position.clone(), originalEvent);
        this.mousePos = position.clone();
        this.session.virtualScreen.redraw();
    }

    onMouseUp(position: Point, originalEvent: MouseEvent): void {
        const {activeLayer} = toRefs(this.session.state);
        this.isDrawing = false;
        this.stopEdit(activeLayer.value, this.mousePos.clone(), originalEvent);
        this.mousePos = null;
        activeLayer.value.edititng = false;
    }

    onKeyDown(event: KeyboardEvent): void {}

    getBounds(layer: Layer): Rect {
        return new Rect(layer.position, layer.size);
    }

    protected getTool(name: string) {
        return this.session.tools[name];
    }

    getName(): string {
        return this.name;
    }

    getParams() {
        const {activeLayer} = toRefs(this.session.state);
        const tool = this.session.tools[activeLayer.value.type];
        return tool.params.map((param: ToolParam) => {
            return {
                ...param,
                value: param.getValue(activeLayer.value),
                onChange: (value: any) => {
                    param.setValue(activeLayer.value, value);
                    activeLayer.value.bounds = tool.getBounds(activeLayer.value);
                    if (!activeLayer.value.isStub()) {
                        tool.redraw();
                    }
                }
            };
        });
    }

    checkIntersectionWithPath(position: Point): boolean {
        const {activeLayer, scale} = toRefs(this.session.state);
        const point = position.clone().divide(scale.value);
        if (activeLayer) {
            return activeLayer.value.dc.ctx.isPointInPath(point.x, point.y);
        }
        return false;
    }

    checkIntersection(position: Point): boolean {
        const {activeLayer} = toRefs(this.session.state);
        if (activeLayer) {
            return this.getBounds(activeLayer.value).contains(position);
        }
        return false;
    }

    redraw() {
        const {activeLayer} = toRefs(this.session.state);
        if (activeLayer) {
            this.draw(activeLayer.value).then(() => {
                this.session.virtualScreen.redraw();
            });
        }
    }

    abstract draw(layer: Layer): Promise<void>;
}
