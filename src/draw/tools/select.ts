import {toRefs} from 'vue';
import {Layer} from '../../core/layer';
import {Point} from '../../core/point';
import {Tool} from './tool';
import {Keys} from '../../core/keys.enum';

export class SelectTool extends Tool {
    name = 'select';
    isModifier = true;
    private originalPosition: Point = null;
    private originalSize: Point = null;
    private offset: Point = null;

    draw(layer: Layer): void {
        this.getTool(layer.type).draw(layer);
    }
    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone().subtract(this.offset);
        layer.bounds = this.getTool(layer.type).getBounds(layer);
        this.draw(layer);
    }
    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        // save original position and size to restore later if needed
        this.originalPosition = layer.position.clone();
        this.originalSize = layer.size.clone();
        // offset is for calculate position of the top left corner of layer
        this.offset = position.clone().subtract(layer.position);
    }
    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        this.getTool(layer.type).stopEdit(layer, position, originalEvent);
    }
    onKeyDown(event: KeyboardEvent): void {
        const {activeLayer, layers} = toRefs(this.session.state);
        if (activeLayer.value === null) return;
        switch (event.code) {
            case Keys.ESC:
                // reset selection
                activeLayer.value = null;
                break;
            case Keys.BACKSPACE:
            case Keys.DELETE:
                // remove layer
                layers.value = layers.value.filter((layer: Layer) => layer !== activeLayer.value);
                activeLayer.value = null;
                break;
            case Keys.UP:
                // move layer up
                activeLayer.value.position.add(0, -1);
                break;
            case Keys.DOWN:
                // move layer down
                activeLayer.value.position.add(0, 1);
                break;
            case Keys.LEFT:
                // move layer left
                activeLayer.value.position.add(-1, 0);
                break;
            case Keys.RIGHT:
                // move layer right
                activeLayer.value.position.add(1, 0);
                break;
        }
        activeLayer.value.bounds = this.getTool(activeLayer.value.type).getBounds(activeLayer.value);
        this.getTool(activeLayer.value.type).draw(activeLayer.value);
        this.session.virtualScreen.redraw();
    }
}
