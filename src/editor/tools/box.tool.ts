import {AbstractLayer} from 'src/core/layers/abstract.layer';
import {BoxLayer} from '../../core/layers/box.layer';
import {AbstractTool} from './abstract.tool';

export class BoxTool extends AbstractTool {
    name = 'box';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new BoxLayer(session.platforms[session.state.platform].features);
    }
}
