import {AbstractLayer} from 'src/core/layers/abstract.layer';
import {RectangleLayer} from '../../core/layers/rectangle.layer';
import {AbstractTool} from './abstract.tool';

export class RectTool extends AbstractTool {
    name = 'rect';
    title = 'Rectangle';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new RectangleLayer(session.getPlatformFeatures());
    }
}
