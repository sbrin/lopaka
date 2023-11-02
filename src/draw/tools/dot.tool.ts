import {AbstractLayer} from '../../core/layers/abstract.layer';
import {DotLayer} from '../../core/layers/dot.layer';
import {AbstractTool} from './abstract.tool';

export class DotTool extends AbstractTool {
    name = 'dot';
    createLayer(): AbstractLayer {
        return new DotLayer();
    }
}
