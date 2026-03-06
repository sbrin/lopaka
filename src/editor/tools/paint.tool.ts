import {AbstractImageLayer} from '../../core/layers/abstract-image.layer';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {PaintLayer} from '../../core/layers/paint.layer';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from '../plugins/abstract-editor.plugin';
import {PaintPlugin} from '../plugins/paint.plugin';
import {AbstractTool} from './abstract.tool';
import { LVGLPlatform } from '/src/platforms/lvgl';

export class PaintTool extends AbstractTool {
    name = 'paint';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        const features = session.getPlatformFeatures();
        const colorMode = session.state.paintColorMode ?? 'monochrome';
        const renderer = session.createRenderer();
        const layer = new PaintLayer(features, renderer, colorMode);
        if (colorMode === 'monochrome') {
            layer.setColorMode('monochrome', this.editor.lastColor ?? session.state.brushColor);
        }
        return layer;
    }

    onStopEdit(layer: AbstractLayer, position: Point, originalEvent: MouseEvent | TouchEvent): void {
        // do nothing
    }

    onActivate(): void {
        const selected = this.editor.session.layersManager.selected;
        const selectedPaints = selected.filter((l) => l instanceof PaintLayer);
        const {layersManager} = this.editor.session;
        // we need to deselect all layers except one PaintLayer
        selected.forEach((l) => layersManager.unselectLayer(l));
        let layer: PaintLayer;
        if (selectedPaints.length) {
            layer = selectedPaints[0] as PaintLayer;
            this.editor.session.layersManager.selectLayer(layer);
            if (layer.color) {
                this.editor.session.state.brushColor = layer.color;
            }
        } else {
            layer = this.createLayer() as PaintLayer;
            this.editor.session.addLayer(layer);
            layersManager.selectLayer(layer);
        }
        this.editor.state.activeLayer = layer;
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
                    this.editor.session.layersManager.removeLayer(layer);
                }
            } else {
                this.editor.state.activeLayer.stopEdit();
            }
            this.editor.state.activeLayer = null;
        }
    }
}
