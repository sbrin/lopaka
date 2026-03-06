import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {SliderLayer} from '../../core/layers/slider.layer';
import {AbstractTool} from './abstract.tool';
import { Point } from '/src/core/point';
import {LVGLPlatform} from '/src/platforms/lvgl';

export class SliderTool extends AbstractTool {
    name = 'slider';
    title = 'Slider';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        const renderer = session.createRenderer();
        return new SliderLayer(session.getPlatformFeatures(), renderer);
    }

    onActivate(): void {
        const {layersManager, state} = this.editor.session;
        layersManager.clearSelection();
        let layer: SliderLayer = this.createLayer() as SliderLayer;
        this.editor.state.activeLayer = layer;
        this.editor.session.addLayer(this.editor.state.activeLayer as AbstractLayer);
        // Center the default slider size on the display.
        const position = new Point((state.display.x - 100) / 2, (state.display.y - 10) / 2).round();
        this.editor.state.activeLayer.startEdit(EditMode.CREATING, position);
        this.editor.state.activeLayer.stopEdit();
        layersManager.selectLayer(layer);
        this.editor.setTool(null);
        this.editor.session.virtualScreen.redraw();
    }
    
    isSupported(platform: string): boolean {
        return [LVGLPlatform.id].includes(platform);
    }
}
