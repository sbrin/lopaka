import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {TextLayer} from '../../core/layers/text.layer';
import {Point} from '../../core/point';
import {getFont} from '../../draw/fonts';
import {AbstractTool} from './abstract.tool';

export class TextTool extends AbstractTool {
    name = 'string';
    createLayer(): AbstractLayer {
        const {session} = this.editor;

        const fonts = [...session.platforms[session.state.platform].getFonts(), ...session.state.customFonts];

        const lastFontName = session.editor.lastFontName;
        const selectedFont = lastFontName ? fonts.find((font) => font.name === lastFontName) || fonts[0] : fonts[0];
        this.editor.font = getFont(selectedFont.name);

        const renderer = session.createRenderer();
        return new TextLayer(session.getPlatformFeatures(), renderer, this.editor.font, session.state.platform);
    }
    onStopEdit(layer: TextLayer, position: Point, originalEvent: MouseEvent | TouchEvent): void {
        super.onStopEdit(layer, position, originalEvent);
        this.editor.font = layer.font;
    }
    onActivate(): void {
        const {layersManager, state} = this.editor.session;
        layersManager.clearSelection();
        let layer = this.createLayer();
        this.editor.state.activeLayer = layer;
        this.editor.session.addLayer(this.editor.state.activeLayer as AbstractLayer);
        
        layer.updateBounds();
        const bounds = layer.bounds;
        // Center the text bounds on the display.
        const position = new Point((state.display.x - bounds.w) / 2, (state.display.y + bounds.h) / 2).round();
        
        this.editor.state.activeLayer.startEdit(EditMode.CREATING, position);
        this.editor.state.activeLayer.stopEdit();
        layersManager.selectLayer(layer);
        this.editor.setTool(null);
        this.editor.session.virtualScreen.redraw();
    }
}
