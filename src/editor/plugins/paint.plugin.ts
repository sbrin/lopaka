import {EditMode} from '../../core/layers/abstract.layer';
import {PaintLayer} from '../../core/layers/paint.layer';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class PaintPlugin extends AbstractEditorPlugin {
    lastPoint: Point;
    captured: boolean = false;

    onMouseDown(point: Point, event: MouseEvent): void {
        const {activeTool, activeLayer} = this.session.editor.state;
        if (activeTool && activeTool.getName() === 'paint') {
            this.captured = true;
            if (!activeLayer) {
                const selected = this.session.state.layers.filter((l) => l.selected && l instanceof PaintLayer);
                if (selected.length == 1) {
                    this.session.editor.state.activeLayer = selected[0];
                } else {
                    const layer = (this.session.editor.state.activeLayer = activeTool.createLayer());
                    layer.selected = true;
                    this.session.addLayer(layer);
                    this.session.editor.state.activeLayer = layer;
                }
            }
            const layer = this.session.editor.state.activeLayer;
            layer.startEdit(EditMode.CREATING, point);
            if (event.shiftKey) {
                if (this.lastPoint) {
                    layer.edit(this.lastPoint, event);
                    layer.edit(point, event);
                }
            } else {
                layer.edit(point.clone(), event);
            }
        }
        this.lastPoint = point.clone().floor();
        this.session.virtualScreen.redraw();
    }

    onMouseMove(point: Point, event: MouseEvent): void {
        const {activeLayer} = this.session.editor.state;
        if (this.captured) {
            activeLayer.edit(point.clone(), event);
            this.session.virtualScreen.redraw();
            this.lastPoint = point;
        }
    }

    onMouseUp(point: Point, event: MouseEvent): void {
        const {activeLayer} = this.session.editor.state;
        if (this.captured) {
            activeLayer.stopEdit();
            this.captured = false;
            this.session.virtualScreen.redraw();
        }
    }

    onClear(): void {
        this.lastPoint = null;
    }
}
