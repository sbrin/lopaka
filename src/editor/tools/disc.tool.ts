import {AbstractLayer} from '../../core/layers/abstract.layer';
import {DiscLayer} from '../../core/layers/disc.layer';
import {AbstractTool} from './abstract.tool';

export class DiscTool extends AbstractTool {
    name = 'disc';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new DiscLayer(session.platforms[session.state.platform].features);
    }
}
