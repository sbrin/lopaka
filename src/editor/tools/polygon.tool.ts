import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {PolygonLayer} from '../../core/layers/polygon.layer';
import {Point} from '../../core/point';
import {AbstractTool} from './abstract.tool';

export class PolygonTool extends AbstractTool {
    name: string = 'polygon';
    private creating: boolean = false;

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new PolygonLayer(session.getPlatformFeatures());
    }

    isMultiClick(): boolean {
        return true;
    }

    onStartEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        const poly = layer as PolygonLayer;
        if (this.creating) {
            poly.addPoint(position);
        } else {
            this.creating = true;
        }
    }

    onStopEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        const poly = layer as PolygonLayer;
        if (poly.points.length > 2) {
            poly.points.pop();
        }
        if (poly.points.length > 2) {
            poly.points.pop();
        }

        this.creating = false;
    }

    onActivate(): void {
        this.creating = false;
    }

    onDeactivate(): void {
        const {state} = this.editor;
        if (state.activeLayer instanceof PolygonLayer) {
            const poly = state.activeLayer as PolygonLayer;
            if (poly.points.length > 2) {
                poly.points.pop();
            }
            poly.stopEdit();
            poly.draw();
            poly.selected = true;
            state.activeLayer = null;
        }
        this.creating = false;
    }
}
