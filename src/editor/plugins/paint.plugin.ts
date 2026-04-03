import {Keys} from '/src/core/keys.enum';
import {EditMode} from '/src/core/layers/abstract.layer';
import {PaintLayer} from '/src/core/layers/paint.layer';
import {Point} from '/src/core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class PaintPlugin extends AbstractEditorPlugin {
    lastPoint: Point;
    captured: boolean = false;

    onMouseDown(point: Point, event: MouseEvent | TouchEvent): void {
        const {activeTool} = this.session.editor.state;
        if (activeTool?.getName() === 'paint') {
            this.captured = true;
            this.ensureActiveLayer();
            this.startEditing(point, event);
        }
    }

    private ensureActiveLayer(): void {
        if (!this.session.editor.state.activeLayer) {
            const {layersManager} = this.session;
            const selectedPaintLayers = layersManager.selected.filter((l) => l instanceof PaintLayer);
            if (selectedPaintLayers.length === 1) {
                this.session.editor.state.activeLayer = selectedPaintLayers[0];
            } else {
                const newLayer = this.session.editor.state.activeTool.createLayer();
                layersManager.selectLayer(newLayer);
                this.session.addLayer(newLayer);
                this.session.editor.state.activeLayer = newLayer;
            }
        }
    }

    private startEditing(point: Point, event: MouseEvent | TouchEvent): void {
        const layer = this.session.editor.state.activeLayer;
        layer.color = layer.modifiers.color
            ? layer.color
            : (this.session.editor.lastColor ?? this.session.state.brushColor);
        layer.startEdit(EditMode.CREATING, point, null, event);

        if (event.shiftKey && this.lastPoint) {
            layer.edit(this.lastPoint, event);
            layer.edit(point, event);
        } else {
            layer.edit(point.clone(), event);
        }
        this.lastPoint = point.clone().floor();
        this.session.virtualScreen.redraw();
    }

    onMouseMove(point: Point, event: MouseEvent | TouchEvent): void {
        const {activeLayer} = this.session.editor.state;
        if (this.captured) {
            activeLayer.edit(point.clone(), event);
            this.session.virtualScreen.redraw();
            this.lastPoint = point;
        }
    }

    onMouseUp(point: Point, event: MouseEvent | TouchEvent): void {
        const {activeLayer} = this.session.editor.state;
        if (this.captured) {
            activeLayer.stopEdit();
            this.captured = false;
            this.session.virtualScreen.redraw();
        }
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {activeTool} = this.session.editor.state;
        if (activeTool?.getName() === 'paint' && key === Keys.Escape) {
            this.captured = false;
            this.session.editor.setTool(null);
            this.session.virtualScreen.redraw();
        }
    }

    onMouseDoubleClick(point, event): void {
        const {layersManager} = this.session;
        const hovered = layersManager.contains(point).reverse();
        if (hovered.length) {
            const upperLayer = hovered[0];
            if (upperLayer instanceof PaintLayer) {
                this.session.editor.state.activeLayer = upperLayer;
                this.session.editor.setTool('paint');
            }
        }
    }

    onClear(): void {
        this.lastPoint = null;
    }
}
