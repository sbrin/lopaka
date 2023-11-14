import {AbstractLayer} from '../../core/layers/abstract.layer';
import {TextLayer} from '../../core/layers/text.layer';
import {Point} from '../../core/point';
import {getFont} from '../../draw/fonts';
import {AbstractTool} from './abstract.tool';

export class TextTool extends AbstractTool {
    name = 'string';
    createLayer(): AbstractLayer {
        const {session} = this.editor;
        if (!this.editor.font) {
            this.editor.font = getFont(session.platforms[session.state.platform].getFonts()[0].name);
        }
        return new TextLayer(this.editor.font, session.getPlatformFeatures());
    }
    onStopEdit(layer: TextLayer, position: Point, originalEvent: MouseEvent): void {
        super.onStopEdit(layer, position, originalEvent);
        this.editor.font = layer.font;
    }
}
