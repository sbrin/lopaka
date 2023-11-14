import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {PaintLayer} from '../../core/layers/paint.layer';
import {Point} from '../../core/point';
import {FlipperPlatform} from '../../platforms/flipper';
import {AbstractTool} from './abstract.tool';

export class PaintTool extends AbstractTool {
    name = 'paint';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new PaintLayer(session.getPlatformFeatures());
    }

    isSupported(platform: string): boolean {
        return platform !== FlipperPlatform.id;
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
        }
    }

    onDeactivate(): void {
        if (this.editor.state.activeLayer) {
            this.editor.state.activeLayer.stopEdit();
            this.editor.state.activeLayer = null;
        }
    }
}
