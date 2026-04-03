import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {ButtonLayer} from '../../core/layers/button.layer';
import {AbstractTool} from './abstract.tool';
import { Point } from '/src/core/point';
import {getFont} from '/src/draw/fonts';
import {LVGLPlatform} from '/src/platforms/lvgl';

export class ButtonTool extends AbstractTool {
    name = 'button';
    title = 'Button';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        const fonts = [...session.platforms[session.state.platform].getFonts(), ...session.state.customFonts];
        const defaultFont = fonts.find((font) => font.name === 'Montserrat');

        const lastFontName = session.editor.lastFontName;
        const selectedFont = fonts.find((font) => font.name === lastFontName) ?? defaultFont;
        this.editor.font = getFont(selectedFont.name);

        const renderer = session.createRenderer();
        return new ButtonLayer(session.getPlatformFeatures(), renderer, this.editor.font);
    }

    onActivate(): void {
        const {layersManager, state} = this.editor.session;
        layersManager.clearSelection();
        let layer: ButtonLayer = this.createLayer() as ButtonLayer;
        this.editor.state.activeLayer = layer;
        this.editor.session.addLayer(this.editor.state.activeLayer as AbstractLayer);
        // Center the default button size on the display.
        const position = new Point((state.display.x - layer.size.x) / 2, (state.display.y - layer.size.y) / 2).round();
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
