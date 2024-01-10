import {AbstractImageLayer} from '../../core/layers/abstract-image.layer';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {PaintLayer} from '../../core/layers/paint.layer';
import {Point} from '../../core/point';
import {FlipperPlatform} from '../../platforms/flipper';
import {AbstractEditorPlugin} from '../plugins/abstract-editor.plugin';
import {PaintPlugin} from '../plugins/paint.plugin';
import {AbstractTool} from './abstract.tool';

export class PaintTool extends AbstractTool {
    name = 'paint';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new PaintLayer(session.getPlatformFeatures());
    }

    onStopEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent): void {
        // do nothing
    }

    onActivate(): void {
        const selected = this.editor.session.state.layers.filter((l) => l.selected);
        const selectedPaints = selected.filter((l) => l instanceof PaintLayer);
        // we need to deselect all layers except one PaintLayer
        selected.forEach((l) => (l.selected = false));
        if (selectedPaints.length) {
            const layer = selectedPaints[0];
            layer.selected = true;
            this.editor.state.activeLayer = layer;
        } else {
            const layer = this.createLayer();
            this.editor.session.addLayer(layer);
            layer.selected = true;
            this.editor.state.activeLayer = layer;
        }
        const paintPlugin = this.editor.plugins.find((p: AbstractEditorPlugin) => p instanceof PaintPlugin);
        if (paintPlugin) {
            paintPlugin.onClear();
        }
    }

    onDeactivate(): void {
        if (this.editor.state.activeLayer) {
            if (this.editor.state.activeLayer instanceof AbstractImageLayer) {
                const layer: AbstractImageLayer = this.editor.state.activeLayer;
                if (!layer.data) {
                    this.editor.session.removeLayer(layer);
                }
            } else {
                this.editor.state.activeLayer.stopEdit();
            }
            this.editor.state.activeLayer = null;
        }
    }
}
