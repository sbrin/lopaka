import {AbstractLayer} from '../../core/layers/abstract.layer';
import {TextLayer} from '../../core/layers/text.layer';
import {Point} from '../../core/point';
import {getFont} from '../fonts';
import {Font} from '../fonts/font';
import {AbstractTool} from './abstract.tool';

export class TextTool extends AbstractTool {
    name = 'string';
    public lastFont: Font;
    createLayer(): AbstractLayer {
        if (!this.lastFont) {
            this.lastFont = getFont(this.session.platforms[this.session.state.platform].getFonts()[0].name);
        }
        return new TextLayer(this.lastFont);
    }
    protected stopEdit(layer: TextLayer, position: Point, originalEvent: MouseEvent): void {
        this.lastFont = layer.font;
        super.stopEdit(layer, position, originalEvent);
    }
}
