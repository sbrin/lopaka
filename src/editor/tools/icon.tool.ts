import {AbstractLayer} from '../../core/layers/abstract.layer';
import {IconLayer} from '../../core/layers/icon.layer';
import {AbstractTool} from './abstract.tool';

export class IconTool extends AbstractTool {
    name = 'icon';
    createLayer(): AbstractLayer {
        const {session} = this.editor;
        const renderer = session.createRenderer();
        return new IconLayer(session.getPlatformFeatures(), renderer);
    }
}
