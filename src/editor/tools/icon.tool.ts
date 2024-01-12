import {AbstractLayer} from '../../core/layers/abstract.layer';
import {PaintLayer} from '../../core/layers/paint.layer';
import {AbstractTool} from './abstract.tool';

export class IconTool extends AbstractTool {
    name = 'icon';
    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new PaintLayer(session.getPlatformFeatures());
    }
}
