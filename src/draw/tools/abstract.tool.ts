import {toRefs} from 'vue';
import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {Session} from '../../core/session';

export abstract class AbstractTool {
    // tool name
    protected name: string;
    // current editing layer
    public layer: AbstractLayer = null;

    isModifier = false; // deprecated

    protected startEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        layer.startEdit(EditMode.CREATING, position);
    }
    protected edit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        layer.edit(position, originalEvent);
    }
    protected stopEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        layer.stopEdit();
    }

    abstract createLayer(): AbstractLayer;

    constructor(protected session: Session) {}

    public isDrawing() {
        return this.layer && this.layer.isEditing();
    }

    onMouseDown(position: Point, originalEvent: MouseEvent): void {
        const {layers, display, scale} = this.session.state;
        // project position to the virtual screen
        position
            .divide(scale)
            .round()
            .boundTo(new Rect(0, 0, display.x, display.y));
        // create new layer
        this.layer = this.createLayer();
        if (!this.isModifier) {
            this.layer.index = layers.length + 1;
            this.layer.name = 'Layer ' + (layers.length + 1);
            this.session.addLayer(this.layer);
        }
        this.startEdit(this.layer, position.clone(), originalEvent);
        this.session.virtualScreen.redraw();
    }

    onMouseMove(position: Point, originalEvent: MouseEvent) {
        const {scale, display} = toRefs(this.session.state);
        position
            .divide(scale.value)
            .round()
            .boundTo(new Rect(0, 0, display.value.x, display.value.y));
        this.edit(this.layer, position.clone(), originalEvent);
        this.session.virtualScreen.redraw();
    }

    onMouseUp(position: Point, originalEvent: MouseEvent): void {
        this.stopEdit(this.layer, null, originalEvent);
        this.session.history.push({
            type: 'add',
            layer: this.layer,
            state: this.layer.getState()
        });
        this.layer = null;
    }

    onKeyDown(event: KeyboardEvent): void {}

    getName(): string {
        return this.name;
    }

    redraw(layer: AbstractLayer = this.layer) {
        if (layer) {
            layer.draw();
            this.session.virtualScreen.redraw();
        }
    }
}
