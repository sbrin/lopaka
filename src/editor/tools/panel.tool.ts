import {AbstractLayer} from '../../core/layers/abstract.layer';
import {PanelLayer} from '../../core/layers/panel.layer';
import {AbstractTool} from './abstract.tool';
import {Point} from '/src/core/point';
import {LVGLPlatform} from '/src/platforms/lvgl';

export class PanelTool extends AbstractTool {
    name = 'panel';
    title = 'Panel';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        const renderer = session.createRenderer();
        return new PanelLayer(session.getPlatformFeatures(), renderer);
    }

    onActivate(): void {
        const {layersManager, state} = this.editor.session;
        // Create a default-sized panel and compute its centered position.
        const layer = this.createLayer() as PanelLayer;
        const position = new Point((state.display.x - layer.size.x) / 2, (state.display.y - layer.size.y) / 2).round();
        // Clear selection so the new panel is focused.
        layersManager.clearSelection();
        // Apply the initial size and centered position.
        this.editor.state.activeLayer = layer;
        layer.position = position;
        layer.updateBounds();
        // Add and select the layer, then exit the tool.
        this.editor.session.addLayer(layer as AbstractLayer);
        layer.stopEdit();
        layersManager.selectLayer(layer);
        this.editor.setTool(null);
        this.editor.session.virtualScreen.redraw();
    }

    isSupported(platform: string): boolean {
        return [LVGLPlatform.id].includes(platform);
    }

    getIcon(): string {
        return 'rect';
    }
}
