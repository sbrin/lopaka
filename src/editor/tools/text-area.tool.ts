import {AbstractLayer} from '../../core/layers/abstract.layer';
import {TextAreaLayer} from '../../core/layers/text-area.layer';
import {AbstractTool} from './abstract.tool';
import {Point} from '/src/core/point';
import {getFont} from '/src/draw/fonts';
import {LVGLPlatform} from '/src/platforms/lvgl';

export class TextAreaTool extends AbstractTool {
    name = 'textarea';
    title = 'Text Area';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        // Resolve the active font from the last used selection or platform defaults.
        const fonts = [...session.platforms[session.state.platform].getFonts(), ...session.state.customFonts];
        const lastFontName = session.editor.lastFontName;
        const selectedFont = lastFontName ? fonts.find((font) => font.name === lastFontName) || fonts[0] : fonts[0];
        this.editor.font = getFont(selectedFont.name);
        // Build the text area layer with the active renderer and font.
        const renderer = session.createRenderer();
        return new TextAreaLayer(session.getPlatformFeatures(), renderer, this.editor.font);
    }

    onActivate(): void {
        const {layersManager, state} = this.editor.session;
        // Create the text area layer and compute its centered position.
        const layer = this.createLayer() as TextAreaLayer;
        const position = new Point((state.display.x - layer.size.x) / 2, (state.display.y - layer.size.y) / 2).round();
        // Clear selection before adding the text area layer.
        layersManager.clearSelection();
        this.editor.state.activeLayer = layer;
        // Apply the initial position so bounds and hit testing are aligned.
        layer.position = position;
        layer.updateBounds();
        // Add the layer to the session after positioning it.
        this.editor.session.addLayer(this.editor.state.activeLayer as AbstractLayer);
        // Finalize selection and exit the tool.
        layer.stopEdit();
        layersManager.selectLayer(layer);
        this.editor.setTool(null);
        this.editor.session.virtualScreen.redraw();
    }

    isSupported(platform: string): boolean {
        return [LVGLPlatform.id].includes(platform);
    }

    getIcon(): string {
        return 'textarea';
    }
}
