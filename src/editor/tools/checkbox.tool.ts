import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {CheckboxLayer} from '../../core/layers/checkbox.layer';
import {AbstractTool} from './abstract.tool';
import {Point} from '/src/core/point';
import {getFont} from '/src/draw/fonts';
import {LVGLPlatform} from '/src/platforms/lvgl';

export class CheckboxTool extends AbstractTool {
    name = 'checkbox';
    title = 'Checkbox';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        // Pick a default font consistent with other LVGL controls.
        const fonts = [...session.platforms[session.state.platform].getFonts(), ...session.state.customFonts];
        const defaultFont = fonts.find((font) => font.name === 'Montserrat');
        const lastFontName = session.editor.lastFontName;
        const selectedFont = fonts.find((font) => font.name === lastFontName) ?? defaultFont;
        this.editor.font = getFont(selectedFont?.name);
        // Instantiate the checkbox layer with platform features and renderer.
        const renderer = session.createRenderer();
        return new CheckboxLayer(session.getPlatformFeatures(), renderer, this.editor.font);
    }

    onActivate(): void {
        const {layersManager, state} = this.editor.session;
        // Create and place a new checkbox centered on the display.
        layersManager.clearSelection();
        const layer = this.createLayer() as CheckboxLayer;
        // Measure bounds with the default label to center the control.
        layer.updateBounds();
        this.editor.state.activeLayer = layer;
        this.editor.session.addLayer(this.editor.state.activeLayer as AbstractLayer);
        const position = new Point(
            (state.display.x - layer.bounds.w) / 2,
            (state.display.y - layer.bounds.h) / 2
        ).round();
        this.editor.state.activeLayer.startEdit(EditMode.CREATING, position);
        this.editor.state.activeLayer.stopEdit();
        layersManager.selectLayer(layer);
        this.editor.setTool(null);
        this.editor.session.virtualScreen.redraw();
    }

    isSupported(platform: string): boolean {
        return [LVGLPlatform.id].includes(platform);
    }

    getIcon(): string {
        return 'checkbox';
    }
}
