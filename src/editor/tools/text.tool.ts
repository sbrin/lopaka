import {AbstractLayer} from '../../core/layers/abstract.layer';
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
        return new TextLayer(session.getPlatformFeatures(), this.editor.font);
    }
    onStopEdit(layer: TextLayer, position: Point, originalEvent: MouseEvent): void {
        super.onStopEdit(layer, position, originalEvent);
        this.editor.font = layer.font;
    }
}
