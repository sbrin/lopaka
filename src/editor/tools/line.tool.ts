import {AbstractLayer} from '../../core/layers/abstract.layer';
import {LineLayer} from '../../core/layers/line.layer';
import {AbstractTool} from './abstract.tool';

export class LineTool extends AbstractTool {
    name: string = 'line';

    createLayer(): AbstractLayer {
        const {session} = this.editor;
        return new LineLayer(session.platforms[session.state.platform].features);
    }
}
